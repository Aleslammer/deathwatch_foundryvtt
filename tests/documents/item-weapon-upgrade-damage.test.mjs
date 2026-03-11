import { jest } from '@jest/globals';
import '../setup.mjs';
import { DeathwatchItem } from '../../src/module/documents/item.mjs';

describe('DeathwatchItem - Weapon Upgrade Damage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      const item = new DeathwatchItem({ 
        type: 'weapon',
        system: { dmg: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }
      }, { parent: mockActor });
      
      item.actor = mockActor;
      item._applyWeaponUpgradeModifiers();
      
      expect(item.system.effectiveDamage).toBe('2d10+6');
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
      const item = new DeathwatchItem({ 
        type: 'weapon',
        system: { dmg: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }
      }, { parent: mockActor });
      
      item.actor = mockActor;
      item._applyWeaponUpgradeModifiers();
      
      expect(item.system.effectiveDamage).toBeUndefined();
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
      const item = new DeathwatchItem({ 
        type: 'weapon',
        system: { dmg: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }
      }, { parent: mockActor });
      
      item.actor = mockActor;
      item._applyWeaponUpgradeModifiers();
      
      expect(item.system.effectiveDamage).toBeUndefined();
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
      const item = new DeathwatchItem({ 
        type: 'weapon',
        system: { dmg: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }
      }, { parent: mockActor });
      
      item.actor = mockActor;
      item._applyWeaponUpgradeModifiers();
      
      expect(item.system.effectiveDamage).toBe('2d10+6');
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
      const item = new DeathwatchItem({ 
        type: 'weapon',
        system: { dmg: '', attachedUpgrades: [{ id: 'upgrade001' }] }
      }, { parent: mockActor });
      
      item.actor = mockActor;
      item._applyWeaponUpgradeModifiers();
      
      expect(item.system.effectiveDamage).toBeUndefined();
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
      const item = new DeathwatchItem({ 
        type: 'weapon',
        system: { damage: '1d10+4', attachedUpgrades: [{ id: 'upgrade001' }] }
      }, { parent: mockActor });
      
      item.actor = mockActor;
      item._applyWeaponUpgradeModifiers();
      
      expect(item.system.effectiveDamage).toBe('2d10+6');
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
      const item = new DeathwatchItem({ 
        type: 'weapon',
        system: { dmg: '1d10+4', range: 100, attachedUpgrades: [{ id: 'u1' }, { id: 'u2' }] }
      }, { parent: mockActor });
      
      item.actor = mockActor;
      item._applyWeaponUpgradeModifiers();
      
      expect(item.system.effectiveDamage).toBe('2d10+6');
      expect(item.system.effectiveRange).toBe(70);
    });
  });
});
