import { jest } from '@jest/globals';
import './setup.mjs';
import { ModifierCollector } from '../src/module/helpers/modifier-collector.mjs';

describe('ModifierCollector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectItemModifiers', () => {
    it('collects modifiers from chapter items without requiring equipped status', () => {
      const items = [
        {
          name: 'Black Templars',
          type: 'chapter',
          system: {
            modifiers: [
              { name: 'WS Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'ws', enabled: true },
              { name: 'WIL Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'wil', enabled: true }
            ]
          }
        }
      ];

      const modifiers = ModifierCollector.collectItemModifiers(items);

      expect(modifiers).toHaveLength(2);
      expect(modifiers[0]).toMatchObject({
        name: 'WS Bonus',
        modifier: 5,
        effectType: 'characteristic',
        valueAffected: 'ws',
        source: 'Black Templars'
      });
      expect(modifiers[1]).toMatchObject({
        name: 'WIL Bonus',
        modifier: 5,
        effectType: 'characteristic',
        valueAffected: 'wil',
        source: 'Black Templars'
      });
    });

    it('still requires equipped status for non-chapter items', () => {
      const items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: false,
            modifiers: [
              { name: 'STR Bonus', modifier: 10, effectType: 'characteristic', valueAffected: 'str' }
            ],
            attachedHistories: []
          }
        }
      ];

      const modifiers = ModifierCollector.collectItemModifiers(items);

      expect(modifiers).toHaveLength(0);
    });

    it('collects modifiers from equipped items and chapter items together', () => {
      const items = [
        {
          name: 'Black Templars',
          type: 'chapter',
          system: {
            modifiers: [
              { name: 'WS Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'ws' }
            ]
          }
        },
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: true,
            modifiers: [
              { name: 'STR Bonus', modifier: 10, effectType: 'characteristic', valueAffected: 'str' }
            ],
            attachedHistories: []
          }
        }
      ];

      const modifiers = ModifierCollector.collectItemModifiers(items);

      expect(modifiers).toHaveLength(2);
      expect(modifiers.find(m => m.source === 'Black Templars')).toBeDefined();
      expect(modifiers.find(m => m.source === 'Power Armor')).toBeDefined();
    });
  });

  describe('applyCharacteristicModifiers', () => {
    it('applies chapter modifiers to characteristics', () => {
      const characteristics = {
        ws: { value: 40, base: 40, advances: {} },
        wil: { value: 35, base: 35, advances: {} }
      };

      const modifiers = [
        { name: 'WS Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'ws', source: 'Black Templars' },
        { name: 'WIL Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'wil', source: 'Black Templars' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ws.value).toBe(45);
      expect(characteristics.ws.mod).toBe(4);
      expect(characteristics.wil.value).toBe(40);
      expect(characteristics.wil.mod).toBe(4);
    });

    it('includes advances in modifiers array for tooltip', () => {
      const characteristics = {
        ws: { value: 40, base: 40, advances: { simple: true, intermediate: true, trained: false, expert: false } }
      };

      const modifiers = [
        { name: 'Chapter Bonus', modifier: 5, effectType: 'characteristic', valueAffected: 'ws', source: 'Black Templars' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ws.value).toBe(55);
      expect(characteristics.ws.modifiers).toHaveLength(3);
      expect(characteristics.ws.modifiers[0]).toMatchObject({ name: 'Simple Advance', value: 5, source: 'Advances' });
      expect(characteristics.ws.modifiers[1]).toMatchObject({ name: 'Intermediate Advance', value: 5, source: 'Advances' });
      expect(characteristics.ws.modifiers[2]).toMatchObject({ name: 'Chapter Bonus', value: 5, source: 'Black Templars' });
    });

    it('applies characteristic-bonus modifiers to bonus instead of value', () => {
      const characteristics = {
        ws: { value: 40, base: 40, advances: {} }
      };

      const modifiers = [
        { name: 'Bonus Modifier', modifier: 2, effectType: 'characteristic-bonus', valueAffected: 'ws', source: 'Talent' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ws.value).toBe(40);
      expect(characteristics.ws.mod).toBe(6); // 4 (from 40/10) + 2
      expect(characteristics.ws.bonusModifiers).toHaveLength(1);
      expect(characteristics.ws.bonusModifiers[0]).toEqual({ name: 'Bonus Modifier', value: 2, source: 'Talent' });
    });

    it('applies multiplicative characteristic-bonus modifiers', () => {
      const characteristics = {
        ws: { value: 40, base: 40, advances: {} }
      };

      const modifiers = [
        { name: 'Double Bonus', modifier: 'x2', effectType: 'characteristic-bonus', valueAffected: 'ws', source: 'Talent' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ws.value).toBe(40);
      expect(characteristics.ws.mod).toBe(8); // 4 (from 40/10) * 2
      expect(characteristics.ws.bonusModifiers).toHaveLength(1);
      expect(characteristics.ws.bonusModifiers[0]).toEqual({ name: 'Double Bonus', value: 8, source: 'Talent', display: 'x2' });
    });

    it('applies mixed additive and multiplicative bonus modifiers', () => {
      const characteristics = {
        ws: { value: 40, base: 40, advances: {} }
      };

      const modifiers = [
        { name: 'Add Bonus', modifier: 2, effectType: 'characteristic-bonus', valueAffected: 'ws', source: 'Talent' },
        { name: 'Multiply Bonus', modifier: 'x2', effectType: 'characteristic-bonus', valueAffected: 'ws', source: 'Power' }
      ];

      ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

      expect(characteristics.ws.value).toBe(40);
      expect(characteristics.ws.mod).toBe(10); // 4 (base) + 2 (additive) + 4 (base * 2 - base)
      expect(characteristics.ws.bonusModifiers).toHaveLength(2);
    });
  });
});
