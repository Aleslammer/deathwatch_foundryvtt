import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';
import { RATE_OF_FIRE_MODIFIERS } from '../../src/module/helpers/constants.mjs';

describe('Unreliable Quality', () => {
  describe('determineJamThreshold', () => {
    it('returns 91 for unreliable single shot', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SINGLE, true)).toBe(91);
    });

    it('returns 91 for unreliable semi-auto', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SEMI_AUTO, true)).toBe(91);
    });

    it('returns 91 for unreliable full-auto', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.FULL_AUTO, true)).toBe(91);
    });

    it('does not affect normal single shot threshold', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SINGLE, false)).toBe(96);
    });

    it('does not affect normal semi-auto threshold', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SEMI_AUTO, false)).toBe(94);
    });

    it('defaults to non-unreliable when param omitted', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SINGLE)).toBe(96);
    });
  });
});
