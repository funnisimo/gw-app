// import * as IO from './io';
import * as UTILS from "gw-utils/utils.js";

// TODO - Support event handler ordering
//      - Use prefixes for event names for "easy" ordering
//      - e.g. - "+tick", "<update"
//      - { ^: FIRST(10),  <: VERY_EARLY(25), -: EARLY(40), @: NORMAL(50), +: LATE(60), >: VERY_LATE(75), $: LAST(90) }
//      - CallbackInfo.order: number=NORMAL(50) << default
//      - on(ev,fn,opts?: number | { order?: number, ctx?: any })
//      - once(ev, fn, opts?: number | { order?: number, ctx?: any })
//      - Each addition (on, once) is added in sorted order.
// TODO - Support stopping event propagation
//      - export function stopPropagation() { if (propStack.length > 0) {propStack[propStack.length - 1] = true; } }
//      - during emit... propStack.push(false), {loop} if (propStack.at(-1) === true) { return; }, propStack.pop()
//      - to use...  {in handler} GWU.app.stopPropagation();
// TODO - move events to GWU.event.*

export type CancelFn = () => void;

export type CallbackFn = (...args: any[]) => void;
export interface CallbackObj {
  [event: string]: CallbackFn;
}

interface CallbackInfo {
  fn: CallbackFn;
  ctx?: any;
  once?: boolean;
}

export type UnhandledFn = (ev: string, ...args: any[]) => void;

export class Events {
  _events: Record<string, (CallbackInfo | null)[]> = {};
  _ctx: any;

  onUnhandled: UnhandledFn | null = null;

  constructor(ctx?: any, events?: CallbackObj) {
    this._ctx = ctx;
    if (events) {
      this.on(events);
    }
  }

  has(name: string): boolean {
    const events = this._events[name];
    if (!events) return false;
    return events.some((e) => e && e.fn);
  }

  // TODO - Move this to overload of 'on'
  on(cfg: CallbackObj): CancelFn;
  on(ev: string | string[], fn: CallbackFn): CancelFn;
  on(...args: any[]) {
    if (args.length === 1) {
      const cancel = Object.entries(args[0] as CallbackObj).map(([ev, cb]) =>
        this.on(ev, cb)
      );
      return () => cancel.forEach((c) => c());
    }

    const ev = args[0];
    const fn = args[1];

    if (Array.isArray(ev)) {
      const cleanup = ev.map((e) => this.on(e, fn));
      return () => {
        cleanup.forEach((c) => c());
      };
    }

    if (!(ev in this._events)) {
      this._events[ev] = [];
    }
    const info = { fn };
    this._events[ev].unshift(info); // add to front
    return () => {
      UTILS.arrayNullify(this._events[ev], info);
    };
  }

  once(ev: string | string[], fn: CallbackFn): CancelFn {
    if (Array.isArray(ev)) {
      const cleanup = ev.map((e) => this.on(e, fn));
      return () => {
        cleanup.forEach((c) => c());
      };
    }

    if (!(ev in this._events)) {
      this._events[ev] = [];
    }
    const info = { fn, once: true };
    this._events[ev].unshift(info); // add to front
    return () => {
      UTILS.arrayNullify(this._events[ev], info);
    };
  }

  off(ev: string | string[], cb?: CallbackFn): void {
    if (Array.isArray(ev)) {
      ev.forEach((e) => this.off(e, cb));
      return;
    }

    const events = this._events[ev];
    if (!events) return;

    if (!cb) {
      for (let i = 0; i < events.length; ++i) {
        events[i] = null;
      }
      return;
    }

    const current = events.findIndex((i) => i && i.fn === cb);
    if (current > -1) {
      events[current] = null;
    }
  }

  emit(ev: string | string[], ...args: any[]): boolean {
    if (Array.isArray(ev)) {
      let success = false;
      for (let name of ev) {
        success = this.emit(name, ...args) || success;
      }
      return success;
    }

    const events = this._events[ev];
    if (!events || events.length == 0) {
      return this._unhandled(ev, args);
    }
    // newer events first (especially for input)
    events.forEach((info) => {
      // TODO - stopImmediatePropagation - how to check?
      info && info.fn.call(this._ctx, ...args);
    });

    this._events[ev] = events.filter((i) => i && !i.once);
    return true;
  }

  _unhandled(ev: string, args: any[]): boolean {
    if (!this.onUnhandled) return false;
    this.onUnhandled.call(this._ctx, ev, ...args);
    return true;
  }

  clear() {
    this._events = {};
    this.onUnhandled = null;
  }

  // TODO - why is this here since we have: events.off(name)??
  /** @deprecated */
  clear_event(name: string) {
    if (name in this._events) {
      // Why the new array instead of making each null?  This will not change a currently running emit
      this._events[name] = this._events[name].map(() => null);
    }
  }

  // TODO - What is this for?
  /** @deprecated */
  restart() {
    Object.keys(this._events).forEach((ev) => {
      this._events[ev] = this._events[ev].filter((i) => i && !i.once);
    });
    this.onUnhandled = null;
  }
}
