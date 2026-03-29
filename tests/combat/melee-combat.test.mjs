import { jest } from '@jest/globals';
import { MeleeCombatHelper } from '../../src/module/helpers/combat/melee-combat.mjs';
import { MELEE_MODIFIERS, COMBAT_PENALTIES } from '../../src/module/helpers/constants.mjs';

describe('MeleeCombatHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildMeleeModifiers', () => {
    it('calculates target number from WS alone', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50 });
      expect(result.targetNumber).toBe(50);
      expect(result.modifiers).toBe(0);
    });

    it('adds aim modifier', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, aim: 10 });
      expect(result.targetNumber).toBe(60);
    });

    it('adds all out attack modifier', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, allOut: MELEE_MODIFIERS.ALL_OUT_ATTACK });
      expect(result.targetNumber).toBe(70);
    });

    it('adds charge modifier', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, charge: MELEE_MODIFIERS.CHARGE });
      expect(result.targetNumber).toBe(60);
    });

    it('applies called shot penalty', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, calledShot: COMBAT_PENALTIES.CALLED_SHOT });
      expect(result.targetNumber).toBe(30);
    });

    it('applies running target penalty', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, runningTarget: COMBAT_PENALTIES.RUNNING_TARGET });
      expect(result.targetNumber).toBe(30);
    });

    it('applies defensive penalty', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, isDefensive: true });
      expect(result.defensivePenalty).toBe(-10);
      expect(result.targetNumber).toBe(40);
    });

    it('does not apply defensive penalty when false', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, isDefensive: false });
      expect(result.defensivePenalty).toBe(0);
      expect(result.targetNumber).toBe(50);
    });

    it('combines all modifiers', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({
        ws: 50, aim: 10, allOut: 20, charge: 10,
        calledShot: -20, runningTarget: -20, miscModifier: 5, isDefensive: true
      });
      // 10 + 20 + 10 - 20 - 20 + 5 - 10 = -5
      expect(result.modifiers).toBe(-5);
      expect(result.targetNumber).toBe(45);
    });

    it('clamps modifiers to -60', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, miscModifier: -100 });
      expect(result.clampedModifiers).toBe(-60);
      expect(result.targetNumber).toBe(-10);
    });

    it('clamps modifiers to +60', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, miscModifier: 100 });
      expect(result.clampedModifiers).toBe(60);
      expect(result.targetNumber).toBe(110);
    });

    it('includes defensive in clamping', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({ ws: 50, miscModifier: -55, isDefensive: true });
      // -55 + -10 = -65, clamped to -60
      expect(result.clampedModifiers).toBe(-60);
    });

    it('defaults all options to zero', () => {
      const result = MeleeCombatHelper.buildMeleeModifiers({});
      expect(result.targetNumber).toBe(0);
      expect(result.modifiers).toBe(0);
    });
  });

  describe('buildMeleeModifierParts', () => {
    it('includes WS as first part', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50 });
      expect(parts[0]).toBe('50 WS');
      expect(parts).toHaveLength(1);
    });

    it('includes aim when non-zero', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50, aim: 10 });
      expect(parts).toContain('+10 Aim');
    });

    it('includes all out attack when non-zero', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50, allOut: 20 });
      expect(parts).toContain('+20 All Out Attack');
    });

    it('includes charge when non-zero', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50, charge: 10 });
      expect(parts).toContain('+10 Charge');
    });

    it('includes defensive penalty when non-zero', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50, defensivePenalty: -10 });
      expect(parts).toContain('-10 Defensive');
    });

    it('includes called shot when non-zero', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50, calledShot: -20 });
      expect(parts).toContain('-20 Called Shot');
    });

    it('includes running target when non-zero', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50, runningTarget: -20 });
      expect(parts).toContain('-20 Running Target');
    });

    it('includes misc modifier with sign', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50, miscModifier: 5 });
      expect(parts).toContain('+5 Misc');
    });

    it('includes negative misc modifier', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({ ws: 50, miscModifier: -5 });
      expect(parts).toContain('-5 Misc');
    });

    it('excludes zero modifiers', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({
        ws: 50, aim: 0, allOut: 0, charge: 0, calledShot: 0,
        runningTarget: 0, miscModifier: 0, defensivePenalty: 0
      });
      expect(parts).toHaveLength(1);
    });

    it('includes all non-zero modifiers', () => {
      const parts = MeleeCombatHelper.buildMeleeModifierParts({
        ws: 50, aim: 10, allOut: 20, charge: 10,
        calledShot: -20, runningTarget: -20, miscModifier: 5, defensivePenalty: -10
      });
      expect(parts).toHaveLength(8);
    });
  });

  describe('attackDialog', () => {
    it('should be defined as a function', () => {
      expect(typeof MeleeCombatHelper.attackDialog).toBe('function');
    });
  });
});
