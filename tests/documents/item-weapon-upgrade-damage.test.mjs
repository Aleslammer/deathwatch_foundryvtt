import { jest } from '@jest/globals';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

describe('DeathwatchWeapon - Weapon Upgrade Damage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createWeapon(systemOverrides, actor) {
    const weapon = new DeathwatchWeapon();
    Object.assign(weapon, { range: 0, dmg: '', damage: '', attachedUpgrades: [], wt: 0, ...systemOverrides });
    weapon.parent = { actor };
    return weapon;
  }

  describe('_applyWeaponUpgradeModifiers - weapon-damage', () => {
    it('overrides weapon damage with upgrade modifier', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Brain Leech Worms', modifier: '2d10+6', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ dmg: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveDamage).toBe('2d10+6');
    });

    it('does not set effectiveDamage when no weapon-damage modifier', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Range Mod', modifier: '10', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ dmg: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('ignores disabled weapon-damage modifier', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Disabled', modifier: '2d10+6', effectType: 'weapon-damage', enabled: false }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ dmg: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('uses last weapon-damage modifier when multiple exist', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'First', modifier: '1d10+2', effectType: 'weapon-damage', enabled: true },
            { name: 'Second', modifier: '2d10+6', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ dmg: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveDamage).toBe('2d10+6');
    });

    it('does not set effectiveDamage when weapon has no base damage', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Damage', modifier: '2d10+6', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ dmg: '', attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('works with damage field instead of dmg', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Brain Leech Worms', modifier: '2d10+6', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ damage: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveDamage).toBe('2d10+6');
    });

    it('handles multiple upgrades with different modifier types', () => {
      const mockUpgrade1 = {
        system: {
          modifiers: [
            { name: 'Damage Override', modifier: '2d10+6', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      const mockUpgrade2 = {
        system: {
          modifiers: [
            { name: 'Range Mod', modifier: 'x0.7', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      const mockActor = {
        items: {
          get: jest.fn()
            .mockReturnValueOnce(mockUpgrade1)
            .mockReturnValueOnce(mockUpgrade2)
        }
      };
      const weapon = createWeapon({ dmg: '1d10+4', range: 100, attachedUpgrades: [{ id: 'u1' }, { id: 'u2' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveDamage).toBe('2d10+6');
      expect(weapon.effectiveRange).toBe(70);
    });
  });
});
