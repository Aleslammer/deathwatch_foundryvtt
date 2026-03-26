import { jest } from '@jest/globals';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

describe('DeathwatchWeapon - Ammunition Modifiers', () => {
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActor = {
      items: { get: jest.fn() }
    };
  });

  function createWeapon(systemOverrides) {
    const weapon = new DeathwatchWeapon();
    Object.assign(weapon, { range: 0, dmg: '', damage: '', rof: '', class: '', attachedUpgrades: [], attachedQualities: [], loadedAmmo: null, penetration: 0, pen: 0, wt: 0, ...systemOverrides });
    weapon.parent = { actor: mockActor };
    return weapon;
  }

  describe('_applyAmmunitionModifiers', () => {
    it('should apply negative damage modifier from loaded ammo', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Reduction', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+5 -2');
    });

    it('should apply positive damage modifier from loaded ammo', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Bonus', modifier: '3', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +3');
    });

    it('should stack multiple damage modifiers', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Mod 1', modifier: '-2', effectType: 'weapon-damage', enabled: true },
            { name: 'Mod 2', modifier: '-1', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '2d10+10', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBe('2d10+10 -3');
    });

    it('should ignore disabled modifiers', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Disabled', modifier: '-5', effectType: 'weapon-damage', enabled: false },
            { name: 'Enabled', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+5 -2');
    });

    it('should not set effectiveDamage when modifier is zero', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'No Effect', modifier: '0', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should handle no loaded ammo', () => {
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: null });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should handle ammo with no modifiers array', () => {
      const mockAmmo = { system: {} };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should handle weapon with no damage value', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Mod', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should ignore non-weapon-damage modifiers', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Range Mod', modifier: '10', effectType: 'weapon-range', enabled: true },
            { name: 'Damage Mod', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+5 -2');
    });

    it('should apply weapon-rof modifier from loaded ammo to heavy weapons', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Hellfire RoF', modifier: 'S/-/-', effectType: 'weapon-rof', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ class: 'Heavy', rof: 'S/3/10', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveRof).toBe('S/-/-');
    });

    it('should not apply weapon-rof modifier to non-heavy weapons', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Hellfire RoF', modifier: 'S/-/-', effectType: 'weapon-rof', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ class: 'Basic', rof: 'S/3/-', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveRof).toBeUndefined();
    });

    it('should not set effectiveRof when no rof modifier', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Mod', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', rof: 'S/3/-', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveRof).toBeUndefined();
    });

    it('should apply both damage and rof modifiers to heavy weapons', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Mod', modifier: '-2', effectType: 'weapon-damage', enabled: true },
            { name: 'RoF Mod', modifier: 'S/-/-', effectType: 'weapon-rof', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ class: 'Heavy', dmg: '1d10+10', rof: 'S/3/10', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+10 -2');
      expect(weapon.effectiveRof).toBe('S/-/-');
    });

    it('should apply blast modifier to heavy weapons', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Blast', modifier: '3', effectType: 'weapon-blast', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ class: 'Heavy', dmg: '1d10+10', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveBlast).toBe(3);
    });

    it('should not apply blast modifier to non-heavy weapons', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Blast', modifier: '3', effectType: 'weapon-blast', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ class: 'Basic', dmg: '1d10+5', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveBlast).toBeUndefined();
    });
  });
});
