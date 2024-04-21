import { expect, test, describe, vi, beforeEach } from "vitest";
import "jest-extended";
import "../../test/matchers";
import * as TEST from "../../test/utils";

import { App } from "./app";
import { Canvas } from "gw-canvas";

describe("scenes", () => {
  test("multi-show", () => {
    const app = new App({
      canvas: { width: 40, height: 30 } as Canvas,
      scenes: {
        default: {},
        test: {
          start(opts) {
            this.data.id = opts.id;
          },
          on: {
            Enter() {
              this.stop();
            },
          },
        },
      },
      start: false, // Keeps loop from starting
    });

    // How to know it is the first?
    expect(app.scene.id).toEqual("default");

    // show test scene - twice
    app.show("test", { id: 1 });
    app.show("test", { id: 2 });

    // current should be second
    expect(app.scene.id).toEqual("test");
    expect(app.scene.data.id).toEqual(2);

    // finish second test scene
    app._input(TEST.keypress("Enter"));
    // current should be first test scene
    expect(app.scene.id).toEqual("test");
    expect(app.scene.data.id).toEqual(1);

    // finish first
    app._input(TEST.keypress("Enter"));
    // current should be default
    expect(app.scene.id).toEqual("default");
  });
});
