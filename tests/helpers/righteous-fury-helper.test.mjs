import { jest } from '@jest/globals';
import '../setup.mjs';
import { RighteousFuryHelper } from '../../src/module/helpers/righteous-fury-helper.mjs';
import { FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';

describe('RighteousFuryHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasNaturalTen', () => {
    it('detects natural 10 on d10', () => {
      const roll = {
        dice: [{
          faces: 10,
          results: [{ result: 10 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(true);
    });

    it('detects natural 5 on d5', () => {
      const roll = {
        dice: [{
          faces: 5,
          results: [{ result: 5 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(true);
    });

    it('returns false for non-10 result', () => {
      const roll = {
        dice: [{
          faces: 10,
          results: [{ result: 7 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(false);
    });

    it('detects 10 in multiple dice', () => {
      const roll = {
        dice: [{
          faces: 10,
          results: [{ result: 3 }, { result: 10 }, { result: 7 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(true);
    });

    it('detects 10 across multiple die groups', () => {
      const roll = {
        dice: [
          { faces: 10, results: [{ result: 3 }] },
          { faces: 10, results: [{ result: 10 }] }
        ]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(true);
    });
  });

  describe('rollConfirmation', () => {
    it('confirms fury on successful roll', async () => {
      const mockRoll = { total: 45 };
      jest.spyOn(FoundryAdapter, 'evaluateRoll').mockResolvedValue(mockRoll);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'sendRollToChat').mockResolvedValue();

      const result = await RighteousFuryHelper.rollConfirmation({}, 50, 'Body');

      expect(result).toBe(true);
      expect(FoundryAdapter.evaluateRoll).toHaveBeenCalledWith('1d100');
      expect(FoundryAdapter.sendRollToChat).toHaveBeenCalled();
    });

    it('fails confirmation on unsuccessful roll', async () => {
      const mockRoll = { total: 75 };
      jest.spyOn(FoundryAdapter, 'evaluateRoll').mockResolvedValue(mockRoll);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'sendRollToChat').mockResolvedValue();

      const result = await RighteousFuryHelper.rollConfirmation({}, 50, 'Body');

      expect(result).toBe(false);
    });
  });

  describe('processFuryChain', () => {
    it('processes single fury with confirmation', async () => {
      const mockRoll = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
      jest.spyOn(RighteousFuryHelper, 'rollConfirmation').mockResolvedValue(true);

      const result = await RighteousFuryHelper.processFuryChain({}, {}, '1d10+5', 50, 'Body', false);

      expect(result.furyCount).toBe(1);
      expect(result.totalDamage).toBe(15);
      expect(RighteousFuryHelper.rollConfirmation).toHaveBeenCalledTimes(1);
    });

    it('chains multiple furies with natural 10s', async () => {
      const mockRoll1 = { total: 20, dice: [{ faces: 10, results: [{ result: 10 }] }], toMessage: jest.fn() };
      const mockRoll2 = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn()
        .mockImplementationOnce(() => ({ evaluate: jest.fn().mockResolvedValue(mockRoll1) }))
        .mockImplementationOnce(() => ({ evaluate: jest.fn().mockResolvedValue(mockRoll2) }));
      jest.spyOn(RighteousFuryHelper, 'rollConfirmation').mockResolvedValue(true);

      const result = await RighteousFuryHelper.processFuryChain({}, {}, '1d10+10', 50, 'Body', false);

      expect(result.furyCount).toBe(2);
      expect(result.totalDamage).toBe(35);
    });

    it('stops chain when confirmation fails', async () => {
      const mockRoll = { total: 20, dice: [{ faces: 10, results: [{ result: 10 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
      jest.spyOn(RighteousFuryHelper, 'rollConfirmation')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await RighteousFuryHelper.processFuryChain({}, {}, '1d10+10', 50, 'Body', false);

      expect(result.furyCount).toBe(1);
    });

    it('processes volatile fury without confirmation but with chat message', async () => {
      const mockRoll = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
      jest.spyOn(RighteousFuryHelper, 'rollConfirmation');
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue();

      const result = await RighteousFuryHelper.processFuryChain({}, {}, '1d10+5', 50, 'Body', true);

      expect(result.furyCount).toBe(1);
      expect(RighteousFuryHelper.rollConfirmation).not.toHaveBeenCalled();
      expect(FoundryAdapter.createChatMessage).toHaveBeenCalled();
    });

    it('chains volatile furies automatically on natural 10', async () => {
      const mockRoll1 = { total: 20, dice: [{ faces: 10, results: [{ result: 10 }] }], toMessage: jest.fn() };
      const mockRoll2 = { total: 15, dice: [{ faces: 10, results: [{ result: 5 }] }], toMessage: jest.fn() };
      global.Roll = jest.fn()
        .mockImplementationOnce(() => ({ evaluate: jest.fn().mockResolvedValue(mockRoll1) }))
        .mockImplementationOnce(() => ({ evaluate: jest.fn().mockResolvedValue(mockRoll2) }));
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue();

      const result = await RighteousFuryHelper.processFuryChain({}, {}, '1d10+10', 50, 'Body', true);

      expect(result.furyCount).toBe(2);
      expect(result.totalDamage).toBe(35);
      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledTimes(2);
    });
  });
});
