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
            awareness: { trained: true }  // Costs 0 XP from skills.json
          },
          characteristics: {},
          modifiers: []
        },
        items: []
      };

      prepareCharacterData(mockActor);

      expect(mockActor.system.xp.spent).toBe(12000);  // 12000 starting + 0 (awareness trained)
    });

    it('should use base cost when it is lower than chapter override', () => {
      const chapterItem = {
        _id: 'chapter1',
        type: 'chapter',
        system: {
          skillCosts: {
            awareness: {
              costTrain: 250  // Chapter provides 250, base is 0
            }
          }
        }
      };

      const mockActor = {
        type: 'character',
        system: {
          chapterId: 'chapter1',
          xp: { total: 13000 },
          skills: {
            awareness: { trained: true }  // Uses lowest: min(0 base, 250 chapter) = 0
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

      expect(mockActor.system.xp.spent).toBe(12000); // 12000 + 0 (base 0 < chapter 250)
    });

    it('should apply chapter costs for multiple skill levels', () => {
      const chapterItem = {
        _id: 'chapter1',
        type: 'chapter',
        system: {
          skillCosts: {
            interrogation: {
              costTrain: 200,
              costMaster: 200,
              costExpert: 200
            }
          }
        }
      };

      const mockActor = {
        type: 'character',
        system: {
          rank: 3,  // Must be rank 3 to access all levels
          chapterId: 'chapter1',
          xp: { total: 13000 },
          skills: {
            interrogation: {
              trained: true,
              mastered: true,
              expert: true
              // Base costs: 400/400/400, chapter costs: 200/200/200, uses lowest: 200 each
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

      expect(mockActor.system.xp.spent).toBe(12600);  // 12000 + 200 + 200 + 200
    });

    it('should use default costs for skills not overridden by chapter', () => {
      const chapterItem = {
        _id: 'chapter1',
        type: 'chapter',
        system: {
          skillCosts: {
            command: {
              costTrain: 100  // Chapter provides 100, base is 300
            }
          }
        }
      };

      const mockActor = {
        type: 'character',
        system: {
          rank: 2,  // Needed for command trained (rank 2 requirement)
          chapterId: 'chapter1',
          xp: { total: 13000 },
          skills: {
            command: { trained: true }  // min(300 base, 100 chapter) = 100
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

      expect(mockActor.system.xp.spent).toBe(12100); // 12000 + 100 (command with chapter override)
    });

    it('should handle partial chapter cost overrides and use lowest costs', () => {
      const chapterItem = {
        _id: 'chapter1',
        type: 'chapter',
        system: {
          skillCosts: {
            awareness: {
              costTrain: 100,  // Chapter provides 100 (higher than base 0)
              costMaster: 100   // Chapter provides 100 (lower than base 300)
            }
          }
        }
      };

      const mockActor = {
        type: 'character',
        system: {
          rank: 2,
          chapterId: 'chapter1',
          xp: { total: 13000 },
          skills: {
            awareness: {
              trained: true,   // min(0 base, 100 chapter) = 0
              mastered: true   // min(300 base, 100 chapter) = 100
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

      expect(mockActor.system.xp.spent).toBe(12100); // 12000 + 0 (trained uses base) + 100 (mastered uses chapter)
    });
  });
});
