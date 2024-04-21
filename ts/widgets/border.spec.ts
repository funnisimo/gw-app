import { expect, test, describe, vi, beforeEach } from "vitest";

import * as TEST from "../../test/utils";
import * as APP from "../app";
import * as CANVAS from "gw-canvas";
import * as BUILD from "./builder";

// import * as BORDER from './border';

describe("Body", () => {
  let canvas: CANVAS.Canvas;
  let app: APP.App;
  let scene: APP.Scene;
  let build: BUILD.Builder;

  beforeEach(() => {
    canvas = TEST.mockCanvas();
    app = APP.make({ canvas, start: false, scene: true });
    scene = app.scene;
    build = new BUILD.Builder(scene);
  });

  test("basic", () => {
    build.border({
      scene,
      ascii: true,
      width: scene.width,
      height: scene.height,
    });

    build.text("Test");

    app._draw();
    // canvas.buffer.dump();

    expect(TEST.getBufferText(scene.buffer, 0, 0, 30)).toEqual(
      "+----------------------------+"
    );
    expect(TEST.getBufferText(scene.buffer, 0, 1, 30)).toEqual(
      "|Test                        |"
    );
  });
});
