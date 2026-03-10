import { jest } from '@jest/globals';
import '../setup.mjs';
import { MeleeCombatHelper } from '../../src/module/helpers/melee-combat.mjs';
import { MELEE_MODIFIERS, COMBAT_PENALTIES } from '../../src/module/helpers/constants.mjs';

describe('MeleeCombatHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('attackDialog', () => {
    it('should be defined', () => {
      expect(MeleeCombatHelper.attackDialog).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof MeleeCombatHelper.attackDialog).toBe('function');
    });
  });
});
