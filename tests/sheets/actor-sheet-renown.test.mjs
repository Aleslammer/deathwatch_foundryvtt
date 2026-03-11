import { jest } from '@jest/globals';
import '../setup.mjs';
import { DeathwatchActorSheet } from '../../src/module/sheets/actor-sheet.mjs';

describe('DeathwatchActorSheet - Renown Rank', () => {
  let sheet;
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    
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
      items: [],
      effects: [],
      toObject: jest.fn(() => ({
        type: 'character',
        system: mockActor.system
      })),
      getRollData: jest.fn(() => ({}))
    };

    sheet = new DeathwatchActorSheet(mockActor, {});
  });

  describe('_getRenownRank', () => {
    it('should return Initiated for renown 0-19', () => {
      expect(sheet._getRenownRank(0)).toBe('Initiated');
      expect(sheet._getRenownRank(10)).toBe('Initiated');
      expect(sheet._getRenownRank(19)).toBe('Initiated');
    });

    it('should return Respected for renown 20-39', () => {
      expect(sheet._getRenownRank(20)).toBe('Respected');
      expect(sheet._getRenownRank(30)).toBe('Respected');
      expect(sheet._getRenownRank(39)).toBe('Respected');
    });

    it('should return Distinguished for renown 40-59', () => {
      expect(sheet._getRenownRank(40)).toBe('Distinguished');
      expect(sheet._getRenownRank(50)).toBe('Distinguished');
      expect(sheet._getRenownRank(59)).toBe('Distinguished');
    });

    it('should return Famed for renown 60-79', () => {
      expect(sheet._getRenownRank(60)).toBe('Famed');
      expect(sheet._getRenownRank(70)).toBe('Famed');
      expect(sheet._getRenownRank(79)).toBe('Famed');
    });

    it('should return Hero for renown 80+', () => {
      expect(sheet._getRenownRank(80)).toBe('Hero');
      expect(sheet._getRenownRank(100)).toBe('Hero');
      expect(sheet._getRenownRank(999)).toBe('Hero');
    });

    it('should handle boundary values correctly', () => {
      expect(sheet._getRenownRank(19)).toBe('Initiated');
      expect(sheet._getRenownRank(20)).toBe('Respected');
      expect(sheet._getRenownRank(39)).toBe('Respected');
      expect(sheet._getRenownRank(40)).toBe('Distinguished');
      expect(sheet._getRenownRank(59)).toBe('Distinguished');
      expect(sheet._getRenownRank(60)).toBe('Famed');
      expect(sheet._getRenownRank(79)).toBe('Famed');
      expect(sheet._getRenownRank(80)).toBe('Hero');
    });
  });
});
