import * as TEST from '../../test/utils';
import * as TEXT from '../text';
import * as APP from '../app';
import * as CANVAS from '../canvas';
// import * as BODY from './body';

import * as TABLE from './datatable';

describe('DataTable', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: APP.Scene;

    beforeEach(() => {
        canvas = TEST.mockCanvas();
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
    });

    test('Column', () => {
        const col = new TABLE.Column({
            header: 'HEADER',
            width: 10,
            format: '{{age}} years',
        });

        expect(col.format({ age: 5 })).toEqual('5 years');
    });

    test('no size', () => {
        expect(
            () =>
                new TABLE.DataTable({
                    id: 'ID',
                    columns: [{ width: 3, header: 'ID', format: '§id§' }],
                })
        ).not.toThrow();
    });

    test('no columns', () => {
        expect(
            () =>
                new TABLE.DataTable({ scene, id: 'ID', size: 10, columns: [] })
        ).not.toThrow();
    });

    test('simple', () => {
        const table = new TABLE.DataTable({
            scene,
            id: 'TABLE',
            header: true, // show a header on top of each column
            size: 10,
            border: 'none',
            columns: [
                {
                    width: 10,
                    header: 'Item',
                    format: ((d: { count: number; name: string }) => {
                        if (d.count) return `${d.count} ${d.name}s`;
                        return d.name;
                    }) as TEXT.Template,
                },
                { width: 5, header: 'Each', format: '${{price%4d}}' },
            ],
        });

        expect(table.bounds.width).toEqual(15);

        expect(table.columns).toHaveLength(2);

        expect(table.columns[0].header).toEqual('Item');
        expect(table.columns[1].header).toEqual('Each');

        expect(
            table.columns[0].format({ count: 3, name: 'Apple', price: 4 })
        ).toEqual('3 Apples');
        expect(
            table.columns[1].format({ count: 3, name: 'Apple', price: 4 })
        ).toEqual('$   4');
    });
});
