import { jest } from '@jest/globals';
import './setup.mjs';
import { InitiativeHelper } from '../src/module/helpers/initiative.mjs';

describe('InitiativeHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rollInitiativeDialog', () => {
    it('calculates default bonus from agBonus and initiativeBonus', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({
          agBonus: 4,
          initiativeBonus: 2
        })
      };
      const mockCombatant = { actor: mockActor };

      const mockDialog = jest.fn();
      global.Dialog = jest.fn().mockImplementation(function(config) {
        expect(config.title).toBe('Initiative: Test Marine');
        expect(config.content).toContain('value="1d10"');
        expect(config.content).toContain('value="6"');
        expect(config.buttons.roll).toBeDefined();
        expect(config.buttons.cancel).toBeDefined();
        this.render = mockDialog;
      });

      const promise = InitiativeHelper.rollInitiativeDialog(mockCombatant);
      expect(mockDialog).toHaveBeenCalledWith(true);
    });

    it('handles zero bonus values', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({
          agBonus: 0,
          initiativeBonus: 0
        })
      };
      const mockCombatant = { actor: mockActor };

      global.Dialog = jest.fn().mockImplementation(function(config) {
        expect(config.content).toContain('value="0"');
        this.render = jest.fn();
      });

      InitiativeHelper.rollInitiativeDialog(mockCombatant);
    });

    it('handles missing bonus values', async () => {
      const mockActor = {
        name: 'Test Marine',
        getRollData: jest.fn().mockReturnValue({})
      };
      const mockCombatant = { actor: mockActor };

      global.Dialog = jest.fn().mockImplementation(function(config) {
        expect(config.content).toContain('value="0"');
        this.render = jest.fn();
      });

      InitiativeHelper.rollInitiativeDialog(mockCombatant);
    });
  });
});
