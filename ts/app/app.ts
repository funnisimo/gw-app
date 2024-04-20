import * as CANVAS from "gw-canvas/index.js";
import * as EVENTS from "./events.js";
import * as IO from "./io.js";

import { Loop } from "./loop.js";
import * as TIMERS from "./timers.js";
import { Scenes } from "./scenes.js";
import * as SCENE from "./scene.js";
import { AlertOptions } from "../scenes/alert.js";
import { ConfirmOptions } from "../scenes/confirm.js";
import { PromptOptions, PromptScene } from "../scenes/prompt.js";
import * as STYLE from "./style.js";
import { Buffer } from "gw-canvas/buffer.js";
import * as rng from "gw-utils/rng.js";
import { SceneStartOpts } from "./scene.js";
import { mergeDeep } from "gw-utils/object.js";
// import * as COLOR from '../color/index.js';

declare global {
  var APP: App;
}

export interface AppOptsBase {
  // CanvasBase
  width?: number;
  height?: number;
  glyphs?: CANVAS.Glyphs;
  seed?: number;
  // io?: true; // if true, hookup events to standard IO loop.
  // loop?: IO.Loop; // The loop to attach to
  image?: HTMLImageElement | string; // glyph image
  start?: boolean;

  // GlyphOptions
  font?: string;
  fontSize?: number;
  size?: number; // alias for fontSize
  tileWidth?: number;
  tileHeight?: number;
  basicOnly?: boolean;
  basic?: boolean; // alias for basicOnly

  // on?: SCENE.SceneOpts;
  scene?: SCENE.SceneCreateOpts | boolean | string;
  scenes?: Record<string, SCENE.SceneCreateOpts>;
  sceneStartOpts?: SceneStartOpts;

  name?: string;
  loop?: Loop;
  dt?: number; // fixed_update ms

  data?: { [id: string]: any };
}

export type AppOpts = AppOptsBase &
  (
    | {
        div: HTMLElement | string;
        canvas?: CANVAS.Canvas;
      }
    | {
        div?: HTMLElement | string;
        canvas: CANVAS.Canvas;
      }
  );

export class App {
  name: string;
  canvas: CANVAS.Canvas;
  events: EVENTS.Events;
  timers: TIMERS.Timers;
  scenes: Scenes;
  io: IO.EventQueue;
  loop: Loop;
  styles: STYLE.Sheet;

  dt = 16; // 16 ms per frame
  time = 0;
  realTime = 0;
  skipTime = false;

  fps = 0;
  fpsBuf: number[] = [];
  fpsTimer = 0;
  numFrames = 0;

  loopId = 0;
  stopped = true;
  paused = false;
  debug = false;

  buffer: Buffer;
  data: { [id: string]: any };

  constructor(opts: AppOpts = { div: "game" }) {
    if (typeof opts.seed === "number" && opts.seed > 0) {
      rng.random.seed(opts.seed);
    }

    if ("loop" in opts) {
      this.loop = opts.loop!;
      delete opts.loop;
    } else {
      this.loop = new Loop();
    }

    this.name = opts.name || "Goblinwerks";
    this.styles = STYLE.defaultStyle;
    this.canvas = opts.canvas || CANVAS.make(opts);
    this.io = new IO.EventQueue();
    this.events = new EVENTS.Events(this);
    this.timers = new TIMERS.Timers(this);
    this.scenes = new Scenes(this);
    if (opts.dt !== undefined) {
      this.dt = opts.dt || 16; // Can't have 0
    }

    this.data = mergeDeep({}, opts.data || {});

    this.canvas.onmousemove = (e: MouseEvent, x: number, y: number) => {
      const ev = IO.makeMouseEvent(e, x, y);
      this.io.enqueue(ev);
    };
    this.canvas.onclick = (e: MouseEvent, x: number, y: number) => {
      const ev = IO.makeMouseEvent(e, x, y);
      this.io.enqueue(ev);
    };

    // TODO - Allow setting key capture from Document instead of Canvas?
    this.canvas.onkeydown = (e: KeyboardEvent) => {
      const ev = IO.makeKeyEvent(e);
      this.io.enqueue(ev);
    };

    this.buffer = new Buffer(this.canvas.width, this.canvas.height);

    if (opts.scenes) {
      this.scenes.config(opts.scenes);
      if (typeof opts.scene === "string") {
        this.scenes.switchTo(opts.scene, opts.sceneStartOpts);
      } else {
        this.scenes.switchTo(Object.keys(opts.scenes)[0], opts.sceneStartOpts);
      }
    } else if (opts.scene) {
      if (typeof opts.scene === "string") {
        throw new Error(
          "Cannot use string 'scene' option without including 'scenes'."
        );
      }
      if (opts.scene === true) opts.scene = {};
      this.scenes.config("default", opts.scene);
      this.scenes.switchTo("default", opts.sceneStartOpts);
    }

    if (opts.start !== false) {
      this.start();
    }

    globalThis.APP = this;
    active = this;
  }

  // get buffer() {
  //     return this.scene.buffer;
  // }

  get width() {
    return this.canvas.width;
  }
  get height() {
    return this.canvas.height;
  }

  get node() {
    return this.canvas.node;
  }

  get mouseXY() {
    return this.canvas.mouse;
  }

  get scene() {
    return this.scenes.get();
  }

  on(ev: string, fn: EVENTS.CallbackFn): EVENTS.CancelFn {
    // return this.scene.on(ev, fn);
    return this.events.on(ev, fn);
  }

  emit(ev: string, ...args: any[]) {
    this.scenes.emit(ev, ...args);
    this.events.emit(ev, ...args);
  }

  wait(delay: number, fn: TIMERS.TimerFn): EVENTS.CancelFn;
  wait(delay: number, fn: string, ctx?: Record<string, any>): EVENTS.CancelFn;
  wait(...args: any[]): EVENTS.CancelFn {
    // @ts-ignore
    // return this.scene.wait.apply(this.scene, args);
    if (typeof args[1] === "string") {
      const ev = args[1];
      args[2] = args[2] || {};
      args[1] = () => this.emit(ev, args[2]!);
    }
    return this.timers.setTimeout(args[1], args[0]);
  }

  repeat(delay: number, fn: TIMERS.TimerFn): EVENTS.CancelFn;
  repeat(delay: number, fn: string, ctx?: Record<string, any>): EVENTS.CancelFn;
  repeat(...args: any[]): EVENTS.CancelFn {
    // @ts-ignore
    // return this.scene.repeat.apply(this.scene, args);
    if (typeof fn === "string") {
      const ev = args[1];
      args[2] = args[2] || {};
      args[1] = () => this.emit(ev, args[2]!);
    }
    return this.timers.setInterval(args[1], args[0]);
  }

  // run() {
  //     this.emit('run', this);
  //     let running = false;
  //     this.loopID = (setInterval(() => {
  //         if (!running) {
  //             running = true;
  //             this._frame();
  //             running = false;
  //         }
  //     }, 16) as unknown) as number;
  //     this.stopped = false;
  // }

  start(): this {
    if (this.loop.isRunning) return this;
    this.loop.start(this._frame.bind(this));
    return this;
  }

  stop() {
    this.emit("stop", this);
    this.loop.stop();
    this.stopped = true;
  }

  _frame(t: number = 0) {
    t = t || Date.now();
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    if (this.realTime == 0) {
      this.realTime = t;
      this.time = t;
    }

    const realTime = t;
    const realDt = realTime - this.realTime;
    this.realTime = realTime;

    if (!this.skipTime) {
      this.fpsBuf.push(1000 / realDt);
      this.fpsTimer += realDt;
      if (this.fpsTimer >= 1) {
        this.fpsTimer = 0;
        this.fps = Math.round(
          this.fpsBuf.reduce((a, b) => a + b) / this.fpsBuf.length
        );
        this.fpsBuf = [];
      }
    }
    this.skipTime = false;
    this.numFrames++;

    this._frameStart();

    // // unprocessed io is handled here
    while (this.io.length) {
      const ev = this.io.dequeue()!;
      this._input(ev);
    }

    if (!this.paused && this.debug !== true) {
      // TODO - Should update be called first to run timers, etc...?

      while (this.time + this.dt <= realTime) {
        this.time += this.dt;
        this._fixed_update(this.dt);
      }

      // call update
      this._update(realDt);
    }

    this._draw();

    if (this.debug !== false) {
      this._frameDebug();
    }

    this._frameEnd();

    this.io.clear();
  }

  _input(ev: IO.Event) {
    this.scenes.input(ev);
    if (ev.propagationStopped || ev.defaultPrevented) return;

    ev.dispatch(this.events);
  }

  _update(dt = 0) {
    dt = dt || this.dt;
    this.scenes.update(dt);
    this.timers.update(dt);
    this.events.emit("update", dt);
  }

  _fixed_update(dt = 0) {
    dt = dt || this.dt;
    this.scenes.fixed_update(dt);
    this.events.emit("fixed_update", dt);
  }

  _frameStart() {
    // this.buffer.nullify();
    this.scenes.frameStart();
    this.events.emit("frameStart");
  }
  _draw() {
    this.scenes.draw(this.buffer);
    this.events.emit("draw", this.buffer);
  }
  _frameDebug() {
    this.scenes.frameDebug(this.buffer);
    this.events.emit("frameDebug", this.buffer);
  }
  _frameEnd() {
    this.scenes.frameEnd(this.buffer);
    this.events.emit("frameEnd", this.buffer);
    this.canvas.render(this.buffer);
  }

  alert(text: string, opts: Omit<AlertOptions, "text"> = {}): SCENE.Scene {
    (<AlertOptions>opts).text = text;
    return this.scenes.show("alert", opts);
  }

  show(id: string | SCENE.Scene, opts?: SceneStartOpts): SCENE.Scene {
    return this.scenes.show(id, opts);
  }
  switchTo(id: string | SCENE.Scene, opts?: SceneStartOpts): SCENE.Scene {
    return this.scenes.switchTo(id, opts);
  }

  confirm(text: string, opts: Omit<ConfirmOptions, "text"> = {}): SCENE.Scene {
    (<ConfirmOptions>opts).text = text;
    return this.scenes.show("confirm", opts);
  }

  prompt(text: string, opts: Omit<PromptOptions, "prompt"> = {}): SCENE.Scene {
    // TODO - Do we really have to do this?  Can't we reset the scene instead?
    // NEED TO CREATE A NEW SCENE EVERY TIME SO WE DON"T HAVE HOLDOVER EVENTS, etc...
    (<PromptOptions>opts).prompt = text;
    const prompt = this.scenes.create("prompt", PromptScene);
    prompt.show(opts);
    return prompt;
  }
}

export function make(opts: AppOpts): App {
  const app = new App(opts);
  return app;
}

export function start(opts: AppOpts): App {
  return make(opts);
}

export var active: App;
