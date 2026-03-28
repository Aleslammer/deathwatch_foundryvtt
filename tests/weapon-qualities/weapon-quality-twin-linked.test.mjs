import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';
import { RATE_OF_FIRE_MODIFIERS } from '../../src/module/helpers/constants.mjs';

describe('Twin-Linked Weapon Quality', () => {
  describe('buildAttackModifiers', () => {
    it('adds +20 bonus when Twin-Linked', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 50,
        isTwinLinked: true
      });
      expect(result.twinLinkedBonus).toBe(20);
      expect(result.targetNumber).toBe(70);
    });

    it('no bonus when not Twin-Linked', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 50,
        isTwinLinked: false
      });
      expect(result.twinLinkedBonus).toBe(0);
      expect(result.targetNumber).toBe(50);
    });
  });

  describe('buildModifierParts', () => {
    it('includes Twin-Linked in modifier breakdown', () => {
      const parts = CombatDialogHelper.buildModifierParts(50, 0, 0, 0, 0, 0, 0, 0, 0, 20);
      expect(parts).toContain('+20 Twin-Linked');
    });

    it('does not include Twin-Linked when bonus is 0', () => {
      const parts = CombatDialogHelper.buildModifierParts(50, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      expect(parts).not.toContain('+20 Twin-Linked');
    });
  });

  describe('calculateHits', () => {
    it('adds +1 hit at 2 DoS', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, false, false, false, true);
      expect(hits).toBe(2);
    });

    it('adds +1 hit at 3 DoS', () => {
      const hits = CombatDialogHelper.calculateHits(20, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, false, false, false, true);
      expect(hits).toBe(2);
    });

    it('no extra hit at 1 DoS', () => {
      const hits = CombatDialogHelper.calculateHits(40, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, false, false, false, true);
      expect(hits).toBe(1);
    });

    it('no extra hit when not Twin-Linked', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, false, false, false, false);
      expect(hits).toBe(1);
    });

    it('works with Semi-Auto', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SEMI_AUTO, false, false, false, true);
      expect(hits).toBe(3);
    });

    it('works with Full-Auto', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.FULL_AUTO, false, false, false, true);
      expect(hits).toBe(4);
    });

    it('respects maxHits cap', () => {
      const hits = CombatDialogHelper.calculateHits(10, 50, 2, RATE_OF_FIRE_MODIFIERS.FULL_AUTO, false, false, false, true);
      expect(hits).toBe(2);
    });
  });

  describe('maxHits capping', () => {
    it('single shot gets 2 hits when maxHits accounts for twin-linked (+1)', () => {
      // ranged-combat.mjs passes maxHits = roundsFired + 1 for twin-linked
      const hits = CombatDialogHelper.calculateHits(30, 50, 2, RATE_OF_FIRE_MODIFIERS.SINGLE, false, false, false, true);
      expect(hits).toBe(2);
    });

    it('single shot clamped to 1 if maxHits not adjusted', () => {
      // Without the +1 adjustment, the extra hit gets clamped
      const hits = CombatDialogHelper.calculateHits(30, 50, 1, RATE_OF_FIRE_MODIFIERS.SINGLE, false, false, false, true);
      expect(hits).toBe(1);
    });

    it('semi-auto respects maxHits + 1', () => {
      // 2 DoS = 1 base + 1 twin-linked + 1 semi-auto = 3, maxHits = 3+1 = 4
      const hits = CombatDialogHelper.calculateHits(30, 50, 4, RATE_OF_FIRE_MODIFIERS.SEMI_AUTO, false, false, false, true);
      expect(hits).toBe(3);
    });
  });
});
