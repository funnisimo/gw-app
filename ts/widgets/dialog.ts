// import * as GWU from 'gw-utils/dist';
import * as TextUtils from "gw-utils/text/index.js";
import * as Buffer from "gw-canvas/buffer.js";

import * as Text from "./text.js";
import * as Widget from "../app/widget.js";
import { BorderType } from "./datatable.js";
import { drawBorder } from "./border.js";
import * as Style from "../app/style.js";

export type PadInfo =
  | boolean
  | number
  | [number]
  | [number, number]
  | [number, number, number, number];

export interface DialogOptions extends Widget.WidgetOpts {
  width: number;
  height: number;

  border?: BorderType;
  pad?: PadInfo;

  legend?: string;
  legendTag?: string;
  legendClass?: string;
  legendAlign?: TextUtils.Align;
}

export function toPadArray(pad: PadInfo): [number, number, number, number] {
  if (!pad) return [0, 0, 0, 0];
  if (pad === true) {
    return [1, 1, 1, 1];
  } else if (typeof pad === "number") {
    return [pad, pad, pad, pad];
  } else if (pad.length == 1) {
    const p = pad[0];
    return [p, p, p, p];
  } else if (pad.length == 2) {
    const [pv, ph] = pad;
    return [pv, ph, pv, ph];
  }
  throw new Error("Invalid pad: " + pad);
}

Style.defaultStyle.add("dialog", {
  bg: "darkest_gray",
  fg: "light_gray",
});

export class Dialog extends Widget.Widget {
  static default = {
    tag: "dialog",
    border: "none" as BorderType,
    pad: false,

    legendTag: "legend",
    legendClass: "",
    legendAlign: "left" as TextUtils.Align,
  };

  legend: Widget.Widget | null = null;

  constructor(opts: DialogOptions) {
    super(
      (() => {
        opts.tag = opts.tag || Dialog.default.tag;
        return opts;
      })()
    );
    let border = opts.border || Dialog.default.border;
    this.attr("border", border);

    const pad = toPadArray(opts.pad || Dialog.default.pad);
    this.attr("padTop", pad[0]);
    this.attr("padRight", pad[1]);
    this.attr("padBottom", pad[2]);
    this.attr("padLeft", pad[3]);

    if (border !== "none") {
      for (let i = 0; i < 4; ++i) {
        pad[i] += 1;
      }
    }

    this._adjustBounds(pad);

    this.attr("legendTag", opts.legendTag || Dialog.default.legendTag);
    this.attr(
      "legendClass",
      opts.legendClass || opts.class || Dialog.default.legendClass
    );
    this.attr("legendAlign", opts.legendAlign || Dialog.default.legendAlign);

    this._addLegend(opts);
  }

  _adjustBounds(pad: [number, number, number, number]): this {
    // adjust w,h,x,y for border/pad
    this.bounds.width += pad[1] + pad[3];
    this.bounds.height += pad[0] + pad[2];
    this.bounds.x -= pad[3];
    this.bounds.y -= pad[0];

    return this;
  }

  get _innerLeft(): number {
    const border = this._attrStr("border");
    const padLeft = this._attrInt("padLeft");
    return this.bounds.x + padLeft + (border === "none" ? 0 : 1);
  }

  get _innerWidth(): number {
    const border = this._attrStr("border");
    const padSize = this._attrInt("padLeft") + this._attrInt("padRight");
    return this.bounds.width - padSize - (border === "none" ? 0 : 2);
  }

  get _innerTop(): number {
    const border = this._attrStr("border");
    const padTop = this._attrInt("padTop");
    return this.bounds.y + padTop + (border === "none" ? 0 : 1);
  }

  get _innerHeight(): number {
    const border = this._attrStr("border");
    const padSize = this._attrInt("padTop") + this._attrInt("padBottom");
    return this.bounds.height - padSize - (border === "none" ? 0 : 2);
  }

  _addLegend(opts: DialogOptions): this {
    if (!opts.legend) {
      if (this._attrStr("border") === "none") {
        this.bounds.height = 0;
      }
      return this;
    }

    const border = this._attrStr("border") !== "none";
    const textWidth = TextUtils.length(opts.legend);
    const width = this.bounds.width - (border ? 4 : 0);
    const align = this._attrStr("legendAlign");
    let x = this.bounds.x + (border ? 2 : 0);
    if (align === "center") {
      x += Math.floor((width - textWidth) / 2);
    } else if (align === "right") {
      x += width - textWidth;
    }

    this.legend = new Text.Text({
      parent: this,
      text: opts.legend,
      x,
      y: this.bounds.y,
      // depth: this.depth + 1,
      tag: this._attrStr("legendTag"),
      class: this._attrStr("legendClass"),
    });
    // if (this.bounds.width < this.legend.bounds.width + 4) {
    //     this.bounds.width = this.legend.bounds.width + 4;
    // }

    // this.bounds.height +=
    //     this._attrInt('padTop') + this._attrInt('padBottom');

    this.bounds.height = Math.max(1, this.bounds.height);
    return this;
  }

  _draw(buffer: Buffer.Buffer): boolean {
    super._draw(buffer);

    const border = this._attrStr("border");
    if (border === "none") return false;

    drawBorder(
      buffer,
      this.bounds.x,
      this.bounds.y,
      this.bounds.width,
      this.bounds.height,
      this._used,
      border === "ascii"
    );
    return true;
  }
}

// extend WidgetLayer

export type AddDialogOptions = DialogOptions &
  Widget.UpdatePosOpts & { parent?: Widget.Widget };

export function dialog(opts: AddDialogOptions): Dialog {
  const widget = new Dialog(opts);
  return widget;
}
