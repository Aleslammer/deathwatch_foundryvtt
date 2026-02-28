import { jest } from '@jest/globals';
import './setup.mjs';
import { XPCalculator } from '../src/module/helpers/xp-calculator.mjs';

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
          skills: {}
        },
        items: {
          get: jest.fn(),
          [Symbol.iterator]: function* () {}
        }
      };
    });

    it('returns starting XP with no advances', () => {
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(13000);
    });

    it('includes characteristic advance costs', () => {
      mockActor.items = [
        { type: 'characteristic-advance', system: { cost: 500 } },
        { type: 'characteristic-advance', system: { cost: 750 } }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(14250);
    });

    it('includes talent costs', () => {
      mockActor.items = [
        { type: 'talent', name: 'Talent1', system: { cost: 300 }, _id: 'id1' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(13300);
    });

    it('handles stackable talents with subsequent costs', () => {
      mockActor.items = [
        { type: 'talent', name: 'Stackable', system: { cost: 300, stackable: true, subsequentCost: 200 }, _id: 'id1' },
        { type: 'talent', name: 'Stackable', system: { cost: 300, stackable: true, subsequentCost: 200 }, _id: 'id2' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(13500); // 13000 + 300 + 200
    });

    it('includes skill costs', () => {
      mockActor.items = [];
      mockActor.system.skills = {
        awareness: { trained: true, costTrain: 200 },
        dodge: { trained: true, mastered: true, costTrain: 200, costMaster: 300 }
      };
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(13700); // 13000 + 200 + 200 + 300
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
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(13200); // 13000 + 100 (chapter talent) + 100 (chapter skill)
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
