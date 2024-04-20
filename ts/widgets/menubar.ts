import * as Widget from '../app/widget.js';
import { DropdownConfig, Menu } from './menu.js';
import * as TEXT from './text.js';
import * as BUTTON from './button.js';

export interface MenubarOptions extends Widget.WidgetOpts {
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;

    menuClass?: string | string[];
    menuTag?: string;

    minWidth?: number;
    prefix?: string;
    separator?: string;
}

export class Menubar extends Widget.Widget {
    static default = {
        buttonClass: '',
        buttonTag: 'mi',

        menuClass: '',
        menuTag: 'mi',

        prefix: ' ',
        separator: ' | ',
    };

    // _config!: DropdownConfig;
    // _buttons: MenubarButton[] = [];
    // _selectedIndex: number;

    constructor(opts: MenubarOptions) {
        super(
            (() => {
                opts.tabStop = false;
                opts.tag = opts.tag || 'menu';
                return opts;
            })()
        );
        if (opts.buttonClass) {
            if (Array.isArray(opts.buttonClass)) {
                this.attr('buttonClass', opts.buttonClass.join(' '));
            } else {
                this.attr('buttonClass', opts.buttonClass);
            }
        } else {
            this.attr('buttonClass', Menubar.default.buttonClass);
        }
        this.attr('buttonTag', opts.buttonTag || Menubar.default.buttonTag);

        if (opts.menuClass) {
            if (Array.isArray(opts.menuClass)) {
                this.attr('menuClass', opts.menuClass.join(' '));
            } else {
                this.attr('menuClass', opts.menuClass);
            }
        } else {
            this.attr('menuClass', Menubar.default.menuClass);
        }
        this.attr('menuTag', opts.menuTag || Menubar.default.menuTag);

        this.attr('prefix', opts.prefix || Menubar.default.prefix);
        this.attr('separator', opts.separator || Menubar.default.separator);

        this.bounds.height = 1;
        this._initButtons(opts);

        // // @ts-ignore
        // if (this._selectedIndex === undefined) {
        //     this._selectedIndex = -1;
        // } else if (this._selectedIndex == -2) {
        //     this._selectedIndex = 0;
        // }
    }

    // get selectedIndex(): number {
    //     return this._selectedIndex;
    // }
    // set selectedIndex(v: number) {
    //     if (this._selectedIndex >= 0) {
    //         this._buttons[this._selectedIndex].prop('focus', false).expand();
    //     }
    //     this._selectedIndex = v;
    //     if (v >= 0 && this._buttons && v < this._buttons.length) {
    //         this._buttons[v].prop('focus', true).expand();
    //     } else {
    //         this._selectedIndex = this._buttons ? -1 : -2;
    //     }
    // }

    // get selectedButton(): Widget.Widget {
    //     return this._buttons[this._selectedIndex];
    // }

    // focus(reverse = false): void {
    //     if (reverse) {
    //         this.selectedIndex = this._buttons.length - 1;
    //     } else {
    //         this.selectedIndex = 0;
    //     }
    //     super.focus(reverse);
    // }

    // blur(reverse = false): void {
    //     this.selectedIndex = -1;
    //     super.blur(reverse);
    // }

    // keypress(e: IO.Event): void {
    //     if (!e.key) return;

    //     this.events.dispatch(e);
    //     if (e.defaultPrevented) return;

    //     if (e.key === 'Tab') {
    //         this.selectedIndex += 1;
    //         if (this._selectedIndex !== -1) {
    //             e.preventDefault();
    //         }
    //     } else if (e.key === 'TAB') {
    //         this.selectedIndex -= 1;
    //         if (this._selectedIndex !== -1) {
    //             e.preventDefault();
    //         }
    //     } else if (this._selectedIndex >= 0) {
    //         super.keypress(e);
    //     }
    // }

    // mousemove(e: IO.Event): void {
    //     super.mousemove(e);
    //     if (!this.contains(e) || !this.focused) return;

    //     const active = this._buttons.findIndex((c) => c.contains(e));
    //     if (active < 0 || active === this._selectedIndex) return;
    //     this.selectedIndex = active;
    // }

    _initButtons(opts: MenubarOptions) {
        // this._config = opts.buttons;

        const entries = Object.entries(opts.buttons);

        const buttonTag = this._attrStr('buttonTag');
        const buttonClass = this._attrStr('buttonClass');
        let x = this.bounds.x;
        const y = this.bounds.y;
        entries.forEach(([key, value], i) => {
            const prefix =
                i == 0 ? this._attrStr('prefix') : this._attrStr('separator');
            new TEXT.Text({ parent: this, text: prefix, x, y });
            x += prefix.length;
            this.bounds.width += prefix.length;

            const button = new BUTTON.Button({
                parent: this,
                id: key,
                text: key,
                x,
                y,
                tag: buttonTag,
                class: buttonClass,
                // buttons: value,
            });
            x += button.bounds.width;
            this.bounds.width += button.bounds.width;

            let menu: Menu | null = null;
            if (typeof value !== 'string') {
                menu = new Menu({
                    buttons: value,
                    buttonClass: this._attrStr('menuClass'),
                    buttonTag: this._attrStr('menuTag'),
                    x: button.bounds.x,
                    y: button.bounds.y + 1,
                });

                button.data('menu', menu);
            }

            button.on(['click', 'Enter', ' '], () => {
                if (typeof value === 'string') {
                    // simulate action
                    this.emit(value);
                    this.scene!.emit(value);
                } else {
                    this.scene!.app.scenes.show('menu', {
                        menu,
                        origin: this.scene,
                    });
                }
            });
        });
    }
}

/*
export interface MenubarButtonOptions extends Widget.WidgetOpts {
    text: string;
    buttons: ButtonConfig;
    action?: string | boolean;
}

export class MenubarButton extends Text.Text {
    menu: Menu | null = null;
    parent!: Menubar;

    constructor(opts: MenubarButtonOptions) {
        super(
            (() => {
                opts.tag = opts.tag || 'mi';
                if (typeof opts.buttons === 'string' && !opts.action) {
                    opts.action = opts.buttons;
                }
                return opts;
            })()
        );

        this.tag = opts.tag || 'mi';

        if (typeof opts.buttons !== 'string') {
            const menu = (this.menu = this._initMenu(opts)) as Menu;

            this.on('mouseenter', () => {
                menu.hidden = false;
                menu.emit('change');
                return true;
            });
            this.on('mouseleave', (e) => {
                if (this.parent!.contains(e)) {
                    menu.hidden = true;
                    return true;
                }
                return false;
            });
            this.on('click', () => {
                return true; // eat clicks
            });
        }

        this.on('click', () => {
            this.parent.activate(this);
        });
        this.on('Enter', () => {
            this.parent.activate(this);
        });
        this.on(' ', () => {
            this.parent.activate(this);
        });
    }

    collapse(): void {
        if (!this.menu || this.menu.hidden) return;
        this.menu.hide();
    }

    expand(): Menu | null {
        if (!this.menu) return null;
        this.menu.show();
        return this.menu;
    }

    _setMenuPos(xy: XY.XY, opts: MenubarButtonOptions) {
        xy.x = this.bounds.x;
        const height = opts.height || Object.keys(opts.buttons).length;
        if (this.bounds.y < height) {
            xy.y = this.bounds.y + 1;
        } else {
            xy.y = this.bounds.top - height;
        }
    }

    _initMenu(opts: MenubarButtonOptions): Menu | null {
        if (typeof opts.buttons === 'string') return null;

        const menuOpts = {
            parent: this,
            x: this.bounds.x,
            y: this.bounds.y,
            class: opts.class,
            tag: opts.tag || 'mi',
            height: opts.height,
            buttons: opts.buttons,
            // depth: this.depth + 1,
        };
        this._setMenuPos(menuOpts, opts);
        const menu = new Menu(menuOpts);
        menu.hidden = true;

        return menu;
    }
}

export function runMenu(owner: Menubar, menu: Menu) {
    if (!owner || !owner.scene)
        throw new Error('need an owner that is attached to a scene.');

    let menus: Menu[] = [menu];
    let current = menu;

    menu.hidden = false;
    const scene = owner.scene;

    const offInput = scene.on('input', (e) => {
        if (e.type === IO.KEYPRESS) {
            if (e.dir) {
                if (e.dir[0] > 0) {
                    const next = current.expandItem();
                    if (next) {
                        menus.push(next);
                        current = next;
                    }
                } else if (e.dir[0] < 0) {
                    current.hide();
                    menus.pop();
                    if (menus.length == 0) {
                        return done(e);
                    } else {
                        current = menus[menus.length - 1];
                    }
                } else if (e.dir[1] > 0) {
                    current.nextItem();
                } else if (e.dir[1] < 0) {
                    current.prevItem();
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                const next = current.expandItem();
                if (next) {
                    menus.push(next);
                    current = next;
                } else {
                    done(e);
                    current.action();
                    return;
                }
            } else if (e.key === 'Escape') {
                current.hide();
                menus.pop();
                if (menus.length == 0) {
                    return done(e);
                }
                current = menus[menus.length - 1];
            } else if (e.key === 'Tab' || e.key === 'TAB') {
                return done();
            } else {
                current.selectItemWithKey(e.key);
            }
        } else if (e.type === IO.MOUSEMOVE) {
            if (!current.contains(e)) {
                let found = -1;
                for (let i = 0; i < menus.length; ++i) {
                    const m = menus[i];
                    if (found >= 0) {
                        m.hide();
                    } else {
                        if (m.contains(e)) {
                            current = m;
                            found = i;
                        }
                    }
                }
                if (found >= 0) {
                    menus.length = found + 1;
                }
            }
            if (current.contains(e)) {
                current.mousemove(e);
            } else if (owner.contains(e)) {
                done();
                return owner.mousemove(e);
            }
        } else if (e.type === IO.CLICK) {
            // assumes mousemove was called for this spot before click
            const btn = current.childAt(e);
            if (btn) {
                btn.click(e);
            }
            done(e);
        }

        e.stopPropagation();
        e.preventDefault();
    });

    function done(e?: IO.Event) {
        offInput();
        menus.forEach((m) => (m.hidden = true));
        scene.setFocusWidget(owner);
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
    }
}
*/
