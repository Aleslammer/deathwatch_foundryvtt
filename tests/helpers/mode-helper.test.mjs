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
});
