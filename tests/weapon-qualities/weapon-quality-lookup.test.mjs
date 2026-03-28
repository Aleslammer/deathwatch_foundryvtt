import { jest } from '@jest/globals';
import { WeaponQualityHelper } from '../../src/module/helpers/weapon-quality-helper.mjs';

describe('Weapon Quality Lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock compendium pack
    const mockPack = {
      getDocument: jest.fn(async (id) => {
        const docs = {
          'tearing': { 
            _id: 'tearing',
            name: 'Tearing',
            system: { key: 'tearing' }
          },
          'accurate': { 
            _id: 'accurate',
            name: 'Accurate',
            system: { key: 'accurate' }
          }
        };
        return docs[id] || null;
      })
    };
    
    global.game.packs = new Map([
      ['deathwatch.weapon-qualities', mockPack]
    ]);
  });

  describe('getQualityKey', () => {
    it('returns quality key from compendium', async () => {
      const key = await WeaponQualityHelper.getQualityKey('tearing');
      expect(key).toBe('tearing');
    });

    it('returns null for unknown quality', async () => {
      const key = await WeaponQualityHelper.getQualityKey('unknown-id');
      expect(key).toBe(null);
    });

    it('returns null when pack not found', async () => {
      global.game.packs = new Map();
      const key = await WeaponQualityHelper.getQualityKey('tearing');
      expect(key).toBe(null);
    });
  });

  describe('hasQuality', () => {
    it('returns true when weapon has quality (string ID)', async () => {
      const weapon = {
        system: {
          attachedQualities: ['tearing']
        }
      };
      const result = await WeaponQualityHelper.hasQuality(weapon, 'tearing');
      expect(result).toBe(true);
    });

    it('returns true when weapon has quality (object with id)', async () => {
      const weapon = {
        system: {
          attachedQualities: [{ id: 'tearing', value: '' }]
        }
      };
      const result = await WeaponQualityHelper.hasQuality(weapon, 'tearing');
      expect(result).toBe(true);
    });

    it('returns false when weapon does not have quality', async () => {
      const weapon = {
        system: {
          attachedQualities: ['accurate']
        }
      };
      const result = await WeaponQualityHelper.hasQuality(weapon, 'tearing');
      expect(result).toBe(false);
    });

    it('returns false when weapon has no qualities', async () => {
      const weapon = {
        system: {
          attachedQualities: []
        }
      };
      const result = await WeaponQualityHelper.hasQuality(weapon, 'tearing');
      expect(result).toBe(false);
    });

    it('returns false when attachedQualities is undefined', async () => {
      const weapon = {
        system: {}
      };
      const result = await WeaponQualityHelper.hasQuality(weapon, 'tearing');
      expect(result).toBe(false);
    });

    it('handles multiple qualities correctly', async () => {
      const weapon = {
        system: {
          attachedQualities: ['accurate', 'tearing']
        }
      };
      const hasTearing = await WeaponQualityHelper.hasQuality(weapon, 'tearing');
      const hasAccurate = await WeaponQualityHelper.hasQuality(weapon, 'accurate');
      expect(hasTearing).toBe(true);
      expect(hasAccurate).toBe(true);
    });
  });
});
