import { jest } from '@jest/globals';
import { XPCalculator } from '../../src/module/helpers/character/xp-calculator.mjs';

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
      mockActor.system.rank = 5;  // Needed for dodge mastered (rank 5 requirement)
      mockActor.system.skills = {
        awareness: { trained: true },  // 0 XP from skills.json
        dodge: { trained: true, mastered: true }  // 0 + 500 XP from skills.json
      };
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12500); // 12000 + 0 + 0 + 500
    });

    it('treats -1 skill costs as 0 (free)', () => {
      mockActor.items = [];
      mockActor.system.rank = 1;
      mockActor.system.skills = {
        awareness: { trained: true },  // 0 XP
        dodge: { trained: true, mastered: true }  // mastered requires rank 5, so it's -1, treated as 0
      };
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000); // 12000 + 0 (awareness trained) + 0 (dodge trained) + 0 (dodge mastered rank-locked)
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
          skillCosts: {
            command: {
              costTrain: 100
            }
          }
        }
      };
      mockActor.system.chapterId = 'chapter1';
      mockActor.system.rank = 2;  // command requires rank 2
      mockActor.items = {
        get: jest.fn(() => mockChapter),
        [Symbol.iterator]: function* () {
          yield { type: 'talent', name: 'Talent1', system: { cost: 300, compendiumId: 'talent1' }, _id: 'id1' };
        }
      };
      mockActor.system.skills = {
        command: { trained: true }  // Base cost 300 from skills.json, overridden to 100 by chapter
      };

      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12200); // 12000 + 100 (chapter talent) + 100 (chapter skill override)
    });

    it('ignores chapter override of -1 and uses base cost', () => {
      const mockChapter = {
        system: {
          talentCosts: { 'talent1': -1 },
          skillCosts: {
            awareness: {
              costTrain: -1
            }
          }
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
        awareness: { trained: true }  // Base cost 0 from skills.json
      };

      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12300); // 12000 + 300 (talent base) + 0 (skill base, -1 filtered out gives base cost 0)
    });

    it('applies specialty rank-based skill cost overrides', () => {
      const mockSpecialty = {
        system: {
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: {
                medicae: { costTrain: 400 }  // Old structure used in actual data files
              },
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
        medicae: { trained: true }  // Base cost 800 from skills.json, overridden to 400 by specialty
      };

      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12400); // 12000 + 400 (specialty rank override)
    });

    it('uses lowest cost when specialty rank and chapter both provide overrides', () => {
      const mockChapter = {
        system: {
          skillCosts: {
            medicae: {
              training: {
                trained: { cost: 600, rank: 1 }
              }
            }
          }
        }
      };
      const mockSpecialty = {
        system: {
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: {
                medicae: { costTrain: 400 }  // Old structure
              },
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
        medicae: { trained: true }  // Base 800, specialty 400 < chapter 600, so uses 400
      };

      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12400); // 12000 + 400 (specialty 400 < chapter 600)
    });

    it('uses chapter cost when chapter is cheaper than specialty rank', () => {
      const mockChapter = {
        system: {
          skillCosts: {
            lore_forbidden_adeptus_mechanicus: {
              costTrain: 300
            }
          }
        }
      };
      const mockSpecialty = {
        system: {
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: {
                lore_forbidden_adeptus_mechanicus: { costTrain: 400 }  // Old structure
              },
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
        lore_forbidden_adeptus_mechanicus: { trained: true }  // Base 300, chapter 300 < specialty 400
      };

      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12300); // 12000 + 300 (chapter 300 < specialty 400)
    });

    it('uses specialty base cost when it is cheaper than chapter cost', () => {
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
        medicae: { trained: true }  // Base 800, specialty base 0 < chapter 600, so uses 0
      };

      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000); // 12000 + 0 (specialty base 0 < chapter 600)
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
        medicae: { trained: true }  // Base 800, specialty base 0, so uses 0
      };

      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000); // 12000 + 0 (free for apothecary)
    });

    it('uses chapter cost override with costTrain structure (Iron Hands Techmarine case)', () => {
      const mockChapter = {
        system: {
          skillCosts: {
            lore_forbidden_adeptus_mechanicus: {
              costTrain: 300,
              costMaster: 400,
              costExpert: 500
            }
          }
        }
      };
      const mockSpecialty = {
        system: {
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: {
                lore_forbidden_adeptus_mechanicus: { costTrain: 400 }
              },
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
        lore_forbidden_adeptus_mechanicus: { trained: true }  // Base null, chapter 300 < specialty rank 400, should use 300
      };

      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12300); // 12000 + 300 (chapter 300 < specialty 400)
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
        medicae: { trained: true, mastered: true, expert: true }  // Specialty rank costs override: 100 + 200 + 300
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
        medicae: { trained: true }  // Rank 2 costTrain override (50) replaces rank 1 (100)
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

    it('specialty rank talent costs take precedence over chapter talent costs', () => {
      const mockChapter = {
        system: {
          talentCosts: { 'talent1': 300 }
        }
      };
      const mockSpecialty = {
        system: {
          rankCosts: {
            '1': {
              skills: {},
              talents: { 'talent1': 200 }
            }
          }
        }
      };
      mockActor.system.chapterId = 'chapter1';
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 1;
      mockActor.items = {
        get: jest.fn((id) => id === 'chapter1' ? mockChapter : mockSpecialty),
        [Symbol.iterator]: function* () {
          yield { type: 'talent', name: 'Talent1', system: { cost: 1000, compendiumId: 'talent1' }, _id: 'id1' };
        }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12200); // 12000 + 200 (specialty takes precedence over chapter)
    });

    it('cumulative talent costs: rank 3 includes talents from ranks 1, 2, and 3', () => {
      const mockSpecialty = {
        system: {
          rankCosts: {
            '1': {
              skills: {},
              talents: { 'talent1': 500, 'talent2': 300 }
            },
            '2': {
              skills: {},
              talents: { 'talent3': 400 }
            },
            '3': {
              skills: {},
              talents: { 'talent1': 200 } // Override talent1 from rank 1
            }
          }
        }
      };
      mockActor.system.specialtyId = 'spec1';
      mockActor.system.rank = 3;
      mockActor.items = {
        get: jest.fn(() => mockSpecialty),
        [Symbol.iterator]: function* () {
          yield { type: 'talent', name: 'Talent1', system: { cost: 1000, compendiumId: 'talent1' }, _id: 'id1' };
          yield { type: 'talent', name: 'Talent2', system: { cost: 1000, compendiumId: 'talent2' }, _id: 'id2' };
          yield { type: 'talent', name: 'Talent3', system: { cost: 1000, compendiumId: 'talent3' }, _id: 'id3' };
        }
      };
      
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12900); // 12000 + 200 (talent1 rank 3) + 300 (talent2) + 400 (talent3)
    });
  });

  describe('_calculatePsychicPowerCosts', () => {
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

    it('includes psychic power costs in spent XP', () => {
      mockActor.items = [
        { type: 'psychic-power', name: 'Smite', system: { cost: 500 }, _id: 'psy1' },
        { type: 'psychic-power', name: 'Compel', system: { cost: 1000 }, _id: 'psy2' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(13500); // 12000 + 500 + 1000
    });

    it('treats 0 cost psychic powers as free', () => {
      mockActor.items = [
        { type: 'psychic-power', name: 'Free Power', system: { cost: 0 }, _id: 'psy1' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000);
    });

    it('treats negative cost psychic powers as free', () => {
      mockActor.items = [
        { type: 'psychic-power', name: 'Negative Power', system: { cost: -1 }, _id: 'psy1' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000);
    });

    it('handles missing cost field', () => {
      mockActor.items = [
        { type: 'psychic-power', name: 'No Cost', system: {}, _id: 'psy1' }
      ];
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12000);
    });

    it('combines psychic power costs with talent and skill costs', () => {
      mockActor.items = [
        { type: 'psychic-power', name: 'Smite', system: { cost: 500 }, _id: 'psy1' },
        { type: 'talent', name: 'Talent1', system: { cost: 300 }, _id: 'tal1' }
      ];
      mockActor.system.skills = {
        awareness: { trained: true }  // Base cost 0 from skills.json
      };
      expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12800); // 12000 + 500 + 300 + 0
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

    it('uses compendiumId even when actor _id is different (drag from compendium scenario)', () => {
      const item = {
        system: { compendiumId: 'tal00000000001' },
        _id: 'randomActorItemId123'
      };
      expect(XPCalculator._getTalentSourceId(item)).toBe('tal00000000001');
    });
  });

  describe('calculateXPBreakdown', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        system: {
          rank: 1,
          chapterId: null,
          specialtyId: null,
          characteristics: {
            ws: { advances: { simple: true, intermediate: false, trained: false, expert: false } },
            bs: { advances: { simple: false, intermediate: true, trained: false, expert: false } }
          },
          skills: {
            awareness: { label: 'Awareness', trained: true, mastered: false, expert: false, costTrain: 200 }
          },
          insanityHistory: []
        },
        items: {
          get: jest.fn((id) => {
            if (id === 'spec1') {
              return {
                system: {
                  characteristicCosts: {
                    ws: { simple: 250, intermediate: 500, trained: 750, expert: 1000 },
                    bs: { simple: 250, intermediate: 500, trained: 750, expert: 1000 }
                  },
                  skillCosts: {},
                  talentCosts: {},
                  rankCosts: {}
                }
              };
            }
            return null;
          }),
          [Symbol.iterator]: function* () {
            yield { type: 'talent', name: 'Bolter Drill', system: { cost: 500, stackable: false }, _id: 'tal1' };
            yield { type: 'psychic-power', name: 'Smite', system: { cost: 500 }, _id: 'psy1' };
          }
        }
      };
      mockActor.system.specialtyId = 'spec1';
    });

    it('returns breakdown with all categories', () => {
      const breakdown = XPCalculator.calculateXPBreakdown(mockActor);

      expect(breakdown).toEqual(expect.arrayContaining([
        { category: 'Starting XP', source: 'Character Creation', cost: 12000 },
        { category: 'Characteristic', source: 'Weapon Skill (Simple)', cost: 250 },
        { category: 'Characteristic', source: 'Ballistic Skill (Intermediate)', cost: 500 },
        { category: 'Skill', source: 'Awareness (Trained)', cost: 0 },
        { category: 'Talent', source: 'Bolter Drill', cost: 500 },
        { category: 'Psychic Power', source: 'Smite', cost: 500 }
      ]));
    });

    it('calculates correct running total', () => {
      const breakdown = XPCalculator.calculateXPBreakdown(mockActor);
      let runningTotal = 0;

      for (const entry of breakdown) {
        runningTotal += entry.cost;
      }

      expect(runningTotal).toBe(13750); // 12000 + 250 + 500 + 0 + 500 + 500
    });

    it('includes insanity reduction entries', () => {
      mockActor.system.insanityHistory = [
        { timestamp: Date.now(), xpSpent: 100 },
        { timestamp: Date.now(), xpSpent: 100 }
      ];

      const breakdown = XPCalculator.calculateXPBreakdown(mockActor);
      const insanityEntries = breakdown.filter(e => e.category === 'Insanity Reduction');

      expect(insanityEntries).toHaveLength(2);
      expect(insanityEntries[0].cost).toBe(100);
      expect(insanityEntries[1].cost).toBe(100);
    });

    it('handles stackable talents with count', () => {
      mockActor.items = {
        get: jest.fn((id) => {
          if (id === 'spec1') {
            return {
              system: {
                characteristicCosts: {},
                skillCosts: {},
                talentCosts: {},
                rankCosts: {}
              }
            };
          }
          return null;
        }),
        [Symbol.iterator]: function* () {
          yield { type: 'talent', name: 'Hatred', system: { cost: 500, subsequentCost: 500, stackable: true }, _id: 'tal1' };
          yield { type: 'talent', name: 'Hatred', system: { cost: 500, subsequentCost: 500, stackable: true }, _id: 'tal2' };
        }
      };

      const breakdown = XPCalculator.calculateXPBreakdown(mockActor);
      const hatredEntries = breakdown.filter(e => e.source.includes('Hatred'));

      expect(hatredEntries).toHaveLength(2);
      expect(hatredEntries[0].source).toBe('Hatred');
      expect(hatredEntries[1].source).toBe('Hatred (2)');
    });

    it('breakdown total matches calculateSpentXP total', () => {
      // Actor with skills that use SkillLoader data (no costTrain properties)
      const testActor = {
        system: {
          rank: 1,
          chapterId: null,
          specialtyId: null,
          characteristics: {},
          skills: {
            awareness: { label: 'Awareness', trained: true, mastered: false, expert: false },
            dodge: { label: 'Dodge', trained: true, mastered: true, expert: false }
          },
          insanityHistory: []
        },
        items: {
          get: jest.fn(() => null),
          [Symbol.iterator]: function* () {}
        }
      };

      const spentXP = XPCalculator.calculateSpentXP(testActor);
      const breakdown = XPCalculator.calculateXPBreakdown(testActor);

      let breakdownTotal = 0;
      for (const entry of breakdown) {
        breakdownTotal += entry.cost;
      }

      // Both calculation paths must return the same total
      expect(breakdownTotal).toBe(spentXP);
    });
  });
});
