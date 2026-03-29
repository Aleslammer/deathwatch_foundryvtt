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

  // ── isTyranidPsyker ──────────────────────────────────────────────────

  describe('isTyranidPsyker', () => {
    it('returns true when actor has Tyranid trait', () => {
      const actor = { items: [{ type: 'trait', name: 'Tyranid' }] };
      expect(PsychicCombatHelper.isTyranidPsyker(actor)).toBe(true);
    });

    it('returns true case-insensitive', () => {
      const actor = { items: [{ type: 'trait', name: 'tyranid' }] };
      expect(PsychicCombatHelper.isTyranidPsyker(actor)).toBe(true);
    });

    it('returns false when no Tyranid trait', () => {
      const actor = { items: [{ type: 'trait', name: 'Dark Sight' }] };
      expect(PsychicCombatHelper.isTyranidPsyker(actor)).toBe(false);
    });

    it('returns false for non-trait items named Tyranid', () => {
      const actor = { items: [{ type: 'talent', name: 'Tyranid' }] };
      expect(PsychicCombatHelper.isTyranidPsyker(actor)).toBe(false);
    });

    it('returns false for null actor', () => {
      expect(PsychicCombatHelper.isTyranidPsyker(null)).toBe(false);
    });

    it('returns false for actor with no items', () => {
      expect(PsychicCombatHelper.isTyranidPsyker({ items: null })).toBe(false);
    });

    it('handles Map-based items collection', () => {
      const items = new Map();
      items.set('t1', { type: 'trait', name: 'Tyranid' });
      expect(PsychicCombatHelper.isTyranidPsyker({ items })).toBe(true);
    });

    it('returns false for empty items', () => {
      expect(PsychicCombatHelper.isTyranidPsyker({ items: [] })).toBe(false);
    });
  });

  // ── substitutePR ─────────────────────────────────────────────────────

  describe('substitutePR', () => {
    it('replaces PR in damage formula', () => {
      expect(PsychicCombatHelper.substitutePR('1d10*PR', 5)).toBe('1d10*5');
    });

    it('replaces multiple PR occurrences', () => {
      expect(PsychicCombatHelper.substitutePR('PR+PR', 3)).toBe('3+3');
    });

    it('replaces PR in penetration formula', () => {
      expect(PsychicCombatHelper.substitutePR('2*PR', 5)).toBe('2*5');
    });

    it('handles formula without PR', () => {
      expect(PsychicCombatHelper.substitutePR('1d10+8', 5)).toBe('1d10+8');
    });

    it('returns empty string for empty formula', () => {
      expect(PsychicCombatHelper.substitutePR('', 5)).toBe('');
    });

    it('returns empty string for null formula', () => {
      expect(PsychicCombatHelper.substitutePR(null, 5)).toBe('');
    });

    it('handles PR at start of formula', () => {
      expect(PsychicCombatHelper.substitutePR('PR', 8)).toBe('8');
    });

    it('handles 5*PR pattern', () => {
      expect(PsychicCombatHelper.substitutePR('5*PR', 4)).toBe('5*4');
    });
  });

  // ── resolveOpposedTest ──────────────────────────────────────────────────

  describe('resolveOpposedTest', () => {
    it('psyker wins when target fails', () => {
      const result = PsychicCombatHelper.resolveOpposedTest(3, 35, 42);
      expect(result.targetSuccess).toBe(false);
      expect(result.targetDoS).toBe(0);
      expect(result.psykerWins).toBe(true);
      expect(result.netDoS).toBe(3);
    });

    it('psyker wins when psyker has more DoS', () => {
      const result = PsychicCombatHelper.resolveOpposedTest(4, 50, 35);
      expect(result.targetSuccess).toBe(true);
      expect(result.targetDoS).toBe(1);
      expect(result.psykerWins).toBe(true);
      expect(result.netDoS).toBe(3);
    });

    it('target resists when target has equal DoS', () => {
      const result = PsychicCombatHelper.resolveOpposedTest(2, 50, 30);
      expect(result.targetDoS).toBe(2);
      expect(result.psykerWins).toBe(false);
      expect(result.netDoS).toBe(0);
    });

    it('target resists when target has more DoS', () => {
      const result = PsychicCombatHelper.resolveOpposedTest(1, 50, 10);
      expect(result.targetDoS).toBe(4);
      expect(result.psykerWins).toBe(false);
      expect(result.netDoS).toBe(-3);
    });

    it('applies misc modifier to target number', () => {
      // WP 35 + misc 20 = target 55
      const result = PsychicCombatHelper.resolveOpposedTest(2, 35, 50, 20);
      expect(result.targetNumber).toBe(55);
      expect(result.targetSuccess).toBe(true);
      expect(result.targetDoS).toBe(0);
    });

    it('negative misc modifier reduces target number', () => {
      // WP 50 + misc -20 = target 30
      const result = PsychicCombatHelper.resolveOpposedTest(2, 50, 35, -20);
      expect(result.targetNumber).toBe(30);
      expect(result.targetSuccess).toBe(false);
    });

    it('target roll exactly equal to target number succeeds', () => {
      const result = PsychicCombatHelper.resolveOpposedTest(1, 40, 40);
      expect(result.targetSuccess).toBe(true);
      expect(result.targetDoS).toBe(0);
      expect(result.psykerWins).toBe(true);
    });

    it('psyker with 0 DoS loses to target with 0 DoS (target resists on tie)', () => {
      const result = PsychicCombatHelper.resolveOpposedTest(0, 40, 40);
      expect(result.psykerWins).toBe(false);
      expect(result.netDoS).toBe(0);
    });
  });

  // ── buildOpposedResultMessage ─────────────────────────────────────────

  describe('buildOpposedResultMessage', () => {
    it('shows POWER MANIFESTS when psyker wins', () => {
      const result = { targetSuccess: false, targetDoS: 0, psykerWins: true, netDoS: 3, targetNumber: 35 };
      const msg = PsychicCombatHelper.buildOpposedResultMessage('Ork Boy', 35, 42, result, 'Compel', 3);
      expect(msg).toContain('POWER MANIFESTS');
      expect(msg).toContain('3 net DoS');
      expect(msg).toContain('Ork Boy');
      expect(msg).toContain('Compel');
    });

    it('shows POWER RESISTED when target wins', () => {
      const result = { targetSuccess: true, targetDoS: 3, psykerWins: false, netDoS: -1, targetNumber: 50 };
      const msg = PsychicCombatHelper.buildOpposedResultMessage('Ork Boy', 50, 20, result, 'Compel', 2);
      expect(msg).toContain('POWER RESISTED');
      expect(msg).toContain('Ork Boy');
    });

    it('shows target roll result and DoS', () => {
      const result = { targetSuccess: true, targetDoS: 2, psykerWins: false, netDoS: 0, targetNumber: 50 };
      const msg = PsychicCombatHelper.buildOpposedResultMessage('Target', 50, 30, result, 'Dominate', 2);
      expect(msg).toContain('rolled 30');
      expect(msg).toContain('SUCCESS');
      expect(msg).toContain('2 DoS');
    });

    it('shows FAILED for target when target fails', () => {
      const result = { targetSuccess: false, targetDoS: 0, psykerWins: true, netDoS: 2, targetNumber: 35 };
      const msg = PsychicCombatHelper.buildOpposedResultMessage('Target', 35, 50, result, 'Compel', 2);
      expect(msg).toContain('FAILED');
      expect(msg).toContain('0 DoS');
    });

    it('includes psyker DoS in message', () => {
      const result = { targetSuccess: false, targetDoS: 0, psykerWins: true, netDoS: 5, targetNumber: 30 };
      const msg = PsychicCombatHelper.buildOpposedResultMessage('Target', 30, 50, result, 'Compel', 5);
      expect(msg).toContain('5 Degrees of Success');
    });

    it('singular degree for psyker with 1 DoS', () => {
      const result = { targetSuccess: false, targetDoS: 0, psykerWins: true, netDoS: 1, targetNumber: 30 };
      const msg = PsychicCombatHelper.buildOpposedResultMessage('Target', 30, 50, result, 'Compel', 1);
      expect(msg).toContain('1 Degree of Success');
    });
  });
});
