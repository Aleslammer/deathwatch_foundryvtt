import { jest } from '@jest/globals';
import { ModifierCollector } from '../../src/module/helpers/character/modifier-collector.mjs';

describe('ModifierCollector - Characteristic Damage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyCharacteristicModifiers with damage', () => {
    it('subtracts damage from characteristic value', () => {
      const characteristics = {
        ag: { value: 37, base: 37, damage: 5, advances: {} }
      };

      const modifiers = [];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(32); // 37 - 5
      expect(characteristics.ag.mod).toBe(3); // floor(32/10)
    });

    it('applies damage after advances', () => {
      const characteristics = {
        ag: { value: 37, base: 37, damage: 5, advances: { simple: true, intermediate: true } }
      };

      const modifiers = [];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(42); // 37 + 5 + 5 - 5
      expect(characteristics.ag.mod).toBe(4);
    });

    it('applies damage after other modifiers', () => {
      const characteristics = {
        ag: { value: 37, base: 37, damage: 5, advances: {} }
      };

      const modifiers = [
        { name: 'Chapter Bonus', modifier: 10, effectType: 'characteristic', valueAffected: 'ag', source: 'Chapter' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(42); // 37 + 10 - 5
      expect(characteristics.ag.mod).toBe(4);
    });

    it('includes damage in modifiers array', () => {
      const characteristics = {
        ag: { value: 37, base: 37, damage: 5, advances: {} }
      };

      const modifiers = [];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.modifiers).toHaveLength(1);
      expect(characteristics.ag.modifiers[0]).toMatchObject({
        name: 'Damage',
        value: -5,
        source: 'Characteristic Damage'
      });
    });

    it('handles zero damage', () => {
      const characteristics = {
        ag: { value: 37, base: 37, damage: 0, advances: {} }
      };

      const modifiers = [];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(37);
      expect(characteristics.ag.modifiers).toHaveLength(0);
    });

    it('handles undefined damage', () => {
      const characteristics = {
        ag: { value: 37, base: 37, advances: {} }
      };

      const modifiers = [];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(37);
      expect(characteristics.ag.modifiers).toHaveLength(0);
    });

    it('handles damage with advances and modifiers', () => {
      const characteristics = {
        ag: { value: 37, base: 37, damage: 8, advances: { simple: true, intermediate: true, trained: true } }
      };

      const modifiers = [
        { name: 'Chapter Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'ag', source: 'Chapter' },
        { name: 'Armor Bonus', modifier: 10, effectType: 'characteristic', valueAffected: 'ag', source: 'Power Armor' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      // 37 (base) + 5 + 5 + 5 (advances) + 5 (chapter) + 10 (armor) - 8 (damage) = 59
      expect(characteristics.ag.value).toBe(59);
      expect(characteristics.ag.mod).toBe(5);
      expect(characteristics.ag.modifiers).toHaveLength(6); // 3 advances + 2 modifiers + 1 damage
    });

    it('can reduce characteristic below zero', () => {
      const characteristics = {
        ag: { value: 20, base: 20, damage: 30, advances: {} }
      };

      const modifiers = [];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(-10);
      expect(characteristics.ag.mod).toBe(-1);
    });
  });
});
