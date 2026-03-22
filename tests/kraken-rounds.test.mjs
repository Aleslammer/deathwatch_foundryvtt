import { jest } from '@jest/globals';
import './setup.mjs';
import DeathwatchWeapon from '../src/module/data/item/weapon.mjs';

describe('Ammunition Penetration Modifiers', () => {
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

  describe('weapon-penetration (override with minimum)', () => {
    it('sets penetration to 8 when base is 4', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Kraken', modifier: '8', effectType: 'weapon-penetration', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectivePenetration).toBe(8);
    });

    it('keeps base penetration when higher than override', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Kraken', modifier: '8', effectType: 'weapon-penetration', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '2d10', pen: 10, range: 150, rof: '-/-/6', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectivePenetration).toBe(10);
    });
  });

  describe('weapon-penetration-modifier (additive with minimum 0)', () => {
    it('reduces penetration by 2', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Metal Storm', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectivePenetration).toBe(2);
    });

    it('clamps to minimum 0', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Metal Storm', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 1, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectivePenetration).toBe(0);
    });
  });

  describe('Metal Storm Rounds', () => {
    it('reduces damage by 2, penetration by 2, and adds Blast(2)', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Metal Storm Damage', modifier: '-2', effectType: 'weapon-damage', enabled: true },
            { name: 'Metal Storm Pen', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true },
            { name: 'Metal Storm Blast', modifier: '2', effectType: 'weapon-blast', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+5 -2');
      expect(weapon.effectivePenetration).toBe(2);
      expect(weapon.effectiveBlast).toBe(2);
    });
  });

  describe('combined with range modifier', () => {
    it('applies both Kraken penetration and range', () => {
      const mockAmmo = {
        system: {
          modifiers: [
            { name: 'Kraken Pen', modifier: '8', effectType: 'weapon-penetration', enabled: true },
            { name: 'Kraken Range', modifier: 'x1.5', effectType: 'weapon-range', enabled: true }
          ]
        }
      };
      mockActor.items.get.mockReturnValue(mockAmmo);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });

      weapon._applyAmmunitionModifiers();

      expect(weapon.effectivePenetration).toBe(8);
      expect(weapon.effectiveRange).toBe(150);
    });
  });
});
