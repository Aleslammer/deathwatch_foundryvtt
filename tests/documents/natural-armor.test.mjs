import { jest } from '@jest/globals';
import '../setup.mjs';
import DeathwatchActorBase from '../../src/module/data/actor/base-actor.mjs';

describe('DeathwatchActorBase - Natural Armor', () => {
  let actorBase;

  function createActorBase(options = {}) {
    const base = new DeathwatchActorBase();
    base.naturalArmorValue = options.naturalArmorValue || 0;
    base.characteristics = options.characteristics || { tg: { baseMod: 3, unnaturalMultiplier: 1 } };
    base.parent = {
      items: {
        find: jest.fn((fn) => {
          const items = options.items || [];
          return items.find(fn);
        })
      }
    };
    return base;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getArmorValue', () => {
    it('returns natural armor when no equipped armor item exists', () => {
      actorBase = createActorBase({ naturalArmorValue: 2 });

      expect(actorBase.getArmorValue('Body')).toBe(2);
    });

    it('returns 0 when no armor item and no natural armor', () => {
      actorBase = createActorBase({ naturalArmorValue: 0 });

      expect(actorBase.getArmorValue('Body')).toBe(0);
    });

    it('combines equipped armor with natural armor', () => {
      const armorItem = {
        type: 'armor',
        system: { equipped: true, body: 8, head: 6 }
      };
      actorBase = createActorBase({
        naturalArmorValue: 2,
        items: [armorItem]
      });

      expect(actorBase.getArmorValue('Body')).toBe(10);
      expect(actorBase.getArmorValue('Head')).toBe(8);
    });

    it('returns only equipped armor when no natural armor', () => {
      const armorItem = {
        type: 'armor',
        system: { equipped: true, body: 8 }
      };
      actorBase = createActorBase({
        naturalArmorValue: 0,
        items: [armorItem]
      });

      expect(actorBase.getArmorValue('Body')).toBe(8);
    });
  });

  describe('getDefenses', () => {
    it('includes naturalArmorValue in defenses', () => {
      actorBase = createActorBase({ naturalArmorValue: 3 });

      const defenses = actorBase.getDefenses('Body');

      expect(defenses.naturalArmorValue).toBe(3);
      expect(defenses.armorValue).toBe(3);
    });

    it('returns 0 naturalArmorValue when none set', () => {
      actorBase = createActorBase({});

      const defenses = actorBase.getDefenses('Body');

      expect(defenses.naturalArmorValue).toBe(0);
    });

    it('returns combined armor and natural armor in armorValue', () => {
      const armorItem = {
        type: 'armor',
        system: { equipped: true, body: 8 }
      };
      actorBase = createActorBase({
        naturalArmorValue: 2,
        items: [armorItem]
      });

      const defenses = actorBase.getDefenses('Body');

      expect(defenses.armorValue).toBe(10);
      expect(defenses.naturalArmorValue).toBe(2);
    });
  });

  describe('receiveDamage with ignoresNaturalArmour', () => {
    it('reduces effective armor when ignoresNaturalArmour is true', async () => {
      const armorItem = {
        type: 'armor',
        system: { equipped: true, body: 8 }
      };
      actorBase = createActorBase({
        naturalArmorValue: 3,
        items: [armorItem],
        characteristics: { tg: { baseMod: 3, unnaturalMultiplier: 1 } }
      });
      actorBase.wounds = { value: 0, max: 20 };
      actorBase.parent.id = 'actor1';
      actorBase.parent.name = 'Test Actor';

      // Mock FoundryAdapter methods used by receiveDamage
      const { FoundryAdapter } = await import('../../src/module/helpers/foundry-adapter.mjs');
      FoundryAdapter.updateDocument = jest.fn();
      FoundryAdapter.createChatMessage = jest.fn();
      FoundryAdapter.showNotification = jest.fn();

      // With ignoresNaturalArmour: damage 20, pen 0, armor 11 (8+3), natural 3
      // Effective armor = 11 - 3 = 8, TB = 3, wounds = 20 - 8 - 3 = 9
      await actorBase.receiveDamage({
        damage: 20, penetration: 0, location: 'Body',
        ignoresNaturalArmour: true
      });

      expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(
        actorBase.parent,
        { "system.wounds.value": 9 }
      );
    });
  });
});
