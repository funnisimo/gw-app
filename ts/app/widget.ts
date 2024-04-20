import * as UTILS from "gw-utils/utils.js";
import * as XY from "gw-utils/xy.js";
import * as BUFFER from "gw-canvas/buffer.js";
import * as TEXT from "gw-utils/text/index.js";
// import * as Tween from '../tween.js';
import * as IO from "../app/io.js";
import * as EVENTS from "../app/events.js";
import * as STYLE from "./style.js";

import { Scene } from "../app/scene.js";

export type DataValue = any;
export type DataObject = Record<string, DataValue>;
export type DataItem = DataValue | DataValue[] | DataObject;
export type DataType = DataItem[] | DataObject;

// return true if you want to stop the event from propagating
export type EventCb = (
  name: string,
  widget: Widget | null,
  args?: any
) => boolean | any;

export interface UpdatePosOpts {
  x?: number;
  y?: number;

  left?: number;
  right?: number;
  top?: number;
  bottom?: number;

  center?: boolean;
  centerX?: boolean;
  centerY?: boolean;
}

export interface SetParentOptions extends UpdatePosOpts {
  first?: boolean;
  last?: boolean;
  before?: string | Widget;
  after?: string | Widget;

  focused?: boolean;
}

export interface WidgetOpts extends STYLE.StyleOptions, SetParentOptions {
  tag?: string;
  id?: string;
  data?: DataType;

  parent?: Widget | null;
  scene?: Scene | null;

  width?: number;
  height?: number;
  class?: string;
  tabStop?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  action?: string | boolean;

  create?: EVENTS.CallbackFn;
  input?: EVENTS.CallbackFn;
  update?: EVENTS.CallbackFn;
  draw?: EVENTS.CallbackFn;
  destroy?: EVENTS.CallbackFn;

  keypress?: EVENTS.CallbackFn;
  mouseenter?: EVENTS.CallbackFn;
  mousemove?: EVENTS.CallbackFn;
  mouseleave?: EVENTS.CallbackFn;
  click?: EVENTS.CallbackFn;

  on?: Record<string, EVENTS.CallbackFn>;
}

export type PropType = string | number | boolean;

// Widget
export class Widget {
  // tag = 'widget';
  // id = '';
  parent: Widget | null = null;
  scene: Scene | null = null;
  children: Widget[] = [];
  bounds: XY.Bounds;
  events = new EVENTS.Events(this);

  _style = new STYLE.Style();
  _used!: STYLE.ComputedStyle;

  _data: DataType = {};

  classes: string[] = [];
  _props: Record<string, PropType> = {
    needsDraw: true,
    needsStyle: true,
    hover: false,
  };
  _attrs: Record<string, PropType> = {};

  constructor(opts: WidgetOpts = {}) {
    if (opts.id) this.attr("id", opts.id);
    this.attr("tag", opts.tag || "widget");
    this.bounds = new XY.Bounds(opts);

    this._style.set(opts);
    // opts.tag && (this.tag = opts.tag);

    if (opts.class) {
      this.classes = opts.class.split(/ +/g).map((c) => c.trim());
    }
    if (opts.tabStop) {
      this.prop("tabStop", true);
    }
    if (opts.disabled) {
      this.prop("disabled", true);
    }
    if (opts.hidden) {
      this.hidden = true;
    }
    if (opts.data) {
      this._data = opts.data; // call set data yourself
    }

    opts.action = opts.action || opts.id;
    if (opts.action) {
      if (opts.action === true) {
        if (!opts.id) throw new Error("boolean action requires id.");
        opts.action = opts.id;
      }
      this.attr("action", opts.action);
    }

    [
      "create",
      "input",
      "update",
      "draw",
      "destroy",
      "keypress",
      "mouseenter",
      "mousemove",
      "mouseleave",
      "click",
    ].forEach((n) => {
      if (n in opts) {
        this.on(n, opts[n as keyof WidgetOpts] as EVENTS.CallbackFn);
      }
    });
    if (opts.on) {
      Object.entries(opts.on).forEach(([ev, fn]) => this.on(ev, fn));
    }

    if (opts.parent) {
      this.setParent(opts.parent, opts);
    } else if (opts.scene) {
      opts.scene.addChild(this, opts);
    }
  }

  get needsDraw() {
    return this.scene ? this.scene.needsDraw : false;
  }
  set needsDraw(v: boolean) {
    if (!v) return;
    this.scene && (this.scene.needsDraw = v);
  }

  get tag() {
    return this._attrStr("tag");
  }
  get id() {
    return this._attrStr("id");
  }

  // DATA
  data(): DataType;
  data(all: DataType): this;
  data(key: string): any;
  data(key: string, value: any): this;
  data(...args: any[]): this | DataType | DataValue {
    if (args.length == 0) {
      return this._data;
    }
    if (args.length == 2) {
      this._setDataItem(args[0], args[1]);
      this.needsDraw = true;
      return this;
    }
    if (typeof args[0] === "string") {
      if (Array.isArray(this._data)) {
        throw new Error("Cannot access fields of array data.");
      }
      return this._data[args[0]];
    }
    this._setData(args[0]);
    this.needsDraw = true;
    return this;
  }

  _setData(v: Record<string, any> | any[]) {
    this._data = v;
  }
  _setDataItem(key: string, v: any) {
    if (Array.isArray(this._data)) {
      throw new Error("Cannot set field in array data.");
    }
    this._data[key] = v;
  }

  // BOUNDS

  pos(): XY.XY;
  pos(xy: XY.XY): this;
  pos(x: number, y: number): this;
  pos(x?: number | XY.XY, y?: number): this | XY.XY {
    if (x === undefined) return this.bounds;

    if (typeof x === "number") {
      this.bounds.x = x;
      this.bounds.y = y || 0;
    } else {
      this.bounds.x = x.x;
      this.bounds.y = x.y;
    }
    this.needsDraw = true;

    return this;
  }

  updatePos(opts: UpdatePosOpts) {
    if (!this.parent && !this.scene) return;

    if (opts.centerX || opts.center) {
      this.centerX();
    } else if (opts.left) {
      this.left(opts.left);
    } else if (opts.right) {
      this.right(opts.right);
    } else if (opts.x) {
      this.bounds.x = opts.x;
    }

    if (opts.centerY || opts.center) {
      this.centerY();
    } else if (opts.top) {
      this.top(opts.top);
    } else if (opts.bottom) {
      this.bottom(opts.bottom);
    } else if (opts.y) {
      this.bounds.y = opts.y;
    }
  }

  contains(e: XY.XY): boolean;
  contains(x: number, y: number): boolean;
  contains(...args: any[]): boolean {
    if (this.hidden) return false;
    if (this.bounds.contains(args[0], args[1])) return true;
    return this.children.some((c) => c.contains(args[0], args[1]));
  }

  center(bounds?: XY.Bounds): this {
    return this.centerX(bounds).centerY(bounds);
  }

  centerX(bounds?: XY.Bounds): this {
    const dims = bounds || (this.parent ? this.parent.bounds : this.scene);
    if (!dims) throw new Error("Need parent or scene to apply center.");
    if ("x" in dims) {
      const w = this.bounds.width;
      const mid = Math.round((dims.width - w) / 2);
      this.bounds.x = dims.x + mid;
    } else {
      this.bounds.x = Math.round((dims.width - this.bounds.width) / 2);
    }
    return this;
  }

  centerY(bounds?: XY.Bounds): this {
    const dims = bounds || (this.parent ? this.parent.bounds : this.scene);
    if (!dims) throw new Error("Need parent or scene to apply center.");
    if ("y" in dims) {
      const h = this.bounds.height;
      const mid = Math.round((dims.height - h) / 2);
      this.bounds.y = dims.y + mid;
    } else {
      this.bounds.y = Math.round((dims.height - this.bounds.height) / 2);
    }
    return this;
  }

  left(n: number): this {
    const x = this.parent ? this.parent.bounds.left : 0;
    this.bounds.left = x + n;
    return this;
  }

  right(n: number): this {
    if (this.parent) {
      this.bounds.right = this.parent.bounds.right + n;
    } else if (this.scene) {
      this.bounds.right = this.scene.width + n - 1;
    } else {
      this.bounds.left = 0;
    }
    return this;
  }

  top(n: number): this {
    const y = this.parent ? this.parent.bounds.top : 0;
    this.bounds.top = y + n;
    return this;
  }

  bottom(n: number): this {
    if (this.parent) {
      this.bounds.bottom = this.parent.bounds.bottom + n - 1;
    } else if (this.scene) {
      this.bounds.bottom = this.scene.height + n - 1;
    } else {
      this.bounds.top = 0;
    }
    return this;
  }

  resize(w: number, h: number): this {
    this.bounds.width = w || this.bounds.width;
    this.bounds.height = h || this.bounds.height;
    this.needsDraw = true;
    return this;
  }

  // STYLE

  style(): STYLE.Style;
  style(opts: STYLE.StyleOptions): this;
  style(name: keyof STYLE.StyleOptions): any;
  style(name: keyof STYLE.StyleOptions, value: any): this;
  style(...args: any[]): this | STYLE.Style | any {
    if (args.length == 0) return this._style;

    if (typeof args[0] !== "string") {
      this._style.set(args[0]);
    } else {
      if (args[1] === undefined) {
        const source = this._used || this._style;
        return source.get(args[0] as keyof STYLE.Style);
      }

      this._style.set(args[0] as keyof STYLE.StyleOptions, args[1]);
    }

    this.needsStyle = true;
    return this;
  }

  addClass(c: string): this {
    const all = c.split(/ +/g);
    all.forEach((a) => {
      if (this.classes.includes(a)) return;
      this.classes.push(a);
    });
    return this;
  }

  removeClass(c: string): this {
    const all = c.split(/ +/g);
    all.forEach((a) => {
      UTILS.arrayDelete(this.classes, a);
    });
    return this;
  }

  hasClass(c: string): boolean {
    const all = c.split(/ +/g);
    return UTILS.arrayIncludesAll(this.classes, all);
  }

  toggleClass(c: string): this {
    const all = c.split(/ +/g);
    all.forEach((a) => {
      if (this.classes.includes(a)) {
        UTILS.arrayDelete(this.classes, a);
      } else {
        this.classes.push(a);
      }
    });
    return this;
  }

  // get opacity(): number {
  //     let opacity = 100;
  //     let current: W | null = this;
  //     while (current) {
  //         if (current._used) {
  //             opacity = Math.min(opacity, current._used.opacity); // TODO - opacity = Math.floor(opacity * current._used.opacity / 100);
  //         }
  //         current = current.parent;
  //     }
  //     return opacity;
  // }

  // set opacity(v: number) {
  //     this.style('opacity', v);
  //     this.needsDraw = true;
  //     this.hidden = this._used.opacity == 0;
  // }

  // ATTRIBUTES

  attr(name: string): PropType;
  attr(name: string, v: PropType): this;
  attr(name: string, v?: PropType): PropType | this {
    if (v === undefined) return this._attrs[name];
    this._attrs[name] = v;
    return this;
  }

  _attrInt(name: string): number {
    const n = this._attrs[name] || 0;
    if (typeof n === "number") return n;
    if (typeof n === "string") return Number.parseInt(n);
    return n ? 1 : 0;
  }

  _attrStr(name: string): string {
    const n = this._attrs[name] || "";
    if (typeof n === "string") return n;
    if (typeof n === "number") return "" + n;
    return n ? "true" : "false";
  }

  _attrBool(name: string): boolean {
    return !!this._attrs[name];
  }

  text(): string;
  text(v: string): this;
  text(v?: string): this | string {
    if (v === undefined) return this._attrStr("text");
    this.attr("text", v);
    return this;
  }

  // PROPS

  prop(name: string): PropType | undefined;
  prop(name: string, v: PropType): this;
  prop(name: string, v?: PropType): this | PropType | undefined {
    if (v === undefined) return this._props[name];
    const current = this._props[name];
    if (current !== v) {
      this._setProp(name, v);
    }
    return this;
  }

  _setProp(name: string, v: PropType): void {
    // console.log(`${this.tag}.${name}=${v} (was:${this._props[name]})`);
    this._props[name] = v;
    this.needsStyle = true;
  }

  _propInt(name: string): number {
    const n = this._props[name] || 0;
    if (typeof n === "number") return n;
    if (typeof n === "string") return Number.parseInt(n);
    return n ? 1 : 0;
  }

  _propStr(name: string): string {
    const n = this._props[name] || "";
    if (typeof n === "string") return n;
    if (typeof n === "number") return "" + n;
    return n ? "true" : "false";
  }

  _propBool(name: string): boolean {
    return !!this._props[name];
  }

  toggleProp(name: string): this {
    const current = !!this._props[name];
    this.prop(name, !current);
    return this;
  }

  incProp(name: string, n = 1): this {
    let current = this.prop(name) || 0;
    if (typeof current === "boolean") {
      current = current ? 1 : 0;
    } else if (typeof current === "string") {
      current = Number.parseInt(current) || 0;
    }
    current += n;
    this.prop(name, current);
    return this;
  }
  get hovered(): boolean {
    return !!this.prop("hover");
  }
  set hovered(v: boolean) {
    this.prop("hover", v);
  }

  get disabled(): boolean {
    let current: Widget | null = this;
    while (current) {
      if (current.prop("disabled")) return true;
      current = current.parent;
    }
    return false;
  }
  set disabled(v: boolean) {
    this.prop("disabled", v);
  }

  get hidden(): boolean {
    let current: Widget | null = this;
    while (current) {
      if (current.prop("hidden")) return true;
      current = current.parent;
    }
    return false;
  }
  set hidden(v: boolean) {
    this.prop("hidden", v);
    if (!v && this._used && this._used.opacity == 0) {
      this._used.opacity = 100;
    }

    if (v && this.scene && this.scene.focused === this) {
      this.scene.nextTabStop();
    } else if (!v && this.scene && this.scene.focused === null) {
      this.scene.setFocusWidget(this);
    }

    this.emit(v ? "hide" : "show");
  }

  get needsStyle(): boolean {
    return this._propBool("needsStyle");
  }
  set needsStyle(v: boolean) {
    this._props.needsStyle = v;
    if (v) {
      this.needsDraw = true; // changed style or state
    }
  }

  get focused(): boolean {
    return !!this.prop("focus");
  }

  focus(reverse = false): void {
    if (this.prop("focus")) return;

    this.prop("focus", true);
    this.emit("focus", { reverse });
  }

  blur(reverse = false): void {
    if (!this.prop("focus")) return;
    this.prop("focus", false);
    this.emit("blur", { reverse });
  }

  // CHILDREN

  setParent(parent: Widget | null, opts?: SetParentOptions) {
    if (this.parent === parent) return;

    // remove from curent parent
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index < 0) throw new Error("Error in parent/child setup!");
      this.parent.children.splice(index, 1);
    }

    if (parent) {
      if (this.scene !== parent.scene) {
        if (this.scene) {
          this.scene._detach(this);
        }
        if (parent.scene) {
          parent.scene._attach(this);
        }
        if (opts && opts.focused) {
          this.scene!.setFocusWidget(this);
        }
      }

      if (opts && opts.first) {
        parent.children.unshift(this);
      } else if (opts && opts.before) {
        let index = -1;
        if (typeof opts.before === "string") {
          index = parent.children.findIndex((c) => c.id === opts.before);
        } else {
          index = parent.children.indexOf(opts.before);
        }

        if (index < 0) {
          parent.children.unshift(this);
        } else {
          parent.children.splice(index, 0, this);
        }
      } else if (opts && opts.after) {
        let index = -1;
        if (typeof opts.after === "string") {
          index = parent.children.findIndex((c) => c.id === opts.before);
        } else {
          index = parent.children.indexOf(opts.after);
        }

        if (index < 0) {
          parent.children.push(this);
        } else {
          parent.children.splice(index + 1, 0, this);
        }
      } else {
        parent.children.push(this);
      }
      this.parent = parent;
    } else {
      this.scene && this.scene._detach(this);
      this.parent = null;
    }

    if (opts && (this.parent || this.scene)) {
      this.updatePos(opts);
    }
  }

  addChild(child: Widget) {
    if (this.children.includes(child)) return;
    child.setParent(this);
  }

  removeChild(child: Widget) {
    if (!this.children.includes(child)) return;
    child.setParent(null);
  }

  childAt(xy: XY.XY): Widget | null;
  childAt(xy: number, y: number): Widget | null;
  childAt(xy: XY.XY | number, y?: number): Widget | null {
    if (!XY.isXY(xy)) {
      xy = { x: xy, y: y! };
    }
    // if (!this.contains(xy)) return null;

    for (let child of this.children) {
      if (child.contains(xy)) return child;
    }
    return null;
  }

  getChild(id: string): Widget | null {
    return this.children.find((c) => c.id === id) || null;
  }

  // EVENTS

  on(ev: string | string[], cb: EVENTS.CallbackFn): EVENTS.CancelFn {
    if (ev === "keypress") {
      this.prop("tabStop", true);
    }
    return this.events.on(ev, cb);
  }
  once(ev: string | string[], cb: EVENTS.CallbackFn): EVENTS.CancelFn {
    if (ev === "keypress") {
      this.prop("tabStop", true);
    }
    return this.events.once(ev, cb);
  }
  off(ev: string | string[], cb: EVENTS.CallbackFn): void {
    this.events.off(ev, cb);
    // cannot turn off keypress automatically because
    // we could be waiting for dispatched events - e.g. 'Enter', or 'dir', ...
  }
  emit(ev: string | string[], ...args: any[]) {
    return this.events.emit(ev, ...args);
  }
  action(ev?: IO.Event) {
    if (ev && ev.defaultPrevented) return;
    if (this.emit("action")) {
      ev?.stopPropagation();
    }

    const action = this._attrStr("action");
    if (!action || !action.length) return;
    if (this.scene && this.scene.emit(action, this)) {
      ev?.stopPropagation();
    }
  }

  // FRAME

  input(e: IO.Event) {
    this.emit("input", e);
    if (e.defaultPrevented || e.propagationStopped) return;

    if (e.type === IO.KEYPRESS) {
      this.keypress(e);
    } else if (e.type === IO.MOUSEMOVE) {
      this.mousemove(e);
    } else if (e.type === IO.CLICK) {
      this.click(e);
    }
  }

  _mouseenter(e: IO.Event): void {
    if (!this.bounds.contains(e)) return;
    if (this.hovered) return;
    this.hovered = true;
    this.emit("mouseenter", e);
    // if (this._parent) {
    //     this._parent._mouseenter(e);
    // }
  }

  mousemove(e: IO.Event): void {
    for (let child of this.children) {
      child.mousemove(e);
    }

    if (this.bounds.contains(e) && !this.hidden) {
      //  && !e.defaultPrevented
      this._mouseenter(e);
      this._mousemove(e);
      // e.preventDefault();
    } else {
      this._mouseleave(e);
    }
  }

  _mousemove(e: IO.Event): void {
    this.emit("mousemove", e);
  }

  _mouseleave(e: IO.Event): void {
    if (!this.hovered) return;
    if (this.bounds.contains(e)) return;
    this.hovered = false;
    this.emit("mouseleave", e);
    // if (this._parent) {
    //     this._parent.mouseleave(e);
    // }
  }

  click(e: IO.Event): void {
    if (this.disabled || this.hidden) return;

    e.target = this;

    const c = this.childAt(e);
    if (c) {
      c.click(e);
    }

    if (!this.bounds.contains(e)) return;
    if (e.propagationStopped) return;
    this._click(e);

    if (!e.defaultPrevented) {
      this.action(e);
    }
  }

  _click(e: IO.Event) {
    this.events.emit("click", e);
  }

  // keypress bubbles
  keypress(e: IO.Event): void {
    if (this.hidden || this.disabled) return;
    let current: Widget | null = this;
    while (current && !e.propagationStopped) {
      e.dispatch(current.events);
      current = current.parent;
    }
  }

  draw(buffer: BUFFER.Buffer) {
    if (this.needsStyle && this.scene) {
      this._used = this.scene.styles.computeFor(this);
      this.needsStyle = false;
    }

    if (this.hidden) return;

    this._draw(buffer);
    this.emit("draw", buffer);

    this.children.forEach((c) => c.draw(buffer));
  }

  _draw(buffer: BUFFER.Buffer) {
    this._drawFill(buffer);
  }

  _drawFill(buffer: BUFFER.Buffer) {
    const b = this.bounds;
    buffer.fillRect(
      b.x,
      b.y,
      b.width,
      b.height,
      " ",
      this._used.bg,
      this._used.bg
    );
  }

  update(dt: number) {
    this.emit("update", dt);
  }

  fixedUpdate(dt: number) {
    this.emit("fixedUpdate", dt);
  }

  destroy() {
    if (this.parent) {
      this.setParent(null);
    }
    if (this.scene) {
      this.scene._detach(this);
    }
    this.children.forEach((c) => c.destroy());
    this.children = [];

    // @ts-ignore;
    this._used = null;
  }
}

export function alignChildren(widget: Widget, align: TEXT.Align = "left") {
  if (widget.children.length < 2) return;
  if (align === "left") {
    const left = widget.children.reduce(
      (out, c) => Math.min(out, c.bounds.left),
      999
    );
    widget.children.forEach((c) => (c.bounds.left = left));
  } else if (align === "right") {
    const right = widget.children.reduce(
      (out, c) => Math.max(out, c.bounds.right),
      0
    );
    widget.children.forEach((c) => (c.bounds.right = right));
  } else {
    // center
    const right = widget.children.reduce(
      (out, c) => Math.max(out, c.bounds.right),
      0
    );
    const left = widget.children.reduce(
      (out, c) => Math.min(out, c.bounds.left),
      999
    );
    const center = left + Math.floor((right - left) / 2);
    widget.children.forEach((c) => {
      c.bounds.center = center;
    });
  }
}

export function spaceChildren(widget: Widget, space = 0) {
  if (widget.children.length < 2) return;

  let y = widget.children.reduce((out, c) => Math.min(out, c.bounds.top), 999);

  widget.children
    .slice()
    .sort((a, b) => a.bounds.top - b.bounds.top)
    .forEach((c) => {
      c.bounds.top = y;
      y = c.bounds.bottom + space;
    });
}

export function wrapChildren(widget: Widget, pad = 0) {
  if (widget.children.length < 1) return;

  widget.bounds.copy(widget.children[0].bounds);
  widget.children.forEach((c) => {
    widget.bounds.expandToInclude(c.bounds);
  });

  widget.bounds.pad(pad);
}
