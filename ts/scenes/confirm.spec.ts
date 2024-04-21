import { expect, test, describe, vi, beforeEach } from "vitest";
import * as TEST from "../../test/utils";
import * as APP from "../app";
import * as CANVAS from "gw-canvas";
import * as BUFFER from "gw-canvas/buffer.js";
import * as WIDGET from "../widgets";
import "./confirm";

// import * as BORDER from './border';

describe("Confirm", () => {
  let canvas: CANVAS.Canvas;
  let app: APP.App;
  let scene: APP.Scene;
  let buffer: BUFFER.Buffer;
  let build: WIDGET.Builder;

  beforeEach(() => {
    canvas = TEST.mockCanvas(50, 30);
    app = APP.make({ canvas, start: false, scene: true });
    scene = app.scene;
    buffer = app.buffer;
    build = new WIDGET.Builder(scene);
  });

  test("basic async confirm", async () => {
    build.pos(13, 15).text("testing testing testing");

    const pauseFn = vi.fn();
    const resumeFn = vi.fn();
    scene.on("pause", pauseFn);
    scene.on("resume", resumeFn);

    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    const stopFn = vi.fn();
    const confirm = app.confirm("Do you want to eat the food?");
    confirm.once("stop", stopFn);

    expect(pauseFn).toHaveBeenCalled();
    expect(app.scene).not.toBe(scene);
    app._draw();
    expect(TEST.getBufferText(buffer, 13, 14, 40)).toEqual(
      "| Do you want to   |"
    );
    expect(TEST.getBufferText(buffer, 13, 15, 40)).toEqual(
      "tes| eat the food?    |"
    );

    app._input(TEST.keypress("Enter"));

    expect(resumeFn).toHaveBeenCalled();
    expect(app.scene).toBe(scene);
    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    expect(stopFn).toHaveBeenCalledWith(true);
  });

  test("basic async cancel", async () => {
    build.pos(13, 15).text("testing testing testing");

    const pauseFn = vi.fn();
    const resumeFn = vi.fn();
    scene.on("pause", pauseFn);
    scene.on("resume", resumeFn);

    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    const stopFn = vi.fn();
    const confirm = app.confirm("Do you want to eat the food?");
    confirm.once("stop", stopFn);

    expect(pauseFn).toHaveBeenCalled();
    expect(app.scene).not.toBe(scene);
    app._draw();
    expect(TEST.getBufferText(buffer, 13, 14, 40)).toEqual(
      "| Do you want to   |"
    );
    expect(TEST.getBufferText(buffer, 13, 15, 40)).toEqual(
      "tes| eat the food?    |"
    );

    app._input(TEST.keypress("Escape"));

    expect(resumeFn).toHaveBeenCalled();
    expect(app.scene).toBe(scene);
    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    expect(stopFn).toHaveBeenCalledWith(false);
  });

  test("confirm done", async () => {
    build.pos(13, 15).text("testing testing testing");

    const pauseFn = vi.fn();
    const resumeFn = vi.fn();
    scene.on("pause", pauseFn);
    scene.on("resume", resumeFn);

    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    const doneFn = vi.fn();

    app.confirm("Do you want to eat the food?", { done: doneFn });

    expect(pauseFn).toHaveBeenCalled();
    expect(app.scene).not.toBe(scene);
    app._draw();
    expect(TEST.getBufferText(buffer, 13, 14, 40)).toEqual(
      "| Do you want to   |"
    );
    expect(TEST.getBufferText(buffer, 13, 15, 40)).toEqual(
      "tes| eat the food?    |"
    );

    app._input(TEST.keypress("Enter"));

    expect(resumeFn).toHaveBeenCalled();
    expect(app.scene).toBe(scene);
    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    expect(doneFn).toHaveBeenCalledWith(true);
  });

  test("cancel done", async () => {
    build.pos(13, 15).text("testing testing testing");

    const pauseFn = vi.fn();
    const resumeFn = vi.fn();
    scene.on("pause", pauseFn);
    scene.on("resume", resumeFn);

    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    const doneFn = vi.fn();

    app.confirm("Do you want to eat the food?", { done: doneFn });

    expect(pauseFn).toHaveBeenCalled();
    expect(app.scene).not.toBe(scene);
    app._draw();
    expect(TEST.getBufferText(buffer, 13, 14, 40)).toEqual(
      "| Do you want to   |"
    );
    expect(TEST.getBufferText(buffer, 13, 15, 40)).toEqual(
      "tes| eat the food?    |"
    );

    app._input(TEST.keypress("Escape"));

    expect(resumeFn).toHaveBeenCalled();
    expect(app.scene).toBe(scene);
    app._draw();
    expect(TEST.getBufferText(buffer, 13, 15, 25)).toEqual(
      "testing testing testing"
    );

    expect(doneFn).toHaveBeenCalledWith(false);
  });

  test("click ok", async () => {
    build.pos(13, 15).text("testing testing testing");

    const doneFn = vi.fn();
    app.confirm("Do you want to eat the food?", { done: doneFn });

    app._draw();
    // buffer.dump();

    const okBtn = app.scene.get("OK");

    expect(okBtn).not.toBeNull();
    app._input(TEST.click(okBtn!.bounds.x, okBtn!.bounds.y));

    expect(doneFn).toHaveBeenCalledWith(true);
  });

  test("click cancel", async () => {
    build.pos(13, 15).text("testing testing testing");

    const doneFn = vi.fn();
    app.confirm("Do you want to eat the food?", { done: doneFn });

    const cancelBtn = app.scene.get("CANCEL");

    expect(cancelBtn).not.toBeNull();
    app._input(TEST.click(cancelBtn!.bounds.x, cancelBtn!.bounds.y));

    expect(doneFn).toHaveBeenCalledWith(false);
  });

  test("no cancel", async () => {
    build.pos(13, 15).text("testing testing testing");

    const doneFn = vi.fn();
    app.confirm("Do you want to eat the food?", {
      done: doneFn,
      cancel: false,
    });

    const cancelBtn = app.scene.get("CANCEL");

    expect(cancelBtn).toBeNull();
    app._input(TEST.keypress("Enter"));

    expect(doneFn).toHaveBeenCalledWith(true);
  });
});
