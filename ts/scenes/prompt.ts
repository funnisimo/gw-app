// import * as GWU from 'gw-utils/dist';
import * as Color from "gw-canvas/color.js";
// import * as TextUtils from '../text';

import "../widgets/button.js";
import { Scene, SceneStartOpts } from "../app/scene.js";
import { installScene } from "../app/scenes.js";
import * as DIALOG from "../widgets/dialog.js";
import { Text } from "../widgets/text.js";
import { Input } from "../widgets/input.js";

// TODO - Should this be removed?
type WidgetEvents =
  | "create"
  | "input"
  | "update"
  | "draw"
  | "destroy"
  | "keypress"
  | "mouseenter"
  | "mousemove"
  | "mouseleave"
  | "click"
  | "on";

export interface PromptOptions
  extends Omit<DIALOG.DialogOptions, "width" | "height" | WidgetEvents>,
    SceneStartOpts {
  width?: number;
  height?: number;

  prompt: string;
  textClass?: string;
  opacity?: number;

  buttonWidth?: number;

  label?: string;
  labelClass?: string;

  default?: string;
  placeholder?: string;
  inputClass?: string;

  minLength?: number;
  maxLength?: number;

  numbersOnly?: boolean;
  min?: number;
  max?: number;

  done?: (result: string | null) => any;
}

export const PromptScene = {
  create(this: Scene) {
    this.on("mousemove", (e) => {
      e.stopPropagation();
    });
    this.on("click", (e) => {
      e.stopPropagation();
    });
    this.on("keypress", (e) => {
      e.stopPropagation();
    });
    this.on("PROMPT", () => {
      const input = this.get("PROMPT");
      this.stop(input ? input.text() : null);
    });
    this.on("Escape", () => {
      this.stop(null);
    });
  },
  start(this: Scene, opts: PromptOptions) {
    opts.class = opts.class || "confirm";
    opts.border = opts.border || "ascii";
    opts.pad = opts.pad || 0;

    // Fade the background
    const opacity = opts.opacity !== undefined ? opts.opacity : 50;
    this.bg = Color.BLACK.alpha(opacity);

    // create the text widget
    const textWidget = new Text({
      text: opts.prompt,
      class: opts.textClass || opts.class,
      width: opts.width,
      height: opts.height,
    });

    Object.assign(opts, {
      width: textWidget.bounds.width + 2,
      height: textWidget.bounds.height + 1, // for input
      x: textWidget.bounds.x - 1,
      y: textWidget.bounds.y - 1,
      tag: "inputbox",
      scene: this,
      center: true,
    });
    const dialog = new DIALOG.Dialog(opts as DIALOG.DialogOptions);
    textWidget.setParent(dialog, { top: 1, centerX: true });

    let width = dialog._innerWidth - 2;
    let x = textWidget.bounds.left;
    if (opts.label) {
      const label = new Text({
        parent: dialog,
        text: opts.label,
        class: opts.labelClass || opts.class,
        tag: "label",
        x,
        bottom: -1,
      });

      x += label.bounds.width + 1;
      width -= label.bounds.width + 1;
    }

    const input = new Input({
      parent: dialog,
      class: opts.inputClass || opts.class,
      width,
      id: "PROMPT",
      x,
      bottom: -1,
    });

    this.once("PROMPT", () => {
      if (opts.done) opts.done(input.text());
    });

    this.once("Escape", () => {
      if (opts.done) opts.done(null);
    });
  },
  stop(this: Scene) {
    this.children.forEach((c) => c.destroy());
    this.children = [];
  },
};

installScene("prompt", PromptScene);
