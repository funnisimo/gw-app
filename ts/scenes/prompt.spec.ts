import * as TEST from '../../test/utils';
import * as APP from '../app';
import * as CANVAS from '../canvas';
import * as BUFFER from '../buffer';
import * as BUILD from '../widgets/builder';
import './prompt';

// import * as BORDER from './border';

describe('Body', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: APP.Scene;
    let buffer: BUFFER.Buffer;
    let build: BUILD.Builder;

    beforeEach(() => {
        canvas = TEST.mockCanvas(50, 30);
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
        build = new BUILD.Builder(scene);
    });

    test('text', () => {
        build.pos(10, 10).text('testing testing testing');

        expect(app.scene).toBe(scene);

        const stopFn = jest.fn();
        const doneFn = jest.fn();
        const prompt = app.prompt('What do you want to eat?', { done: doneFn });
        prompt.once('stop', stopFn);
        expect(app.scene).toBe(prompt);

        buffer = prompt.buffer;

        app._draw();

        app._input(TEST.keypress('T'));
        app._input(TEST.keypress('a'));
        app._input(TEST.keypress('c'));
        app._input(TEST.keypress('o'));
        app._input(TEST.keypress('s'));

        app._draw();
        // buffer.dump();
        expect(TEST.getBufferText(buffer, 10, 13)).toEqual(
            '+--------------------------+'
        );
        expect(TEST.getBufferText(buffer, 10, 14)).toEqual(
            '| What do you want to eat? |'
        );
        expect(TEST.getBufferText(buffer, 10, 15)).toEqual(
            '| Tacos                    |'
        );
        expect(TEST.getBufferText(buffer, 10, 16)).toEqual(
            '+--------------------------+'
        );

        app._input(TEST.keypress('Enter'));
        expect(doneFn).toHaveBeenCalledWith('Tacos');
        expect(stopFn).toHaveBeenCalledWith('Tacos');

        expect(app.scene).toBe(scene);
    });

    test(' cancel', () => {
        build.pos(10, 10).text('testing testing testing');

        expect(app.scene).toBe(scene);

        const stopFn = jest.fn();
        const prompt = app.prompt('What do you want to eat?');
        prompt.once('stop', stopFn);
        expect(app.scene).toBe(prompt);

        app._draw();
        buffer = prompt.buffer;

        app._input(TEST.keypress('T'));
        app._input(TEST.keypress('a'));
        app._input(TEST.keypress('c'));
        app._input(TEST.keypress('o'));
        app._input(TEST.keypress('s'));

        app._draw();
        // buffer.dump();
        expect(TEST.getBufferText(buffer, 10, 13)).toEqual(
            '+--------------------------+'
        );
        expect(TEST.getBufferText(buffer, 10, 14)).toEqual(
            '| What do you want to eat? |'
        );
        expect(TEST.getBufferText(buffer, 10, 15)).toEqual(
            '| Tacos                    |'
        );
        expect(TEST.getBufferText(buffer, 10, 16)).toEqual(
            '+--------------------------+'
        );

        app._input(TEST.keypress('Escape'));

        expect(stopFn).toHaveBeenCalledWith(null);
    });

    test('label', () => {
        build.pos(10, 10).text('testing testing testing');

        expect(app.scene).toBe(scene);

        const doneFn = jest.fn();
        const prompt = app.prompt('What do you want to eat?', {
            label: 'Food:',
            done: doneFn,
        });
        buffer = prompt.buffer;
        expect(app.scene).toBe(prompt);

        app._draw();

        app._input(TEST.keypress('T'));
        app._input(TEST.keypress('a'));
        app._input(TEST.keypress('c'));
        app._input(TEST.keypress('o'));
        app._input(TEST.keypress('s'));

        app._draw();
        // buffer.dump();
        expect(TEST.getBufferText(buffer, 10, 13)).toEqual(
            '+--------------------------+'
        );
        expect(TEST.getBufferText(buffer, 10, 14)).toEqual(
            '| What do you want to eat? |'
        );
        expect(TEST.getBufferText(buffer, 10, 15)).toEqual(
            '| Food: Tacos              |'
        );
        expect(TEST.getBufferText(buffer, 10, 16)).toEqual(
            '+--------------------------+'
        );

        app._input(TEST.keypress('Enter'));

        expect(doneFn).toHaveBeenCalledWith('Tacos');
    });

    test('done text', () => {
        build.pos(10, 10).text('testing testing testing');

        const doneFn = jest.fn();

        app.prompt('What do you want to eat?', { done: doneFn });
        buffer = app.scene.buffer;

        app._draw();

        app._input(TEST.keypress('T'));
        app._input(TEST.keypress('a'));
        app._input(TEST.keypress('c'));
        app._input(TEST.keypress('o'));
        app._input(TEST.keypress('s'));

        app._draw();
        // buffer.dump();
        expect(TEST.getBufferText(buffer, 10, 13)).toEqual(
            '+--------------------------+'
        );
        expect(TEST.getBufferText(buffer, 10, 14)).toEqual(
            '| What do you want to eat? |'
        );
        expect(TEST.getBufferText(buffer, 10, 15)).toEqual(
            '| Tacos                    |'
        );
        expect(TEST.getBufferText(buffer, 10, 16)).toEqual(
            '+--------------------------+'
        );

        app._input(TEST.keypress('Enter'));

        expect(doneFn).toHaveBeenCalledWith('Tacos');
    });

    test('done cancel', async () => {
        build.pos(10, 10).text('testing testing testing');

        const doneFn = jest.fn();

        const prompt = app.prompt('What do you want to eat?', {
            done: doneFn,
        });
        buffer = prompt.buffer;

        expect(app.scene).toBe(prompt);

        app._draw();

        app._input(TEST.keypress('T'));
        app._input(TEST.keypress('a'));
        app._input(TEST.keypress('c'));
        app._input(TEST.keypress('o'));
        app._input(TEST.keypress('s'));

        app._draw();
        // buffer.dump();
        expect(TEST.getBufferText(buffer, 10, 13)).toEqual(
            '+--------------------------+'
        );
        expect(TEST.getBufferText(buffer, 10, 14)).toEqual(
            '| What do you want to eat? |'
        );
        expect(TEST.getBufferText(buffer, 10, 15)).toEqual(
            '| Tacos                    |'
        );
        expect(TEST.getBufferText(buffer, 10, 16)).toEqual(
            '+--------------------------+'
        );

        app._input(TEST.keypress('Escape'));

        expect(doneFn).toHaveBeenCalledWith(null);
    });
});
