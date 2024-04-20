import 'jest-extended';
import '../../test/matchers';

import * as TEST from '../../test/utils';
// import * as BUFFER from '../buffer';
import * as COLOR from '../color';

import * as APP from '../app';
import * as CANVAS from '../canvas';
import * as BUILD from '../widgets/builder';

describe('Scene', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: APP.Scene;
    let build: BUILD.Builder;

    beforeEach(() => {
        canvas = TEST.mockCanvas();
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
        build = new BUILD.Builder(scene);
    });

    test('constructor', () => {
        expect(scene.id).toEqual('default');
        expect(scene.children).toHaveLength(0);
        expect(scene.all).toHaveLength(0);
    });

    test('bg', () => {
        scene.bg = COLOR.WHITE;

        app.buffer.fill(COLOR.BLACK);
        expect(app.buffer.info(0, 0)).toEqual({
            ch: null,
            fg: 0x000f,
            bg: 0x000f,
        });

        app._draw();

        expect(app.buffer.info(0, 0)).toEqual({
            ch: null,
            fg: 0xffff,
            bg: 0xffff,
        });
    });

    // test('hidden widgets do not draw', () => {
    //     scene.clear('black');
    //     const text = build.pos(2, 3).text('Hello World.');
    //     text.hidden = true;
    //     scene.draw();

    //     expect(UTILS.getBufferText(scene.buffer, 2, 3, 20)).toEqual('');
    //     expect(UTILS.getBufferFg(scene.buffer, 2, 3)).toEqual(0x000); // black
    //     expect(UTILS.getBufferBg(scene.buffer, 2, 3)).toEqual(0x000); // black

    //     text.hidden = false;
    //     scene.draw();
    //     expect(UTILS.getBufferText(scene.buffer, 2, 3, 20)).toEqual(
    //         'Hello World.'
    //     );
    //     expect(UTILS.getBufferFg(scene.buffer, 2, 3)).toEqual(0xfff); // white
    //     expect(UTILS.getBufferBg(scene.buffer, 2, 3)).toEqual(0x000); // black
    // });

    // describe('depth drawing', () => {
    test('same depth - latest wins', () => {
        build.pos(2, 3).text({ text: 'AAAAAAAAAA', id: 'A' });
        build.pos(2, 3).text({ text: 'BBBBBBBBBB', id: 'B' });
        app._draw();

        expect(TEST.getBufferText(app.buffer, 2, 3, 20)).toEqual('BBBBBBBBBB');
    });

    //     test('higher depth first', () => {
    //         scene.clear('black');
    //         const A = build.pos(2, 3).text('AAAAAAAAAA', { id: 'A', depth: 1 });
    //         const B = build.pos(2, 3).text('BBBBBBBBBB', { id: 'B' });
    //         scene.draw();

    //         expect(A.depth).toEqual(1);
    //         expect(B.depth).toEqual(0);
    //         expect(scene._depthOrder.map((w) => w.attr('id'))).toEqual([
    //             'A',
    //             'B',
    //             'BODY',
    //         ]);

    //         expect(UTILS.getBufferText(scene.buffer, 2, 3, 20)).toEqual(
    //             'AAAAAAAAAA'
    //         );
    //     });

    //     test('higher depth last', () => {
    //         scene.clear('black');
    //         const A = build.pos(2, 3).text('AAAAAAAAAA', { id: 'A' });
    //         const B = build.pos(2, 3).text('BBBBBBBBBB', { id: 'B', depth: 1 });
    //         scene.draw();

    //         expect(A.depth).toEqual(0);
    //         expect(B.depth).toEqual(1);
    //         expect(scene._depthOrder.map((w) => w.attr('id'))).toEqual([
    //             'B',
    //             'A',
    //             'BODY',
    //         ]);

    //         expect(UTILS.getBufferText(scene.buffer, 2, 3, 20)).toEqual(
    //             'BBBBBBBBBB'
    //         );
    //     });
    // });

    describe('focus', () => {
        test('set focus automatically', async () => {
            build.text('A');
            const divB = build.pos(0, 1).text('B', { tabStop: true });
            const divC = build.pos(0, 2).text('C', { tabStop: true });

            expect(scene.focused).toBe(divB);
            scene.nextTabStop();
            expect(scene.focused).toBe(divC);

            // wraps
            scene.nextTabStop();
            expect(scene.focused).toBe(divB);

            // prev
            scene.prevTabStop();
            expect(scene.focused).toBe(divC);
            scene.prevTabStop();
            expect(scene.focused).toBe(divB);
        });

        test('click to set focus', async () => {
            build.text('DIV A');
            const divB = build.pos(0, 1).text('DIV B', { tabStop: true });
            const divC = build.pos(0, 2).text('DIV C', { tabStop: true });

            // initial value
            expect(scene.focused).toBe(divB);

            // click C
            expect(scene.widgetAt(2, 2)).toBe(divC);
            app._input(TEST.click(2, 2));
            expect(scene.focused).toBe(divC);

            // click nothing
            expect(scene.widgetAt(5, 5)).toBe(null);
            app._input(TEST.click(5, 5));
            expect(scene.focused).toBe(divC); // does not change

            // click B
            expect(scene.widgetAt(2, 1)).toBe(divB);
            app._input(TEST.click(2, 1));
            expect(scene.focused).toBe(divB);
        });

        test('tab + TAB - next/prev focus', async () => {
            build.text('DIV A');
            const divB = build.pos(0, 1).text('DIV B', { tabStop: true });
            const divC = build.pos(0, 2).text('DIV C', { tabStop: true });
            build.pos(0, 3).text('DIV D');
            const divE = build.pos(0, 4).text('DIV E', { tabStop: true });

            // initial value
            expect(scene.focused).toBe(divB);

            // tab
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divC);
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divE);
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divB);

            // TAB - reverse
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divE);
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divC);
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divB);
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divE);
        });

        test('element eats tab and TAB to stop change', async () => {
            let stop = true;
            const keypressFn = jest
                .fn()
                .mockImplementation((e) => stop && e.preventDefault()); // We handled this keypress

            build.text('DIV A');
            const divB = build.pos(0, 1).text('DIV B', { tabStop: true });
            divB.on('keypress', keypressFn);
            const divC = build.pos(0, 2).text('DIV C', { tabStop: true });
            divC.on('keypress', keypressFn);

            // initial value
            expect(scene.focused).toBe(divB);

            // tab
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divB);
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divB);
            stop = false; // Now we let the key pass
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divC);

            // TAB - reverse
            stop = true; // we handle
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divC);
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divC);
            stop = false;
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divB);
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divC);
        });

        test('focus event.  blur event.', async () => {
            const blurFn = jest.fn();
            const focusFn = jest.fn();

            build.text('DIV A');
            const divB = build.pos(0, 1).text('DIV B', { tabStop: true });
            divB.on('blur', blurFn);
            const divC = build.pos(0, 2).text('DIV C', { tabStop: true });
            divC.on('focus', focusFn);

            // initial value
            expect(scene.focused).toBe(divB);

            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divC);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).toHaveBeenCalled();
        });

        test('blur event changes it back', async () => {
            const blurFn = jest.fn().mockImplementation(() => {
                scene.setFocusWidget(divB);
            });
            const focusFn = jest.fn();

            build.text('DIV A');
            const divB = build.pos(0, 1).text('DIV B', { tabStop: true });
            divB.on('blur', blurFn);
            const divC = build.pos(0, 2).text('DIV C', { tabStop: true });
            divC.on('focus', focusFn);

            // initial value
            expect(scene.focused).toBe(divB);

            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divB);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).not.toHaveBeenCalled();
        });

        test('focus event sets it back', async () => {
            const blurFn = jest.fn();
            const focusFn = jest.fn().mockImplementation(() => {
                scene.setFocusWidget(divB);
            });

            build.text('DIV A');
            const divB = build.pos(0, 1).text('DIV B', { tabStop: true });
            divB.on('blur', blurFn);
            const divC = build.pos(0, 2).text('DIV C', { tabStop: true });
            divC.on('focus', focusFn);

            // initial value
            expect(scene.focused).toBe(divB);

            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divB);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).toHaveBeenCalled();
        });

        test('disabled elements skipped', async () => {
            build.text('DIV A');
            const divB = build.pos(0, 1).text('DIV B', { tabStop: true });
            const divC = build
                .pos(0, 2)
                .text('DIV C', { tabStop: true, disabled: true });
            build.pos(0, 3).text('DIV D');
            const divE = build.pos(0, 4).text('DIV E', { tabStop: true });

            // initial value
            expect(scene.focused).toBe(divB);

            // tab
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divE); // Skips C

            // TAB - reverse
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divB); // Skips C

            divC.prop('disabled', false);
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divC); // Now it is there
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divE);

            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divC); // Now it is there
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divB);
        });

        test('hidden elements skipped', async () => {
            build.text('DIV A');
            const divB = build.pos(0, 1).text('DIV B', { tabStop: true });
            const divC = build
                .pos(0, 2)
                .text('DIV C', { tabStop: true, hidden: true });
            build.pos(0, 3).text('DIV D');
            const divE = build.pos(0, 4).text('DIV E', { tabStop: true });

            app._draw(); // sets the styles

            // initial value
            expect(scene.focused).toBe(divB);

            // tab
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divE); // Skips C

            // TAB - reverse
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divB); // Skips C

            divC.hidden = false;
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divC); // Now it is there
            app._input(TEST.keypress('Tab'));
            expect(scene.focused).toBe(divE);

            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divC); // Now it is there
            app._input(TEST.keypress('TAB'));
            expect(scene.focused).toBe(divB);
        });
    });

    // describe('animate', () => {
    //     // jest.setTimeout(10 * 60 * 1000);

    //     test('basic', async () => {
    //         const obj = { x: 0 };
    //         const tween = Tween.make(obj).to({ x: 10 }).duration(1000);
    //         scene.addAnimation(tween);
    //         const p = scene.run();

    //         expect(scene.io._tweens).toHaveLength(1);
    //         expect(tween.isRunning()).toBeTruthy();

    //         await UTILS.pushEvent(ui.loop, UTILS.tick(50));
    //         expect(tween._time).toBeGreaterThan(0);

    //         while (tween.isRunning()) {
    //             await UTILS.pushEvent(ui.loop, UTILS.tick(50));
    //         }

    //         expect(obj.x).toEqual(10);

    //         expect(scene.io._tweens).toHaveLength(0);

    //         scene.finish();
    //         await p;
    //     });

    //     test.skip('advanced', async () => {
    //         /*
    //             // tween, but do not directly update object
    //             widget.animate().from({ opacity: 0 })
    //             .duration(1000)
    //             .onUpdate( () => {
    //                 console.log('Updating!!');  // should still be able to do this even though we are going to catch it internally
    //             })
    //             .onFinish( () => {
    //                 this.widget.toggleClass('test');
    //                 this.widget.prop('empty', true);
    //             })
    //             .start();   // adds to layer
    //         */
    //     });
    // });

    describe('frame', () => {
        test('keypress', () => {
            const sceneFn = jest.fn();
            scene.on('keypress', sceneFn);

            const ev = TEST.keypress('Enter');
            app._input(ev);
            expect(sceneFn).toHaveBeenCalledWith(ev);
        });

        test('keypress - Enter', () => {
            const sceneFn = jest.fn();
            scene.on('keypress', sceneFn);

            const ev = TEST.keypress('Enter');
            app._input(ev);
            expect(sceneFn).toHaveBeenCalledWith(ev);
        });

        test('click', () => {
            const sceneFn = jest.fn();
            scene.on('click', sceneFn);

            const ev = TEST.click(10, 8);
            app._input(ev);
            expect(sceneFn).toHaveBeenCalledWith(ev);
        });

        test('mousemove', () => {
            const sceneFn = jest.fn();
            scene.on('mousemove', sceneFn);

            const ev = TEST.mousemove(10, 8);
            expect(ev.type).toEqual('mousemove');
            app._input(ev);
            expect(sceneFn).toHaveBeenCalledWith(ev);
        });

        test('update', () => {
            const sceneFn = jest.fn();
            scene.on('update', sceneFn);

            app._update(16);
            expect(sceneFn).toHaveBeenCalledWith(16);
        });

        test('draw', () => {
            const sceneFn = jest.fn();
            scene.on('draw', sceneFn);

            expect(scene.needsDraw).toBeTruthy();
            app._draw();
            expect(scene.needsDraw).toBeFalsy();
            expect(sceneFn).toHaveBeenCalled();
        });
    });
});
