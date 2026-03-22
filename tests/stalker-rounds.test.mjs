import { jest } from '@jest/globals';
import './setup.mjs';
import DeathwatchWeapon from '../src/module/data/item/weapon.mjs';

describe('Stalker Rounds', () => {
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActor = { items: { get: jest.fn() } };
  });

  function createWeapon(systemOverrides) {
    const weapon = new DeathwatchWeapon();
    Object.assign(weapon, { range: 0, dmg: '', damage: '', rof: '', class: '', attachedUpgrades: [], attachedQualities: [], loadedAmmo: null, penetration: 0, pen: 0, wt: 0, ...systemOverrides });
    weapon.parent = { actor: mockActor };
    return weapon;
  }

  it('reduces damage by 2', () => {
    const mockAmmo = {
      system: {
        modifiers: [
          { name: 'Stalker Rounds', modifier: '-2', effectType: 'weapon-damage', enabled: true }
        ]
      }
    };
    mockActor.items.get.mockReturnValue(mockAmmo);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

    weapon._applyAmmunitionModifiers();

    expect(weapon.effectiveDamage).toBe('1d10+9 -2');
  });

  it('does not reduce damage with Stalker Pattern quality', () => {
    const mockAmmo = {
      system: {
        modifiers: [
          { name: 'Stalker Rounds', modifier: '-2', effectType: 'weapon-damage', qualityException: 'stalker-pattern', enabled: true }
        ]
      }
    };
    mockActor.items.get.mockReturnValue(mockAmmo);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/-/-', loadedAmmo: 'ammo123', attachedQualities: [{id: 'stalker-pattern'}] });

    weapon._applyAmmunitionModifiers();

    expect(weapon.effectiveDamage).toBeUndefined();
  });
});
