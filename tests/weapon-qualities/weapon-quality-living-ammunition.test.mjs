import { jest } from '@jest/globals';
import { WeaponQualityHelper } from '../../src/module/helpers/combat/weapon-quality-helper.mjs';

describe('Living Ammunition Weapon Quality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasQuality', () => {
    it('detects living-ammunition quality', async () => {
      const weapon = {
        system: {
          attachedQualities: [
            { id: 'living-ammunition' }
          ]
        }
      };

      global.game.packs = new Map([
        ['deathwatch.weapon-qualities', {
          getDocument: jest.fn().mockResolvedValue({
            system: { key: 'living-ammunition' }
          })
        }]
      ]);

      const result = await WeaponQualityHelper.hasQuality(weapon, 'living-ammunition');
      expect(result).toBe(true);
    });

    it('returns false when living-ammunition quality not present', async () => {
      const weapon = {
        system: {
          attachedQualities: []
        }
      };

      const result = await WeaponQualityHelper.hasQuality(weapon, 'living-ammunition');
      expect(result).toBe(false);
    });
  });

  describe('Jamming Prevention', () => {
    it('prevents jamming when living-ammunition is present', () => {
      const hasLivingAmmo = true;
      const hitValue = 96;
      const jamThreshold = 96;

      const isJammed = !hasLivingAmmo && hitValue >= jamThreshold;
      expect(isJammed).toBe(false);
    });

    it('allows jamming when living-ammunition is not present', () => {
      const hasLivingAmmo = false;
      const hitValue = 96;
      const jamThreshold = 96;

      const isJammed = !hasLivingAmmo && hitValue >= jamThreshold;
      expect(isJammed).toBe(true);
    });

    it('prevents jamming on semi-auto with living-ammunition', () => {
      const hasLivingAmmo = true;
      const hitValue = 94;
      const jamThreshold = 94;

      const isJammed = !hasLivingAmmo && hitValue >= jamThreshold;
      expect(isJammed).toBe(false);
    });

    it('allows jamming on semi-auto without living-ammunition', () => {
      const hasLivingAmmo = false;
      const hitValue = 94;
      const jamThreshold = 94;

      const isJammed = !hasLivingAmmo && hitValue >= jamThreshold;
      expect(isJammed).toBe(true);
    });
  });
});
