import { DeathwatchItemSheet } from "./item/sheet/item-sheet.js";

Hooks.once("init", () => {
    console.log("deathwatch | initialization");
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("deathwatch", DeathwatchItemSheet, { makeDefault: true });
});
