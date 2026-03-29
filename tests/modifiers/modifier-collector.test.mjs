import { jest } from '@jest/globals';
import { ModifierCollector } from '../../src/module/helpers/character/modifier-collector.mjs';

describe('ModifierCollector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectActiveEffectModifiers', () => {
    it('collects modifiers from active effects', () => {
      const actor = {
        effects: [
          {
            name: 'Prone',
            disabled: false,
            changes: [
              { key: 'system.characteristics.ws.value', mode: 2, value: -20 }
            ]
          }
        ]
      };

      const modifiers = ModifierCollector.collectActiveEffectModifiers(actor);

      expect(modifiers).toHaveLength(1);
      expect(modifiers[0]).toMatchObject({
        name: 'Prone',
        modifier: -20,
        effectType: 'characteristic',
        valueAffected: 'ws',
        source: 'Status Effect'
      });
    });

    it('ignores disabled effects', () => {
      const actor = {
        effects: [
          {
            name: 'Prone',
            disabled: true,
            changes: [
              { key: 'system.characteristics.ws.value', mode: 2, value: -20 }
            ]
          }
        ]
      };

      const modifiers = ModifierCollector.collectActiveEffectModifiers(actor);

      expect(modifiers).toHaveLength(0);
    });

    it('collects multiple modifiers from multiple effects', () => {
      const actor = {
        effects: [
          {
            name: 'Prone',
            disabled: false,
            changes: [
              { key: 'system.characteristics.ws.value', mode: 2, value: -20 }
            ]
          },
          {
            name: 'Blinded',
            disabled: false,
            changes: [
              { key: 'system.characteristics.ws.value', mode: 2, value: -30 }
            ]
          }
        ]
      };

      const modifiers = ModifierCollector.collectActiveEffectModifiers(actor);

      expect(modifiers).toHaveLength(2);
      expect(modifiers[0].name).toBe('Prone');
      expect(modifiers[1].name).toBe('Blinded');
    });

    it('ignores non-characteristic changes', () => {
      const actor = {
        effects: [
          {
            name: 'Effect',
            disabled: false,
            changes: [
              { key: 'system.wounds.max', mode: 2, value: 5 }
            ]
          }
        ]
      };

      const modifiers = ModifierCollector.collectActiveEffectModifiers(actor);

      expect(modifiers).toHaveLength(0);
    });
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

    it('collects modifiers from talent items without requiring equipped status', () => {
      const items = [
        {
          name: 'Psy Rating 3',
          type: 'talent',
          system: {
            modifiers: [
              { name: 'Psy Rating 3', modifier: '3', effectType: 'psy-rating', enabled: true }
            ]
          }
        }
      ];

      const modifiers = ModifierCollector.collectItemModifiers(items);

      expect(modifiers).toHaveLength(1);
      expect(modifiers[0]).toMatchObject({
        name: 'Psy Rating 3',
        modifier: '3',
        effectType: 'psy-rating',
        source: 'Psy Rating 3'
      });
    });

    it('collects modifiers from multiple talent items', () => {
      const items = [
        {
          name: 'Psy Rating 3',
          type: 'talent',
          system: {
            modifiers: [
              { name: 'Psy Rating 3', modifier: '3', effectType: 'psy-rating', enabled: true }
            ]
          }
        },
        {
          name: 'Psy Rating 4',
          type: 'talent',
          system: {
            modifiers: [
              { name: 'Psy Rating 4', modifier: '1', effectType: 'psy-rating', enabled: true }
            ]
          }
        }
      ];

      const modifiers = ModifierCollector.collectItemModifiers(items);

      expect(modifiers).toHaveLength(2);
    });

    it('does not collect modifiers from weapon upgrades in ModifierCollector', () => {
      const itemsMap = new Map();
      const upgrade = {
        _id: 'upgrade001',
        name: 'Red-Dot Laser Sight',
        type: 'weapon-upgrade',
        system: {
          modifiers: [
            { name: 'BS Bonus', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true }
          ]
        }
      };
      const weapon = {
        name: 'Bolter',
        type: 'weapon',
        system: {
          equipped: true,
          modifiers: [],
          attachedUpgrades: [{ id: 'upgrade001' }]
        }
      };
      itemsMap.set('upgrade001', upgrade);
      itemsMap.set('weapon001', weapon);

      const modifiers = ModifierCollector.collectItemModifiers(itemsMap);

      // Weapon upgrades are not collected by ModifierCollector
      // They are applied during combat via WeaponUpgradeHelper
      expect(modifiers).toHaveLength(0);
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
