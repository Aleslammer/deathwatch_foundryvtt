/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([

    // Actor partials.
    "systems/deathwatch/templates/actor/parts/actor-skills.html",
    "systems/deathwatch/templates/actor/parts/actor-items.html",
    "systems/deathwatch/templates/actor/parts/actor-spells.html",
    "systems/deathwatch/templates/actor/parts/actor-effects.html",
    "systems/deathwatch/templates/actor/parts/actor-armor.html",
    "systems/deathwatch/templates/actor/parts/item-controls.html",
    "systems/deathwatch/templates/actor/parts/item-equipped.html",
    "systems/deathwatch/templates/actor/parts/item-image.html",

    // Item sheets.
    "systems/deathwatch/templates/item/item-weapon-sheet.html",
    "systems/deathwatch/templates/item/item-armor-sheet.html",
    "systems/deathwatch/templates/item/item-gear-sheet.html",
    "systems/deathwatch/templates/item/item-ammunition-sheet.html",
    "systems/deathwatch/templates/item/item-talent-sheet.html",
    "systems/deathwatch/templates/item/item-trait-sheet.html",
    "systems/deathwatch/templates/item/item-weapon-quality-sheet.html",
    "systems/deathwatch/templates/item/item-chapter-sheet.html",
    "systems/deathwatch/templates/item/item-armor-history-sheet.html",
    "systems/deathwatch/templates/item/item-implant-sheet.html",
    "systems/deathwatch/templates/item/item-cybernetic-sheet.html",
    "systems/deathwatch/templates/item/item-demeanour-sheet.html",
    "systems/deathwatch/templates/item/item-specialty-sheet.html",
    "systems/deathwatch/templates/item/item-characteristic-sheet.html",
    "systems/deathwatch/templates/item/item-characteristic-advance-sheet.html",
    "systems/deathwatch/templates/item/item-critical-effect-sheet.html",
  ]);
};
