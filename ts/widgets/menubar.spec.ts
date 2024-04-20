import 'jest-extended';
import '../../test/matchers';

import * as TEST from '../../test/utils';
// import * as Color from '../color';
import * as BUFFER from '../buffer';

import * as APP from '../app';
import * as CANVAS from '../canvas';

import * as MENUBAR from './menubar';
import * as BUILD from './builder';
import '../scenes/menu';

describe('Text Widget', () => {
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

    test('create', () => {
        const menubar = new MENUBAR.Menubar({
            scene,
            buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
        });

        expect(scene.focused).toBe(menubar.getChild('File'));

        app._draw();
        expect(TEST.getBufferText(buffer, 0, 0, 30)).toEqual(
            'File | Edit | View'
        );
    });

    describe('focus - simple', () => {
        beforeEach(() => {
            build.input({ id: 'INPUT', x: 5, y: 5, width: 10 });
        });

        test('tab', () => {
            build.menubar({
                buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
            });

            expect(scene.focused!.id).toBe('INPUT');

            app._input(TEST.keypress('Tab'));
            expect(scene.focused!.id).toBe('File');

            app._input(TEST.keypress('Tab'));
            expect(scene.focused!.id).toBe('Edit');

            app._input(TEST.keypress('Tab'));
            expect(scene.focused!.id).toBe('View');

            app._input(TEST.keypress('Tab'));
            expect(scene.focused!.id).toBe('INPUT');

            app._input(TEST.keypress('Tab'));
            expect(scene.focused!.id).toBe('File');
        });

        test('TAB', () => {
            build.menubar({
                buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
            });

            expect(scene.focused!.id).toBe('INPUT');

            app._input(TEST.keypress('TAB'));
            expect(scene.focused!.id).toBe('View');

            app._input(TEST.keypress('TAB'));
            expect(scene.focused!.id).toBe('Edit');

            app._input(TEST.keypress('TAB'));
            expect(scene.focused!.id).toBe('File');

            app._input(TEST.keypress('TAB'));
            expect(scene.focused!.id).toBe('INPUT');

            app._input(TEST.keypress('TAB'));
            expect(scene.focused!.id).toBe('View');
        });
    });

    test('simple action', () => {
        build.menubar({
            buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
        });

        app._draw();
        expect(TEST.getBufferText(buffer, 0, 0, 30)).toEqual(
            'File | Edit | View'
        );

        const fileFn = jest.fn();
        scene.on('FILE', fileFn);

        const editFn = jest.fn();
        scene.on('EDIT', editFn);

        const viewFn = jest.fn();
        scene.on('VIEW', viewFn);

        app._input(TEST.keypress('Enter'));
        expect(fileFn).toHaveBeenCalled();
        fileFn.mockClear();

        app._input(TEST.keypress('Tab'));

        app._input(TEST.keypress(' '));
        expect(editFn).toHaveBeenCalled();
        editFn.mockClear();

        app._input(TEST.click(15, 0));
        expect(viewFn).toHaveBeenCalled();
        viewFn.mockClear();

        // expect(menubar.selectedIndex).toEqual(2);
    });

    describe('sub-menu', () => {
        test('show', () => {
            const closeFn = jest.fn();
            scene.on('CLOSE', closeFn);

            // @ts-ignore
            const menubar = new MENUBAR.Menubar({
                scene,
                buttons: {
                    File: {
                        Open: 'OPEN',
                        Close: 'CLOSE',
                        Save: 'SAVE',
                    },
                    Edit: {
                        Cut: 'CUT',
                        Paste: 'PASTE',
                        Copy: 'COPY',
                    },
                    View: {
                        'Whole Screen': 'FULLSCREEN',
                        Minimize: 'MINIMIZE',
                        Zoom: 'ZOOM',
                    },
                },
            });

            // expect(scene.focused).toBe(menubar);

            const pauseFn = jest.fn();
            const resumeFn = jest.fn();
            scene.on('pause', pauseFn);
            scene.on('resume', resumeFn);

            const fileClickFn = jest.fn();
            const fileBtn = menubar.getChild('File')!;
            fileBtn.on('click', fileClickFn);

            jest.spyOn(app.scenes, 'show');

            app._input(TEST.click(2, 0));

            expect(fileClickFn).toHaveBeenCalled();
            expect(pauseFn).toHaveBeenCalled();
            expect(app.scenes.show).toHaveBeenCalledWith('menu', {
                menu: fileBtn.data('menu'),
                origin: scene,
            });

            expect(app.scene).not.toBe(scene);

            app._draw();
            // app.scene.buffer.dump();

            expect(TEST.getBufferText(app.scene.buffer, 1, 1)).toEqual('Open');
            expect(TEST.getBufferText(app.scene.buffer, 1, 2)).toEqual('Close');
            expect(TEST.getBufferText(app.scene.buffer, 1, 3)).toEqual('Save');

            // expect(scene.focused).not.toBe(menubar);

            app._input(TEST.click(2, 2));
            expect(closeFn).toHaveBeenCalled();

            // expect(scene.focused).toBe(menubar);

            app._draw();
            // buffer.dump();
        });
    });
});
