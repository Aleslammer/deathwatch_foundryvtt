import { COHESION } from './constants.mjs';

/**
 * Static helper class for Kill-team Cohesion calculations.
 * Pure functions — no Foundry API calls unless explicitly noted.
 */
export class CohesionHelper {

  /**
   * Calculate the Cohesion pool maximum.
   * @param {number} fellowshipValue - Squad leader's computed fs.value
   * @param {number} rank - Squad leader's current rank (1–8)
   * @param {Object} commandSkill - { trained, mastered, expert } booleans
   * @param {number} [gmModifier=0] - GM-set modifier from world setting
   * @returns {number}
   */
  static calculateCohesionMax(fellowshipValue, rank, commandSkill, gmModifier = 0) {
    const fsBonus = Math.floor(fellowshipValue / 10);
    const rankMod = CohesionHelper.getRankModifier(rank);
    const commandMod = CohesionHelper.getCommandModifier(commandSkill);
    return Math.max(0, fsBonus + rankMod + commandMod + gmModifier);
  }

  /**
   * Get rank modifier for Cohesion.
   * Rank 0–3: +0, Rank 4–5: +1, Rank 6+: +2
   * @param {number} rank
   * @returns {number}
   */
  static getRankModifier(rank) {
    if (rank >= COHESION.RANK_THRESHOLD_HIGH) return COHESION.RANK_BONUS_HIGH;
    if (rank >= COHESION.RANK_THRESHOLD_MID) return COHESION.RANK_BONUS_MID;
    return 0;
  }

  /**
   * Get Command skill modifier for Cohesion. Only the highest tier applies.
   * @param {Object} commandSkill - { trained, mastered, expert } booleans
   * @returns {number}
   */
  static getCommandModifier(commandSkill) {
    if (!commandSkill) return 0;
    if (commandSkill.expert) return COHESION.COMMAND_EXPERT;
    if (commandSkill.mastered) return COHESION.COMMAND_MASTERED;
    if (commandSkill.trained) return COHESION.COMMAND_TRAINED;
    return 0;
  }

  /**
   * Convenience wrapper that extracts values from a live actor.
   * @param {Object} actor - Actor document
   * @param {number} [gmModifier=0] - GM-set modifier
   * @returns {number}
   */
  static calculateCohesionMaxFromActor(actor, gmModifier = 0) {
    if (!actor || actor.type !== 'character') return 0;
    const fs = actor.system.characteristics?.fs?.value || 0;
    const rank = actor.system.rank || 1;
    const commandSkill = actor.system.skills?.command || {};
    return CohesionHelper.calculateCohesionMax(fs, rank, commandSkill, gmModifier);
  }

  /**
   * Build a human-readable breakdown string for the Cohesion max tooltip.
   * @param {Object|null} leader - Squad leader actor (or null)
   * @param {number} [gmModifier=0] - GM modifier
   * @returns {string}
   */
  static buildCohesionBreakdown(leader, gmModifier = 0) {
    if (!leader || leader.type !== 'character') return 'No squad leader assigned';
    const fs = leader.system.characteristics?.fs?.value || 0;
    const fsBonus = Math.floor(fs / 10);
    const rankMod = CohesionHelper.getRankModifier(leader.system.rank || 1);
    const commandMod = CohesionHelper.getCommandModifier(leader.system.skills?.command || {});
    const total = Math.max(0, fsBonus + rankMod + commandMod + gmModifier);
    const parts = [`FS Bonus: ${fsBonus}`];
    if (rankMod !== 0) parts.push(`Rank: +${rankMod}`);
    if (commandMod !== 0) parts.push(`Command: +${commandMod}`);
    if (gmModifier !== 0) parts.push(`GM Modifier: ${gmModifier >= 0 ? '+' : ''}${gmModifier}`);
    parts.push(`= ${total}`);
    return parts.join('\n');
  }

  /* -------------------------------------------- */
  /*  Cohesion Challenge (Phase 5 preview)        */
  /* -------------------------------------------- */

  /**
   * Resolve a Cohesion Challenge. Pure function.
   * @param {number} currentCohesion
   * @param {number} roll - 1d10 result
   * @returns {{success: boolean, roll: number, target: number}}
   */
  static resolveCohesionChallenge(currentCohesion, roll) {
    return { success: roll <= currentCohesion, roll, target: currentCohesion };
  }

  /**
   * Roll a Cohesion Challenge and post result to chat.
   * Non-pure — uses Foundry Roll and ChatMessage.
   * @param {Object} actor - Actor making the challenge
   */
  static async rollCohesionChallenge(actor) {
    const cohesion = game.settings.get('deathwatch', 'cohesion');
    const roll = await new Roll('1d10').evaluate();
    const result = CohesionHelper.resolveCohesionChallenge(cohesion.value, roll.total);
    const status = result.success
      ? '<strong style="color: green;">✓ PASSED</strong>'
      : '<strong style="color: red;">✗ FAILED</strong>';
    const flavor = `<strong>Cohesion Challenge — ${actor.name}</strong><br>Rolled ${result.roll} vs Cohesion ${result.target}<br>${status}`;
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor
    });
    return result;
  }
}
