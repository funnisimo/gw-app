import { expect, test, describe, vi, beforeEach } from "vitest";
import "jest-extended";
import "../../test/matchers";

import * as TEST from "../../test/utils";
// import * as Color from '../color';
import * as Buffer from "gw-canvas/buffer";

import * as APP from "../app";
import * as CANVAS from "gw-canvas/canvas";

import * as Input from "./input";
import * as BUILD from "./builder";

describe("Input Widget", () => {
  let canvas: CANVAS.Canvas;
  let app: APP.App;
  let scene: APP.Scene;
  let buffer: Buffer.Buffer;
  let build: BUILD.Builder;

  beforeEach(() => {
    canvas = TEST.mockCanvas();
    app = APP.make({ canvas, start: false, scene: true });
    scene = app.scene;
    buffer = scene.buffer;
    build = new BUILD.Builder(scene);
  });

  test("create", () => {
    const widget = build.input({ id: "ID", text: "Test" });

    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(0);
    expect(widget.bounds.width).toEqual(10); // default
    expect(widget.bounds.height).toEqual(1);
    expect(widget.text()).toEqual("Test");

    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Test"); // default

    widget.text("");
    app._input(TEST.keypress("e"));
    app._input(TEST.keypress("a"));
    app._input(TEST.keypress("t"));

    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("eat");
    expect(widget.text()).toEqual("eat");
    expect(widget.isValid()).toBeTruthy();
  });

  test("make", () => {
    const e = build.input({
      id: "ID",
      text: "val",
      min: 4,
      max: 100,
      minLength: 3,
      maxLength: 10,
      placeholder: "Taco",
      required: true,
      disabled: true,
    });

    expect(e).toBeInstanceOf(Input.Input);
    expect(e.attr("default")).toEqual("val");
    expect(e.text()).toEqual("val");
    expect(e.min).toEqual(0);
    expect(e.max).toEqual(0);
    expect(e.numbersOnly).toBeFalsy();
    expect(e.minLength).toEqual(3);
    expect(e.maxLength).toEqual(10);
    expect(e.attr("placeholder")).toEqual("Taco");
    expect(e.prop("required")).toBeTruthy();
    expect(e.prop("disabled")).toBeTruthy();
  });

  test("make - numbersOnly", () => {
    const e = build.input({
      id: "ID",
      text: "val",
      numbersOnly: true,
      min: 4,
      max: 100,
      minLength: 3,
      maxLength: 10,
      placeholder: "Taco",
      required: true,
      disabled: true,
    });
    expect(e).toBeInstanceOf(Input.Input);
    expect(e.attr("default")).toEqual("val");
    expect(e.text()).toEqual("val");
    expect(e.min).toEqual(4);
    expect(e.max).toEqual(100);
    expect(e.numbersOnly).toBeTruthy();
    expect(e.minLength).toEqual(0);
    expect(e.maxLength).toEqual(0);
    expect(e.attr("placeholder")).toEqual("Taco");
    expect(e.prop("required")).toBeTruthy();
    expect(e.prop("disabled")).toBeTruthy();
  });

  test("typing", async () => {
    const el = build.input({ width: 10, id: "ID" });

    vi.spyOn(el, "emit");
    el.focus();
    // @ts-ignore
    el.emit.mockClear();

    app._input(TEST.keypress("t"));
    expect(el.emit).toHaveBeenCalledWith("change");

    app._input(TEST.keypress("e"));
    app._input(TEST.keypress("s"));
    app._input(TEST.keypress("t"));
    expect(el.emit).toHaveBeenCalledTimes(4);

    expect(el.text()).toEqual("test");

    // @ts-ignore
    el.emit.mockClear();
    app._input(TEST.keypress("Backspace"));
    expect(el.text()).toEqual("tes");
    expect(el.emit).toHaveBeenCalledWith("change");

    // @ts-ignore
    el.emit.mockClear();
    el.blur();
    expect(el.emit).not.toHaveBeenCalledWith("change");
    expect(el.emit).toHaveBeenCalledWith("blur", { reverse: false });
    expect(el.emit).toHaveBeenCalledWith("action");
  });

  test("backspace + delete", () => {
    const widget = build.input({
      id: "ID",
      width: 15,
      text: "Test",
      x: 0,
      y: 0,
    });

    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(0);
    expect(widget.bounds.width).toEqual(15);
    expect(widget.bounds.height).toEqual(1);
    expect(widget.text()).toEqual("Test");

    app._draw();
    // buffer.dump();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Test"); // default

    app._input(TEST.keypress("Backspace"));
    app._input(TEST.keypress("Delete"));
    app._input(TEST.keypress("Backspace"));
    app._input(TEST.keypress("a"));
    app._input(TEST.keypress("c"));
    app._input(TEST.keypress("o"));
    expect(widget.text()).toEqual("Taco");

    app._draw();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Taco");
    expect(widget.isValid()).toBeTruthy();
  });

  test("Enter - fire Event", async () => {
    let widget = build.input({
      id: "ID",
      width: 10,
      text: "Test",
    });

    const actionFn = vi.fn();
    scene.on("ID", actionFn);
    expect(widget.attr("action")).toEqual("ID");

    app._input(TEST.keypress("Enter"));
    expect(actionFn).toHaveBeenCalled();

    widget = build.input({
      id: "ID",
      width: 10,
      text: "Test",
      action: "DONE",
    });
    scene.setFocusWidget(widget);
    const doneFn = vi.fn();
    widget.on("action", doneFn);

    app._input(TEST.keypress("Enter"));
    expect(doneFn).toHaveBeenCalled();
  });

  describe("isValid", () => {
    test("basic text", () => {
      const el = build.input({ id: "ID " });

      expect(el.prop("empty")).toBeTruthy();
      expect(el.prop("valid")).toBeTruthy();

      el.text("test");
      expect(el.prop("valid")).toBeTruthy();
      expect(el.prop("empty")).toBeFalsy();

      el.text("");
      expect(el.prop("valid")).toBeTruthy();
      expect(el.prop("empty")).toBeTruthy();
    });

    test("min/max Length", () => {
      const el = build.input({
        id: "ID",
        minLength: 3,
        maxLength: 6,
      });

      expect(el.maxLength).toEqual(6);
      expect(el.minLength).toEqual(3);

      expect(el.text()).toEqual("");
      expect(el.prop("empty")).toBeTruthy();
      expect(el.prop("valid")).toBeFalsy();

      el.text("test");
      expect(el.prop("valid")).toBeTruthy();
      expect(el.prop("empty")).toBeFalsy();

      el.text("te");
      expect(el.prop("valid")).toBeFalsy();
      expect(el.prop("empty")).toBeFalsy();

      el.text("");
      expect(el.prop("valid")).toBeFalsy();
      expect(el.prop("empty")).toBeTruthy();
    });

    test("required", () => {
      const el = build.input({ id: "ID", required: true });

      // console.log(el._props, el._attrs);
      expect(el.text()).toEqual("");
      expect(el.prop("required")).toBeTruthy();
      expect(el.prop("empty")).toBeTruthy();
      expect(el.prop("valid")).toBeFalsy();

      el.prop("required", false);
      expect(el.prop("valid")).toBeTruthy();
      expect(el.prop("empty")).toBeTruthy();

      el.prop("required", true);
      expect(el.prop("valid")).toBeFalsy();
      expect(el.prop("empty")).toBeTruthy();

      el.text("test");
      expect(el.prop("valid")).toBeTruthy();
      expect(el.prop("empty")).toBeFalsy();

      el.text("");
      expect(el.prop("valid")).toBeFalsy();
      expect(el.prop("empty")).toBeTruthy();
    });

    test("min/max", () => {
      const el = build.input({
        id: "ID",
        numbersOnly: true,
        min: 3,
        max: 16,
      });

      expect(el.text()).toEqual("");
      expect(el.prop("valid")).toBeFalsy();

      el.text("5");
      expect(el.prop("valid")).toBeTruthy();

      el.text("15");
      expect(el.prop("valid")).toBeTruthy();

      el.text("2");
      expect(el.prop("valid")).toBeFalsy();
      el.text("21");
      expect(el.prop("valid")).toBeFalsy();
      el.text("");
      expect(el.prop("valid")).toBeFalsy();
    });

    test("min/max - text ignores", () => {
      const el = build.input({ id: "ID", min: 3, max: 16 });

      expect(el.text()).toEqual("");
      expect(el.prop("valid")).toBeTruthy();

      el.text("5");
      expect(el.prop("valid")).toBeTruthy();

      el.text("15");
      expect(el.prop("valid")).toBeTruthy();

      el.text("2");
      expect(el.prop("valid")).toBeTruthy();
      el.text("21");
      expect(el.prop("valid")).toBeTruthy();
      el.text("");
      expect(el.prop("valid")).toBeTruthy();
    });
  });
});
