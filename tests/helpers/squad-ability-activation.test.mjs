import { jest } from '@jest/globals';
import { ModeHelper } from '../../src/module/helpers/mode-helper.mjs';

describe('ModeHelper — Squad Mode Activation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* -------------------------------------------- */
  /*  canActivateSquadAbility                     */
  /* -------------------------------------------- */

  describe('canActivateSquadAbility', () => {
    it('allows activation when in Squad Mode with sufficient Cohesion', () => {
      const result = ModeHelper.canActivateSquadAbility('squad', 5, 3);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('');
    });

    it('allows activation when Cohesion exactly equals cost', () => {
      const result = ModeHelper.canActivateSquadAbility('squad', 2, 2);
      expect(result.allowed).toBe(true);
    });

    it('rejects when not in Squad Mode', () => {
      const result = ModeHelper.canActivateSquadAbility('solo', 5, 2);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Squad Mode');
    });

    it('rejects when Cohesion is insufficient', () => {
      const result = ModeHelper.canActivateSquadAbility('squad', 1, 3);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient Cohesion');
    });

    it('rejects when Cohesion is 0', () => {
      const result = ModeHelper.canActivateSquadAbility('squad', 0, 1);
      expect(result.allowed).toBe(false);
    });

    it('allows zero-cost abilities in Squad Mode', () => {
      const result = ModeHelper.canActivateSquadAbility('squad', 0, 0);
      expect(result.allowed).toBe(true);
    });
  });

  /* -------------------------------------------- */
  /*  buildSquadActivationMessage                 */
  /* -------------------------------------------- */

  describe('buildSquadActivationMessage', () => {
    it('builds activation message with Cohesion cost', () => {
      const msg = ModeHelper.buildSquadActivationMessage('Brother Castiel', 'Fire Support', 2, 3, 5);
      expect(msg).toContain('🔵');
      expect(msg).toContain('Brother Castiel');
      expect(msg).toContain('Fire Support');
      expect(msg).toContain('-2');
      expect(msg).toContain('3 / 5');
    });

    it('includes cohesion-chat class', () => {
      const msg = ModeHelper.buildSquadActivationMessage('Brother Taco', 'Dig In', 1, 4, 5);
      expect(msg).toContain('cohesion-chat');
    });

    it('includes effect text when provided', () => {
      const msg = ModeHelper.buildSquadActivationMessage('Brother Taco', 'Squad Advance', 1, 3, 5, 'Kill-team may use Reactions to make a Tactical Advance');
      expect(msg).toContain('Kill-team may use Reactions to make a Tactical Advance');
    });

    it('includes qualifying improvements', () => {
      const improvements = [{ rank: 3, effect: 'Becomes a Free Action' }, { rank: 5, effect: 'High rank bonus' }];
      const msg = ModeHelper.buildSquadActivationMessage('Brother Taco', 'Fire Support', 1, 3, 5, 'Base effect', improvements, 4);
      expect(msg).toContain('Becomes a Free Action');
      expect(msg).not.toContain('High rank bonus');
    });

    it('omits effect section when effect is empty', () => {
      const msg = ModeHelper.buildSquadActivationMessage('Brother Taco', 'Dig In', 1, 4, 5, '');
      expect(msg).not.toContain('<ul>');
      expect(msg).toContain('Dig In');
    });
  });

  /* -------------------------------------------- */
  /*  buildDeactivationMessage                    */
  /* -------------------------------------------- */

  describe('buildDeactivationMessage', () => {
    it('builds deactivation message', () => {
      const msg = ModeHelper.buildDeactivationMessage('Fire Support');
      expect(msg).toContain('🔵');
      expect(msg).toContain('Fire Support');
      expect(msg).toContain('deactivated');
    });

    it('includes cohesion-chat class', () => {
      const msg = ModeHelper.buildDeactivationMessage('Dig In');
      expect(msg).toContain('cohesion-chat');
    });
  });

  /* -------------------------------------------- */
  /*  isSustainingAbility                         */
  /* -------------------------------------------- */

  describe('isSustainingAbility', () => {
    it('returns false for empty array', () => {
      expect(ModeHelper.isSustainingAbility([], 'actor1')).toBe(false);
    });

    it('returns false for null', () => {
      expect(ModeHelper.isSustainingAbility(null, 'actor1')).toBe(false);
    });

    it('returns true when actor is sustaining', () => {
      const active = [{ initiatorId: 'actor1', sustained: true }];
      expect(ModeHelper.isSustainingAbility(active, 'actor1')).toBe(true);
    });

    it('returns false when different actor is sustaining', () => {
      const active = [{ initiatorId: 'actor2', sustained: true }];
      expect(ModeHelper.isSustainingAbility(active, 'actor1')).toBe(false);
    });

    it('returns false when actor has non-sustained entry', () => {
      const active = [{ initiatorId: 'actor1', sustained: false }];
      expect(ModeHelper.isSustainingAbility(active, 'actor1')).toBe(false);
    });
  });
});
