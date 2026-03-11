import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchItem } from '../src/module/documents/item.mjs';

describe('Stalker Rounds', () => {
  let mockActor;
  let mockWeapon;
  let mockAmmo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockActor = {
      items: {
        get: jest.fn()
      }
    };
  });

  it('reduces damage by 2', () => {
    mockAmmo = {
      system: {
        modifiers: [
          { name: 'Stalker Rounds', modifier: '-2', effectType: 'weapon-damage', enabled: true }
        ]
      }
    };
    
    mockWeapon = new DeathwatchItem({
      name: 'Bolter',
      type: 'weapon',
      system: { dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' }
    }, { parent: mockActor });
    
    mockWeapon.actor = mockActor;
    mockActor.items.get.mockReturnValue(mockAmmo);
    mockWeapon._applyAmmunitionModifiers();
    
    expect(mockWeapon.system.effectiveDamage).toBe('1d10+9 -2');
  });

  it('does not reduce damage with Stalker Pattern quality', () => {
    mockAmmo = {
      system: {
        modifiers: [
          { name: 'Stalker Rounds', modifier: '-2', effectType: 'weapon-damage', qualityException: 'stalker-pattern', enabled: true }
        ]
      }
    };
    
    mockWeapon = new DeathwatchItem({
      name: 'Stalker Boltgun',
      type: 'weapon',
      system: { dmg: '1d10+9', pen: 4, range: 100, rof: 'S/-/-', loadedAmmo: 'ammo123', attachedQualities: ['stalker-pattern'] }
    }, { parent: mockActor });
    
    mockWeapon.actor = mockActor;
    mockActor.items.get.mockReturnValue(mockAmmo);
    mockWeapon._applyAmmunitionModifiers();
    
    expect(mockWeapon.system.effectiveDamage).toBeUndefined();
  });
});
