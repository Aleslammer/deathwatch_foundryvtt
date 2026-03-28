import { jest } from '@jest/globals';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

describe('DeathwatchWeapon - Own Modifiers', () => {
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActor = {
      items: { get: jest.fn() }
    };
  });

  function createWeapon(systemOverrides) {
    const weapon = new DeathwatchWeapon();
    Object.assign(weapon, { range: 0, dmg: '', damage: '', rof: '', class: '', attachedUpgrades: [], attachedQualities: [], loadedAmmo: null, penetration: 0, pen: 0, wt: 0, modifiers: [], ...systemOverrides });
    weapon.parent = { actor: mockActor };
    return weapon;
  }

  function setCharacteristics(overrides = {}) {
    const defaults = { ws: 40, bs: 40, str: 40, tg: 40, ag: 40, int: 40, per: 40, wil: 40, fs: 40 };
    const chars = {};
    for (const [key, val] of Object.entries({ ...defaults, ...overrides })) {
      chars[key] = { value: val, base: val, mod: Math.floor(val / 10) };
    }
    mockActor.system = { characteristics: chars };
  }

  describe('_applyOwnModifiers', () => {
    it('should apply weapon-rof modifier', () => {
      const weapon = createWeapon({
        rof: 'S/-/-',
        modifiers: [
          { name: 'Swift Attack RoF', modifier: 'S/2/-', effectType: 'weapon-rof', enabled: true }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveRof).toBe('S/2/-');
    });

    it('should apply weapon-rof with full auto', () => {
      const weapon = createWeapon({
        rof: 'S/-/-',
        modifiers: [
          { name: 'Lightning Attack RoF', modifier: 'S/2/4', effectType: 'weapon-rof', enabled: true }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveRof).toBe('S/2/4');
    });

    it('should apply weapon-damage modifier', () => {
      const weapon = createWeapon({
        dmg: '1d10+4',
        modifiers: [
          { name: 'Damage Bonus', modifier: '2', effectType: 'weapon-damage', enabled: true }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+4 +2');
    });

    it('should apply negative weapon-damage modifier', () => {
      const weapon = createWeapon({
        dmg: '1d10+4',
        modifiers: [
          { name: 'Damage Penalty', modifier: '-2', effectType: 'weapon-damage', enabled: true }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+4 -2');
    });

    it('should apply weapon-blast modifier', () => {
      const weapon = createWeapon({
        modifiers: [
          { name: 'Blast', modifier: '5', effectType: 'weapon-blast', enabled: true }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveBlast).toBe(5);
    });

    it('should apply weapon-penetration modifier', () => {
      const weapon = createWeapon({
        penetration: 2,
        modifiers: [
          { name: 'Pen Bonus', modifier: '5', effectType: 'weapon-penetration', enabled: true }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectivePenetration).toBe(5);
    });

    it('should ignore disabled modifiers', () => {
      const weapon = createWeapon({
        rof: 'S/-/-',
        modifiers: [
          { name: 'Disabled RoF', modifier: 'S/2/4', effectType: 'weapon-rof', enabled: false }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveRof).toBeUndefined();
    });

    it('should respect weaponClass restriction', () => {
      const weapon = createWeapon({
        class: 'Basic',
        rof: 'S/-/-',
        modifiers: [
          { name: 'Heavy Only', modifier: 'S/3/6', effectType: 'weapon-rof', enabled: true, weaponClass: 'heavy' }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveRof).toBeUndefined();
    });

    it('should apply modifier when weaponClass matches', () => {
      const weapon = createWeapon({
        class: 'Heavy',
        rof: 'S/-/-',
        modifiers: [
          { name: 'Heavy RoF', modifier: 'S/3/6', effectType: 'weapon-rof', enabled: true, weaponClass: 'heavy' }
        ]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveRof).toBe('S/3/6');
    });

    it('should handle empty modifiers array', () => {
      const weapon = createWeapon({ rof: 'S/-/-', modifiers: [] });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveRof).toBeUndefined();
      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should handle missing modifiers array', () => {
      const weapon = createWeapon({ rof: 'S/-/-' });
      delete weapon.modifiers;

      weapon._applyOwnModifiers();

      expect(weapon.effectiveRof).toBeUndefined();
    });
  });

  describe('characteristic bonus shorthand', () => {
    it('should resolve strb to Strength Bonus', () => {
      setCharacteristics({ str: 50 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'STR Bonus', modifier: 'strb', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +5');
    });

    it('should resolve strb+2 to Strength Bonus + 2', () => {
      setCharacteristics({ str: 40 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'STR+2', modifier: 'strb+2', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +6');
    });

    it('should resolve strb-1 to Strength Bonus - 1', () => {
      setCharacteristics({ str: 40 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'STR-1', modifier: 'strb-1', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +3');
    });

    it('should resolve strbx2 to Strength Bonus * 2', () => {
      setCharacteristics({ str: 40 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'STRx2', modifier: 'strbx2', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +8');
    });

    it('should resolve strbx2+3 to Strength Bonus * 2 + 3', () => {
      setCharacteristics({ str: 40 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'STRx2+3', modifier: 'strbx2+3', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +11');
    });

    it('should resolve agb to Agility Bonus', () => {
      setCharacteristics({ ag: 55 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'AG Bonus', modifier: 'agb', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +5');
    });

    it('should resolve tgb to Toughness Bonus', () => {
      setCharacteristics({ tg: 60 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'TG Bonus', modifier: 'tgb', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +6');
    });

    it('should resolve wsb to Weapon Skill Bonus', () => {
      setCharacteristics({ ws: 45 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'WS Bonus', modifier: 'wsb', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +4');
    });

    it('should resolve bsb to Ballistic Skill Bonus', () => {
      setCharacteristics({ bs: 50 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'BS Bonus', modifier: 'bsb', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +5');
    });

    it('should resolve wilb to Willpower Bonus', () => {
      setCharacteristics({ wil: 35 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'WIL Bonus', modifier: 'wilb', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +3');
    });

    it('should fall back to parseInt for plain numbers', () => {
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'Flat Bonus', modifier: '3', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBe('1d10 +3');
    });

    it('should not set effectiveDamage when resolved bonus is zero', () => {
      setCharacteristics({ str: 0 });
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'STR Bonus', modifier: 'sb', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should handle no actor gracefully', () => {
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'STR Bonus', modifier: 'sb', effectType: 'weapon-damage', enabled: true }]
      });
      weapon.parent = { actor: null };

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });

    it('should resolve all nine characteristic shorthands', () => {
      const charKeys = ['ws', 'bs', 'str', 'tg', 'ag', 'int', 'per', 'wil', 'fs'];
      for (const charKey of charKeys) {
        setCharacteristics({ [charKey]: 30 });
        const weapon = createWeapon({
          dmg: '1d10',
          modifiers: [{ name: 'Test', modifier: `${charKey}b`, effectType: 'weapon-damage', enabled: true }]
        });

        weapon._applyOwnModifiers();

        expect(weapon.effectiveDamage).toBe('1d10 +3');
      }
    });

    it('should reject unknown characteristic keys', () => {
      setCharacteristics();
      const weapon = createWeapon({
        dmg: '1d10',
        modifiers: [{ name: 'Bad', modifier: 'fakeb', effectType: 'weapon-damage', enabled: true }]
      });

      weapon._applyOwnModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
    });
  });
});
