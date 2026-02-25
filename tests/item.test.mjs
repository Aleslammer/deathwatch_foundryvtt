import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchItem } from '../src/module/documents/item.mjs';

describe('DeathwatchItem', () => {
  let mockItem;

  beforeEach(() => {
    mockItem = new DeathwatchItem({
      name: 'Test Item',
      type: 'weapon',
      system: {
        description: 'Test description',
        formula: null
      }
    });
  });

  describe('prepareData', () => {
    it('calls super.prepareData', () => {
      const prepareDataSpy = jest.spyOn(mockItem, 'prepareData');
      mockItem.prepareData();
      expect(prepareDataSpy).toHaveBeenCalled();
      prepareDataSpy.mockRestore();
    });
  });

  describe('getRollData', () => {
    it('returns null if no actor', () => {
      mockItem.actor = null;
      const result = mockItem.getRollData();
      expect(result).toBeNull();
    });

    it('returns actor roll data with item system data', () => {
      const mockActor = {
        getRollData: jest.fn(() => ({
          str: 40,
          strBonus: 4
        }))
      };
      mockItem.actor = mockActor;
      mockItem.system = {
        damage: '1d10',
        penetration: 4
      };

      const result = mockItem.getRollData();

      expect(result.str).toBe(40);
      expect(result.strBonus).toBe(4);
      expect(result.item).toEqual({
        damage: '1d10',
        penetration: 4
      });
    });

    it('deep clones item system data', () => {
      const mockActor = {
        getRollData: jest.fn(() => ({}))
      };
      mockItem.actor = mockActor;
      mockItem.system = {
        nested: { value: 10 }
      };

      const result = mockItem.getRollData();
      result.item.nested.value = 20;

      expect(mockItem.system.nested.value).toBe(10);
    });
  });

  describe('roll', () => {
    let mockActor, mockSpeaker;

    beforeEach(() => {
      mockActor = {
        getRollData: jest.fn(() => ({ str: 40 }))
      };
      mockItem.actor = mockActor;
      mockSpeaker = { alias: 'Test Actor' };
      
      global.ChatMessage = {
        getSpeaker: jest.fn(() => mockSpeaker),
        create: jest.fn()
      };
      global.game = {
        settings: {
          get: jest.fn(() => 'roll')
        }
      };
    });

    it('creates chat message without formula', async () => {
      mockItem.system.formula = null;
      mockItem.system.description = 'Test description';

      await mockItem.roll();

      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: mockSpeaker,
        rollMode: 'roll',
        flavor: '[weapon] Test Item',
        content: 'Test description'
      });
    });

    it('uses empty string if no description', async () => {
      mockItem.system.formula = null;
      mockItem.system.description = null;

      await mockItem.roll();

      expect(global.ChatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: ''
        })
      );
    });

    it('creates roll with formula', async () => {
      mockItem.system.formula = '1d10 + @str';
      const mockRoll = {
        toMessage: jest.fn()
      };
      global.Roll = jest.fn(() => mockRoll);

      const result = await mockItem.roll();

      expect(global.Roll).toHaveBeenCalledWith('1d10 + @str', expect.objectContaining({
        str: 40,
        item: expect.any(Object)
      }));
      expect(mockRoll.toMessage).toHaveBeenCalledWith({
        speaker: mockSpeaker,
        rollMode: 'roll',
        flavor: '[weapon] Test Item'
      });
      expect(result).toBe(mockRoll);
    });

    it('gets roll mode from settings', async () => {
      global.game.settings.get = jest.fn(() => 'blindroll');
      mockItem.system.formula = null;

      await mockItem.roll();

      expect(global.game.settings.get).toHaveBeenCalledWith('core', 'rollMode');
      expect(global.ChatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rollMode: 'blindroll'
        })
      );
    });

    it('formats label with item type and name', async () => {
      mockItem.name = 'Bolter';
      mockItem.type = 'weapon';
      mockItem.system.formula = null;

      await mockItem.roll();

      expect(global.ChatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          flavor: '[weapon] Bolter'
        })
      );
    });
  });
});
