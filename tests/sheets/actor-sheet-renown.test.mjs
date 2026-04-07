import { jest } from '@jest/globals';
import { DeathwatchActorSheet } from '../../src/module/sheets/actor-sheet.mjs';
import { CharacterDataPreparer } from '../../src/module/sheets/shared/data-preparers/character-data-preparer.mjs';

describe('DeathwatchActorSheet - Renown Rank', () => {
  let sheet;
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock game.deathwatch.config for CharacterDataPreparer
    global.game = {
      deathwatch: {
        config: {
          CharacteristicWords: {},
          Skills: {}
        }
      },
      i18n: {
        localize: jest.fn((key) => key)
      }
    };

    mockActor = {
      type: 'character',
      name: 'Test Marine',
      img: 'test.png',
      system: {
        renown: 0,
        characteristics: {},
        skills: {},
        wounds: { value: 10, max: 20 },
        fatigue: { value: 0, max: 5 }
      },
      items: {
        get: jest.fn()
      },
      effects: [],
      toObject: jest.fn(() => ({
        type: 'character',
        system: mockActor.system
      })),
      getRollData: jest.fn(() => ({}))
    };

    sheet = new DeathwatchActorSheet(mockActor, {});
  });

  describe('renown rank (via CharacterDataPreparer)', () => {
    it('should return Initiated for renown 0-19', () => {
      let context = { system: { characteristics: {}, skills: {}, renown: 0 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Initiated');

      context = { system: { characteristics: {}, skills: {}, renown: 10 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Initiated');

      context = { system: { characteristics: {}, skills: {}, renown: 19 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Initiated');
    });

    it('should return Respected for renown 20-39', () => {
      let context = { system: { characteristics: {}, skills: {}, renown: 20 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Respected');

      context = { system: { characteristics: {}, skills: {}, renown: 30 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Respected');

      context = { system: { characteristics: {}, skills: {}, renown: 39 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Respected');
    });

    it('should return Distinguished for renown 40-59', () => {
      let context = { system: { characteristics: {}, skills: {}, renown: 40 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Distinguished');

      context = { system: { characteristics: {}, skills: {}, renown: 50 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Distinguished');

      context = { system: { characteristics: {}, skills: {}, renown: 59 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Distinguished');
    });

    it('should return Famed for renown 60-79', () => {
      let context = { system: { characteristics: {}, skills: {}, renown: 60 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Famed');

      context = { system: { characteristics: {}, skills: {}, renown: 70 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Famed');

      context = { system: { characteristics: {}, skills: {}, renown: 79 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Famed');
    });

    it('should return Hero for renown 80+', () => {
      let context = { system: { characteristics: {}, skills: {}, renown: 80 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Hero');

      context = { system: { characteristics: {}, skills: {}, renown: 100 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Hero');

      context = { system: { characteristics: {}, skills: {}, renown: 999 } };
      CharacterDataPreparer.prepare(context, mockActor);
      expect(context.renownRank).toBe('Hero');
    });

    it('should handle boundary values correctly', () => {
      const testCases = [
        { renown: 19, expected: 'Initiated' },
        { renown: 20, expected: 'Respected' },
        { renown: 39, expected: 'Respected' },
        { renown: 40, expected: 'Distinguished' },
        { renown: 59, expected: 'Distinguished' },
        { renown: 60, expected: 'Famed' },
        { renown: 79, expected: 'Famed' },
        { renown: 80, expected: 'Hero' }
      ];

      for (const { renown, expected } of testCases) {
        const context = { system: { characteristics: {}, skills: {}, renown } };
        CharacterDataPreparer.prepare(context, mockActor);
        expect(context.renownRank).toBe(expected);
      }
    });
  });
});
