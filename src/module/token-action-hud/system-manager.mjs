/**
 * @file SystemManager for Token Action HUD integration
 * @module token-action-hud/system-manager
 */

import { ActionHandler } from './action-handler.mjs';
import { RollHandler } from './roll-handler.mjs';

export let SystemManager = null;

/**
 * Create SystemManager class (factory function for testing)
 * @param {class} BaseSystemManager - Base SystemManager class to extend
 * @returns {class} SystemManager class
 */
export function createSystemManager(BaseSystemManager) {
  return class SystemManager extends BaseSystemManager {
    /**
     * Get the action handler for building action lists.
     * @override
     * @returns {ActionHandler|null} ActionHandler instance or null if not implemented
     */
    getActionHandler() {
      return null;
    }

    /**
     * Get the roll handler for executing rolls.
     * @override
     * @param {string} rollHandlerId - Roll handler identifier
     * @returns {RollHandler|null} RollHandler instance or null if not implemented
     */
    getRollHandler(rollHandlerId) {
      return null;
    }

    /**
     * Get list of available roll handlers for this system.
     * @override
     * @returns {Array<Object>} Array of roll handler objects with id and name
     */
    getAvailableRollHandlers() {
      return [
        {
          id: 'deathwatch',
          name: 'Deathwatch'
        }
      ];
    }

    /**
     * Register default action layout and group definitions.
     * @override
     * @returns {{layout: Array, groups: Array}} Default layout configuration
     */
    registerDefaults() {
      const groups = {
        rangedWeapons: { id: 'ranged-weapons', name: 'Ranged Weapons', type: 'system' },
        meleeWeapons: { id: 'melee-weapons', name: 'Melee Weapons', type: 'system' },
        grenades: { id: 'grenades', name: 'Grenades', type: 'system' },
        combatActions: { id: 'combat-actions', name: 'Combat Actions', type: 'system' },
        basicSkills: { id: 'basic-skills', name: 'Basic Skills', type: 'system' },
        advancedSkills: { id: 'advanced-skills', name: 'Advanced Skills', type: 'system' },
        charWS: { id: 'char-ws', name: 'Weapon Skill', type: 'system' },
        charBS: { id: 'char-bs', name: 'Ballistic Skill', type: 'system' },
        charS: { id: 'char-s', name: 'Strength', type: 'system' },
        charT: { id: 'char-t', name: 'Toughness', type: 'system' },
        charAg: { id: 'char-ag', name: 'Agility', type: 'system' },
        charInt: { id: 'char-int', name: 'Intelligence', type: 'system' },
        charPer: { id: 'char-per', name: 'Perception', type: 'system' },
        charWP: { id: 'char-wp', name: 'Willpower', type: 'system' },
        charFS: { id: 'char-fs', name: 'Fellowship', type: 'system' }
      };

      return {
        layout: [
          {
            nestId: 'combat',
            id: 'combat',
            name: 'Combat',
            type: 'system',
            groups: [
              { ...groups.rangedWeapons, nestId: 'combat_ranged-weapons' },
              { ...groups.meleeWeapons, nestId: 'combat_melee-weapons' },
              { ...groups.grenades, nestId: 'combat_grenades' },
              { ...groups.combatActions, nestId: 'combat_combat-actions' }
            ]
          },
          {
            nestId: 'skills',
            id: 'skills',
            name: 'Skills',
            type: 'system',
            groups: [
              { ...groups.basicSkills, nestId: 'skills_basic-skills' },
              { ...groups.advancedSkills, nestId: 'skills_advanced-skills' }
            ]
          },
          {
            nestId: 'characteristics',
            id: 'characteristics',
            name: 'Characteristics',
            type: 'system',
            groups: [
              { ...groups.charWS, nestId: 'characteristics_char-ws' },
              { ...groups.charBS, nestId: 'characteristics_char-bs' },
              { ...groups.charS, nestId: 'characteristics_char-s' },
              { ...groups.charT, nestId: 'characteristics_char-t' },
              { ...groups.charAg, nestId: 'characteristics_char-ag' },
              { ...groups.charInt, nestId: 'characteristics_char-int' },
              { ...groups.charPer, nestId: 'characteristics_char-per' },
              { ...groups.charWP, nestId: 'characteristics_char-wp' },
              { ...groups.charFS, nestId: 'characteristics_char-fs' }
            ]
          }
        ],
        groups: Object.values(groups)
      };
    }
  };
}

/**
 * Initialize SystemManager after TAH Core API is ready
 * @param {Object} coreModule - TAH Core module with API
 */
export function initializeSystemManager(coreModule) {
  SystemManager = class SystemManager extends coreModule.api.SystemManager {
    /**
     * Get the action handler for building action lists.
     * @override
     * @returns {ActionHandler} ActionHandler instance
     */
    getActionHandler() {
      return new ActionHandler();
    }

    /**
     * Get the roll handler for executing rolls.
     * @override
     * @param {string} rollHandlerId - Roll handler identifier
     * @returns {RollHandler} RollHandler instance
     */
    getRollHandler(rollHandlerId) {
      return new RollHandler();
    }

    /**
     * Get list of available roll handlers for this system.
     * @override
     * @returns {Object} Object with roll handler IDs as keys and names as values
     */
    getAvailableRollHandlers() {
      return {
        core: 'Deathwatch'
      };
    }

    /**
     * Register default action layout and group definitions.
     * Defines the structure of action categories visible in the HUD.
     *
     * @override
     * @returns {{layout: Array, groups: Array}} Default layout configuration
     */
    async registerDefaults() {
      // Define group objects (like DND5e's GROUP constant)
      const groups = {
        rangedWeapons: { id: 'ranged-weapons', name: 'Ranged Weapons', type: 'system' },
        meleeWeapons: { id: 'melee-weapons', name: 'Melee Weapons', type: 'system' },
        grenades: { id: 'grenades', name: 'Grenades', type: 'system' },
        basicSkills: { id: 'basic-skills', name: 'Basic Skills', type: 'system' },
        advancedSkills: { id: 'advanced-skills', name: 'Advanced Skills', type: 'system' },
        charWS: { id: 'char-ws', name: 'Weapon Skill', type: 'system' },
        charBS: { id: 'char-bs', name: 'Ballistic Skill', type: 'system' },
        charS: { id: 'char-s', name: 'Strength', type: 'system' },
        charT: { id: 'char-t', name: 'Toughness', type: 'system' },
        charAg: { id: 'char-ag', name: 'Agility', type: 'system' },
        charInt: { id: 'char-int', name: 'Intelligence', type: 'system' },
        charPer: { id: 'char-per', name: 'Perception', type: 'system' },
        charWP: { id: 'char-wp', name: 'Willpower', type: 'system' },
        charFS: { id: 'char-fs', name: 'Fellowship', type: 'system' }
      };

      const defaults = {
        layout: [
          {
            nestId: 'combat',
            id: 'combat',
            name: 'Combat',
            type: 'system',
            groups: [
              { ...groups.rangedWeapons, nestId: 'combat_ranged-weapons' },
              { ...groups.meleeWeapons, nestId: 'combat_melee-weapons' },
              { ...groups.grenades, nestId: 'combat_grenades' }
            ]
          },
          {
            nestId: 'skills',
            id: 'skills',
            name: 'Skills',
            type: 'system',
            groups: [
              { ...groups.basicSkills, nestId: 'skills_basic-skills' },
              { ...groups.advancedSkills, nestId: 'skills_advanced-skills' }
            ]
          },
          {
            nestId: 'characteristics',
            id: 'characteristics',
            name: 'Characteristics',
            type: 'system',
            groups: [
              { ...groups.charWS, nestId: 'characteristics_char-ws' },
              { ...groups.charBS, nestId: 'characteristics_char-bs' },
              { ...groups.charS, nestId: 'characteristics_char-s' },
              { ...groups.charT, nestId: 'characteristics_char-t' },
              { ...groups.charAg, nestId: 'characteristics_char-ag' },
              { ...groups.charInt, nestId: 'characteristics_char-int' },
              { ...groups.charPer, nestId: 'characteristics_char-per' },
              { ...groups.charWP, nestId: 'characteristics_char-wp' },
              { ...groups.charFS, nestId: 'characteristics_char-fs' }
            ]
          }
        ],
        groups: Object.values(groups)
      };

      return defaults;
    }
  };
}
