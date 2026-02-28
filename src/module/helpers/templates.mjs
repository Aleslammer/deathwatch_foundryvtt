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
  ]);
};
