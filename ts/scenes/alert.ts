// import * as Color from '../color';
import * as TEXT from "gw-utils/text/index.js";

import { Scene } from "../app/scene.js";
import { installScene } from "../app/scenes.js";
import { Dialog, DialogOptions } from "../widgets/dialog.js";
import { Text } from "../widgets/text.js";

export interface AlertOptions extends Partial<DialogOptions> {
  duration?: number;
  waitForAck?: boolean;
  textClass?: string;
  opacity?: number;

  text: string;
  args?: Record<string, any>;
}

export const AlertScene = {
  create(this: Scene) {
    this.on("mousemove", (e) => {
      e.stopPropagation();
    });
    this.on("click", (e) => {
      e.stopPropagation();
      this.stop({ click: true });
    });
    this.on("keypress", (e) => {
      e.stopPropagation();
      this.stop({ keypress: true });
    });
  },

  start(this: Scene, data: AlertOptions) {
    if (data.args) {
      data.text = TEXT.apply(data.text, data.args);
    }

    data.class = data.class || "alert";
    data.border = data.border || "ascii";
    data.pad = data.pad || 1;

    const text = new Text(data);
    if (!data.height) {
      data.height = text.bounds.height;
    }
    if (!data.width) {
      data.width = text.bounds.width;
    }
    data.scene = this;
    data.center = true;
    const dialog = new Dialog(data as DialogOptions);
    text.setParent(dialog, { center: true });

    if (!data.waitForAck) {
      this.wait(data.duration || 3000, () => this.stop({}));
    }
  },

  stop(this: Scene) {
    this.children.forEach((c) => c.destroy());
    this.children = [];
    this.timers.clear();
  },
};

installScene("alert", AlertScene);
