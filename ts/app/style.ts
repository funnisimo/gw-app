import * as Color from "gw-canvas/color.js";
import * as Text from "gw-utils/text/index.js";
import * as Utils from "gw-utils/utils.js";

import { UISelectable } from "./selector.js";
import { Selector } from "./selector.js";

export interface UIStyle {
  readonly selector: Selector;
  dirty: boolean;

  readonly fg?: Color.ColorBase;
  readonly bg?: Color.ColorBase;
  readonly align?: Text.Align;
  readonly valign?: Text.VAlign;
  readonly opacity?: number;

  get(key: keyof UIStyle): any;
  set(key: keyof UIStyle, value: any): this;
  set(values: StyleOptions): this;
  unset(key: keyof UIStyle): this;
}

export interface StyleOptions {
  fg?: Color.ColorBase;
  bg?: Color.ColorBase;
  align?: Text.Align;
  valign?: Text.VAlign;
}

export interface UIStylable extends UISelectable {
  style(): UIStyle;
}

export type StyleType = string | StyleOptions;

export interface StyleOptions {
  fg?: Color.ColorBase;
  bg?: Color.ColorBase;
  align?: Text.Align;
  valign?: Text.VAlign;
  opacity?: number;
}

// static - size/pos automatic (ignore TRBL)
// relative - size automatic, pos = automatic + TRBL
// fixed - size = self, pos = TRBL vs root
// absolute - size = self, pos = TRBL vs positioned parent (fixed, absolute)

// export interface Stylable {
//     tag: string;
//     classes: string[];

//     attr(name: string): string | undefined;
//     prop(name: string): PropType | undefined;
//     parent: UIWidget | null;
//     children?: UIWidget[];

//     style(): Style;
// }

// export interface StyleOptions {
//     fg?: Color.ColorBase;
//     bg?: Color.ColorBase;
//     // depth?: number;

//     align?: Text.Align;
//     valign?: Text.VAlign;

//     // minWidth?: number;
//     // maxWidth?: number;
//     // width?: number;

//     // minHeight?: number;
//     // maxHeight?: number;
//     // height?: number;

//     // left?: number;
//     // right?: number;

//     // top?: number;
//     // bottom?: number;

//     // //        all,     [t+b, l+r],        [t, r+l,b],               [t, r, b, l]
//     // padding?:
//     //     | number
//     //     | [number]
//     //     | [number, number]
//     //     | [number, number, number]
//     //     | [number, number, number, number];
//     // padLeft?: number;
//     // padRight?: number;
//     // padTop?: number;
//     // padBottom?: number;

//     // //        all,     [t+b, l+r],        [t, l+r, b],               [t, r, b, l]
//     // margin?:
//     //     | number
//     //     | [number]
//     //     | [number, number]
//     //     | [number, number, number]
//     //     | [number, number, number, number];
//     // marginLeft?: number;
//     // marginRight?: number;
//     // marginTop?: number;
//     // marginBottom?: number;

//     // border?: Color.ColorBase;
// }

export class Style implements UIStyle {
  _fg?: Color.ColorBase;
  _bg?: Color.ColorBase;
  _border?: Color.ColorBase;
  //  _depth?: number;

  _align?: Text.Align;
  _valign?: Text.VAlign;

  _opacity?: number;

  selector: Selector;
  protected _dirty = false;

  constructor(selector = "$", init?: StyleOptions) {
    this.selector = new Selector(selector);
    if (init) {
      this.set(init);
    }
    this._dirty = false;
  }

  get dirty(): boolean {
    return this._dirty;
  }
  set dirty(v: boolean) {
    this._dirty = v;
  }

  get fg(): Color.ColorBase | undefined {
    return this._fg;
  }
  get bg(): Color.ColorBase | undefined {
    return this._bg;
  }

  get opacity(): number | undefined {
    return this._opacity;
  }

  dim(pct = 25, fg = true, bg = false): this {
    if (fg) {
      this._fg = Color.from(this._fg).darken(pct);
    }
    if (bg) {
      this._bg = Color.from(this._bg).darken(pct);
    }
    return this;
  }

  bright(pct = 25, fg = true, bg = false): this {
    if (fg) {
      this._fg = Color.from(this._fg).lighten(pct);
    }
    if (bg) {
      this._bg = Color.from(this._bg).lighten(pct);
    }
    return this;
  }

  invert(): this {
    [this._fg, this._bg] = [this._bg, this._fg];
    return this;
  }

  get align(): Text.Align | undefined {
    return this._align;
  }
  get valign(): Text.VAlign | undefined {
    return this._valign;
  }

  get(key: keyof Style): any {
    const id = ("_" + key) as keyof this;
    return this[id];
  }

  set(opts: StyleOptions, setDirty?: boolean): this;
  set(key: keyof StyleOptions, value: any, setDirty?: boolean): this;
  set(
    key: keyof StyleOptions | StyleOptions | Style,
    value?: any,
    setDirty = true
  ): this {
    if (typeof key === "string") {
      const field = "_" + key;
      if (typeof value === "string") {
        if (value.match(/^[+-]?\d+$/)) {
          value = Number.parseInt(value);
        } else if (value === "true") {
          value = true;
        } else if (value === "false") {
          value = false;
        }
      }
      this[field as keyof this] = value;
      // }
    } else if (key instanceof Style) {
      setDirty = value || value === undefined ? true : false;
      Object.entries(key).forEach(([name, value]) => {
        if (name === "selector" || name === "_dirty") return;
        if (value !== undefined && value !== null) {
          this[name as keyof this] = value;
        } else if (value === null) {
          this.unset(name as keyof Style);
        }
      });
    } else {
      setDirty = value || value === undefined ? true : false;
      Object.entries(key).forEach(([name, value]) => {
        if (value === null) {
          this.unset(name as keyof Style);
        } else {
          this.set(name as keyof StyleOptions, value, setDirty);
        }
      });
    }

    this.dirty ||= setDirty;
    return this;
  }

  unset(key: keyof Style): this {
    const field = key.startsWith("_") ? key : "_" + key;
    delete this[field as keyof this];
    this.dirty = true;
    return this;
  }

  clone(): this {
    const other = new (<new () => this>this.constructor)();
    other.copy(this);
    return other;
  }

  copy(other: Style): this {
    Object.assign(this, other);
    return this;
  }
}

export function makeStyle(style: string, selector = "$"): Style {
  const opts: StyleOptions = {};

  const parts = style
    .trim()
    .split(";")
    .map((p) => p.trim());
  parts.forEach((p) => {
    const [name, base] = p.split(":").map((p) => p.trim());
    if (!name) return;
    const baseParts = base.split(/ +/g);
    if (baseParts.length == 1) {
      // @ts-ignore
      opts[name] = base;
    } else {
      // @ts-ignore
      opts[name] = baseParts;
    }
  });

  return new Style(selector, opts);
}

// const NO_BOUNDS = ['fg', 'bg', 'depth', 'align', 'valign'];

// export function affectsBounds(key: keyof StyleOptions): boolean {
//     return !NO_BOUNDS.includes(key);
// }

export class ComputedStyle extends Style {
  // obj: Stylable;
  sources: UIStyle[] = [];
  // _opacity = 100;
  _baseFg: Color.Color | null = null;
  _baseBg: Color.Color | null = null;

  // constructor(source: Stylable, sources?: Style[]) {
  constructor(sources?: UIStyle[]) {
    super();
    // this.obj = source;
    if (sources) {
      // sort low to high priority (highest should be this.obj._style, lowest = global default:'*')
      sources.sort((a, b) => a.selector.priority - b.selector.priority);
      this.sources = sources;
    }

    this.sources.forEach((s) => super.set(s));
    // this.opacity = opacity;
    this._dirty = false; // As far as I know I reflect all of the current source values.
  }

  get opacity() {
    return this._opacity ?? 100;
  }
  set opacity(v: number) {
    v = Utils.clamp(v, 0, 100);
    this._opacity = v;
    if (v === 100) {
      this._fg = this._baseFg || this._fg;
      this._bg = this._baseBg || this._bg;
      return;
    }

    if (this._fg !== undefined) {
      this._baseFg = this._baseFg || Color.from(this._fg);
      this._fg = this._baseFg.alpha(v);
    }
    if (this._bg !== undefined) {
      this._baseBg = this._baseBg || Color.from(this._bg);
      this._bg = this._baseBg.alpha(v);
    }
  }

  get dirty(): boolean {
    return this._dirty || this.sources.some((s) => s.dirty);
  }
  set dirty(v: boolean) {
    this._dirty = v;
  }
}

export class Sheet {
  rules: UIStyle[] = [];
  _parent: Sheet | null;
  _dirty = true;

  constructor(parentSheet?: Sheet | null) {
    // if (parentSheet === undefined) {
    //     parentSheet = defaultStyle;
    // }
    // if (parentSheet) {
    //     this.rules = parentSheet.rules.slice();
    // }
    this._parent = parentSheet || null;
  }

  get dirty(): boolean {
    return this._dirty;
  }
  set dirty(v: boolean) {
    this._dirty = v;
    if (!this._dirty) {
      this.rules.forEach((r) => (r.dirty = false));
    }
  }

  setParent(sheet: Sheet | null) {
    this._parent = sheet;
  }

  add(selector: string, props: StyleOptions): this {
    if (selector.includes(",")) {
      selector
        .split(",")
        .map((p) => p.trim())
        .forEach((p) => this.add(p, props));
      return this;
    }

    if (selector.includes(" "))
      throw new Error("Hierarchical selectors not supported.");
    // if 2 '.' - Error('Only single class rules supported.')
    // if '&' - Error('Not supported.')

    let rule: UIStyle = new Style(selector, props);
    // const existing = this.rules.findIndex(
    //     (s) => s.selector.text === rule.selector.text
    // );

    // if (existing > -1) {
    //     // TODO - Should this delete the rule and add the new one at the end?
    //     const current = this.rules[existing];
    //     current.set(rule);
    //     rule = current;
    // } else {
    this.rules.push(rule);
    // }
    // rulesChanged = true;
    this.dirty = true;
    return this;
  }

  get(selector: string): UIStyle | null {
    return this.rules.find((s) => s.selector.text === selector) || null;
  }

  load(styles: Record<string, StyleOptions>): this {
    Object.entries(styles).forEach(([selector, props]) => {
      this.add(selector, props);
    });
    return this;
  }

  remove(selector: string): void {
    const existing = this.rules.findIndex((s) => s.selector.text === selector);

    if (existing > -1) {
      this.rules.splice(existing, 1);
      this.dirty = true;
    }
  }

  _rulesFor(widget: UIStylable): UIStyle[] {
    let rules = this.rules.filter((r) => r.selector.matches(widget));
    if (this._parent) {
      rules = this._parent._rulesFor(widget).concat(rules);
    }
    return rules;
  }

  computeFor(widget: UIStylable): ComputedStyle {
    const sources = this._rulesFor(widget);
    const widgetStyle = widget.style();
    if (widgetStyle) {
      sources.push(widgetStyle);
      widgetStyle.dirty = false;
    }
    return new ComputedStyle(sources);
  }
}

export const defaultStyle = new Sheet(null);

defaultStyle.add("*", { fg: "white" });
