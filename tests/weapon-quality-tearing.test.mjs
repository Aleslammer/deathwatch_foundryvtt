import { jest } from '@jest/globals';
import './setup.mjs';
import { CombatDialogHelper } from '../src/module/helpers/combat-dialog.mjs';

describe('Tearing Weapon Quality', () => {
  describe('buildDamageFormula', () => {
    it('adds extra die with drop lowest for single die', () => {
      const formula = CombatDialogHelper.buildDamageFormula('1d10', 0, false, 0, 0, false, false, false, true);
      expect(formula).toBe('2d10dl1');
    });

    it('adds extra die with drop lowest for multiple dice', () => {
      const formula = CombatDialogHelper.buildDamageFormula('2d10+5', 0, false, 0, 0, false, false, false, true);
      expect(formula).toBe('3d10dl1+5');
    });

    it('handles damage with multiple dice types', () => {
      const formula = CombatDialogHelper.buildDamageFormula('1d10+1d5', 0, false, 0, 0, false, false, false, true);
      expect(formula).toBe('2d10dl1+2d5dl1');
    });

    it('does not add extra die when not Tearing', () => {
      const formula = CombatDialogHelper.buildDamageFormula('1d10', 0, false, 0, 0, false, false, false, false);
      expect(formula).toBe('1d10');
    });

    it('combines Tearing with degrees of success', () => {
      const formula = CombatDialogHelper.buildDamageFormula('1d10', 2, false, 0, 0, false, false, false, true);
      expect(formula).toBe('(1d10dl1 + 1d10min2)');
    });

    it('combines Tearing with melee strength bonus', () => {
      const formula = CombatDialogHelper.buildDamageFormula('1d10', 0, true, 8, 0, false, false, false, true);
      expect(formula).toBe('2d10dl1 + 8');
    });

    it('combines Tearing with Accurate bonus', () => {
      const formula = CombatDialogHelper.buildDamageFormula('1d10', 4, false, 0, 0, true, true, true, true);
      expect(formula).toBe('(1d10dl1 + 1d10min4) + 2d10');
    });

    it('handles complex damage formula with Tearing', () => {
      const formula = CombatDialogHelper.buildDamageFormula('2d10+8', 0, false, 0, 0, false, false, false, true);
      expect(formula).toBe('3d10dl1+8');
    });

    it('does not apply Tearing to subsequent hits', () => {
      const formula = CombatDialogHelper.buildDamageFormula('1d10', 0, false, 0, 1, false, false, false, true);
      expect(formula).toBe('2d10dl1');
    });
  });
});
