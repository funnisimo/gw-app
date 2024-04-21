import { expect, test, describe, vi, beforeEach } from "vitest";

import "../../test/matchers";

import * as TEST from "../../test/utils";
import * as COLOR from "gw-canvas/color";
import * as APP from "../app";
import * as CANVAS from "gw-canvas/canvas";
import * as BUFFER from "gw-canvas/buffer";
import * as BUILD from "./builder";

// import * as BUTTON from './button';

describe("Button", () => {
  let canvas: CANVAS.Canvas;
  let app: APP.App;
  let scene: APP.Scene;
  let buffer: BUFFER.Buffer;
  let build: BUILD.Builder;

  beforeEach(() => {
    canvas = TEST.mockCanvas();
    app = APP.make({ canvas, start: false, scene: true });
    scene = app.scene;
    buffer = scene.buffer;
    build = new BUILD.Builder(scene);
  });

  test("create", () => {
    let widget = build.button({
      id: "ID",
      text: "Button",
      bg: "black",
    });

    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(0);
    expect(widget.bounds.width).toEqual(6);
    expect(widget.bounds.height).toEqual(1);
    expect(widget.text()).toEqual("Button");

    widget.bounds.x = widget.bounds.y = 0;

    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Button");
    expect(buffer.get(0, 0).fg).toEqual(COLOR.colors.white);
    expect(buffer.get(0, 0).bg).toEqual(COLOR.colors.black);
  });

  test("hover", () => {
    let widget = build.button({
      id: "ID",
      text: "Button",
      fg: "red",
      bg: "gray",
      x: 0,
      y: 0,
    });

    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(0);
    expect(widget.bounds.width).toEqual(6);
    expect(widget.bounds.height).toEqual(1);

    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Button");
    expect(buffer.get(0, 0).fg).toEqual(COLOR.colors.red);
    expect(buffer.get(0, 0).bg).toEqual(COLOR.colors.gray);

    app._input(TEST.mousemove(0, 0));
    expect(widget.hovered).toBeTruthy();
    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Button");
    expect(buffer.get(0, 0).fg).toEqual(COLOR.colors.red);
    expect(buffer.get(0, 0).bg).toEqual(COLOR.colors.gray);

    app._input(TEST.mousemove(10, 10));
    expect(widget.hovered).toBeFalsy();
    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Button");
    expect(buffer.get(0, 0).fg).toEqual(COLOR.colors.red);
    expect(buffer.get(0, 0).bg).toEqual(COLOR.colors.gray);
  });

  test("hover - wide + tall", () => {
    let widget = build.button({
      id: "ID",
      text: "Button",
      fg: "red",
      bg: "gray",
      width: 10,
      height: 2,
      x: 0,
      y: 0,
    });

    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Button");
    expect(buffer.get(0, 0).fg).toEqual(COLOR.colors.red.toInt());
    expect(buffer.get(0, 0).bg).toEqual(COLOR.colors.gray.toInt());
    expect(buffer.get(0, 1).bg).toEqual(COLOR.colors.gray.toInt());

    app._input(TEST.mousemove(0, 0));
    expect(widget.hovered).toBeTruthy();
    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Button");
    expect(buffer.get(0, 0).fg).toEqual(COLOR.colors.red.toInt());
    expect(buffer.get(0, 0).bg).toEqual(COLOR.colors.gray.toInt());
    expect(buffer.get(0, 1).bg).toEqual(COLOR.colors.gray.toInt());

    app._input(TEST.mousemove(10, 10));
    expect(widget.hovered).toBeFalsy();
    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Button");
    expect(buffer.get(0, 0).fg).toEqual(COLOR.colors.red.toInt());
    expect(buffer.get(0, 0).bg).toEqual(COLOR.colors.gray.toInt());
    expect(buffer.get(0, 1).bg).toEqual(COLOR.colors.gray.toInt());
  });

  test("Enter", async () => {
    let widget = build.button({
      id: "ID",
      width: 10,
      action: true,
      text: "Test",
      x: 0,
      y: 0,
    });

    expect(widget.prop("tabStop")).toBeTruthy();
    expect(scene.focused).toBe(widget);

    const actionFn = vi.fn();
    scene.on("ID", actionFn);

    app._input(TEST.keypress("Enter"));
    expect(actionFn).toHaveBeenCalled();
    actionFn.mockClear();

    const keyFn = vi.fn().mockImplementation((ev) => ev.preventDefault());
    widget.on("Enter", keyFn);

    const ev = TEST.keypress("Enter");
    app._input(ev);
    expect(keyFn).toHaveBeenCalledWith(ev);
    expect(actionFn).not.toHaveBeenCalled();
  });

  test("Click", async () => {
    let widget = build.button({
      id: "ID",
      width: 10,
      text: "Test",
      x: 0,
      y: 0,
    });

    const clickFn = vi.fn();
    widget.on("click", clickFn);

    app._input(TEST.click(0, 0));
    expect(clickFn).toHaveBeenCalled();

    clickFn.mockClear();
  });

  test("Click - to scene action", async () => {
    build.button({
      id: "ID",
      action: "ACTION",
      width: 10,
      text: "Test",
      x: 0,
      y: 0,
    });

    const clickFn = vi.fn();
    scene.on("ACTION", clickFn);

    app._input(TEST.click(0, 0));
    expect(clickFn).toHaveBeenCalled();
  });
});
