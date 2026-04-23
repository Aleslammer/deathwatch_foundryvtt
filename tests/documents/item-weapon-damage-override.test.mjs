import { jest } from '@jest/globals';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

describe('DeathwatchWeapon - weapon-damage-override effect type', () => {
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActor = {
      items: new Map()
    };
  });

  function createWeapon(systemOverrides) {
    const weapon = new DeathwatchWeapon();
    Object.assign(weapon, {
      range: 0,
      dmg: '',
      damage: '',
      rof: '',
      class: '',
      attachedUpgrades: [],
      attachedQualities: [],
      loadedAmmo: null,
      penetration: 0,
      pen: 0,
      wt: 0,
      ...systemOverrides
    });
    weapon.parent = {
      actor: mockActor,
      system: weapon
    };
    return weapon;
  }

  describe('Ammunition with weapon-damage-override', () => {
    it('should completely replace weapon damage with ammo damage formula', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Missile Override', modifier: '2d10', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '0', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('2d10');
    });

    it('should handle complex damage formulas with bonuses', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Krak Missile', modifier: '3d10+10', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '0', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('3d10+10');
    });

    it('should replace non-zero weapon damage', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Override', modifier: '2d10+6', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('2d10+6');
    });

    it('should ignore disabled weapon-damage-override modifiers', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Disabled', modifier: '2d10', effectType: 'weapon-damage-override', enabled: false }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should use last override when multiple exist', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'First', modifier: '1d10', effectType: 'weapon-damage-override', enabled: true },
            { name: 'Second', modifier: '3d10+10', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '0', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('3d10+10');
    });

    it('should work with weapon-damage-override AND weapon-damage together', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Override', modifier: '2d10', effectType: 'weapon-damage-override', enabled: true },
            { name: 'Additive', modifier: '+5', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '0', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      // Override takes precedence, then additive is applied to the result
      expect(weapon.effectiveDamage).toBe('2d10 +5');
    });

    it('should not set effectiveDamage for empty modifier string', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Empty', modifier: '', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '1d10', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });
  });

  describe('Weapon Upgrades with weapon-damage-override', () => {
    it('should completely replace weapon damage with upgrade damage formula', () => {
      const upgradeId = 'upgrade123';
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Brain Leech Worms', modifier: '2d10+6', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      mockActor.items.set(upgradeId, mockUpgrade);
      const weapon = createWeapon({ dmg: '1d10+4', attachedUpgrades: [upgradeId] });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('2d10+6');
    });

    it('should ignore disabled weapon-damage-override in upgrades', () => {
      const upgradeId = 'upgrade123';
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Disabled', modifier: '2d10+6', effectType: 'weapon-damage-override', enabled: false }
          ]
        }
      };
      mockActor.items.set(upgradeId, mockUpgrade);
      const weapon = createWeapon({ dmg: '1d10+4', attachedUpgrades: [upgradeId] });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should use last override when multiple upgrades have overrides', () => {
      const upgradeId1 = 'u1';
      const upgradeId2 = 'u2';
      const mockUpgrade1 = {
        system: {
          modifiers: [
            { name: 'First Override', modifier: '1d10+2', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      const mockUpgrade2 = {
        system: {
          modifiers: [
            { name: 'Second Override', modifier: '2d10+6', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      mockActor.items.set(upgradeId1, mockUpgrade1);
      mockActor.items.set(upgradeId2, mockUpgrade2);
      const weapon = createWeapon({ dmg: '1d10+4', attachedUpgrades: [upgradeId1, upgradeId2] });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('2d10+6');
    });

    it('should not set effectiveDamage when weapon has no base damage', () => {
      const upgradeId = 'upgrade123';
      const mockUpgrade = {
        system: {
          modifiers: [
            { name: 'Override', modifier: '2d10+6', effectType: 'weapon-damage-override', enabled: true }
          ]
        }
      };
      mockActor.items.set(upgradeId, mockUpgrade);
      const weapon = createWeapon({ dmg: '', attachedUpgrades: [upgradeId] });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });
  });

  describe('Backwards Compatibility', () => {
    it('should preserve additive behavior for numeric weapon-damage in ammunition', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Metal Storm', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+5 -2');
    });

    it('should preserve additive behavior for positive numeric weapon-damage', () => {
      const ammoId = 'ammo123';
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Bonus', modifier: '3', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.set(ammoId, mockAmmo);
      const weapon = createWeapon({ dmg: '1d10', loadedAmmo: ammoId });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +3');
    });
  });
});
