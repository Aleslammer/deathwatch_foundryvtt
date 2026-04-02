import { MODES, MODE_LABELS } from './constants.mjs';

/**
 * Static helper class for Solo/Squad Mode logic.
 * Pure functions — no Foundry API calls.
 */
export class ModeHelper {

  /**
   * Check if a character can enter Squad Mode.
   * Requires Cohesion >= 1.
   * @param {number} cohesionValue - Current Cohesion pool value
   * @returns {boolean}
   */
  static canEnterSquadMode(cohesionValue) {
    return cohesionValue >= 1;
  }

  /**
   * Get display label for a mode.
   * @param {string} mode - "solo" or "squad"
   * @returns {string}
   */
  static getModeLabel(mode) {
    return MODE_LABELS[mode] || MODE_LABELS[MODES.SOLO];
  }

  /**
   * Build a chat message HTML string for a mode change.
   * @param {string} actorName
   * @param {string} newMode - "solo" or "squad"
   * @returns {string}
   */
  static buildModeChangeMessage(actorName, newMode) {
    if (newMode === MODES.SQUAD) {
      return `<div class="cohesion-chat">🔵 <strong>${actorName}</strong> enters Squad Mode</div>`;
    }
    return `<div class="cohesion-chat">🟢 <strong>${actorName}</strong> returns to Solo Mode</div>`;
  }

  /**
   * Build a chat message for when all characters are forced to Solo Mode.
   * @returns {string}
   */
  static buildCohesionDepletedMessage() {
    return `<div class="cohesion-chat">⚔ <strong>Cohesion depleted</strong> — all Battle-Brothers return to Solo Mode</div>`;
  }
}
