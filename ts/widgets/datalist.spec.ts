import * as TEST from '../../test/utils';
// import * as TEXT from '../text';
import * as APP from '../app';
import * as CANVAS from '../canvas';

import * as LIST from './datalist';

describe('DataTable', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: APP.Scene;

    beforeEach(() => {
        canvas = TEST.mockCanvas();
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
    });

    test('constructor', () => {
        const dl = new LIST.DataList({ scene });
        expect(dl.columns).toHaveLength(1);
        expect(dl.columns[0]).toMatchObject({ width: 10 });
    });

    test('default', () => {
        const dl = new LIST.DataList({
            scene,
            x: 10,
            y: 5,
            empty: '-',
            border: 'none',
        });

        app._draw();
        // scene.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 1 }); // default width, height
        expect(TEST.getBufferText(scene.buffer, 10, 5, 10)).toEqual('-'); // default empty text

        dl.data(['Taco', 'Salad', 'Sandwich']);
        app._draw();

        // scene.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 3 }); // width, height from content
        expect(TEST.getBufferText(scene.buffer, 10, 5, 10)).toEqual('Taco');
        expect(TEST.getBufferText(scene.buffer, 10, 6, 10)).toEqual('Salad');
        expect(TEST.getBufferText(scene.buffer, 10, 7, 10)).toEqual('Sandwich');
    });

    test('legend', () => {
        const dl = new LIST.DataList({
            scene,
            header: 'Foods',
            border: 'none',
            x: 10,
            y: 5,
        });

        app._draw(); // calculateStyles, updateLayout, draw

        // scene.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 2 }); // default width, height=legend + empty
        expect(TEST.getBufferText(scene.buffer, 10, 5, 10)).toEqual('Foods'); // legend
        expect(TEST.getBufferText(scene.buffer, 10, 6, 10)).toEqual(''); // default empty text

        dl.data(['Taco', 'Salad', 'Sandwich']);
        app._draw();

        // scene.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 4 }); // width, height from content + legend
        expect(TEST.getBufferText(scene.buffer, 10, 5, 10)).toEqual('Foods'); // legend
        expect(TEST.getBufferText(scene.buffer, 10, 6, 10)).toEqual('Taco');
        expect(TEST.getBufferText(scene.buffer, 10, 7, 10)).toEqual('Salad');
        expect(TEST.getBufferText(scene.buffer, 10, 8, 10)).toEqual('Sandwich');
    });

    test('data', () => {
        const dl = new LIST.DataList({
            scene,
            x: 10,
            y: 5,
            data: ['Apple', 'Banana', 'Carrot'],
            border: 'none',
        });

        expect(dl._data).toHaveLength(3);
        expect(dl.children).toHaveLength(3);

        // expect(layer._depthOrder.includes(dl.children[0]));
        // expect(layer._depthOrder.includes(dl.children[1]));
        // expect(layer._depthOrder.includes(dl.children[2]));

        expect(dl.children[0].tag).toEqual('td');
        expect(dl.children[0].text()).toEqual('Apple');
        expect(dl.children[1].tag).toEqual('td');
        expect(dl.children[1].text()).toEqual('Banana');
        expect(dl.children[2].tag).toEqual('td');
        expect(dl.children[2].text()).toEqual('Carrot');

        app._draw();
        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 3 });

        // expect(layer._depthOrder).toContain(dl.children[0]);
        // expect(layer._depthOrder).toContain(dl.children[1]);
        // expect(layer._depthOrder).toContain(dl.children[2]);

        // const oldChildren = dl.children.slice();

        dl.data(['1234567890', 'HUMMINGBIRD', 'CRANE', 'BLUE-JAY', 'ROBIN']);
        expect(dl.data()).toHaveLength(5);
        expect(dl.children).toHaveLength(5);

        // expect(layer._depthOrder).not.toContain(oldChildren[0]);
        // expect(layer._depthOrder).not.toContain(oldChildren[1]);
        // expect(layer._depthOrder).not.toContain(oldChildren[2]);

        app._draw();
        // expect(layer._depthOrder).toContain(dl.children[0]);
        // expect(layer._depthOrder).toContain(dl.children[1]);
        // expect(layer._depthOrder).toContain(dl.children[2]);
        // expect(layer._depthOrder).toContain(dl.children[3]);
        // expect(layer._depthOrder).toContain(dl.children[4]);
        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 5 });

        expect(TEST.getBufferText(scene.buffer, 10, 5, 20)).toEqual(
            '1234567890'
        );
        expect(TEST.getBufferText(scene.buffer, 10, 6, 20)).toEqual(
            'HUMMINGBI-'
        ); // truncated!
        expect(TEST.getBufferText(scene.buffer, 10, 7, 20)).toEqual('CRANE');
        expect(TEST.getBufferText(scene.buffer, 10, 8, 20)).toEqual('BLUE-JAY');
        expect(TEST.getBufferText(scene.buffer, 10, 9, 20)).toEqual('ROBIN');
    });
});
