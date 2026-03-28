import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';

describe('Power Fist Strength Bonus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildDamageFormula', () => {
    it('should double strength bonus for power fist', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10', degreesOfSuccess: 0, isMelee: true, strBonus: 10, hitIndex: 0, isPowerFist: true });
      expect(formula).toBe('2d10 + 20');
    });

    it('should double strength bonus for chainfist', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10', degreesOfSuccess: 0, isMelee: true, strBonus: 10, hitIndex: 0, isPowerFist: true });
      expect(formula).toBe('2d10 + 20');
    });

    it('should not double strength bonus for regular melee weapons', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 0, isMelee: true, strBonus: 10, hitIndex: 0, isPowerFist: false });
      expect(formula).toBe('1d10 + 10');
    });

    it('should handle negative strength bonus with power fist', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10', degreesOfSuccess: 0, isMelee: true, strBonus: -5, hitIndex: 0, isPowerFist: true });
      expect(formula).toBe('2d10 + -10');
    });

    it('should not apply strength bonus to ranged weapons even if isPowerFist is true', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 0, isMelee: false, strBonus: 10, hitIndex: 0, isPowerFist: true });
      expect(formula).toBe('1d10');
    });

    it('should combine power fist bonus with degrees of success', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10', degreesOfSuccess: 3, isMelee: true, strBonus: 10, hitIndex: 0, isPowerFist: true });
      expect(formula).toBe('2d10min3 + 20');
    });

    it('should combine power fist bonus with tearing', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10', degreesOfSuccess: 0, isMelee: true, strBonus: 10, hitIndex: 0, isTearing: true, isPowerFist: true });
      expect(formula).toBe('3d10dl1 + 20');
    });

    it('should combine power fist bonus with proven rating', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10', degreesOfSuccess: 0, isMelee: true, strBonus: 10, hitIndex: 0, provenRating: 3, isPowerFist: true });
      expect(formula).toBe('2d10min3 + 20');
    });

    it('should handle zero strength bonus with power fist', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10', degreesOfSuccess: 0, isMelee: true, strBonus: 0, hitIndex: 0, isPowerFist: true });
      expect(formula).toBe('2d10');
    });

    it('should triple strength bonus for Space Marine with power fist (SB 10 becomes 30)', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10', degreesOfSuccess: 0, isMelee: true, strBonus: 15, hitIndex: 0, isPowerFist: true });
      expect(formula).toBe('2d10 + 30');
    });
  });
});
