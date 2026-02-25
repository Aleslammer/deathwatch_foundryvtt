import { CombatDialogHelper } from '../src/module/helpers/combat-dialog.mjs';
import { RATE_OF_FIRE_MODIFIERS } from '../src/module/helpers/constants.mjs';

describe('CombatDialogHelper', () => {
  describe('buildAttackModifiers', () => {
    it('calculates total modifiers', () => {
      const result = CombatDialogHelper.buildAttackModifiers(40, 5, 10, 10, -20, 10, -20, 5);
      expect(result.modifiers).toBe(0);
      expect(result.targetNumber).toBe(40);
    });

    it('clamps modifiers to -60', () => {
      const result = CombatDialogHelper.buildAttackModifiers(40, -100, 0, 0, 0, 0, 0, 0);
      expect(result.clampedModifiers).toBe(-60);
    });

    it('clamps modifiers to +60', () => {
      const result = CombatDialogHelper.buildAttackModifiers(40, 100, 0, 0, 0, 0, 0, 0);
      expect(result.clampedModifiers).toBe(60);
    });
  });

  describe('buildModifierParts', () => {
    it('includes all non-zero modifiers', () => {
      const parts = CombatDialogHelper.buildModifierParts(40, 5, 10, 10, -20, 10, -20, 5);
      expect(parts).toContain('40 Base BS');
      expect(parts).toContain('+5 BS Advances');
      expect(parts).toContain('+10 Aim');
      expect(parts).toContain('+10 Rate of Fire');
      expect(parts).toContain('-20 Called Shot');
      expect(parts).toContain('+10 Range');
      expect(parts).toContain('-20 Running Target');
      expect(parts).toContain('+5 Misc');
    });

    it('excludes zero modifiers', () => {
      const parts = CombatDialogHelper.buildModifierParts(40, 0, 0, 0, 0, 0, 0, 0);
      expect(parts).toHaveLength(1);
      expect(parts[0]).toBe('40 Base BS');
    });
  });

  describe('calculateHits', () => {
    it('calculates hits based on degrees of success', () => {
      expect(CombatDialogHelper.calculateHits(30, 50, 10)).toBe(3);
      expect(CombatDialogHelper.calculateHits(45, 50, 10)).toBe(1);
      expect(CombatDialogHelper.calculateHits(60, 50, 10)).toBe(0);
    });

    it('caps hits at maxHits', () => {
      expect(CombatDialogHelper.calculateHits(10, 50, 2)).toBe(2);
    });
  });

  describe('determineJamThreshold', () => {
    it('returns 94 for semi-auto', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SEMI_AUTO)).toBe(94);
    });

    it('returns 94 for full-auto', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.FULL_AUTO)).toBe(94);
    });

    it('returns 96 for single shot', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SINGLE)).toBe(96);
    });
  });

  describe('parseRateOfFire', () => {
    it('parses S/2/4 with sufficient ammo', () => {
      const result = CombatDialogHelper.parseRateOfFire('S/2/4', 10);
      expect(result.hasSingle).toBe(true);
      expect(result.hasSemiAuto).toBe(true);
      expect(result.hasFullAuto).toBe(true);
      expect(result.semiAutoRounds).toBe(2);
      expect(result.fullAutoRounds).toBe(4);
    });

    it('parses S/-/- with no auto fire', () => {
      const result = CombatDialogHelper.parseRateOfFire('S/-/-', 10);
      expect(result.hasSingle).toBe(true);
      expect(result.hasSemiAuto).toBe(false);
      expect(result.hasFullAuto).toBe(false);
    });

    it('disables modes with insufficient ammo', () => {
      const result = CombatDialogHelper.parseRateOfFire('S/2/4', 1);
      expect(result.hasSingle).toBe(true);
      expect(result.hasSemiAuto).toBe(false);
      expect(result.hasFullAuto).toBe(false);
    });
  });

  describe('buildRofOptions', () => {
    it('builds options for all available modes', () => {
      const rofData = {
        hasSingle: true,
        hasSemiAuto: true,
        hasFullAuto: true,
        semiAutoRounds: 2,
        fullAutoRounds: 4
      };
      const options = CombatDialogHelper.buildRofOptions(rofData);
      expect(options).toContain('Single (1 round)');
      expect(options).toContain('Semi-Auto');
      expect(options).toContain('Full-Auto');
    });

    it('builds options for single only', () => {
      const rofData = {
        hasSingle: true,
        hasSemiAuto: false,
        hasFullAuto: false
      };
      const options = CombatDialogHelper.buildRofOptions(rofData);
      expect(options).toContain('Single');
      expect(options).not.toContain('Semi-Auto');
    });
  });

  describe('determineRoundsFired', () => {
    it('returns 1 for single shot', () => {
      expect(CombatDialogHelper.determineRoundsFired(RATE_OF_FIRE_MODIFIERS.SINGLE, ['S', '2', '4'])).toBe(1);
    });

    it('returns semi-auto rounds', () => {
      expect(CombatDialogHelper.determineRoundsFired(RATE_OF_FIRE_MODIFIERS.SEMI_AUTO, ['S', '3', '6'])).toBe(3);
    });

    it('returns full-auto rounds', () => {
      expect(CombatDialogHelper.determineRoundsFired(RATE_OF_FIRE_MODIFIERS.FULL_AUTO, ['S', '3', '6'])).toBe(6);
    });
  });

  describe('buildAttackLabel', () => {
    it('builds hit label', () => {
      const label = CombatDialogHelper.buildAttackLabel('Bolter', 50, 2, false);
      expect(label).toContain('Bolter');
      expect(label).toContain('Target: 50');
      expect(label).toContain('HIT!');
      expect(label).toContain('2 Hits');
    });

    it('builds miss label', () => {
      const label = CombatDialogHelper.buildAttackLabel('Bolter', 50, 0, false);
      expect(label).toContain('MISS!');
      expect(label).toContain('0 Hits');
    });

    it('includes jam warning', () => {
      const label = CombatDialogHelper.buildAttackLabel('Bolter', 50, 1, true);
      expect(label).toContain('WEAPON JAMMED!');
    });
  });

  describe('buildAttackFlavor', () => {
    it('returns label when no modifiers', () => {
      const flavor = CombatDialogHelper.buildAttackFlavor('Test Label', []);
      expect(flavor).toBe('Test Label');
    });

    it('includes modifiers in details', () => {
      const flavor = CombatDialogHelper.buildAttackFlavor('Test Label', ['+10 Aim', '+5 Misc']);
      expect(flavor).toContain('Test Label');
      expect(flavor).toContain('<details');
      expect(flavor).toContain('+10 Aim');
      expect(flavor).toContain('+5 Misc');
    });
  });
});
