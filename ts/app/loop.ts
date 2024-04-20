export type Callback = () => void;

export class Loop {
    _timer = 0;

    get isRunning(): boolean {
        return this._timer != 0;
    }

    start(cb: Callback, dt = 16): void {
        let busy = false;

        if (this._timer) throw new Error('Cannot start loop twice.');

        this._timer = (setInterval(() => {
            if (!busy) {
                busy = true;
                cb();
                busy = false;
            }
        }, dt) as unknown) as number;
    }
    stop(): void {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = 0;
        }
    }
}
