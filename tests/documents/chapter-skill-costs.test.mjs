import { jest } from '@jest/globals';
import DeathwatchCharacter from '../../src/module/data/actor/character.mjs';

function prepareCharacterData(actor) {
  const model = new DeathwatchCharacter();
  Object.assign(model, actor.system);
  model.parent = actor;
  model.prepareDerivedData();
  Object.assign(actor.system, model);
}

describe('DeathwatchActor - Chapter Skill Costs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('prepareDerivedData with chapter skill cost overrides', () => {
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

      prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12000);
    });

    it('should use base cost when it is lower than chapter override', () => {
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

      prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12000); // 12000 + 0 (base 0 < chapter 100)
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

      prepareCharacterData(mockActor);

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

      prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12300); // 12000 + 0 (awareness) + 300 (command not overridden)
    });

    it('should handle partial chapter cost overrides and use lowest costs', () => {
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

      prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12000); // 12000 + 0 + 0 + 0 (all base costs are 0, lower than chapter overrides)
    });
  });
});
