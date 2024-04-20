import * as WIDGET from './index';

describe('make', () => {
    test('add function', () => {
        const draw = jest.fn();
        const update = jest.fn();
        const setTech = jest.fn();
        const eat = jest.fn();

        const w = WIDGET.make({
            tag: 'TECH',
            id: 'TECH',

            draw,
            update,
            on: { eat },
            with: { setTech },
        });

        w.setTech('advanced');

        expect(setTech).toHaveBeenCalledWith('advanced');
    });
});
