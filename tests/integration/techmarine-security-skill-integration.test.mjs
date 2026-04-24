import { jest } from '@jest/globals';
import { CharacterDataPreparer } from '../../src/module/sheets/shared/data-preparers/character-data-preparer.mjs';
import { XPCalculator } from '../../src/module/helpers/character/xp-calculator.mjs';
import { SkillLoader } from '../../src/module/helpers/character/skill-loader.mjs';

/**
 * Integration test for Techmarine specialty Security skill rank override.
 *
 * Reproduces the bug reported: Iron Hands Techmarine cannot take Security skill
 * at Rank 1, even though Techmarine specialty overrides the base rank 3 requirement
 * to rank 1 with cost 400 XP.
 *
 * This test verifies the complete integration between:
 * 1. Specialty rank cost parsing (_getSkillCosts)
 * 2. Rank availability calculation (_addRankAvailability)
 * 3. XP cost calculation (XPCalculator)
 *
 * The bug was that _addRankAvailability ignored specialty rank overrides when
 * the base skill had a rank requirement (lines 119-122 in character-data-preparer.mjs).
 */
describe('Techmarine Security Skill Integration', () => {
  beforeAll(async () => {
    // Initialize skills (loads skills.json)
    await SkillLoader.init();
  });

  describe('Rank 1 Techmarine Security skill availability', () => {
    it('Security skill shows as available at Rank 1 for Techmarine', () => {
      // Simulate Security skill (base rank 3, cost 800)
      const skill = {
        training: {
          trained: { cost: 800, rank: 3 },
          mastered: { cost: 800, rank: 5 },
          expert: { cost: 800, rank: 7 }
        }
      };

      const currentRank = 1;
      const specialtyRankReqs = {
        security: {
          trainedRank: 1  // Techmarine makes it available at rank 1
        }
      };

      CharacterDataPreparer._addRankAvailability(skill, 'security', currentRank, specialtyRankReqs);

      expect(skill.trainedAvailable).toBe(true);
      expect(skill.trainedRankRequired).toBe(1);
    });

    it('Security skill still requires higher ranks for mastered/expert without specialty override', () => {
      const skill = {
        training: {
          trained: { cost: 800, rank: 3 },
          mastered: { cost: 800, rank: 5 },
          expert: { cost: 800, rank: 7 }
        }
      };

      const currentRank = 1;
      const specialtyRankReqs = {
        security: {
          trainedRank: 1  // Only trained is overridden
        }
      };

      CharacterDataPreparer._addRankAvailability(skill, 'security', currentRank, specialtyRankReqs);

      // Mastered should still require base rank 5
      expect(skill.masteredAvailable).toBe(false);
      expect(skill.masteredRankRequired).toBe(5);

      // Expert should still require base rank 7
      expect(skill.expertAvailable).toBe(false);
      expect(skill.expertRankRequired).toBe(7);
    });

    it('Security skill NOT available at Rank 1 without specialty', () => {
      const skill = {
        training: {
          trained: { cost: 800, rank: 3 },
          mastered: { cost: 800, rank: 5 },
          expert: { cost: 800, rank: 7 }
        }
      };

      const currentRank = 1;
      const specialtyRankReqs = {};  // No specialty overrides

      CharacterDataPreparer._addRankAvailability(skill, 'security', currentRank, specialtyRankReqs);

      expect(skill.trainedAvailable).toBe(false);
      expect(skill.trainedRankRequired).toBe(3);  // Base requirement
    });

    it('Security skill becomes available at Rank 3 without specialty', () => {
      const skill = {
        training: {
          trained: { cost: 800, rank: 3 },
          mastered: { cost: 800, rank: 5 },
          expert: { cost: 800, rank: 7 }
        }
      };

      const currentRank = 3;
      const specialtyRankReqs = {};  // No specialty overrides

      CharacterDataPreparer._addRankAvailability(skill, 'security', currentRank, specialtyRankReqs);

      expect(skill.trainedAvailable).toBe(true);
      expect(skill.trainedRankRequired).toBe(3);
    });

    it('XP calculation uses specialty cost (400) not base cost (800)', () => {
      const mockSpecialty = {
        system: {
          characteristicCosts: {},
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: {
                security: { costTrain: 400 }
              },
              talents: {}
            }
          }
        }
      };

      const mockActor = {
        system: {
          specialtyId: 'techmarine-id',
          chapterId: null,
          rank: 1,
          characteristics: {},
          skills: {
            security: { trained: true }
          }
        },
        items: {
          get: jest.fn((id) => {
            if (id === 'techmarine-id') return mockSpecialty;
            return null;
          }),
          [Symbol.iterator]: function* () {}
        }
      };

      const spentXP = XPCalculator.calculateSpentXP(mockActor);

      // 12000 starting + 400 (specialty override, not 800 base cost)
      expect(spentXP).toBe(12400);
    });

    it('XP calculation returns -1 (rank locked) for Security at Rank 1 without specialty', () => {
      const mockActor = {
        system: {
          specialtyId: null,
          chapterId: null,
          rank: 1,
          characteristics: {},
          skills: {
            security: { trained: true }
          }
        },
        items: {
          get: jest.fn(() => null),
          [Symbol.iterator]: function* () {}
        }
      };

      const spentXP = XPCalculator.calculateSpentXP(mockActor);

      // 12000 starting + 0 (security is rank-locked, -1 treated as 0)
      expect(spentXP).toBe(12000);
    });
  });

  describe('Rank 3 Techmarine Security skill progression', () => {
    it('Security mastered becomes available at Rank 3 with specialty override', () => {
      const skill = {
        training: {
          trained: { cost: 800, rank: 3 },
          mastered: { cost: 800, rank: 5 },
          expert: { cost: 800, rank: 7 }
        }
      };

      const currentRank = 3;
      const specialtyRankReqs = {
        security: {
          trainedRank: 1,
          masteredRank: 3  // Override from rank 5 to rank 3
        }
      };

      CharacterDataPreparer._addRankAvailability(skill, 'security', currentRank, specialtyRankReqs);

      expect(skill.trainedAvailable).toBe(true);
      expect(skill.trainedRankRequired).toBe(1);

      expect(skill.masteredAvailable).toBe(true);
      expect(skill.masteredRankRequired).toBe(3);  // Overridden from rank 5

      expect(skill.expertAvailable).toBe(false);
      expect(skill.expertRankRequired).toBe(7);  // Still requires base rank
    });

    it('XP cost for trained + mastered uses specialty costs', () => {
      const mockSpecialty = {
        system: {
          characteristicCosts: {},
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: {
                security: { costTrain: 400 }
              },
              talents: {}
            },
            '3': {
              skills: {
                security: { costMaster: 400 }
              },
              talents: {}
            }
          }
        }
      };

      const mockActor = {
        system: {
          specialtyId: 'techmarine-id',
          chapterId: null,
          rank: 3,
          characteristics: {},
          skills: {
            security: { trained: true, mastered: true }
          }
        },
        items: {
          get: jest.fn((id) => {
            if (id === 'techmarine-id') return mockSpecialty;
            return null;
          }),
          [Symbol.iterator]: function* () {}
        }
      };

      const spentXP = XPCalculator.calculateSpentXP(mockActor);

      // 12000 + 400 (trained) + 400 (mastered) = 12800
      expect(spentXP).toBe(12800);
    });
  });

  describe('Chapter + Specialty cost interaction', () => {
    let mockActor;
    let mockChapter;
    let mockSpecialty;

    beforeEach(() => {
      // Iron Hands chapter might offer different cost
      mockChapter = {
        system: {
          skillCosts: {
            security: {
              costTrain: 600  // Chapter offers 600
            }
          }
        }
      };

      mockSpecialty = {
        system: {
          characteristicCosts: {},
          skillCosts: {},
          rankCosts: {
            '1': {
              skills: {
                security: { costTrain: 400 }  // Specialty offers 400
              },
              talents: {}
            }
          }
        }
      };

      mockActor = {
        system: {
          specialtyId: 'techmarine-id',
          chapterId: 'iron-hands-id',
          rank: 1,
          characteristics: {},
          skills: {
            security: {
              trained: false,
              mastered: false,
              expert: false
            }
          }
        },
        items: {
          get: jest.fn((id) => {
            if (id === 'techmarine-id') return mockSpecialty;
            if (id === 'iron-hands-id') return mockChapter;
            return null;
          }),
          [Symbol.iterator]: function* () {}
        }
      };
    });

    it('Uses lowest cost between chapter and specialty', () => {
      mockActor.system.skills.security.trained = true;

      const spentXP = XPCalculator.calculateSpentXP(mockActor);

      // Should use 400 (specialty) not 600 (chapter)
      expect(spentXP).toBe(12400);
    });

    it('Uses chapter cost if cheaper than specialty', () => {
      mockChapter.system.skillCosts.security.costTrain = 300;
      mockActor.system.skills.security.trained = true;

      const spentXP = XPCalculator.calculateSpentXP(mockActor);

      // Should use 300 (chapter) not 400 (specialty)
      expect(spentXP).toBe(12300);
    });
  });
});
