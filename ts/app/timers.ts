import * as EVENTS from "./events.js";
import * as UTILS from "gw-utils/utils.js";

export type TimerFn = () => void | boolean;

interface TimerInfo {
  delay: number;
  fn: TimerFn;
  repeat: number;
}

export class Timers {
  _timers: TimerInfo[] = [];
  _ctx: any;

  constructor(ctx?: any) {
    this._ctx = ctx;
  }

  get length() {
    return this._timers.length;
  }

  clear() {
    this._timers = [];
  }

  // Clears all one time timers and resets all repeating timers
  restart() {
    this._timers.forEach((i) => {
      i.delay = i.repeat || 0;
    });
    this._timers = this._timers.filter((i) => i.delay > 0);
  }

  setTimeout(fn: TimerFn, delay: number): EVENTS.CancelFn {
    const info = {
      fn,
      delay,
      repeat: 0,
    };
    this._timers.push(info);
    return () => UTILS.arrayDelete(this._timers, info);
  }

  setInterval(fn: TimerFn, delay: number): EVENTS.CancelFn {
    const info = {
      fn,
      delay,
      repeat: delay,
    };
    this._timers.push(info);
    return () => UTILS.arrayDelete(this._timers, info);
  }

  update(dt: number): void {
    if (!this._timers.length) return;
    let needFilter = false;

    this._timers.forEach((info) => {
      info.delay -= dt;
      if (info.delay <= 0) {
        const result = info.fn.call(this._ctx);
        if (info.repeat && result !== false) {
          info.delay += info.repeat;
          if (info.delay < 0) {
            info.delay = info.repeat;
          }
        }
      }
      needFilter = needFilter || info.delay <= 0;
    });

    if (needFilter) {
      this._timers = this._timers.filter((info) => info.delay > 0);
    }
  }
}
