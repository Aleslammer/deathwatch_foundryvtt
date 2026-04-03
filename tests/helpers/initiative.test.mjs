import { jest } from '@jest/globals';
import { InitiativeHelper } from '../../src/module/helpers/initiative.mjs';

describe('InitiativeHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rollInitiativeDialog', () => {
    it('calculates default bonus from agBonus and initiativeBonus', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({ agBonus: 4, initiativeBonus: 2 })
      };
      const mockCombatant = { actor: mockActor };

      foundry.applications.api.DialogV2.wait.mockResolvedValue('cancel');

      await InitiativeHelper.rollInitiativeDialog(mockCombatant);

      expect(foundry.applications.api.DialogV2.wait).toHaveBeenCalledTimes(1);
      const callArgs = foundry.applications.api.DialogV2.wait.mock.calls[0][0];
      expect(callArgs.window.title).toBe('Initiative: Test Marine');
      expect(callArgs.content).toContain('value="1d10"');
      expect(callArgs.content).toContain('value="6"');
      expect(callArgs.buttons).toHaveLength(2);
    });

    it('handles zero bonus values', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({ agBonus: 0, initiativeBonus: 0 })
      };
      const mockCombatant = { actor: mockActor };

      foundry.applications.api.DialogV2.wait.mockResolvedValue('cancel');

      await InitiativeHelper.rollInitiativeDialog(mockCombatant);

      const callArgs = foundry.applications.api.DialogV2.wait.mock.calls[0][0];
      expect(callArgs.content).toContain('value="0"');
    });

    it('handles missing bonus values', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({})
      };
      const mockCombatant = { actor: mockActor };

      foundry.applications.api.DialogV2.wait.mockResolvedValue('cancel');

      await InitiativeHelper.rollInitiativeDialog(mockCombatant);

      const callArgs = foundry.applications.api.DialogV2.wait.mock.calls[0][0];
      expect(callArgs.content).toContain('value="0"');
    });

    it('returns formula with bonus when roll button callback returns it', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({ agBonus: 4, initiativeBonus: 2 })
      };
      const mockCombatant = { actor: mockActor };

      foundry.applications.api.DialogV2.wait.mockImplementation(async (config) => {
        const rollBtn = config.buttons.find(b => b.action === 'roll');
        const mockElement = {
          querySelector: (sel) => {
            if (sel.includes('formula')) return { value: '1d10' };
            if (sel.includes('bonus')) return { value: '6' };
          }
        };
        return rollBtn.callback(null, null, { element: mockElement });
      });

      const result = await InitiativeHelper.rollInitiativeDialog(mockCombatant);
      expect(result).toBe('1d10 + 6');
    });

    it('returns formula without bonus when bonus is zero', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({ agBonus: 0, initiativeBonus: 0 })
      };
      const mockCombatant = { actor: mockActor };

      foundry.applications.api.DialogV2.wait.mockImplementation(async (config) => {
        const rollBtn = config.buttons.find(b => b.action === 'roll');
        const mockElement = {
          querySelector: (sel) => {
            if (sel.includes('formula')) return { value: '1d10' };
            if (sel.includes('bonus')) return { value: '0' };
          }
        };
        return rollBtn.callback(null, null, { element: mockElement });
      });

      const result = await InitiativeHelper.rollInitiativeDialog(mockCombatant);
      expect(result).toBe('1d10');
    });

    it('returns null when cancel action selected', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({ agBonus: 4, initiativeBonus: 2 })
      };
      const mockCombatant = { actor: mockActor };

      foundry.applications.api.DialogV2.wait.mockResolvedValue('cancel');

      const result = await InitiativeHelper.rollInitiativeDialog(mockCombatant);
      expect(result).toBe(null);
    });

    it('returns null when dialog dismissed', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({ agBonus: 4, initiativeBonus: 2 })
      };
      const mockCombatant = { actor: mockActor };

      foundry.applications.api.DialogV2.wait.mockResolvedValue(null);

      const result = await InitiativeHelper.rollInitiativeDialog(mockCombatant);
      expect(result).toBe(null);
    });
  });
});
