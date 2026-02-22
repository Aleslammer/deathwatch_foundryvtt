// Import document classes.
import { DeathwatchActor } from "./documents/actor.mjs";
import { DeathwatchItem } from "./documents/item.mjs";
// Import sheet classes.
import { DeathwatchActorSheet } from "./sheets/actor-sheet.mjs";
import { DeathwatchItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { DWConfig } from "./helpers/config.mjs";
import { initializeHandlebars } from "./helpers/handlebars.js";


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {

    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.deathwatch = {
        DeathwatchActor,
        DeathwatchItem,
        rollItemMacro
    };

    // Add custom constants for configuration.
    game.deathwatch.config = DWConfig;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d10 + @agBonus + @initiativeBonus",
        decimals: 2
    };

    // Define custom Document classes
    CONFIG.Actor.documentClass = DeathwatchActor;
    CONFIG.Item.documentClass = DeathwatchItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("deathwatch", DeathwatchActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("deathwatch", DeathwatchItemSheet, { makeDefault: true });
    initializeHandlebars();

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});

Hooks.once('ready', async function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
    
    // Create or update Scatter table
    if (game.user.isGM) {
        let table = game.tables.getName("Scatter");
        const needsUpdate = !table || table.results.size !== 8;
        
        if (needsUpdate) {
            if (table) await table.delete();
            
            table = await RollTable.create({
                name: "Scatter",
                formula: "1d10",
                replacement: true,
                displayRoll: false
            });
            
            await table.createEmbeddedDocuments("TableResult", [
                { type: 0, text: "Upper Left", weight: 1, range: [1, 1] },
                { type: 0, text: "Up", weight: 1, range: [2, 2] },
                { type: 0, text: "Upper Right", weight: 1, range: [3, 3] },
                { type: 0, text: "Left", weight: 1, range: [4, 4] },
                { type: 0, text: "Right", weight: 1, range: [5, 5] },
                { type: 0, text: "Lower Left", weight: 2, range: [6, 7] },
                { type: 0, text: "Down", weight: 1, range: [8, 8] },
                { type: 0, text: "Lower Right", weight: 2, range: [9, 10] }
            ]);
        }
    }
});


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
    // First, determine if this is a valid owned item.
    if (data.type !== "Item") return;
    if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
        return ui.notifications.warn("You can only create macro buttons for owned Items");
    }
    // If it is, retrieve it based on the uuid.
    const item = await Item.fromDropData(data);

    // Create the macro command using the uuid.
    const command = `game.deathwatch.rollItemMacro("${data.uuid}");`;
    let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "deathwatch.itemMacro": true }
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
    // Reconstruct the drop data so that we can load the item.
    const dropData = {
        type: 'Item',
        uuid: itemUuid
    };
    // Load the item from the uuid.
    Item.fromDropData(dropData).then(item => {
        // Determine if the item loaded and if it's an owned item.
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
        }

        // Trigger the item roll
        item.roll();
    });
}