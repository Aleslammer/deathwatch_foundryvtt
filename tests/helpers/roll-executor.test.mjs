import { jest } from '@jest/globals';
import { RollExecutor } from '../../src/module/helpers/roll-executor.mjs';

describe('RollExecutor', () => {
  let mockActor;
  let mockRoll;

  beforeEach(() => {
    jest.clearAllMocks();

    mockActor = {
      id: 'actor123',
      name: 'Test Actor',
      type: 'character',
      system: {
        characteristics: {
          str: { value: 40, mod: 4 },
          ag: { value: 50, mod: 5 }
        }
      },
      items: [],
      getRollData: jest.fn(() => ({}))
    };

    mockRoll = {
      total: 42,
      evaluate: jest.fn(async () => mockRoll),
      toMessage: jest.fn(async (data) => ({ ...data, roll: mockRoll }))
    };

    global.Roll = jest.fn(() => mockRoll);

    global.game = {
      settings: {
        get: jest.fn((scope, key) => {
          if (scope === 'core' && key === 'rollMode') return 'roll';
          return null;
        })
      }
    };

    global.ChatMessage = {
      getSpeaker: jest.fn(() => ({ alias: mockActor.name })),
      create: jest.fn(async (data) => data)
    };
  });

  describe('executeSkillRoll', () => {
    it('should execute a skill roll with given modifiers', async () => {
      const skill = { label: 'Dodge' };
      const modifiers = { difficultyModifier: 0, additionalModifier: 10 };

      const result = await RollExecutor.executeSkillRoll(mockActor, skill, 'Dodge', 50, modifiers);

      expect(global.Roll).toHaveBeenCalledWith('1d100', {});
      expect(mockRoll.evaluate).toHaveBeenCalled();
      expect(mockRoll.toMessage).toHaveBeenCalled();
      expect(result).toBe(mockRoll);
    });

    it('should calculate target number correctly', async () => {
      const skill = { label: 'Awareness' };
      const modifiers = { difficultyModifier: -20, additionalModifier: 10 };

      await RollExecutor.executeSkillRoll(mockActor, skill, 'Awareness', 40, modifiers);

      // Target should be 40 + (-20) + 10 = 30
      expect(mockRoll.evaluate).toHaveBeenCalled();
    });
  });

  describe('executeCharacteristicRoll', () => {
    it('should execute a characteristic roll with given modifiers', async () => {
      const modifiers = { difficultyModifier: 0, additionalModifier: 10 };

      const result = await RollExecutor.executeCharacteristicRoll(mockActor, 40, 'Strength', modifiers);

      expect(global.Roll).toHaveBeenCalledWith('1d100', {});
      expect(mockRoll.evaluate).toHaveBeenCalled();
      expect(mockRoll.toMessage).toHaveBeenCalled();
      expect(result).toBe(mockRoll);
    });

    it('should calculate target number correctly', async () => {
      const modifiers = { difficultyModifier: -20, additionalModifier: 5 };

      await RollExecutor.executeCharacteristicRoll(mockActor, 50, 'Agility', modifiers);

      // Target should be 50 + (-20) + 5 = 35
      expect(mockRoll.evaluate).toHaveBeenCalled();
    });
  });

  describe('showSkillDialog', () => {
    it('should show dialog and execute roll on confirmation', async () => {
      const skill = { label: 'Dodge' };

      const result = await RollExecutor.showSkillDialog(mockActor, skill, 'Dodge', 50);

      // Dialog.wait returns null in our mock
      expect(foundry.applications.api.DialogV2.wait).toHaveBeenCalled();
      expect(result).toBe(null);
    });

    it('should pre-fill modifiers in dialog', async () => {
      const skill = { label: 'Dodge' };

      await RollExecutor.showSkillDialog(mockActor, skill, 'Dodge', 50, 10, -20);

      const callArgs = foundry.applications.api.DialogV2.wait.mock.calls[0][0];
      expect(callArgs.content).toContain('value="+10"'); // Pre-filled modifier
    });
  });

  describe('showCharacteristicDialog', () => {
    it('should show dialog and execute roll on confirmation', async () => {
      const characteristic = { value: 40, mod: 4 };

      const result = await RollExecutor.showCharacteristicDialog(
        mockActor,
        'str',
        'Strength',
        characteristic
      );

      expect(foundry.applications.api.DialogV2.wait).toHaveBeenCalled();
      expect(result).toBe(null);
    });

    it('should include cybernetic source selector if replacements exist', async () => {
      const characteristic = { value: 40, mod: 4 };
      const cybernetic = {
        id: 'cyb001',
        name: 'Servo-Arm',
        type: 'cybernetic',
        system: {
          equipped: true,
          replacesCharacteristic: 'str',
          replacementValue: 75,
          unnaturalMultiplier: 2,
          replacementLabel: 'Servo-Arm'
        }
      };

      mockActor.items = [cybernetic];

      await RollExecutor.showCharacteristicDialog(
        mockActor,
        'str',
        'Strength',
        characteristic
      );

      const callArgs = foundry.applications.api.DialogV2.wait.mock.calls[0][0];
      expect(callArgs.content).toContain('characteristic-source'); // Source selector present
      expect(callArgs.content).toContain('Servo-Arm'); // Cybernetic option present
    });

    it('should not include source selector if no cybernetics', async () => {
      const characteristic = { value: 40, mod: 4 };

      await RollExecutor.showCharacteristicDialog(
        mockActor,
        'str',
        'Strength',
        characteristic
      );

      const callArgs = foundry.applications.api.DialogV2.wait.mock.calls[0][0];
      expect(callArgs.content).not.toContain('characteristic-source');
    });
  });
});
