// import * as IO from '../io';
import * as XY from "gw-utils/xy.js";
import { Widget } from "./widget.js";

export interface EventType {
  type: string;
  // dir?: XY.Loc | null;
  // key?: string;
  // code?: string;

  defaultPrevented: boolean | undefined;
  propagationStopped: boolean | undefined;
  // immediatePropagationStopped: boolean;

  doDefault(): void;
  preventDefault(): void;

  propagate(): void;
  stopPropagation(): void;
  // stopImmediatePropagation(): void;

  reset(type: string, opts?: Record<string, any>): void;

  [key: string]: any;
}

export class Event implements EventType {
  type!: string;
  target: Widget | null = null; // current handler information

  // Used in UI
  defaultPrevented: boolean | undefined = undefined;
  propagationStopped: boolean | undefined = undefined;
  // immediatePropagationStopped = false;

  // Key Event
  key = "";
  code = "";
  shiftKey = false;
  ctrlKey = false;
  altKey = false;
  metaKey = false;

  // Dir Event extends KeyEvent
  dir: XY.Loc | null = null;

  // Mouse Event
  x = -1;
  y = -1;
  clientX = -1;
  clientY = -1;

  // Tick Event
  dt = 0;

  constructor(type: string, opts?: Partial<Event>) {
    this.reset(type, opts);
  }

  doDefault() {
    this.defaultPrevented = false;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  propagate() {
    this.propagationStopped = false;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }

  // stopImmediatePropagation() {
  //     this.immediatePropagationStopped = true;
  // }

  reset(type: string, opts?: Partial<Event>) {
    this.type = type;
    this.target = null;
    this.defaultPrevented = undefined;
    this.propagationStopped = undefined;

    this.shiftKey = false;
    this.ctrlKey = false;
    this.altKey = false;
    this.metaKey = false;

    this.key = "";
    this.code = "";
    this.x = -1;
    this.y = -1;
    this.dir = null;
    this.dt = 0;
    this.target = null;
    if (opts) {
      Object.assign(this, opts);
    }
  }

  clone(): Event {
    const other = new Event(this.type, this);
    return other;
  }

  dispatch(handler: { emit(name: string, e: Event): boolean }): boolean {
    let didSomething = false;
    if (this.type === KEYPRESS) {
      // this.propagationStopped = true;
      if (this.dir) {
        if (handler.emit("dir", this)) {
          didSomething = true;
        }
      }
      if (!this.propagationStopped) {
        if (handler.emit(this.key, this)) {
          didSomething = true;
        }
      }
      if (this.code !== this.key) {
        if (!this.propagationStopped) {
          if (handler.emit(this.code, this)) {
            didSomething = true;
          }
        }
      }
      if (this.defaultPrevented || this.propagationStopped) return didSomething;
    }
    if (handler.emit(this.type, this)) {
      didSomething = true;
    }
    return didSomething;
  }
}

// export type CommandFn = (
//     event: Event
// ) => boolean | void | Promise<boolean | void>;
// export var commands: Record<string, CommandFn> = {};

// export function addCommand(id: string, fn: CommandFn) {
//     commands[id] = fn;
// }

export type ControlFn = () => void | Promise<void>;

export type EventFn = (
  event: Event
) => boolean | void | Promise<boolean | void>;

export type IOMap = Record<string, EventFn | ControlFn>;
export type EventMatchFn = (event: Event) => boolean;

// let IOMAP: IOMap = {};

const DEAD_EVENTS: Event[] = [];

export const KEYPRESS = "keypress";
export const MOUSEMOVE = "mousemove";
export const CLICK = "click";
export const TICK = "tick";
export const MOUSEUP = "mouseup";
export const STOP = "stop";

const CONTROL_CODES = [
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
  //
  "Enter",
  "Delete",
  "Backspace",
  "Tab",
  "CapsLock",
  "Escape",
];

export function isControlCode(e: string | Event): boolean {
  if (typeof e === "string") {
    return CONTROL_CODES.includes(e);
  }
  return CONTROL_CODES.includes(e.code);
}

// type EventHandler = (event: Event) => void;

// export function setKeymap(keymap: IOMap) {
//     IOMAP = keymap;
// }

// export function handlerFor(ev: EventType, km: Record<string, any>): any | null {
//     let c;
//     if ('dir' in ev) {
//         c = km.dir || km.keypress;
//     } else if (ev.type === KEYPRESS) {
//         c = km[ev.key!] || km[ev.code!] || km.keypress;
//     } else if (km[ev.type]) {
//         c = km[ev.type];
//     }
//     if (!c) {
//         c = km.dispatch;
//     }
//     return c || null;
// }

// export async function dispatchEvent(ev: Event, km: IOMap, thisArg?: any) {
//     let result;

//     km = km || IOMAP;

//     if (ev.type === STOP) {
//         recycleEvent(ev);
//         return true; // Should stop loops, etc...
//     }

//     const handler = handlerFor(ev, km);

//     if (handler) {
//         // if (typeof c === 'function') {
//         result = await handler.call(thisArg || km, ev);
//         // } else if (commands[c]) {
//         //     result = await commands[c](ev);
//         // } else {
//         //     Utils.WARN('No command found: ' + c);
//         // }
//     }

//     // TODO - what is this here for?
//     // if ('next' in km && km.next === false) {
//     //     result = false;
//     // }

//     recycleEvent(ev);
//     return result;
// }

export function recycleEvent(ev: Event) {
  DEAD_EVENTS.push(ev);
}

// STOP

export function makeStopEvent() {
  return makeCustomEvent(STOP);
}

// CUSTOM

export function makeCustomEvent(type: string, opts?: Partial<Event>): Event {
  const ev = DEAD_EVENTS.pop() || null;
  if (!ev) return new Event(type, opts);

  ev.reset(type, opts);
  return ev;
}

// TICK

export function makeTickEvent(dt: number): Event {
  const ev = makeCustomEvent(TICK);
  ev.dt = dt;
  return ev;
}

// KEYBOARD

export function makeKeyEvent(e: KeyboardEvent) {
  let key = e.key;
  let code = e.code; // .toLowerCase();

  if (e.shiftKey) {
    key = key.toUpperCase();
    // code = code.toUpperCase();
  }
  if (e.ctrlKey) {
    key = "^" + key;
    // code = '^' + code;
  }
  if (e.metaKey) {
    key = "#" + key;
    // code = '#' + code;
  }
  if (e.altKey) {
    // code = '/' + code;
  }

  const ev: Event = DEAD_EVENTS.pop() || new Event(KEYPRESS);

  ev.shiftKey = e.shiftKey;
  ev.ctrlKey = e.ctrlKey;
  ev.altKey = e.altKey;
  ev.metaKey = e.metaKey;

  ev.type = KEYPRESS;
  ev.defaultPrevented = undefined;
  ev.propagationStopped = undefined;
  ev.key = key;
  ev.code = code;
  ev.x = -1;
  ev.y = -1;
  ev.clientX = -1;
  ev.clientY = -1;
  ev.dir = keyCodeDirection(e.code);
  ev.dt = 0;
  ev.target = null;

  return ev;
}

export function keyCodeDirection(key: string): XY.Loc | null {
  const lowerKey = key.toLowerCase();

  if (lowerKey === "arrowup") {
    return [0, -1];
  } else if (lowerKey === "arrowdown") {
    return [0, 1];
  } else if (lowerKey === "arrowleft") {
    return [-1, 0];
  } else if (lowerKey === "arrowright") {
    return [1, 0];
  }
  return null;
}

export function ignoreKeyEvent(e: KeyboardEvent) {
  return CONTROL_CODES.includes(e.code);
}

// MOUSE

export function makeMouseEvent(e: MouseEvent, x: number, y: number) {
  const ev: Event = DEAD_EVENTS.pop() || new Event(e.type);

  ev.shiftKey = e.shiftKey;
  ev.ctrlKey = e.ctrlKey;
  ev.altKey = e.altKey;
  ev.metaKey = e.metaKey;

  ev.type = e.type || "mousemove";
  if (e.buttons && e.type !== "mouseup") {
    ev.type = CLICK;
  }
  ev.defaultPrevented = undefined;
  ev.propagationStopped = undefined;
  ev.key = "";
  ev.code = "";
  ev.x = x;
  ev.y = y;
  ev.clientX = e.clientX;
  ev.clientY = e.clientY;
  ev.dir = null;
  ev.dt = 0;
  ev.target = null;

  return ev;
}

export class EventQueue {
  _events: Event[];
  lastClick: XY.XY = { x: -1, y: -1 };

  constructor() {
    this._events = [];
  }

  get length() {
    return this._events.length;
  }

  clear() {
    this._events.length = 0;
  }

  enqueue(ev: Event) {
    if (this._events.length) {
      const last = this._events[this._events.length - 1];
      if (last.type === ev.type) {
        if (last.type === MOUSEMOVE) {
          last.x = ev.x;
          last.y = ev.y;
          recycleEvent(ev);
          return;
        }
      }
    }

    // Keep clicks down to one per cell if holding down mouse button
    if (ev.type === CLICK) {
      if (this.lastClick.x == ev.x && this.lastClick.y == ev.y) {
        if (this._events.findIndex((e) => e.type === CLICK) >= 0) {
          recycleEvent(ev);
          return;
        }
      }
      this.lastClick.x = ev.x;
      this.lastClick.y = ev.y;
    } else if (ev.type == MOUSEUP) {
      this.lastClick.x = -1;
      this.lastClick.y = -1;
      recycleEvent(ev);
      return;
    }

    if (ev.type === TICK) {
      const first = this._events[0];
      if (first && first.type === TICK) {
        first.dt += ev.dt;
        recycleEvent(ev);
        return;
      }
      this._events.unshift(ev); // ticks go first
    } else {
      this._events.push(ev);
    }
  }

  dequeue(): Event | undefined {
    return this._events.shift();
  }

  peek(): Event | undefined {
    return this._events[0];
  }
}
