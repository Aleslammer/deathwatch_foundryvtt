import { jest } from '@jest/globals';
import './setup.mjs';
import { WeaponUpgradeHelper } from '../src/module/helpers/weapon-upgrade-helper.mjs';

describe('WeaponUpgradeHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpgrades', () => {
    it('returns empty array when weapon has no upgrades', async () => {
      const weapon = { system: { attachedUpgrades: [] } };
      const result = await WeaponUpgradeHelper.getUpgrades(weapon);
      expect(result).toEqual([]);
    });

    it('returns upgrade items from actor', async () => {
      const mockUpgrade = { name: 'Red-Dot Laser Sight', system: { modifiers: [] } };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockUpgrade) } };
      const weapon = { 
        parent: mockActor,
        system: { attachedUpgrades: [{ id: 'upgrade001' }] } 
      };
      
      const result = await WeaponUpgradeHelper.getUpgrades(weapon);
      
      expect(result).toEqual([mockUpgrade]);
      expect(mockActor.items.get).toHaveBeenCalledWith('upgrade001');
    });
  });

  describe('getModifiers', () => {
    it('returns empty array when no upgrades', async () => {
      const weapon = { system: { attachedUpgrades: [] } };
      const result = await WeaponUpgradeHelper.getModifiers(weapon, true);
      expect(result).toEqual([]);
    });

    it('returns modifiers from upgrade', async () => {
      const mockUpgrade = { 
        name: 'Test Upgrade',
        system: { 
          singleShotOnly: false,
          modifiers: [{ name: 'BS Bonus', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true }]
        } 
      };
      jest.spyOn(WeaponUpgradeHelper, 'getUpgrades').mockResolvedValue([mockUpgrade]);
      
      const weapon = { system: { attachedUpgrades: [{ id: 'upgrade001' }] } };
      const result = await WeaponUpgradeHelper.getModifiers(weapon, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].modifier).toBe('10');
      expect(result[0].source).toBe('Test Upgrade');
    });

    it('returns range-multiplier modifiers', async () => {
      const mockUpgrade = { 
        name: 'Arm Weapon Mounting',
        system: { 
          singleShotOnly: false,
          modifiers: [{ name: 'Arm Weapon Mounting', modifier: '0.7', effectType: 'range-multiplier', enabled: true }]
        } 
      };
      jest.spyOn(WeaponUpgradeHelper, 'getUpgrades').mockResolvedValue([mockUpgrade]);
      
      const weapon = { system: { attachedUpgrades: [{ id: 'upgrade001' }] } };
      const result = await WeaponUpgradeHelper.getModifiers(weapon, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].modifier).toBe('0.7');
      expect(result[0].effectType).toBe('range-multiplier');
      expect(result[0].source).toBe('Arm Weapon Mounting');
    });

    it('skips single-shot-only upgrade when not single shot', async () => {
      const mockUpgrade = { 
        name: 'Test Upgrade',
        system: { 
          singleShotOnly: true,
          modifiers: [{ name: 'BS Bonus', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true }]
        } 
      };
      jest.spyOn(WeaponUpgradeHelper, 'getUpgrades').mockResolvedValue([mockUpgrade]);
      
      const weapon = { system: { attachedUpgrades: [{ id: 'upgrade001' }] } };
      const result = await WeaponUpgradeHelper.getModifiers(weapon, false);
      
      expect(result).toEqual([]);
    });

    it('applies single-shot-only upgrade when single shot', async () => {
      const mockUpgrade = { 
        name: 'Test Upgrade',
        system: { 
          singleShotOnly: true,
          modifiers: [{ name: 'BS Bonus', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true }]
        } 
      };
      jest.spyOn(WeaponUpgradeHelper, 'getUpgrades').mockResolvedValue([mockUpgrade]);
      
      const weapon = { system: { attachedUpgrades: [{ id: 'upgrade001' }] } };
      const result = await WeaponUpgradeHelper.getModifiers(weapon, true);
      
      expect(result).toHaveLength(1);
      expect(result[0].modifier).toBe('10');
    });

    it('combines multiple upgrade modifiers', async () => {
      const upgrades = [
        { 
          name: 'Upgrade 1',
          system: { 
            singleShotOnly: false,
            modifiers: [{ name: 'BS Bonus', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', enabled: true }]
          } 
        },
        { 
          name: 'Upgrade 2',
          system: { 
            singleShotOnly: false,
            modifiers: [{ name: 'Damage Bonus', modifier: '2', effectType: 'damage', enabled: true }]
          } 
        }
      ];
      jest.spyOn(WeaponUpgradeHelper, 'getUpgrades').mockResolvedValue(upgrades);
      
      const weapon = { system: { attachedUpgrades: [{ id: 'u1' }, { id: 'u2' }] } };
      const result = await WeaponUpgradeHelper.getModifiers(weapon, false);
      
      expect(result).toHaveLength(2);
      expect(result[0].source).toBe('Upgrade 1');
      expect(result[1].source).toBe('Upgrade 2');
    });
  });
  describe('hasUpgrade', () => {
    it('returns true when weapon has upgrade with matching key', async () => {
      const mockUpgrade = { name: 'Telescopic Sight', system: { key: 'telescopic-sight' } };
      jest.spyOn(WeaponUpgradeHelper, 'getUpgrades').mockResolvedValue([mockUpgrade]);
      
      const weapon = { system: { attachedUpgrades: [{ id: 'upgrade001' }] } };
      const result = await WeaponUpgradeHelper.hasUpgrade(weapon, 'telescopic-sight');
      
      expect(result).toBe(true);
    });

    it('returns false when weapon does not have upgrade with matching key', async () => {
      const mockUpgrade = { name: 'Red-Dot Laser Sight', system: { key: 'red-dot-laser-sight' } };
      jest.spyOn(WeaponUpgradeHelper, 'getUpgrades').mockResolvedValue([mockUpgrade]);
      
      const weapon = { system: { attachedUpgrades: [{ id: 'upgrade001' }] } };
      const result = await WeaponUpgradeHelper.hasUpgrade(weapon, 'telescopic-sight');
      
      expect(result).toBe(false);
    });

    it('returns false when weapon has no upgrades', async () => {
      jest.spyOn(WeaponUpgradeHelper, 'getUpgrades').mockResolvedValue([]);
      
      const weapon = { system: { attachedUpgrades: [] } };
      const result = await WeaponUpgradeHelper.hasUpgrade(weapon, 'telescopic-sight');
      
      expect(result).toBe(false);
    });
  });
});
