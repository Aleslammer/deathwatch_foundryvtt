import { DWConfig } from "./common/config.js";
import { DeathwatchItemSheet } from "./item/sheet/item-sheet.js";
import { initializeHandlebars } from "./common/handlebars.js";

Hooks.once("init", () => {
    game.dw = {};
    game.dw.config = DWConfig;

    console.log("deathwatch | initialization");

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("deathwatch", DeathwatchItemSheet, { makeDefault: true });
    initializeHandlebars();
});
