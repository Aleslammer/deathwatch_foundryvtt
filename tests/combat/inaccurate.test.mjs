import { jest } from '@jest/globals';
import '../setup.mjs';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';

describe('Inaccurate Quality', () => {
  describe('buildAttackModifiers with Inaccurate', () => {
    it('zeroes out aim bonus when inaccurate', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 40,
        aim: 20,
        isInaccurate: true
      });
      expect(result.effectiveAim).toBe(0);
      expect(result.targetNumber).toBe(40);
    });

    it('zeroes out half aim when inaccurate', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 40,
        aim: 10,
        isInaccurate: true
      });
      expect(result.effectiveAim).toBe(0);
      expect(result.targetNumber).toBe(40);
    });

    it('does not affect target number when aim is zero', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 40,
        aim: 0,
        isInaccurate: true
      });
      expect(result.targetNumber).toBe(40);
    });

    it('suppresses Accurate bonus when inaccurate', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 40,
        aim: 20,
        isAccurate: true,
        isInaccurate: true
      });
      expect(result.accurateBonus).toBe(0);
      expect(result.effectiveAim).toBe(0);
      expect(result.targetNumber).toBe(40);
    });

    it('preserves other modifiers when inaccurate', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 40,
        aim: 20,
        autoFire: 10,
        miscModifier: 5,
        isInaccurate: true
      });
      expect(result.effectiveAim).toBe(0);
      expect(result.targetNumber).toBe(55);
    });

    it('does not zero aim when not inaccurate', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 40,
        aim: 20
      });
      expect(result.targetNumber).toBe(60);
    });
  });
});
