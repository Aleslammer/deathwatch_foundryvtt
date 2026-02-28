import { jest } from '@jest/globals';
import './setup.mjs';
import { ModifierCollector } from '../src/module/helpers/modifier-collector.mjs';

describe('ModifierCollector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectAllModifiers', () => {
    it('combines actor and item modifiers', () => {
      const mockItems = [
        { name: 'Item', system: { equipped: true, modifiers: [{ name: 'Item Mod', modifier: 10 }] } }
      ];
      const actor = {
        system: {
          modifiers: [{ name: 'Actor Mod', modifier: 5 }]
        },
        items: mockItems
      };

      const result = ModifierCollector.collectAllModifiers(actor);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Actor Mod');
      expect(result[1].name).toBe('Item Mod');
    });

    it('handles missing actor modifiers', () => {
      const actor = {
        system: {},
        items: []
      };

      const result = ModifierCollector.collectAllModifiers(actor);
      expect(result).toEqual([]);
    });
  });

  describe('collectItemModifiers', () => {
    it('collects modifiers from equipped items', () => {
      const items = [
        {
          name: 'Weapon',
          system: { equipped: true, modifiers: [{ name: 'Mod1', modifier: 5, enabled: true }] }
        }
      ];

      const result = ModifierCollector.collectItemModifiers(items);
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('Weapon');
    });

    it('skips unequipped items', () => {
      const items = [
        {
          system: { equipped: false, modifiers: [{ name: 'Mod1', modifier: 5 }] }
        }
      ];

      const result = ModifierCollector.collectItemModifiers(items);
      expect(result).toHaveLength(0);
    });

    it('skips disabled modifiers', () => {
      const items = [
        {
          name: 'Item',
          system: { equipped: true, modifiers: [{ name: 'Mod1', modifier: 5, enabled: false }] }
        }
      ];

      const result = ModifierCollector.collectItemModifiers(items);
      expect(result).toHaveLength(0);
    });

    it('collects armor history modifiers', () => {
      const items = new Map([
        ['armor1', {
          name: 'Power Armor',
          type: 'armor',
          system: { equipped: true, attachedHistories: ['history1'] }
        }],
        ['history1', {
          name: 'Battle History',
          system: { modifiers: [{ name: 'History Mod', modifier: 10, enabled: true }] }
        }]
      ]);

      const result = ModifierCollector.collectItemModifiers(items);
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('Battle History (Power Armor)');
    });
  });

  describe('collectArmorHistoryModifiers', () => {
    it('collects modifiers from attached histories', () => {
      const armor = {
        name: 'Armor',
        system: { attachedHistories: ['hist1'] }
      };
      const items = new Map([
        ['hist1', {
          name: 'History',
          system: { modifiers: [{ name: 'Mod', modifier: 5, enabled: true }] }
        }]
      ]);

      const result = ModifierCollector.collectArmorHistoryModifiers(armor, items);
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('History (Armor)');
    });

    it('handles missing history items', () => {
      const armor = {
        name: 'Armor',
        system: { attachedHistories: ['missing'] }
      };
      const items = new Map();

      const result = ModifierCollector.collectArmorHistoryModifiers(armor, items);
      expect(result).toHaveLength(0);
    });
  });

  describe('applyCharacteristicModifiers', () => {
    it('applies modifiers to characteristics', () => {
      const characteristics = {
        ws: { value: 40 }
      };
      const modifiers = [
        { effectType: 'characteristic', valueAffected: 'ws', modifier: 10, enabled: true, name: 'Bonus' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);
      expect(characteristics.ws.value).toBe(50);
      expect(characteristics.ws.mod).toBe(5);
    });

    it('stores base value', () => {
      const characteristics = {
        ws: { value: 40 }
      };

      ModifierCollector.applyCharacteristicModifiers(characteristics, []);
      expect(characteristics.ws.base).toBe(40);
    });

    it('tracks applied modifiers', () => {
      const characteristics = {
        ws: { value: 40 }
      };
      const modifiers = [
        { effectType: 'characteristic', valueAffected: 'ws', modifier: 10, name: 'Mod1', source: 'Item' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);
      expect(characteristics.ws.modifiers).toHaveLength(1);
      expect(characteristics.ws.modifiers[0].name).toBe('Mod1');
    });
  });

  describe('applySkillModifiers', () => {
    it('applies modifiers to skills', () => {
      const skills = {
        awareness: {}
      };
      const modifiers = [
        { effectType: 'skill', valueAffected: 'awareness', modifier: 5, enabled: true }
      ];

      ModifierCollector.applySkillModifiers(skills, modifiers);
      expect(skills.awareness.modifierTotal).toBe(5);
    });

    it('sums multiple modifiers', () => {
      const skills = {
        awareness: {}
      };
      const modifiers = [
        { effectType: 'skill', valueAffected: 'awareness', modifier: 5, enabled: true },
        { effectType: 'skill', valueAffected: 'awareness', modifier: 10, enabled: true }
      ];

      ModifierCollector.applySkillModifiers(skills, modifiers);
      expect(skills.awareness.modifierTotal).toBe(15);
    });
  });

  describe('applyInitiativeModifiers', () => {
    it('sums initiative modifiers', () => {
      const modifiers = [
        { effectType: 'initiative', modifier: 5, enabled: true },
        { effectType: 'initiative', modifier: 3, enabled: true }
      ];

      const result = ModifierCollector.applyInitiativeModifiers(modifiers);
      expect(result).toBe(8);
    });

    it('returns 0 for no modifiers', () => {
      const result = ModifierCollector.applyInitiativeModifiers([]);
      expect(result).toBe(0);
    });

    it('skips disabled modifiers', () => {
      const modifiers = [
        { effectType: 'initiative', modifier: 5, enabled: false }
      ];

      const result = ModifierCollector.applyInitiativeModifiers(modifiers);
      expect(result).toBe(0);
    });
  });
});
