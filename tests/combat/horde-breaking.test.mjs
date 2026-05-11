import { jest } from '@jest/globals';
import { HordeBreakingHelper } from '../../src/module/helpers/combat/horde-breaking.mjs';
import { FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';

describe('HordeBreakingHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FoundryAdapter.updateDocument = jest.fn();
    FoundryAdapter.createChatMessage = jest.fn();
    FoundryAdapter.getChatSpeaker = jest.fn(() => ({ alias: 'Test' }));
  });

  describe('checkBreaking', () => {
    function createHorde(magnitude, magnitudeThisTurn, hasDisciplined = false) {
      const maxMagnitude = 30;
      const currentMagnitude = magnitude;
      const magnitudeLost = magnitudeThisTurn;

      const actor = {
        type: 'horde',
        system: {
          magnitudeThisTurn: magnitudeLost,
          wounds: {
            max: maxMagnitude,
            value: maxMagnitude - currentMagnitude
          }
        },
        items: hasDisciplined ? [{ type: 'trait', name: 'Disciplined' }] : []
      };

      return actor;
    }

    it('returns shouldCheck false for non-horde actors', async () => {
      const actor = { type: 'character' };
      const result = await HordeBreakingHelper.checkBreaking(actor);
      expect(result.shouldCheck).toBe(false);
    });

    it('returns shouldCheck false when lost less than 25% this turn and above 25% magnitude', async () => {
      const actor = createHorde(20, 5); // 66% magnitude, lost 16.7% this turn
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(false);
      expect(result.percentLost).toBeCloseTo(16.67, 1);
      expect(result.currentPercent).toBeCloseTo(66.67, 1);
    });

    it('auto-breaks when magnitude below 25% without Disciplined trait', async () => {
      const actor = createHorde(6, 0); // 20% magnitude, no damage this turn
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(true);
      expect(result.autoBreaks).toBe(true);
      expect(result.needsTest).toBe(false);
      expect(result.currentPercent).toBe(20);
      expect(result.hasDisciplined).toBe(false);
    });

    it('does not auto-break when magnitude below 25% with Disciplined trait', async () => {
      const actor = createHorde(6, 8, true); // 20% magnitude, lost 26.7% this turn, has Disciplined
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(true);
      expect(result.autoBreaks).toBe(false);
      expect(result.needsTest).toBe(true);
      expect(result.hasDisciplined).toBe(true);
    });

    it('requires WP test when lost 25%+ this turn at 60% magnitude', async () => {
      const actor = createHorde(18, 8); // 60% magnitude, lost 26.7% this turn
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(true);
      expect(result.autoBreaks).toBe(false);
      expect(result.needsTest).toBe(true);
      expect(result.penalty).toBe(0); // No penalty above 50%
      expect(result.percentLost).toBeCloseTo(26.67, 1);
      expect(result.currentPercent).toBe(60);
    });

    it('applies -10 penalty when below 50% magnitude', async () => {
      const actor = createHorde(12, 8); // 40% magnitude, lost 26.7% this turn
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(true);
      expect(result.needsTest).toBe(true);
      expect(result.penalty).toBe(-10);
      expect(result.currentPercent).toBe(40);
    });

    it('does not apply penalty below 50% with Disciplined trait', async () => {
      const actor = createHorde(12, 8, true); // 40% magnitude, lost 26.7%, has Disciplined
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(true);
      expect(result.needsTest).toBe(true);
      expect(result.penalty).toBe(0);
      expect(result.hasDisciplined).toBe(true);
    });

    it('auto-breaks at exactly 25% magnitude without Disciplined', async () => {
      const actor = createHorde(7.5, 0); // Exactly 25% magnitude
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(false); // 25% is NOT below 25%
    });

    it('auto-breaks just below 25% magnitude', async () => {
      const actor = createHorde(7, 0); // 23.3% magnitude
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(true);
      expect(result.autoBreaks).toBe(true);
    });

    it('checks breaking at exactly 25% damage in one turn', async () => {
      const actor = createHorde(22, 7.5); // 73.3% magnitude, lost exactly 25%
      const result = await HordeBreakingHelper.checkBreaking(actor);

      expect(result.shouldCheck).toBe(true);
      expect(result.needsTest).toBe(true);
      expect(result.percentLost).toBe(25);
    });
  });

  describe('applyBroken', () => {
    it('applies both broken and dead conditions', async () => {
      const setCondition = jest.fn();
      const actor = {
        name: 'Ork Mob',
        id: 'ork1',
        type: 'horde',
        system: {
          wounds: { max: 30, value: 25 }
        },
        setCondition
      };

      await HordeBreakingHelper.applyBroken(actor, false);

      expect(setCondition).toHaveBeenCalledWith('broken', true);
      expect(setCondition).toHaveBeenCalledWith('dead', true);
      expect(setCondition).toHaveBeenCalledTimes(2);
    });

    it('posts chat message for failed WP test', async () => {
      const actor = {
        name: 'Ork Mob',
        id: 'ork1',
        type: 'horde',
        system: {
          wounds: { max: 30, value: 12 }
        },
        setCondition: jest.fn()
      };

      await HordeBreakingHelper.applyBroken(actor, false);

      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('HORDE BREAKS')
        })
      );
      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Failed Willpower test')
        })
      );
    });

    it('posts chat message for auto-break with magnitude percentage', async () => {
      const actor = {
        name: 'Ork Mob',
        id: 'ork1',
        type: 'horde',
        system: {
          wounds: { max: 30, value: 24 }
        },
        setCondition: jest.fn()
      };

      await HordeBreakingHelper.applyBroken(actor, true);

      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Magnitude below 25%')
        })
      );
      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('20% remaining')
        })
      );
    });

    it('handles actor without setCondition method gracefully', async () => {
      const actor = {
        name: 'Ork Mob',
        id: 'ork1',
        type: 'horde',
        system: {
          wounds: { max: 30, value: 25 }
        }
        // No setCondition method
      };

      await expect(HordeBreakingHelper.applyBroken(actor, false)).resolves.not.toThrow();
      expect(FoundryAdapter.createChatMessage).toHaveBeenCalled();
    });
  });

  describe('resetTurnCounter', () => {
    it('resets magnitudeThisTurn to 0 for horde actors', async () => {
      const actor = {
        type: 'horde',
        id: 'horde1'
      };

      await HordeBreakingHelper.resetTurnCounter(actor);

      expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(actor, {
        "system.magnitudeThisTurn": 0
      });
    });

    it('does nothing for non-horde actors', async () => {
      const actor = {
        type: 'character',
        id: 'char1'
      };

      await HordeBreakingHelper.resetTurnCounter(actor);

      expect(FoundryAdapter.updateDocument).not.toHaveBeenCalled();
    });
  });
});
