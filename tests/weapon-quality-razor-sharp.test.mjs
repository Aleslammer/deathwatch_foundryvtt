import { jest } from '@jest/globals';
import './setup.mjs';
import { CombatDialogHelper } from '../src/module/helpers/combat-dialog.mjs';

describe('Razor Sharp Weapon Quality', () => {
  describe('calculateDamageResult', () => {
    it('doubles penetration with 2 degrees of success', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 15,
        armorValue: 10,
        penetration: 4,
        toughnessBonus: 3,
        isRazorSharp: true,
        degreesOfSuccess: 2
      });
      expect(result.effectiveArmor).toBe(2); // 10 - (4*2) = 2
      expect(result.woundsTaken).toBe(10); // 15 - 2 - 3 = 10
    });

    it('doubles penetration with 3 degrees of success', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 8,
        penetration: 3,
        toughnessBonus: 4,
        isRazorSharp: true,
        degreesOfSuccess: 3
      });
      expect(result.effectiveArmor).toBe(2); // 8 - (3*2) = 2
      expect(result.woundsTaken).toBe(14); // 20 - 2 - 4 = 14
    });

    it('does not double penetration with 1 degree of success', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 15,
        armorValue: 10,
        penetration: 4,
        toughnessBonus: 3,
        isRazorSharp: true,
        degreesOfSuccess: 1
      });
      expect(result.effectiveArmor).toBe(6); // 10 - 4 = 6
      expect(result.woundsTaken).toBe(6); // 15 - 6 - 3 = 6
    });

    it('does not double penetration with 0 degrees of success', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 15,
        armorValue: 10,
        penetration: 4,
        toughnessBonus: 3,
        isRazorSharp: true,
        degreesOfSuccess: 0
      });
      expect(result.effectiveArmor).toBe(6); // 10 - 4 = 6
      expect(result.woundsTaken).toBe(6); // 15 - 6 - 3 = 6
    });

    it('does not double penetration when not razor sharp', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 15,
        armorValue: 10,
        penetration: 4,
        toughnessBonus: 3,
        isRazorSharp: false,
        degreesOfSuccess: 2
      });
      expect(result.effectiveArmor).toBe(6); // 10 - 4 = 6
      expect(result.woundsTaken).toBe(6); // 15 - 6 - 3 = 6
    });

    it('works with primitive and razor sharp together', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 10,
        penetration: 4,
        toughnessBonus: 3,
        isPrimitive: true,
        isRazorSharp: true,
        degreesOfSuccess: 2
      });
      expect(result.effectiveArmor).toBe(12); // (10*2) - (4*2) = 12
      expect(result.woundsTaken).toBe(5); // 20 - 12 - 3 = 5
    });

    it('handles high penetration with razor sharp', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 25,
        armorValue: 5,
        penetration: 6,
        toughnessBonus: 4,
        isRazorSharp: true,
        degreesOfSuccess: 2
      });
      expect(result.effectiveArmor).toBe(0); // max(0, 5 - 12) = 0
      expect(result.woundsTaken).toBe(21); // 25 - 0 - 4 = 21
    });
  });
});
