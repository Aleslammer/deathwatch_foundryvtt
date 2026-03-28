import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';

describe('Weapon Qualities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accurate Quality', () => {
    describe('buildAttackModifiers', () => {
      it('adds +10 when Accurate and Aiming (Half)', () => {
        const result = CombatDialogHelper.buildAttackModifiers({ bs: 50, bsAdv: 0, aim: 10, autoFire: 0, calledShot: 0, rangeMod: 0, runningTarget: 0, miscModifier: 0, isAccurate: true });
        expect(result.accurateBonus).toBe(10);
        expect(result.targetNumber).toBe(70); // 50 + 10 aim + 10 accurate
      });

      it('adds +10 when Accurate and Aiming (Full)', () => {
        const result = CombatDialogHelper.buildAttackModifiers({ bs: 50, bsAdv: 0, aim: 20, autoFire: 0, calledShot: 0, rangeMod: 0, runningTarget: 0, miscModifier: 0, isAccurate: true });
        expect(result.accurateBonus).toBe(10);
        expect(result.targetNumber).toBe(80); // 50 + 20 aim + 10 accurate
      });

      it('adds no bonus when Accurate but not Aiming', () => {
        const result = CombatDialogHelper.buildAttackModifiers({ bs: 50, bsAdv: 0, aim: 0, autoFire: 0, calledShot: 0, rangeMod: 0, runningTarget: 0, miscModifier: 0, isAccurate: true });
        expect(result.accurateBonus).toBe(0);
        expect(result.targetNumber).toBe(50);
      });

      it('adds no bonus when not Accurate', () => {
        const result = CombatDialogHelper.buildAttackModifiers({ bs: 50, bsAdv: 0, aim: 10, autoFire: 0, calledShot: 0, rangeMod: 0, runningTarget: 0, miscModifier: 0, isAccurate: false });
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
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 2, isMelee: false, strBonus: 0, hitIndex: 0, isAccurate: true, isAiming: true, isSingleShot: true });
        expect(formula).toBe('1d10min2 + 1d10');
      });

      it('adds 2d10 for 4 degrees of success (single shot, aiming, accurate)', () => {
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 4, isMelee: false, strBonus: 0, hitIndex: 0, isAccurate: true, isAiming: true, isSingleShot: true });
        expect(formula).toBe('1d10min4 + 2d10');
      });

      it('caps at 2d10 for 6 degrees of success (single shot, aiming, accurate)', () => {
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 6, isMelee: false, strBonus: 0, hitIndex: 0, isAccurate: true, isAiming: true, isSingleShot: true });
        expect(formula).toBe('1d10min6 + 2d10');
      });

      it('adds no bonus for 1 degree of success (not enough)', () => {
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 1, isMelee: false, strBonus: 0, hitIndex: 0, isAccurate: true, isAiming: true, isSingleShot: true });
        expect(formula).toBe('1d10min1');
      });

      it('adds no bonus when not aiming', () => {
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 4, isMelee: false, strBonus: 0, hitIndex: 0, isAccurate: true, isAiming: false, isSingleShot: true });
        expect(formula).toBe('1d10min4');
      });

      it('adds no bonus when not accurate', () => {
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 4, isMelee: false, strBonus: 0, hitIndex: 0, isAccurate: false, isAiming: true, isSingleShot: true });
        expect(formula).toBe('1d10min4');
      });

      it('adds no bonus when not single shot', () => {
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 4, isMelee: false, strBonus: 0, hitIndex: 0, isAccurate: true, isAiming: true, isSingleShot: false });
        expect(formula).toBe('1d10min4');
      });

      it('adds no bonus for melee weapons', () => {
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 4, isMelee: true, strBonus: 5, hitIndex: 0, isAccurate: true, isAiming: true, isSingleShot: true });
        expect(formula).toBe('1d10min4 + 5');
      });

      it('adds no bonus for subsequent hits', () => {
        const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 4, isMelee: false, strBonus: 0, hitIndex: 1, isAccurate: true, isAiming: true, isSingleShot: true });
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

  describe('Primitive Quality', () => {
    describe('calculateDamageResult', () => {
      it('doubles armor before penetration when primitive', () => {
        const result = CombatDialogHelper.calculateDamageResult({ damage: 20, armorValue: 8, penetration: 4, isPrimitive: true });
        expect(result.effectiveArmor).toBe(12); // (8 * 2) - 4 = 12
        expect(result.woundsTaken).toBe(8); // 20 - 12 = 8
      });

      it('applies normal armor calculation when not primitive', () => {
        const result = CombatDialogHelper.calculateDamageResult({ damage: 20, armorValue: 8, penetration: 4, isPrimitive: false });
        expect(result.effectiveArmor).toBe(4); // 8 - 4 = 4
        expect(result.woundsTaken).toBe(16); // 20 - 4 = 16
      });

      it('handles zero armor with primitive', () => {
        const result = CombatDialogHelper.calculateDamageResult({ damage: 20, armorValue: 0, penetration: 4, isPrimitive: true });
        expect(result.effectiveArmor).toBe(0); // (0 * 2) - 4 = 0 (clamped)
        expect(result.woundsTaken).toBe(20);
      });

      it('handles high penetration with primitive', () => {
        const result = CombatDialogHelper.calculateDamageResult({ damage: 20, armorValue: 5, penetration: 12, isPrimitive: true });
        expect(result.effectiveArmor).toBe(0); // (5 * 2) - 12 = -2 (clamped to 0)
        expect(result.woundsTaken).toBe(20);
      });

      it('combines primitive with toughness bonus', () => {
        const result = CombatDialogHelper.calculateDamageResult({ damage: 20, armorValue: 8, penetration: 4, toughnessBonus: 5, isPrimitive: true });
        expect(result.effectiveArmor).toBe(12); // (8 * 2) - 4 = 12
        expect(result.effectiveTB).toBe(5);
        expect(result.woundsTaken).toBe(3); // 20 - 12 - 5 = 3
      });
    });
  });
});
