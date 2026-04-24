import { jest } from '@jest/globals';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

let mockActor;

beforeEach(() => {
  jest.clearAllMocks();
  mockActor = { items: new Map() };
});

function createWeapon(systemOverrides) {
  const weapon = new DeathwatchWeapon();
  Object.assign(weapon, { range: 0, dmg: '', damage: '', rof: '', class: '', attachedUpgrades: [], attachedQualities: [], loadedAmmo: null, penetration: 0, pen: 0, wt: 0, ...systemOverrides });
  weapon.parent = { actor: mockActor, system: weapon };
  return weapon;
}

function loadAmmo(modifiers) {
  const ammoId = 'ammo123';
  mockActor.items.set(ammoId, { system: { modifiers } });
}

describe('Kraken Rounds', () => {
  describe('weapon-penetration (override with minimum)', () => {
    it('sets penetration to 8 when base is 4', () => {
      loadAmmo([{ name: 'Kraken', modifier: '8', effectType: 'weapon-penetration', enabled: true }]);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
      weapon._applyOwnModifiers();
      expect(weapon.effectivePenetration).toBe(8);
    });

    it('keeps base penetration when higher than override', () => {
      loadAmmo([{ name: 'Kraken', modifier: '8', effectType: 'weapon-penetration', enabled: true }]);
      const weapon = createWeapon({ dmg: '2d10', pen: 10, range: 150, rof: '-/-/6', loadedAmmo: 'ammo123' });
      weapon._applyOwnModifiers();
      expect(weapon.effectivePenetration).toBe(10);
    });
  });

  describe('weapon-penetration-modifier (additive with minimum 0)', () => {
    it('reduces penetration by 2', () => {
      loadAmmo([{ name: 'Metal Storm', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true }]);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
      weapon._applyOwnModifiers();
      expect(weapon.effectivePenetration).toBe(2);
    });

    it('clamps to minimum 0', () => {
      loadAmmo([{ name: 'Metal Storm', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true }]);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 1, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
      weapon._applyOwnModifiers();
      expect(weapon.effectivePenetration).toBe(0);
    });
  });

  describe('Metal Storm Rounds', () => {
    it('reduces damage by 2, penetration by 2, and adds Blast(2)', () => {
      loadAmmo([
        { name: 'Metal Storm Damage', modifier: '-2', effectType: 'weapon-damage', enabled: true },
        { name: 'Metal Storm Pen', modifier: '-2', effectType: 'weapon-penetration-modifier', enabled: true },
        { name: 'Metal Storm Blast', modifier: '2', effectType: 'weapon-blast', enabled: true }
      ]);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
      weapon._applyOwnModifiers();
      expect(weapon.effectiveDamage).toBe('1d10+5 -2');
      expect(weapon.effectivePenetration).toBe(2);
      expect(weapon.effectiveBlast).toBe(2);
    });
  });

  describe('combined with range modifier', () => {
    it('applies both Kraken penetration and range', () => {
      loadAmmo([
        { name: 'Kraken Pen', modifier: '8', effectType: 'weapon-penetration', enabled: true },
        { name: 'Kraken Range', modifier: 'x1.5', effectType: 'weapon-range', enabled: true }
      ]);
      const weapon = createWeapon({ dmg: '1d10+5', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
      weapon._applyOwnModifiers();
      expect(weapon.effectivePenetration).toBe(8);
      expect(weapon.effectiveRange).toBe(150);
    });
  });
});

describe('Stalker Rounds', () => {
  it('reduces damage by 2', () => {
    loadAmmo([{ name: 'Stalker Rounds', modifier: '-2', effectType: 'weapon-damage', enabled: true }]);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
    weapon._applyOwnModifiers();
    expect(weapon.effectiveDamage).toBe('1d10+9 -2');
  });

  it('does not reduce damage with Stalker Pattern quality', () => {
    loadAmmo([{ name: 'Stalker Rounds', modifier: '-2', effectType: 'weapon-damage', qualityException: 'stalker-pattern', enabled: true }]);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/-/-', loadedAmmo: 'ammo123', attachedQualities: [{id: 'stalker-pattern'}] });
    weapon._applyOwnModifiers();
    expect(weapon.effectiveDamage).toBeUndefined();
  });
});

describe('Vengeance Rounds', () => {
  it('sets penetration to 9', () => {
    loadAmmo([{ name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }]);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
    weapon._applyOwnModifiers();
    expect(weapon.effectivePenetration).toBe(9);
  });

  it('adds Felling (1)', () => {
    loadAmmo([{ name: 'Vengeance Felling', modifier: '1', effectType: 'weapon-felling', enabled: true }]);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
    weapon._applyOwnModifiers();
    expect(weapon.effectiveFelling).toBe(1);
  });

  it('applies all three modifiers together', () => {
    loadAmmo([
      { name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true },
      { name: 'Vengeance Felling', modifier: '1', effectType: 'weapon-felling', enabled: true },
      { name: 'Vengeance Detonation', modifier: '91', effectType: 'premature-detonation', enabled: true }
    ]);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
    weapon._applyOwnModifiers();
    expect(weapon.effectivePenetration).toBe(9);
    expect(weapon.effectiveFelling).toBe(1);
  });

  it('does not set effectiveFelling when no felling modifier', () => {
    loadAmmo([{ name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }]);
    const weapon = createWeapon({ dmg: '1d10+9', pen: 4, range: 100, rof: 'S/3/-', loadedAmmo: 'ammo123' });
    weapon._applyOwnModifiers();
    expect(weapon.effectiveFelling).toBeUndefined();
  });

  it('keeps base penetration when higher than override', () => {
    loadAmmo([{ name: 'Vengeance Penetration', modifier: '9', effectType: 'weapon-penetration', enabled: true }]);
    const weapon = createWeapon({ dmg: '2d10', pen: 10, range: 150, rof: '-/-/6', loadedAmmo: 'ammo123' });
    weapon._applyOwnModifiers();
    expect(weapon.effectivePenetration).toBe(10);
  });
});
