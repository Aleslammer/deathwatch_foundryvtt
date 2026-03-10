import { jest } from '@jest/globals';
import '../setup.mjs';
import { DeathwatchItem } from '../../src/module/documents/item.mjs';

describe('DeathwatchItem - Ammunition Modifiers', () => {
  let mockActor;
  let mockWeapon;
  let mockAmmo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockActor = {
      items: {
        get: jest.fn()
      }
    };
  });

  describe('_applyAmmunitionModifiers', () => {
    it('should apply negative damage modifier from loaded ammo', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Reduction', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '1d10+5',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBe('1d10+5 -2');
    });

    it('should apply positive damage modifier from loaded ammo', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Bonus', modifier: '3', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '1d10',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBe('1d10 +3');
    });

    it('should stack multiple damage modifiers', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Mod 1', modifier: '-2', effectType: 'weapon-damage', enabled: true },
            { name: 'Mod 2', modifier: '-1', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '2d10+10',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBe('2d10+10 -3');
    });

    it('should ignore disabled modifiers', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Disabled', modifier: '-5', effectType: 'weapon-damage', enabled: false },
            { name: 'Enabled', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '1d10+5',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBe('1d10+5 -2');
    });

    it('should not set effectiveDamage when modifier is zero', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'No Effect', modifier: '0', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '1d10+5',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBeUndefined();
    });

    it('should handle no loaded ammo', () => {
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '1d10+5',
          loadedAmmo: null
        }
      });
      mockWeapon.actor = mockActor;
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBeUndefined();
    });

    it('should handle ammo with no modifiers array', () => {
      mockAmmo = {
        system: {}
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '1d10+5',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBeUndefined();
    });

    it('should handle weapon with no damage value', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Mod', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBeUndefined();
    });

    it('should ignore non-weapon-damage modifiers', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Range Mod', modifier: '10', effectType: 'weapon-range', enabled: true },
            { name: 'Damage Mod', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '1d10+5',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBe('1d10+5 -2');
    });

    it('should apply weapon-rof modifier from loaded ammo to heavy weapons', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Hellfire RoF', modifier: 'S/-/-', effectType: 'weapon-rof', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Heavy Bolter',
        type: 'weapon',
        system: {
          class: 'Heavy',
          rof: 'S/3/10',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveRof).toBe('S/-/-');
    });

    it('should not apply weapon-rof modifier to non-heavy weapons', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Hellfire RoF', modifier: 'S/-/-', effectType: 'weapon-rof', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          class: 'Basic',
          rof: 'S/3/-',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveRof).toBeUndefined();
    });

    it('should not set effectiveRof when no rof modifier', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Mod', modifier: '-2', effectType: 'weapon-damage', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          dmg: '1d10+5',
          rof: 'S/3/-',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveRof).toBeUndefined();
    });

    it('should apply both damage and rof modifiers to heavy weapons', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Damage Mod', modifier: '-2', effectType: 'weapon-damage', enabled: true },
            { name: 'RoF Mod', modifier: 'S/-/-', effectType: 'weapon-rof', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Heavy Bolter',
        type: 'weapon',
        system: {
          class: 'Heavy',
          dmg: '1d10+10',
          rof: 'S/3/10',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBe('1d10+10 -2');
      expect(mockWeapon.system.effectiveRof).toBe('S/-/-');
    });

    it('should apply blast modifier to heavy weapons', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Blast', modifier: '3', effectType: 'weapon-blast', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Heavy Bolter',
        type: 'weapon',
        system: {
          class: 'Heavy',
          dmg: '1d10+10',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveBlast).toBe(3);
    });

    it('should not apply blast modifier to non-heavy weapons', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Blast', modifier: '3', effectType: 'weapon-blast', enabled: true, weaponClass: 'heavy' }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: {
          class: 'Basic',
          dmg: '1d10+5',
          loadedAmmo: 'ammo123'
        }
      });
      mockWeapon.actor = mockActor;
      
      mockActor.items.get.mockReturnValue(mockAmmo);
      
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveBlast).toBeUndefined();
    });
  });
});
