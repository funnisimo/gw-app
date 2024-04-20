// import * as GWU from 'gw-utils/dist';
import * as Utils from "gw-utils/utils.js";
import * as TextUtils from "gw-utils/text/index.js";
import * as Buffer from "gw-canvas/buffer.js";
import * as IO from "../app/io.js";

// import { Body } from './body.js';
import * as Text from "./text.js";
import * as Widget from "../app/widget.js";
import { BorderType } from "./datatable.js";
import { drawBorder } from "./border.js";
import { DataList } from "./datalist.js";

////////////////////////////////////////////////////////////////////////////////
// PROMPT

export type NextType = string | null;

export interface PromptChoice {
  info?: string | TextUtils.Template;
  next?: string;
  value?: any;
}

export interface PromptOptions {
  field?: string;
  next?: string;
  id?: string;
}

export class Prompt {
  _id: string | null = null;
  _field: string;
  _prompt: string | TextUtils.Template;

  _choices: string[];
  _infos!: (string | TextUtils.Template)[];
  _next: NextType[];
  _values: any[];

  _defaultNext: NextType = null;
  selection = -1;

  constructor(
    question: string | TextUtils.Template,
    field: string | PromptOptions = {}
  ) {
    if (typeof field === "string") {
      field = { field };
    }
    this._prompt = question;
    this._field = field.field || "";
    this._choices = [];
    this._infos = [];
    this._values = [];
    this._next = [];
    this._defaultNext = field.next || null;
    this._id = field.id || field.field || "";
  }

  reset() {
    this.selection = -1;
  }

  field(): string;
  field(v: string): this;
  field(v?: string): this | string {
    if (v === undefined) return this._field;
    this._field = v;
    return this;
  }

  id(): string | null;
  id(v: string | null): this;
  id(v?: string | null): this | string | null {
    if (v === undefined) return this._id;
    this._id = v;
    return this;
  }

  prompt(arg?: any): string {
    if (typeof this._prompt === "string") return this._prompt;
    return this._prompt(arg);
  }

  next(): string | null;
  next(v: string | null): this;
  next(v?: string | null): this | string | null {
    if (v === undefined) return this._next[this.selection] || this._defaultNext;
    this._defaultNext = v;
    return this;
  }

  choices(): string[];
  choices(choices: Record<string, string | PromptChoice>): this;
  choices(choices: string[], infos?: (string | PromptChoice)[]): this;
  choices(
    choice?: string[] | Record<string, string | PromptChoice>,
    info?: (string | PromptChoice)[]
  ): this | string[] {
    if (choice === undefined) return this._choices;

    if (!Array.isArray(choice)) {
      info = Object.values(choice);
      choice = Object.keys(choice);
    } else if (!Array.isArray(info)) {
      info = new Array(choice.length).fill("");
    }
    info = info.map((i) => {
      if (typeof i === "string") return { info: i };
      return i;
    });
    if (choice.length !== info.length)
      throw new Error("Choices and Infos must have same length.");

    choice.forEach((c, i) => {
      this.choice(c, info![i]);
    });
    return this;
  }

  choice(choice: string, info: string | PromptChoice = {}): this {
    if (typeof info === "string") {
      info = { info: info };
    }
    this._choices.push(choice);
    this._infos.push(info.info || "");
    this._next.push(info.next || null);
    this._values.push(info.value || choice);
    return this;
  }

  info(arg?: any): string {
    const i = this._infos[this.selection] || "";
    if (typeof i === "string") return i;
    return i(arg);
  }

  choose(n: number): this {
    this.selection = n;
    return this;
  }

  value(): any {
    return this._values[this.selection];
  }

  updateResult(res: any): this {
    if (this.selection < 0) return this;
    res[this._field] = this.value();
    return this;
  }
}

////////////////////////////////////////////////////////////////////////////////
// CHOICE

export interface ChoiceOptions extends Widget.WidgetOpts {
  width: number;
  height: number;
  choiceWidth: number;

  border?: BorderType;

  promptTag?: string;
  promptClass?: string;

  choiceTag?: string;
  choiceClass?: string;

  infoTag?: string;
  infoClass?: string;

  prompt?: Prompt;
}

export class Choice extends Widget.Widget {
  static default = {
    tag: "choice",
    border: "ascii",
    promptTag: "prompt",
    promptClass: "",

    choiceTag: "ci",
    choiceClass: "",

    infoTag: "info",
    infoClass: "",
  };

  choiceWidth: number;
  _text!: Widget.Widget;
  _list!: DataList;
  _info!: Text.Text;
  _prompt: Prompt | null = null;
  _done: null | ((v: any) => void) = null;

  constructor(opts: ChoiceOptions) {
    super(
      (() => {
        opts.tag = opts.tag || Choice.default.tag;
        return opts;
      })()
    );
    this.choiceWidth = opts.choiceWidth;
    this.attr("border", opts.border || Choice.default.border);
    this.attr("promptTag", opts.promptTag || Choice.default.promptTag);
    this.attr("promptClass", opts.promptClass || Choice.default.promptClass);
    this.attr("choiceTag", opts.choiceTag || Choice.default.choiceTag);

    this.attr("choiceClass", opts.choiceClass || Choice.default.choiceClass);
    this.attr("infoTag", opts.infoTag || Choice.default.infoTag);
    this.attr("infoClass", opts.infoClass || Choice.default.infoClass);

    this._addLegend();
    this._addList();
    this._addInfo();

    if (opts.prompt) {
      this.showPrompt(opts.prompt);
    }
  }

  get prompt() {
    return this._prompt;
  }

  showPrompt(prompt: Prompt, arg?: any): Promise<any> {
    this._prompt = prompt;
    prompt.choose(0);
    this._text.text(prompt.prompt(arg));
    this._list.data(prompt.choices());
    this._info.text(prompt.info(arg));

    this.emit("prompt", this._prompt);
    return new Promise((resolve) => (this._done = resolve));
  }

  _addList(): this {
    this._list = new DataList({
      parent: this,
      height: this.bounds.height - 2,
      x: this.bounds.x + 1,
      width: this.choiceWidth,
      y: this.bounds.y + 1,
      dataTag: this._attrStr("choiceTag"),
      dataClass: this._attrStr("choiceClass"),
      tabStop: true,
      border: "none",
      hover: "select",
    });

    this._list.on("change", () => {
      if (!this._prompt) return false;
      const p = this._prompt;
      const row = this._list.selectedRow;
      p.choose(row);
      this._info.text(p.info());
      this.emit("change", p);
      // e.stopPropagation(); // I want to eat this event
    });
    this._list.on("action", () => {
      if (!this._prompt) return false;
      const p = this._prompt;
      p.choose(this._list.selectedRow);
      this.action();
      this._done!(p.value());
      // e.stopPropagation(); // eat this event
    });
    return this;
  }

  _addInfo(): this {
    this._info = new Text.Text({
      parent: this,
      text: "",
      x: this.bounds.x + this.choiceWidth + 2,
      y: this.bounds.y + 1,
      width: this.bounds.width - this.choiceWidth - 3,
      height: this.bounds.height - 2,
      tag: this._attrStr("infoTag"),
      class: this._attrStr("infoClass"),
    });

    return this;
  }

  _addLegend(): this {
    this._text = new Text.Text({
      parent: this,
      text: "",
      width: this.bounds.width - 4,
      x: this.bounds.x + 2,
      y: this.bounds.y,
      tag: this._attrStr("promptTag"),
      class: this._attrStr("promptClass"),
    });

    return this;
  }

  _draw(buffer: Buffer.Buffer): boolean {
    let w = this.choiceWidth + 2;
    const h = this.bounds.height;
    let x = this.bounds.x;
    const y = this.bounds.y;
    const ascii = this.attr("border") === "ascii";

    drawBorder(buffer, x, y, w, h, this._used, ascii);

    w = this.bounds.width - this.choiceWidth - 1;
    x = this.bounds.x + this.choiceWidth + 1;
    drawBorder(buffer, x, y, w, h, this._used, ascii);

    return true;
  }
}

/*
// extend WidgetLayer

export type AddChoiceOptions = ChoiceOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module './layer' {
    interface WidgetLayer {
        choice(opts?: AddChoiceOptions): Choice;
    }
}
WidgetLayer.prototype.choice = function (opts: AddChoiceOptions): Choice {
    const options = Object.assign({}, this._opts, opts) as ChoiceOptions;
    const widget = new Choice(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};
*/

////////////////////////////////////////////////////////////////////////////////
// INQUIRY

export class Inquiry {
  widget: Choice;
  _prompts: Prompt[] = [];
  events: Record<string, Widget.EventCb[]> = {};

  _result: any = {};
  _stack: Prompt[] = [];
  _current: Prompt | null = null;

  constructor(widget: Choice) {
    this.widget = widget;

    this._keypress = this._keypress.bind(this);
    this._change = this._change.bind(this);
  }

  prompts(v: Prompt[] | Prompt, ...args: Prompt[]): this {
    if (Array.isArray(v)) {
      this._prompts = v.slice();
    } else {
      args.unshift(v);
      this._prompts = args;
    }
    return this;
  }

  _finish() {
    this.widget.off("keypress", this._keypress);
    this.widget.off("change", this._change);
    this._fireEvent("finish", this.widget, this._result);
  }

  _cancel() {
    this.widget.off("keypress", this._keypress);
    this.widget.off("change", this._change);
    this._fireEvent("cancel", this.widget);
  }

  start() {
    this._current = this._prompts[0];
    this._result = {};

    this.widget.on("keypress", this._keypress);
    this.widget.on("change", this._change);
    this.widget.showPrompt(this._current, this._result);
  }

  back() {
    this._current!.reset();
    this._current = this._stack.pop() || null;
    if (!this._current) {
      this._cancel();
    } else {
      this._current.reset(); // also reset the one we are going back to
      this._result = {};
      this._prompts.forEach((p) => p.updateResult(this._result));
      this.widget.showPrompt(this._current, this._result);
    }
  }

  restart() {
    this._prompts.forEach((p) => p.reset());
    this._result = {};
    this._current = this._prompts[0];
    this.widget.showPrompt(this._current, this._result);
  }

  quit() {
    this._cancel();
  }

  _keypress(_n: string, _w: Widget.Widget | null, e: IO.Event): boolean {
    if (!e.key) return false;

    if (e.key === "Escape") {
      this.back();
      return true;
    } else if (e.key === "R") {
      this.restart();
      return true;
    } else if (e.key === "Q") {
      this.quit();
      return true;
    }
    return false;
  }

  _change(_n: string, _w: Widget.Widget | null, p: Prompt): boolean {
    p.updateResult(this._result);

    const next: string | null = p.next();
    if (next) {
      this._current = this._prompts.find((p) => p.id() === next) || null;
      if (this._current) {
        this._stack.push(p);
        this.widget.showPrompt(this._current, this._result);
        this._fireEvent("step", this.widget, {
          prompt: this._current,
          data: this._result,
        });
        return true;
      }
    }
    this._finish();
    return true;
  }

  on(event: string, cb: Widget.EventCb): this {
    let handlers = this.events[event];
    if (!handlers) {
      handlers = this.events[event] = [];
    }
    if (!handlers.includes(cb)) {
      handlers.push(cb);
    }
    return this;
  }

  off(event: string, cb?: Widget.EventCb): this {
    let handlers = this.events[event];
    if (!handlers) return this;
    if (cb) {
      Utils.arrayDelete(handlers, cb);
    } else {
      handlers.length = 0; // clear all handlers
    }
    return this;
  }

  _fireEvent(name: string, source: Widget.Widget | null, args?: any): boolean {
    const handlers = this.events[name] || [];
    let handled = false;
    for (let handler of handlers) {
      handled = handler(name, source || this.widget, args) || handled;
    }

    if (!handled) {
      handled = this.widget.emit(name, args);
    }
    return handled;
  }
}
