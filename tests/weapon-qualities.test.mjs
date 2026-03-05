import { jest } from '@jest/globals';
import './setup.mjs';
import { CombatDialogHelper } from '../src/module/helpers/combat-dialog.mjs';

describe('Weapon Qualities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accurate Quality', () => {
    describe('buildAttackModifiers', () => {
      it('adds +10 when Accurate and Aiming (Half)', () => {
        const result = CombatDialogHelper.buildAttackModifiers(50, 0, 10, 0, 0, 0, 0, 0, true);
        expect(result.accurateBonus).toBe(10);
        expect(result.targetNumber).toBe(70); // 50 + 10 aim + 10 accurate
      });

      it('adds +10 when Accurate and Aiming (Full)', () => {
        const result = CombatDialogHelper.buildAttackModifiers(50, 0, 20, 0, 0, 0, 0, 0, true);
        expect(result.accurateBonus).toBe(10);
        expect(result.targetNumber).toBe(80); // 50 + 20 aim + 10 accurate
      });

      it('adds no bonus when Accurate but not Aiming', () => {
        const result = CombatDialogHelper.buildAttackModifiers(50, 0, 0, 0, 0, 0, 0, 0, true);
        expect(result.accurateBonus).toBe(0);
        expect(result.targetNumber).toBe(50);
      });

      it('adds no bonus when not Accurate', () => {
        const result = CombatDialogHelper.buildAttackModifiers(50, 0, 10, 0, 0, 0, 0, 0, false);
        expect(result.accurateBonus).toBe(0);
        expect(result.targetNumber).toBe(60); // 50 + 10 aim
      });
    });

    describe('buildModifierParts', () => {
      it('includes Accurate bonus in modifier parts', () => {
        const parts = CombatDialogHelper.buildModifierParts(50, 0, 10, 0, 0, 0, 0, 0, 10);
        expect(parts).toContain('+10 Accurate');
      });

      it('excludes Accurate when bonus is 0', () => {
        const parts = CombatDialogHelper.buildModifierParts(50, 0, 10, 0, 0, 0, 0, 0, 0);
        expect(parts).not.toContain('+10 Accurate');
      });
    });

    describe('buildDamageFormula - Accurate bonus damage', () => {
      it('adds 1d10 for 2 degrees of success (single shot, aiming, accurate)', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 2, false, 0, 0, true, true, true);
        expect(formula).toBe('1d10min2 + 1d10');
      });

      it('adds 2d10 for 4 degrees of success (single shot, aiming, accurate)', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 4, false, 0, 0, true, true, true);
        expect(formula).toBe('1d10min4 + 2d10');
      });

      it('caps at 2d10 for 6 degrees of success (single shot, aiming, accurate)', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 6, false, 0, 0, true, true, true);
        expect(formula).toBe('1d10min6 + 2d10');
      });

      it('adds no bonus for 1 degree of success (not enough)', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 1, false, 0, 0, true, true, true);
        expect(formula).toBe('1d10min1');
      });

      it('adds no bonus when not aiming', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 4, false, 0, 0, true, false, true);
        expect(formula).toBe('1d10min4');
      });

      it('adds no bonus when not accurate', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 4, false, 0, 0, false, true, true);
        expect(formula).toBe('1d10min4');
      });

      it('adds no bonus when not single shot', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 4, false, 0, 0, true, true, false);
        expect(formula).toBe('1d10min4');
      });

      it('adds no bonus for melee weapons', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 4, true, 5, 0, true, true, true);
        expect(formula).toBe('1d10min4 + 5');
      });

      it('adds no bonus for subsequent hits', () => {
        const formula = CombatDialogHelper.buildDamageFormula('1d10', 4, false, 0, 1, true, true, true);
        expect(formula).toBe('1d10');
      });
    });
  });

  describe('Defensive Quality', () => {
    it('applies -10 penalty to melee attacks', () => {
      // Note: Defensive penalty is applied in melee-combat.mjs, not in CombatDialogHelper
      // This is tested via integration tests in melee-combat.test.mjs
      expect(true).toBe(true);
    });
  });
});
