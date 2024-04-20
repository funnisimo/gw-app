import * as UTILS from "gw-utils/utils.js";
import * as COLOR from "gw-canvas/color.js";
import * as XY from "gw-utils/xy.js";
import * as TWEEN from "../tween.js";

import * as EVENTS from "./events.js";
import * as TIMERS from "./timers.js";
import * as IO from "../app/io.js";
import { App } from "./app.js";
// import * as CANVAS from '../canvas.js';
import { Tweens } from "./tweens.js";
import * as BUFFER from "gw-canvas/buffer.js";
import * as STYLE from "./style.js";
import { Widget, UpdatePosOpts } from "./widget.js";
import { isPlainObject, mergeDeep } from "gw-utils/object.js";

// TODO - this: Event, scene: Scene, ...args: any[]) => void;
export type SceneCallback = (this: Scene) => void;
export type SceneCreateCb = (this: Scene, opts: SceneCreateOpts) => void;
export type SceneDataCb = (this: Scene, data: any) => void;
export type SceneStartCb = (this: Scene, opts: any) => void;
export type ScenePauseCb = (this: Scene, opts: SceneResumeOpts) => void;
export type SceneUpdateCb = (this: Scene, dt: number) => void;
export type SceneBufferCb = (this: Scene, buffer: BUFFER.Buffer) => void;
export type SceneEventCb = (this: Scene, event: IO.Event) => void;
export type SceneAnyCb = (this: Scene, ...args: any[]) => void;

// TODO - add => (..., opts: SceneCreateOpts )?
export type SceneMakeFn = (id: string, app: App) => Scene;

export interface SceneCreateOpts {
  bg?: COLOR.ColorBase;

  data?: Record<string, any>;
  styles?: STYLE.Sheet;

  make?: SceneMakeFn;

  // add/remove from scene manager (app)
  create?: SceneCreateCb;
  destroy?: SceneDataCb;

  // start/stop?
  start?: SceneStartCb;
  stop?: SceneDataCb;

  pause?: ScenePauseCb;
  resume?: ScenePauseCb;

  // run in this order each frame
  frameStart?: SceneCallback;
  input?: SceneEventCb;
  update?: SceneUpdateCb;
  fixedUpdate?: SceneUpdateCb;
  draw?: SceneBufferCb;
  frameDebug?: SceneBufferCb;
  frameEnd?: SceneBufferCb;

  click?: SceneEventCb;
  keypress?: SceneEventCb;
  mousemove?: SceneEventCb;

  // other event handlers
  on?: Record<string, SceneAnyCb>;
}

// This data is specific to your scene - have fun with it
export interface SceneStartOpts {
  [key: string]: any;
}

export interface SceneResumeOpts {
  timers?: boolean;
  tweens?: boolean;
  update?: boolean;
  draw?: boolean;
  input?: boolean;
}
export interface ScenePauseOpts extends SceneResumeOpts {
  duration?: number;
}

export interface SceneObj {
  update(dt: number): void;
  draw(buffer: BUFFER.Buffer): void;
  destroy(): void;

  emit(ev: string, ...args: any[]): void;
}

// Scene
export class Scene {
  id: string;
  app: App;

  events = new EVENTS.Events(this);
  tweens = new Tweens();
  timers = new TIMERS.Timers(this);
  buffer: BUFFER.Buffer;

  all: Widget[] = [];
  children: Widget[] = [];
  focused: Widget | null = null;

  dt = 0;
  time = 0;
  realTime = 0;
  skipTime = false;

  stopped = true;
  paused: SceneResumeOpts = {};
  debug = false;

  _needsDraw = true;
  styles: STYLE.Sheet;

  bg: COLOR.Color = COLOR.BLACK;
  data: Record<string, any> = {};

  constructor(id: string, app: App) {
    this.id = id;
    this.styles = new STYLE.Sheet();
    this.app = app;
    this.buffer = new BUFFER.Buffer(app.width, app.height);
    this.styles.setParent(app.styles);
  }

  get needsDraw(): boolean {
    return this._needsDraw;
  }

  set needsDraw(val: boolean) {
    if (val) {
      this._needsDraw = true;
    }
  }

  get width() {
    return this.buffer.width;
  }

  get height() {
    return this.buffer.height;
  }

  isActive() {
    return !this.stopped;
  }
  isPaused() {
    return this.isPaused;
  }
  isSleeping() {
    return this.isSleeping;
  }

  // GENERAL
  _create(opts: SceneCreateOpts = {}) {
    opts.bg && (this.bg = COLOR.from(opts.bg));

    if (opts.data) {
      if (isPlainObject(opts.data)) {
        this.data = mergeDeep(this.data, opts.data);
      } else {
        throw new Error("SceneCreateOpts 'data' field must be plain object.");
      }
    }

    if (opts.on) {
      Object.entries(opts.on).forEach(([ev, fn]) => {
        this.on(ev, fn);
      });
    }
    Object.entries(opts).forEach(([ev, fn]) => {
      if (typeof fn !== "function") return;
      this.on(ev, fn);
    });

    this.emit("create", opts);
  }

  // TODO - Who calls destroy
  destroy(data?: any) {
    this.emit("destroy", data);
    this.all.forEach((c) => c.destroy());
    this.children = [];
    this.all = [];
    this.timers.clear();
    this.tweens.clear();
  }

  switchTo(opts: SceneStartOpts = {}): this {
    this.app.scenes._switchTo(this, opts); // start me
    return this;
  }

  _start(opts: SceneStartOpts = {}) {
    this.stopped = false;
    // this.timers.restart();
    // this.events.restart();
    // this.tweens.clear();
    this.buffer.nullify();
    this.needsDraw = true;
    this.events.emit("start", opts); // this will start this one in the app.scenes obj
  }

  show(data: SceneStartOpts = {}): this {
    this.app.scenes.pause(); // TODO - do not pause draw if we are not full screen!!
    this._start(data);
    this.once("stop", () => this.app.scenes.resume());
    return this;
  }

  stop(data?: any) {
    this.stopped = true;
    this.events.emit("stop", data);
  }

  pause(opts?: ScenePauseOpts): void {
    opts = opts || {
      timers: true,
      tweens: true,
      update: true,
      input: true,
      draw: true,
    };
    Object.assign(this.paused, opts);
    this.events.emit("pause", opts);
  }

  resume(opts?: SceneResumeOpts) {
    opts = opts || {
      timers: true,
      tweens: true,
      update: true,
      input: true,
      draw: true,
    };
    Object.entries(opts).forEach(([key, value]) => {
      if (value === true) {
        this.paused[key as keyof SceneResumeOpts] = false;
      }
    });
    this.needsDraw = true;
    this.events.emit("resume", opts);
  }

  // FRAME STEPS

  frameStart() {
    this.events.emit("frameStart");
  }

  input(e: IO.Event) {
    if (this.paused.input || this.stopped) return;

    this.emit("input", e);
    if (e.defaultPrevented || e.propagationStopped) return;

    if (e.type === IO.KEYPRESS) {
      // TODO - check a flag that enables auto tabs
      let w = this.focused;
      if (w && (w.hidden || w.disabled)) {
        this.nextTabStop();
        w = this.focused;
      }
      w && w.keypress(e);

      if (w && !e.defaultPrevented) {
        if (e.key === "Tab") {
          if (this.nextTabStop()) {
            e.stopPropagation(); // should we do this?
          }
        } else if (e.key === "TAB") {
          if (this.prevTabStop()) {
            e.stopPropagation(); // should we do this?
          }
        }
      }
    } else if (e.type === IO.MOUSEMOVE) {
      this.children.forEach((c) => c.mousemove(e));
    } else {
      // click
      const c = this.childAt(e);
      if (c) {
        c.click(e);
        if (c.prop("tabStop") && !e.defaultPrevented) {
          this.setFocusWidget(c);
        }
      }
    }
    if (e.propagationStopped || e.defaultPrevented) return;
    e.dispatch(this.events);
    // If you are silent on this event then it stops here.
    // To propagate it to a parent scene call: ev.propagate()
    if (
      e.propagationStopped === undefined &&
      e.defaultPrevented === undefined
    ) {
      e.stopPropagation();
    }
  }

  update(dt: number) {
    if (this.stopped) return;

    if (!this.paused.timers) this.timers.update(dt);
    if (!this.paused.tweens) this.tweens.update(dt);
    if (!this.paused.update) {
      this.events.emit("update", dt);
      this.all.forEach((c) => c.update(dt));
    }
  }

  fixed_update(dt: number) {
    if (this.stopped) return;

    if (!this.paused.update) {
      this.events.emit("fixedUpdate", dt);
      this.all.forEach((c) => c.fixedUpdate(dt));
    }
  }

  draw(buffer: BUFFER.Buffer) {
    if (this.stopped) return;
    if (!this.paused.draw && this.needsDraw) {
      this._draw(this.buffer);
      this.emit("draw", this.buffer);
      this.children.forEach((c) => c.draw(this.buffer));
      this._needsDraw = false; // Bybass getter to ensure we change it (this is the only place that should really set it to false)
    }
    // if (this.buffer.changed) {
    buffer.apply(this.buffer);
    this.buffer.changed = false;
    // }
  }

  _draw(buffer: BUFFER.Buffer) {
    buffer.fill(this.bg);
  }

  frameDebug(buffer: BUFFER.Buffer) {
    this.events.emit("frameDebug", buffer);
  }
  frameEnd(buffer: BUFFER.Buffer) {
    this.events.emit("frameEnd", buffer);
  }

  // ANIMATION

  fadeIn(widget: Widget, ms: number): this {
    return this.fadeTo(widget, 100, ms);
  }

  fadeOut(widget: Widget, ms: number): this {
    return this.fadeTo(widget, 0, ms);
  }

  fadeTo(widget: Widget, opacity: number, ms: number): this {
    const tween = TWEEN.make({ pct: widget.style("opacity") })
      .to({ pct: opacity })
      .duration(ms)
      .onUpdate((info) => {
        widget.style("opacity", info.pct);
      });
    this.tweens.add(tween);

    return this;
  }

  fadeToggle(widget: Widget, ms: number): this {
    return this.fadeTo(widget, widget._used.opacity ? 0 : 100, ms);
  }

  slideIn(
    widget: Widget,
    x: number,
    y: number,
    from: "left" | "top" | "right" | "bottom",
    ms: number
  ): this {
    let start = { x, y };
    if (from === "left") {
      start.x = -widget.bounds.width;
    } else if (from === "right") {
      start.x = this.width + widget.bounds.width;
    } else if (from === "top") {
      start.y = -widget.bounds.height;
    } else if (from === "bottom") {
      start.y = this.height + widget.bounds.height;
    }

    return this.slide(widget, start, { x, y }, ms);
  }

  slideOut(
    widget: Widget,
    dir: "left" | "top" | "right" | "bottom",
    ms: number
  ): this {
    let dest = { x: widget.bounds.x, y: widget.bounds.y };
    if (dir === "left") {
      dest.x = -widget.bounds.width;
    } else if (dir === "right") {
      dest.x = this.width + widget.bounds.width;
    } else if (dir === "top") {
      dest.y = -widget.bounds.height;
    } else if (dir === "bottom") {
      dest.y = this.height + widget.bounds.height;
    }

    return this.slide(widget, widget.bounds, dest, ms);
  }

  slide(
    widget: Widget,
    from: XY.XY | XY.Loc,
    to: XY.XY | XY.Loc,
    ms: number
  ): this {
    const tween = TWEEN.make({ x: XY.x(from), y: XY.y(from) })
      .to({ x: XY.x(to), y: XY.y(to) })
      .duration(ms)
      .onUpdate((info) => {
        widget.pos(info.x, info.y);
      });
    this.tweens.add(tween);

    return this;
  }

  // async fadeTo(
  //     color: COLOR.ColorBase = 'black',
  //     duration = 1000
  // ): Promise<void> {
  //     return new Promise<void>((resolve) => {
  //         color = COLOR.from(color);

  //         this.pause();
  //         const buffer = this.buffer.clone();

  //         let pct = 0;
  //         let elapsed = 0;

  //         this.app.repeat(32, () => {
  //             elapsed += 32;
  //             pct = Math.floor((100 * elapsed) / duration);

  //             this.buffer.copy(buffer);
  //             this.buffer.mix(color, pct);

  //             if (elapsed >= duration) {
  //                 this.resume();
  //                 resolve();
  //                 return false; // end timer
  //             }
  //         });
  //     });
  // }

  // CHILDREN

  get(id: string): Widget | null {
    return this.all.find((c) => c.id === id) || null;
  }

  _attach(widget: Widget) {
    if (this.all.includes(widget)) return;
    if (widget.scene) throw new Error("Widget on another scene!");

    this.all.push(widget);
    widget.scene = this;
    widget.children.forEach((c) => this._attach(c));

    if (
      widget.prop("tabStop") &&
      !this.focused &&
      !widget.hidden &&
      !widget.disabled
    ) {
      this.setFocusWidget(widget);
    }
  }

  _detach(widget: Widget) {
    const index = this.all.indexOf(widget);
    if (index < 0) return;

    this.all.splice(index, 1);
    widget.scene = null;
    widget.children.forEach((c) => this._detach(c));
  }

  addChild(child: Widget, opts?: UpdatePosOpts & { focused?: boolean }) {
    if (this.children.includes(child)) return;
    child.setParent(null);
    this.children.push(child);
    this._attach(child);
    if (opts) {
      child.updatePos(opts);
      if (opts.focused) {
        this.setFocusWidget(child);
      }
    }
  }

  removeChild(child: Widget) {
    const index = this.children.indexOf(child);
    if (index < 0) return;
    this.children.splice(index, 1);
    child.setParent(null);
    this._detach(child);
  }

  childAt(xy: XY.XY | number, y?: number): Widget | null {
    let x = 0;
    if (typeof xy === "number") {
      x = xy;
      y = y || 0;
    } else {
      x = xy.x;
      y = xy.y;
    }

    return (
      UTILS.arrayFindRight(this.children, (c) => c.contains(x, y!)) || null
    );
  }

  widgetAt(xy: XY.XY | number, y?: number): Widget | null {
    let x = 0;
    if (typeof xy === "number") {
      x = xy;
      y = y || 0;
    } else {
      x = xy.x;
      y = xy.y;
    }

    return UTILS.arrayFindRight(this.all, (c) => c.contains(x, y!)) || null;
  }

  // FOCUS

  setFocusWidget(w: Widget | null, reverse = false) {
    if (w === this.focused) return;

    const was = this.focused;
    const want = w;

    this.focused = null;
    was && was.blur(reverse);

    if (this.focused === null) {
      this.focused = want;
      want && want.focus(reverse);
    }
  }

  /** Returns true if the focus changed */
  nextTabStop(): boolean {
    if (!this.focused) {
      this.setFocusWidget(
        this.all.find((w) => !!w.prop("tabStop") && !w.disabled && !w.hidden) ||
          null
      );
      return !!this.focused;
    }

    const next = UTILS.arrayNext(
      this.all,
      this.focused,
      (w) => !!w.prop("tabStop") && !w.disabled && !w.hidden
    );
    if (next) {
      this.setFocusWidget(next);
      return true;
    }
    this.setFocusWidget(null);
    return false;
  }

  /** Returns true if the focus changed */
  prevTabStop(): boolean {
    if (!this.focused) {
      this.setFocusWidget(
        this.all.find((w) => !!w.prop("tabStop") && !w.disabled && !w.hidden) ||
          null
      );
      return !!this.focused;
    }

    const prev = UTILS.arrayPrev(
      this.all,
      this.focused,
      (w) => !!w.prop("tabStop") && !w.disabled && !w.hidden
    );
    if (prev) {
      this.setFocusWidget(prev, true);
      return true;
    }
    this.setFocusWidget(null, true);
    return false;
  }

  // EVENTS
  on(cfg: EVENTS.CallbackObj): EVENTS.CancelFn;
  on(ev: string | string[], cb: EVENTS.CallbackFn): EVENTS.CancelFn;
  on(...args: any[]): EVENTS.CancelFn {
    if (args.length === 1) {
      return this.events.on(args[0]);
    }
    return this.events.on(args[0], args[1]);
  }
  once(ev: string, cb: EVENTS.CallbackFn): EVENTS.CancelFn {
    return this.events.once(ev, cb);
  }
  emit(ev: string | string[], ...args: any[]): boolean {
    return this.events.emit(ev, ...args);
  }

  // TIMERS

  wait(delay: number, fn: TIMERS.TimerFn): EVENTS.CancelFn;
  wait(delay: number, fn: string, ctx?: Record<string, any>): EVENTS.CancelFn;
  wait(
    delay: number,
    fn: TIMERS.TimerFn | string,
    ctx?: Record<string, any>
  ): EVENTS.CancelFn {
    if (typeof fn === "string") {
      const ev = fn;
      ctx = ctx || {};
      fn = () => this.emit(ev, ctx!);
    }
    return this.timers.setTimeout(fn, delay);
  }

  repeat(delay: number, fn: TIMERS.TimerFn): EVENTS.CancelFn;
  repeat(delay: number, fn: string, ...args: any[]): EVENTS.CancelFn;
  repeat(
    delay: number,
    fn: TIMERS.TimerFn | string,
    ...args: any[]
  ): EVENTS.CancelFn {
    if (typeof fn === "string") {
      const ev = fn;
      fn = () => this.emit(ev, ...args);
    }
    return this.timers.setInterval(fn, delay);
  }
}
