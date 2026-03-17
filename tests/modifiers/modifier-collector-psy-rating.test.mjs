import { jest } from '@jest/globals';
import '../setup.mjs';
import { ModifierCollector } from '../../src/module/helpers/modifier-collector.mjs';

describe('ModifierCollector.applyPsyRatingModifiers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets value equal to base when no modifiers', () => {
    const psyRating = { base: 3, value: 0 };
    ModifierCollector.applyPsyRatingModifiers(psyRating, []);
    expect(psyRating.value).toBe(3);
  });

  it('adds psy-rating modifier to base', () => {
    const psyRating = { base: 3, value: 0 };
    const modifiers = [
      { name: 'Psychic Hood', modifier: 2, effectType: 'psy-rating', enabled: true }
    ];
    ModifierCollector.applyPsyRatingModifiers(psyRating, modifiers);
    expect(psyRating.value).toBe(5);
  });

  it('stacks multiple psy-rating modifiers', () => {
    const psyRating = { base: 3, value: 0 };
    const modifiers = [
      { name: 'Bonus A', modifier: 1, effectType: 'psy-rating', enabled: true },
      { name: 'Bonus B', modifier: 2, effectType: 'psy-rating', enabled: true }
    ];
    ModifierCollector.applyPsyRatingModifiers(psyRating, modifiers);
    expect(psyRating.value).toBe(6);
  });

  it('ignores disabled modifiers', () => {
    const psyRating = { base: 3, value: 0 };
    const modifiers = [
      { name: 'Disabled', modifier: 5, effectType: 'psy-rating', enabled: false }
    ];
    ModifierCollector.applyPsyRatingModifiers(psyRating, modifiers);
    expect(psyRating.value).toBe(3);
  });

  it('ignores non-psy-rating modifiers', () => {
    const psyRating = { base: 3, value: 0 };
    const modifiers = [
      { name: 'Wounds', modifier: 5, effectType: 'wounds', enabled: true }
    ];
    ModifierCollector.applyPsyRatingModifiers(psyRating, modifiers);
    expect(psyRating.value).toBe(3);
  });

  it('handles negative modifiers', () => {
    const psyRating = { base: 5, value: 0 };
    const modifiers = [
      { name: 'Penalty', modifier: -2, effectType: 'psy-rating', enabled: true }
    ];
    ModifierCollector.applyPsyRatingModifiers(psyRating, modifiers);
    expect(psyRating.value).toBe(3);
  });

  it('handles null psyRating gracefully', () => {
    expect(() => ModifierCollector.applyPsyRatingModifiers(null, [])).not.toThrow();
  });

  it('handles zero base', () => {
    const psyRating = { base: 0, value: 0 };
    ModifierCollector.applyPsyRatingModifiers(psyRating, []);
    expect(psyRating.value).toBe(0);
  });
});
