import { jest } from '@jest/globals';
import '../setup.mjs';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';

describe('Toxic Weapon Quality', () => {
  describe('buildDamageMessage', () => {
    it('includes Toxic test button when isToxic and wounds taken', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Target', 5, 'Body', 15, 8, 4, 4, 3, false, 0, 'actor123', 'Impact', false, true
      );
      expect(message).toContain('toxic-test-btn');
      expect(message).toContain('data-actor-id="actor123"');
      expect(message).toContain('data-penalty="25"');
      expect(message).toContain('Toxic: Roll Toughness Test (-25)');
    });

    it('calculates penalty as wounds * 5', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Target', 3, 'Body', 15, 8, 4, 4, 3, false, 0, 'actor123', 'Impact', false, true
      );
      expect(message).toContain('data-penalty="15"');
      expect(message).toContain('(-15)');
    });

    it('does not include Toxic button when no wounds taken', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Target', 0, 'Body', 15, 8, 4, 4, 3, false, 0, 'actor123', 'Impact', false, true
      );
      expect(message).not.toContain('toxic-test-btn');
    });

    it('does not include Toxic button when not toxic', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Target', 5, 'Body', 15, 8, 4, 4, 3, false, 0, 'actor123', 'Impact', false, false
      );
      expect(message).not.toContain('toxic-test-btn');
    });

    it('includes both Shocking and Toxic buttons when both qualities present', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Target', 6, 'Body', 15, 8, 4, 4, 3, false, 0, 'actor123', 'Impact', true, true
      );
      expect(message).toContain('shocking-test-btn');
      expect(message).toContain('toxic-test-btn');
    });
  });
});
