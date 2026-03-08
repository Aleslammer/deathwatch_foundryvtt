import { jest } from '@jest/globals';
import './setup.mjs';
import { RangedCombatHelper } from '../src/module/helpers/ranged-combat.mjs';
import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from '../src/module/helpers/constants.mjs';

describe('RangedCombatHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('attackDialog', () => {
    it('should be defined', () => {
      expect(RangedCombatHelper.attackDialog).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof RangedCombatHelper.attackDialog).toBe('function');
    });
  });
});
