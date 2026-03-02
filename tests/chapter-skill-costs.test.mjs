import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchActor } from '../src/module/documents/actor.mjs';

describe('DeathwatchActor - Chapter Skill Costs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('_prepareCharacterData with chapter skill cost overrides', () => {
    it('should use default skill costs when no chapter is assigned', () => {
      const mockActor = {
        type: 'character',
        system: {
          chapterId: '',
          xp: { total: 13000 },
          skills: {
            awareness: { trained: true, costTrain: 0, costMaster: 300, costExpert: 800 }
          },
          characteristics: {},
          modifiers: []
        },
        items: []
      };

      const actor = Object.create(DeathwatchActor.prototype);
      Object.assign(actor, mockActor);
      actor._prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12000);
    });

    it('should override skill costs when chapter is assigned', () => {
      const chapterItem = {
        _id: 'chapter1',
        type: 'chapter',
        system: {
          skillCosts: {
            awareness: { costTrain: 100, costMaster: 200, costExpert: 600 }
          }
        }
      };

      const mockActor = {
        type: 'character',
        system: {
          chapterId: 'chapter1',
          xp: { total: 13000 },
          skills: {
            awareness: { trained: true, costTrain: 0, costMaster: 300, costExpert: 800 }
          },
          characteristics: {},
          modifiers: []
        },
        items: {
          get: jest.fn((id) => id === 'chapter1' ? chapterItem : null),
          [Symbol.iterator]: function* () { yield chapterItem; }
        }
      };

      const actor = Object.create(DeathwatchActor.prototype);
      Object.assign(actor, mockActor);
      actor._prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12100);
    });

    it('should apply chapter costs for multiple skill levels', () => {
      const chapterItem = {
        _id: 'chapter1',
        type: 'chapter',
        system: {
          skillCosts: {
            interrogation: { costTrain: 200, costMaster: 200, costExpert: 200 }
          }
        }
      };

      const mockActor = {
        type: 'character',
        system: {
          chapterId: 'chapter1',
          xp: { total: 13000 },
          skills: {
            interrogation: { 
              trained: true, 
              mastered: true, 
              expert: true,
              costTrain: 400, 
              costMaster: 400, 
              costExpert: 400 
            }
          },
          characteristics: {},
          modifiers: []
        },
        items: {
          get: jest.fn((id) => id === 'chapter1' ? chapterItem : null),
          [Symbol.iterator]: function* () { yield chapterItem; }
        }
      };

      const actor = Object.create(DeathwatchActor.prototype);
      Object.assign(actor, mockActor);
      actor._prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12600);
    });

    it('should use default costs for skills not overridden by chapter', () => {
      const chapterItem = {
        _id: 'chapter1',
        type: 'chapter',
        system: {
          skillCosts: {
            awareness: { costTrain: 100, costMaster: 200, costExpert: 600 }
          }
        }
      };

      const mockActor = {
        type: 'character',
        system: {
          chapterId: 'chapter1',
          xp: { total: 13000 },
          skills: {
            awareness: { trained: true, costTrain: 0, costMaster: 300, costExpert: 800 },
            command: { trained: true, costTrain: 300, costMaster: 500, costExpert: 800 }
          },
          characteristics: {},
          modifiers: []
        },
        items: {
          get: jest.fn((id) => id === 'chapter1' ? chapterItem : null),
          [Symbol.iterator]: function* () { yield chapterItem; }
        }
      };

      const actor = Object.create(DeathwatchActor.prototype);
      Object.assign(actor, mockActor);
      actor._prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12400);
    });

    it('should handle partial chapter cost overrides', () => {
      const chapterItem = {
        _id: 'chapter1',
        type: 'chapter',
        system: {
          skillCosts: {
            acrobatics: { costTrain: 200, costMaster: 600 }
          }
        }
      };

      const mockActor = {
        type: 'character',
        system: {
          chapterId: 'chapter1',
          xp: { total: 13000 },
          skills: {
            acrobatics: { 
              trained: true, 
              mastered: true, 
              expert: true,
              costTrain: 0, 
              costMaster: 0, 
              costExpert: 0 
            }
          },
          characteristics: {},
          modifiers: []
        },
        items: {
          get: jest.fn((id) => id === 'chapter1' ? chapterItem : null),
          [Symbol.iterator]: function* () { yield chapterItem; }
        }
      };

      const actor = Object.create(DeathwatchActor.prototype);
      Object.assign(actor, mockActor);
      actor._prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12800);
    });
  });
});
