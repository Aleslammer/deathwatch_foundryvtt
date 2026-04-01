import { jest } from '@jest/globals';
import { CohesionHelper } from '../../src/module/helpers/cohesion.mjs';

describe('CohesionHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* -------------------------------------------- */
  /*  getRankModifier                             */
  /* -------------------------------------------- */

  describe('getRankModifier', () => {
    it('returns 0 for rank 1', () => {
      expect(CohesionHelper.getRankModifier(1)).toBe(0);
    });

    it('returns 0 for rank 3 (boundary)', () => {
      expect(CohesionHelper.getRankModifier(3)).toBe(0);
    });

    it('returns 1 for rank 4 (mid start)', () => {
      expect(CohesionHelper.getRankModifier(4)).toBe(1);
    });

    it('returns 1 for rank 5 (mid end)', () => {
      expect(CohesionHelper.getRankModifier(5)).toBe(1);
    });

    it('returns 2 for rank 6 (high start)', () => {
      expect(CohesionHelper.getRankModifier(6)).toBe(2);
    });

    it('returns 2 for rank 8 (max)', () => {
      expect(CohesionHelper.getRankModifier(8)).toBe(2);
    });

    it('returns 0 for rank 0 (edge)', () => {
      expect(CohesionHelper.getRankModifier(0)).toBe(0);
    });
  });

  /* -------------------------------------------- */
  /*  getCommandModifier                          */
  /* -------------------------------------------- */

  describe('getCommandModifier', () => {
    it('returns 0 for null', () => {
      expect(CohesionHelper.getCommandModifier(null)).toBe(0);
    });

    it('returns 0 for undefined', () => {
      expect(CohesionHelper.getCommandModifier(undefined)).toBe(0);
    });

    it('returns 0 for untrained (empty object)', () => {
      expect(CohesionHelper.getCommandModifier({})).toBe(0);
    });

    it('returns 1 for trained only', () => {
      expect(CohesionHelper.getCommandModifier({ trained: true })).toBe(1);
    });

    it('returns 2 for mastered (highest applies)', () => {
      expect(CohesionHelper.getCommandModifier({ trained: true, mastered: true })).toBe(2);
    });

    it('returns 3 for expert (highest applies)', () => {
      expect(CohesionHelper.getCommandModifier({ trained: true, mastered: true, expert: true })).toBe(3);
    });

    it('returns 3 for expert without lower tiers', () => {
      expect(CohesionHelper.getCommandModifier({ expert: true })).toBe(3);
    });
  });

  /* -------------------------------------------- */
  /*  calculateCohesionMax                        */
  /* -------------------------------------------- */

  describe('calculateCohesionMax', () => {
    it('returns FS bonus only for rank 1 untrained', () => {
      expect(CohesionHelper.calculateCohesionMax(40, 1, {})).toBe(4);
    });

    it('calculates 5 + 1 + 1 = 7 for FS 55, rank 4, trained', () => {
      expect(CohesionHelper.calculateCohesionMax(55, 4, { trained: true })).toBe(7);
    });

    it('calculates 6 + 2 + 3 = 11 for FS 60, rank 6, expert', () => {
      expect(CohesionHelper.calculateCohesionMax(60, 6, { trained: true, mastered: true, expert: true })).toBe(11);
    });

    it('returns 0 for zero fellowship', () => {
      expect(CohesionHelper.calculateCohesionMax(0, 1, {})).toBe(0);
    });

    it('calculates 3 + 1 + 2 = 6 for FS 35, rank 5, mastered', () => {
      expect(CohesionHelper.calculateCohesionMax(35, 5, { trained: true, mastered: true })).toBe(6);
    });

    it('adds positive GM modifier', () => {
      expect(CohesionHelper.calculateCohesionMax(40, 1, {}, 2)).toBe(6);
    });

    it('subtracts negative GM modifier', () => {
      expect(CohesionHelper.calculateCohesionMax(40, 4, { trained: true }, -1)).toBe(5);
    });

    it('floors at 0 when GM modifier makes total negative', () => {
      expect(CohesionHelper.calculateCohesionMax(10, 1, {}, -5)).toBe(0);
    });

    it('defaults gmModifier to 0 when not provided', () => {
      expect(CohesionHelper.calculateCohesionMax(40, 1, {})).toBe(4);
    });
  });

  /* -------------------------------------------- */
  /*  calculateCohesionMaxFromActor               */
  /* -------------------------------------------- */

  describe('calculateCohesionMaxFromActor', () => {
    it('returns 0 for null actor', () => {
      expect(CohesionHelper.calculateCohesionMaxFromActor(null)).toBe(0);
    });

    it('returns 0 for non-character actor', () => {
      expect(CohesionHelper.calculateCohesionMaxFromActor({ type: 'enemy', system: {} })).toBe(0);
    });

    it('extracts values from a mock actor', () => {
      const actor = createMockActor({
        system: {
          characteristics: { fs: { value: 50 } },
          rank: 4,
          skills: { command: { trained: true, mastered: true } }
        }
      });
      expect(CohesionHelper.calculateCohesionMaxFromActor(actor)).toBe(8); // 5 + 1 + 2
    });

    it('applies GM modifier from parameter', () => {
      const actor = createMockActor({
        system: {
          characteristics: { fs: { value: 40 } },
          rank: 1,
          skills: { command: {} }
        }
      });
      expect(CohesionHelper.calculateCohesionMaxFromActor(actor, 3)).toBe(7); // 4 + 0 + 0 + 3
    });

    it('handles missing skills gracefully', () => {
      const actor = createMockActor({
        system: {
          characteristics: { fs: { value: 30 } },
          rank: 1
        }
      });
      // skills defaults to {} from createMockActor, command not present
      expect(CohesionHelper.calculateCohesionMaxFromActor(actor)).toBe(3);
    });
  });

  /* -------------------------------------------- */
  /*  buildCohesionBreakdown                      */
  /* -------------------------------------------- */

  describe('buildCohesionBreakdown', () => {
    it('returns message for null leader', () => {
      expect(CohesionHelper.buildCohesionBreakdown(null)).toBe('No squad leader assigned');
    });

    it('returns message for non-character leader', () => {
      expect(CohesionHelper.buildCohesionBreakdown({ type: 'enemy', system: {} })).toBe('No squad leader assigned');
    });

    it('builds breakdown with FS bonus only', () => {
      const leader = createMockActor({
        system: { characteristics: { fs: { value: 40 } }, rank: 1, skills: {} }
      });
      const result = CohesionHelper.buildCohesionBreakdown(leader);
      expect(result).toBe('FS Bonus: 4\n= 4');
    });

    it('builds breakdown with all components', () => {
      const leader = createMockActor({
        system: {
          characteristics: { fs: { value: 50 } },
          rank: 6,
          skills: { command: { trained: true, mastered: true, expert: true } }
        }
      });
      const result = CohesionHelper.buildCohesionBreakdown(leader, 1);
      expect(result).toBe('FS Bonus: 5\nRank: +2\nCommand: +3\nGM Modifier: +1\n= 11');
    });

    it('shows negative GM modifier', () => {
      const leader = createMockActor({
        system: { characteristics: { fs: { value: 40 } }, rank: 1, skills: {} }
      });
      const result = CohesionHelper.buildCohesionBreakdown(leader, -2);
      expect(result).toBe('FS Bonus: 4\nGM Modifier: -2\n= 2');
    });
  });

  /* -------------------------------------------- */
  /*  resolveCohesionChallenge                    */
  /* -------------------------------------------- */

  describe('resolveCohesionChallenge', () => {
    it('passes when roll is well under cohesion', () => {
      const result = CohesionHelper.resolveCohesionChallenge(6, 3);
      expect(result.success).toBe(true);
      expect(result.roll).toBe(3);
      expect(result.target).toBe(6);
    });

    it('passes when roll equals cohesion', () => {
      expect(CohesionHelper.resolveCohesionChallenge(6, 6).success).toBe(true);
    });

    it('fails when roll is just over cohesion', () => {
      expect(CohesionHelper.resolveCohesionChallenge(6, 7).success).toBe(false);
    });

    it('fails on max roll against moderate cohesion', () => {
      expect(CohesionHelper.resolveCohesionChallenge(6, 10).success).toBe(false);
    });

    it('passes on min roll', () => {
      expect(CohesionHelper.resolveCohesionChallenge(6, 1).success).toBe(true);
    });

    it('always fails with zero cohesion', () => {
      expect(CohesionHelper.resolveCohesionChallenge(0, 1).success).toBe(false);
    });

    it('passes max cohesion with max roll', () => {
      expect(CohesionHelper.resolveCohesionChallenge(10, 10).success).toBe(true);
    });

    it('passes minimum viable (cohesion 1, roll 1)', () => {
      expect(CohesionHelper.resolveCohesionChallenge(1, 1).success).toBe(true);
    });

    it('fails just over minimum (cohesion 1, roll 2)', () => {
      expect(CohesionHelper.resolveCohesionChallenge(1, 2).success).toBe(false);
    });
  });
});
