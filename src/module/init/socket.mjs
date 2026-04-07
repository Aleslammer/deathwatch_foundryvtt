import { CohesionPanel } from "../ui/cohesion-panel.mjs";
import { ModeHelper } from "../helpers/mode-helper.mjs";

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
}
