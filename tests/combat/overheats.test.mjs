import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';

describe('Overheats Quality', () => {
  describe('buildAttackLabel', () => {
    it('shows overheat warning', () => {
      const label = CombatDialogHelper.buildAttackLabel('Plasma Gun', 50, 1, false, true);
      expect(label).toContain('WEAPON OVERHEATED!');
      expect(label).toContain('color: orange');
    });

    it('shows both jam and overheat warnings', () => {
      const label = CombatDialogHelper.buildAttackLabel('Plasma Gun', 50, 1, true, true);
      expect(label).toContain('WEAPON JAMMED!');
      expect(label).toContain('WEAPON OVERHEATED!');
    });

    it('does not show overheat when false', () => {
      const label = CombatDialogHelper.buildAttackLabel('Plasma Gun', 50, 1, false, false);
      expect(label).not.toContain('OVERHEATED');
    });
  });
});
