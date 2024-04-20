import 'jest-extended';
import * as Tween from './tween';

describe('Tween', () => {
    test('tick before start', () => {
        const obj = { x: 0, y: 0 };
        const startCb = jest.fn();
        const tween = Tween.make(obj)
            .duration(1000)
            .to({
                x: 10,
            })
            .onStart(startCb);

        expect(tween.isRunning()).toBeFalsy();
        tween.update(100);
        expect(tween.isRunning()).toBeFalsy();
        expect(startCb).not.toHaveBeenCalled();
    });

    test('function for goal value', () => {
        const fn = jest.fn().mockReturnValue(10);
        const obj = { x: 0, y: 0 };
        const tween = Tween.make(obj)
            .duration(1000)
            .to({
                x: fn,
            })
            .start();

        expect(tween.isRunning()).toBeTruthy();
        while (tween.isRunning()) {
            tween.update(100);
        }
        expect(obj.x).toEqual(10);
    });

    test('dynamic goal value', () => {
        const goal = { x: 8 };
        const obj = { x: 0, y: 0 };
        const tween = Tween.make(obj).duration(1000).to(goal, true).start();

        expect(tween.isRunning()).toBeTruthy();
        while (tween.isRunning()) {
            tween.update(100);
            goal.x = 10;
        }
        expect(obj.x).toEqual(10);
    });

    test('finish', () => {
        const obj = { x: 0, y: 0 };
        const finishCb = jest.fn().mockResolvedValue(123);
        const tween = Tween.make(obj)
            .to({
                x: 10,
            })
            .duration(1000)
            .onFinish(finishCb);

        tween.start();
        while (tween.isRunning()) {
            tween.update(100);
        }

        expect(finishCb).toHaveBeenCalledWith(obj, true);
    });

    test('basic', () => {
        const obj = { x: 0, y: 0 };
        const tween = Tween.make(obj);
        expect(tween).toBeInstanceOf(Tween.Tween);

        tween
            .to({
                x: 10,
            })
            .duration(1000);

        expect(tween._goal.x).toEqual(10);
        expect(tween._start.x).toEqual(0);
        expect(tween.duration()).toEqual(1000);

        expect(tween.isRunning()).toBeFalsy();
        tween.start();
        expect(tween.isRunning()).toBeTruthy();

        tween.update(50);
        expect(obj.x).toEqual(1);
        tween.update(50);
        expect(obj.x).toEqual(1);
        tween.update(400);
        expect(obj.x).toEqual(5);
        tween.update(500);
        expect(obj.x).toEqual(10);

        expect(tween.isRunning()).toBeFalsy();
    });

    test('update', () => {
        const obj = { x: 0, y: 0 };
        const updateCb = jest.fn();
        const tween = Tween.make(obj)
            .to({
                x: 10,
            })
            .duration(1000)
            .onUpdate(updateCb);
        tween.start();

        while (tween.isRunning()) {
            tween.update(50);
        }

        // only called when there is a change
        expect(updateCb).toHaveBeenCalledTimes(10);
    });

    test('start twice', () => {
        const obj = { x: 0, y: 0 };
        const tw = Tween.make(obj).to({ x: 10 }).duration(100);
        tw.start();

        while (tw.isRunning()) {
            tw.update(50);
        }

        expect(obj.x).toEqual(10);

        obj.x = 20;
        tw.start();

        while (tw.isRunning()) {
            tw.update(50);
        }

        expect(obj.x).toEqual(10);
    });

    test('repeat', () => {
        const obj = { x: 0, y: 0 };
        const tween = Tween.make(obj);
        expect(tween).toBeInstanceOf(Tween.Tween);

        tween
            .to({
                x: 10,
            })
            .duration(1000)
            .repeat(3);

        expect(tween.repeat()).toEqual(3);

        const cbStart = jest.fn().mockImplementation((o) => {
            expect(o.x).toEqual(0);
        });
        tween.onStart(cbStart);

        const cbRepeat = jest.fn().mockImplementation((o) => {
            expect(o.x).toEqual(0); // resets to starting value
        });
        tween.onRepeat(cbRepeat);

        const cbFinish = jest.fn().mockImplementation((o) => {
            expect(o.x).toEqual(10);
        });
        tween.onFinish(cbFinish);

        tween.start();
        while (tween.isRunning()) {
            tween.update(100);
        }

        expect(cbStart).toHaveBeenCalledTimes(1);
        expect(cbRepeat).toHaveBeenCalledTimes(2);
        expect(cbFinish).toHaveBeenCalledTimes(1);
    });

    test('delay', () => {
        const obj = { x: 0, y: 0 };
        const tween = Tween.make(obj)
            .to({
                x: 10,
            })
            .duration(1000)
            .delay(500);

        expect(tween.delay()).toEqual(500);

        const cbStart = jest.fn().mockImplementation((o) => {
            expect(o.x).toEqual(0);
        });
        tween.onStart(cbStart);

        tween.start();
        expect(tween.isRunning()).toBeTruthy();

        expect(cbStart).not.toHaveBeenCalled();

        tween.update(100);
        expect(cbStart).not.toHaveBeenCalled();
        tween.update(100);
        expect(cbStart).not.toHaveBeenCalled();
        tween.update(100);
        expect(cbStart).not.toHaveBeenCalled();
        tween.update(100);
        expect(cbStart).not.toHaveBeenCalled();
        expect(tween.isRunning()).toBeTruthy();

        tween.update(100);
        expect(cbStart).toHaveBeenCalled();
        expect(tween.isRunning()).toBeTruthy();

        while (tween.isRunning()) {
            tween.update(50);
        }

        expect(obj.x).toEqual(10);
    });

    test('repeatDelay', () => {
        const obj = { x: 0, y: 0 };
        const tween = Tween.make(obj)
            .to({
                x: 10,
            })
            .duration(1000)
            .delay(0)
            .repeat(3)
            .repeatDelay(500);
        tween.start();

        expect(tween.repeatDelay()).toEqual(500);

        let totalTime = 0;
        while (tween.isRunning()) {
            tween.update(100);
            totalTime += 100;
        }

        expect(totalTime).toEqual(0 + 1000 + 500 + 1000 + 500 + 1000);
    });

    test('yoyo', () => {
        const obj = { x: 0, y: 0 };
        const tween = Tween.make(obj)
            .to({
                x: 10,
            })
            .duration(1000)
            .repeat(2)
            .yoyo(true);
        tween.start();

        expect(tween.yoyo()).toBeTruthy();

        while (tween.isRunning()) {
            tween.update(100);
        }

        // end up back where we started
        expect(obj.x).toEqual(0);
    });

    test('from', () => {
        const obj = { x: 0, y: 0 };
        const tween = Tween.make(obj)
            .from({
                x: 10,
            })
            .duration(1000);
        tween.start();

        expect(tween.isRunning()).toBeTruthy();
        expect(obj.x).toEqual(10);

        tween.update(50);
        expect(obj.x).toEqual(10);
        tween.update(50);
        expect(obj.x).toEqual(9);
        tween.update(400);
        expect(obj.x).toEqual(5);
        tween.update(500);
        expect(obj.x).toEqual(0);

        expect(tween.isRunning()).toBeFalsy();
    });

    test('blink - boolean', () => {
        const obj = { visible: true };
        const tween = Tween.make(obj)
            .to({ visible: false })
            .repeat(3)
            .repeatDelay(100)
            .duration(100);
        tween.start();

        expect(tween.isRunning()).toBeTruthy();
        expect(obj.visible).toBeTrue();

        // Repeat 1
        tween.update(90);
        expect(obj.visible).toBeTrue();
        tween.update(10);
        expect(obj.visible).toBeFalse();

        // Delay 1
        tween.update(90);
        expect(obj.visible).toBeFalse();
        tween.update(10);
        expect(obj.visible).toBeTrue();

        // Repeat 2
        tween.update(90);
        expect(obj.visible).toBeTrue();
        tween.update(10);
        expect(obj.visible).toBeFalse();

        // Delay 2
        tween.update(90);
        expect(obj.visible).toBeFalse();
        tween.update(10);
        expect(obj.visible).toBeTrue();

        // Repeat 3
        tween.update(90);
        expect(obj.visible).toBeTrue();
        tween.update(10);
        expect(obj.visible).toBeFalse();

        // done
        expect(tween.isRunning()).toBeFalsy();
    });

    test('child tween', () => {
        const obj = { a: 0, b: 0 };
        const tweenA = Tween.make(obj).to({ a: 100 }).duration(500);
        tweenA.start();

        const tweenB = Tween.make(obj).to({ b: 100 }).duration(1000);
        tweenA.addChild(tweenB.start());

        while (tweenA.isRunning()) {
            tweenA.update(50);
        }

        expect(tweenA.isRunning()).toBeFalsy();
        expect(tweenB.isRunning()).toBeFalsy();
    });
});
