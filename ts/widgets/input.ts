// import * as GWU from 'gw-utils/dist';
import * as TextUtils from "gw-utils/text/index.js";
import * as IO from "../app/io.js";
import * as Buffer from "gw-canvas/buffer.js";

import * as Text from "./text.js";
// import * as Widget from '../app/widget.js';
import { PropType } from "../app/widget.js";
import * as Style from "../app/style.js";

export interface InputOptions extends Text.TextOptions {
  id: string; // have to have id
  placeholder?: string;

  minLength?: number;
  maxLength?: number;

  numbersOnly?: boolean;
  min?: number;
  max?: number;

  required?: boolean;
  disabled?: boolean;
}

Style.defaultStyle.add("input", {
  bg: "light_gray",
  fg: "black",
  align: "left",
  valign: "top",
});

Style.defaultStyle.add("input:invalid", {
  fg: "red",
});

Style.defaultStyle.add("input:empty", {
  fg: "darkest_green",
});

Style.defaultStyle.add("input:focus", {
  bg: "lighter_gray",
});

export class Input extends Text.Text {
  static default = {
    tag: "input",
    width: 10,
    placeholder: "",
  };

  minLength = 0;
  maxLength = 0;

  numbersOnly = false;
  min = 0;
  max = 0;

  constructor(opts: InputOptions) {
    super(
      (() => {
        opts.text = opts.text || "";
        opts.tag = opts.tag || "input";
        opts.tabStop = opts.tabStop === undefined ? true : opts.tabStop;
        opts.width =
          opts.width || opts.maxLength || Math.max(opts.minLength || 0, 10);
        return opts as Text.TextOptions;
      })()
    );

    this.attr("default", this._text);
    this.attr("placeholder", opts.placeholder || Input.default.placeholder);

    if (opts.numbersOnly) {
      this.numbersOnly = true;
      this.min = opts.min || 0;
      this.max = opts.max || 0;
    } else {
      this.minLength = opts.minLength || 0;
      this.maxLength = opts.maxLength || 0;
    }
    if (opts.required) {
      this.attr("required", true);
      this.prop("required", true);
    }
    if (opts.disabled) {
      this.attr("disabled", true);
      this.prop("disabled", true);
    }

    this.prop("valid", this.isValid()); // redo b/c rules are now set
    this.on("blur", () => this.action());
    // this.on('click', this.action.bind(this));
    this.reset();
  }

  reset() {
    this.text(this._attrStr("default"));
  }

  _setProp(name: string, v: PropType): void {
    super._setProp(name, v);
    this._props.valid = this.isValid();
  }

  isValid(): boolean {
    const t = this._text || "";
    if (this.numbersOnly) {
      const val = Number.parseInt(t);
      if (this.min !== undefined && val < this.min) return false;
      if (this.max !== undefined && val > this.max) return false;
      return val > 0;
    }
    const minLength = Math.max(this.minLength, this.prop("required") ? 1 : 0);
    return (
      t.length >= minLength && (!this.maxLength || t.length <= this.maxLength)
    );
  }

  keypress(ev: IO.Event): void {
    if (!ev.key) return;

    const textEntryBounds = this.numbersOnly ? ["0", "9"] : [" ", "~"];

    if (ev.key === "Enter" && this.isValid()) {
      this.action();
      this.scene && this.scene.nextTabStop();
      ev.stopPropagation();
      return;
    }
    if (ev.key == "Delete" || ev.key == "Backspace") {
      if (this._text.length) {
        this.text(TextUtils.spliceRaw(this._text, this._text.length - 1, 1));
        this.emit("change");
        this._used && this._draw(this.scene!.buffer); // save some work?
      }
      ev.stopPropagation();
      return;
    } else if (IO.isControlCode(ev)) {
      // ignore other special keys...
      return;
    }

    // eat/use all other keys
    if (ev.key >= textEntryBounds[0] && ev.key <= textEntryBounds[1]) {
      // allow only permitted input
      if (!this.maxLength || this._text.length < this.maxLength) {
        this.text(this._text + ev.key);
        this.emit("change");
        this._used && this._draw(this.scene!.buffer); // save some work?
      }
    }
    ev.stopPropagation();
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
    e.dispatch(this.events);
  }

  text(): string;
  text(v: string): this;
  text(v?: string): this | string {
    if (v === undefined) return this._text;
    super.text(v);
    this.prop("empty", this._text.length === 0);
    this.prop("valid", this.isValid());
    return this;
  }

  _draw(buffer: Buffer.Buffer, _force = false): boolean {
    this._drawFill(buffer);

    let vOffset = 0;
    if (!this._used) {
    } else if (this._used.valign === "bottom") {
      vOffset = this.bounds.height - this._lines.length;
    } else if (this._used.valign === "middle") {
      vOffset = Math.floor((this.bounds.height - this._lines.length) / 2);
    }

    let show = this._text;
    if (show.length == 0) {
      show = this._attrStr("placeholder");
    }
    if (this._text.length > this.bounds.width) {
      show = this._text.slice(this._text.length - this.bounds.width);
    }

    const fg = this._used ? this._used.fg : "white";
    const align = this._used ? this._used.align : "left";

    buffer.drawText(
      this.bounds.x,
      this.bounds.y + vOffset,
      show,
      fg,
      -1,
      this.bounds.width,
      align
    );
    return true;
  }
}

/*
// extend WidgetLayer

export type AddInputOptions = InputOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module './layer' {
    interface WidgetLayer {
        input(opts: AddInputOptions): Input;
    }
}
WidgetLayer.prototype.input = function (opts: AddInputOptions): Input {
    const options = Object.assign({}, this._opts, opts);
    const list = new Input(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
*/
