import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';

describe('Gyro-stabilised Quality', () => {
  describe('applyGyroStabilisedRangeLimit', () => {
    it('does not change range modifier better than -10', () => {
      expect(CombatDialogHelper.applyGyroStabilisedRangeLimit(20)).toBe(20);
      expect(CombatDialogHelper.applyGyroStabilisedRangeLimit(10)).toBe(10);
      expect(CombatDialogHelper.applyGyroStabilisedRangeLimit(0)).toBe(0);
      expect(CombatDialogHelper.applyGyroStabilisedRangeLimit(-10)).toBe(-10);
    });

    it('limits range modifier to -10 (Long Range)', () => {
      expect(CombatDialogHelper.applyGyroStabilisedRangeLimit(-20)).toBe(-10);
      expect(CombatDialogHelper.applyGyroStabilisedRangeLimit(-30)).toBe(-10);
      expect(CombatDialogHelper.applyGyroStabilisedRangeLimit(-100)).toBe(-10);
    });
  });

  describe('buildAttackModifiers with Gyro-stabilised', () => {
    it('applies gyro-stabilised range limit', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 50,
        rangeMod: -20,
        isGyroStabilised: true
      });
      expect(result.gyroRangeMod).toBe(-10);
      expect(result.targetNumber).toBe(40);
    });

    it('does not change range modifier when not gyro-stabilised', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 50,
        rangeMod: -20
      });
      expect(result.gyroRangeMod).toBe(-20);
      expect(result.targetNumber).toBe(30);
    });

    it('does not affect positive range modifiers', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 50,
        rangeMod: 20,
        isGyroStabilised: true
      });
      expect(result.gyroRangeMod).toBe(20);
      expect(result.targetNumber).toBe(70);
    });

    it('works with other modifiers', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 50,
        bsAdv: 5,
        aim: 10,
        autoFire: 10,
        rangeMod: -20,
        miscModifier: 5,
        isGyroStabilised: true
      });
      expect(result.gyroRangeMod).toBe(-10);
      expect(result.targetNumber).toBe(70);
    });
  });
});
