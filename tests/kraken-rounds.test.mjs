import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchItem } from '../src/module/documents/item.mjs';

describe('Ammunition Penetration Modifiers', () => {
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

  describe('weapon-penetration (override with minimum)', () => {
    it('sets penetration to 8 when base is 4', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Kraken', modifier: '8', effectType: 'weapon-penetration', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: { dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' }
      }, { parent: mockActor });
      
      mockWeapon.actor = mockActor;
      mockActor.items.get.mockReturnValue(mockAmmo);
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectivePenetration).toBe(8);
    });

    it('keeps base penetration when higher than override', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Kraken', modifier: '8', effectType: 'weapon-penetration', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Heavy Bolter',
        type: 'weapon',
        system: { dmg: '2d10', pen: 10, range: 150, rof: '-/-/6', loadedAmmo: 'ammo123' }
      }, { parent: mockActor });
      
      mockWeapon.actor = mockActor;
      mockActor.items.get.mockReturnValue(mockAmmo);
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectivePenetration).toBe(10);
    });
  });

  describe('weapon-penetration-modifier (additive with minimum 0)', () => {
    it('reduces penetration by 2', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Metal Storm', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: { dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' }
      }, { parent: mockActor });
      
      mockWeapon.actor = mockActor;
      mockActor.items.get.mockReturnValue(mockAmmo);
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectivePenetration).toBe(2);
    });

    it('clamps to minimum 0', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Metal Storm', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: { dmg: '1d10+5', pen: 1, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' }
      }, { parent: mockActor });
      
      mockWeapon.actor = mockActor;
      mockActor.items.get.mockReturnValue(mockAmmo);
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectivePenetration).toBe(0);
    });
  });

  describe('Metal Storm Rounds', () => {
    it('reduces damage by 2, penetration by 2, and adds Blast(2)', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Metal Storm Damage', modifier: '-2', effectType: 'weapon-damage', enabled: true },
            { name: 'Metal Storm Pen', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true },
            { name: 'Metal Storm Blast', modifier: '2', effectType: 'weapon-blast', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: { dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' }
      }, { parent: mockActor });
      
      mockWeapon.actor = mockActor;
      mockActor.items.get.mockReturnValue(mockAmmo);
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectiveDamage).toBe('1d10+5 -2');
      expect(mockWeapon.system.effectivePenetration).toBe(2);
      expect(mockWeapon.system.effectiveBlast).toBe(2);
    });
  });

  describe('combined with range modifier', () => {
    it('applies both Kraken penetration and range', () => {
      mockAmmo = {
        system: {
          modifiers: [
            { name: 'Kraken Pen', modifier: '8', effectType: 'weapon-penetration', enabled: true },
            { name: 'Kraken Range', modifier: 'x1.5', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      
      mockWeapon = new DeathwatchItem({
        name: 'Bolter',
        type: 'weapon',
        system: { dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' }
      }, { parent: mockActor });
      
      mockWeapon.actor = mockActor;
      mockActor.items.get.mockReturnValue(mockAmmo);
      mockWeapon._applyAmmunitionModifiers();
      
      expect(mockWeapon.system.effectivePenetration).toBe(8);
      expect(mockWeapon.system.effectiveRange).toBe(150);
    });
  });
});
