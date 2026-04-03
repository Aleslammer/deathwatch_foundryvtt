import { jest } from '@jest/globals';
import { ModeHelper } from '../../src/module/helpers/mode-helper.mjs';

describe('ModeHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* -------------------------------------------- */
  /*  canEnterSquadMode                           */
  /* -------------------------------------------- */

  describe('canEnterSquadMode', () => {
    it('returns true when Cohesion is 1', () => {
      expect(ModeHelper.canEnterSquadMode(1)).toBe(true);
    });

    it('returns true when Cohesion is high', () => {
      expect(ModeHelper.canEnterSquadMode(7)).toBe(true);
    });

    it('returns false when Cohesion is 0', () => {
      expect(ModeHelper.canEnterSquadMode(0)).toBe(false);
    });

    it('returns false when Cohesion is negative', () => {
      expect(ModeHelper.canEnterSquadMode(-1)).toBe(false);
    });
  });

  /* -------------------------------------------- */
  /*  getModeLabel                                */
  /* -------------------------------------------- */

  describe('getModeLabel', () => {
    it('returns "Solo Mode" for solo', () => {
      expect(ModeHelper.getModeLabel('solo')).toBe('Solo Mode');
    });

    it('returns "Squad Mode" for squad', () => {
      expect(ModeHelper.getModeLabel('squad')).toBe('Squad Mode');
    });

    it('returns "Solo Mode" for unknown mode', () => {
      expect(ModeHelper.getModeLabel('invalid')).toBe('Solo Mode');
    });

    it('returns "Solo Mode" for undefined', () => {
      expect(ModeHelper.getModeLabel(undefined)).toBe('Solo Mode');
    });
  });

  /* -------------------------------------------- */
  /*  buildModeChangeMessage                      */
  /* -------------------------------------------- */

  describe('buildModeChangeMessage', () => {
    it('builds Squad Mode entry message', () => {
      const msg = ModeHelper.buildModeChangeMessage('Brother Castiel', 'squad');
      expect(msg).toContain('🔵');
      expect(msg).toContain('Brother Castiel');
      expect(msg).toContain('enters Squad Mode');
    });

    it('builds Solo Mode return message', () => {
      const msg = ModeHelper.buildModeChangeMessage('Brother Theron', 'solo');
      expect(msg).toContain('🟢');
      expect(msg).toContain('Brother Theron');
      expect(msg).toContain('returns to Solo Mode');
    });

    it('defaults to Solo Mode message for unknown mode', () => {
      const msg = ModeHelper.buildModeChangeMessage('Brother Kael', 'invalid');
      expect(msg).toContain('🟢');
      expect(msg).toContain('returns to Solo Mode');
    });
  });

  /* -------------------------------------------- */
  /*  buildCohesionDepletedMessage                */
  /* -------------------------------------------- */

  describe('buildCohesionDepletedMessage', () => {
    it('builds depletion message', () => {
      const msg = ModeHelper.buildCohesionDepletedMessage();
      expect(msg).toContain('Cohesion depleted');
      expect(msg).toContain('Solo Mode');
    });

    it('includes the cohesion-chat class', () => {
      const msg = ModeHelper.buildCohesionDepletedMessage();
      expect(msg).toContain('cohesion-chat');
    });
  });

  /* -------------------------------------------- */
  /*  isAbilityActiveForMode                      */
  /* -------------------------------------------- */

  describe('isAbilityActiveForMode', () => {
    it('returns true when no mode requirement', () => {
      expect(ModeHelper.isAbilityActiveForMode('', 'solo')).toBe(true);
    });

    it('returns true when no mode requirement and squad mode', () => {
      expect(ModeHelper.isAbilityActiveForMode('', 'squad')).toBe(true);
    });

    it('returns true when solo requirement matches solo mode', () => {
      expect(ModeHelper.isAbilityActiveForMode('solo', 'solo')).toBe(true);
    });

    it('returns false when squad requirement but in solo mode', () => {
      expect(ModeHelper.isAbilityActiveForMode('squad', 'solo')).toBe(false);
    });

    it('returns true when squad requirement matches squad mode', () => {
      expect(ModeHelper.isAbilityActiveForMode('squad', 'squad')).toBe(true);
    });

    it('returns false when solo requirement but in squad mode', () => {
      expect(ModeHelper.isAbilityActiveForMode('solo', 'squad')).toBe(false);
    });
  });

  /* -------------------------------------------- */
  /*  meetsRankRequirement                        */
  /* -------------------------------------------- */

  describe('meetsRankRequirement', () => {
    it('returns true when required rank is 0', () => {
      expect(ModeHelper.meetsRankRequirement(0, 1)).toBe(true);
    });

    it('returns true when required rank is null', () => {
      expect(ModeHelper.meetsRankRequirement(null, 1)).toBe(true);
    });

    it('returns true when current rank meets requirement', () => {
      expect(ModeHelper.meetsRankRequirement(4, 4)).toBe(true);
    });

    it('returns true when current rank exceeds requirement', () => {
      expect(ModeHelper.meetsRankRequirement(4, 6)).toBe(true);
    });

    it('returns false when current rank is below requirement', () => {
      expect(ModeHelper.meetsRankRequirement(4, 3)).toBe(false);
    });
  });

  /* -------------------------------------------- */
  /*  meetsChapterRequirement                     */
  /* -------------------------------------------- */

  describe('meetsChapterRequirement', () => {
    it('returns true when ability has no chapter requirement', () => {
      expect(ModeHelper.meetsChapterRequirement('', 'Ultramarines')).toBe(true);
    });

    it('returns true when chapters match', () => {
      expect(ModeHelper.meetsChapterRequirement('Ultramarines', 'Ultramarines')).toBe(true);
    });

    it('returns false when chapters do not match', () => {
      expect(ModeHelper.meetsChapterRequirement('Ultramarines', 'Blood Angels')).toBe(false);
    });

    it('returns true when ability chapter is null', () => {
      expect(ModeHelper.meetsChapterRequirement(null, 'Ultramarines')).toBe(true);
    });
  });

  /* -------------------------------------------- */
  /*  getQualifyingImprovements                   */
  /* -------------------------------------------- */

  describe('getQualifyingImprovements', () => {
    const improvements = [
      { rank: 3, effect: 'Rank 3 bonus' },
      { rank: 5, effect: 'Rank 5 bonus' },
      { rank: 7, effect: 'Rank 7 bonus' }
    ];

    it('returns empty array for null improvements', () => {
      expect(ModeHelper.getQualifyingImprovements(null, 4)).toEqual([]);
    });

    it('returns empty array for empty improvements', () => {
      expect(ModeHelper.getQualifyingImprovements([], 4)).toEqual([]);
    });

    it('returns improvements at or below current rank', () => {
      const result = ModeHelper.getQualifyingImprovements(improvements, 4);
      expect(result).toEqual([{ rank: 3, effect: 'Rank 3 bonus' }]);
    });

    it('returns multiple qualifying improvements', () => {
      const result = ModeHelper.getQualifyingImprovements(improvements, 6);
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(3);
      expect(result[1].rank).toBe(5);
    });

    it('returns all improvements when rank is high enough', () => {
      const result = ModeHelper.getQualifyingImprovements(improvements, 8);
      expect(result).toHaveLength(3);
    });

    it('returns no improvements when rank is too low', () => {
      const result = ModeHelper.getQualifyingImprovements(improvements, 1);
      expect(result).toEqual([]);
    });
  });

  /* -------------------------------------------- */
  /*  buildAbilityActivationMessage               */
  /* -------------------------------------------- */

  describe('buildAbilityActivationMessage', () => {
    it('returns null when effect is empty', () => {
      const result = ModeHelper.buildAbilityActivationMessage('Brother Taco', 'Burst of Speed', 'solo', '', [], 1);
      expect(result).toBeNull();
    });

    it('builds solo mode message with green emoji', () => {
      const result = ModeHelper.buildAbilityActivationMessage('Brother Taco', 'Burst of Speed', 'solo', 'Increases AG Bonus by 2', [], 1);
      expect(result).toContain('🟢');
      expect(result).toContain('Brother Taco');
      expect(result).toContain('Burst of Speed');
      expect(result).toContain('Increases AG Bonus by 2');
    });

    it('builds squad mode message with blue emoji', () => {
      const result = ModeHelper.buildAbilityActivationMessage('Brother Taco', 'Bolter Assault', 'squad', 'Attack pattern', [], 1);
      expect(result).toContain('🔵');
      expect(result).toContain('Bolter Assault');
    });

    it('omits bullet list when no improvements qualify', () => {
      const improvements = [{ rank: 5, effect: 'High rank bonus' }];
      const result = ModeHelper.buildAbilityActivationMessage('Brother Taco', 'Burst of Speed', 'solo', 'Base effect', improvements, 3);
      expect(result).not.toContain('<ul>');
      expect(result).not.toContain('High rank bonus');
    });

    it('includes qualifying improvements as bullet list', () => {
      const improvements = [
        { rank: 3, effect: '+10 to AG tests' },
        { rank: 5, effect: 'AG Bonus becomes +4' }
      ];
      const result = ModeHelper.buildAbilityActivationMessage('Brother Taco', 'Burst of Speed', 'solo', 'Base effect', improvements, 4);
      expect(result).toContain('<ul>');
      expect(result).toContain('+10 to AG tests');
      expect(result).not.toContain('AG Bonus becomes +4');
    });

    it('includes all qualifying improvements at high rank', () => {
      const improvements = [
        { rank: 3, effect: 'Rank 3 bonus' },
        { rank: 5, effect: 'Rank 5 bonus' }
      ];
      const result = ModeHelper.buildAbilityActivationMessage('Brother Taco', 'Burst of Speed', 'solo', 'Base effect', improvements, 8);
      expect(result).toContain('Rank 3 bonus');
      expect(result).toContain('Rank 5 bonus');
    });

    it('builds message without emoji for empty modeRequirement', () => {
      const result = ModeHelper.buildAbilityActivationMessage('Brother Taco', 'Ability', '', 'Some effect', [], 1);
      expect(result).not.toContain('🟢');
      expect(result).not.toContain('🔵');
      expect(result).toContain('Some effect');
    });
  });
});
