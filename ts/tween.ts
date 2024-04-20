// Tweeing API based on - http://tweenjs.github.io/tween.js/

import * as EVENTS from "./app/events.js";
import * as Utils from "gw-utils/utils.js";

// export type AnyObj = Record<string, any>;
export type TweenCb<T> = (obj: T, dt: number) => any;
export type TweenFinishCb<T> = (obj: T, success: boolean) => any;

export type EasingFn = (v: number) => number;
export type InterpolateFn = (start: any, goal: any, pct: number) => any;

export class BaseObj<T extends { update(t: number): void }> {
  events = new EVENTS.Events(this);
  children: T[] = [];

  on(ev: string | string[], fn: EVENTS.CallbackFn): this {
    this.events.on(ev, fn);
    return this;
  }

  once(ev: string | string[], fn: EVENTS.CallbackFn): this {
    this.events.once(ev, fn);
    return this;
  }

  off(ev: string | string[], fn: EVENTS.CallbackFn): this {
    this.events.off(ev, fn);
    return this;
  }

  emit(ev: string | string[], ...args: any[]): boolean {
    return this.events.emit(ev, ...args);
  }

  addChild(t: T): this {
    this.children.push(t);
    return this;
  }

  removeChild(t: T): this {
    Utils.arrayDelete(this.children, t);
    return this;
  }

  update(dt: number) {
    this.children.forEach((c) => c.update(dt));
    this.emit("update", dt);
  }
}

export interface TweenUpdate {
  isRunning(): boolean;
  update(dt: number): void;
}

export class Tween<T> extends BaseObj<Tween<T>> implements TweenUpdate {
  _obj: T;

  _repeat = 0;
  _count = 0;
  _from = false;

  _duration = 0;
  _delay = 0;
  _repeatDelay = -1;
  _yoyo = false;

  _time = Number.MAX_SAFE_INTEGER;
  _startTime = 0;

  _goal: Partial<Record<keyof T, any>> = {};
  _start: Partial<Record<keyof T, any>> = {};
  _success = true;

  // _startCb: TweenCb | null = null;
  // _updateCb: TweenCb | null = null;
  // _repeatCb: TweenCb | null = null;
  // _finishCb: TweenFinishCb | null = null;

  _easing: EasingFn = linear;
  _interpolate: InterpolateFn = interpolate;

  constructor(src: T) {
    super();
    this._obj = src;
  }

  isRunning(): boolean {
    return (
      this._startTime > 0 ||
      this._time < this._duration ||
      this.children.length > 0
    );
  }

  onStart(cb: TweenCb<T>): this {
    this.on("start", cb);
    return this;
  }

  onUpdate(cb: TweenCb<T>): this {
    this.on("update", cb);
    return this;
  }

  onRepeat(cb: TweenCb<T>): this {
    this.on("repeat", cb);
    return this;
  }

  onFinish(cb: TweenFinishCb<T>): this {
    this.on("stop", cb);
    return this;
  }

  to(
    goal: Partial<Record<keyof T, any>>,
    dynamic?: boolean | Array<keyof T>
  ): this {
    if (dynamic) {
      if (typeof dynamic === "boolean") {
        dynamic = Object.keys(goal) as Array<keyof T>;
      }
      this._goal = {};
      dynamic.forEach((key) => {
        this._goal[key] = () => goal[key];
      });
    } else {
      this._goal = goal;
    }
    // this._from = false;

    if (Object.keys(this._start).length == 0) {
      Object.keys(this._goal).forEach((k) => {
        this._start[k as keyof T] = this._obj[k as keyof T];
      });
    }

    return this;
  }

  from(
    start: Partial<Record<keyof T, any>>,
    dynamic?: boolean | Array<keyof T>
  ): this {
    if (dynamic) {
      if (typeof dynamic === "boolean") {
        dynamic = Object.keys(start) as Array<keyof T>;
      }
      this._start = {};
      dynamic.forEach((key) => {
        this._start[key] = () => start[key];
      });
    } else {
      this._start = start;
    }

    if (Object.keys(this._goal).length == 0) {
      Object.keys(this._start).forEach((k) => {
        this._goal[k as keyof T] = this._obj[k as keyof T];
      });
    }

    return this;
  }

  duration(): number;
  duration(v: number): this;
  duration(v?: number): this | number {
    if (v === undefined) return this._duration;
    this._duration = v;
    return this;
  }

  repeat(): number;
  repeat(v: number): this;
  repeat(v?: number): this | number {
    if (v === undefined) return this._repeat;
    this._repeat = v;
    return this;
  }

  delay(): number;
  delay(v: number): this;
  delay(v?: number): this | number {
    if (v === undefined) return this._delay;
    this._delay = v;
    return this;
  }

  repeatDelay(): number;
  repeatDelay(v: number): this;
  repeatDelay(v?: number): this | number {
    if (v === undefined) return this._repeatDelay;
    this._repeatDelay = v;
    return this;
  }

  yoyo(): boolean;
  yoyo(v: boolean): this;
  yoyo(v?: boolean): this | boolean {
    if (v === undefined) return this._yoyo;
    this._yoyo = v;
    return this;
  }

  start(animator?: { add: (tween: Tween<T>) => void }): this {
    this._success = true;
    if (this._time > 0) {
      this._time = 0;
      this._startTime = this._delay;
      this._count = 0;

      // if (this._from) {
      // this._goal = {};
      // Object.keys(this._start).forEach(
      //     (key) =>
      //         (this._goal[key as keyof T] = this._obj[key as keyof T])
      // );
      // } else {
      // this._start = {};
      // Object.keys(this._goal).forEach(
      //     (key) =>
      //         (this._start[key as keyof T] = this._obj[
      //             key as keyof T
      //         ])
      // );
      //     this._updateProperties(this._obj, this._start, this._goal, 0);
      // }

      this._updateProperties(this._obj, this._start, this._goal, 0);
    }

    if (animator) {
      animator.add(this);
    }

    return this;
  }

  update(dt: number): void {
    if (!this.isRunning()) return;

    this.children.forEach((c) => c.update(dt));
    this.children = this.children.filter((c) => c.isRunning());

    this._time += dt;
    if (this._startTime) {
      if (this._startTime > this._time) return;
      this._time -= this._startTime;
      this._startTime = 0;
      if (this._count > 0) this._restart();
    }

    if (this._count === 0) {
      this._restart();
    }

    const pct = this._easing(this._time / this._duration);

    let madeChange = this._updateProperties(
      this._obj,
      this._start,
      this._goal,
      pct
    );

    if (madeChange) {
      this.emit("update", this._obj, pct);
    }

    if (this._time >= this._duration) {
      if (this._repeat > this._count || this._repeat < 0) {
        this._time = this._time % this._duration;
        this._startTime =
          this._repeatDelay > -1 ? this._repeatDelay : this._delay;
        if (this._yoyo) {
          [this._start, this._goal] = [this._goal, this._start];
        }
        if (!this._startTime) {
          this._restart();
        }
      } else if (!this.isRunning()) {
        this.emit("stop", this._obj, this._success);
      }
    }
  }

  _restart() {
    ++this._count;

    // reset starting values
    // Object.entries(this._start).forEach(([key, value]) => {
    //     // @ts-ignore
    //     this._obj[key] = value;
    // });
    this._updateProperties(this._obj, this._start, this._goal, 0);

    if (this._count == 1) {
      this.emit("start", this._obj, 0);
    } else {
      this.emit("repeat", this._obj, this._count) ||
        this.emit("update", this._obj, 0);
    }
  }

  // gameTick(_dt: number): boolean {
  //     return false;
  // }

  stop(success = false): void {
    this._success = success;
    this._time = Number.MAX_SAFE_INTEGER;
    this.children.forEach((c) => c.stop(success));
  }

  _updateProperties(
    obj: T,
    start: Partial<T>,
    goal: Partial<T>,
    pct: number
  ): boolean {
    let madeChange = false;
    Object.entries(goal).forEach(([field, goalV]) => {
      let currentV = obj[field as keyof T];
      let startV = start[field as keyof T];

      if (typeof startV === "function") {
        startV = startV.call(start);
      }
      if (typeof goalV === "function") {
        goalV = goalV.call(obj);
      }

      const updatedV = this._interpolate(startV, goalV, pct);
      if (updatedV !== currentV) {
        obj[field as keyof T] = updatedV;
        madeChange = true;
      }
    });
    return madeChange;
  }
}

export function make<T>(src: T, duration = 1000): Tween<T> {
  return new Tween(src).duration(duration);
}

export const move = make;

export function linear(pct: number): number {
  return Utils.clamp(pct, 0, 1);
}

// TODO - string, bool, Color
export function interpolate(start: any, goal: any, pct: number): any {
  const startIsBinary = typeof start !== "number";
  const goalIsBinary = typeof goal !== "number";
  if (startIsBinary || goalIsBinary) {
    return Math.floor(pct) == 0 ? start : goal;
  }

  return Math.round((goal - start) * pct) + start;
}
