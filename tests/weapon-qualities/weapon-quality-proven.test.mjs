import { jest } from '@jest/globals';
import '../setup.mjs';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';
import { WeaponQualityHelper } from '../../src/module/helpers/weapon-quality-helper.mjs';

describe('Proven Weapon Quality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildDamageFormula with Proven', () => {
    it('applies Proven 3 to single d10', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10+5', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, provenRating: 3 });
      expect(formula).toBe('1d10min3+5');
    });

    it('applies Proven 4 to multiple dice', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10+8', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, provenRating: 4 });
      expect(formula).toBe('2d10min4+8');
    });

    it('applies Proven with degrees of success (uses higher value)', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10+5', degreesOfSuccess: 2, isMelee: false, strBonus: 0, hitIndex: 0, provenRating: 3 });
      expect(formula).toBe('1d10min3+5');
    });

    it('does not apply Proven when rating is 0', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10+5', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, provenRating: 0 });
      expect(formula).toBe('1d10+5');
    });

    it('applies Proven with Tearing', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10+5', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, isTearing: true, provenRating: 3 });
      expect(formula).toBe('2d10min3dl1+5');
    });

    it('applies Proven with melee STR bonus', () => {
      const formula = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10+5', degreesOfSuccess: 0, isMelee: true, strBonus: 4, hitIndex: 0, provenRating: 3 });
      expect(formula).toBe('1d10min3+5 + 4');
    });
  });

  describe('WeaponQualityHelper.getProvenRating', () => {
    it('returns 0 when no qualities attached', async () => {
      const weapon = { system: { attachedQualities: [] } };
      const rating = await WeaponQualityHelper.getProvenRating(weapon);
      expect(rating).toBe(0);
    });

    it('returns rating when Proven quality attached', async () => {
      const mockQuality = { system: { key: 'proven', value: '3' } };
      global.game.packs.get = jest.fn().mockReturnValue({
        getDocument: jest.fn().mockResolvedValue(mockQuality)
      });

      const weapon = { system: { attachedQualities: ['proven-id'] } };
      const rating = await WeaponQualityHelper.getProvenRating(weapon);
      expect(rating).toBe(3);
    });

    it('returns 0 when quality is not Proven', async () => {
      const mockQuality = { system: { key: 'tearing' } };
      global.game.packs.get = jest.fn().mockReturnValue({
        getDocument: jest.fn().mockResolvedValue(mockQuality)
      });

      const weapon = { system: { attachedQualities: ['tearing-id'] } };
      const rating = await WeaponQualityHelper.getProvenRating(weapon);
      expect(rating).toBe(0);
    });
  });
});
