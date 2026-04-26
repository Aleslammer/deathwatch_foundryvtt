import { RollExecutor } from "../helpers/roll-executor.mjs";
import { Logger } from "../helpers/logger.mjs";

/**
 * Difficulty presets for skill tests.
 * @enum {number}
 */
const DIFFICULTY = {
  'Trivial': 60,
  'Easy': 30,
  'Routine': 20,
  'Ordinary': 10,
  'Challenging': 0,
  'Difficult': -10,
  'Hard': -20,
  'Very Hard': -30,
  'Arduous': -40,
  'Punishing': -50,
  'Hellish': -60
};

/**
 * Public API for rolling skill tests programmatically from macros.
 *
 * Allows macro authors to trigger skill tests with optional pre-configured
 * modifiers, either showing the dialog or rolling directly.
 *
 * @example
 * // Roll with dialog (user can adjust modifiers)
 * await game.deathwatch.rollSkill('actor123', 'dodge');
 *
 * @example
 * // Roll directly with modifiers (skip dialog)
 * await game.deathwatch.rollSkill('actor123', 'dodge', {
 *   modifier: 10,
 *   difficulty: 'Easy',
 *   skipDialog: true
 * });
 *
 * @example
 * // Show dialog with pre-filled modifiers
 * await game.deathwatch.rollSkill('actor123', 'awareness', {
 *   modifier: 20,
 *   difficulty: 'Challenging'
 * });
 */
export class SkillRoller {

  /**
   * Roll a skill test for an actor.
   *
   * @param {string} actorId - Actor ID (use actor.id or actor._id)
   * @param {string} skillName - Skill key or label (e.g., 'dodge', 'awareness', 'command')
   * @param {Object} [options={}] - Roll options
   * @param {number} [options.modifier=0] - Additional modifier to apply
   * @param {string|number} [options.difficulty='Challenging'] - Difficulty name or numeric modifier
   * @param {boolean} [options.skipDialog=false] - If true, roll immediately without showing dialog
   * @returns {Promise<Roll|null>} The rolled result, or null if canceled/failed
   *
   * @example
   * // Basic roll with dialog
   * await game.deathwatch.rollSkill('actor123', 'dodge');
   *
   * @example
   * // Direct roll with +10 modifier
   * await game.deathwatch.rollSkill('actor123', 'dodge', {
   *   modifier: 10,
   *   skipDialog: true
   * });
   *
   * @example
   * // Roll with difficulty preset
   * await game.deathwatch.rollSkill('actor123', 'awareness', {
   *   difficulty: 'Hard',  // -20 modifier
   *   skipDialog: true
   * });
   */
  static async rollSkill(actorId, skillName, options = {}) {
    // Validate inputs
    const actor = game.actors.get(actorId);
    if (!actor) {
      Logger.category('CHARACTER.SKILLS').error(`Actor not found: ${actorId}`);
      ui.notifications.error(`Actor not found: ${actorId}`);
      return null;
    }

    if (!skillName || typeof skillName !== 'string') {
      Logger.category('CHARACTER.SKILLS').error('Skill name must be a non-empty string');
      ui.notifications.error('Skill name must be provided');
      return null;
    }

    // Find skill by key or label (case-insensitive)
    const skills = actor.system.skills || {};
    const skillKey = this._findSkillKey(skills, skillName);

    if (!skillKey) {
      Logger.category('CHARACTER.SKILLS').error(`Skill not found: ${skillName}`);
      ui.notifications.error(`Skill "${skillName}" not found on actor ${actor.name}`);
      return null;
    }

    const skill = skills[skillKey];
    const label = skill.label || skillKey;

    // Validate skill can be used
    if (!skill.isBasic && !skill.trained) {
      Logger.category('CHARACTER.SKILLS').warn(`Skill ${label} is untrained advanced skill`);
      ui.notifications.warn(`${label} is an advanced skill and must be trained to use.`);
      return null;
    }

    // Parse options
    const {
      modifier = 0,
      difficulty = 'Challenging',
      skipDialog = false
    } = options;

    // Calculate base target number
    const characteristic = actor.system.characteristics[skill.characteristic];
    const baseCharValue = characteristic ? characteristic.value : 0;
    const effectiveChar = skill.trained ? baseCharValue : Math.floor(baseCharValue / 2);
    const skillBonus = skill.expert ? 20 : (skill.mastered ? 10 : 0);
    const skillTotal = effectiveChar + skillBonus + (skill.modifier || 0) + (skill.modifierTotal || 0);

    // Parse difficulty modifier
    const difficultyModifier = this._parseDifficulty(difficulty);

    Logger.category('CHARACTER.SKILLS').debug(`Rolling ${label} for ${actor.name}`, {
      skillTotal,
      modifier,
      difficultyModifier,
      skipDialog
    });

    // Roll immediately if skipDialog is true
    if (skipDialog) {
      const modifiers = { difficultyModifier, additionalModifier: modifier };
      return RollExecutor.executeSkillRoll(actor, skill, label, skillTotal, modifiers);
    }

    // Show dialog with pre-filled modifiers
    return RollExecutor.showSkillDialog(actor, skill, label, skillTotal, modifier, difficultyModifier);
  }

  /**
   * Find skill key by name (case-insensitive, matches key or label).
   *
   * @param {Object} skills - Actor's skills object
   * @param {string} searchName - Skill name to find
   * @returns {string|null} Skill key or null if not found
   * @private
   */
  static _findSkillKey(skills, searchName) {
    const searchLower = searchName.toLowerCase();

    // Try exact key match first
    if (skills[searchLower]) {
      return searchLower;
    }

    // Try label match (case-insensitive)
    for (const [key, skill] of Object.entries(skills)) {
      if (skill.label && skill.label.toLowerCase() === searchLower) {
        return key;
      }
    }

    // Try partial match on key
    for (const key of Object.keys(skills)) {
      if (key.toLowerCase() === searchLower) {
        return key;
      }
    }

    return null;
  }

  /**
   * Parse difficulty string or number to numeric modifier.
   *
   * @param {string|number} difficulty - Difficulty preset name or numeric value
   * @returns {number} Numeric modifier
   * @private
   */
  static _parseDifficulty(difficulty) {
    if (typeof difficulty === 'number') {
      return difficulty;
    }

    if (typeof difficulty === 'string') {
      const preset = DIFFICULTY[difficulty];
      if (preset !== undefined) {
        return preset;
      }
    }

    return 0; // Default to Challenging (no modifier)
  }

  /**
   * Get list of all available difficulty presets.
   *
   * @returns {Object} Dictionary of difficulty names to modifiers
   * @example
   * const difficulties = game.deathwatch.getDifficulties();
   * // { 'Trivial': 60, 'Easy': 30, ..., 'Hellish': -60 }
   */
  static getDifficulties() {
    return { ...DIFFICULTY };
  }
}
