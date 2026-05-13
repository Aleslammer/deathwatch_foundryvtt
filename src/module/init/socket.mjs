import { CohesionPanel } from "../ui/cohesion-panel.mjs";
import { ModeHelper } from "../helpers/mode-helper.mjs";
import { HordeBreakingHelper } from "../helpers/combat/horde-breaking.mjs";
import { handleFlameDodgePrompt } from "../macros/flame-attack.mjs";

/**
 * Handles socket communication for player-initiated world setting changes.
 */
export class SocketHandler {
  /**
   * Initialize socket communication
   */
  static initialize() {
    // Register socket namespace
    if (game.deathwatch) {
      game.deathwatch.socket = `system.deathwatch`;
    }

    // Register socket listener
    this._registerSocketListener();

    // Register hooks for settings changes
    this._registerSettingsHooks();

    // Register hooks for actor updates
    this._registerActorUpdateHooks();

    // Register hooks for horde breaking checks
    this._registerHordeBreakingHooks();
  }

  /**
   * Listen for socket messages (GM processes player requests)
   */
  static _registerSocketListener() {
    game.socket.on('system.deathwatch', async (data) => {
      if (data.type === 'activateSquadAbility' && game.user.isGM) {
        const actor = game.actors.get(data.actorId);
        const ability = actor?.items.get(data.abilityId);
        if (actor && ability) {
          await CohesionPanel.activateSquadAbility(actor, ability);
        }
      }

      if (data.type === 'deactivateSquadAbility' && game.user.isGM) {
        const active = game.settings.get('deathwatch', 'activeSquadAbilities') || [];
        if (data.index >= 0 && data.index < active.length) {
          const removed = active[data.index];
          active.splice(data.index, 1);
          await game.settings.set('deathwatch', 'activeSquadAbilities', active);
          await ChatMessage.create({ content: ModeHelper.buildDeactivationMessage(removed.abilityName) });
        }
      }

      if (data.type === 'applyActorDamage' && game.user.isGM) {
        const actor = game.actors.get(data.actorId);
        if (actor) {
          await actor.system.receiveDamage(data.damageOptions);
        }
      }

      if (data.type === 'applyHordeBatchDamage' && game.user.isGM) {
        const actor = game.actors.get(data.actorId);
        if (actor && actor.type === 'horde') {
          await actor.system.receiveBatchDamage(data.hits);
        }
      }

      if (data.type === 'flameDodgePrompt' && game.user.isGM) {
        await handleFlameDodgePrompt(data);
      }
    });
  }

  /**
   * Re-render Cohesion panel when settings change
   */
  static _registerSettingsHooks() {
    Hooks.on('updateSetting', (setting) => {
      // Re-render panel on cohesion-related settings changes
      if (['deathwatch.cohesion', 'deathwatch.squadLeader', 'deathwatch.cohesionModifier', 'deathwatch.activeSquadAbilities'].includes(setting.key)) {
        const panel = CohesionPanel.getInstance();
        if (panel.rendered) panel.render(false);
      }

      // Auto-drop to Solo Mode when cohesion reaches zero
      if (setting.key === 'deathwatch.cohesion' && game.user.isGM) {
        const cohesion = game.settings.get('deathwatch', 'cohesion');
        if (cohesion.value <= 0) {
          CohesionPanel.dropAllToSoloMode();
        }
      }
    });
  }

  /**
   * Re-render Cohesion panel when a character's mode changes
   */
  static _registerActorUpdateHooks() {
    Hooks.on('updateActor', (actor, changes) => {
      if (actor.type === 'character' && changes.system?.mode !== undefined) {
        const panel = CohesionPanel.getInstance();
        if (panel.rendered) panel.render(false);
      }
    });
  }

  /**
   * Check for horde breaking at start of horde's turn (GM only)
   */
  static _registerHordeBreakingHooks() {
    Hooks.on('updateCombat', async (combat, changed, options, userId) => {
      // Only GM processes horde breaking checks
      if (!game.user.isGM) return;

      // Only check when turn changes (not round changes or other updates)
      if (!("turn" in changed)) return;

      const combatant = combat.combatants.get(combat.current.combatantId);
      if (!combatant?.actor || combatant.actor.type !== 'horde') return;

      const actor = combatant.actor;
      const checkResult = await HordeBreakingHelper.checkBreaking(actor);

      if (checkResult.shouldCheck) {
        if (checkResult.autoBreaks) {
          // Auto-break (magnitude < 25%)
          await HordeBreakingHelper.applyBroken(actor, true);
        } else if (checkResult.needsTest) {
          // Prompt WP test
          await HordeBreakingHelper.promptBreakingTest(actor, checkResult);
        }
      }

      // Reset counter for new turn
      await HordeBreakingHelper.resetTurnCounter(actor);
    });
  }
}
