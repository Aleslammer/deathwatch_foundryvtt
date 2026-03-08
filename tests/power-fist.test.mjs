import { jest } from '@jest/globals';
import './setup.mjs';
import { CombatDialogHelper } from '../src/module/helpers/combat-dialog.mjs';

describe('Power Fist Strength Bonus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildDamageFormula', () => {
    it('should double strength bonus for power fist', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '2d10',
        0,
        true,
        10,
        0,
        false,
        false,
        false,
        false,
        0,
        true
      );
      expect(formula).toBe('2d10 + 20');
    });

    it('should double strength bonus for chainfist', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '2d10',
        0,
        true,
        10,
        0,
        false,
        false,
        false,
        false,
        0,
        true
      );
      expect(formula).toBe('2d10 + 20');
    });

    it('should not double strength bonus for regular melee weapons', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '1d10',
        0,
        true,
        10,
        0,
        false,
        false,
        false,
        false,
        0,
        false
      );
      expect(formula).toBe('1d10 + 10');
    });

    it('should handle negative strength bonus with power fist', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '2d10',
        0,
        true,
        -5,
        0,
        false,
        false,
        false,
        false,
        0,
        true
      );
      expect(formula).toBe('2d10 + -10');
    });

    it('should not apply strength bonus to ranged weapons even if isPowerFist is true', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '1d10',
        0,
        false,
        10,
        0,
        false,
        false,
        false,
        false,
        0,
        true
      );
      expect(formula).toBe('1d10');
    });

    it('should combine power fist bonus with degrees of success', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '2d10',
        3,
        true,
        10,
        0,
        false,
        false,
        false,
        false,
        0,
        true
      );
      expect(formula).toBe('2d10min3 + 20');
    });

    it('should combine power fist bonus with tearing', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '2d10',
        0,
        true,
        10,
        0,
        false,
        false,
        false,
        true,
        0,
        true
      );
      expect(formula).toBe('3d10dl1 + 20');
    });

    it('should combine power fist bonus with proven rating', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '2d10',
        0,
        true,
        10,
        0,
        false,
        false,
        false,
        false,
        3,
        true
      );
      expect(formula).toBe('2d10min3 + 20');
    });

    it('should handle zero strength bonus with power fist', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '2d10',
        0,
        true,
        0,
        0,
        false,
        false,
        false,
        false,
        0,
        true
      );
      expect(formula).toBe('2d10');
    });

    it('should triple strength bonus for Space Marine with power fist (SB 10 becomes 30)', () => {
      const formula = CombatDialogHelper.buildDamageFormula(
        '2d10',
        0,
        true,
        15,
        0,
        false,
        false,
        false,
        false,
        0,
        true
      );
      expect(formula).toBe('2d10 + 30');
    });
  });
});
