// import * as GWU from 'gw-utils/dist';
import * as COLOR from "gw-canvas/color.js";
// import * as EVENTS from '../app/events.js';

import { Scene } from "../app/scene.js";
import { installScene } from "../app/scenes.js";
import { Dialog, DialogOptions } from "../widgets/dialog.js";
import { Text } from "../widgets/text.js";
import { Button } from "../widgets/button.js";

export interface ConfirmOptions extends Partial<DialogOptions> {
  text: string;
  textClass?: string;
  opacity?: number;

  buttonWidth?: number;

  ok?: string;
  okClass?: string;

  cancel?: boolean | string;
  cancelClass?: string;

  done?: (result: boolean) => any;
}

export const ConfirmScene = {
  create(this: Scene) {
    this.on("keypress", (e) => {
      if (e.key === "Escape") {
        this.emit("CANCEL");
      } else if (e.key === "Enter") {
        this.emit("OK");
      }
    });

    this.on("OK", () => {
      this.stop(true);
    });
    this.on("CANCEL", () => {
      this.stop(false);
    });
  },

  start(this: Scene, opts: ConfirmOptions) {
    opts.class = opts.class || "confirm";
    opts.border = opts.border || "ascii";
    opts.pad = opts.pad || 1;

    // Fade the background
    const opacity = opts.opacity !== undefined ? opts.opacity : 50;
    this.bg = COLOR.BLACK.alpha(opacity);

    if (opts.cancel === undefined) {
      opts.cancel = "Cancel";
    } else if (opts.cancel === true) {
      opts.cancel = "Cancel";
    } else if (!opts.cancel) {
      opts.cancel = "";
    }

    opts.ok = opts.ok || "Ok";

    let buttonWidth = opts.buttonWidth || 0;
    if (!buttonWidth) {
      buttonWidth = Math.max(opts.ok.length, opts.cancel.length);
    }

    const width = Math.max(opts.width || 0, buttonWidth * 2 + 2);

    // create the text widget
    const textWidget = new Text({
      scene: this,
      text: opts.text,
      class: opts.textClass || opts.class,
      width: width,
      height: opts.height,
    }).center();

    Object.assign(opts, {
      scene: this,
      width: textWidget.bounds.width + 2,
      height: textWidget.bounds.height + 2, // for buttons
      x: textWidget.bounds.x,
      y: textWidget.bounds.y,
      tag: "confirm",
    });
    const dialog = new Dialog(opts as DialogOptions);
    dialog.addChild(textWidget);

    new Button({
      parent: dialog,
      text: opts.ok,
      class: opts.okClass || opts.class,
      width: buttonWidth,
      id: "OK",
      right: -1 - dialog._attrInt("padRight"),
      bottom: -1 - dialog._attrInt("padBottom"),
    });

    if (opts.cancel.length) {
      new Button({
        parent: dialog,
        text: opts.cancel,
        class: opts.cancelClass || opts.class,
        width: buttonWidth,
        id: "CANCEL",
        left: 1 + dialog._attrInt("padLeft"),
        bottom: -1 - dialog._attrInt("padBottom"),
      });
    }

    if (opts.done) {
      const done = opts.done;
      this.once("OK", () => {
        done(true);
      });
      this.once("CANCEL", () => {
        done(false);
      });
    }
  },
  stop(this: Scene) {
    this.children.forEach((c) => c.destroy());
    this.children = [];
  },
};

installScene("confirm", ConfirmScene);
