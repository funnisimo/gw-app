import '../../test/matchers';

import * as TEST from '../../test/utils';
// import * as COLOR from '../color';
import * as APP from '../app';
import * as CANVAS from '../canvas';
import * as BUFFER from '../buffer';
import * as BUILD from './builder';

// import * as CHECK from './checkbox';

describe('Checkbox', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: APP.Scene;
    let buffer: BUFFER.Buffer;
    let build: BUILD.Builder;

    beforeEach(() => {
        canvas = TEST.mockCanvas();
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
        buffer = scene.buffer;
        build = new BUILD.Builder(scene);
    });

    test('create obj', () => {
        const e = build.checkbox({ text: 'checkbox' });

        expect(e.tag).toEqual('checkbox');
        expect(e.attr('value')).toEqual('on');
        expect(e.attr('check')).toEqual('\u2612');
        expect(e.attr('uncheck')).toEqual('\u2610');
    });

    test('keypress', async () => {
        const el = build.checkbox({ text: 'checkbox' });
        expect(scene.focused).toBe(el);

        const inputFn = jest.fn();
        el.on('change', inputFn);

        expect(el.prop('checked')).toBeFalsy();
        app._input(TEST.keypress(' '));
        expect(inputFn).toHaveBeenCalled();
        expect(el.prop('checked')).toBeTruthy();

        inputFn.mockClear();
        app._input(TEST.keypress(' '));
        expect(inputFn).toHaveBeenCalled();
        expect(el.prop('checked')).toBeFalsy();
    });

    test('click', async () => {
        const el = build.checkbox({ text: 'checkbox' });

        expect(el.contains(0, 0)).toBeTruthy();
        const inputFn = jest.fn();
        el.on('click', inputFn);

        expect(el.prop('checked')).toBeFalsy();
        app._input(TEST.click(0, 0));
        expect(inputFn).toHaveBeenCalled();
        expect(el.focused).toBeTruthy();
        expect(scene.focused).toBe(el);
        expect(el.prop('checked')).toBeTruthy();

        inputFn.mockClear();
        app._input(TEST.click(0, 0));
        expect(inputFn).toHaveBeenCalled();
        expect(el.prop('checked')).toBeFalsy();
    });

    test('draw', () => {
        const text = 'checkbox';
        const w = build.checkbox({ text, uncheck: 'O' });

        expect(w._fixedWidth).toBeFalsy();
        expect(w._attrInt('pad')).toEqual(1);
        expect(w.bounds.width).toEqual(text.length + 1 + 1);

        app._draw();

        // buffer.dump();

        expect(TEST.getBufferText(buffer, 0, 0, 20)).toEqual('O checkbox');
    });
});
