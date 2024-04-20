// import _ from 'lodash';
import * as TEST from '../../test/utils';
import * as CANVAS from '../canvas';
import * as APP from './app';
import * as SCENE from './scene';
import * as WIDGET from './widget';

function IDS(c: WIDGET.Widget[]): string[] {
    return c.map((a) => a.id);
}

describe('W + S Test', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: SCENE.Scene;

    beforeEach(() => {
        canvas = TEST.mockCanvas();
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
    });

    describe('parent, scene', () => {
        test('W - no S', () => {
            const w = new WIDGET.Widget();
            expect(w.parent).toBeNull();
            expect(w.scene).toBeNull();
        });

        test('W -> S', () => {
            const w = new WIDGET.Widget();

            scene.addChild(w);
            expect(scene.all).toEqual([w]);
            expect(scene.children).toEqual([w]);

            expect(w.scene).toBe(scene);
            expect(w.parent).toBeNull();
        });

        test('W -> S -> remove', () => {
            const w = new WIDGET.Widget();
            scene.addChild(w);
            scene.removeChild(w);

            expect(w.scene).toBeNull();
            expect(w.parent).toBeNull();
            expect(scene.all).toEqual([]);
            expect(scene.children).toEqual([]);
        });

        test('W(s)', () => {
            const w = new WIDGET.Widget({ scene });

            expect(scene.all).toEqual([w]);
            expect(scene.children).toEqual([w]);

            expect(w.scene).toBe(scene);
            expect(w.parent).toBeNull();
        });

        test('S(), P(S), W(P)', () => {
            const p = new WIDGET.Widget({ scene, id: 'P' });
            const w = new WIDGET.Widget({ parent: p, id: 'W' });

            expect(IDS(scene.all)).toEqual(['P', 'W']);
            expect(IDS(scene.children)).toEqual(['P']);
            expect(IDS(p.children)).toEqual(['W']);

            expect(w.scene).toBe(scene);
            expect(w.parent).toBe(p);
        });

        test('P(), W(P), S+P', () => {
            const p = new WIDGET.Widget({ id: 'P' });
            const w = new WIDGET.Widget({ parent: p, id: 'W' });

            scene.addChild(p);

            expect(IDS(scene.all)).toEqual(['P', 'W']);
            expect(IDS(scene.children)).toEqual(['P']);
            expect(IDS(p.children)).toEqual(['W']);

            expect(w.scene).toBe(scene);
            expect(w.parent).toBe(p);
        });

        test('P(), W(P), S+W', () => {
            const p = new WIDGET.Widget({ id: 'P' });
            const w = new WIDGET.Widget({ parent: p, id: 'W' });

            scene.addChild(w);

            expect(IDS(scene.all)).toEqual(['W']);
            expect(IDS(scene.children)).toEqual(['W']);
            expect(IDS(p.children)).toEqual([]);
            expect(IDS(w.children)).toEqual([]);

            expect(w.scene).toBe(scene);
            expect(w.parent).toBe(null);

            expect(p.scene).toBe(null);
            expect(p.parent).toBe(null);
        });

        test('P(), W(P), S+W, S+P', () => {
            const p = new WIDGET.Widget({ id: 'P' });
            const w = new WIDGET.Widget({ parent: p, id: 'W' });

            scene.addChild(w);
            scene.addChild(p);

            expect(IDS(scene.all)).toEqual(['W', 'P']);
            expect(IDS(scene.children)).toEqual(['W', 'P']);
            expect(IDS(p.children)).toEqual([]);
            expect(IDS(w.children)).toEqual([]);

            expect(w.scene).toBe(scene);
            expect(w.parent).toBe(null);

            expect(p.scene).toBe(scene);
            expect(p.parent).toBe(null);
        });
    });

    describe('bounds', () => {
        test('W(1,2,3,4)', () => {
            const w = new WIDGET.Widget({ x: 1, y: 2, width: 3, height: 4 });
            expect(w.bounds.toString()).toEqual('[1,2 -> 4,6]');

            expect(w.contains(2, 2)).toBeTruthy();

            w.pos(3, 4);
            expect(w.bounds.toString()).toEqual('[3,4 -> 6,8]');

            expect(w.contains(5, 6)).toBeTruthy();
            expect(w.contains({ x: 2, y: 2 })).toBeFalsy();
        });

        test('align children - left', () => {
            const p = new WIDGET.Widget();
            const a = new WIDGET.Widget({ x: 4, width: 4, parent: p });
            const b = new WIDGET.Widget({ x: 3, width: 3, parent: p });
            const c = new WIDGET.Widget({ x: 5, width: 2, parent: p });

            WIDGET.alignChildren(p);
            expect(a.bounds.left).toEqual(3);
            expect(b.bounds.left).toEqual(3);
            expect(c.bounds.left).toEqual(3);
        });

        test('align children - right', () => {
            const p = new WIDGET.Widget();
            const a = new WIDGET.Widget({ x: 4, width: 4, parent: p });
            const b = new WIDGET.Widget({ x: 3, width: 3, parent: p });
            const c = new WIDGET.Widget({ x: 5, width: 2, parent: p });

            WIDGET.alignChildren(p, 'right');
            expect(a.bounds.right).toEqual(8);
            expect(b.bounds.right).toEqual(8);
            expect(c.bounds.right).toEqual(8);
        });

        test('align children - center', () => {
            const p = new WIDGET.Widget();
            const a = new WIDGET.Widget({ x: 4, width: 4, parent: p });
            const b = new WIDGET.Widget({ x: 3, width: 3, parent: p });
            const c = new WIDGET.Widget({ x: 5, width: 2, parent: p });

            WIDGET.alignChildren(p, 'center');
            expect(a.bounds.center).toEqual(5);
            expect(b.bounds.center).toEqual(5);
            expect(c.bounds.center).toEqual(5);
        });

        test('spaceChildren', () => {
            const p = new WIDGET.Widget();
            const a = new WIDGET.Widget({ y: 4, height: 1, parent: p });
            const b = new WIDGET.Widget({ y: 3, height: 2, parent: p });
            const c = new WIDGET.Widget({ y: 5, height: 1, parent: p });

            WIDGET.spaceChildren(p, 1);
            expect(a.bounds.top).toEqual(6);
            expect(b.bounds.top).toEqual(3);
            expect(c.bounds.top).toEqual(8);
        });

        test('wrap', () => {
            const p = new WIDGET.Widget();
            new WIDGET.Widget({
                x: 4,
                y: 4,
                width: 4,
                height: 1,
                parent: p,
            });
            new WIDGET.Widget({
                x: 3,
                y: 3,
                width: 3,
                height: 2,
                parent: p,
            });
            new WIDGET.Widget({
                x: 5,
                y: 5,
                width: 2,
                height: 1,
                parent: p,
            });

            WIDGET.spaceChildren(p, 1);
            WIDGET.alignChildren(p, 'left');
            WIDGET.wrapChildren(p, 1);

            expect(p.bounds.toString()).toEqual('[2,2 -> 8,10]');
        });
    });

    describe('style', () => {
        test('set', () => {
            const w = new WIDGET.Widget({ fg: 'red', bg: 'blue' });
            expect(w.style().fg).toEqual('red');
            expect(w.style('bg')).toEqual('blue');

            w.style('fg', 'green');
            expect(w.style('fg')).toEqual('green');
            expect(w.style().bg).toEqual('blue');
            expect(w.style('opacity')).toBeUndefined();

            w.style({ bg: 'red', opacity: 50 });
            expect(w.style('fg')).toEqual('green');
            expect(w.style().bg).toEqual('red');
            expect(w.style('opacity')).toEqual(50);
        });
    });
});
