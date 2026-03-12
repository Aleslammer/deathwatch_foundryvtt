import { jest } from '@jest/globals';
import '../setup.mjs';
import { XPCalculator } from '../../src/module/helpers/xp-calculator.mjs';

describe('XPCalculator', () => {
  describe('calculateRank', () => {
    it('returns rank 1 for starting XP', () => {
      expect(XPCalculator.calculateRank(13000)).toBe(1);
    });

    it('returns rank 1 for XP below 17000', () => {
      expect(XPCalculator.calculateRank(16999)).toBe(1);
    });

    it('returns rank 2 for XP at 17000', () => {
      expect(XPCalculator.calculateRank(17000)).toBe(2);
    });

    it('returns rank 8 for max XP', () => {
      expect(XPCalculator.calculateRank(50000)).toBe(8);
    });

    it('returns rank 1 for null XP', () => {
      expect(XPCalculator.calculateRank(null)).toBe(1);
    });

    it('returns rank 1 for undefined XP', () => {
      expect(XPCalculator.calculateRank(undefined)).toBe(1);
    });
  });

  describe('calculateSpentXP', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        system: {
          chapterId: null,
          specialtyId: null,
          characteristics: {},
          skills: {}
        },
        items: {
          get: jest.fn(),
          [Symbol.iterator]: function* () {}
        }
      };
    });

    it('returns starting XP with no advances', () => {
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000);
    });

    it('includes characteristic advance costs', () => {
      const mockSpecialty = {
        system: {
          characteristicCosts: {
            ws: { simple: 200, intermediate: 500 },
            bs: { simple: 500 }
          }
        }
      };
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.characteristics = {
        ws: { advances: { simple: true, intermediate: true } },
        bs: { advances: { simple: true } }
      };
      mockActor.items.get = jest.fn(() => mockSpecialty);
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(13200); // 12000 + 200 + 500 + 500
    });

    it('includes talent costs', () => {
      mockActor.items = [
        { type: 'talent', name: 'Talent1', system: { cost: 300 }, _id: 'id1' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12300);
    });

    it('handles stackable talents with subsequent costs', () => {
      mockActor.items = [
        { type: 'talent', name: 'Stackable', system: { cost: 300, stackable: true, subsequentCost: 200 }, _id: 'id1' },
        { type: 'talent', name: 'Stackable', system: { cost: 300, stackable: true, subsequentCost: 200 }, _id: 'id2' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12500); // 12000 + 300 + 200
    });

    it('includes skill costs', () => {
      mockActor.items = [];
      mockActor.system.skills = {
        awareness: { trained: true, costTrain: 200 },
        dodge: { trained: true, mastered: true, costTrain: 200, costMaster: 300 }
      };
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12700); // 12000 + 200 + 200 + 300
    });

    it('treats -1 skill costs as 0 (free)', () => {
      mockActor.items = [];
      mockActor.system.skills = {
        awareness: { trained: true, costTrain: -1 },
        dodge: { trained: true, mastered: true, costTrain: 0, costMaster: 200 }
      };
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12200); // 12000 + 0 + 0 + 200
    });

    it('treats -1 talent costs as 0 (free)', () => {
      mockActor.items = [
        { type: 'talent', name: 'FreeTalent', system: { cost: -1 }, _id: 'id1' },
        { type: 'talent', name: 'PaidTalent', system: { cost: 300 }, _id: 'id2' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12300); // 12000 + 0 + 300
    });

    it('applies chapter cost overrides', () => {
      const mockChapter = {
        system: {
          talentCosts: { 'talent1': 100 },
          skillCosts: { awareness: { costTrain: 100 } }
        }
      };
      mockActor.system.chapterId = 'chapter1';
      mockActor.items = {
        get: jest.fn(() => mockChapter),
        [Symbol.iterator]: function* () {
          yield { type: 'talent', name: 'Talent1', system: { cost: 300, compendiumId: 'talent1' }, _id: 'id1' };
        }
      };
      mockActor.system.skills = {
        awareness: { trained: true, costTrain: 200 }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12200); // 12000 + 100 (chapter talent) + 100 (chapter skill)
    });

    it('treats chapter override of -1 as free', () => {
      const mockChapter = {
        system: {
          talentCosts: { 'talent1': -1 },
          skillCosts: { awareness: { costTrain: -1 } }
        }
      };
      mockActor.system.chapterId = 'chapter1';
      mockActor.items = {
        get: jest.fn(() => mockChapter),
        [Symbol.iterator]: function* () {
          yield { type: 'talent', name: 'Talent1', system: { cost: 300, compendiumId: 'talent1' }, _id: 'id1' };
        }
      };
      mockActor.system.skills = {
        awareness: { trained: true, costTrain: 200 }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000); // 12000 + 0 + 0
    });

    it('applies specialty rank-based skill cost overrides', () => {
      const mockSpecialty = {
        system: {
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: { medicae: { costTrain: 400 } },
              talents: {}
            }
          }
        }
      };
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 1;
      mockActor.items = {
        get: jest.fn(() => mockSpecialty),
        [Symbol.iterator]: function* () {}
      };
      mockActor.system.skills = {
        medicae: { trained: true, costTrain: 800 }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12400); // 12000 + 400 (specialty rank override)
    });

    it('specialty rank costs take precedence over chapter costs', () => {
      const mockChapter = {
        system: {
          skillCosts: { medicae: { costTrain: 600 } }
        }
      };
      const mockSpecialty = {
        system: {
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: { medicae: { costTrain: 400 } },
              talents: {}
            }
          }
        }
      };
      mockActor.system.chapterId = 'chapter1';
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 1;
      mockActor.items = {
        get: jest.fn((id) => id === 'chapter1' ? mockChapter : mockSpecialty),
        [Symbol.iterator]: function* () {}
      };
      mockActor.system.skills = {
        medicae: { trained: true, costTrain: 800 }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12400); // 12000 + 400 (specialty rank takes precedence)
    });

    it('specialty base costs take precedence over chapter costs', () => {
      const mockChapter = {
        system: {
          skillCosts: { medicae: { costTrain: 600 } }
        }
      };
      const mockSpecialty = {
        system: {
          skillCosts: { medicae: { costTrain: 0 } },
          rankCosts: {}
        }
      };
      mockActor.system.chapterId = 'chapter1';
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 1;
      mockActor.items = {
        get: jest.fn((id) => id === 'chapter1' ? mockChapter : mockSpecialty),
        [Symbol.iterator]: function* () {}
      };
      mockActor.system.skills = {
        medicae: { trained: true, costTrain: 800 }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000); // 12000 + 0 (specialty base takes precedence)
    });

    it('apothecary medicae at rank 1 costs 0 XP', () => {
      const mockSpecialty = {
        system: {
          skillCosts: { medicae: { costTrain: 0 } },
          rankCosts: {
            '1': {
              skills: { chem_use: { costTrain: 400 } },
              talents: {}
            }
          }
        }
      };
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 1;
      mockActor.items = {
        get: jest.fn(() => mockSpecialty),
        [Symbol.iterator]: function* () {}
      };
      mockActor.system.skills = {
        medicae: { trained: true, costTrain: 800 }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000); // 12000 + 0 (free for apothecary)
    });

    it('cumulative rank costs: rank 3 includes costs from ranks 1, 2, and 3', () => {
      const mockSpecialty = {
        system: {
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: { medicae: { costTrain: 100 } },
              talents: {}
            },
            '2': {
              skills: { medicae: { costMaster: 200 } },
              talents: {}
            },
            '3': {
              skills: { medicae: { costExpert: 300 } },
              talents: {}
            }
          }
        }
      };
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 3;
      mockActor.items = {
        get: jest.fn(() => mockSpecialty),
        [Symbol.iterator]: function* () {}
      };
      mockActor.system.skills = {
        medicae: { trained: true, mastered: true, expert: true, costTrain: 800, costMaster: 800, costExpert: 800 }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12600); // 12000 + 100 + 200 + 300
    });

    it('cumulative rank costs: later ranks override earlier ranks for same skill level', () => {
      const mockSpecialty = {
        system: {
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: { medicae: { costTrain: 100 } },
              talents: {}
            },
            '2': {
              skills: { medicae: { costTrain: 50 } }, // Override rank 1 costTrain
              talents: {}
            }
          }
        }
      };
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 2;
      mockActor.items = {
        get: jest.fn(() => mockSpecialty),
        [Symbol.iterator]: function* () {}
      };
      mockActor.system.skills = {
        medicae: { trained: true, costTrain: 800 }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12050); // 12000 + 50 (rank 2 overrides rank 1)
    });

    it('applies specialty rank-based talent cost overrides', () => {
      const mockSpecialty = {
        system: {
          rankCosts: {
            '1': {
              skills: {},
              talents: { 'talent1': 500 }
            }
          }
        }
      };
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 1;
      mockActor.items = {
        get: jest.fn(() => mockSpecialty),
        [Symbol.iterator]: function* () {
          yield { type: 'talent', name: 'Talent1', system: { cost: 1000, compendiumId: 'talent1' }, _id: 'id1' };
        }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12500); // 12000 + 500 (specialty override)
    });
  });

  describe('_getTalentSourceId', () => {
    it('returns compendiumId if present', () => {
      const item = { system: { compendiumId: 'comp123' }, _id: 'id1' };
      expect(XPCalculator._getTalentSourceId(item)).toBe('comp123');
    });

    it('extracts from flags.core.sourceId', () => {
      const item = { 
        system: {}, 
        flags: { core: { sourceId: 'Compendium.pack.Item.abc123' } },
        _id: 'id1'
      };
      expect(XPCalculator._getTalentSourceId(item)).toBe('abc123');
    });

    it('extracts from _stats.compendiumSource', () => {
      const item = { 
        system: {}, 
        _stats: { compendiumSource: 'Compendium.pack.Item.xyz789' },
        _id: 'id1'
      };
      expect(XPCalculator._getTalentSourceId(item)).toBe('xyz789');
    });

    it('falls back to _id', () => {
      const item = { system: {}, _id: 'fallback123' };
      expect(XPCalculator._getTalentSourceId(item)).toBe('fallback123');
    });
  });
});
