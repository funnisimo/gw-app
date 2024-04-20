import * as UTILS from "gw-utils/utils.js";
import { TweenUpdate } from "../tween.js";

export class Tweens {
  _tweens: TweenUpdate[] = [];

  constructor() {}

  get length() {
    return this._tweens.length;
  }

  clear() {
    this._tweens = [];
  }

  add(tween: TweenUpdate) {
    this._tweens.push(tween);
  }

  remove(tween: TweenUpdate) {
    UTILS.arrayDelete(this._tweens, tween);
  }

  update(dt: number) {
    // // fire animations
    this._tweens.forEach((tw) => tw.update(dt));
    this._tweens = this._tweens.filter((tw) => tw.isRunning());
  }
}
