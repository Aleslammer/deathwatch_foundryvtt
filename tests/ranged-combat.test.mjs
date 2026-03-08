import { jest } from '@jest/globals';
import './setup.mjs';
import { RangedCombatHelper } from '../src/module/helpers/ranged-combat.mjs';
import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from '../src/module/helpers/constants.mjs';

describe('RangedCombatHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateThrownWeaponRange', () => {
    it('should calculate range for thrown weapon with SBx3', () => {
      const weapon = { system: { class: 'Thrown', range: 'SBx3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(12);
    });

    it('should calculate range for thrown weapon with SBx2', () => {
      const weapon = { system: { class: 'Thrown', range: 'SBx2' } };
      const actor = { system: { characteristics: { str: { mod: 5 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(10);
    });

    it('should return null for non-thrown weapon', () => {
      const weapon = { system: { class: 'Basic', range: 'SBx3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBeNull();
    });

    it('should return null if range does not match SBx pattern', () => {
      const weapon = { system: { class: 'Thrown', range: '100' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBeNull();
    });

    it('should handle missing strength bonus', () => {
      const weapon = { system: { class: 'Thrown', range: 'SBx3' } };
      const actor = { system: { characteristics: { str: {} } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(0);
    });

    it('should handle case insensitive class check', () => {
      const weapon = { system: { class: 'THROWN', range: 'SBx3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(12);
    });

    it('should handle case insensitive range pattern', () => {
      const weapon = { system: { class: 'Thrown', range: 'sbx3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(12);
    });

    it('should handle spaces in range pattern', () => {
      const weapon = { system: { class: 'Thrown', range: 'SB x 3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(12);
    });
  });

  describe('attackDialog', () => {
    it('should be defined', () => {
      expect(RangedCombatHelper.attackDialog).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof RangedCombatHelper.attackDialog).toBe('function');
    });
  });
});
