import { expect, test, describe, vi, beforeEach } from "vitest";
import * as WIDGET from "./index";

describe("make", () => {
  test("add function", () => {
    const draw = vi.fn();
    const update = vi.fn();
    const setTech = vi.fn();
    const eat = vi.fn();

    const w = WIDGET.make({
      tag: "TECH",
      id: "TECH",

      draw,
      update,
      on: { eat },
      with: { setTech },
    });

    w.setTech("advanced");

    expect(setTech).toHaveBeenCalledWith("advanced");
  });
});
