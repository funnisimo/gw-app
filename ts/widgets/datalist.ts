import * as DataTable from './datatable.js';
import * as Widget from '../app/widget.js';

export interface DataListOptions
    extends DataTable.ColumnOptions,
        Widget.WidgetOpts {
    size?: number;
    rowHeight?: number;
    hover?: DataTable.HoverType;

    headerTag?: string;
    dataTag?: string;

    prefix?: DataTable.PrefixType;

    data?: Widget.DataItem[];
    border?: boolean | DataTable.BorderType;
}

export class DataList extends DataTable.DataTable {
    constructor(opts: DataListOptions) {
        super(
            (() => {
                // @ts-ignore
                const tableOpts: DataList.TableOptions = opts;

                if (opts.border !== 'none' && opts.width) {
                    opts.width -= 2;
                }
                tableOpts.columns = [Object.assign({}, opts)];
                if (!opts.header || !opts.header.length) {
                    tableOpts.header = false;
                }
                return tableOpts;
            })()
        );
    }
}

/*
// extend WidgetLayer

export type AddDataListOptions = DataListOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module './layer' {
    interface WidgetLayer {
        datalist(opts: AddDataListOptions): DataList;
    }
}
WidgetLayer.prototype.datalist = function (opts: AddDataListOptions): DataList {
    const options = Object.assign({}, this._opts, opts);
    const list = new DataList(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
*/
