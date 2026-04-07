import { jest } from '@jest/globals';
import { applyOnFireEffects } from '../../src/module/macros/on-fire-effects.mjs';
import { FireHelper } from '../../src/module/helpers/combat/fire-helper.mjs';

describe('applyOnFireEffects', () => {
  let mockActor;
  let mockRoll;
  let mockToken;

  beforeEach(() => {
    jest.clearAllMocks();

    mockToken = {
      document: {
        id: 'token123',
        parent: {
          id: 'scene456'
        }
      }
    };

    mockActor = {
      name: 'Test Marine',
      id: 'actor1',
      system: {
        wounds: { value: 10, max: 20 },
        fatigue: { value: 1, max: 10 },
        characteristics: {
          wil: { value: 45 }
        }
      },
      update: jest.fn().mockResolvedValue({}),
      getActiveTokens: jest.fn(() => [mockToken])
    };

    mockRoll = {
      total: 7,
      evaluate: jest.fn(function() { return Promise.resolve(this); }),
      toMessage: jest.fn().mockResolvedValue({})
    };

    global.Roll = jest.fn(() => mockRoll);
    global.ChatMessage = {
      getSpeaker: jest.fn(() => ({ alias: 'Test Marine' })),
      create: jest.fn().mockResolvedValue({})
    };
  });

  describe('damage application', () => {
    it('applies 1d10 Energy damage to wounds', async () => {
      mockRoll.total = 8;

      await applyOnFireEffects(mockActor);

      expect(global.Roll).toHaveBeenCalledWith('1d10');
      expect(mockRoll.evaluate).toHaveBeenCalled();
      expect(mockActor.update).toHaveBeenCalledWith({
        'system.wounds.value': 18 // 10 + 8
      });
    });

    it('handles actor at max wounds', async () => {
      mockActor.system.wounds.value = 20;
      mockRoll.total = 5;

      await applyOnFireEffects(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.wounds.value': 25 // 20 + 5 (critical damage)
      });
    });

    it('handles actor with 0 wounds', async () => {
      mockActor.system.wounds.value = 0;
      mockRoll.total = 3;

      await applyOnFireEffects(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.wounds.value': 3
      });
    });
  });

  describe('fatigue application', () => {
    it('adds 1 fatigue', async () => {
      mockActor.system.fatigue.value = 2;

      await applyOnFireEffects(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.fatigue.value': 3
      });
    });

    it('handles actor with 0 fatigue', async () => {
      mockActor.system.fatigue.value = 0;

      await applyOnFireEffects(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.fatigue.value': 1
      });
    });

    it('can increase fatigue to max', async () => {
      mockActor.system.fatigue.value = 9;
      mockActor.system.fatigue.max = 10;

      await applyOnFireEffects(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.fatigue.value': 10
      });
    });
  });

  describe('willpower test', () => {
    it('performs WP test when actor has no power armor', async () => {
      jest.spyOn(FireHelper, 'hasPowerArmor').mockReturnValue(false);
      mockRoll.total = 30;
      mockActor.system.characteristics.wil.value = 45;

      await applyOnFireEffects(mockActor);

      expect(FireHelper.hasPowerArmor).toHaveBeenCalledWith(mockActor);
      expect(global.Roll).toHaveBeenCalledWith('1d100');
    });

    it('auto-passes WP test when actor has power armor', async () => {
      jest.spyOn(FireHelper, 'hasPowerArmor').mockReturnValue(true);
      jest.spyOn(FireHelper, 'buildOnFireMessage').mockReturnValue('<div>message</div>');

      await applyOnFireEffects(mockActor);

      expect(FireHelper.hasPowerArmor).toHaveBeenCalledWith(mockActor);
      expect(FireHelper.buildOnFireMessage).toHaveBeenCalledWith(
        'Test Marine',
        expect.any(Number),
        expect.any(Number),
        20,
        expect.any(Number),
        { autoPass: true },
        'actor1',
        'scene456',
        'token123'
      );
    });

    it('includes roll result when no power armor', async () => {
      jest.spyOn(FireHelper, 'hasPowerArmor').mockReturnValue(false);
      jest.spyOn(FireHelper, 'buildOnFireMessage').mockReturnValue('<div>message</div>');
      mockRoll.total = 35;
      mockActor.system.characteristics.wil.value = 50;

      await applyOnFireEffects(mockActor);

      expect(FireHelper.buildOnFireMessage).toHaveBeenCalledWith(
        'Test Marine',
        expect.any(Number),
        expect.any(Number),
        20,
        expect.any(Number),
        { roll: 35, success: true, wp: 50 },
        'actor1',
        'scene456',
        'token123'
      );
    });

    it('marks WP test as failed when roll exceeds WP', async () => {
      jest.spyOn(FireHelper, 'hasPowerArmor').mockReturnValue(false);
      jest.spyOn(FireHelper, 'buildOnFireMessage').mockReturnValue('<div>message</div>');
      mockRoll.total = 60;
      mockActor.system.characteristics.wil.value = 45;

      await applyOnFireEffects(mockActor);

      expect(FireHelper.buildOnFireMessage).toHaveBeenCalledWith(
        'Test Marine',
        expect.any(Number),
        expect.any(Number),
        20,
        expect.any(Number),
        { roll: 60, success: false, wp: 45 },
        'actor1',
        'scene456',
        'token123'
      );
    });
  });

  describe('chat message', () => {
    it('creates chat message with correct content', async () => {
      jest.spyOn(FireHelper, 'buildOnFireMessage').mockReturnValue('<div>Fire Effects Message</div>');

      await applyOnFireEffects(mockActor);

      expect(FireHelper.buildOnFireMessage).toHaveBeenCalled();
      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        content: '<div>Fire Effects Message</div>',
        speaker: { alias: 'Test Marine' }
      });
    });

    it('gets speaker from actor', async () => {
      await applyOnFireEffects(mockActor);

      expect(global.ChatMessage.getSpeaker).toHaveBeenCalledWith({ actor: mockActor });
    });
  });

  describe('token handling', () => {
    it('extracts scene and token IDs for linked tokens', async () => {
      jest.spyOn(FireHelper, 'buildOnFireMessage').mockReturnValue('<div>message</div>');

      await applyOnFireEffects(mockActor);

      expect(FireHelper.buildOnFireMessage).toHaveBeenCalledWith(
        'Test Marine',
        expect.any(Number),
        10,
        20,
        expect.any(Number),
        expect.any(Object),
        'actor1',
        'scene456',
        'token123'
      );
    });

    it('handles actor with no active tokens', async () => {
      mockActor.getActiveTokens = jest.fn(() => []);
      jest.spyOn(FireHelper, 'buildOnFireMessage').mockReturnValue('<div>message</div>');

      await applyOnFireEffects(mockActor);

      expect(FireHelper.buildOnFireMessage).toHaveBeenCalledWith(
        'Test Marine',
        expect.any(Number),
        10,
        20,
        expect.any(Number),
        expect.any(Object),
        'actor1',
        '',
        ''
      );
    });

    it('handles actor without getActiveTokens method', async () => {
      mockActor.getActiveTokens = undefined;
      jest.spyOn(FireHelper, 'buildOnFireMessage').mockReturnValue('<div>message</div>');

      await applyOnFireEffects(mockActor);

      expect(FireHelper.buildOnFireMessage).toHaveBeenCalledWith(
        'Test Marine',
        expect.any(Number),
        10,
        20,
        expect.any(Number),
        expect.any(Object),
        'actor1',
        '',
        ''
      );
    });
  });

  describe('edge cases', () => {
    it('handles missing wounds values gracefully', async () => {
      mockActor.system.wounds = undefined;

      await applyOnFireEffects(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.wounds.value': expect.any(Number)
      });
    });

    it('handles missing fatigue values gracefully', async () => {
      mockActor.system.fatigue = undefined;

      await applyOnFireEffects(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.fatigue.value': 1
      });
    });

    it('handles missing characteristics gracefully', async () => {
      mockActor.system.characteristics = undefined;
      jest.spyOn(FireHelper, 'hasPowerArmor').mockReturnValue(false);

      await applyOnFireEffects(mockActor);

      // Should not crash, WP defaults to 0
      expect(mockActor.update).toHaveBeenCalled();
    });

    it('handles Roll returning different values on each call', async () => {
      const damageRoll = { total: 6, evaluate: jest.fn(function() { return Promise.resolve(this); }) };
      const wpRoll = { total: 45, evaluate: jest.fn(function() { return Promise.resolve(this); }) };

      global.Roll = jest.fn()
        .mockReturnValueOnce(damageRoll)
        .mockReturnValueOnce(wpRoll);

      jest.spyOn(FireHelper, 'hasPowerArmor').mockReturnValue(false);
      jest.spyOn(FireHelper, 'buildOnFireMessage').mockReturnValue('<div>message</div>');
      mockActor.system.characteristics.wil.value = 50;

      await applyOnFireEffects(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.wounds.value': 16 // 10 + 6
      });
      expect(FireHelper.buildOnFireMessage).toHaveBeenCalledWith(
        'Test Marine',
        6, // damage roll
        10,
        20,
        2,
        { roll: 45, success: true, wp: 50 },
        'actor1',
        'scene456',
        'token123'
      );
    });
  });
});
