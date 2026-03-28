import { jest } from '@jest/globals';
import { PsychicCombatHelper } from '../../src/module/helpers/combat/psychic-combat.mjs';
import { POWER_LEVELS } from '../../src/module/helpers/constants.mjs';

describe('PsychicCombatHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── calculateEffectivePsyRating ──────────────────────────────────────

  describe('calculateEffectivePsyRating', () => {
    it('Fettered halves even PR and rounds up', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(4, POWER_LEVELS.FETTERED)).toBe(2);
    });

    it('Fettered halves odd PR and rounds up', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(5, POWER_LEVELS.FETTERED)).toBe(3);
    });

    it('Fettered with PR 1 returns 1', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(1, POWER_LEVELS.FETTERED)).toBe(1);
    });

    it('Fettered with PR 0 returns 0', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(0, POWER_LEVELS.FETTERED)).toBe(0);
    });

    it('Unfettered returns full PR', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(5, POWER_LEVELS.UNFETTERED)).toBe(5);
    });

    it('Unfettered with PR 0 returns 0', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(0, POWER_LEVELS.UNFETTERED)).toBe(0);
    });

    it('Push adds 3 to PR', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(5, POWER_LEVELS.PUSH)).toBe(8);
    });

    it('Push with PR 0 returns 3', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(0, POWER_LEVELS.PUSH)).toBe(3);
    });

    it('Fettered with PR 8 returns 4', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(8, POWER_LEVELS.FETTERED)).toBe(4);
    });

    it('Fettered with PR 3 returns 2', () => {
      expect(PsychicCombatHelper.calculateEffectivePsyRating(3, POWER_LEVELS.FETTERED)).toBe(2);
    });
  });

  // ── isDoubles ────────────────────────────────────────────────────────

  describe('isDoubles', () => {
    it('returns true for 11', () => {
      expect(PsychicCombatHelper.isDoubles(11)).toBe(true);
    });

    it('returns true for 22', () => {
      expect(PsychicCombatHelper.isDoubles(22)).toBe(true);
    });

    it('returns true for 33', () => {
      expect(PsychicCombatHelper.isDoubles(33)).toBe(true);
    });

    it('returns true for 44', () => {
      expect(PsychicCombatHelper.isDoubles(44)).toBe(true);
    });

    it('returns true for 55', () => {
      expect(PsychicCombatHelper.isDoubles(55)).toBe(true);
    });

    it('returns true for 66', () => {
      expect(PsychicCombatHelper.isDoubles(66)).toBe(true);
    });

    it('returns true for 77', () => {
      expect(PsychicCombatHelper.isDoubles(77)).toBe(true);
    });

    it('returns true for 88', () => {
      expect(PsychicCombatHelper.isDoubles(88)).toBe(true);
    });

    it('returns true for 99', () => {
      expect(PsychicCombatHelper.isDoubles(99)).toBe(true);
    });

    it('returns true for 100 (treated as 00)', () => {
      expect(PsychicCombatHelper.isDoubles(100)).toBe(true);
    });

    it('returns false for 12', () => {
      expect(PsychicCombatHelper.isDoubles(12)).toBe(false);
    });

    it('returns false for 1', () => {
      expect(PsychicCombatHelper.isDoubles(1)).toBe(false);
    });

    it('returns false for 50', () => {
      expect(PsychicCombatHelper.isDoubles(50)).toBe(false);
    });

    it('returns false for 95', () => {
      expect(PsychicCombatHelper.isDoubles(95)).toBe(false);
    });
  });

  // ── checkPsychicEffects ──────────────────────────────────────────────

  describe('checkPsychicEffects', () => {
    it('Fettered: no phenomena, no fatigue', () => {
      expect(PsychicCombatHelper.checkPsychicEffects(33, POWER_LEVELS.FETTERED))
        .toEqual({ phenomena: false, fatigue: false });
    });

    it('Fettered with doubles: still no phenomena', () => {
      expect(PsychicCombatHelper.checkPsychicEffects(44, POWER_LEVELS.FETTERED))
        .toEqual({ phenomena: false, fatigue: false });
    });

    it('Unfettered with doubles: phenomena, no fatigue', () => {
      expect(PsychicCombatHelper.checkPsychicEffects(33, POWER_LEVELS.UNFETTERED))
        .toEqual({ phenomena: true, fatigue: false });
    });

    it('Unfettered without doubles: no phenomena', () => {
      expect(PsychicCombatHelper.checkPsychicEffects(34, POWER_LEVELS.UNFETTERED))
        .toEqual({ phenomena: false, fatigue: false });
    });

    it('Push without doubles: phenomena, no fatigue', () => {
      expect(PsychicCombatHelper.checkPsychicEffects(23, POWER_LEVELS.PUSH))
        .toEqual({ phenomena: true, fatigue: false });
    });

    it('Push with doubles: phenomena AND fatigue', () => {
      expect(PsychicCombatHelper.checkPsychicEffects(44, POWER_LEVELS.PUSH))
        .toEqual({ phenomena: true, fatigue: true });
    });

    it('Push with 100: phenomena AND fatigue (100 = doubles)', () => {
      expect(PsychicCombatHelper.checkPsychicEffects(100, POWER_LEVELS.PUSH))
        .toEqual({ phenomena: true, fatigue: true });
    });

    it('Unfettered with 100: phenomena (100 = doubles)', () => {
      expect(PsychicCombatHelper.checkPsychicEffects(100, POWER_LEVELS.UNFETTERED))
        .toEqual({ phenomena: true, fatigue: false });
    });
  });

  // ── collectPsychicModifiers ──────────────────────────────────────────

  describe('collectPsychicModifiers', () => {
    it('returns defaults for empty modifiers', () => {
      const result = PsychicCombatHelper.collectPsychicModifiers([]);
      expect(result.testBonus).toBe(0);
      expect(result.noPerils).toBe(false);
      expect(result.parts).toEqual([]);
    });

    it('collects single psychic-test modifier', () => {
      const mods = [{ effectType: 'psychic-test', modifier: 10, name: 'Psychic Hood' }];
      const result = PsychicCombatHelper.collectPsychicModifiers(mods);
      expect(result.testBonus).toBe(10);
      expect(result.parts).toEqual([{ name: 'Psychic Hood', value: 10 }]);
    });

    it('stacks multiple psychic-test modifiers', () => {
      const mods = [
        { effectType: 'psychic-test', modifier: 10, name: 'Hood' },
        { effectType: 'psychic-test', modifier: 5, name: 'Focus' }
      ];
      const result = PsychicCombatHelper.collectPsychicModifiers(mods);
      expect(result.testBonus).toBe(15);
      expect(result.parts).toHaveLength(2);
    });

    it('ignores disabled modifiers', () => {
      const mods = [{ effectType: 'psychic-test', modifier: 10, name: 'Hood', enabled: false }];
      const result = PsychicCombatHelper.collectPsychicModifiers(mods);
      expect(result.testBonus).toBe(0);
      expect(result.parts).toEqual([]);
    });

    it('detects no-perils modifier', () => {
      const mods = [{ effectType: 'no-perils', modifier: '1', source: 'Warp Stabiliser' }];
      const result = PsychicCombatHelper.collectPsychicModifiers(mods);
      expect(result.noPerils).toBe(true);
      expect(result.noPerilsSource).toBe('Warp Stabiliser');
    });

    it('handles no-perils + psychic-test combined', () => {
      const mods = [
        { effectType: 'psychic-test', modifier: 10, name: 'Hood' },
        { effectType: 'no-perils', modifier: '1', source: 'Stabiliser' }
      ];
      const result = PsychicCombatHelper.collectPsychicModifiers(mods);
      expect(result.testBonus).toBe(10);
      expect(result.noPerils).toBe(true);
    });

    it('ignores non-psychic modifiers', () => {
      const mods = [
        { effectType: 'characteristic', modifier: 10, valueAffected: 'str' },
        { effectType: 'initiative', modifier: 2 }
      ];
      const result = PsychicCombatHelper.collectPsychicModifiers(mods);
      expect(result.testBonus).toBe(0);
      expect(result.noPerils).toBe(false);
    });

    it('uses source as fallback name for psychic-test', () => {
      const mods = [{ effectType: 'psychic-test', modifier: 5, source: 'Gear Bonus' }];
      const result = PsychicCombatHelper.collectPsychicModifiers(mods);
      expect(result.parts[0].name).toBe('Gear Bonus');
    });
  });

  // ── buildFocusPowerModifiers ─────────────────────────────────────────

  describe('buildFocusPowerModifiers', () => {
    it('calculates target with WP + WP bonus only', () => {
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 25);
      expect(result.targetNumber).toBe(80);
      expect(result.modifierParts).toContain('55 Base Willpower');
      expect(result.modifierParts).toContain('+25 Psy Rating Bonus');
    });

    it('includes misc modifier', () => {
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 25, 5);
      expect(result.targetNumber).toBe(85);
      expect(result.modifierParts).toContain('+5 Misc');
    });

    it('includes psychic-test bonus', () => {
      const psychicMods = { testBonus: 10, parts: [{ name: 'Psychic Hood', value: 10 }] };
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 25, 0, psychicMods);
      expect(result.targetNumber).toBe(90);
      expect(result.modifierParts).toContain('+10 Psychic Hood');
    });

    it('includes negative psychic-test penalty', () => {
      const psychicMods = { testBonus: -10, parts: [{ name: 'Warp Interference', value: -10 }] };
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 25, 0, psychicMods);
      expect(result.targetNumber).toBe(70);
      expect(result.modifierParts).toContain('-10 Warp Interference');
    });

    it('caps target number at 90', () => {
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 40);
      // 55 + 40 = 95, capped at 90
      expect(result.targetNumber).toBe(90);
      expect(result.modifierParts).toContain('(capped at 90)');
    });

    it('high WP + high bonus still capped at 90', () => {
      const result = PsychicCombatHelper.buildFocusPowerModifiers(70, 50);
      // 70 + 50 = 120, capped at 90
      expect(result.targetNumber).toBe(90);
    });

    it('smaller WP bonus gives lower target', () => {
      // Player chose to use less than max
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 10);
      expect(result.targetNumber).toBe(65);
      expect(result.modifierParts).toContain('+10 Psy Rating Bonus');
    });

    it('zero WP bonus is valid (player chose 0)', () => {
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 0);
      expect(result.targetNumber).toBe(55);
      const hasPR = result.modifierParts.some(p => p.includes('Psy Rating'));
      expect(hasPR).toBe(false);
    });

    it('omits zero misc modifier from parts', () => {
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 25, 0);
      const hasMisc = result.modifierParts.some(p => p.includes('Misc'));
      expect(hasMisc).toBe(false);
    });

    it('omits zero-value psychic modifier parts', () => {
      const psychicMods = { testBonus: 0, parts: [{ name: 'Inactive', value: 0 }] };
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 25, 0, psychicMods);
      const hasInactive = result.modifierParts.some(p => p.includes('Inactive'));
      expect(hasInactive).toBe(false);
    });

    it('combines all modifier sources', () => {
      const psychicMods = { testBonus: 10, parts: [{ name: 'Hood', value: 10 }] };
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 25, 5, psychicMods);
      // 55 + 25 + 10 + 5 = 95, capped at 90
      expect(result.targetNumber).toBe(90);
      expect(result.modifierParts).toHaveLength(5); // WP, PR bonus, Hood, Misc, capped
    });

    it('negative misc modifier reduces target', () => {
      const result = PsychicCombatHelper.buildFocusPowerModifiers(55, 25, -10);
      expect(result.targetNumber).toBe(70);
      expect(result.modifierParts).toContain('-10 Misc');
    });
  });

  // ── buildFocusPowerLabel ─────────────────────────────────────────────

  describe('buildFocusPowerLabel', () => {
    it('shows success with DoS', () => {
      const label = PsychicCombatHelper.buildFocusPowerLabel('Smite', 80, 5, POWER_LEVELS.UNFETTERED, true, 3, 50);
      expect(label).toContain('[Focus Power] Smite');
      expect(label).toContain('Target: 80');
      expect(label).toContain('Effective Psy Rating: 5 (Unfettered)');
      expect(label).toContain('SUCCESS');
      expect(label).toContain('3 Degrees of Success');
    });

    it('shows failure with DoF', () => {
      const label = PsychicCombatHelper.buildFocusPowerLabel('Smite', 55, 5, POWER_LEVELS.UNFETTERED, false, 0, 72);
      expect(label).toContain('FAILED');
      expect(label).toContain('Degree');
    });

    it('shows automatic failure for 91+', () => {
      const label = PsychicCombatHelper.buildFocusPowerLabel('Smite', 90, 8, POWER_LEVELS.PUSH, false, 0, 93);
      expect(label).toContain('Automatic failure: 91+');
    });

    it('includes power level label', () => {
      const label = PsychicCombatHelper.buildFocusPowerLabel('Smite', 65, 3, POWER_LEVELS.FETTERED, true, 2, 40);
      expect(label).toContain('Fettered');
    });

    it('singular degree of success', () => {
      const label = PsychicCombatHelper.buildFocusPowerLabel('Smite', 80, 5, POWER_LEVELS.UNFETTERED, true, 1, 70);
      expect(label).toContain('1 Degree of Success');
    });

    it('plural degrees of success', () => {
      const label = PsychicCombatHelper.buildFocusPowerLabel('Smite', 80, 5, POWER_LEVELS.UNFETTERED, true, 4, 40);
      expect(label).toContain('4 Degrees of Success');
    });
  });

  // ── buildFocusPowerFlavor ────────────────────────────────────────────

  describe('buildFocusPowerFlavor', () => {
    it('wraps label with collapsible details', () => {
      const flavor = PsychicCombatHelper.buildFocusPowerFlavor('Test Label', ['55 Base WP', '+25 PR']);
      expect(flavor).toContain('Test Label');
      expect(flavor).toContain('<details');
      expect(flavor).toContain('Modifiers');
      expect(flavor).toContain('55 Base WP');
      expect(flavor).toContain('+25 PR');
    });

    it('includes phenomena line before details', () => {
      const phenomenaLine = '⚡ <strong>PSYCHIC PHENOMENA</strong>';
      const flavor = PsychicCombatHelper.buildFocusPowerFlavor('Label', ['55 WP'], phenomenaLine);
      const phenomenaIdx = flavor.indexOf('PSYCHIC PHENOMENA');
      const detailsIdx = flavor.indexOf('<details');
      expect(phenomenaIdx).toBeLessThan(detailsIdx);
    });

    it('handles empty modifier parts', () => {
      const flavor = PsychicCombatHelper.buildFocusPowerFlavor('Label', []);
      expect(flavor).toBe('Label');
      expect(flavor).not.toContain('<details');
    });

    it('handles empty phenomena line', () => {
      const flavor = PsychicCombatHelper.buildFocusPowerFlavor('Label', ['55 WP'], '');
      expect(flavor).not.toContain('PHENOMENA');
    });
  });

  // ── buildPhenomenaLine ───────────────────────────────────────────────

  describe('buildPhenomenaLine', () => {
    it('returns empty for no effects', () => {
      const line = PsychicCombatHelper.buildPhenomenaLine({ phenomena: false, fatigue: false }, POWER_LEVELS.UNFETTERED);
      expect(line).toBe('');
    });

    it('shows doubles message for Unfettered phenomena', () => {
      const line = PsychicCombatHelper.buildPhenomenaLine({ phenomena: true, fatigue: false }, POWER_LEVELS.UNFETTERED);
      expect(line).toContain('PSYCHIC PHENOMENA');
      expect(line).toContain('Doubles rolled!');
    });

    it('shows Push message for Push phenomena', () => {
      const line = PsychicCombatHelper.buildPhenomenaLine({ phenomena: true, fatigue: false }, POWER_LEVELS.PUSH);
      expect(line).toContain('PSYCHIC PHENOMENA');
      expect(line).toContain('Push!');
    });

    it('shows fatigue line when fatigue is true', () => {
      const line = PsychicCombatHelper.buildPhenomenaLine({ phenomena: true, fatigue: true }, POWER_LEVELS.PUSH);
      expect(line).toContain('FATIGUE');
      expect(line).toContain('Doubles on Push');
    });

    it('shows both phenomena and fatigue for Push + doubles', () => {
      const line = PsychicCombatHelper.buildPhenomenaLine({ phenomena: true, fatigue: true }, POWER_LEVELS.PUSH);
      expect(line).toContain('PSYCHIC PHENOMENA');
      expect(line).toContain('FATIGUE');
    });
  });
});
