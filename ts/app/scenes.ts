import * as UTILS from "gw-utils/utils.js";
import * as BUFFER from "gw-canvas/buffer.js";
import {
  Scene,
  SceneCreateOpts,
  SceneStartOpts,
  SceneMakeFn,
} from "./scene.js";
import { App } from "./app.js";
import * as IO from "../app/io.js";
import { ScenePauseOpts } from "./index.js";
import { mergeDeep } from "gw-utils/object.js";

interface PendingInfo {
  action: "_start" | "stop" | "show";
  scene: Scene;
  data: any;
}

export class Scenes {
  _app: App;
  _config: Record<string, SceneCreateOpts>;
  // _scenes: Record<string, Scene> = {};
  _active: Scene[] = [];
  _busy = false;
  _pending: PendingInfo[] = [];

  constructor(gw: App) {
    this._app = gw;
    this._config = Object.assign({}, scenes);
  }

  get isBusy() {
    return this._busy;
  }

  config(scenes: Record<string, SceneCreateOpts | SceneMakeFn>): void;
  config(id: string, opts: SceneCreateOpts | SceneMakeFn): void;
  config(...args: any[]): void {
    if (args.length === 1) {
      const scenes = args[0] as Record<string, SceneCreateOpts | SceneMakeFn>;
      Object.entries(scenes).forEach(([id, fns]) => this.config(id, fns));
      return;
    }

    let [id, opts] = args;
    const current = this._config[id] || {};
    if (typeof opts === "function") {
      opts = { make: opts };
    }
    Object.assign(current, opts);
    this._config[id] = current;
  }

  get(): Scene;
  get(id?: string): Scene | null;
  get(id?: string): Scene | null {
    if (id === undefined) {
      return this._active[this._active.length - 1];
    }
    return this._active.find((s) => s.id === id) || null;
  }

  emit(ev: string, ...args: any[]): void {
    this._active.forEach((a) => a.emit(ev, ...args));
  }

  create(id: string, opts: SceneCreateOpts = {}): Scene {
    let cfg = this._config[id] || {};
    const used = mergeDeep(cfg, opts);

    let scene: Scene;

    if (used.make) {
      scene = used.make(id, this._app);
    } else {
      scene = new Scene(id, this._app);
    }

    scene.on("start", () => this._started(scene));
    scene.on("stop", () => this._stopped(scene));
    scene._create(used);
    // this._scenes[scene.id] = scene;

    return scene;
  }

  // create(id: string, data: CreateOpts = {}): Scene {
  //     if (id in this._scenes) {
  //         console.log('Scene already created - ' + id);
  //         return this._scenes[id];
  //     }
  //     return this._create(id, data);
  // }

  switchTo(id: string | Scene, opts?: SceneStartOpts): Scene {
    let scene: Scene = id instanceof Scene ? id : this.create(id, {});
    this._switchTo(scene, opts);
    return scene;
  }

  _switchTo(scene: Scene, opts: SceneStartOpts = {}) {
    this._app.io.clear();
    this.stop(); // stop all running scenes
    if (this.isBusy) {
      this._pending.push({ action: "_start", scene, data: opts });
    } else {
      scene._start(opts);
    }
  }

  show(id: string | Scene, data?: SceneStartOpts): Scene {
    let scene: Scene = id instanceof Scene ? id : this.create(id, data);
    this._app.io.clear();
    if (this.isBusy) {
      this._pending.push({ action: "show", scene, data });
    } else {
      scene.show(data);
    }

    return scene;
  }

  _started(scene: Scene) {
    this._active.push(scene);
  }

  stop(data?: any): void;
  stop(id: string, data?: any): void;
  stop(id?: string | any, data?: any): void {
    if (typeof id === "string") {
      const scene = this.get(id);
      if (!scene) throw new Error("Unknown scene:" + id);
      id = scene;
    }

    if (id instanceof Scene) {
      if (this.isBusy) {
        this._pending.push({ action: "stop", scene: id, data });
      } else {
        id.stop(data);
      }
    } else {
      this._active.forEach((s) => this.stop(s.id, id));
    }
  }
  _stopped(_scene: Scene) {
    this._active = this._active.filter((s) => s.isActive());
  }

  destroy(id: string, data?: any) {
    const scene = this.get(id);
    if (!scene) return;
    if (scene.isActive()) {
      scene.stop(data);
    }
    scene.destroy(data);
    // delete this._scenes[id];
  }

  pause(id: string, opts?: ScenePauseOpts): void;
  pause(opts?: ScenePauseOpts): void;
  pause(id?: string | ScenePauseOpts, opts?: ScenePauseOpts): void {
    if (typeof id === "string") {
      const scene = this.get(id);
      if (!scene) throw new Error("Unknown scene:" + id);
      scene.pause(opts);
    } else {
      this._active.forEach((s) => s.pause(id));
    }
  }

  resume(opts?: ScenePauseOpts): void;
  resume(id: string, opts?: ScenePauseOpts): void;
  resume(id?: string | ScenePauseOpts, opts?: ScenePauseOpts): void {
    if (typeof id === "string") {
      const scene = this.get(id);
      if (!scene) throw new Error("Unknown scene:" + id);
      scene.resume(opts);
    } else {
      this._active.forEach((s) => s.resume(id));
    }
  }

  // FRAME

  frameStart() {
    this._busy = true;
    this._active.forEach((s) => s.frameStart());
  }
  input(ev: IO.Event) {
    UTILS.arrayRevEach(this._active, (s) => {
      // TODO - should this be: defaultPrevented?
      if (!ev.propagationStopped) s.input(ev);
    });
  }
  update(dt: number) {
    this._active.forEach((s) => s.update(dt));
  }
  fixed_update(dt: number) {
    this._active.forEach((s) => s.fixed_update(dt));
  }
  draw(buffer: BUFFER.Buffer) {
    this._active.forEach((s) => {
      // if (i > 0) {
      //     s.buffer.copy(this._active[i - 1].buffer);
      // }
      s.draw(buffer);
    });
  }
  frameDebug(buffer: BUFFER.Buffer) {
    if (this._active.length) {
      this._active.forEach((s) => s.frameDebug(buffer));
    }
  }
  frameEnd(buffer: BUFFER.Buffer) {
    if (this._active.length) {
      this._active.forEach((s) => s.frameEnd(buffer));
    }
    this._busy = false;

    for (let i = 0; i < this._pending.length; ++i) {
      const todo = this._pending[i];
      todo.scene[todo.action](todo.data);
    }
    this._pending.length = 0;
  }
}

export const scenes: Record<string, SceneCreateOpts> = {};

export function installScene(id: string, scene: SceneCreateOpts | SceneMakeFn) {
  if (typeof scene === "function") {
    scene = { make: scene };
  }
  scenes[id] = scene;
}
