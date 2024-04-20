// import * as GWU from 'gw-utils/dist';
import * as Utils from "gw-utils/utils.js";
import * as TextUtils from "gw-utils/text/index.js";
import * as Buffer from "gw-canvas/buffer.js";
import * as IO from "../app/io.js";

import * as WIDGET from "../app/widget.js";
import { Text } from "./text.js";
import { drawBorder } from "./border.js";
import * as STYLE from "../app/style.js";

STYLE.defaultStyle.add("datatable", { bg: "black" });
// STYLE.defaultStyle.add('th', { bg: 'light_teal', fg: 'dark_blue' });
// STYLE.defaultStyle.add('td', { bg: 'darker_gray' });
// STYLE.defaultStyle.add('td:odd', { bg: 'gray' });
// STYLE.defaultStyle.add('td:hover', { bg: 'light_gray' });
STYLE.defaultStyle.add("td:selected", { bg: "gray" });

export type PrefixType = "none" | "letter" | "number" | "bullet";

export type FormatFn = TextUtils.Template; // (data: any, index: number) => string;

export type SelectType = "none" | "column" | "row" | "cell";
export type HoverType = "none" | "column" | "row" | "cell" | "select";

export type BorderType = "ascii" | "fill" | "none";

export interface ColumnOptions {
  width?: number; // must have?
  format?: string | FormatFn; // must have?

  header?: string;
  headerTag?: string;
  headerClass?: string;

  empty?: string;
  dataTag?: string;
  dataClass?: string;
}

export interface DataTableOptions extends Omit<WIDGET.WidgetOpts, "height"> {
  size?: number;
  rowHeight?: number;

  header?: boolean; // show a header on top of each column
  headerTag?: string;
  dataTag?: string;

  prefix?: PrefixType;
  select?: SelectType;
  hover?: HoverType;
  wrap?: boolean;

  columns: ColumnOptions[]; // must have at least 1

  data?: WIDGET.DataItem[];
  border?: boolean | BorderType;
}

export class Column {
  width: number;
  format: TextUtils.Template = Utils.IDENTITY;
  header: string;
  headerTag: string;
  dataTag: string;
  empty: string;

  constructor(opts: ColumnOptions) {
    this.width = opts.width || DataTable.default.columnWidth;
    if (typeof opts.format === "function") {
      this.format = opts.format;
    } else if (opts.format) {
      this.format = TextUtils.compile(opts.format);
    }

    this.header = opts.header || "";
    this.headerTag = opts.headerTag || DataTable.default.headerTag;
    this.empty = opts.empty || DataTable.default.empty;
    this.dataTag = opts.dataTag || DataTable.default.dataTag;
  }

  addHeader(table: DataTable, x: number, y: number, col: number): Text {
    const t = new Text({
      parent: table,
      x,
      y,
      class: table.classes.join(" "),
      tag: table._attrStr("headerTag"),
      width: this.width,
      height: table.rowHeight,
      // depth: table.depth + 1,
      text: this.header,
    });
    t.prop("row", -1);
    t.prop("col", col);

    // table.scene.attach(t);

    return t;
  }

  addData(
    table: DataTable,
    data: WIDGET.DataItem,
    x: number,
    y: number,
    col: number,
    row: number
  ): Text {
    let text: string;
    if (Array.isArray(data)) {
      text = "" + (data[col] || this.empty);
    } else if (typeof data !== "object") {
      text = "" + data;
    } else {
      text = this.format(data);
    }
    if (text === "") {
      text = this.empty;
    }

    const widget = new Text({
      parent: table,
      text,
      x,
      y,
      class: table.classes.join(" "),
      tag: table._attrStr("dataTag"),
      width: this.width,
      height: table.rowHeight,
      // depth: table.depth + 1,
    });
    widget.on("mouseenter", () => {
      table.select(col, row);
    });
    widget.prop(row % 2 == 0 ? "even" : "odd", true);
    widget.prop("row", row);
    widget.prop("col", col);
    // table.addChild(widget);
    return widget;
  }

  addEmpty(
    table: DataTable,
    x: number,
    y: number,
    col: number,
    row: number
  ): Text {
    return this.addData(table, [], x, y, col, row);
  }
}

export class DataTable extends WIDGET.Widget {
  static default = {
    columnWidth: 10,
    header: true,
    empty: "",
    tag: "datatable",
    headerTag: "th",
    dataTag: "td",
    select: "cell" as SelectType,
    hover: "select" as HoverType,
    prefix: "none" as PrefixType,
    border: "ascii" as BorderType,
    wrap: true,
  };

  columns: Column[] = [];
  showHeader = false;
  rowHeight = 1;
  size: number;

  selectedRow = -1;
  selectedColumn = 0;

  _data!: WIDGET.DataItem[];

  constructor(opts: DataTableOptions) {
    super(
      (() => {
        opts.tag = opts.tag || DataTable.default.tag;
        opts.tabStop = opts.tabStop === undefined ? true : opts.tabStop;
        if (opts.data) {
          if (!Array.isArray(opts.data)) {
            opts.data = [opts.data];
          }
        } else {
          opts.data = [];
        }
        return opts;
      })()
    );

    this.size =
      opts.size ||
      (this.parent
        ? this.parent.bounds.height
        : this.scene
        ? this.scene.height
        : 0);

    this.bounds.width = 0;
    opts.columns.forEach((o) => {
      const col = new Column(o);
      this.columns.push(col);
      this.bounds.width += col.width;
    });

    if (opts.border) {
      if (opts.border === true) opts.border = "ascii";
    } else if (opts.border === false) {
      opts.border = "none";
    }
    this.attr("border", opts.border || DataTable.default.border);
    this.rowHeight = opts.rowHeight || 1;

    this.bounds.height = 1;

    this.attr(
      "wrap",
      opts.wrap === undefined ? DataTable.default.wrap : opts.wrap
    );
    this.attr(
      "header",
      opts.header === undefined ? DataTable.default.header : opts.header
    );
    this.attr("headerTag", opts.headerTag || DataTable.default.headerTag);
    this.attr("dataTag", opts.dataTag || DataTable.default.dataTag);
    this.attr("prefix", opts.prefix || DataTable.default.prefix);
    this.attr("select", opts.select || DataTable.default.select);
    this.attr("hover", opts.hover || DataTable.default.hover);

    this._setData(this._data);
  }

  get selectedData(): any {
    if (this.selectedRow < 0) return undefined;
    return this._data[this.selectedRow];
  }

  select(col: number, row: number): this {
    // console.log('select', col, row);
    if (!this._data || this._data.length == 0) {
      this.selectedRow = this.selectedColumn = 0;
      return this;
    }

    if (this.attr("wrap")) {
      if (col < 0 || col >= this.columns.length) {
        col += this.columns.length;
        col %= this.columns.length;
      }
      if (row < 0 || row >= this._data.length) {
        row += this._data.length;
        row %= this._data.length;
      }
    }
    col = this.selectedColumn = Utils.clamp(col, 0, this.columns.length - 1);
    row = this.selectedRow = Utils.clamp(row, 0, this._data.length - 1);

    const select = this._attrStr("select");
    if (select === "none") {
      this.children.forEach((c) => {
        c.prop("selected", false);
      });
    } else if (select === "row") {
      this.children.forEach((c) => {
        const active = row == c.prop("row");
        c.prop("selected", active);
      });
    } else if (select === "column") {
      this.children.forEach((c) => {
        const active = col == c.prop("col");
        c.prop("selected", active);
      });
    } else if (select === "cell") {
      this.children.forEach((c) => {
        const active = col == c.prop("col") && row == c.prop("row");
        c.prop("selected", active);
      });
    }

    this.emit("change", {
      row,
      col,
      data: this.selectedData,
    });

    return this;
  }

  selectNextRow(): this {
    return this.select(this.selectedColumn, this.selectedRow + 1);
  }

  selectPrevRow(): this {
    return this.select(this.selectedColumn, this.selectedRow - 1);
  }

  selectNextCol(): this {
    return this.select(this.selectedColumn + 1, this.selectedRow);
  }

  selectPrevCol(): this {
    return this.select(this.selectedColumn - 1, this.selectedRow);
  }

  blur(reverse?: boolean): void {
    this.emit("change", {
      col: this.selectedColumn,
      row: this.selectedRow,
      data: this.selectedData,
    });
    return super.blur(reverse);
  }

  _setData(v: WIDGET.DataItem[]) {
    this._data = v;
    for (let i = this.children.length - 1; i >= 0; --i) {
      const c = this.children[i];
      if (c.tag !== this.attr("headerTag")) {
        this.removeChild(c);
      }
    }

    const borderAdj = this.attr("border") !== "none" ? 1 : 0;

    let x = this.bounds.x + borderAdj;
    let y = this.bounds.y + borderAdj;
    if (this.attr("header")) {
      this.columns.forEach((col, i) => {
        col.addHeader(this, x, y, i);
        x += col.width + borderAdj;
      });
      y += this.rowHeight + borderAdj;
    }

    this._data.forEach((obj, j) => {
      if (j >= this.size) return;
      x = this.bounds.x + borderAdj;
      this.columns.forEach((col, i) => {
        col.addData(this, obj, x, y, i, j);
        x += col.width + borderAdj;
      });
      y += this.rowHeight + borderAdj;
    });

    if (this._data.length == 0) {
      x = this.bounds.x + borderAdj;
      this.columns.forEach((col, i) => {
        col.addEmpty(this, x, y, i, 0);
        x += col.width + borderAdj;
      });
      y += 1;
      this.select(-1, -1);
    } else {
      this.select(0, 0);
    }

    this.bounds.height = y - this.bounds.y;
    this.bounds.width = x - this.bounds.x;
    this.needsStyle = true; // sets this.needsDraw

    return this;
  }

  _draw(buffer: Buffer.Buffer): boolean {
    this._drawFill(buffer);

    this.children.forEach((w) => {
      if (w._propInt("row")! >= this.size) return;
      if (this.attr("border") !== "none") {
        drawBorder(
          buffer,
          w.bounds.x - 1,
          w.bounds.y - 1,
          w.bounds.width + 2,
          w.bounds.height + 2,
          this._used,
          this.attr("border") == "ascii"
        );
      }
    });
    return true;
  }

  // _mouseenter(e: IO.Event): void {
  //     super._mouseenter(e);
  //     if (!this.hovered) return;

  //     const hovered = this.children.find((c) => c.contains(e));

  //     if (hovered) {
  //         const col = hovered._propInt('col');
  //         const row = hovered._propInt('row');
  //         if (col !== this.selectedColumn || row !== this.selectedRow) {
  //             this.selectedColumn = col;
  //             this.selectedRow = row;

  //             let select = false;
  //             let hover = this._attrStr('hover');
  //             if (hover === 'select') {
  //                 hover = this._attrStr('select');
  //                 select = true;
  //             }

  //             if (hover === 'none') {
  //                 this.children.forEach((c) => {
  //                     c.hovered = false;
  //                     if (select) c.prop('selected', false);
  //                 });
  //             } else if (hover === 'row') {
  //                 this.children.forEach((c) => {
  //                     const active = row == c.prop('row');
  //                     c.hovered = active;
  //                     if (select) c.prop('selected', active);
  //                 });
  //             } else if (hover === 'column') {
  //                 this.children.forEach((c) => {
  //                     const active = col == c.prop('col');
  //                     c.hovered = active;
  //                     if (select) c.prop('selected', active);
  //                 });
  //             } else if (hover === 'cell') {
  //                 this.children.forEach((c) => {
  //                     const active =
  //                         col == c.prop('col') && row == c.prop('row');
  //                     c.hovered = active;
  //                     if (select) c.prop('selected', active);
  //                 });
  //             }
  //             this.emit('change', {
  //                 row,
  //                 col,
  //                 data: this.selectedData,
  //             });
  //         }
  //     }
  // }

  // click(e: IO.Event): boolean {
  //     if (!this.contains(e) || this.disabled || this.hidden) return false;

  //     this.action();
  //     // this.emit('change', {
  //     //     row: this.selectedRow,
  //     //     col: this.selectedColumn,
  //     //     data: this.selectedData,
  //     // });
  //     // return false;
  //     return true;
  // }

  keypress(e: IO.Event): boolean {
    if (!e.key) return false;

    if (e.dir) {
      return this.dir(e);
    }

    if (e.key === "Enter") {
      this.action(e);
      // this.emit('change', {
      //     row: this.selectedRow,
      //     col: this.selectedColumn,
      //     data: this.selectedData,
      // });
      return true;
    }
    return false;
  }

  dir(e: IO.Event): boolean {
    if (!e.dir) return false;

    if (e.dir[1] == 1) {
      this.selectNextRow();
    } else if (e.dir[1] == -1) {
      this.selectPrevRow();
    }

    if (e.dir[0] == 1) {
      this.selectNextCol();
    } else if (e.dir[0] == -1) {
      this.selectPrevCol();
    }

    return true;
  }
}

/*
// extend WidgetLayer

export type AddDataTableOptions = DataTableOptions &
    SetParentOptions & { parent?: Widget };

declare module './layer' {
    interface WidgetLayer {
        datatable(opts: AddDataTableOptions): DataTable;
    }
}
WidgetLayer.prototype.datatable = function (
    opts: AddDataTableOptions
): DataTable {
    const options = Object.assign({}, this._opts, opts);
    const list = new DataTable(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
*/
