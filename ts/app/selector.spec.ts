import { expect, test, describe, vi, beforeEach } from "vitest";
// import * as GWU from 'gw-utils/dist';
import * as Selector from "./selector";
// import * as Types from './types';

describe("selector", () => {
  interface SelectableOptions {
    id?: string;
    tag?: string;
    props?: Record<string, boolean>;
    attrs?: Record<string, string>;
    classes?: string[];
    parent?: Selector.UISelectable;
    children?: Selector.UISelectable[];
  }

  function mockSelectable(opts: SelectableOptions = {}) {
    return {
      id: opts.id || "",
      props: opts.props || {},
      attrs: opts.attrs || {},
      tag: opts.tag || "tag",
      attr(name: string): string | undefined {
        if (name === "id") return this.id;
        return this.attrs[name];
      },
      prop(name: string) {
        return this.props[name];
      },
      classes: opts.classes ? opts.classes.slice() : [],
      parent: opts.parent || null,
      children: opts.children || [],
    };
  }

  test("priority", () => {
    // global
    expect(Selector.compile("*").priority).toEqual(0);
    expect(Selector.compile("*:hovered").priority).toEqual(2);
    expect(Selector.compile(":hovered").priority).toEqual(2);

    // tag (+/- class)
    expect(Selector.compile("text").priority).toEqual(10);
    expect(Selector.compile("text:hovered").priority).toEqual(12);
    expect(Selector.compile("text.class").priority).toEqual(110);
    expect(Selector.compile("text.class:hovered").priority).toEqual(112);

    expect(Selector.compile("td:odd").priority).toEqual(11);
    expect(Selector.compile("td:even").priority).toEqual(11);

    // class
    expect(Selector.compile(".class").priority).toEqual(100);
    expect(Selector.compile(".class:hovered").priority).toEqual(102);

    // id
    expect(Selector.compile("#id").priority).toEqual(1000);
    expect(Selector.compile("#id.class").priority).toEqual(1100);
    expect(Selector.compile("#id.class:hovered").priority).toEqual(1102);
    expect(Selector.compile("#id:hovered").priority).toEqual(1002);

    // local
    expect(Selector.compile("$").priority).toEqual(10000);
  });

  test("default", () => {
    const s = new Selector.Selector("*");

    const obj = mockSelectable();
    expect(s.matches(obj)).toBeTruthy();
  });

  test("id", () => {
    const s = new Selector.Selector("#id");

    const obj = mockSelectable({ id: "id" });
    expect(s.matches(obj)).toBeTruthy();
    obj.id = "other";
    expect(s.matches(obj)).toBeFalsy();
  });

  test("tag", () => {
    const s = new Selector.Selector("text");
    // expect(s.tag).toEqual('text');

    const obj = mockSelectable({ tag: "tag" });
    expect(s.matches(obj)).toBeFalsy();

    obj.tag = "text";
    expect(s.matches(obj)).toBeTruthy();

    obj.classes = ["a", "b", "c"];
    expect(s.matches(obj)).toBeTruthy();

    obj.props = { a: true, b: true, c: true };
    expect(s.matches(obj)).toBeTruthy();
  });

  test("tag.className", () => {
    const s = new Selector.Selector("text.a");
    // expect(s.tag).toEqual('text');

    const obj = mockSelectable({ tag: "tag" });
    expect(s.matches(obj)).toBeFalsy();

    obj.tag = "text";
    expect(s.matches(obj)).toBeFalsy();

    obj.props = { a: true, b: true, c: true };
    expect(s.matches(obj)).toBeFalsy();

    obj.classes = ["a", "b", "c"];
    expect(s.matches(obj)).toBeTruthy();

    obj.props = {};
    expect(s.matches(obj)).toBeTruthy();
  });

  test("tag:prop", () => {
    const s = new Selector.Selector("text:a");
    // expect(s.tag).toEqual('text');

    const obj = mockSelectable({ tag: "tag" });
    expect(s.matches(obj)).toBeFalsy();

    obj.tag = "text";
    expect(s.matches(obj)).toBeFalsy();

    obj.props = { a: true, b: true, c: true };
    expect(s.matches(obj)).toBeTruthy();

    obj.classes = ["a", "b", "c"];
    expect(s.matches(obj)).toBeTruthy();

    obj.props = { a: false };
    expect(s.matches(obj)).toBeFalsy();

    obj.props = { a: false };
    expect(s.matches(obj)).toBeFalsy();

    obj.props = { a: true };
    expect(s.matches(obj)).toBeTruthy();
  });

  test("tag.class:prop", () => {
    const s = new Selector.Selector("text.b:a");
    // expect(s.tag).toEqual('text');

    const obj = mockSelectable({ tag: "tag" });
    expect(s.matches(obj)).toBeFalsy();

    obj.tag = "text";
    expect(s.matches(obj)).toBeFalsy();

    obj.props = { a: true, b: true, c: true };
    expect(s.matches(obj)).toBeFalsy();

    obj.classes = ["a", "b", "c"];
    expect(s.matches(obj)).toBeTruthy();

    obj.props = { a: false };
    expect(s.matches(obj)).toBeFalsy();

    obj.props = { a: true };
    expect(s.matches(obj)).toBeTruthy();

    obj.classes = ["a", "c"];
    expect(s.matches(obj)).toBeFalsy();
  });

  test("#id.class:prop", () => {
    const s = new Selector.Selector("#id.b:a");
    // expect(s.tag).toEqual('');
    // expect(s.id).toEqual('id');

    const obj = mockSelectable({ id: "other" });
    expect(s.matches(obj)).toBeFalsy();

    obj.id = "id";
    expect(s.matches(obj)).toBeFalsy();

    obj.props = { a: true, b: true, c: true };
    expect(s.matches(obj)).toBeFalsy();

    obj.classes = ["a", "b", "c"];
    expect(s.matches(obj)).toBeTruthy();

    obj.props = { a: false };
    expect(s.matches(obj)).toBeFalsy();

    obj.props = { a: true };
    expect(s.matches(obj)).toBeTruthy();

    obj.classes = ["a", "c"];
    expect(s.matches(obj)).toBeFalsy();
  });

  test("a:first", () => {
    const s = new Selector.Selector("a:first");
    // expect(s.tag).toEqual('');
    // expect(s.id).toEqual('id');

    const parent = mockSelectable({ tag: "div" });
    const obj = mockSelectable({ tag: "a", parent });

    expect(s.matches(obj)).toBeFalsy();

    parent.children.push(obj);
    expect(obj.parent).toBe(parent);
    expect(parent.children).toEqual([obj]);

    expect(s.matches(obj)).toBeTruthy();

    const other = mockSelectable({ tag: "a", parent });
    parent.children.push(other);
    expect(s.matches(other)).toBeFalsy();

    expect(s.matches(obj)).toBeTruthy();
  });

  test("a:last", () => {
    const s = new Selector.Selector("a:last");
    // expect(s.tag).toEqual('');
    // expect(s.id).toEqual('id');

    const parent = mockSelectable({ tag: "div" });
    const obj = mockSelectable({ tag: "a", parent });

    expect(s.matches(obj)).toBeFalsy();

    parent.children.push(obj);
    expect(obj.parent).toBe(parent);
    expect(parent.children).toEqual([obj]);
    expect(s.matches(obj)).toBeTruthy();

    const other = mockSelectable({ tag: "a", parent });
    parent.children.push(other);
    expect(s.matches(other)).toBeTruthy();

    expect(s.matches(obj)).toBeFalsy();
  });
});
