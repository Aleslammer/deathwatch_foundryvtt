import { createItemMacro } from "../macros/hotbar.mjs";

/**
 * Handles initialization that must occur on the 'ready' hook.
 */
export class ReadyHook {
  /**
   * Initialize ready hook handlers
   */
  static async initialize() {
    await this._registerHotbarHook();
    await this._configureCombatTracker();
    await this._createSystemMacros();
  }

  /**
   * Register hotbar drop handler
   */
  static async _registerHotbarHook() {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => {
      if (data.type === "Item") {
        createItemMacro(data, slot);
        return false;
      }
    });
  }

  /**
   * Configure Combat Tracker defaults
   */
  static async _configureCombatTracker() {
    // Set Skip Defeated default on first load (respects manual changes after)
    if (game.user.isGM) {
      const config = game.settings.get("core", "combatTrackerConfig") || {};
      if (config.skipDefeated === undefined) {
        await game.settings.set("core", "combatTrackerConfig", { ...config, skipDefeated: true });
      }
    }
  }

  /**
   * Auto-create system macros for GM
   */
  static async _createSystemMacros() {
    if (!game.user.isGM) return;

    // Auto-create Flame Attack macro for GM
    const flameMacroCommand = 'game.deathwatch.flameAttack();';
    const existingFlame = game.macros.find(m => m.name === '🔥 Flame Attack' && m.command === flameMacroCommand);
    if (!existingFlame) {
      await Macro.create({
        name: '🔥 Flame Attack',
        type: 'script',
        img: 'icons/svg/fire.svg',
        command: flameMacroCommand,
        flags: { 'deathwatch.systemMacro': true }
      });
    }

    // Auto-create On Fire macro for GM
    const onFireMacroCommand = 'const t = game.user.targets.first()?.actor; if (t) game.deathwatch.applyOnFireEffects(t); else ui.notifications.warn("Target a token first.");';
    const existingOnFire = game.macros.find(m => m.name === '🔥 On Fire Round' && m.flags?.deathwatch?.systemMacro);
    if (!existingOnFire) {
      await Macro.create({
        name: '🔥 On Fire Round',
        type: 'script',
        img: 'icons/svg/fire.svg',
        command: onFireMacroCommand,
        flags: { 'deathwatch.systemMacro': true }
      });
    }
  }
}
