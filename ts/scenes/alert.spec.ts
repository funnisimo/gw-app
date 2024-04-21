import { expect, test, describe, vi, beforeEach } from "vitest";

import * as TEST from "../../test/utils";
import * as APP from "../app";
import * as CANVAS from "gw-canvas";
import * as BUFFER from "gw-canvas/buffer.js";
import * as BUILD from "../widgets/builder";
import "./alert";

// import * as BORDER from './border';

describe("Body", () => {
  let canvas: CANVAS.Canvas;
  let app: APP.App;
  let scene: APP.Scene;
  let buffer: BUFFER.Buffer;
  let build: BUILD.Builder;

  beforeEach(() => {
    canvas = TEST.mockCanvas(50, 30);
    app = APP.make({ canvas, start: false, scene: true });
    scene = app.scene;
    buffer = app.buffer;
    build = new BUILD.Builder(scene);
  });

  test("basic alert", () => {
    build.text("testing testing testing", { x: 13, y: 15 });

    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    const pauseFn = vi.fn();
    const resumeFn = vi.fn();
    scene.on("pause", pauseFn);
    scene.on("resume", resumeFn);

    expect(app.scene).toBe(scene);

    const alert = app.alert("This is an alert.", {
      bg: "green",
      border: "ascii",
    });

    expect(pauseFn).toHaveBeenCalled();
    expect(resumeFn).not.toHaveBeenCalled();
    expect(app.scene).toBe(alert);

    expect(scene.paused).toEqual({
      draw: true,
      input: true,
      timers: true,
      tweens: true,
      update: true,
    });

    app._draw();
    // buffer.dump();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "| This is an alert. |"
    );

    app._input(TEST.keypress("Enter"));
    app._frameEnd();

    expect(resumeFn).toHaveBeenCalled();
    expect(app.scene).toBe(scene);

    expect(scene.paused).toEqual({
      draw: false,
      input: false,
      timers: false,
      tweens: false,
      update: false,
    });

    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );
  });

  test("alert -> alert", () => {
    build.text("testing testing testing", { x: 13, y: 15 });

    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    expect(app.scene).toBe(scene);

    app.alert("This is an alert.", { bg: "green", border: "ascii" });
    app._input(TEST.keypress("Enter"));
    app._draw();

    app.alert("ANOTHER ALERT!\nThis one has many lines!\nHow exciting!", {
      bg: "green",
      border: "ascii",
    });

    app._draw();
    // buffer.dump();
    app._input(TEST.keypress("Enter"));
    app._draw();
    app._frameEnd();

    expect(app.scene.id).toBe(scene.id);

    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );
  });
});
