import { jest } from '@jest/globals';
import '../setup.mjs';
import { DeathwatchItem } from '../../src/module/documents/item.mjs';

describe('DeathwatchItem - Force Weapon Modifiers', () => {
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActor = {
      system: { psyRating: { value: 0, base: 0 } },
      items: { get: jest.fn() }
    };
  });

  function createForceWeapon(overrides = {}) {
    const weapon = new DeathwatchItem({
      name: overrides.name || 'Force Sword',
      type: 'weapon',
      system: {
        dmg: overrides.dmg || '1d10+2',
        penetration: overrides.penetration || '2',
        class: 'Melee',
        attachedQualities: overrides.attachedQualities || ['balanced', 'force'],
        ...overrides.extraSystem
      }
    });
    weapon.actor = mockActor;
    return weapon;
  }

  describe('_applyForceWeaponModifiers', () => {
    it('should add psy rating bonus to damage and penetration', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = createForceWeapon();

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectiveDamage).toBe('1d10+2 +3');
      expect(weapon.system.effectivePenetration).toBe(5);
    });

    it('should not modify weapon without force quality', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = createForceWeapon({ attachedQualities: ['balanced'] });

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectiveDamage).toBeUndefined();
      expect(weapon.system.effectivePenetration).toBeUndefined();
    });

    it('should not modify weapon when actor has no psy rating', () => {
      mockActor.system.psyRating.value = 0;
      const weapon = createForceWeapon();

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectiveDamage).toBeUndefined();
      expect(weapon.system.effectivePenetration).toBeUndefined();
    });

    it('should handle psy rating of 1', () => {
      mockActor.system.psyRating.value = 1;
      const weapon = createForceWeapon({ dmg: '1d10+1', penetration: '0' });

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectiveDamage).toBe('1d10+1 +1');
      expect(weapon.system.effectivePenetration).toBe(1);
    });

    it('should handle high psy rating', () => {
      mockActor.system.psyRating.value = 7;
      const weapon = createForceWeapon();

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectiveDamage).toBe('1d10+2 +7');
      expect(weapon.system.effectivePenetration).toBe(9);
    });

    it('should stack with existing effectiveDamage from ammunition', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = createForceWeapon();
      weapon.system.effectiveDamage = '1d10+2 -1';

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectiveDamage).toBe('1d10+2 -1 +3');
    });

    it('should stack with existing effectivePenetration from ammunition', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = createForceWeapon();
      weapon.system.effectivePenetration = 4;

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectivePenetration).toBe(7);
    });

    it('should handle missing psyRating on actor', () => {
      mockActor.system.psyRating = undefined;
      const weapon = createForceWeapon();

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectiveDamage).toBeUndefined();
      expect(weapon.system.effectivePenetration).toBeUndefined();
    });

    it('should handle weapon with no attachedQualities', () => {
      mockActor.system.psyRating.value = 3;
      const weapon = new DeathwatchItem({
        name: 'Plain Sword',
        type: 'weapon',
        system: { dmg: '1d10+2', penetration: '2', class: 'Melee' }
      });
      weapon.actor = mockActor;

      weapon._applyForceWeaponModifiers();

      expect(weapon.system.effectiveDamage).toBeUndefined();
      expect(weapon.system.effectivePenetration).toBeUndefined();
    });
  });
});
