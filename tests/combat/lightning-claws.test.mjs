import { jest } from '@jest/globals';
import '../setup.mjs';
import { WeaponQualityHelper } from '../../src/module/helpers/weapon-quality-helper.mjs';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';

describe('Lightning Claws', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WeaponQualityHelper.isLightningClaw', () => {
    it('detects lightning claw by quality', async () => {
      const weapon = { system: { attachedQualities: [{ id: 'lc-quality' }] } };
      WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(true);
      expect(await WeaponQualityHelper.isLightningClaw(weapon)).toBe(true);
      expect(WeaponQualityHelper.hasQuality).toHaveBeenCalledWith(weapon, 'lightning-claw');
    });

    it('returns false for non-lightning claw', async () => {
      const weapon = { system: { attachedQualities: [] } };
      WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);
      expect(await WeaponQualityHelper.isLightningClaw(weapon)).toBe(false);
    });
  });

  describe('WeaponQualityHelper.hasLightningClawPair', () => {
    it('returns true when actor has 2 equipped lightning claws', async () => {
      const actor = {
        items: [
          { type: 'weapon', system: { equipped: true, attachedQualities: [{ id: 'lc1' }] } },
          { type: 'weapon', system: { equipped: true, attachedQualities: [{ id: 'lc2' }] } }
        ]
      };
      WeaponQualityHelper.isLightningClaw = jest.fn().mockResolvedValue(true);
      expect(await WeaponQualityHelper.hasLightningClawPair(actor)).toBe(true);
    });

    it('returns false when actor has only 1 equipped lightning claw', async () => {
      const actor = {
        items: [
          { type: 'weapon', system: { equipped: true, attachedQualities: [{ id: 'lc1' }] } }
        ]
      };
      WeaponQualityHelper.isLightningClaw = jest.fn()
        .mockResolvedValueOnce(true);
      expect(await WeaponQualityHelper.hasLightningClawPair(actor)).toBe(false);
    });

    it('returns false when actor has no lightning claws', async () => {
      const actor = {
        items: [
          { type: 'weapon', system: { equipped: true, attachedQualities: [] } }
        ]
      };
      WeaponQualityHelper.isLightningClaw = jest.fn().mockResolvedValue(false);
      expect(await WeaponQualityHelper.hasLightningClawPair(actor)).toBe(false);
    });
  });

  describe('CombatDialogHelper.buildDamageFormula - Lightning Claws', () => {
    it('adds +1 damage per degree of success for single lightning claw', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 3, isMelee: true, strBonus: 10, hitIndex: 0,
        isLightningClaw: true, hasLightningClawPair: false
      });
      expect(formula).toBe('1d10min3 + 10 + 3');
    });

    it('adds +2 damage per degree of success for lightning claw pair', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 3, isMelee: true, strBonus: 10, hitIndex: 0,
        isLightningClaw: true, hasLightningClawPair: true
      });
      expect(formula).toBe('1d10min3 + 10 + 6');
    });

    it('adds no bonus with 0 degrees of success', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 0, isMelee: true, strBonus: 10, hitIndex: 0,
        isLightningClaw: true, hasLightningClawPair: false
      });
      expect(formula).toBe('1d10 + 10');
    });

    it('works with 1 degree of success', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 1, isMelee: true, strBonus: 10, hitIndex: 0,
        isLightningClaw: true, hasLightningClawPair: false
      });
      expect(formula).toBe('1d10min1 + 10 + 1');
    });

    it('works with high degrees of success', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 5, isMelee: true, strBonus: 10, hitIndex: 0,
        isLightningClaw: true, hasLightningClawPair: true
      });
      expect(formula).toBe('1d10min5 + 10 + 10');
    });

    it('combines with tearing quality', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 2, isMelee: true, strBonus: 10, hitIndex: 0,
        isTearing: true, isLightningClaw: true, hasLightningClawPair: false
      });
      expect(formula).toBe('2d10min2dl1 + 10 + 2');
    });

    it('combines with power fist', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 2, isMelee: true, strBonus: 10, hitIndex: 0,
        isPowerFist: true, isLightningClaw: true, hasLightningClawPair: false
      });
      expect(formula).toBe('1d10min2 + 20 + 2');
    });
  });
});
