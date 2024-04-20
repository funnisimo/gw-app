// import * as GWU from 'gw-utils/dist';
import * as IO from "../app/io.js";
import * as Buffer from "gw-canvas/buffer.js";
import * as COLOR from "gw-canvas/color.js";

import * as Text from "./text.js";
// import { Widget } from '../app/widget.js';

export interface CheckboxOptions extends Text.TextOptions {
  uncheck?: string;
  check?: string;
  checked?: boolean;
  pad?: number;
  value?: string | [string, string]; // on | [off,on]
}

export class Checkbox extends Text.Text {
  static default = {
    uncheck: "\u2610", // unchecked
    check: "\u2612", // checked - with X
    pad: 1,
    value: "on",
  };

  constructor(opts: CheckboxOptions) {
    super(
      (() => {
        // opts.action = opts.action || opts.id || 'input';
        opts.tag = opts.tag || "checkbox";
        opts.tabStop = opts.tabStop === undefined ? true : opts.tabStop;
        return opts as Text.TextOptions;
      })()
    );

    this.attr("uncheck", opts.uncheck || Checkbox.default.uncheck);
    this.attr("check", opts.check || Checkbox.default.check);
    this.attr("pad", opts.pad ?? Checkbox.default.pad);
    this.attr("offValue", "");
    if (Array.isArray(opts.value)) {
      this.attr("offValue", opts.value[0] || "");
      this.attr("value", opts.value[1] || Checkbox.default.value);
    } else {
      this.attr("value", opts.value || Checkbox.default.value);
    }

    this.bounds.width += this._attrInt("pad");

    if (opts.checked) {
      this.prop("checked", true);
    }

    this.on("click", (ev) => {
      if (ev.defaultPrevented) return;
      this.toggleProp("checked");
    });
  }

  value(): string {
    return this._propBool("checked")
      ? this._attrStr("value")
      : this._attrStr("offValue");
  }

  text(): string;
  text(v: string): this;
  text(v?: string): this | string {
    if (v === undefined) return super.text();
    super.text(v);
    this.bounds.width += 1 + this._attrInt("pad");
    return this;
  }

  keypress(ev: IO.Event): void {
    if (!ev.key) return;

    super.keypress(ev);
    if (ev.defaultPrevented) return;

    if (ev.key === "Enter" || ev.key === " ") {
      this.toggleProp("checked");
      this.emit("change");
    } else if (ev.key === "Backspace" || ev.key === "Delete") {
      this.prop("checked", false);
      this.emit("change");
    }
  }

  _draw(buffer: Buffer.Buffer): boolean {
    const fg = this._used.fg || COLOR.WHITE;
    const bg = this._used.bg || COLOR.NONE;
    const align = this._used.align;

    buffer.fillBounds(this.bounds, " ", 0, bg);

    const state = this.prop("checked") ? "check" : "uncheck";
    let v = "" + this._attrs[state];
    buffer.drawText(this.bounds.x, this.bounds.y, v, fg, bg);

    let vOffset = 0;
    if (this._used.valign === "bottom") {
      vOffset = this.bounds.height - this._lines.length;
    } else if (this._used.valign === "middle") {
      vOffset = Math.floor((this.bounds.height - this._lines.length) / 2);
    }

    const pad = this._attrInt("pad") + 1;
    this._lines.forEach((line, i) => {
      buffer.drawText(
        this.bounds.x + pad,
        this.bounds.y + i + vOffset,
        line,
        fg,
        bg,
        this.bounds.width - pad,
        align
      );
    });

    return true;
  }
}
