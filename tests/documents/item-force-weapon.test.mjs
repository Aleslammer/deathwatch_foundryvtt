import { jest } from '@jest/globals';
import '../setup.mjs';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

describe('DeathwatchWeapon - Force Weapon Modifiers', () => {
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActor = {
      system: { psyRating: { value: 0, base: 0 } },
      items: { get: jest.fn() }
    };
  });

  function createForceWeapon(overrides = {}) {
    const weapon = new DeathwatchWeapon();
    Object.assign(weapon, {
      dmg: overrides.dmg || '1d10+2',
      penetration: overrides.penetration || '2',
      class: 'Melee',
      attachedQualities: overrides.attachedQualities || [{id: 'balanced'}, {id: 'force'}],
      attachedUpgrades: [],
      range: 0,
      damage: '',
      rof: '',
      wt: 0,
      loadedAmmo: null
    });
    if (overrides.extraSystem) Object.assign(weapon, overrides.extraSystem);
    weapon.parent = { actor: mockActor };
    return weapon;
  }

  describe('applyForceWeaponModifiers', () => {
    it('should add psy rating bonus to damage and penetration', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = createForceWeapon();

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+2 +3');
      expect(weapon.effectivePenetration).toBe(5);
    });

    it('should not modify weapon without force quality', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = createForceWeapon({ attachedQualities: [{id: 'balanced'}] });

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
      expect(weapon.effectivePenetration).toBeUndefined();
    });

    it('should not modify weapon when actor has no psy rating', () => {
      mockActor.system.psyRating.value = 0;
      const weapon = createForceWeapon();

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
      expect(weapon.effectivePenetration).toBeUndefined();
    });

    it('should handle psy rating of 1', () => {
      mockActor.system.psyRating.value = 1;
      const weapon = createForceWeapon({ dmg: '1d10+1', penetration: '0' });

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+1 +1');
      expect(weapon.effectivePenetration).toBe(1);
    });

    it('should handle high psy rating', () => {
      mockActor.system.psyRating.value = 7;
      const weapon = createForceWeapon();

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+2 +7');
      expect(weapon.effectivePenetration).toBe(9);
    });

    it('should stack with existing effectiveDamage from ammunition', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = createForceWeapon();
      weapon.effectiveDamage = '1d10+2 -1';

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectiveDamage).toBe('1d10+2 -1 +3');
    });

    it('should stack with existing effectivePenetration from ammunition', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = createForceWeapon();
      weapon.effectivePenetration = 4;

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectivePenetration).toBe(7);
    });

    it('should handle missing psyRating on actor', () => {
      mockActor.system.psyRating = undefined;
      const weapon = createForceWeapon();

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
      expect(weapon.effectivePenetration).toBeUndefined();
    });

    it('should handle weapon with no attachedQualities', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = new DeathwatchWeapon();
      Object.assign(weapon, { dmg: '1d10+2', penetration: '2', class: 'Melee', range: 0, damage: '', rof: '', wt: 0, attachedUpgrades: [], loadedAmmo: null, attachedQualities: [] });
      weapon.parent = { actor: mockActor };

      weapon.applyForceWeaponModifiers();

      expect(weapon.effectiveDamage).toBeUndefined();
      expect(weapon.effectivePenetration).toBeUndefined();
    });
  });
});
