// tests/combat/weapon-modifier-collector.test.mjs
import { WeaponModifierCollector } from '../../src/module/helpers/combat/weapon-modifier-collector.mjs';

describe('WeaponModifierCollector', () => {
  describe('collectWeaponModifiers', () => {
    it('should collect modifiers from weapon', () => {
      const weapon = {
        system: {
          modifiers: [
            { name: 'Damage Bonus', modifier: '5', effectType: 'weapon-damage', enabled: true }
          ],
          attachedUpgrades: [],
          loadedAmmo: null
        }
      };
      const actor = { items: new Map() };
      const context = {};

      const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, context);

      expect(result.damage).toHaveLength(1);
      expect(result.damage[0].name).toBe('Damage Bonus');
    });

    it('should collect modifiers from weapon upgrades', () => {
      const upgradeId = 'upgrade123';
      const weapon = {
        system: {
          modifiers: [],
          attachedUpgrades: [upgradeId],
          loadedAmmo: null
        }
      };
      const upgrade = {
        name: 'Red Dot Sight',
        system: {
          modifiers: [
            { name: 'BS Bonus', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true }
          ]
        }
      };
      const actor = {
        items: new Map([[upgradeId, upgrade]])
      };
      const context = {};

      const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, context);

      expect(result.characteristic).toHaveLength(1);
      expect(result.characteristic[0].name).toBe('BS Bonus');
      expect(result.characteristic[0].source).toBe('Red Dot Sight');
    });

    it('should filter upgrade modifiers by context (singleShotOnly)', () => {
      const upgradeId = 'red-dot';
      const weapon = {
        system: {
          modifiers: [],
          attachedUpgrades: [upgradeId],
          loadedAmmo: null
        }
      };
      const upgrade = {
        name: 'Red Dot Sight',
        system: {
          modifiers: [
            { name: 'Single-Shot BS', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true, singleShotOnly: true }
          ]
        }
      };
      const actor = {
        items: new Map([[upgradeId, upgrade]])
      };

      // Auto-fire - should NOT collect modifier
      let result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, { isSingleShot: false, isAutoFire: true });
      expect(result.characteristic).toHaveLength(0);

      // Single shot - SHOULD collect modifier
      result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, { isSingleShot: true, isAutoFire: false });
      expect(result.characteristic).toHaveLength(1);
      expect(result.characteristic[0].name).toBe('Single-Shot BS');
    });

    it('should filter upgrade modifiers by context (requiresAutoFire)', () => {
      const upgradeId = 'motion-pred';
      const weapon = {
        system: {
          modifiers: [],
          attachedUpgrades: [upgradeId],
          loadedAmmo: null
        }
      };
      const upgrade = {
        name: 'Motion Predictor',
        system: {
          modifiers: [
            { name: 'Auto-Fire BS', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true, requiresAutoFire: true }
          ]
        }
      };
      const actor = {
        items: new Map([[upgradeId, upgrade]])
      };

      // Single shot - should NOT collect modifier
      let result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, { isSingleShot: true, isAutoFire: false });
      expect(result.characteristic).toHaveLength(0);

      // Auto-fire - SHOULD collect modifier
      result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, { isSingleShot: false, isAutoFire: true });
      expect(result.characteristic).toHaveLength(1);
      expect(result.characteristic[0].name).toBe('Auto-Fire BS');
    });

    describe('ammunition modifiers', () => {
      it('should collect righteous fury threshold from ammo', () => {
        const ammoId = 'ammo123';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: ammoId
          }
        };
        const ammo = {
          name: 'Kraken Rounds',
          system: {
            modifiers: [
              { name: 'Fury Threshold', modifier: '9', effectType: 'righteous-fury-threshold', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([[ammoId, ammo]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.righteousFury).toHaveLength(1);
        expect(result.righteousFury[0].modifier).toBe('9');
        expect(result.righteousFury[0].source).toBe('Kraken Rounds');
      });

      it('should collect magnitude bonus damage from ammo', () => {
        const ammoId = 'ammo456';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: ammoId
          }
        };
        const ammo = {
          name: 'Metal Storm Rounds',
          system: {
            modifiers: [
              { name: 'Magnitude Bonus', modifier: '1', effectType: 'magnitude-bonus-damage', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([[ammoId, ammo]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.magnitudeBonus).toHaveLength(1);
        expect(result.magnitudeBonus[0].modifier).toBe('1');
      });

      it('should collect characteristic damage from ammo', () => {
        const ammoId = 'ammo789';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: ammoId
          }
        };
        const ammo = {
          name: 'Toxin Rounds',
          system: {
            modifiers: [
              { name: 'Toxin', modifier: '1d10', effectType: 'characteristic-damage', valueAffected: 'tg', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([[ammoId, ammo]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.characteristicDamage).not.toBeNull();
        expect(result.characteristicDamage.formula).toBe('1d10');
        expect(result.characteristicDamage.characteristic).toBe('tg');
        expect(result.characteristicDamage.name).toBe('Toxin');
      });

      it('should collect ignores natural armor flag from ammo', () => {
        const ammoId = 'ammo999';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: ammoId
          }
        };
        const ammo = {
          name: 'Kraken Rounds',
          system: {
            modifiers: [
              { name: 'Ignores Natural Armor', modifier: '', effectType: 'ignores-natural-armour', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([[ammoId, ammo]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.ignoresNaturalArmor).toBe(true);
      });

      it('should collect premature detonation threshold from ammo', () => {
        const ammoId = 'plasma-cell';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: ammoId
          }
        };
        const ammo = {
          name: 'Plasma Cell',
          system: {
            modifiers: [
              { name: 'Volatile', modifier: '95', effectType: 'premature-detonation', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([[ammoId, ammo]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.prematureDetonation.threshold).toBe(95);
        expect(result.prematureDetonation.source).toBe('Plasma Cell');
      });

      it('should collect weapon-damage-override from ammo', () => {
        const ammoId = 'missile-frag';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: ammoId
          }
        };
        const ammo = {
          name: 'Frag Missile',
          system: {
            modifiers: [
              { name: 'Missile Damage', modifier: '2d10+10', effectType: 'weapon-damage-override', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([[ammoId, ammo]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.damageOverride).not.toBeNull();
        expect(result.damageOverride.formula).toBe('2d10+10');
        expect(result.damageOverride.name).toBe('Missile Damage');
        expect(result.damageOverride.source).toBe('Frag Missile');
      });

      it('should ignore disabled weapon-damage-override modifiers', () => {
        const ammoId = 'disabled-override';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: ammoId
          }
        };
        const ammo = {
          name: 'Disabled Ammo',
          system: {
            modifiers: [
              { name: 'Override', modifier: '3d10', effectType: 'weapon-damage-override', enabled: false }
            ]
          }
        };
        const actor = {
          items: new Map([[ammoId, ammo]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.damageOverride).toBeNull();
      });

      it('should use last weapon-damage-override when multiple exist in same source', () => {
        const ammoId = 'multi-override';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: ammoId
          }
        };
        const ammo = {
          name: 'Multi Override',
          system: {
            modifiers: [
              { name: 'First', modifier: '1d10', effectType: 'weapon-damage-override', enabled: true },
              { name: 'Second', modifier: '3d10', effectType: 'weapon-damage-override', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([[ammoId, ammo]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        // Last one wins (matches legacy behavior)
        expect(result.damageOverride.formula).toBe('3d10');
        expect(result.damageOverride.name).toBe('Second');
      });
    });

    describe('weapon upgrades with weapon-damage-override', () => {
      it('should collect weapon-damage-override from upgrades', () => {
        const upgradeId = 'brain-leech';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [upgradeId],
            loadedAmmo: null
          }
        };
        const upgrade = {
          name: 'Brain Leech Worms',
          system: {
            modifiers: [
              { name: 'Brain Leech', modifier: '2d10+6', effectType: 'weapon-damage-override', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([[upgradeId, upgrade]])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.damageOverride).not.toBeNull();
        expect(result.damageOverride.formula).toBe('2d10+6');
        expect(result.damageOverride.source).toBe('Brain Leech Worms');
      });

      it('should prioritize ammo override over upgrade override', () => {
        const upgradeId = 'upgrade-override';
        const ammoId = 'ammo-override';
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [upgradeId],
            loadedAmmo: ammoId
          }
        };
        const upgrade = {
          name: 'Upgrade Override',
          system: {
            modifiers: [
              { name: 'Upgrade', modifier: '1d10', effectType: 'weapon-damage-override', enabled: true }
            ]
          }
        };
        const ammo = {
          name: 'Ammo Override',
          system: {
            modifiers: [
              { name: 'Ammo', modifier: '3d10', effectType: 'weapon-damage-override', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([
            [upgradeId, upgrade],
            [ammoId, ammo]
          ])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        // Ammo should take priority (loaded ammo processed last)
        expect(result.damageOverride.formula).toBe('3d10');
        expect(result.damageOverride.source).toBe('Ammo Override');
      });
    });

    describe('edge cases', () => {
      it('should handle weapon with no modifiers array', () => {
        const weapon = {
          system: {
            attachedUpgrades: [],
            loadedAmmo: null
          }
        };
        const actor = { items: new Map() };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.damage).toHaveLength(0);
        expect(result.characteristic).toHaveLength(0);
      });

      it('should skip disabled modifiers', () => {
        const weapon = {
          system: {
            modifiers: [
              { name: 'Enabled', modifier: '5', effectType: 'weapon-damage', enabled: true },
              { name: 'Disabled', modifier: '10', effectType: 'weapon-damage', enabled: false }
            ],
            attachedUpgrades: [],
            loadedAmmo: null
          }
        };
        const actor = { items: new Map() };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.damage).toHaveLength(1);
        expect(result.damage[0].name).toBe('Enabled');
      });

      it('should handle missing actor.items', () => {
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: ['upgrade123'],
            loadedAmmo: 'ammo456'
          }
        };
        const actor = {};

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result).toBeDefined();
        expect(result.damage).toHaveLength(0);
      });

      it('should handle upgrade not found in actor.items', () => {
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: ['missing-upgrade'],
            loadedAmmo: null
          }
        };
        const actor = { items: new Map() };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.characteristic).toHaveLength(0);
      });

      it('should handle ammo not found in actor.items', () => {
        const weapon = {
          system: {
            modifiers: [],
            attachedUpgrades: [],
            loadedAmmo: 'missing-ammo'
          }
        };
        const actor = { items: new Map() };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.righteousFury).toHaveLength(0);
      });

      it('should collect from multiple sources simultaneously', () => {
        const upgradeId = 'scope';
        const ammoId = 'kraken';
        const weapon = {
          name: 'Boltgun',
          system: {
            modifiers: [
              { name: 'Base Damage', modifier: '2', effectType: 'weapon-damage', enabled: true }
            ],
            attachedUpgrades: [upgradeId],
            loadedAmmo: ammoId
          }
        };
        const upgrade = {
          name: 'Scope',
          system: {
            modifiers: [
              { name: 'Scope BS', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true }
            ]
          }
        };
        const ammo = {
          name: 'Kraken',
          system: {
            modifiers: [
              { name: 'Kraken Pen', modifier: '6', effectType: 'weapon-penetration', enabled: true }
            ]
          }
        };
        const actor = {
          items: new Map([
            [upgradeId, upgrade],
            [ammoId, ammo]
          ])
        };

        const result = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

        expect(result.damage).toHaveLength(1);
        expect(result.damage[0].source).toBe('Boltgun');
        expect(result.characteristic).toHaveLength(1);
        expect(result.characteristic[0].source).toBe('Scope');
        expect(result.penetration).toHaveLength(1);
        expect(result.penetration[0].source).toBe('Kraken');
      });
    });
  });
});
