import { expect, test, describe, vi, beforeEach } from "vitest";
import "jest-extended";
import "../../test/matchers";

import * as TEST from "../../test/utils";
// import * as BUFFER from '../buffer';
// import * as COLOR from '../color';

import * as APP from "../app";
import * as CANVAS from "gw-canvas";
import * as BUILD from "../widgets/builder";

describe("App", () => {
  let canvas: CANVAS.Canvas;
  let app: APP.App;
  let scene: APP.Scene;

  beforeEach(() => {
    canvas = TEST.mockCanvas();
    app = APP.make({ canvas, start: false });
    scene = app.scene;
  });

  test("basic", () => {
    const enterFn = vi.fn();
    app = APP.make({
      canvas,
      start: false,
      scene: {
        bg: "blue",
        create() {
          const b = new BUILD.Builder(this);
          b.pos(1, 1).text("Test");
        },
        on: {
          Enter: enterFn,
        },
      },
    });

    scene = app.scene;

    expect(scene.children).toHaveLength(1);

    app._input(TEST.keypress("Enter"));
    expect(enterFn).toHaveBeenCalled();

    app._draw();
    expect(TEST.getBufferText(app.buffer, 1, 1, 10, true)).toEqual("Test");
  });

  test("basic Shift+Key", () => {
    const e_fn = vi.fn();
    const E_fn = vi.fn();
    const keypress_fn = vi.fn();

    app = APP.make({
      canvas,
      start: false,
      scene: {
        bg: "blue",
        on: {
          e: e_fn,
          E: E_fn,
          keypress: keypress_fn,
        },
      },
    });

    scene = app.scene;

    app._input(TEST.keypress("E"));
    expect(e_fn).not.toHaveBeenCalled();
    expect(E_fn).toHaveBeenCalled();
    expect(keypress_fn).toHaveBeenCalled(); // Always called unless you preventDefault()

    E_fn.mockReset();
    keypress_fn.mockReset();

    app._input(TEST.keypress("e"));
    expect(e_fn).toHaveBeenCalled();
    expect(E_fn).not.toHaveBeenCalled();
    expect(keypress_fn).toHaveBeenCalled(); // Always called unless you preventDefault()
  });
});
