// Import document classes.
import { DeathwatchActor } from "./documents/actor.mjs";
import { DeathwatchItem } from "./documents/item.mjs";
// Import sheet classes.
import { DeathwatchActorSheet } from "./sheets/actor-sheet.mjs";
import { DeathwatchActorSheetV2 } from "./sheets/actor-sheet-v2.mjs";
import { DeathwatchItemSheet } from "./sheets/item-sheet.mjs";
import { DeathwatchItemSheetV2 } from "./sheets/item-sheet-v2.mjs";
// Import initialization modules.
import { SettingsRegistrar } from "./init/settings.mjs";
import { ConfigRegistrar } from "./init/config.mjs";
import { InitHooks } from "./init/hooks.mjs";
import { SocketHandler } from "./init/socket.mjs";
import { ReadyHook } from "./init/ready-hook.mjs";
import { ChatButtonHandlers } from "./chat/button-handlers.mjs";
// Import helper/utility classes.
import { preloadHandlebarsTemplates } from "./helpers/ui/templates.mjs";
import { DWConfig } from "./helpers/config.mjs";
import { initializeHandlebars } from "./helpers/ui/handlebars.js";
import { SkillLoader } from "./helpers/character/skill-loader.mjs";
import { CohesionHelper } from "./helpers/cohesion.mjs";
import { CohesionPanel } from "./ui/cohesion-panel.mjs";
// Import macros.
import { applyOnFireEffects } from "./macros/on-fire-effects.mjs";
import { flameAttack } from "./macros/flame-attack.mjs";
import { rollItemMacro } from "./macros/hotbar.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {
  console.log('Deathwatch | Initializing system');

  // Load skill definitions
  await SkillLoader.init();

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.deathwatch = {
    DeathwatchActor,
    DeathwatchItem,
    rollItemMacro,        // From macros/hotbar.mjs
    flameAttack,          // From macros/flame-attack.mjs
    applyOnFireEffects,   // From macros/on-fire-effects.mjs
    CohesionHelper,
    CohesionPanel
  };

  // Add custom constants for configuration.
  game.deathwatch.config = DWConfig;

  // Register world and client settings
  SettingsRegistrar.register();

  // Configure Foundry CONFIG object
  ConfigRegistrar.configure();

  // Register runtime hooks
  InitHooks.register();

  // Register sheet application classes
  const useV2 = game.settings.get('deathwatch', 'useV2Sheets');
  const ActorSheetClass = useV2 ? DeathwatchActorSheetV2 : DeathwatchActorSheet;
  const ItemSheetClass = useV2 ? DeathwatchItemSheetV2 : DeathwatchItemSheet;
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("deathwatch", ActorSheetClass, { makeDefault: true });
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("deathwatch", ItemSheetClass, { makeDefault: true });

  // Initialize Handlebars
  initializeHandlebars();

  // Preload Handlebars templates
  await preloadHandlebarsTemplates();

  console.log('Deathwatch | Initialization complete');
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
  console.log('Deathwatch | System ready');

  // Initialize socket communication
  SocketHandler.initialize();

  // Register chat button handlers
  ChatButtonHandlers.register();

  // Initialize ready hook handlers (hotbar, combat tracker, system macros)
  await ReadyHook.initialize();

  console.log('Deathwatch | Ready');
});
