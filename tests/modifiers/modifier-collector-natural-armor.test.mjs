import { jest } from '@jest/globals';
import { ModifierCollector } from '../../src/module/helpers/modifier-collector.mjs';

describe('ModifierCollector - Natural Armor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateNaturalArmor', () => {
    it('returns 0 when no armor modifiers from traits exist', () => {
      const modifiers = [
        { name: 'Enhancement', modifier: 2, effectType: 'armor', source: 'Power Armor', enabled: true }
      ];
      const items = [
        { name: 'Power Armor', type: 'armor', system: { equipped: true } }
      ];

      const result = ModifierCollector.calculateNaturalArmor(modifiers, items);
      expect(result).toBe(0);
    });

    it('returns natural armor value from trait-sourced armor modifiers', () => {
      const modifiers = [
        { name: 'Natural Armour', modifier: 2, effectType: 'armor', source: 'Natural Armour (2)', enabled: true }
      ];
      const items = [
        { name: 'Natural Armour (2)', type: 'trait', system: { modifiers: [] } }
      ];

      const result = ModifierCollector.calculateNaturalArmor(modifiers, items);
      expect(result).toBe(2);
    });

    it('sums multiple trait-sourced armor modifiers', () => {
      const modifiers = [
        { name: 'Natural Armour', modifier: 2, effectType: 'armor', source: 'Natural Armour (2)', enabled: true },
        { name: 'Thick Hide', modifier: 3, effectType: 'armor', source: 'Thick Hide', enabled: true }
      ];
      const items = [
        { name: 'Natural Armour (2)', type: 'trait', system: {} },
        { name: 'Thick Hide', type: 'trait', system: {} }
      ];

      const result = ModifierCollector.calculateNaturalArmor(modifiers, items);
      expect(result).toBe(5);
    });

    it('ignores disabled modifiers', () => {
      const modifiers = [
        { name: 'Natural Armour', modifier: 2, effectType: 'armor', source: 'Natural Armour (2)', enabled: false }
      ];
      const items = [
        { name: 'Natural Armour (2)', type: 'trait', system: {} }
      ];

      const result = ModifierCollector.calculateNaturalArmor(modifiers, items);
      expect(result).toBe(0);
    });

    it('ignores armor modifiers from non-trait sources', () => {
      const modifiers = [
        { name: 'Natural Armour', modifier: 2, effectType: 'armor', source: 'Natural Armour (2)', enabled: true },
        { name: 'Armor Bonus', modifier: 3, effectType: 'armor', source: 'Power Armor', enabled: true }
      ];
      const items = [
        { name: 'Natural Armour (2)', type: 'trait', system: {} },
        { name: 'Power Armor', type: 'armor', system: { equipped: true } }
      ];

      const result = ModifierCollector.calculateNaturalArmor(modifiers, items);
      expect(result).toBe(2);
    });

    it('ignores non-armor effectType modifiers from traits', () => {
      const modifiers = [
        { name: 'Strength Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'str', source: 'Some Trait', enabled: true }
      ];
      const items = [
        { name: 'Some Trait', type: 'trait', system: {} }
      ];

      const result = ModifierCollector.calculateNaturalArmor(modifiers, items);
      expect(result).toBe(0);
    });

    it('handles empty modifiers array', () => {
      const result = ModifierCollector.calculateNaturalArmor([], []);
      expect(result).toBe(0);
    });

    it('works with Map of items', () => {
      const modifiers = [
        { name: 'Natural Armour', modifier: 2, effectType: 'armor', source: 'Natural Armour (2)', enabled: true }
      ];
      const itemsMap = new Map();
      itemsMap.set('trait1', { name: 'Natural Armour (2)', type: 'trait', system: {} });

      const result = ModifierCollector.calculateNaturalArmor(modifiers, itemsMap);
      expect(result).toBe(2);
    });
  });
});
