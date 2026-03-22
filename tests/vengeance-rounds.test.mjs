import { jest } from '@jest/globals';
import './setup.mjs';
import DeathwatchWeapon from '../src/module/data/item/weapon.mjs';

describe('Vengeance Rounds', () => {
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

  it('sets penetration to 9', () => {
    const mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }
        ]
      }
    };
    mockActor.items.get.mockReturnValue(mockAmmo);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

    weapon._applyAmmunitionModifiers();

    expect(weapon.effectivePenetration).toBe(9);
  });

  it('adds Felling (1)', () => {
    const mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Felling', modifier: '1', effectType: 'weapon-felling', enabled: true }
        ]
      }
    };
    mockActor.items.get.mockReturnValue(mockAmmo);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

    weapon._applyAmmunitionModifiers();

    expect(weapon.effectiveFelling).toBe(1);
  });

  it('applies all three modifiers together', () => {
    const mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true },
          { name: 'Vengeance Felling', modifier: '1', effectType: 'weapon-felling', enabled: true },
          { name: 'Vengeance Detonation', modifier: '91', effectType: 'premature-detonation', enabled: true }
        ]
      }
    };
    mockActor.items.get.mockReturnValue(mockAmmo);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

    weapon._applyAmmunitionModifiers();

    expect(weapon.effectivePenetration).toBe(9);
    expect(weapon.effectiveFelling).toBe(1);
  });

  it('does not set effectiveFelling when no felling modifier', () => {
    const mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }
        ]
      }
    };
    mockActor.items.get.mockReturnValue(mockAmmo);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

    weapon._applyAmmunitionModifiers();

    expect(weapon.effectiveFelling).toBeUndefined();
  });

  it('keeps base penetration when higher than override', () => {
    const mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }
        ]
      }
    };
    mockActor.items.get.mockReturnValue(mockAmmo);
    const weapon = createWeapon({ dmg: '2d10', pen: 10, range: 150, rof: '-/-/6', loadedAmmo: 'ammo123' });

    weapon._applyAmmunitionModifiers();

    expect(weapon.effectivePenetration).toBe(10);
  });
});
