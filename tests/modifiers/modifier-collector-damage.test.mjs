import { jest } from '@jest/globals';
import { ModifierCollector } from '../../src/module/helpers/character/modifier-collector.mjs';

describe('ModifierCollector - Characteristic Damage via Modifiers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyCharacteristicModifiers with negative modifiers (damage)', () => {
    it('applies negative modifier (damage) to characteristic value', () => {
      const characteristics = {
        ag: { value: 37, base: 37, advances: {} }
      };

      const modifiers = [
        { name: 'Implosion Shell AG Damage', modifier: -5, effectType: 'characteristic', valueAffected: 'ag', source: 'Characteristic Damage', enabled: true }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(32); // 37 - 5
      expect(characteristics.ag.mod).toBe(3); // floor(32/10)
    });

    it('applies damage modifier after advances', () => {
      const characteristics = {
        ag: { value: 37, base: 37, advances: { simple: true, intermediate: true } }
      };

      const modifiers = [
        { name: 'Implosion Shell AG Damage', modifier: -5, effectType: 'characteristic', valueAffected: 'ag', source: 'Characteristic Damage', enabled: true }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(42); // 37 + 5 + 5 - 5
      expect(characteristics.ag.mod).toBe(4);
    });

    it('applies damage modifier with other positive modifiers', () => {
      const characteristics = {
        ag: { value: 37, base: 37, advances: {} }
      };

      const modifiers = [
        { name: 'Chapter Bonus', modifier: 10, effectType: 'characteristic', valueAffected: 'ag', source: 'Chapter', enabled: true },
        { name: 'Implosion Shell AG Damage', modifier: -5, effectType: 'characteristic', valueAffected: 'ag', source: 'Characteristic Damage', enabled: true }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(42); // 37 + 10 - 5
      expect(characteristics.ag.mod).toBe(4);
    });

    it('includes damage modifier in modifiers array', () => {
      const characteristics = {
        ag: { value: 37, base: 37, advances: {} }
      };

      const modifiers = [
        { name: 'Implosion Shell AG Damage', modifier: -5, effectType: 'characteristic', valueAffected: 'ag', source: 'Characteristic Damage', enabled: true }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.modifiers).toHaveLength(1);
      expect(characteristics.ag.modifiers[0]).toMatchObject({
        name: 'Implosion Shell AG Damage',
        value: -5,
        source: 'Characteristic Damage'
      });
    });

    it('handles multiple damage modifiers from different sources', () => {
      const characteristics = {
        ag: { value: 37, base: 37, advances: { simple: true, intermediate: true, trained: true } }
      };

      const modifiers = [
        { name: 'Chapter Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'ag', source: 'Chapter', enabled: true },
        { name: 'Armor Bonus', modifier: 10, effectType: 'characteristic', valueAffected: 'ag', source: 'Power Armor', enabled: true },
        { name: 'Implosion Shell AG Damage', modifier: -8, effectType: 'characteristic', valueAffected: 'ag', source: 'Characteristic Damage', enabled: true }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      // 37 (base) + 5 + 5 + 5 (advances) + 5 (chapter) + 10 (armor) - 8 (damage) = 59
      expect(characteristics.ag.value).toBe(59);
      expect(characteristics.ag.mod).toBe(5);
      expect(characteristics.ag.modifiers).toHaveLength(6); // 3 advances + 3 modifiers
    });

    it('can reduce characteristic below zero with large damage modifier', () => {
      const characteristics = {
        ag: { value: 20, base: 20, advances: {} }
      };

      const modifiers = [
        { name: 'Massive Damage', modifier: -30, effectType: 'characteristic', valueAffected: 'ag', source: 'Characteristic Damage', enabled: true }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(-10);
      expect(characteristics.ag.mod).toBe(-1);
    });

    it('ignores disabled damage modifiers', () => {
      const characteristics = {
        ag: { value: 37, base: 37, advances: {} }
      };

      const modifiers = [
        { name: 'Implosion Shell AG Damage', modifier: -5, effectType: 'characteristic', valueAffected: 'ag', source: 'Characteristic Damage', enabled: false }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ag.value).toBe(37);
      expect(characteristics.ag.modifiers).toHaveLength(0);
    });
  });
});
