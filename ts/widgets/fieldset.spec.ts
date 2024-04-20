import * as TEST from '../../test/utils';
// import * as TEXT from '../text';
import * as APP from '../app';
import * as CANVAS from '../canvas';
import * as BUILD from './builder';

// import * as FIELD from './fieldset';

describe('Fieldset', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: APP.Scene;
    let build: BUILD.Builder;

    beforeEach(() => {
        canvas = TEST.mockCanvas(50, 30);
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
        build = new BUILD.Builder(scene);
    });

    test('create obj', () => {
        const e = build.fieldset({
            width: 30,
            dataWidth: 10,
            height: 10,
            x: 5,
            y: 5,
            legend: 'LEGEND',
        });

        expect(e.bounds).toMatchObject({ x: 5, y: 5, width: 30, height: 10 });

        app._draw();

        expect(TEST.getBufferText(scene.buffer, 5, 5, 20)).toEqual('LEGEND');
        // scene.buffer.dump();
    });

    // function info(w: Widget) {
    //     let base = `${w.tag}(${w.text()}) @ ${w.bounds.toString()}`;
    //     return base;
    // }

    test('add children', () => {
        // console.log(layer.allWidgets.map((w) => info(w)));

        const fs = build.fieldset({
            legend: 'LEGEND',
            x: 10,
            y: 5,
            separator: ':',
            width: 20,
            dataWidth: 10,
        });

        // console.log(layer.allWidgets.map((w) => info(w)));
        fs.add('Age', '{{age%10d}}');
        fs.add('Height', '{{height%10s}}');
        fs.add('Weight', '{{weight%10d}}');

        fs.data({ age: 4, height: "6'2", weight: 190 });

        // console.log(layer.allWidgets.map((w) => info(w)));
        app._draw();

        // scene.buffer.dump();

        expect(TEST.getBufferText(scene.buffer, 10, 5, 20)).toEqual('LEGEND');
        expect(TEST.getBufferText(scene.buffer, 10, 6, 20)).toEqual(
            'Age      :         4'
        );
        expect(TEST.getBufferText(scene.buffer, 10, 7, 20)).toEqual(
            "Height   :       6'2"
        );
        expect(TEST.getBufferText(scene.buffer, 10, 8, 20)).toEqual(
            'Weight   :       190'
        );

        expect(fs.bounds).toMatchObject({
            x: 10,
            y: 5,
            width: 20,
            height: 4,
        });
    });

    test('border + pad', () => {
        // console.log(layer.allWidgets.map((w) => info(w)));

        const fs = build.fieldset({
            legend: 'LEGEND',
            x: 10,
            y: 5,
            separator: ' : ',
            width: 25,
            dataWidth: 10,
            border: 'ascii',
            pad: [0, 1],
        });

        // console.log(layer.allWidgets.map((w) => info(w)));
        fs.add('Age', '{{age%10d}}');
        fs.add('Height', '{{height%10s}}');
        fs.add('Weight', '{{weight%10d}}');

        fs.data({ age: 4, height: "6'2", weight: 190 });

        // console.log(layer.allWidgets.map((w) => info(w)));
        scene.draw(scene.buffer);

        // scene.buffer.dump();

        expect(TEST.getBufferText(scene.buffer, 10, 5, 30)).toEqual(
            '+-LEGEND----------------+'
        );
        expect(TEST.getBufferText(scene.buffer, 10, 6, 30)).toEqual(
            '| Age      :          4 |'
        );
        expect(TEST.getBufferText(scene.buffer, 10, 7, 30)).toEqual(
            "| Height   :        6'2 |"
        );
        expect(TEST.getBufferText(scene.buffer, 10, 8, 30)).toEqual(
            '| Weight   :        190 |'
        );

        expect(fs.bounds).toMatchObject({
            x: 10,
            y: 5,
            width: 25,
            height: 5,
        });
    });

    // test('local style', () => {
    //     expect(doc.stylesheet.get('fieldset')).not.toBeNull();

    //     const $fs = doc
    //         .create('<fieldset legend=LEGEND style="marginTop:0">')
    //         .pos(10, 5)
    //         .appendTo('body');
    //     for (let i = 0; i < 5; ++i) {
    //         $fs.append('<div>Testing</div>');
    //     }

    //     doc.computeStyles();
    //     doc.updateLayout();
    //     doc.draw();

    //     const fs = $fs.get(0);

    //     expect(fs.used('marginTop')).toEqual(0);
    //     expect(fs.used('marginRight')).toEqual(1);
    //     expect(fs.used('marginBottom')).toEqual(1);
    //     expect(fs.used('marginLeft')).toEqual(1);
    //     expect(fs.used('padTop')).toEqual(1);
    //     expect(fs.used('padRight')).toEqual(1);
    //     expect(fs.used('padBottom')).toEqual(1);
    //     expect(fs.used('padLeft')).toEqual(1);
    //     expect(fs.used('border')).toEqual('dark_gray');

    //     expect(fs.bounds).toMatchObject({
    //         x: 10,
    //         y: 5,
    //         width: 13,
    //         height: 10,
    //     });

    //     // ui.buffer.dump();
    // });
});
