// import * as GWU from 'gw-utils/dist';
import * as XY from "gw-utils/xy.js";
import * as TextUtils from "gw-utils/text/index.js";

import * as Widget from "../app/widget.js";
import * as Text from "./text.js";
import * as IO from "../app/io.js";

export interface Rec<T> {
  [keys: string]: T;
}
export type DropdownConfig = Rec<ButtonConfig>;
export type ActionConfig = string;
export type ButtonConfig = ActionConfig | DropdownConfig;

export interface MenuOptions extends Widget.WidgetOpts {
  buttons: DropdownConfig;
  buttonClass?: string | string[];
  buttonTag?: string;
  minWidth?: number;
  marker?: string;
}

export class Menu extends Widget.Widget {
  static default = {
    tag: "menu",
    class: "",
    buttonClass: "",
    buttonTag: "mi",
    marker: " \u25b6",
    minWidth: 4,
  };

  _selectedIndex = 0;
  children!: MenuButton[];

  constructor(opts: MenuOptions) {
    super(
      (() => {
        opts.tag = opts.tag || Menu.default.tag;
        opts.class = opts.class || Menu.default.class;
        opts.tabStop = opts.tabStop === undefined ? true : opts.tabStop;
        return opts;
      })()
    );

    if (Array.isArray(opts.buttonClass)) {
      this.attr("buttonClass", opts.buttonClass.join(" "));
    } else {
      this.attr("buttonClass", opts.buttonClass || Menu.default.buttonClass);
    }
    this.attr("buttonTag", opts.buttonTag || Menu.default.buttonTag);
    this.attr("marker", opts.marker || Menu.default.marker);

    this._initButtons(opts);
    this.bounds.height = this.children.length;

    this.on("mouseenter", (e) => {
      this.children.forEach((c) => {
        if (!c.contains(e)) {
          c.collapse();
        } else {
          c.expand();
        }
      });
      return true;
    });

    this.on("dir", (e: IO.Event) => {
      if (!e.dir) return;
      if (e.dir[0] < 0) {
        this.hide();
      } else if (e.dir[0] > 0) {
        this.expandItem();
      } else if (e.dir[1] < 0) {
        this.prevItem();
      } else if (e.dir[1] > 0) {
        this.nextItem();
      }
      e.stopPropagation();
    });

    this.on(["Enter", " "], () => {
      const btn = this.children[this._selectedIndex];
      btn.action();
      this.hide();
    });
  }

  _initButtons(opts: MenuOptions) {
    this.children = [];
    const buttons = opts.buttons;

    const marker = this._attrStr("marker");
    const entries = Object.entries(buttons);

    this.bounds.width = Math.max(
      opts.minWidth || 0,
      this.bounds.width,
      entries.reduce((out, [key, value]) => {
        const textLen =
          TextUtils.length(key) +
          (typeof value === "string" ? 0 : marker.length);
        return Math.max(out, textLen);
      }, 0)
    );

    entries.forEach(([key, value], i) => {
      const opts: MenuButtonOptions = {
        x: this.bounds.x,
        y: this.bounds.y + i,
        class: this._attrStr("buttonClass"),
        tag: this._attrStr("buttonTag"),
        width: this.bounds.width,
        height: 1,
        // depth: this.depth + 1,
        buttons: value,
        text: key,
        parent: this,
      };

      if (typeof value === "string") {
        opts.action = value;
      } else {
        opts.text =
          TextUtils.padEnd(key, this.bounds.width - marker.length, " ") +
          marker;
      }
      const menuItem = new MenuButton(opts);
      menuItem.on("mouseenter", () => {
        this.emit("change");
      });
      menuItem.on("click", () => {
        this.hide();
      });

      if (menuItem.menu) {
        menuItem.menu.on("hide", () => {
          this.scene!.setFocusWidget(this);
        });
      }
    });
  }

  show(): void {
    this.hidden = false;
    this._selectedIndex = 0;
    this.scene!.setFocusWidget(this);

    this.emit("show");
  }

  hide(): void {
    this.hidden = true;
    this.emit("hide");
  }

  nextItem() {
    ++this._selectedIndex;
    if (this._selectedIndex >= this.children.length) {
      this._selectedIndex = 0;
    }
  }

  prevItem() {
    --this._selectedIndex;
    if (this._selectedIndex < 0) {
      this._selectedIndex = this.children.length - 1;
    }
  }

  expandItem(): Menu | null {
    const c = this.children[this._selectedIndex];
    return c.expand();
  }

  selectItemWithKey(key: string) {
    let found = false;
    this.children.forEach((c) => {
      if (found) return;
      if (c.text().startsWith(key)) {
        found = true;
        // ???
      }
    });
  }
}

export interface MenuButtonOptions extends Widget.WidgetOpts {
  text: string;
  buttons: ButtonConfig;
}

export class MenuButton extends Text.Text {
  menu: Menu | null = null;

  constructor(opts: MenuButtonOptions) {
    super(
      (() => {
        opts.tag = opts.tag || "mi";
        opts.tabStop = false;
        return opts;
      })()
    );

    // this.tag = opts.tag || 'mi';

    if (typeof opts.buttons !== "string") {
      this.menu = this._initMenu(opts);

      this.on("mouseenter", () => {
        this.menu!.hidden = false;
        this.menu!.emit("change");
      });
      this.on("mouseleave", (_n, _w, e) => {
        if (this.parent?.bounds.contains(e)) {
          this.menu!.hidden = true;
        }
      });
      this.on("click", () => {
        return true; // eat clicks
      });
    }

    this.on("click", this.action.bind(this));
  }

  collapse(): void {
    if (this.menu) {
      this.menu.hide();
    }
  }

  expand(): Menu | null {
    if (!this.menu) return null;
    this.menu.show();
    // this.scene!.setFocusWidget(this.menu);
    return this.menu;
  }

  _setMenuPos(xy: XY.XY, opts: MenuButtonOptions) {
    xy.x = this.bounds.x + this.bounds.width;
    xy.y = this.bounds.y;
    const height = Object.keys(opts.buttons).length;
    if (this.scene && xy.y + height >= this.scene.height) {
      xy.y = this.scene.height - height - 1;
    }
  }

  _initMenu(opts: MenuButtonOptions): Menu | null {
    if (typeof opts.buttons === "string") return null;

    const menuOpts: MenuOptions = {
      x: this.bounds.x + this.bounds.width,
      y: this.bounds.y,
      class: opts.class,
      tag: opts.tag || "mi",
      buttons: opts.buttons,
      // depth: this.depth + 1,
    };
    this._setMenuPos(menuOpts as XY.XY, opts);
    menuOpts.parent = this;
    const menu = new Menu(menuOpts);
    menu.hidden = true;
    return menu;
  }
}

/*
// extend WidgetLayer

export type AddMenuOptions = MenuOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module './layer' {
    interface WidgetLayer {
        menu(opts: AddMenuOptions): Menu;
    }
}
WidgetLayer.prototype.menu = function (opts: AddMenuOptions): Menu {
    const options = Object.assign({}, this._opts, opts);
    const list = new Menu(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
*/
