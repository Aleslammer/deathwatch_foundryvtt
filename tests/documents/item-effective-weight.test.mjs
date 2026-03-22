import { jest } from '@jest/globals';
import '../setup.mjs';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

describe('DeathwatchWeapon - Effective Weight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createWeapon(systemOverrides, actor) {
    const weapon = new DeathwatchWeapon();
    Object.assign(weapon, { range: 0, dmg: '', damage: '', attachedUpgrades: [], wt: 0, ...systemOverrides });
    weapon.parent = { actor };
    return weapon;
  }

  describe('_applyWeaponUpgradeModifiers - weight', () => {
    it('sets effectiveWeight with multiplicative modifier (x0.5)', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Suspensor', modifier: 'x0.5', effectType: 'weapon-weight', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ wt: 10, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveWeight).toBe(5);
    });

    it('applies additive modifier (-2)', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Weight Reduction', modifier: '-2', effectType: 'weapon-weight', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ wt: 10, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveWeight).toBe(8);
    });

    it('applies both additive and multiplicative modifiers', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Weight Reduction', modifier: '-2', effectType: 'weapon-weight', enabled: true },
            { name: 'Weight Multiplier', modifier: 'x0.5', effectType: 'weapon-weight', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ wt: 10, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      // (10 - 2) * 0.5 = 4
      expect(weapon.effectiveWeight).toBe(4);
    });

    it('clamps result to minimum 0', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Heavy Reduction', modifier: '-20', effectType: 'weapon-weight', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ wt: 10, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveWeight).toBe(0);
    });

    it('handles zero weight', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Suspensor', modifier: 'x0.5', effectType: 'weapon-weight', enabled: true }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ wt: 0, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      expect(weapon.effectiveWeight).toBeUndefined();
    });

    it('ignores disabled weight modifiers', () => {
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Disabled', modifier: 'x0.5', effectType: 'weapon-weight', enabled: false }
          ]
        }
      };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = createWeapon({ wt: 10, attachedUpgrades: [{ id: 'upgrade001' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      // Should be base weight since modifier is disabled
      expect(weapon.effectiveWeight).toBe(10);
    });

    it('handles multiple weight upgrades', () => {
      const mockUpgrade1 = {
        system: {
          modifiers: [
            { name: 'Reduction', modifier: '-1', effectType: 'weapon-weight', enabled: true }
          ]
        }
      };
      const mockUpgrade2 = {
        system: {
          modifiers: [
            { name: 'Suspensor', modifier: 'x0.5', effectType: 'weapon-weight', enabled: true }
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
      const weapon = createWeapon({ wt: 10, attachedUpgrades: [{ id: 'u1' }, { id: 'u2' }] }, mockActor);

      weapon._applyWeaponUpgradeModifiers();

      // (10 - 1) * 0.5 = 4.5
      expect(weapon.effectiveWeight).toBe(4.5);
    });
  });
});
