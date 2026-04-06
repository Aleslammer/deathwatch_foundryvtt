import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';

describe('Shocking Weapon Quality', () => {
  describe('buildDamageMessage', () => {
    it('includes Shocking test button when damage is dealt', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Marine', 8, 'Body', 15, 5, 2, 3, 4, false, 0, 'actor1', 'Energy', true
      );
      expect(message).toContain('shocking-test-btn');
      expect(message).toContain('data-actor-id="actor1"');
      expect(message).toContain('data-armor-value="5"');
      expect(message).toContain('data-stun-rounds="4"'); // floor(8/2) = 4
    });

    it('calculates stun rounds as half damage', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Marine', 10, 'Body', 15, 5, 2, 3, 4, false, 0, 'actor1', 'Energy', true
      );
      expect(message).toContain('data-stun-rounds="5"'); // floor(10/2) = 5
    });

    it('does not include Shocking button when no damage dealt', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Marine', 0, 'Body', 5, 10, 2, 8, 4, false, 0, 'actor1', 'Energy', true
      );
      expect(message).not.toContain('shocking-test-btn');
    });

    it('does not include Shocking button when not Shocking', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Marine', 8, 'Body', 15, 5, 2, 3, 4, false, 0, 'actor1', 'Energy', false
      );
      expect(message).not.toContain('shocking-test-btn');
    });

    it('includes both Shocking and Critical buttons when applicable', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Marine', 15, 'Body', 20, 5, 2, 3, 4, true, 5, 'actor1', 'Energy', true
      );
      expect(message).toContain('shocking-test-btn');
      expect(message).toContain('roll-critical-btn');
      expect(message).toContain('data-stun-rounds="7"'); // floor(15/2) = 7
    });

    it('handles odd damage values for stun rounds', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Marine', 7, 'Body', 15, 5, 2, 3, 4, false, 0, 'actor1', 'Energy', true
      );
      expect(message).toContain('data-stun-rounds="3"'); // floor(7/2) = 3
    });
  });
});
