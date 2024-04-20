// import * as GWU from 'gw-utils/dist';
import * as Text from './text.js';
// import * as Widget from '../app/widget.js';

export interface ButtonOptions extends Omit<Text.TextOptions, 'text'> {
    text?: string; // don't have to have text
}

export class Button extends Text.Text {
    constructor(opts: ButtonOptions) {
        super(
            (() => {
                opts.text = opts.text || '';
                opts.tabStop = opts.tabStop === undefined ? true : opts.tabStop;
                opts.tag = opts.tag || 'button';
                if (!opts.text && !opts.width)
                    throw new Error('Buttons must have text or width.');
                if (opts.text.length == 0) {
                    opts.width = opts.width || 2;
                }
                return opts as Text.TextOptions;
            })()
        );

        this.on('click', this.action.bind(this));
        this.on('Enter', this.action.bind(this));
    }
}

/*
// extend Layer

export type AddButtonOptions = Omit<ButtonOptions, 'text'> &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module './layer' {
    interface WidgetLayer {
        button(text: string, opts?: AddButtonOptions): Button;
    }
}
WidgetLayer.prototype.button = function (
    text: string,
    opts: AddButtonOptions
): Button {
    const options: ButtonOptions = Object.assign({}, this._opts, opts, {
        text,
    });
    const widget = new Button(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    this.pos(widget.bounds.x, widget.bounds.bottom);
    return widget;
};
*/
