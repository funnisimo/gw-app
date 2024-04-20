// import * as GWU from 'gw-utils/dist';
import * as TEXT from "gw-utils/text/index.js";
import * as Buffer from "gw-canvas/buffer.js";

import { Widget, WidgetOpts } from "../app/widget.js";

export interface TextOptions extends WidgetOpts {
  text?: string;
}

export class Text extends Widget {
  _text = "";
  _lines: string[] = [];
  _fixedWidth = false;
  _fixedHeight = false;

  constructor(opts: TextOptions) {
    super(opts);
    this._fixedHeight = !!opts.height;
    this._fixedWidth = !!opts.width;
    this.bounds.width = opts.width || 0;
    this.bounds.height = opts.height || 1;

    this.text(opts.text || "");
  }

  text(): string;
  text(v: string): this;
  text(v?: string): this | string {
    if (v === undefined) return this._text;

    this._text = v;
    let w = this._fixedWidth
      ? this.bounds.width
      : this.scene
      ? this.scene.width
      : 100;
    this._lines = TEXT.splitIntoLines(this._text, w);
    if (!this._fixedWidth) {
      this.bounds.width = this._lines.reduce(
        (out, line) => Math.max(out, TEXT.length(line)),
        0
      );
    }
    if (this._fixedHeight) {
      if (this._lines.length > this.bounds.height) {
        this._lines.length = this.bounds.height;
      }
    } else {
      this.bounds.height = Math.max(1, this._lines.length);
    }

    this.needsDraw = true;
    return this;
  }

  resize(w: number, h: number): this {
    super.resize(w, h);
    this._fixedWidth = w > 0;
    this._fixedHeight = h > 0;
    this.text(this._text);
    return this;
  }

  addChild(): this {
    throw new Error("Text widgets cannot have children.");
  }

  _draw(buffer: Buffer.Buffer): void {
    super._draw(buffer);

    let vOffset = 0;
    if (this._used.valign === "bottom") {
      vOffset = this.bounds.height - this._lines.length;
    } else if (this._used.valign === "middle") {
      vOffset = Math.floor((this.bounds.height - this._lines.length) / 2);
    }

    this._lines.forEach((line, i) => {
      buffer.drawText(
        this.bounds.x,
        this.bounds.y + i + vOffset,
        line,
        this._used.fg,
        -1,
        this.bounds.width,
        this._used.align
      );
    });
  }
}

// // extend Layer

// export type AddTextOptions = TextOptions & UpdatePosOpts & { parent?: Widget };

// export function text(opts: AddTextOptions = {}): Text {
//     const widget = new Text(opts);
//     return widget;
// }
