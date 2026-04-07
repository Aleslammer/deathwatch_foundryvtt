import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';

describe('Tearing Weapon Quality', () => {
  describe('buildDamageFormula', () => {
    it('adds extra die with drop lowest for single die', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, isTearing: true });
      expect(formula).toBe('2d10dl1');
    });

    it('adds extra die with drop lowest for multiple dice', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10+5', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, isTearing: true });
      expect(formula).toBe('3d10dl1+5');
    });

    it('handles damage with multiple dice types', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10+1d5', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, isTearing: true });
      expect(formula).toBe('2d10dl1+2d5dl1');
    });

    it('does not add extra die when not Tearing', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, isTearing: false });
      expect(formula).toBe('1d10');
    });

    it('combines Tearing with degrees of success', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 2, isMelee: false, strBonus: 0, hitIndex: 0, isTearing: true });
      expect(formula).toBe('2d10min2dl1');
    });

    it('combines Tearing with melee strength bonus', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 0, isMelee: true, strBonus: 8, hitIndex: 0, isTearing: true });
      expect(formula).toBe('2d10dl1 + 8');
    });

    it('combines Tearing with Accurate bonus', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 4, isMelee: false, strBonus: 0, hitIndex: 0, isAccurate: true, isAiming: true, isSingleShot: true, isTearing: true });
      expect(formula).toBe('2d10min4dl1 + 2d10');
    });

    it('handles complex damage formula with Tearing', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10+8', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, isTearing: true });
      expect(formula).toBe('3d10dl1+8');
    });

    it('does not apply Tearing to subsequent hits', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 1, isTearing: true });
      expect(formula).toBe('2d10dl1');
    });
  });
});
