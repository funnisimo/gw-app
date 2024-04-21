import { expect, test, describe, vi, beforeEach } from "vitest";
import "jest-extended";
import "../../test/matchers";

import * as TEST from "../../test/utils";
import * as Color from "gw-canvas/color";
import * as Buffer from "gw-canvas/buffer";

import * as APP from "../app";
import * as CANVAS from "gw-canvas/canvas";

import * as Text from "./text";

describe("Text Widget", () => {
  let canvas: CANVAS.Canvas;
  let app: APP.App;
  let scene: APP.Scene;

  beforeEach(() => {
    canvas = TEST.mockCanvas();
    app = APP.make({ canvas, start: false, scene: true });
    scene = app.scene;
  });

  test("text create empty", () => {
    // Takes everything
    let widget = new Text.Text({
      scene,
      id: "TEST",
      width: 30,
      text: "",
    });

    expect(widget.text()).toEqual("");
    expect(widget.bounds.width).toEqual(30);
    expect(widget.bounds.height).toEqual(1);
    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(0);

    expect(widget.scene).toBe(scene);
    expect(widget.parent).toBeNull();
    // expect(scene._depthOrder).toContain(widget);
    // expect(scene._attachOrder).toContain(widget);
  });

  test("text create", () => {
    // Takes everything
    let widget = new Text.Text({
      scene,
      id: "TEST",
      text: "Testing a long message.",
    });

    expect(widget.text()).toEqual("Testing a long message.");
    expect(widget.bounds.width).toEqual(23);
    expect(widget.bounds.height).toEqual(1);
    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(0);

    expect(widget.scene).toBe(scene);
    expect(widget.parent).toBeNull();
    // expect(scene._depthOrder).toContain(widget);
    // expect(scene._attachOrder).toContain(widget);
  });

  test("text width", () => {
    // Takes everything
    let widget = new Text.Text({
      scene,
      text: "Testing a long message.",
      id: "TEST",
    });

    expect(widget.text()).toEqual("Testing a long message.");
    expect(widget.bounds.width).toEqual(23);
    expect(widget.bounds.height).toEqual(1);
    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(0);

    // expect(scene.pos()).toMatchObject({ x: 0, y: 1 }); // text auto moves to next line

    // Truncates
    widget = new Text.Text({
      scene,
      text: "Testing a long message.",
      id: "TEST",
      width: 20,
      height: 1,
      top: 1,
    });

    expect(widget.text()).toEqual("Testing a long message.");
    expect(widget._lines).toEqual(["Testing a long"]);
    expect(widget.bounds.width).toEqual(20);
    expect(widget.bounds.height).toEqual(1);
    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(1);

    // Wraps
    widget = new Text.Text({
      scene,
      text: "Testing a long message.",
      id: "TEST",
      width: 20,
      x: 0,
      y: 0,
      top: 2,
    });

    expect(widget.text()).toEqual("Testing a long message.");
    expect(widget.bounds.width).toEqual(20);
    expect(widget.bounds.height).toEqual(2);
    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(2);

    // expect(scene.pos()).toMatchObject({ x: 0, y: 2 }); // If you set the pos, then we move to the next line

    expect(widget._lines).toEqual(["Testing a long", "message."]);

    const buffer = new Buffer.Buffer(100, 40);
    widget.draw(buffer);
    // buffer.dump();
    expect(TEST.getBufferText(buffer, 0, 2, 20)).toEqual("Testing a long");
    expect(TEST.getBufferText(buffer, 0, 3, 20)).toEqual("message.");
  });

  test("draw", () => {
    const widget = new Text.Text({
      scene,
      id: "TEST",
      fg: "red",
      x: 0,
      y: 0,
      text: "Test",
    });

    expect(widget.text()).toEqual("Test");
    expect(widget._lines).toEqual(["Test"]);
    expect(widget.bounds.x).toEqual(0);
    expect(widget.bounds.y).toEqual(0);
    expect(widget.bounds.width).toEqual(4);
    expect(widget.bounds.height).toEqual(1);

    const buffer = new Buffer.Buffer(100, 40);
    widget.draw(buffer);
    // buffer.dump();
    expect(TEST.getBufferText(buffer, 0, 0, 10)).toEqual("Test");
    expect(buffer.get(0, 0).fg).toEqual(Color.colors.red);
    expect(buffer.get(1, 0).fg).toEqual(Color.colors.red);
    expect(buffer.get(2, 0).fg).toEqual(Color.colors.red);
    expect(buffer.get(3, 0).fg).toEqual(Color.colors.red);
    expect(buffer.get(4, 0).fg).toEqual(Color.colors.NONE); // TODO < Is this correct?  Should it be BLACK
  });
});
