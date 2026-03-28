import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';
import { RATE_OF_FIRE_MODIFIERS } from '../../src/module/helpers/constants.mjs';

describe('Scatter Weapon Quality', () => {
  describe('calculateHits - Point Blank range', () => {
    it('adds 1 hit per 2 degrees of success at Point Blank', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, true, true);
      expect(hits).toBe(2); // 1 + floor(2/2) = 2
    });

    it('adds 2 hits for 4 degrees of success at Point Blank', () => {
      const hits = CombatDialogHelper.calculateHits(10, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, true, true);
      expect(hits).toBe(3); // 1 + floor(4/2) = 3
    });

    it('adds no extra hits for 1 degree of success at Point Blank', () => {
      const hits = CombatDialogHelper.calculateHits(40, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, true, true);
      expect(hits).toBe(1); // 1 + floor(1/2) = 1
    });

    it('does not add hits when not at Point Blank', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, true, false);
      expect(hits).toBe(1); // Single shot, not Point Blank
    });

    it('does not add hits when not Scatter', () => {
      const hits = CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE, false, true);
      expect(hits).toBe(1); // Not Scatter
    });
  });

  describe('calculateDamageResult - Long/Extreme range', () => {
    it('doubles armor at Long range with Scatter', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 5,
        penetration: 2,
        isScatter: true,
        isLongOrExtremeRange: true
      });
      expect(result.effectiveArmor).toBe(8); // (5*2) - 2 = 8
      expect(result.woundsTaken).toBe(12); // 20 - 8 = 12
    });

    it('doubles armor at Extreme range with Scatter', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 25,
        armorValue: 8,
        penetration: 4,
        isScatter: true,
        isLongOrExtremeRange: true
      });
      expect(result.effectiveArmor).toBe(12); // (8*2) - 4 = 12
      expect(result.woundsTaken).toBe(13); // 25 - 12 = 13
    });

    it('does not double armor at Short range with Scatter', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 5,
        penetration: 2,
        isScatter: true,
        isLongOrExtremeRange: false
      });
      expect(result.effectiveArmor).toBe(3); // 5 - 2 = 3
      expect(result.woundsTaken).toBe(17); // 20 - 3 = 17
    });

    it('does not double armor at Long range without Scatter', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 5,
        penetration: 2,
        isScatter: false,
        isLongOrExtremeRange: true
      });
      expect(result.effectiveArmor).toBe(3); // 5 - 2 = 3
      expect(result.woundsTaken).toBe(17); // 20 - 3 = 17
    });

    it('combines Scatter with Primitive', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 5,
        penetration: 2,
        isPrimitive: true,
        isScatter: true,
        isLongOrExtremeRange: true
      });
      expect(result.effectiveArmor).toBe(18); // ((5*2)*2) - 2 = 18
      expect(result.woundsTaken).toBe(2); // 20 - 18 = 2
    });

    it('combines Scatter with Razor Sharp', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 25,
        armorValue: 8,
        penetration: 4,
        isScatter: true,
        isLongOrExtremeRange: true,
        isRazorSharp: true,
        degreesOfSuccess: 2
      });
      expect(result.effectiveArmor).toBe(8); // (8*2) - (4*2) = 8
      expect(result.woundsTaken).toBe(17); // 25 - 8 = 17
    });
  });
});
