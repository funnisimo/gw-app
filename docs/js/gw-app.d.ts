import * as XY from 'gw-utils/xy.js';
import * as BUFFER from 'gw-canvas/buffer.js';
import { Buffer } from 'gw-canvas/buffer.js';
import * as TextUtils from 'gw-utils/text/index.js';
import * as Color from 'gw-canvas/color.js';
import { ColorBase } from 'gw-canvas/color.js';
import * as gw_utils_types_js from 'gw-utils/types.js';
import * as CANVAS from 'gw-canvas/index.js';

type CancelFn = () => void;
type CallbackFn = (...args: any[]) => void;
interface CallbackObj {
    [event: string]: CallbackFn;
}
interface CallbackInfo {
    fn: CallbackFn;
    ctx?: any;
    once?: boolean;
}
type UnhandledFn = (ev: string, ...args: any[]) => void;
declare class Events {
    _events: Record<string, (CallbackInfo | null)[]>;
    _ctx: any;
    onUnhandled: UnhandledFn | null;
    constructor(ctx?: any, events?: CallbackObj);
    has(name: string): boolean;
    on(cfg: CallbackObj): CancelFn;
    on(ev: string | string[], fn: CallbackFn): CancelFn;
    once(ev: string | string[], fn: CallbackFn): CancelFn;
    off(ev: string | string[], cb?: CallbackFn): void;
    emit(ev: string | string[], ...args: any[]): boolean;
    _unhandled(ev: string, args: any[]): boolean;
    clear(): void;
    /** @deprecated */
    clear_event(name: string): void;
    /** @deprecated */
    restart(): void;
}

interface UISelectable {
    readonly tag: string;
    readonly classes: string[];
    children: UISelectable[];
    attr(name: string): PropType | undefined;
    prop(name: string): PropType | undefined;
    parent: UISelectable | null;
}
type MatchFn = (el: UISelectable) => boolean;
type BuildFn = (next: MatchFn, e: UISelectable) => boolean;
declare class Selector {
    text: string;
    priority: number;
    matchFn: MatchFn;
    constructor(text: string);
    protected _parse(text: string): MatchFn;
    protected _parentMatch(): BuildFn;
    protected _ancestorMatch(): BuildFn;
    protected _matchElement(text: string): BuildFn;
    protected _matchTag(tag: string): MatchFn | null;
    protected _matchClass(cls: string): MatchFn;
    protected _matchProp(prop: string): MatchFn;
    protected _matchId(id: string): MatchFn;
    protected _matchFirst(): MatchFn;
    protected _matchLast(): MatchFn;
    protected _matchNot(fn: MatchFn): MatchFn;
    matches(obj: UISelectable): boolean;
}
declare function compile(text: string): Selector;

interface UIStyle {
    readonly selector: Selector;
    dirty: boolean;
    readonly fg?: Color.ColorBase;
    readonly bg?: Color.ColorBase;
    readonly align?: TextUtils.Align;
    readonly valign?: TextUtils.VAlign;
    readonly opacity?: number;
    get(key: keyof UIStyle): any;
    set(key: keyof UIStyle, value: any): this;
    set(values: StyleOptions): this;
    unset(key: keyof UIStyle): this;
}
interface UIStylable extends UISelectable {
    style(): UIStyle;
}
type StyleType = string | StyleOptions;
interface StyleOptions {
    fg?: Color.ColorBase;
    bg?: Color.ColorBase;
    align?: TextUtils.Align;
    valign?: TextUtils.VAlign;
}
interface StyleOptions {
    fg?: Color.ColorBase;
    bg?: Color.ColorBase;
    align?: TextUtils.Align;
    valign?: TextUtils.VAlign;
    opacity?: number;
}
declare class Style implements UIStyle {
    _fg?: Color.ColorBase;
    _bg?: Color.ColorBase;
    _border?: Color.ColorBase;
    _align?: TextUtils.Align;
    _valign?: TextUtils.VAlign;
    _opacity?: number;
    selector: Selector;
    protected _dirty: boolean;
    constructor(selector?: string, init?: StyleOptions);
    get dirty(): boolean;
    set dirty(v: boolean);
    get fg(): Color.ColorBase | undefined;
    get bg(): Color.ColorBase | undefined;
    get opacity(): number | undefined;
    dim(pct?: number, fg?: boolean, bg?: boolean): this;
    bright(pct?: number, fg?: boolean, bg?: boolean): this;
    invert(): this;
    get align(): TextUtils.Align | undefined;
    get valign(): TextUtils.VAlign | undefined;
    get(key: keyof Style): any;
    set(opts: StyleOptions, setDirty?: boolean): this;
    set(key: keyof StyleOptions, value: any, setDirty?: boolean): this;
    unset(key: keyof Style): this;
    clone(): this;
    copy(other: Style): this;
}
declare function makeStyle(style: string, selector?: string): Style;
declare class ComputedStyle extends Style {
    sources: UIStyle[];
    _baseFg: Color.Color | null;
    _baseBg: Color.Color | null;
    constructor(sources?: UIStyle[]);
    get opacity(): number;
    set opacity(v: number);
    get dirty(): boolean;
    set dirty(v: boolean);
}
declare class Sheet {
    rules: UIStyle[];
    _parent: Sheet | null;
    _dirty: boolean;
    constructor(parentSheet?: Sheet | null);
    get dirty(): boolean;
    set dirty(v: boolean);
    setParent(sheet: Sheet | null): void;
    add(selector: string, props: StyleOptions): this;
    get(selector: string): UIStyle | null;
    load(styles: Record<string, StyleOptions>): this;
    remove(selector: string): void;
    _rulesFor(widget: UIStylable): UIStyle[];
    computeFor(widget: UIStylable): ComputedStyle;
}
declare const defaultStyle: Sheet;

type TimerFn = () => void | boolean;
interface TimerInfo {
    delay: number;
    fn: TimerFn;
    repeat: number;
}
declare class Timers {
    _timers: TimerInfo[];
    _ctx: any;
    constructor(ctx?: any);
    get length(): number;
    clear(): void;
    restart(): void;
    setTimeout(fn: TimerFn, delay: number): CancelFn;
    setInterval(fn: TimerFn, delay: number): CancelFn;
    update(dt: number): void;
}

type Callback = () => void;
declare class Loop {
    _timer: number;
    get isRunning(): boolean;
    start(cb: Callback, dt?: number): void;
    stop(): void;
}

interface PendingInfo {
    action: "_start" | "stop" | "show";
    scene: Scene;
    data: any;
}
declare class Scenes {
    _app: App;
    _config: Record<string, SceneCreateOpts>;
    _active: Scene[];
    _busy: boolean;
    _pending: PendingInfo[];
    constructor(gw: App);
    get isBusy(): boolean;
    config(scenes: Record<string, SceneCreateOpts | SceneMakeFn>): void;
    config(id: string, opts: SceneCreateOpts | SceneMakeFn): void;
    get(): Scene;
    get(id?: string): Scene | null;
    emit(ev: string, ...args: any[]): void;
    create(id: string, opts?: SceneCreateOpts): Scene;
    switchTo(id: string | Scene, opts?: SceneStartOpts): Scene;
    _switchTo(scene: Scene, opts?: SceneStartOpts): void;
    show(id: string | Scene, data?: SceneStartOpts): Scene;
    _started(scene: Scene): void;
    stop(data?: any): void;
    stop(id: string, data?: any): void;
    _stopped(_scene: Scene): void;
    destroy(id: string, data?: any): void;
    pause(id: string, opts?: ScenePauseOpts): void;
    pause(opts?: ScenePauseOpts): void;
    resume(opts?: ScenePauseOpts): void;
    resume(id: string, opts?: ScenePauseOpts): void;
    frameStart(): void;
    input(ev: Event): void;
    update(dt: number): void;
    fixed_update(dt: number): void;
    draw(buffer: BUFFER.Buffer): void;
    frameDebug(buffer: BUFFER.Buffer): void;
    frameEnd(buffer: BUFFER.Buffer): void;
}
declare const scenes: Record<string, SceneCreateOpts>;
declare function installScene(id: string, scene: SceneCreateOpts | SceneMakeFn): void;

interface TextOptions extends WidgetOpts {
    text?: string;
}
declare class Text extends Widget {
    _text: string;
    _lines: string[];
    _fixedWidth: boolean;
    _fixedHeight: boolean;
    constructor(opts: TextOptions);
    text(): string;
    text(v: string): this;
    resize(w: number, h: number): this;
    addChild(): this;
    _draw(buffer: BUFFER.Buffer): void;
}

type PrefixType = "none" | "letter" | "number" | "bullet";
type FormatFn = TextUtils.Template;
type SelectType = "none" | "column" | "row" | "cell";
type HoverType = "none" | "column" | "row" | "cell" | "select";
type BorderType = "ascii" | "fill" | "none";
interface ColumnOptions {
    width?: number;
    format?: string | FormatFn;
    header?: string;
    headerTag?: string;
    headerClass?: string;
    empty?: string;
    dataTag?: string;
    dataClass?: string;
}
interface DataTableOptions extends Omit<WidgetOpts, "height"> {
    size?: number;
    rowHeight?: number;
    header?: boolean;
    headerTag?: string;
    dataTag?: string;
    prefix?: PrefixType;
    select?: SelectType;
    hover?: HoverType;
    wrap?: boolean;
    columns: ColumnOptions[];
    data?: DataItem[];
    border?: boolean | BorderType;
}
declare class Column {
    width: number;
    format: TextUtils.Template;
    header: string;
    headerTag: string;
    dataTag: string;
    empty: string;
    constructor(opts: ColumnOptions);
    addHeader(table: DataTable, x: number, y: number, col: number): Text;
    addData(table: DataTable, data: DataItem, x: number, y: number, col: number, row: number): Text;
    addEmpty(table: DataTable, x: number, y: number, col: number, row: number): Text;
}
declare class DataTable extends Widget {
    static default: {
        columnWidth: number;
        header: boolean;
        empty: string;
        tag: string;
        headerTag: string;
        dataTag: string;
        select: SelectType;
        hover: HoverType;
        prefix: PrefixType;
        border: BorderType;
        wrap: boolean;
    };
    columns: Column[];
    showHeader: boolean;
    rowHeight: number;
    size: number;
    selectedRow: number;
    selectedColumn: number;
    _data: DataItem[];
    constructor(opts: DataTableOptions);
    get selectedData(): any;
    select(col: number, row: number): this;
    selectNextRow(): this;
    selectPrevRow(): this;
    selectNextCol(): this;
    selectPrevCol(): this;
    blur(reverse?: boolean): void;
    _setData(v: DataItem[]): this;
    _draw(buffer: BUFFER.Buffer): boolean;
    keypress(e: Event): boolean;
    dir(e: Event): boolean;
}

type PadInfo = boolean | number | [number] | [number, number] | [number, number, number, number];
interface DialogOptions extends WidgetOpts {
    width: number;
    height: number;
    border?: BorderType;
    pad?: PadInfo;
    legend?: string;
    legendTag?: string;
    legendClass?: string;
    legendAlign?: TextUtils.Align;
}
declare function toPadArray(pad: PadInfo): [number, number, number, number];
declare class Dialog extends Widget {
    static default: {
        tag: string;
        border: BorderType;
        pad: boolean;
        legendTag: string;
        legendClass: string;
        legendAlign: TextUtils.Align;
    };
    legend: Widget | null;
    constructor(opts: DialogOptions);
    _adjustBounds(pad: [number, number, number, number]): this;
    get _innerLeft(): number;
    get _innerWidth(): number;
    get _innerTop(): number;
    get _innerHeight(): number;
    _addLegend(opts: DialogOptions): this;
    _draw(buffer: BUFFER.Buffer): boolean;
}
type AddDialogOptions = DialogOptions & UpdatePosOpts & {
    parent?: Widget;
};
declare function dialog(opts: AddDialogOptions): Dialog;

interface AlertOptions extends Partial<DialogOptions> {
    duration?: number;
    waitForAck?: boolean;
    textClass?: string;
    opacity?: number;
    text: string;
    args?: Record<string, any>;
}
declare const AlertScene: {
    create(this: Scene): void;
    start(this: Scene, data: AlertOptions): void;
    stop(this: Scene): void;
};

interface ConfirmOptions extends Partial<DialogOptions> {
    text: string;
    textClass?: string;
    opacity?: number;
    buttonWidth?: number;
    ok?: string;
    okClass?: string;
    cancel?: boolean | string;
    cancelClass?: string;
    done?: (result: boolean) => any;
}
declare const ConfirmScene: {
    create(this: Scene): void;
    start(this: Scene, opts: ConfirmOptions): void;
    stop(this: Scene): void;
};

interface ButtonOptions extends Omit<TextOptions, 'text'> {
    text?: string;
}
declare class Button extends Text {
    constructor(opts: ButtonOptions);
}

type WidgetEvents = "create" | "input" | "update" | "draw" | "destroy" | "keypress" | "mouseenter" | "mousemove" | "mouseleave" | "click" | "on";
interface PromptOptions$1 extends Omit<DialogOptions, "width" | "height" | WidgetEvents>, SceneStartOpts {
    width?: number;
    height?: number;
    prompt: string;
    textClass?: string;
    opacity?: number;
    buttonWidth?: number;
    label?: string;
    labelClass?: string;
    default?: string;
    placeholder?: string;
    inputClass?: string;
    minLength?: number;
    maxLength?: number;
    numbersOnly?: boolean;
    min?: number;
    max?: number;
    done?: (result: string | null) => any;
}
declare const PromptScene: {
    create(this: Scene): void;
    start(this: Scene, opts: PromptOptions$1): void;
    stop(this: Scene): void;
};

declare global {
    var APP: App;
}
interface AppOptsBase {
    width?: number;
    height?: number;
    glyphs?: CANVAS.Glyphs;
    seed?: number;
    image?: HTMLImageElement | string;
    start?: boolean;
    font?: string;
    fontSize?: number;
    size?: number;
    tileWidth?: number;
    tileHeight?: number;
    basicOnly?: boolean;
    basic?: boolean;
    scene?: SceneCreateOpts | boolean | string;
    scenes?: Record<string, SceneCreateOpts>;
    sceneStartOpts?: SceneStartOpts;
    name?: string;
    loop?: Loop;
    dt?: number;
    data?: {
        [id: string]: any;
    };
}
type AppOpts = AppOptsBase & ({
    div: HTMLElement | string;
    canvas?: CANVAS.Canvas;
} | {
    div?: HTMLElement | string;
    canvas: CANVAS.Canvas;
});
declare class App {
    name: string;
    canvas: CANVAS.Canvas;
    events: Events;
    timers: Timers;
    scenes: Scenes;
    io: EventQueue;
    loop: Loop;
    styles: Sheet;
    dt: number;
    time: number;
    realTime: number;
    skipTime: boolean;
    fps: number;
    fpsBuf: number[];
    fpsTimer: number;
    numFrames: number;
    loopId: number;
    stopped: boolean;
    paused: boolean;
    debug: boolean;
    buffer: Buffer;
    data: {
        [id: string]: any;
    };
    constructor(opts?: AppOpts);
    get width(): number;
    get height(): number;
    get node(): HTMLCanvasElement;
    get mouseXY(): gw_utils_types_js.XY;
    get scene(): Scene;
    on(ev: string, fn: CallbackFn): CancelFn;
    emit(ev: string, ...args: any[]): void;
    wait(delay: number, fn: TimerFn): CancelFn;
    wait(delay: number, fn: string, ctx?: Record<string, any>): CancelFn;
    repeat(delay: number, fn: TimerFn): CancelFn;
    repeat(delay: number, fn: string, ctx?: Record<string, any>): CancelFn;
    start(): this;
    stop(): void;
    _frame(t?: number): void;
    _input(ev: Event): void;
    _update(dt?: number): void;
    _fixed_update(dt?: number): void;
    _frameStart(): void;
    _draw(): void;
    _frameDebug(): void;
    _frameEnd(): void;
    alert(text: string, opts?: Omit<AlertOptions, "text">): Scene;
    show(id: string | Scene, opts?: SceneStartOpts): Scene;
    switchTo(id: string | Scene, opts?: SceneStartOpts): Scene;
    confirm(text: string, opts?: Omit<ConfirmOptions, "text">): Scene;
    prompt(text: string, opts?: Omit<PromptOptions$1, "prompt">): Scene;
}
declare function make$2(opts: AppOpts): App;
declare function start(opts: AppOpts): App;
declare var active: App;

type TweenCb<T> = (obj: T, dt: number) => any;
type TweenFinishCb<T> = (obj: T, success: boolean) => any;
type EasingFn = (v: number) => number;
type InterpolateFn = (start: any, goal: any, pct: number) => any;
declare class BaseObj<T extends {
    update(t: number): void;
}> {
    events: Events;
    children: T[];
    on(ev: string | string[], fn: CallbackFn): this;
    once(ev: string | string[], fn: CallbackFn): this;
    off(ev: string | string[], fn: CallbackFn): this;
    emit(ev: string | string[], ...args: any[]): boolean;
    addChild(t: T): this;
    removeChild(t: T): this;
    update(dt: number): void;
}
interface TweenUpdate {
    isRunning(): boolean;
    update(dt: number): void;
}
declare class Tween<T> extends BaseObj<Tween<T>> implements TweenUpdate {
    _obj: T;
    _repeat: number;
    _count: number;
    _from: boolean;
    _duration: number;
    _delay: number;
    _repeatDelay: number;
    _yoyo: boolean;
    _time: number;
    _startTime: number;
    _goal: Partial<Record<keyof T, any>>;
    _start: Partial<Record<keyof T, any>>;
    _success: boolean;
    _easing: EasingFn;
    _interpolate: InterpolateFn;
    constructor(src: T);
    isRunning(): boolean;
    onStart(cb: TweenCb<T>): this;
    onUpdate(cb: TweenCb<T>): this;
    onRepeat(cb: TweenCb<T>): this;
    onFinish(cb: TweenFinishCb<T>): this;
    to(goal: Partial<Record<keyof T, any>>, dynamic?: boolean | Array<keyof T>): this;
    from(start: Partial<Record<keyof T, any>>, dynamic?: boolean | Array<keyof T>): this;
    duration(): number;
    duration(v: number): this;
    repeat(): number;
    repeat(v: number): this;
    delay(): number;
    delay(v: number): this;
    repeatDelay(): number;
    repeatDelay(v: number): this;
    yoyo(): boolean;
    yoyo(v: boolean): this;
    start(animator?: {
        add: (tween: Tween<T>) => void;
    }): this;
    update(dt: number): void;
    _restart(): void;
    stop(success?: boolean): void;
    _updateProperties(obj: T, start: Partial<T>, goal: Partial<T>, pct: number): boolean;
}
declare function make$1<T>(src: T, duration?: number): Tween<T>;
declare const move: typeof make$1;
declare function linear(pct: number): number;
declare function interpolate(start: any, goal: any, pct: number): any;

declare class Tweens {
    _tweens: TweenUpdate[];
    constructor();
    get length(): number;
    clear(): void;
    add(tween: TweenUpdate): void;
    remove(tween: TweenUpdate): void;
    update(dt: number): void;
}

type SceneCallback = (this: Scene) => void;
type SceneCreateCb = (this: Scene, opts: SceneCreateOpts) => void;
type SceneDataCb = (this: Scene, data: any) => void;
type SceneStartCb = (this: Scene, opts: any) => void;
type ScenePauseCb = (this: Scene, opts: SceneResumeOpts) => void;
type SceneUpdateCb = (this: Scene, dt: number) => void;
type SceneBufferCb = (this: Scene, buffer: BUFFER.Buffer) => void;
type SceneEventCb = (this: Scene, event: Event) => void;
type SceneAnyCb = (this: Scene, ...args: any[]) => void;
type SceneMakeFn = (id: string, app: App) => Scene;
interface SceneCreateOpts {
    bg?: Color.ColorBase;
    data?: Record<string, any>;
    styles?: Sheet;
    make?: SceneMakeFn;
    create?: SceneCreateCb;
    destroy?: SceneDataCb;
    start?: SceneStartCb;
    stop?: SceneDataCb;
    pause?: ScenePauseCb;
    resume?: ScenePauseCb;
    frameStart?: SceneCallback;
    input?: SceneEventCb;
    update?: SceneUpdateCb;
    fixedUpdate?: SceneUpdateCb;
    draw?: SceneBufferCb;
    frameDebug?: SceneBufferCb;
    frameEnd?: SceneBufferCb;
    click?: SceneEventCb;
    keypress?: SceneEventCb;
    mousemove?: SceneEventCb;
    on?: Record<string, SceneAnyCb>;
}
interface SceneStartOpts {
    [key: string]: any;
}
interface SceneResumeOpts {
    timers?: boolean;
    tweens?: boolean;
    update?: boolean;
    draw?: boolean;
    input?: boolean;
}
interface ScenePauseOpts extends SceneResumeOpts {
    duration?: number;
}
interface SceneObj {
    update(dt: number): void;
    draw(buffer: BUFFER.Buffer): void;
    destroy(): void;
    emit(ev: string, ...args: any[]): void;
}
declare class Scene {
    id: string;
    app: App;
    events: Events;
    tweens: Tweens;
    timers: Timers;
    buffer: BUFFER.Buffer;
    all: Widget[];
    children: Widget[];
    focused: Widget | null;
    dt: number;
    time: number;
    realTime: number;
    skipTime: boolean;
    stopped: boolean;
    paused: SceneResumeOpts;
    debug: boolean;
    _needsDraw: boolean;
    styles: Sheet;
    bg: Color.Color;
    data: Record<string, any>;
    constructor(id: string, app: App);
    get needsDraw(): boolean;
    set needsDraw(val: boolean);
    get width(): number;
    get height(): number;
    isActive(): boolean;
    isPaused(): () => any;
    isSleeping(): () => any;
    _create(opts?: SceneCreateOpts): void;
    destroy(data?: any): void;
    switchTo(opts?: SceneStartOpts): this;
    _start(opts?: SceneStartOpts): void;
    show(data?: SceneStartOpts): this;
    stop(data?: any): void;
    pause(opts?: ScenePauseOpts): void;
    resume(opts?: SceneResumeOpts): void;
    frameStart(): void;
    input(e: Event): void;
    update(dt: number): void;
    fixed_update(dt: number): void;
    draw(buffer: BUFFER.Buffer): void;
    _draw(buffer: BUFFER.Buffer): void;
    frameDebug(buffer: BUFFER.Buffer): void;
    frameEnd(buffer: BUFFER.Buffer): void;
    fadeIn(widget: Widget, ms: number): this;
    fadeOut(widget: Widget, ms: number): this;
    fadeTo(widget: Widget, opacity: number, ms: number): this;
    fadeToggle(widget: Widget, ms: number): this;
    slideIn(widget: Widget, x: number, y: number, from: "left" | "top" | "right" | "bottom", ms: number): this;
    slideOut(widget: Widget, dir: "left" | "top" | "right" | "bottom", ms: number): this;
    slide(widget: Widget, from: XY.XY | XY.Loc, to: XY.XY | XY.Loc, ms: number): this;
    get(id: string): Widget | null;
    _attach(widget: Widget): void;
    _detach(widget: Widget): void;
    addChild(child: Widget, opts?: UpdatePosOpts & {
        focused?: boolean;
    }): void;
    removeChild(child: Widget): void;
    childAt(xy: XY.XY | number, y?: number): Widget | null;
    widgetAt(xy: XY.XY | number, y?: number): Widget | null;
    setFocusWidget(w: Widget | null, reverse?: boolean): void;
    /** Returns true if the focus changed */
    nextTabStop(): boolean;
    /** Returns true if the focus changed */
    prevTabStop(): boolean;
    on(cfg: CallbackObj): CancelFn;
    on(ev: string | string[], cb: CallbackFn): CancelFn;
    once(ev: string, cb: CallbackFn): CancelFn;
    emit(ev: string | string[], ...args: any[]): boolean;
    wait(delay: number, fn: TimerFn): CancelFn;
    wait(delay: number, fn: string, ctx?: Record<string, any>): CancelFn;
    repeat(delay: number, fn: TimerFn): CancelFn;
    repeat(delay: number, fn: string, ...args: any[]): CancelFn;
}

type DataValue = any;
type DataObject = Record<string, DataValue>;
type DataItem = DataValue | DataValue[] | DataObject;
type DataType = DataItem[] | DataObject;
type EventCb = (name: string, widget: Widget | null, args?: any) => boolean | any;
interface UpdatePosOpts {
    x?: number;
    y?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    center?: boolean;
    centerX?: boolean;
    centerY?: boolean;
}
interface SetParentOptions extends UpdatePosOpts {
    first?: boolean;
    last?: boolean;
    before?: string | Widget;
    after?: string | Widget;
    focused?: boolean;
}
interface WidgetOpts extends StyleOptions, SetParentOptions {
    tag?: string;
    id?: string;
    data?: DataType;
    parent?: Widget | null;
    scene?: Scene | null;
    width?: number;
    height?: number;
    class?: string;
    tabStop?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    action?: string | boolean;
    create?: CallbackFn;
    input?: CallbackFn;
    update?: CallbackFn;
    draw?: CallbackFn;
    destroy?: CallbackFn;
    keypress?: CallbackFn;
    mouseenter?: CallbackFn;
    mousemove?: CallbackFn;
    mouseleave?: CallbackFn;
    click?: CallbackFn;
    on?: Record<string, CallbackFn>;
}
type PropType = string | number | boolean;
declare class Widget {
    parent: Widget | null;
    scene: Scene | null;
    children: Widget[];
    bounds: XY.Bounds;
    events: Events;
    _style: Style;
    _used: ComputedStyle;
    _data: DataType;
    classes: string[];
    _props: Record<string, PropType>;
    _attrs: Record<string, PropType>;
    constructor(opts?: WidgetOpts);
    get needsDraw(): boolean;
    set needsDraw(v: boolean);
    get tag(): string;
    get id(): string;
    data(): DataType;
    data(all: DataType): this;
    data(key: string): any;
    data(key: string, value: any): this;
    _setData(v: Record<string, any> | any[]): void;
    _setDataItem(key: string, v: any): void;
    pos(): XY.XY;
    pos(xy: XY.XY): this;
    pos(x: number, y: number): this;
    updatePos(opts: UpdatePosOpts): void;
    contains(e: XY.XY): boolean;
    contains(x: number, y: number): boolean;
    center(bounds?: XY.Bounds): this;
    centerX(bounds?: XY.Bounds): this;
    centerY(bounds?: XY.Bounds): this;
    left(n: number): this;
    right(n: number): this;
    top(n: number): this;
    bottom(n: number): this;
    resize(w: number, h: number): this;
    style(): Style;
    style(opts: StyleOptions): this;
    style(name: keyof StyleOptions): any;
    style(name: keyof StyleOptions, value: any): this;
    addClass(c: string): this;
    removeClass(c: string): this;
    hasClass(c: string): boolean;
    toggleClass(c: string): this;
    attr(name: string): PropType;
    attr(name: string, v: PropType): this;
    _attrInt(name: string): number;
    _attrStr(name: string): string;
    _attrBool(name: string): boolean;
    text(): string;
    text(v: string): this;
    prop(name: string): PropType | undefined;
    prop(name: string, v: PropType): this;
    _setProp(name: string, v: PropType): void;
    _propInt(name: string): number;
    _propStr(name: string): string;
    _propBool(name: string): boolean;
    toggleProp(name: string): this;
    incProp(name: string, n?: number): this;
    get hovered(): boolean;
    set hovered(v: boolean);
    get disabled(): boolean;
    set disabled(v: boolean);
    get hidden(): boolean;
    set hidden(v: boolean);
    get needsStyle(): boolean;
    set needsStyle(v: boolean);
    get focused(): boolean;
    focus(reverse?: boolean): void;
    blur(reverse?: boolean): void;
    setParent(parent: Widget | null, opts?: SetParentOptions): void;
    addChild(child: Widget): void;
    removeChild(child: Widget): void;
    childAt(xy: XY.XY): Widget | null;
    childAt(xy: number, y: number): Widget | null;
    getChild(id: string): Widget | null;
    on(ev: string | string[], cb: CallbackFn): CancelFn;
    once(ev: string | string[], cb: CallbackFn): CancelFn;
    off(ev: string | string[], cb: CallbackFn): void;
    emit(ev: string | string[], ...args: any[]): boolean;
    action(ev?: Event): void;
    input(e: Event): void;
    _mouseenter(e: Event): void;
    mousemove(e: Event): void;
    _mousemove(e: Event): void;
    _mouseleave(e: Event): void;
    click(e: Event): void;
    _click(e: Event): void;
    keypress(e: Event): void;
    draw(buffer: BUFFER.Buffer): void;
    _draw(buffer: BUFFER.Buffer): void;
    _drawFill(buffer: BUFFER.Buffer): void;
    update(dt: number): void;
    fixedUpdate(dt: number): void;
    destroy(): void;
}
declare function alignChildren(widget: Widget, align?: TextUtils.Align): void;
declare function spaceChildren(widget: Widget, space?: number): void;
declare function wrapChildren(widget: Widget, pad?: number): void;

interface EventType {
    type: string;
    defaultPrevented: boolean | undefined;
    propagationStopped: boolean | undefined;
    doDefault(): void;
    preventDefault(): void;
    propagate(): void;
    stopPropagation(): void;
    reset(type: string, opts?: Record<string, any>): void;
    [key: string]: any;
}
declare class Event implements EventType {
    type: string;
    target: Widget | null;
    defaultPrevented: boolean | undefined;
    propagationStopped: boolean | undefined;
    key: string;
    code: string;
    shiftKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    dir: XY.Loc | null;
    x: number;
    y: number;
    clientX: number;
    clientY: number;
    dt: number;
    constructor(type: string, opts?: Partial<Event>);
    doDefault(): void;
    preventDefault(): void;
    propagate(): void;
    stopPropagation(): void;
    reset(type: string, opts?: Partial<Event>): void;
    clone(): Event;
    dispatch(handler: {
        emit(name: string, e: Event): boolean;
    }): boolean;
}
type ControlFn = () => void | Promise<void>;
type EventFn = (event: Event) => boolean | void | Promise<boolean | void>;
type IOMap = Record<string, EventFn | ControlFn>;
type EventMatchFn = (event: Event) => boolean;
declare const KEYPRESS = "keypress";
declare const MOUSEMOVE = "mousemove";
declare const CLICK = "click";
declare const TICK = "tick";
declare const MOUSEUP = "mouseup";
declare const STOP = "stop";
declare function isControlCode(e: string | Event): boolean;
declare function recycleEvent(ev: Event): void;
declare function makeStopEvent(): Event;
declare function makeCustomEvent(type: string, opts?: Partial<Event>): Event;
declare function makeTickEvent(dt: number): Event;
declare function makeKeyEvent(e: KeyboardEvent): Event;
declare function keyCodeDirection(key: string): XY.Loc | null;
declare function ignoreKeyEvent(e: KeyboardEvent): boolean;
declare function makeMouseEvent(e: MouseEvent, x: number, y: number): Event;
declare class EventQueue {
    _events: Event[];
    lastClick: XY.XY;
    constructor();
    get length(): number;
    clear(): void;
    enqueue(ev: Event): void;
    dequeue(): Event | undefined;
    peek(): Event | undefined;
}

type index_d$2_App = App;
declare const index_d$2_App: typeof App;
type index_d$2_AppOpts = AppOpts;
type index_d$2_AppOptsBase = AppOptsBase;
declare const index_d$2_CLICK: typeof CLICK;
type index_d$2_Callback = Callback;
type index_d$2_CallbackFn = CallbackFn;
type index_d$2_CallbackObj = CallbackObj;
type index_d$2_CancelFn = CancelFn;
type index_d$2_ComputedStyle = ComputedStyle;
declare const index_d$2_ComputedStyle: typeof ComputedStyle;
type index_d$2_ControlFn = ControlFn;
type index_d$2_DataItem = DataItem;
type index_d$2_DataObject = DataObject;
type index_d$2_DataType = DataType;
type index_d$2_DataValue = DataValue;
type index_d$2_Event = Event;
declare const index_d$2_Event: typeof Event;
type index_d$2_EventCb = EventCb;
type index_d$2_EventFn = EventFn;
type index_d$2_EventMatchFn = EventMatchFn;
type index_d$2_EventQueue = EventQueue;
declare const index_d$2_EventQueue: typeof EventQueue;
type index_d$2_EventType = EventType;
type index_d$2_Events = Events;
declare const index_d$2_Events: typeof Events;
type index_d$2_IOMap = IOMap;
declare const index_d$2_KEYPRESS: typeof KEYPRESS;
type index_d$2_Loop = Loop;
declare const index_d$2_Loop: typeof Loop;
declare const index_d$2_MOUSEMOVE: typeof MOUSEMOVE;
declare const index_d$2_MOUSEUP: typeof MOUSEUP;
type index_d$2_MatchFn = MatchFn;
type index_d$2_PropType = PropType;
declare const index_d$2_STOP: typeof STOP;
type index_d$2_Scene = Scene;
declare const index_d$2_Scene: typeof Scene;
type index_d$2_SceneAnyCb = SceneAnyCb;
type index_d$2_SceneBufferCb = SceneBufferCb;
type index_d$2_SceneCallback = SceneCallback;
type index_d$2_SceneCreateCb = SceneCreateCb;
type index_d$2_SceneCreateOpts = SceneCreateOpts;
type index_d$2_SceneDataCb = SceneDataCb;
type index_d$2_SceneEventCb = SceneEventCb;
type index_d$2_SceneMakeFn = SceneMakeFn;
type index_d$2_SceneObj = SceneObj;
type index_d$2_ScenePauseCb = ScenePauseCb;
type index_d$2_ScenePauseOpts = ScenePauseOpts;
type index_d$2_SceneResumeOpts = SceneResumeOpts;
type index_d$2_SceneStartCb = SceneStartCb;
type index_d$2_SceneStartOpts = SceneStartOpts;
type index_d$2_SceneUpdateCb = SceneUpdateCb;
type index_d$2_Scenes = Scenes;
declare const index_d$2_Scenes: typeof Scenes;
type index_d$2_Selector = Selector;
declare const index_d$2_Selector: typeof Selector;
type index_d$2_SetParentOptions = SetParentOptions;
type index_d$2_Sheet = Sheet;
declare const index_d$2_Sheet: typeof Sheet;
type index_d$2_Style = Style;
declare const index_d$2_Style: typeof Style;
type index_d$2_StyleOptions = StyleOptions;
type index_d$2_StyleType = StyleType;
declare const index_d$2_TICK: typeof TICK;
type index_d$2_TimerFn = TimerFn;
type index_d$2_Timers = Timers;
declare const index_d$2_Timers: typeof Timers;
type index_d$2_Tweens = Tweens;
declare const index_d$2_Tweens: typeof Tweens;
type index_d$2_UISelectable = UISelectable;
type index_d$2_UIStylable = UIStylable;
type index_d$2_UIStyle = UIStyle;
type index_d$2_UnhandledFn = UnhandledFn;
type index_d$2_UpdatePosOpts = UpdatePosOpts;
type index_d$2_Widget = Widget;
declare const index_d$2_Widget: typeof Widget;
type index_d$2_WidgetOpts = WidgetOpts;
declare const index_d$2_active: typeof active;
declare const index_d$2_alignChildren: typeof alignChildren;
declare const index_d$2_compile: typeof compile;
declare const index_d$2_defaultStyle: typeof defaultStyle;
declare const index_d$2_ignoreKeyEvent: typeof ignoreKeyEvent;
declare const index_d$2_installScene: typeof installScene;
declare const index_d$2_isControlCode: typeof isControlCode;
declare const index_d$2_keyCodeDirection: typeof keyCodeDirection;
declare const index_d$2_makeCustomEvent: typeof makeCustomEvent;
declare const index_d$2_makeKeyEvent: typeof makeKeyEvent;
declare const index_d$2_makeMouseEvent: typeof makeMouseEvent;
declare const index_d$2_makeStopEvent: typeof makeStopEvent;
declare const index_d$2_makeStyle: typeof makeStyle;
declare const index_d$2_makeTickEvent: typeof makeTickEvent;
declare const index_d$2_recycleEvent: typeof recycleEvent;
declare const index_d$2_scenes: typeof scenes;
declare const index_d$2_spaceChildren: typeof spaceChildren;
declare const index_d$2_start: typeof start;
declare const index_d$2_wrapChildren: typeof wrapChildren;
declare namespace index_d$2 {
  export { index_d$2_App as App, type index_d$2_AppOpts as AppOpts, type index_d$2_AppOptsBase as AppOptsBase, index_d$2_CLICK as CLICK, type index_d$2_Callback as Callback, type index_d$2_CallbackFn as CallbackFn, type index_d$2_CallbackObj as CallbackObj, type index_d$2_CancelFn as CancelFn, index_d$2_ComputedStyle as ComputedStyle, type index_d$2_ControlFn as ControlFn, type index_d$2_DataItem as DataItem, type index_d$2_DataObject as DataObject, type index_d$2_DataType as DataType, type index_d$2_DataValue as DataValue, index_d$2_Event as Event, type index_d$2_EventCb as EventCb, type index_d$2_EventFn as EventFn, type index_d$2_EventMatchFn as EventMatchFn, index_d$2_EventQueue as EventQueue, type index_d$2_EventType as EventType, index_d$2_Events as Events, type index_d$2_IOMap as IOMap, index_d$2_KEYPRESS as KEYPRESS, index_d$2_Loop as Loop, index_d$2_MOUSEMOVE as MOUSEMOVE, index_d$2_MOUSEUP as MOUSEUP, type index_d$2_MatchFn as MatchFn, type index_d$2_PropType as PropType, index_d$2_STOP as STOP, index_d$2_Scene as Scene, type index_d$2_SceneAnyCb as SceneAnyCb, type index_d$2_SceneBufferCb as SceneBufferCb, type index_d$2_SceneCallback as SceneCallback, type index_d$2_SceneCreateCb as SceneCreateCb, type index_d$2_SceneCreateOpts as SceneCreateOpts, type index_d$2_SceneDataCb as SceneDataCb, type index_d$2_SceneEventCb as SceneEventCb, type index_d$2_SceneMakeFn as SceneMakeFn, type index_d$2_SceneObj as SceneObj, type index_d$2_ScenePauseCb as ScenePauseCb, type index_d$2_ScenePauseOpts as ScenePauseOpts, type index_d$2_SceneResumeOpts as SceneResumeOpts, type index_d$2_SceneStartCb as SceneStartCb, type index_d$2_SceneStartOpts as SceneStartOpts, type index_d$2_SceneUpdateCb as SceneUpdateCb, index_d$2_Scenes as Scenes, index_d$2_Selector as Selector, type index_d$2_SetParentOptions as SetParentOptions, index_d$2_Sheet as Sheet, index_d$2_Style as Style, type index_d$2_StyleOptions as StyleOptions, type index_d$2_StyleType as StyleType, index_d$2_TICK as TICK, type index_d$2_TimerFn as TimerFn, index_d$2_Timers as Timers, index_d$2_Tweens as Tweens, type index_d$2_UISelectable as UISelectable, type index_d$2_UIStylable as UIStylable, type index_d$2_UIStyle as UIStyle, type index_d$2_UnhandledFn as UnhandledFn, type index_d$2_UpdatePosOpts as UpdatePosOpts, index_d$2_Widget as Widget, type index_d$2_WidgetOpts as WidgetOpts, index_d$2_active as active, index_d$2_alignChildren as alignChildren, index_d$2_compile as compile, index_d$2_defaultStyle as defaultStyle, index_d$2_ignoreKeyEvent as ignoreKeyEvent, index_d$2_installScene as installScene, index_d$2_isControlCode as isControlCode, index_d$2_keyCodeDirection as keyCodeDirection, make$2 as make, index_d$2_makeCustomEvent as makeCustomEvent, index_d$2_makeKeyEvent as makeKeyEvent, index_d$2_makeMouseEvent as makeMouseEvent, index_d$2_makeStopEvent as makeStopEvent, index_d$2_makeStyle as makeStyle, index_d$2_makeTickEvent as makeTickEvent, index_d$2_recycleEvent as recycleEvent, index_d$2_scenes as scenes, index_d$2_spaceChildren as spaceChildren, index_d$2_start as start, index_d$2_wrapChildren as wrapChildren };
}

interface BorderOptions extends WidgetOpts {
    width: number;
    height: number;
    ascii?: boolean;
}
declare class Border extends Widget {
    ascii: boolean;
    constructor(opts: BorderOptions);
    contains(): boolean;
    _draw(buffer: BUFFER.Buffer): boolean;
}
declare function drawBorder(buffer: BUFFER.Buffer, x: number, y: number, w: number, h: number, color: {
    fg?: ColorBase;
    bg?: ColorBase;
}, ascii?: boolean): void;

interface FieldsetOptions extends Omit<DialogOptions, "width" | "height"> {
    width?: number;
    height?: number;
    dataWidth: number;
    separator?: string;
    labelTag?: string;
    labelClass?: string;
    dataTag?: string;
    dataClass?: string;
}
declare class Fieldset extends Dialog {
    static default: {
        tag: string;
        border: BorderType;
        separator: string;
        pad: boolean;
        legendTag: string;
        legendClass: string;
        legendAlign: TextUtils.Align;
        labelTag: string;
        labelClass: string;
        dataTag: string;
        dataClass: string;
    };
    fields: Field[];
    constructor(opts: FieldsetOptions);
    _adjustBounds(pad: [number, number, number, number]): this;
    get _labelLeft(): number;
    get _dataLeft(): number;
    get _nextY(): number;
    add(label: string, format: string | FieldOptions): this;
    _setData(v: Record<string, any>): void;
    _setDataItem(key: string, v: any): void;
}
interface FieldOptions extends WidgetOpts {
    format: string | TextUtils.Template;
}
declare class Field extends Text {
    _format: TextUtils.Template;
    constructor(opts: FieldOptions);
    format(v: any): this;
}

interface OrderedListOptions extends WidgetOpts {
    pad?: number;
}
declare class OrderedList extends Widget {
    static default: {
        pad: number;
    };
    _fixedWidth: boolean;
    _fixedHeight: boolean;
    constructor(opts: OrderedListOptions);
    addChild(w: Widget): void;
    _draw(buffer: BUFFER.Buffer): boolean;
    _getBullet(index: number): string;
    _drawBulletFor(widget: Widget, buffer: BUFFER.Buffer, index: number): void;
}
interface UnorderedListOptions extends OrderedListOptions {
    bullet?: string;
}
declare class UnorderedList extends OrderedList {
    static default: {
        bullet: string;
        pad: number;
    };
    constructor(opts: UnorderedListOptions);
    _getBullet(_index: number): string;
}

interface InputOptions extends TextOptions {
    id: string;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    numbersOnly?: boolean;
    min?: number;
    max?: number;
    required?: boolean;
    disabled?: boolean;
}
declare class Input extends Text {
    static default: {
        tag: string;
        width: number;
        placeholder: string;
    };
    minLength: number;
    maxLength: number;
    numbersOnly: boolean;
    min: number;
    max: number;
    constructor(opts: InputOptions);
    reset(): void;
    _setProp(name: string, v: PropType): void;
    isValid(): boolean;
    keypress(ev: Event): void;
    click(e: Event): void;
    text(): string;
    text(v: string): this;
    _draw(buffer: BUFFER.Buffer, _force?: boolean): boolean;
}

interface DataListOptions extends ColumnOptions, WidgetOpts {
    size?: number;
    rowHeight?: number;
    hover?: HoverType;
    headerTag?: string;
    dataTag?: string;
    prefix?: PrefixType;
    data?: DataItem[];
    border?: boolean | BorderType;
}
declare class DataList extends DataTable {
    constructor(opts: DataListOptions);
}

interface Rec<T> {
    [keys: string]: T;
}
type DropdownConfig = Rec<ButtonConfig>;
type ActionConfig = string;
type ButtonConfig = ActionConfig | DropdownConfig;
interface MenuOptions$1 extends WidgetOpts {
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;
    minWidth?: number;
    marker?: string;
}
declare class Menu extends Widget {
    static default: {
        tag: string;
        class: string;
        buttonClass: string;
        buttonTag: string;
        marker: string;
        minWidth: number;
    };
    _selectedIndex: number;
    children: MenuButton[];
    constructor(opts: MenuOptions$1);
    _initButtons(opts: MenuOptions$1): void;
    show(): void;
    hide(): void;
    nextItem(): void;
    prevItem(): void;
    expandItem(): Menu | null;
    selectItemWithKey(key: string): void;
}
interface MenuButtonOptions extends WidgetOpts {
    text: string;
    buttons: ButtonConfig;
}
declare class MenuButton extends Text {
    menu: Menu | null;
    constructor(opts: MenuButtonOptions);
    collapse(): void;
    expand(): Menu | null;
    _setMenuPos(xy: XY.XY, opts: MenuButtonOptions): void;
    _initMenu(opts: MenuButtonOptions): Menu | null;
}

interface MenubarOptions extends WidgetOpts {
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;
    menuClass?: string | string[];
    menuTag?: string;
    minWidth?: number;
    prefix?: string;
    separator?: string;
}
declare class Menubar extends Widget {
    static default: {
        buttonClass: string;
        buttonTag: string;
        menuClass: string;
        menuTag: string;
        prefix: string;
        separator: string;
    };
    constructor(opts: MenubarOptions);
    _initButtons(opts: MenubarOptions): void;
}

interface SelectOptions extends WidgetOpts {
    text: string;
    buttons: DropdownConfig;
    buttonClass?: string;
    buttonTag?: string;
}
declare class Select extends Widget {
    dropdown: Text;
    menu: Menu;
    constructor(opts: SelectOptions);
    _initText(opts: SelectOptions): void;
    _initMenu(opts: SelectOptions): void;
}

type NextType = string | null;
interface PromptChoice {
    info?: string | TextUtils.Template;
    next?: string;
    value?: any;
}
interface PromptOptions {
    field?: string;
    next?: string;
    id?: string;
}
declare class Prompt {
    _id: string | null;
    _field: string;
    _prompt: string | TextUtils.Template;
    _choices: string[];
    _infos: (string | TextUtils.Template)[];
    _next: NextType[];
    _values: any[];
    _defaultNext: NextType;
    selection: number;
    constructor(question: string | TextUtils.Template, field?: string | PromptOptions);
    reset(): void;
    field(): string;
    field(v: string): this;
    id(): string | null;
    id(v: string | null): this;
    prompt(arg?: any): string;
    next(): string | null;
    next(v: string | null): this;
    choices(): string[];
    choices(choices: Record<string, string | PromptChoice>): this;
    choices(choices: string[], infos?: (string | PromptChoice)[]): this;
    choice(choice: string, info?: string | PromptChoice): this;
    info(arg?: any): string;
    choose(n: number): this;
    value(): any;
    updateResult(res: any): this;
}
interface ChoiceOptions extends WidgetOpts {
    width: number;
    height: number;
    choiceWidth: number;
    border?: BorderType;
    promptTag?: string;
    promptClass?: string;
    choiceTag?: string;
    choiceClass?: string;
    infoTag?: string;
    infoClass?: string;
    prompt?: Prompt;
}
declare class Choice extends Widget {
    static default: {
        tag: string;
        border: string;
        promptTag: string;
        promptClass: string;
        choiceTag: string;
        choiceClass: string;
        infoTag: string;
        infoClass: string;
    };
    choiceWidth: number;
    _text: Widget;
    _list: DataList;
    _info: Text;
    _prompt: Prompt | null;
    _done: null | ((v: any) => void);
    constructor(opts: ChoiceOptions);
    get prompt(): Prompt | null;
    showPrompt(prompt: Prompt, arg?: any): Promise<any>;
    _addList(): this;
    _addInfo(): this;
    _addLegend(): this;
    _draw(buffer: BUFFER.Buffer): boolean;
}
declare class Inquiry {
    widget: Choice;
    _prompts: Prompt[];
    events: Record<string, EventCb[]>;
    _result: any;
    _stack: Prompt[];
    _current: Prompt | null;
    constructor(widget: Choice);
    prompts(v: Prompt[] | Prompt, ...args: Prompt[]): this;
    _finish(): void;
    _cancel(): void;
    start(): void;
    back(): void;
    restart(): void;
    quit(): void;
    _keypress(_n: string, _w: Widget | null, e: Event): boolean;
    _change(_n: string, _w: Widget | null, p: Prompt): boolean;
    on(event: string, cb: EventCb): this;
    off(event: string, cb?: EventCb): this;
    _fireEvent(name: string, source: Widget | null, args?: any): boolean;
}

interface CheckboxOptions extends TextOptions {
    uncheck?: string;
    check?: string;
    checked?: boolean;
    pad?: number;
    value?: string | [string, string];
}
declare class Checkbox extends Text {
    static default: {
        uncheck: string;
        check: string;
        pad: number;
        value: string;
    };
    constructor(opts: CheckboxOptions);
    value(): string;
    text(): string;
    text(v: string): this;
    keypress(ev: Event): void;
    _draw(buffer: BUFFER.Buffer): boolean;
}

declare class Builder {
    scene: Scene;
    _opts: WidgetOpts;
    constructor(scene: Scene);
    reset(): this;
    fg(v: Color.ColorBase): this;
    bg(v: Color.ColorBase): this;
    dim(pct?: number, fg?: boolean, bg?: boolean): this;
    bright(pct?: number, fg?: boolean, bg?: boolean): this;
    invert(): this;
    style(opts: StyleOptions): this;
    class(c: string): this;
    pos(): XY.XY;
    pos(x: number, y: number): this;
    moveTo(x: number, y: number): this;
    move(dx: number, dy: number): this;
    up(n?: number): this;
    down(n?: number): this;
    left(n?: number): this;
    right(n?: number): this;
    nextLine(n?: number): this;
    prevLine(n?: number): this;
    clear(color?: Color.ColorBase): this;
    text(info?: TextOptions | string, opts?: TextOptions): Text;
    border(opts: BorderOptions): Border;
    button(opts: ButtonOptions): Button;
    checkbox(opts: CheckboxOptions): Checkbox;
    input(opts: InputOptions): Input;
    fieldset(opts: FieldsetOptions): Fieldset;
    datatable(opts: DataTableOptions): DataTable;
    datalist(opts: DataListOptions): DataList;
    menubar(opts: MenubarOptions): Menubar;
}

interface WidgetMake<T> extends WidgetOpts {
    with?: T;
}
declare function make<T>(opts: WidgetMake<T>): Widget & T;

type index_d$1_ActionConfig = ActionConfig;
type index_d$1_AddDialogOptions = AddDialogOptions;
type index_d$1_Border = Border;
declare const index_d$1_Border: typeof Border;
type index_d$1_BorderOptions = BorderOptions;
type index_d$1_BorderType = BorderType;
type index_d$1_Builder = Builder;
declare const index_d$1_Builder: typeof Builder;
type index_d$1_Button = Button;
declare const index_d$1_Button: typeof Button;
type index_d$1_ButtonConfig = ButtonConfig;
type index_d$1_ButtonOptions = ButtonOptions;
type index_d$1_Choice = Choice;
declare const index_d$1_Choice: typeof Choice;
type index_d$1_ChoiceOptions = ChoiceOptions;
type index_d$1_Column = Column;
declare const index_d$1_Column: typeof Column;
type index_d$1_ColumnOptions = ColumnOptions;
type index_d$1_DataItem = DataItem;
type index_d$1_DataList = DataList;
declare const index_d$1_DataList: typeof DataList;
type index_d$1_DataListOptions = DataListOptions;
type index_d$1_DataObject = DataObject;
type index_d$1_DataTable = DataTable;
declare const index_d$1_DataTable: typeof DataTable;
type index_d$1_DataTableOptions = DataTableOptions;
type index_d$1_DataType = DataType;
type index_d$1_DataValue = DataValue;
type index_d$1_Dialog = Dialog;
declare const index_d$1_Dialog: typeof Dialog;
type index_d$1_DialogOptions = DialogOptions;
type index_d$1_DropdownConfig = DropdownConfig;
type index_d$1_EventCb = EventCb;
type index_d$1_Field = Field;
declare const index_d$1_Field: typeof Field;
type index_d$1_FieldOptions = FieldOptions;
type index_d$1_Fieldset = Fieldset;
declare const index_d$1_Fieldset: typeof Fieldset;
type index_d$1_FieldsetOptions = FieldsetOptions;
type index_d$1_FormatFn = FormatFn;
type index_d$1_HoverType = HoverType;
type index_d$1_Input = Input;
declare const index_d$1_Input: typeof Input;
type index_d$1_InputOptions = InputOptions;
type index_d$1_Inquiry = Inquiry;
declare const index_d$1_Inquiry: typeof Inquiry;
type index_d$1_Menu = Menu;
declare const index_d$1_Menu: typeof Menu;
type index_d$1_MenuButton = MenuButton;
declare const index_d$1_MenuButton: typeof MenuButton;
type index_d$1_MenuButtonOptions = MenuButtonOptions;
type index_d$1_Menubar = Menubar;
declare const index_d$1_Menubar: typeof Menubar;
type index_d$1_MenubarOptions = MenubarOptions;
type index_d$1_NextType = NextType;
type index_d$1_OrderedList = OrderedList;
declare const index_d$1_OrderedList: typeof OrderedList;
type index_d$1_OrderedListOptions = OrderedListOptions;
type index_d$1_PadInfo = PadInfo;
type index_d$1_PrefixType = PrefixType;
type index_d$1_Prompt = Prompt;
declare const index_d$1_Prompt: typeof Prompt;
type index_d$1_PromptChoice = PromptChoice;
type index_d$1_PromptOptions = PromptOptions;
type index_d$1_PropType = PropType;
type index_d$1_Rec<T> = Rec<T>;
type index_d$1_Select = Select;
declare const index_d$1_Select: typeof Select;
type index_d$1_SelectOptions = SelectOptions;
type index_d$1_SelectType = SelectType;
type index_d$1_SetParentOptions = SetParentOptions;
type index_d$1_Text = Text;
declare const index_d$1_Text: typeof Text;
type index_d$1_TextOptions = TextOptions;
type index_d$1_UnorderedList = UnorderedList;
declare const index_d$1_UnorderedList: typeof UnorderedList;
type index_d$1_UnorderedListOptions = UnorderedListOptions;
type index_d$1_UpdatePosOpts = UpdatePosOpts;
type index_d$1_Widget = Widget;
declare const index_d$1_Widget: typeof Widget;
type index_d$1_WidgetMake<T> = WidgetMake<T>;
type index_d$1_WidgetOpts = WidgetOpts;
declare const index_d$1_alignChildren: typeof alignChildren;
declare const index_d$1_dialog: typeof dialog;
declare const index_d$1_drawBorder: typeof drawBorder;
declare const index_d$1_make: typeof make;
declare const index_d$1_spaceChildren: typeof spaceChildren;
declare const index_d$1_toPadArray: typeof toPadArray;
declare const index_d$1_wrapChildren: typeof wrapChildren;
declare namespace index_d$1 {
  export { type index_d$1_ActionConfig as ActionConfig, type index_d$1_AddDialogOptions as AddDialogOptions, index_d$1_Border as Border, type index_d$1_BorderOptions as BorderOptions, type index_d$1_BorderType as BorderType, index_d$1_Builder as Builder, index_d$1_Button as Button, type index_d$1_ButtonConfig as ButtonConfig, type index_d$1_ButtonOptions as ButtonOptions, index_d$1_Choice as Choice, type index_d$1_ChoiceOptions as ChoiceOptions, index_d$1_Column as Column, type index_d$1_ColumnOptions as ColumnOptions, type index_d$1_DataItem as DataItem, index_d$1_DataList as DataList, type index_d$1_DataListOptions as DataListOptions, type index_d$1_DataObject as DataObject, index_d$1_DataTable as DataTable, type index_d$1_DataTableOptions as DataTableOptions, type index_d$1_DataType as DataType, type index_d$1_DataValue as DataValue, index_d$1_Dialog as Dialog, type index_d$1_DialogOptions as DialogOptions, type index_d$1_DropdownConfig as DropdownConfig, type index_d$1_EventCb as EventCb, index_d$1_Field as Field, type index_d$1_FieldOptions as FieldOptions, index_d$1_Fieldset as Fieldset, type index_d$1_FieldsetOptions as FieldsetOptions, type index_d$1_FormatFn as FormatFn, type index_d$1_HoverType as HoverType, index_d$1_Input as Input, type index_d$1_InputOptions as InputOptions, index_d$1_Inquiry as Inquiry, index_d$1_Menu as Menu, index_d$1_MenuButton as MenuButton, type index_d$1_MenuButtonOptions as MenuButtonOptions, type MenuOptions$1 as MenuOptions, index_d$1_Menubar as Menubar, type index_d$1_MenubarOptions as MenubarOptions, type index_d$1_NextType as NextType, index_d$1_OrderedList as OrderedList, type index_d$1_OrderedListOptions as OrderedListOptions, type index_d$1_PadInfo as PadInfo, type index_d$1_PrefixType as PrefixType, index_d$1_Prompt as Prompt, type index_d$1_PromptChoice as PromptChoice, type index_d$1_PromptOptions as PromptOptions, type index_d$1_PropType as PropType, type index_d$1_Rec as Rec, index_d$1_Select as Select, type index_d$1_SelectOptions as SelectOptions, type index_d$1_SelectType as SelectType, type index_d$1_SetParentOptions as SetParentOptions, index_d$1_Text as Text, type index_d$1_TextOptions as TextOptions, index_d$1_UnorderedList as UnorderedList, type index_d$1_UnorderedListOptions as UnorderedListOptions, type index_d$1_UpdatePosOpts as UpdatePosOpts, index_d$1_Widget as Widget, type index_d$1_WidgetMake as WidgetMake, type index_d$1_WidgetOpts as WidgetOpts, index_d$1_alignChildren as alignChildren, index_d$1_dialog as dialog, index_d$1_drawBorder as drawBorder, index_d$1_make as make, index_d$1_spaceChildren as spaceChildren, index_d$1_toPadArray as toPadArray, index_d$1_wrapChildren as wrapChildren };
}

interface MenuOptions {
    menu: Menu;
    origin: Scene;
}
declare const MenuScene: {
    create(this: Scene): void;
    start(this: Scene, data: MenuOptions): void;
    stop(this: Scene): void;
};

type index_d_AlertOptions = AlertOptions;
declare const index_d_AlertScene: typeof AlertScene;
type index_d_ConfirmOptions = ConfirmOptions;
declare const index_d_ConfirmScene: typeof ConfirmScene;
type index_d_MenuOptions = MenuOptions;
declare const index_d_MenuScene: typeof MenuScene;
declare const index_d_PromptScene: typeof PromptScene;
declare namespace index_d {
  export { type index_d_AlertOptions as AlertOptions, index_d_AlertScene as AlertScene, type index_d_ConfirmOptions as ConfirmOptions, index_d_ConfirmScene as ConfirmScene, type index_d_MenuOptions as MenuOptions, index_d_MenuScene as MenuScene, type PromptOptions$1 as PromptOptions, index_d_PromptScene as PromptScene };
}

export { App, BaseObj, type EasingFn, type InterpolateFn, Tween, type TweenCb, type TweenFinishCb, type TweenUpdate, index_d$2 as app, interpolate, linear, make$1 as make, move, index_d as scenes, index_d$1 as widgets };
