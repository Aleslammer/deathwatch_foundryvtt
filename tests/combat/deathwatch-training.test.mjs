import { jest } from '@jest/globals';
import { RighteousFuryHelper } from '../../src/module/helpers/combat/righteous-fury-helper.mjs';
import { FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';
import { ENEMY_CLASSIFICATIONS } from '../../src/module/helpers/constants.mjs';

describe('Deathwatch Training', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ENEMY_CLASSIFICATIONS constant', () => {
    it('defines human, xenos, and chaos', () => {
      expect(ENEMY_CLASSIFICATIONS.HUMAN).toBe('human');
      expect(ENEMY_CLASSIFICATIONS.XENOS).toBe('xenos');
      expect(ENEMY_CLASSIFICATIONS.CHAOS).toBe('chaos');
    });
  });

  describe('hasDeathwatchTraining', () => {
    it('returns true when actor has Deathwatch Training talent', () => {
      const actor = {
        items: [
          { type: 'talent', name: 'Deathwatch Training' },
          { type: 'talent', name: 'Swift Attack' }
        ]
      };
      expect(RighteousFuryHelper.hasDeathwatchTraining(actor)).toBe(true);
    });

    it('returns false when actor lacks the talent', () => {
      const actor = {
        items: [
          { type: 'talent', name: 'Swift Attack' }
        ]
      };
      expect(RighteousFuryHelper.hasDeathwatchTraining(actor)).toBe(false);
    });

    it('returns false for null actor', () => {
      expect(RighteousFuryHelper.hasDeathwatchTraining(null)).toBe(false);
    });

    it('returns false when actor has no items', () => {
      expect(RighteousFuryHelper.hasDeathwatchTraining({ items: null })).toBe(false);
    });

    it('returns false for empty items array', () => {
      expect(RighteousFuryHelper.hasDeathwatchTraining({ items: [] })).toBe(false);
    });

    it('ignores non-talent items with the same name', () => {
      const actor = {
        items: [{ type: 'trait', name: 'Deathwatch Training' }]
      };
      expect(RighteousFuryHelper.hasDeathwatchTraining(actor)).toBe(false);
    });

    it('handles Map-based items collection', () => {
      const items = new Map();
      items.set('1', { type: 'talent', name: 'Deathwatch Training' });
      expect(RighteousFuryHelper.hasDeathwatchTraining({ items })).toBe(true);
    });
  });

  describe('isDeathwatchAutoConfirm', () => {
    const actorWithTalent = {
      items: [{ type: 'talent', name: 'Deathwatch Training' }]
    };
    const actorWithoutTalent = {
      items: [{ type: 'talent', name: 'Swift Attack' }]
    };

    it('returns true when attacker has talent and target is xenos', () => {
      const target = { system: { classification: 'xenos' } };
      expect(RighteousFuryHelper.isDeathwatchAutoConfirm(actorWithTalent, target)).toBe(true);
    });

    it('returns false when attacker has talent but target is human', () => {
      const target = { system: { classification: 'human' } };
      expect(RighteousFuryHelper.isDeathwatchAutoConfirm(actorWithTalent, target)).toBe(false);
    });

    it('returns false when attacker has talent but target is chaos', () => {
      const target = { system: { classification: 'chaos' } };
      expect(RighteousFuryHelper.isDeathwatchAutoConfirm(actorWithTalent, target)).toBe(false);
    });

    it('returns false when attacker lacks talent even if target is xenos', () => {
      const target = { system: { classification: 'xenos' } };
      expect(RighteousFuryHelper.isDeathwatchAutoConfirm(actorWithoutTalent, target)).toBe(false);
    });

    it('returns false when target is null', () => {
      expect(RighteousFuryHelper.isDeathwatchAutoConfirm(actorWithTalent, null)).toBe(false);
    });

    it('returns false when target has no classification', () => {
      const target = { system: {} };
      expect(RighteousFuryHelper.isDeathwatchAutoConfirm(actorWithTalent, target)).toBe(false);
    });
  });

  describe('processFuryChain with Deathwatch Training', () => {
    const actorWithTalent = {
      items: [{ type: 'talent', name: 'Deathwatch Training' }]
    };
    const xenosTarget = { system: { classification: 'xenos' } };
    const humanTarget = { system: { classification: 'human' } };

    it('auto-confirms against xenos target without rolling', async () => {
      const mockRoll = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
      jest.spyOn(RighteousFuryHelper, 'rollConfirmation');
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue();

      const result = await RighteousFuryHelper.processFuryChain(
        actorWithTalent, {}, '1d10+5', 50, 'Body', false, 10, xenosTarget
      );

      expect(result.furyCount).toBe(1);
      expect(RighteousFuryHelper.rollConfirmation).not.toHaveBeenCalled();
      expect(FoundryAdapter.createChatMessage).toHaveBeenCalled();
    });

    it('requires normal confirmation against human target', async () => {
      const mockRoll = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
      jest.spyOn(RighteousFuryHelper, 'rollConfirmation').mockResolvedValue(true);

      const result = await RighteousFuryHelper.processFuryChain(
        actorWithTalent, {}, '1d10+5', 50, 'Body', false, 10, humanTarget
      );

      expect(result.furyCount).toBe(1);
      expect(RighteousFuryHelper.rollConfirmation).toHaveBeenCalled();
    });

    it('requires normal confirmation when no target provided', async () => {
      const mockRoll = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
      jest.spyOn(RighteousFuryHelper, 'rollConfirmation').mockResolvedValue(true);

      const result = await RighteousFuryHelper.processFuryChain(
        actorWithTalent, {}, '1d10+5', 50, 'Body', false, 10, null
      );

      expect(result.furyCount).toBe(1);
      expect(RighteousFuryHelper.rollConfirmation).toHaveBeenCalled();
    });

    it('volatile takes priority over Deathwatch Training', async () => {
      const mockRoll = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue();

      const result = await RighteousFuryHelper.processFuryChain(
        actorWithTalent, {}, '1d10+5', 50, 'Body', true, 10, xenosTarget
      );

      expect(result.furyCount).toBe(1);
      const callArg = FoundryAdapter.createChatMessage.mock.calls[0][0];
      expect(callArg).toContain('Volatile');
    });

    it('chains auto-confirm on subsequent natural 10s against xenos', async () => {
      const mockRoll1 = { total: 20, dice: [{ faces: 10, results: [{ result: 10 }] }], toMessage: jest.fn() };
      const mockRoll2 = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn()
        .mockImplementationOnce(() => ({ evaluate: jest.fn().mockResolvedValue(mockRoll1) }))
        .mockImplementationOnce(() => ({ evaluate: jest.fn().mockResolvedValue(mockRoll2) }));
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue();

      const result = await RighteousFuryHelper.processFuryChain(
        actorWithTalent, {}, '1d10+10', 50, 'Body', false, 10, xenosTarget
      );

      expect(result.furyCount).toBe(2);
      expect(result.totalDamage).toBe(35);
      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledTimes(2);
    });
  });
});
