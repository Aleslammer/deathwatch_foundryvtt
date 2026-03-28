import { jest } from '@jest/globals';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

describe('DeathwatchWeapon - Effective Range', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createWeapon(systemOverrides, actor) {
    const weapon = new DeathwatchWeapon();
    Object.assign(weapon, { range: 0, dmg: '', damage: '', attachedUpgrades: [], wt: 0, ...systemOverrides });
    weapon.parent = { actor };
    return weapon;
  }

  describe('_applyWeaponUpgradeModifiers', () => {
    it('sets effectiveRange to range when no upgrades', () => {
      const mockActor = { items: { get: jest.fn() } };
      const weapon = createWeapon({ range: 100, attachedUpgrades: [] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveRange).toBe(100);
    });

    it('applies multiplicative modifier (x0.7)', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Range Reduction', modifier: 'x0.7', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ range: 100, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveRange).toBe(70);
    });

    it('applies additive modifier (+10)', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Range Bonus', modifier: '10', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ range: 100, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveRange).toBe(110);
    });

    it('applies both additive and multiplicative modifiers', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Range Bonus', modifier: '10', effectType: 'weapon-range', enabled: true },
            { name: 'Range Multiplier', modifier: 'x0.5', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ range: 100, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      // (100 + 10) * 0.5 = 55
      expect(weapon.effectiveRange).toBe(55);
    });

    it('handles multiple upgrades', () => {
      const mockUpgrade1 = {
        system: {
          modifiers: [
            { name: 'Bonus 1', modifier: '20', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      const mockUpgrade2 = {
        system: {
          modifiers: [
            { name: 'Multiplier', modifier: 'x0.8', effectType: 'weapon-range', enabled: true }
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
      const weapon = createWeapon({ range: 100, attachedUpgrades: [{ id: 'u1' }, { id: 'u2' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      // (100 + 20) * 0.8 = 96
      expect(weapon.effectiveRange).toBe(96);
    });

    it('ignores disabled modifiers', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Disabled', modifier: 'x0.5', effectType: 'weapon-range', enabled: false }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ range: 100, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveRange).toBe(100);
    });

    it('handles non-numeric range values', () => {
      const mockActor = { items: { get: jest.fn() } };
      const weapon = createWeapon({ range: 'SBx3', attachedUpgrades: [] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveRange).toBe('SBx3');
    });

    it('handles zero range', () => {
      const mockActor = { items: { get: jest.fn() } };
      const weapon = createWeapon({ range: 0, attachedUpgrades: [] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveRange).toBe(0);
    });

    it('floors the result', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Multiplier', modifier: 'x0.7', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ range: 101, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      // 101 * 0.7 = 70.7, floored to 70
      expect(weapon.effectiveRange).toBe(70);
    });
  });
});
