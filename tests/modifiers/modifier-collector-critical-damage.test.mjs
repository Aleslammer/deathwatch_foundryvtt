import { ModifierCollector } from '../../src/module/helpers/character/modifier-collector.mjs';

describe('ModifierCollector - Critical Damage Modifiers', () => {
  describe('collectAllModifiers with critical-damage effect type', () => {
    it('collects critical-damage modifiers from talents', () => {
      const actor = {
        system: { modifiers: [] },
        effects: []
      };
      const items = [
        {
          type: 'talent',
          name: 'Crack Shot',
          system: {
            modifiers: [
              {
                name: 'Crack Shot',
                modifier: 2,
                effectType: 'critical-damage',
                valueAffected: 'ranged',
                enabled: true
              }
            ]
          }
        }
      ];

      const modifiers = ModifierCollector.collectAllModifiers(actor, items);

      const critDamageMods = modifiers.filter(m => m.effectType === 'critical-damage');
      expect(critDamageMods).toHaveLength(1);
      expect(critDamageMods[0].modifier).toBe(2);
      expect(critDamageMods[0].valueAffected).toBe('ranged');
      expect(critDamageMods[0].source).toBe('Crack Shot');
    });

    it('collects multiple critical-damage modifiers', () => {
      const actor = {
        system: { modifiers: [] },
        effects: []
      };
      const items = [
        {
          type: 'talent',
          name: 'Crippling Strike',
          system: {
            modifiers: [
              {
                name: 'Crippling Strike',
                modifier: 4,
                effectType: 'critical-damage',
                valueAffected: 'melee',
                enabled: true
              }
            ]
          }
        },
        {
          type: 'talent',
          name: 'Street Fighting',
          system: {
            modifiers: [
              {
                name: 'Street Fighting',
                modifier: 2,
                effectType: 'critical-damage',
                valueAffected: 'melee',
                enabled: true
              }
            ]
          }
        }
      ];

      const modifiers = ModifierCollector.collectAllModifiers(actor, items);

      const critDamageMods = modifiers.filter(m => m.effectType === 'critical-damage');
      expect(critDamageMods).toHaveLength(2);
      expect(critDamageMods[0].modifier).toBe(4);
      expect(critDamageMods[1].modifier).toBe(2);
    });

    it('respects enabled flag on critical-damage modifiers', () => {
      const actor = {
        system: { modifiers: [] },
        effects: []
      };
      const items = [
        {
          type: 'talent',
          name: 'Crack Shot',
          system: {
            modifiers: [
              {
                name: 'Crack Shot',
                modifier: 2,
                effectType: 'critical-damage',
                valueAffected: 'ranged',
                enabled: false
              }
            ]
          }
        }
      ];

      const modifiers = ModifierCollector.collectAllModifiers(actor, items);

      // Disabled modifiers should be filtered out during collection
      const critDamageMods = modifiers.filter(m => m.effectType === 'critical-damage');
      expect(critDamageMods).toHaveLength(0);
    });

    it('filters by valueAffected (ranged vs melee)', () => {
      const actor = {
        system: { modifiers: [] },
        effects: []
      };
      const items = [
        {
          type: 'talent',
          name: 'Crack Shot',
          system: {
            modifiers: [
              {
                name: 'Crack Shot',
                modifier: 2,
                effectType: 'critical-damage',
                valueAffected: 'ranged',
                enabled: true
              }
            ]
          }
        },
        {
          type: 'talent',
          name: 'Crippling Strike',
          system: {
            modifiers: [
              {
                name: 'Crippling Strike',
                modifier: 4,
                effectType: 'critical-damage',
                valueAffected: 'melee',
                enabled: true
              }
            ]
          }
        }
      ];

      const modifiers = ModifierCollector.collectAllModifiers(actor, items);

      const rangedMods = modifiers.filter(m =>
        m.effectType === 'critical-damage' && m.valueAffected === 'ranged'
      );
      const meleeMods = modifiers.filter(m =>
        m.effectType === 'critical-damage' && m.valueAffected === 'melee'
      );

      expect(rangedMods).toHaveLength(1);
      expect(rangedMods[0].modifier).toBe(2);
      expect(meleeMods).toHaveLength(1);
      expect(meleeMods[0].modifier).toBe(4);
    });
  });
});
