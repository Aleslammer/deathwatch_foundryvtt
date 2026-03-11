import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchItem } from '../src/module/documents/item.mjs';

describe('Vengeance Rounds', () => {
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

  it('sets penetration to 9', () => {
    mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }
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
    
    expect(mockWeapon.system.effectivePenetration).toBe(9);
  });

  it('adds Felling (1)', () => {
    mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Felling', modifier: '1', effectType: 'weapon-felling', enabled: true }
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
    
    expect(mockWeapon.system.effectiveFelling).toBe(1);
  });

  it('applies all three modifiers together', () => {
    mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true },
          { name: 'Vengeance Felling', modifier: '1', effectType: 'weapon-felling', enabled: true },
          { name: 'Vengeance Detonation', modifier: '91', effectType: 'premature-detonation', enabled: true }
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
    
    expect(mockWeapon.system.effectivePenetration).toBe(9);
    expect(mockWeapon.system.effectiveFelling).toBe(1);
    // premature-detonation is checked in combat, not in prepareData
  });

  it('does not set effectiveFelling when no felling modifier', () => {
    mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }
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
    
    expect(mockWeapon.system.effectiveFelling).toBeUndefined();
  });

  it('keeps base penetration when higher than override', () => {
    mockAmmo = {
      system: {
        modifiers: [
          { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }
        ]
      }
    };
    
    mockWeapon = new DeathwatchItem({
      name: 'Heavy Bolter',
      type: 'weapon',
      system: { dmg: '2d10', pen: 10, range: 150, rof: '-/-/6', loadedAmmo: 'ammo123' }
    }, { parent: mockActor });
    
    mockWeapon.actor = mockActor;
    mockActor.items.get.mockReturnValue(mockAmmo);
    mockWeapon._applyAmmunitionModifiers();
    
    expect(mockWeapon.system.effectivePenetration).toBe(10);
  });
});
