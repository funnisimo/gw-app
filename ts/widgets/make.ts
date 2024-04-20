import * as WIDGET from '../app/widget.js';

export interface WidgetMake<T> extends WIDGET.WidgetOpts {
    with?: T;
}

export function make<T>(opts: WidgetMake<T>): WIDGET.Widget & T {
    const w = new WIDGET.Widget(opts) as WIDGET.Widget & T;
    if (opts.with) {
        Object.entries(opts.with).forEach(([name, fn]) => {
            // @ts-ignore
            w[name] = fn;
        });
    }
    return w;
}
