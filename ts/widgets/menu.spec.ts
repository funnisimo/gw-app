import 'jest-extended';
import { Menu } from '.';
import '../../test/matchers';

import * as TEST from '../../test/utils';
// import * as Color from '../color';
import * as BUFFER from '../buffer';

import * as APP from '../app';
import * as CANVAS from '../canvas';

import * as MENU from './menu';

describe('Text Widget', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: APP.Scene;
    let buffer: BUFFER.Buffer;

    beforeEach(() => {
        canvas = TEST.mockCanvas();
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
        buffer = scene.buffer;
    });

    test('create', () => {
        const menu = new MENU.Menu({
            buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
            x: 5,
            y: 5,
        });

        scene.addChild(menu);

        expect(menu.hidden).toBeFalsy();
        expect(scene.focused).toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('File');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('View');

        menu.hidden = true;
        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('');
    });

    test('show/hide - root', () => {
        const menu = new MENU.Menu({
            buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
            x: 5,
            y: 5,
        });

        scene.addChild(menu);

        expect(menu.hidden).toBeFalsy();
        expect(scene.focused).toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('File');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('View');

        // input????

        menu.hide();
        expect(menu.hidden).toBeTruthy();
        expect(scene.focused).not.toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('');

        menu.show();
        expect(menu.hidden).toBeFalsy();
        expect(scene.focused).toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('File');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('View');
    });

    test('click - action', () => {
        const menu = new MENU.Menu({
            buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
            x: 5,
            y: 5,
        });

        scene.addChild(menu);

        expect(menu.hidden).toBeFalsy();
        expect(scene.focused).toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('File');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('View');

        const fileFn = jest.fn();
        scene.on('FILE', fileFn);

        app._input(TEST.click(7, 5));

        expect(fileFn).toHaveBeenCalled();
        expect(menu.hidden).toBeTruthy();

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('');
    });

    test('spacebar - action', () => {
        const menu = new MENU.Menu({
            buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
            x: 5,
            y: 5,
        });

        scene.addChild(menu);

        expect(menu.hidden).toBeFalsy();
        expect(scene.focused).toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('File');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('View');

        expect(menu._selectedIndex).toEqual(0);

        const editFn = jest.fn();
        scene.on('EDIT', editFn);

        app._input(TEST.dir('up'));
        expect(menu._selectedIndex).toEqual(2);

        app._input(TEST.dir('up'));
        expect(menu._selectedIndex).toEqual(1);

        app._input(TEST.keypress(' '));

        expect(editFn).toHaveBeenCalled();
        expect(menu.hidden).toBeTruthy();

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('');
    });

    test('Enter - action', () => {
        const menu = new MENU.Menu({
            buttons: { File: 'FILE', Edit: 'EDIT', View: 'VIEW' },
            x: 5,
            y: 5,
        });

        scene.addChild(menu);

        expect(menu.hidden).toBeFalsy();
        expect(scene.focused).toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('File');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('View');

        expect(menu._selectedIndex).toEqual(0);

        const fileFn = jest.fn();
        scene.on('FILE', fileFn);

        app._input(TEST.dir('down'));
        expect(menu._selectedIndex).toEqual(1);

        app._input(TEST.dir('down'));
        expect(menu._selectedIndex).toEqual(2);

        app._input(TEST.dir('down'));
        expect(menu._selectedIndex).toEqual(0);

        expect(scene.focused).toBe(menu);
        app._input(TEST.keypress('Enter'));

        expect(fileFn).toHaveBeenCalled();
        expect(menu.hidden).toBeTruthy();

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('');
    });

    test('expand submenu', () => {
        const menu = new MENU.Menu({
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
            x: 5,
            y: 5,
        });

        scene.addChild(menu);

        expect(menu.hidden).toBeFalsy();
        expect(scene.focused).toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 20)).toEqual('File ▶');
        expect(TEST.getBufferText(buffer, 5, 6, 20)).toEqual('Edit ▶');
        expect(TEST.getBufferText(buffer, 5, 7, 20)).toEqual('View ▶');

        expect(menu._selectedIndex).toEqual(0);

        const openFn = jest.fn();
        scene.on('OPEN', openFn);

        app._input(TEST.dir('right'));
        expect(menu._selectedIndex).toEqual(0);

        app._draw();
        // buffer.dump();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('File ▶Open');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit ▶Close');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('View ▶Save');

        expect(scene.focused).not.toBe(menu);
        app._input(TEST.keypress('Enter'));

        expect(openFn).toHaveBeenCalled();
        expect(menu.hidden).toBeTruthy();

        expect(scene.focused).toBe(null);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('');
    });

    test('menu->submenu->submenu2', () => {
        const menu = new MENU.Menu({
            buttons: {
                File: {
                    Open: {
                        Existing: 'EXISTING',
                        New: 'NEW',
                        Import: 'IMPORT',
                    },
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
            x: 5,
            y: 5,
        });

        scene.addChild(menu);

        expect(menu.hidden).toBeFalsy();
        expect(scene.focused).toBe(menu);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 20)).toEqual('File ▶');
        expect(TEST.getBufferText(buffer, 5, 6, 20)).toEqual('Edit ▶');
        expect(TEST.getBufferText(buffer, 5, 7, 20)).toEqual('View ▶');

        expect(menu._selectedIndex).toEqual(0);

        const newFn = jest.fn();
        scene.on('NEW', newFn);

        app._input(TEST.dir('right'));
        expect(menu._selectedIndex).toEqual(0);

        let sub = scene.focused as Menu;
        expect(sub.parent!.parent).toBe(menu);
        expect(sub._selectedIndex).toEqual(0);

        app._draw();
        // buffer.dump();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('File ▶Open ▶');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit ▶Close');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('View ▶Save');

        app._input(TEST.dir('right'));

        const sub2 = scene.focused as Menu;
        expect(sub2.parent!.parent).toBe(sub);
        expect(sub2._selectedIndex).toEqual(0);

        app._draw();
        // buffer.dump();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual(
            'File ▶Open ▶Existing'
        );
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('Edit ▶Close New');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual(
            'View ▶Save  Import'
        );

        app._input(TEST.dir('down'));
        expect(sub2._selectedIndex).toEqual(1);

        app._input(TEST.keypress('Enter'));

        expect(newFn).toHaveBeenCalled();
        expect(menu.hidden).toBeTruthy();

        expect(scene.focused).toBe(null);

        app._draw();
        expect(TEST.getBufferText(buffer, 5, 5, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 6, 30)).toEqual('');
        expect(TEST.getBufferText(buffer, 5, 7, 30)).toEqual('');
    });
});
