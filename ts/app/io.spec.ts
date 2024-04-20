import 'jest-extended';
import { KEYPRESS, Event, MOUSEMOVE } from './io';

describe('IO', () => {
    test.todo('queue');

    describe('event', () => {
        test('event reset', () => {
            const ev = new Event(KEYPRESS);

            expect(ev.defaultPrevented).toBeUndefined();
            expect(ev.propagationStopped).toBeUndefined();

            ev.stopPropagation();
            expect(ev.propagationStopped).toBeTrue();
            ev.preventDefault();
            expect(ev.defaultPrevented).toBeTrue();

            ev.propagate();
            expect(ev.propagationStopped).toBeFalse();
            ev.doDefault();
            expect(ev.defaultPrevented).toBeFalse();

            ev.reset(MOUSEMOVE);
            expect(ev.propagationStopped).toBeUndefined();
            expect(ev.defaultPrevented).toBeUndefined();
        });
    });
});
