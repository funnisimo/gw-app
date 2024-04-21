import { expect, test, describe, vi, beforeEach } from "vitest";
import * as Events from "./events";

describe("GW.events", () => {
  // test('Listener', () => {
  //     const fn = vi.fn();
  //     const ctx = {};
  //     const a = new Events.Events(fn, ctx, true);
  //     expect(a.fn).toBe(fn);
  //     expect(a.context).toBe(ctx);
  //     expect(a.once).toBeTruthy();

  //     const b = new Events.Events(fn);
  //     expect(b.fn).toBe(fn);
  //     expect(b.context).toBeNull();
  //     expect(b.once).toBeFalsy();

  //     const fn2 = vi.fn();
  //     const ctx2 = {};
  //     expect(a.matches(fn, ctx, true)).toBeTruthy();
  //     expect(a.matches(fn)).toBeTruthy();
  //     expect(a.matches(fn, ctx)).toBeTruthy();
  //     expect(a.matches(fn, ctx2)).toBeFalsy();
  //     expect(a.matches(fn2)).toBeFalsy();
  // });

  // interface TestEvents {
  //     test: (a: number, b: number, c: number) => void;
  //     other: () => void;
  // }

  let events: Events.Events;

  beforeEach(() => {
    events = new Events.Events();
  });

  test("basic event", () => {
    const listener = vi.fn();
    events.on("test", listener);
    events.emit("test", 1, 2, 3);
    expect(listener).toHaveBeenCalledWith(1, 2, 3);
  });

  test("handler must be function", () => {
    // @ts-ignore
    expect(() => events.addListener("test", "test")).toThrow();
  });

  test("basic event removing", () => {
    const listener = vi.fn();
    events.on("test", listener);
    events.off("test", listener);
    events.emit("test", 1, 2, 3);
    expect(listener).not.toHaveBeenCalled();
  });

  test("multiple calls", () => {
    const listener = vi.fn();
    events.on("test", listener);
    events.emit("test", 1, 2, 3);
    events.emit("test", 1, 2, 3);
    expect(listener).toHaveBeenCalledTimes(2);

    expect(events.emit("other")).toBeFalsy();
  });

  test("once", () => {
    const listener = vi.fn();
    events.once("test", listener);
    events.emit("test", 1, 2, 3);
    events.emit("test", 1, 2, 3);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("multiple listeners", () => {
    const a = vi.fn();
    const cancel_a = events.on("test", a);

    const b = vi.fn();
    events.on("test", b);

    const c = vi.fn();
    const cancel_c = events.on("test", c);

    events.emit("test", 1, 2, 3);
    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(2);

    a.mockReset();
    b.mockReset();
    c.mockReset();

    cancel_a();
    cancel_a();
    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(0);
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(1);

    cancel_c();

    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(0);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(1);

    events.clear_event("test");
    events.clear_event("other");

    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(0);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(1);
  });

  test("multiple listeners, some with once", () => {
    const a = vi.fn();
    events.on("test", a);

    const b = vi.fn();
    events.once("test", b);

    const c = vi.fn();
    events.on("test", c);

    events.emit("test", 1, 2, 3);
    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(2);

    events.off("test", b); // Does nothing - already removed
    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(3);
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(3);

    events.off("test", c);
    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(4);
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(3);

    events.clear_event("test");
    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(4);
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(3);
  });

  test("multiple listeners, first with once", () => {
    const a = vi.fn();
    events.once("test", a);

    const b = vi.fn();
    events.on("test", b);

    const c = vi.fn();
    events.once("test", c);

    events.emit("test", 1, 2, 3);
    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(1);

    events.clear_event("test");
    events.off("test", a);
    events.off("test", b);
    events.off("test", c);
  });

  test("multiple  listeners, multiple events", () => {
    const a = vi.fn().mockResolvedValue(true);
    events.on("test", a);

    const b = vi.fn().mockResolvedValue(true);
    events.on("test", b);

    const c = vi.fn().mockResolvedValue(true);
    events.on("test", c);

    events.emit("test", 1, 2, 3);
    events.emit("test", 1, 2, 3);
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(2);

    events.clear();
    events.off("test", a);
    events.off("test", b);
    events.off("test", c);
  });
});
