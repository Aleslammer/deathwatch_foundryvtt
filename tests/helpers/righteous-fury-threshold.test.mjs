import { jest } from '@jest/globals';
import { RighteousFuryHelper } from '../../src/module/helpers/righteous-fury-helper.mjs';
import { CombatHelper } from '../../src/module/helpers/combat.mjs';

describe('Righteous Fury Threshold', () => {
  describe('RighteousFuryHelper.hasNaturalTen', () => {
    it('should trigger on 10 with default threshold', () => {
      const mockRoll = {
        dice: [{
          faces: 10,
          results: [{ result: 10 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(mockRoll, 10)).toBe(true);
    });

    it('should trigger on 9 with threshold 9', () => {
      const mockRoll = {
        dice: [{
          faces: 10,
          results: [{ result: 9 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(mockRoll, 9)).toBe(true);
    });

    it('should not trigger on 8 with threshold 9', () => {
      const mockRoll = {
        dice: [{
          faces: 10,
          results: [{ result: 8 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(mockRoll, 9)).toBe(false);
    });

    it('should trigger on 10 with threshold 9', () => {
      const mockRoll = {
        dice: [{
          faces: 10,
          results: [{ result: 10 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(mockRoll, 9)).toBe(true);
    });
  });

  describe('CombatHelper._getFuryThreshold', () => {
    it('should return 10 when no ammo loaded', () => {
      const mockWeapon = { system: { loadedAmmo: null } };
      const mockActor = { items: { get: jest.fn() } };
      expect(CombatHelper._getFuryThreshold(mockWeapon, mockActor)).toBe(10);
    });

    it('should return 10 when ammo has no modifiers', () => {
      const mockAmmo = { system: {} };
      const mockWeapon = { system: { loadedAmmo: 'ammo123' } };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockAmmo) } };
      expect(CombatHelper._getFuryThreshold(mockWeapon, mockActor)).toBe(10);
    });

    it('should return 9 when ammo has righteous-fury-threshold modifier', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Hellfire Fury', modifier: '9', effectType: 'righteous-fury-threshold', enabled: true }
          ]
        }
      };
      const mockWeapon = { system: { loadedAmmo: 'ammo123' } };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockAmmo) } };
      expect(CombatHelper._getFuryThreshold(mockWeapon, mockActor)).toBe(9);
    });

    it('should ignore disabled modifiers', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Disabled', modifier: '8', effectType: 'righteous-fury-threshold', enabled: false }
          ]
        }
      };
      const mockWeapon = { system: { loadedAmmo: 'ammo123' } };
      const mockActor = { items: { get: jest.fn().mockReturnValue(mockAmmo) } };
      expect(CombatHelper._getFuryThreshold(mockWeapon, mockActor)).toBe(10);
    });
  });
});
