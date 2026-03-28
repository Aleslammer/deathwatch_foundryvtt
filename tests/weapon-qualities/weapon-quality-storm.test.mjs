import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';
import { RATE_OF_FIRE_MODIFIERS } from '../../src/module/helpers/constants.mjs';

describe('Storm Weapon Quality', () => {
  describe('calculateHits', () => {
    it('doubles hits for single shot', () => {
      const hits = CombatDialogHelper.calculateHits(40, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, false, false, true);
      expect(hits).toBe(2); // 1 * 2 = 2
    });

    it('doubles hits for semi-auto', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SEMI_AUTO, false, false, true);
      expect(hits).toBe(4); // (1 + floor(2/2)) * 2 = 2 * 2 = 4
    });

    it('doubles hits for full-auto', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.FULL_AUTO, false, false, true);
      expect(hits).toBe(6); // (1 + 2) * 2 = 3 * 2 = 6
    });

    it('doubles hits for full-auto with 4 degrees of success', () => {
      const hits = CombatDialogHelper.calculateHits(10, 50, 20, RATE_OF_FIRE_MODIFIERS.FULL_AUTO, false, false, true);
      expect(hits).toBe(10); // (1 + 4) * 2 = 5 * 2 = 10
    });

    it('respects maxHits cap after doubling', () => {
      const hits = CombatDialogHelper.calculateHits(10, 50, 8, RATE_OF_FIRE_MODIFIERS.FULL_AUTO, false, false, true);
      expect(hits).toBe(8); // (1 + 4) * 2 = 10, capped at 8
    });

    it('does not double when Storm is false', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.FULL_AUTO, false, false, false);
      expect(hits).toBe(3); // 1 + 2 = 3 (not doubled)
    });

    it('combines Storm with Scatter at Point Blank', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, true, true, true);
      expect(hits).toBe(4); // (1 + floor(2/2)) * 2 = 2 * 2 = 4
    });

    it('doubles zero additional hits correctly', () => {
      const hits = CombatDialogHelper.calculateHits(45, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, false, false, true);
      expect(hits).toBe(2); // 1 * 2 = 2 (0 DoS, still doubles base hit)
    });
  });
});
