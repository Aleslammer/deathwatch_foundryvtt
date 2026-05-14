/**
 * RollHandler for Token Action HUD integration
 * Executes actions by delegating to existing methods.
 *
 * @module token-action-hud/roll-handler
 */

import { RollExecutor } from '../helpers/roll-executor.mjs';
import { CombatHelper } from '../helpers/combat/combat.mjs';
import { CHARACTERISTIC_LABELS } from '../helpers/constants/characteristic-constants.mjs';

export let RollHandler = null;

/**
 * Initialize RollHandler after TAH Core API is ready
 * @param {Object} coreModule - TAH Core module with API
 */
export function initializeRollHandler(coreModule) {
  RollHandler = class RollHandler extends coreModule.api.RollHandler {
    /**
     * Handle action execution
     * @param {Object} actionData - Action data from TAH Core
     * @param {string} actionData.actionId - Action identifier
     * @param {string} actionData.encodedValue - Encoded action value (e.g., "weapon|abc123|attack")
     */
    async handleActionClick(event, encodedValue) {
      console.log('[TAH RollHandler] handleActionClick called');
      console.log('[TAH RollHandler] event:', event);
      console.log('[TAH RollHandler] encodedValue:', encodedValue);
      console.log('[TAH RollHandler] this.actor:', this.actor);

      // Check permissions
      const hasPermission =
        game.user.isGM || this.actor.testUserPermission(game.user, 'OWNER');

      console.log('[TAH RollHandler] hasPermission:', hasPermission);

      if (!hasPermission) {
        console.log('[TAH RollHandler] Routing through socket');
        // Route through socket - GM will execute
        game.socket.emit('system.deathwatch', {
          type: 'tah-action',
          actorId: this.actor.id,
          encodedValue,
        });
        return;
      }

      // Decode action and execute
      console.log('[TAH RollHandler] Executing action directly');
      await this._executeAction(encodedValue);
    }

    /**
     * Execute action based on encoded value
     * @param {string} encodedValue - Encoded action value
     * @private
     */
    async _executeAction(encodedValue) {
      console.log('[TAH RollHandler] _executeAction called with:', encodedValue);

      // Guard against null/undefined encodedValue (e.g., clicking weapon parent group)
      if (!encodedValue) {
        console.log('[TAH RollHandler] No encodedValue provided, ignoring click');
        return;
      }

      const [type, id, subaction] = encodedValue.split('|');
      console.log('[TAH RollHandler] Decoded - type:', type, 'id:', id, 'subaction:', subaction);

      switch (type) {
        case 'weapon':
          await this._handleWeaponAction(id, subaction);
          break;

        case 'skill':
          await this._handleSkillAction(id);
          break;

        case 'characteristic':
          await this._handleCharacteristicAction(id);
          break;

        default:
          ui.notifications.warn(`Unknown action type: ${type}`);
      }
    }

    /**
     * Handle weapon action
     * @param {string} weaponId - Weapon item ID
     * @param {string} subaction - Subaction (attack/damage)
     * @private
     */
    async _handleWeaponAction(weaponId, subaction) {
      const weapon = this.actor.items.get(weaponId);

      if (!weapon) {
        ui.notifications.warn(`Weapon not found: ${weaponId}`);
        return;
      }

      switch (subaction) {
        case 'attack':
          // Delegate to existing method
          await CombatHelper.weaponAttackDialog(this.actor, weapon);
          break;

        case 'damage':
          // Delegate to existing damage roll method
          await CombatHelper.weaponDamageRoll(this.actor, weapon);
          break;

        default:
          ui.notifications.warn(`Unknown weapon subaction: ${subaction}`);
      }
    }

    /**
     * Handle skill action
     * @param {string} skillKey - Skill key (e.g., "awareness")
     * @private
     */
    async _handleSkillAction(skillKey) {
      const skill = this.actor.system.skills?.[skillKey];

      if (!skill) {
        ui.notifications.warn(`Skill not found: ${skillKey}`);
        return;
      }

      // Delegate to existing method
      await RollExecutor.showSkillDialog(this.actor, skill, skill.label, skill.total);
    }

    /**
     * Handle characteristic action
     * @param {string} charKey - Characteristic key (e.g., "weaponSkill")
     * @private
     */
    async _handleCharacteristicAction(charKey) {
      console.log('[TAH RollHandler] Looking up characteristic:', charKey);
      console.log('[TAH RollHandler] Available characteristics:', Object.keys(this.actor.system.characteristics));
      console.log('[TAH RollHandler] Full characteristics object:', this.actor.system.characteristics);

      const characteristic = this.actor.system.characteristics[charKey];

      if (!characteristic) {
        ui.notifications.warn(`Characteristic not found: ${charKey}`);
        return;
      }

      // Convert key to label (e.g., "weaponSkill" -> "Weapon Skill")
      const label = this._charKeyToLabel(charKey);

      // Delegate to existing method
      await RollExecutor.showCharacteristicDialog(this.actor, charKey, label, characteristic);
    }

    /**
     * Convert characteristic key to label
     * @param {string} key - Characteristic key (e.g., "ws")
     * @returns {string} Label (e.g., "Weapon Skill")
     * @private
     */
    _charKeyToLabel(key) {
      return CHARACTERISTIC_LABELS[key] || key;
    }
  };
}
