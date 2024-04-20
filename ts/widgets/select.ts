// import * as GWU from 'gw-utils/dist';
import * as Widget from '../app/widget.js';
import * as Menu from './menu.js';
import * as Text from './text.js';
// import { Body } from './body.js';

export interface SelectOptions extends Widget.WidgetOpts {
    text: string;
    buttons: Menu.DropdownConfig;
    buttonClass?: string;
    buttonTag?: string;
}

export class Select extends Widget.Widget {
    dropdown!: Text.Text;
    menu!: Menu.Menu;

    constructor(opts: SelectOptions) {
        super(
            (() => {
                opts.tag = opts.tag || 'select';
                return opts;
            })()
        );

        this._initText(opts);
        this._initMenu(opts);
        this.bounds.height = 1; // just the text component
    }

    _initText(opts: SelectOptions) {
        this.dropdown = new Text.Text({
            parent: this,
            text: opts.text + ' \u25bc',
            x: this.bounds.x,
            y: this.bounds.y,
            class: opts.class,
            tag: opts.tag || 'select',
            width: this.bounds.width,
            height: 1,
            // depth: this.depth + 1,
        });
        this.dropdown.on('click', () => {
            this.menu.toggleProp('hidden');
            return false;
        });
        // this.dropdown.setParent(this, { beforeIndex: 0 });
    }

    _initMenu(opts: SelectOptions) {
        this.menu = new Menu.Menu({
            parent: this,
            x: this.bounds.x,
            y: this.bounds.y + 1,
            class: opts.buttonClass,
            tag: opts.buttonTag || 'select',
            width: opts.width,
            minWidth: this.dropdown.bounds.width,
            height: opts.height,
            buttons: opts.buttons,
            // depth: this.depth + 1,
        });
        this.menu.on('click', () => {
            this.menu.hidden = true;
            return false;
        });
        this.menu.hidden = true;
    }
}

/*
// extend WidgetLayer

export type AddSelectOptions = SelectOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module './layer' {
    interface WidgetLayer {
        select(opts: AddSelectOptions): Select;
    }
}
WidgetLayer.prototype.select = function (opts: AddSelectOptions): Select {
    const options: SelectOptions = Object.assign({}, this._opts, opts);
    const list = new Select(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
*/
