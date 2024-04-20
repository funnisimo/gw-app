import { Mock, vi } from "vitest";

// import { Random } from '../ts/random';
import { Buffer } from "../ts/buffer";
import * as Glyphs from "../ts/glyphs";
import * as Canvas from "../ts/canvas";
import * as Color from "../ts/color";
// import * as Layer from '../ts/ui/layer';
// import * as WidgetLayer from '../ts/widget/layer';
// import * as UI from '../ts/ui/ui';

const GLYPHS: string[] = [];
Glyphs.initGlyphs({ draw: (n, ch) => (GLYPHS[n] = ch) });

// export function extractBufferText(
//     buffer: Buffer,
//     x: number,
//     y: number,
//     width: number = 99,
//     trim = true
// ) {
//     let output = '';
//     width = Math.min(buffer.width - x, width);
//     for (let i = x; i < x + width; ++i) {
//         const data = buffer.get(i, y);
//         if (typeof data.ch === 'number') data.ch = GLYPHS[data.ch || 32];
//         output += data.ch;
//     }
//     if (!trim) return output;
//     return output.trim();
// }

// export const rnd = vi.fn();

// export var seed = 0;

// export function mockRandom(s?: number) {
//     seed = s || 0;
//     rnd.mockImplementation(() => {
//         seed = (seed + 17) % 100;
//         return seed / 100;
//     });
//     const make = vi.fn().mockImplementation((s?: number) => {
//         if (typeof s === 'number') {
//             seed = s % 100;
//         }
//         return rnd;
//     });
//     Random.configure({ make });
//     make.mockClear();
// }

// export function bufferStack(w: number, h: number): Layer.BufferStack {
//     const target: Canvas.BufferTarget = {
//         width: w,
//         height: h,
//         copyTo: vi.fn(),
//         toGlyph(ch: string | number): number {
//             if (typeof ch === 'string') return GLYPHS.indexOf(ch);
//             return ch;
//         },
//         draw: vi.fn(),
//     };

//     const loop = new IO.Loop();

//     const buffer = new Canvas.Buffer(target);

//     return {
//         buffer,
//         parentBuffer: buffer,
//         pushBuffer() {
//             return buffer;
//         },
//         popBuffer() {},
//         loop,
//     };
// }

export function mockCanvas(width = 30, height = 30): Canvas.Canvas {
  // const target: Canvas.Buffer = {
  //     width,
  //     height,
  //     copyTo: vi.fn(),
  //     toGlyph(ch: string | number): number {
  //         if (typeof ch === 'string') return GLYPHS.indexOf(ch); // ch.charCodeAt(0);
  //         return ch;
  //     },
  //     draw: vi.fn().mockReturnValue(true),
  // };

  // const buffer = new Canvas.Buffer(target);
  const node = {} as HTMLCanvasElement;
  const glyphs = {} as Glyphs.Glyphs;

  return {
    width,
    height,

    draw: vi.fn().mockReturnValue(true),

    mouse: { x: -1, y: -1 },
    node,
    tileWidth: 16,
    tileHeight: 16,
    pxWidth: 16 * width,
    pxHeight: 16 * height,

    glyphs,

    resize: vi.fn(),

    render: vi.fn(),
    hasXY(x: number, y: number) {
      return x >= 0 && y >= 0 && x < width && y < height;
    },

    onclick: null,
    onmousemove: null,
    onmouseup: null,
    onkeydown: null,
  } as unknown as Canvas.Canvas;
}

// export function mockUI(width = 100, height = 38) {
//     // @ts-ignore
//     const canvas = bufferStack(width, height);

//     const ui = new UI.UI({
//         loop: canvas.loop,
//         canvas: canvas as Canvas.BaseCanvas,
//         layer: false,
//     });

//     return ui;
// }

// export function mockLayer(w: number, h: number): Layer.Layer {
//     const canvas = mockUI(w, h);
//     const layer = new Layer.Layer(canvas);
//     return layer;
// }

// export function mockWidgetLayer(w: number, h: number): WidgetLayer.WidgetLayer {
//     const canvas = mockUI(w, h);
//     const layer = new WidgetLayer.WidgetLayer(canvas);
//     return layer;
// }

export function getBufferText(
  buffer: Buffer,
  x: number,
  y: number,
  width: number = 99,
  trim = true
): string {
  let text = "";
  width = Math.min(width, buffer.width - x);
  for (let i = 0; i < width; ++i) {
    const data = buffer.get(x + i, y);
    if (data.fg.equals(data.bg)) {
      text += " ";
    } else {
      text += data.ch || " ";
    }
  }
  if (!trim) return text;
  return text.trim();
}

export function getBufferFg(buffer: Buffer, x: number, y: number): Color.Color {
  const data = buffer.get(x, y);
  return data.fg;
}

export function getBufferBg(buffer: Buffer, x: number, y: number): Color.Color {
  const data = buffer.get(x, y);
  return data.bg;
}

// export function keypress(key: string): IO.Event {
//   let code = "Key" + key.toUpperCase();
//   if (key.length > 1) {
//     code = key;
//   } else if (key >= "0" && key <= "9") {
//     code = "Digit" + key;
//   }

//   return IO.makeKeyEvent({
//     key,
//     code,
//   } as KeyboardEvent);
// }

// export function dir(name: "up" | "down" | "left" | "right"): IO.Event {
//   return IO.makeKeyEvent({
//     key: "arrow" + name,
//     code: "ARROW" + name.toUpperCase(),
//   } as KeyboardEvent);
// }

// export function click(x: number, y: number): IO.Event {
//   return IO.makeMouseEvent({ buttons: 1 } as MouseEvent, x, y);
// }

// export function mousemove(x: number, y: number): IO.Event {
//   return IO.makeMouseEvent({} as MouseEvent, x, y);
// }

// export function tick(dt = 16): IO.Event {
//   return IO.makeTickEvent(dt);
// }

// export async function wait(dt = 1): Promise<void> {
//   await new Promise((resolve) => setTimeout(resolve, dt));
// }
