import { jest } from '@jest/globals';
import { CombatHelper } from '../../src/module/helpers/combat/combat.mjs';

describe('Characteristic Damage Integration', () => {
  let mockActor, mockWeapon, mockAmmo;

  beforeEach(() => {
    jest.clearAllMocks();

    mockActor = {
      _id: 'actor123',
      name: 'Test Marine',
      type: 'character',
      system: {
        characteristics: {
          ag: { value: 50, damage: 0 }
        }
      },
      items: {
        get: jest.fn(),
        filter: jest.fn(() => [])
      },
      update: jest.fn()
    };

    mockAmmo = {
      _id: 'ammo123',
      name: 'Implosion Shells',
      type: 'ammunition',
      system: {
        modifiers: [
          {
            name: 'Implosion Effect',
            effectType: 'characteristic-damage',
            valueAffected: 'ag',
            modifier: '1d5',
            enabled: true
          }
        ]
      }
    };

    mockWeapon = {
      _id: 'weapon123',
      name: 'Bolter',
      type: 'weapon',
      system: {
        class: 'Basic',
        dmg: '1d10+5',
        pen: 4,
        loadedAmmo: 'ammo123'
      },
      actor: mockActor
    };

    mockActor.items.get.mockImplementation((id) => {
      if (id === 'ammo123') return mockAmmo;
      return null;
    });
  });

  describe('_getCharacteristicDamageEffect', () => {
    it('should extract characteristic damage from loaded ammunition', () => {
      const result = CombatHelper._getCharacteristicDamageEffect(mockWeapon, mockActor);

      expect(result).toEqual({
        formula: '1d5',
        characteristic: 'ag',
        name: 'Implosion Effect'
      });
    });

    it('should return null when no ammunition loaded', () => {
      mockWeapon.system.loadedAmmo = null;

      const result = CombatHelper._getCharacteristicDamageEffect(mockWeapon, mockActor);

      expect(result).toBeNull();
    });

    it('should return null when ammunition has no characteristic-damage modifier', () => {
      mockAmmo.system.modifiers = [];

      const result = CombatHelper._getCharacteristicDamageEffect(mockWeapon, mockActor);

      expect(result).toBeNull();
    });

    it('should return null when modifier is disabled', () => {
      mockAmmo.system.modifiers[0].enabled = false;

      const result = CombatHelper._getCharacteristicDamageEffect(mockWeapon, mockActor);

      expect(result).toBeNull();
    });

    it('should handle multiple modifiers and return first characteristic-damage', () => {
      mockAmmo.system.modifiers = [
        { effectType: 'weapon-damage', modifier: -2, enabled: true },
        { effectType: 'characteristic-damage', valueAffected: 'str', modifier: '1d3', enabled: true, name: 'STR Damage' },
        { effectType: 'characteristic-damage', valueAffected: 'ag', modifier: '1d5', enabled: true, name: 'AG Damage' }
      ];

      const result = CombatHelper._getCharacteristicDamageEffect(mockWeapon, mockActor);

      expect(result).toEqual({
        formula: '1d3',
        characteristic: 'str',
        name: 'STR Damage'
      });
    });
  });
});
