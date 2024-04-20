// import * as GWU from 'gw-utils/dist';
import * as Buffer from "gw-canvas/buffer.js";
import * as XY from "gw-utils/xy.js";
import * as Widget from "../app/widget.js";
import { ColorBase } from "gw-canvas/color.js";

export interface BorderOptions extends Widget.WidgetOpts {
  width: number;
  height: number;

  ascii?: boolean;
}

export class Border extends Widget.Widget {
  ascii = false;

  constructor(opts: BorderOptions) {
    super(opts);
    if (opts.ascii) {
      this.ascii = true;
    } else if (opts.fg && opts.ascii !== false) {
      this.ascii = true;
    }
  }

  // contains(e: XY.XY): boolean;
  // contains(x: number, y: number): boolean;
  contains(): boolean {
    return false;
  }

  _draw(buffer: Buffer.Buffer): boolean {
    super._draw(buffer);

    const w = this.bounds.width;
    const h = this.bounds.height;
    const x = this.bounds.x;
    const y = this.bounds.y;
    const ascii = this.ascii;

    drawBorder(buffer, x, y, w, h, this._used, ascii);
    return true;
  }
}

/*
// extend WidgetLayer
export type AddBorderOptions = BorderOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module './layer' {
    interface WidgetLayer {
        border(opts: AddBorderOptions): Border;
    }
}
WidgetLayer.prototype.border = function (opts: AddBorderOptions): Border {
    const options = Object.assign({}, this._opts, opts);
    const list = new Border(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
*/

export function drawBorder(
  buffer: Buffer.Buffer,
  x: number,
  y: number,
  w: number,
  h: number,
  color: { fg?: ColorBase; bg?: ColorBase },
  ascii: boolean = true
) {
  const fg = color.fg || null;
  const bg = color.bg || null;
  if (ascii) {
    for (let i = 1; i < w; ++i) {
      buffer.draw(x + i, y, "-", fg, bg);
      buffer.draw(x + i, y + h - 1, "-", fg, bg);
    }
    for (let j = 1; j < h; ++j) {
      buffer.draw(x, y + j, "|", fg, bg);
      buffer.draw(x + w - 1, y + j, "|", fg, bg);
    }
    buffer.draw(x, y, "+", fg, bg);
    buffer.draw(x + w - 1, y, "+", fg, bg);
    buffer.draw(x, y + h - 1, "+", fg, bg);
    buffer.draw(x + w - 1, y + h - 1, "+", fg, bg);
  } else {
    XY.forBorder(x, y, w, h, (x, y) => {
      buffer.draw(x, y, " ", bg, bg);
    });
  }
}
