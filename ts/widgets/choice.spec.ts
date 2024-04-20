import * as TEST from '../../test/utils';
// import * as TEXT from '../text';
import * as APP from '../app';
import * as CANVAS from '../canvas';
// import * as BODY from './body';

import * as CHOICE from './choice';

describe('Prompt', () => {
    test('basic', () => {
        // fields
        const p = new CHOICE.Prompt('question?')
            .choice('a')
            .choice('b')
            .choice('c');
        expect(p.field()).toEqual('');
        expect(p.prompt()).toEqual('question?');
        expect(p.choices()).toEqual(['a', 'b', 'c']);
        expect(p._infos).toEqual(['', '', '']);
    });

    test('basic - choice only', () => {
        const p2 = new CHOICE.Prompt('question?', 'field').choices([
            'a',
            'b',
            'c',
        ]);
        expect(p2.field()).toEqual('field');
        expect(p2.prompt()).toEqual('question?');
        expect(p2.choices()).toEqual(['a', 'b', 'c']);
        expect(p2._infos).toEqual(['', '', '']);
    });

    test('basic - object', () => {
        const q = new CHOICE.Prompt('question?', 'field').choices({
            A: 'text A',
            B: 'text B',
            C: 'text C',
        });

        expect(q.field()).toEqual('field');
        expect(q.prompt()).toEqual('question?');
        expect(q.choices()).toEqual(['A', 'B', 'C']);
        expect(q._infos).toEqual(['text A', 'text B', 'text C']);
    });

    test('basic - array', () => {
        const q = new CHOICE.Prompt('question?', 'field').choices(
            ['A', 'B', 'C'],
            ['text A', 'text B', 'text C']
        );

        expect(q.prompt()).toEqual('question?');
        expect(q.choices()).toEqual(['A', 'B', 'C']);
        expect(q._infos).toEqual(['text A', 'text B', 'text C']);
        expect(q.selection).toEqual(-1);
        expect(q.next()).toBeNull();
    });

    test('basic - build', () => {
        const q = new CHOICE.Prompt('question?', 'field')
            .choice('A', 'text A')
            .choice('B', 'text B')
            .choice('C', 'text C');

        expect(q.field()).toEqual('field');
        expect(q.prompt()).toEqual('question?');
        expect(q.choices()).toEqual(['A', 'B', 'C']);
        expect(q._infos).toEqual(['text A', 'text B', 'text C']);
    });

    test('next - individual', () => {
        const q = new CHOICE.Prompt('question?', {
            field: 'field',
            next: 'NEXT',
            id: 'ID',
        })
            .choice('A', { info: 'text A', next: 'A', value: 'TACO' })
            .choice('B', { info: 'text B', next: 'B', value: 'MILK' })
            .choice('C', 'text C');

        expect(q.prompt()).toEqual('question?');
        expect(q.choices()).toEqual(['A', 'B', 'C']);
        expect(q._infos).toEqual(['text A', 'text B', 'text C']);
        expect(q.next()).toEqual('NEXT');
        expect(q.id()).toEqual('ID');

        q.selection = 0;
        expect(q.next()).toEqual('A');

        q.selection = 1;
        expect(q.next()).toEqual('B');

        q.selection = 2;
        expect(q.next()).toEqual('NEXT');
    });
});

describe('Choice', () => {
    let canvas: CANVAS.Canvas;
    let app: APP.App;
    let scene: APP.Scene;

    beforeEach(() => {
        canvas = TEST.mockCanvas();
        app = APP.make({ canvas, start: false, scene: true });
        scene = app.scene;
    });

    test('create', async () => {
        const choice = new CHOICE.Choice({
            scene,
            width: 60,
            choiceWidth: 20,
            height: 20,
        });
        expect(scene.focused).toBe(choice._list); // enables keypress,dir

        const prompt = new CHOICE.Prompt('question?').choices(['A', 'B', 'C']);
        expect(prompt.selection).toEqual(-1);

        const changeFn = jest.fn();
        choice.on('change', changeFn);

        const actionFn = jest.fn();
        choice.on('action', actionFn);

        const promise = choice.showPrompt(prompt);

        expect(prompt.selection).toEqual(0);
        expect(prompt.value()).toEqual('A');
        expect(changeFn).toHaveBeenCalled(); // new value selected
        expect(actionFn).not.toHaveBeenCalled();

        actionFn.mockClear();
        changeFn.mockClear();
        app._input(TEST.dir('down'));
        expect(prompt.selection).toEqual(1);
        expect(prompt.value()).toEqual('B');
        expect(changeFn).toHaveBeenCalled();
        expect(actionFn).not.toHaveBeenCalled();

        actionFn.mockClear();
        changeFn.mockClear();
        app._input(TEST.keypress('Enter'));
        expect(prompt.selection).toEqual(1);
        expect(prompt.value()).toEqual('B');
        expect(actionFn).toHaveBeenCalled();
        expect(changeFn).not.toHaveBeenCalled();

        expect(await promise).toEqual('B');
    });
});

describe('Inquiry', () => {});
