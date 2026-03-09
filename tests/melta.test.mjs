import { jest } from '@jest/globals';
import './setup.mjs';
import { WeaponQualityHelper } from '../src/module/helpers/weapon-quality-helper.mjs';
import { CombatDialogHelper } from '../src/module/helpers/combat-dialog.mjs';

describe('Melta Weapon Quality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isMelta', () => {
    it('should detect melta quality', async () => {
      const weapon = {
        system: {
          attachedQualities: [{ id: 'melta-quality-id' }]
        }
      };

      const mockPack = {
        getDocument: jest.fn().mockResolvedValue({
          system: { key: 'melta' }
        })
      };
      game.packs.get = jest.fn().mockReturnValue(mockPack);

      const result = await WeaponQualityHelper.isMelta(weapon);
      expect(result).toBe(true);
    });

    it('should return false for non-melta weapon', async () => {
      const weapon = {
        system: {
          attachedQualities: [{ id: 'other-quality-id' }]
        }
      };

      const mockPack = {
        getDocument: jest.fn().mockResolvedValue({
          system: { key: 'accurate' }
        })
      };
      game.packs.get = jest.fn().mockReturnValue(mockPack);

      const result = await WeaponQualityHelper.isMelta(weapon);
      expect(result).toBe(false);
    });
  });

  describe('Melta Penetration Doubling', () => {
    it('should double penetration at Short Range', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 8,
        penetration: 6,
        toughnessBonus: 4,
        isMeltaRange: true
      });

      // Effective penetration should be 12 (6 * 2)
      // Effective armor should be 0 (8 - 12, clamped to 0)
      // Wounds taken should be 16 (20 - 0 - 4)
      expect(result.effectiveArmor).toBe(0);
      expect(result.woundsTaken).toBe(16);
    });

    it('should not double penetration outside melta range', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 8,
        penetration: 6,
        toughnessBonus: 4,
        isMeltaRange: false
      });

      // Effective penetration should be 6
      // Effective armor should be 2 (8 - 6)
      // Wounds taken should be 14 (20 - 2 - 4)
      expect(result.effectiveArmor).toBe(2);
      expect(result.woundsTaken).toBe(14);
    });

    it('should not stack with Razor Sharp', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 8,
        penetration: 6,
        toughnessBonus: 4,
        isRazorSharp: true,
        degreesOfSuccess: 2,
        isMeltaRange: true
      });

      // Razor Sharp takes precedence (checked first)
      // Effective penetration should be 12 (6 * 2 from Razor Sharp)
      // Effective armor should be 0 (8 - 12, clamped to 0)
      // Wounds taken should be 16 (20 - 0 - 4)
      expect(result.effectiveArmor).toBe(0);
      expect(result.woundsTaken).toBe(16);
    });

    it('should work with Primitive weapons', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 8,
        penetration: 6,
        toughnessBonus: 4,
        isPrimitive: true,
        isMeltaRange: true
      });

      // Effective penetration should be 12 (6 * 2)
      // Primitive doubles armor first: 16 (8 * 2)
      // Effective armor should be 4 (16 - 12)
      // Wounds taken should be 12 (20 - 4 - 4)
      expect(result.effectiveArmor).toBe(4);
      expect(result.woundsTaken).toBe(12);
    });

    it('should handle zero armor', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 0,
        penetration: 6,
        toughnessBonus: 4,
        isMeltaRange: true
      });

      // Effective armor should be 0
      // Wounds taken should be 16 (20 - 0 - 4)
      expect(result.effectiveArmor).toBe(0);
      expect(result.woundsTaken).toBe(16);
    });

    it('should handle high armor', () => {
      const result = CombatDialogHelper.calculateDamageResult({
        damage: 20,
        armorValue: 15,
        penetration: 6,
        toughnessBonus: 4,
        isMeltaRange: true
      });

      // Effective penetration should be 12 (6 * 2)
      // Effective armor should be 3 (15 - 12)
      // Wounds taken should be 13 (20 - 3 - 4)
      expect(result.effectiveArmor).toBe(3);
      expect(result.woundsTaken).toBe(13);
    });
  });
});
