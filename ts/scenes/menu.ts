// import * as Color from '../color';

import { Scene } from '../app/scene.js';
import { installScene } from '../app/scenes.js';
import { Menu } from '../widgets/menu.js';

export interface MenuOptions {
    menu: Menu;
    origin: Scene;
}

export const MenuScene = {
    create(this: Scene) {
        this.on('click', () => {
            this.stop();
        });
        this.on('Escape', () => {
            this.stop();
        });
    },

    start(this: Scene, data: MenuOptions) {
        if (!data.menu) throw new Error('Must supply a menu to show!');
        this.addChild(data.menu);
        this.events.onUnhandled = (ev: string, ...args: any[]) => {
            data.origin.emit(ev, ...args);
        };
    },

    stop(this: Scene) {
        this.children = [];
    },
};

installScene('menu', MenuScene);
