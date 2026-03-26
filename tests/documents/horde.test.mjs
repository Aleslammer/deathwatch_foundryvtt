import { jest } from '@jest/globals';
import DeathwatchHorde from '../../src/module/data/actor/horde.mjs';
import { CombatHelper } from '../../src/module/helpers/combat.mjs';
import { FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';

describe('DeathwatchHorde', () => {

  describe('defineSchema', () => {
    it('includes gearArmor field defaulting to 0', () => {
      const schema = DeathwatchHorde.defineSchema();
      expect(schema.gearArmor).toBeDefined();
      expect(schema.gearArmor.options.initial).toBe(0);
    });

    it('inherits wounds from base (used as magnitude)', () => {
      const schema = DeathwatchHorde.defineSchema();
      expect(schema.wounds).toBeDefined();
      expect(schema.wounds.fields.value).toBeDefined();
      expect(schema.wounds.fields.base).toBeDefined();
      expect(schema.wounds.fields.max).toBeDefined();
    });

    it('inherits all enemy fields', () => {
      const schema = DeathwatchHorde.defineSchema();
      expect(schema.characteristics).toBeDefined();
      expect(schema.skills).toBeDefined();
      expect(schema.modifiers).toBeDefined();
      expect(schema.conditions).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.psyRating).toBeDefined();
      expect(schema.fatigue).toBeDefined();
    });

    it('does not include character-only fields', () => {
      const schema = DeathwatchHorde.defineSchema();
      expect(schema.chapterId).toBeUndefined();
      expect(schema.specialtyId).toBeUndefined();
      expect(schema.rank).toBeUndefined();
      expect(schema.xp).toBeUndefined();
    });
  });

  describe('prepareDerivedData', () => {
    it('applies modifiers and computes movement like enemy', () => {
      const horde = new DeathwatchHorde();
      horde.characteristics = {
        ws: { base: 30, value: 30 },
        bs: { base: 25, value: 25 },
        str: { base: 30, value: 30 },
        tg: { base: 30, value: 30 },
        ag: { base: 30, value: 30 },
        int: { base: 20, value: 20 },
        per: { base: 25, value: 25 },
        wil: { base: 20, value: 20 },
        fs: { base: 10, value: 10 }
      };
      horde.modifiers = [];
      horde.skills = {};
      horde.wounds = { value: 0, base: 30, max: 30 };
      horde.fatigue = { value: 0, max: 0 };
      horde.psyRating = { value: 0, base: 0 };
      horde.gearArmor = 3;
      horde.parent = { items: [], effects: undefined, system: horde };

      horde.prepareDerivedData();

      expect(horde.characteristics.ws.mod).toBe(3);
      expect(horde.movement.half).toBe(3);
      expect(horde.movement.full).toBe(6);
    });
  });
});

describe('CombatHelper.getArmorValue with horde', () => {
  it('delegates to actor.system.getArmorValue', () => {
    const hordeActor = {
      system: {
        getArmorValue: jest.fn(() => 4)
      }
    };

    expect(CombatHelper.getArmorValue(hordeActor, 'Head')).toBe(4);
    expect(CombatHelper.getArmorValue(hordeActor, 'Body')).toBe(4);
  });
});

describe('DeathwatchHorde combat methods', () => {
  let horde;

  beforeEach(() => {
    horde = new DeathwatchHorde();
    horde.gearArmor = 4;
    horde.characteristics = {
      ws: { base: 30, value: 30 },
      bs: { base: 25, value: 25 },
      str: { base: 30, value: 30 },
      tg: { base: 30, value: 30, baseMod: 3, unnaturalMultiplier: 1 },
      ag: { base: 30, value: 30 },
      int: { base: 20, value: 20 },
      per: { base: 25, value: 25 },
      wil: { base: 20, value: 20 },
      fs: { base: 10, value: 10 }
    };
  });

  it('getArmorValue returns flat armor for any location', () => {
    expect(horde.getArmorValue('Head')).toBe(4);
    expect(horde.getArmorValue('Body')).toBe(4);
    expect(horde.getArmorValue('Left Arm')).toBe(4);
  });

  it('getArmorValue returns 0 when armor is 0', () => {
    horde.gearArmor = 0;
    expect(horde.getArmorValue('Body')).toBe(0);
  });

  it('getDefenses returns flat armor and TB', () => {
    const defenses = horde.getDefenses('Body');
    expect(defenses.armorValue).toBe(4);
    expect(defenses.toughnessBonus).toBe(3);
    expect(defenses.unnaturalToughnessMultiplier).toBe(1);
  });

  it('calculateHitsReceived uses horde blast rules', () => {
    expect(horde.calculateHitsReceived({ blastValue: 3 })).toBe(3);
  });

  it('calculateHitsReceived uses horde melee rules', () => {
    expect(horde.calculateHitsReceived({ isMelee: true, degreesOfSuccess: 4 })).toBe(2);
  });

  it('calculateHitsReceived passes through for normal ranged', () => {
    expect(horde.calculateHitsReceived({ baseHits: 2 })).toBe(2);
  });

  it('canRighteousFury returns false', () => {
    expect(horde.canRighteousFury()).toBe(false);
  });
});

describe('CombatHelper.applyDamage with horde', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FoundryAdapter.updateDocument = jest.fn();
    FoundryAdapter.createChatMessage = jest.fn();
    FoundryAdapter.showNotification = jest.fn();
  });

  it('delegates to receiveDamage on horde DataModel', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 3;
    horde.wounds = { value: 5, max: 30 };
    horde.characteristics = { tg: { baseMod: 3, unnaturalMultiplier: 1 } };
    const hordeActor = {
      name: 'Heretic Horde',
      system: horde
    };
    horde.parent = hordeActor;

    await CombatHelper.applyDamage(hordeActor, {
      damage: 15, penetration: 2, location: 'Body', damageType: 'Impact'
    });

    expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(hordeActor, { "system.wounds.value": 6 });
  });

  it('applies magnitudeBonusDamage for extra magnitude loss per hit', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 3;
    horde.wounds = { value: 5, max: 30 };
    horde.characteristics = { tg: { baseMod: 3, unnaturalMultiplier: 1 } };
    const hordeActor = {
      name: 'Heretic Horde',
      system: horde
    };
    horde.parent = hordeActor;

    await CombatHelper.applyDamage(hordeActor, {
      damage: 15, penetration: 2, location: 'Body', damageType: 'Impact',
      magnitudeBonusDamage: 1
    });

    expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(hordeActor, { "system.wounds.value": 7 });
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(expect.stringContaining('bonus Magnitude'));
  });

  it('does not apply magnitudeBonusDamage when armor absorbs all damage', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 8;
    horde.wounds = { value: 5, max: 30 };
    horde.characteristics = { tg: { baseMod: 4, unnaturalMultiplier: 1 } };
    const hordeActor = {
      name: 'Armored Horde',
      system: horde
    };
    horde.parent = hordeActor;

    await CombatHelper.applyDamage(hordeActor, {
      damage: 10, penetration: 0, location: 'Body', damageType: 'Impact',
      magnitudeBonusDamage: 1
    });

    expect(FoundryAdapter.updateDocument).not.toHaveBeenCalled();
  });

  it('does not reduce magnitude when armor absorbs all damage', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 8;
    horde.wounds = { value: 5, max: 30 };
    horde.characteristics = { tg: { baseMod: 4, unnaturalMultiplier: 1 } };
    const hordeActor = {
      name: 'Armored Horde',
      system: horde
    };
    horde.parent = hordeActor;

    await CombatHelper.applyDamage(hordeActor, {
      damage: 10, penetration: 0, location: 'Body', damageType: 'Impact'
    });

    expect(FoundryAdapter.updateDocument).not.toHaveBeenCalled();
  });

  it('shows destroyed message when magnitude reaches max', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 0;
    horde.wounds = { value: 29, max: 30 };
    horde.characteristics = { tg: { baseMod: 2, unnaturalMultiplier: 1 } };
    const hordeActor = {
      name: 'Dying Horde',
      system: horde
    };
    horde.parent = hordeActor;

    await CombatHelper.applyDamage(hordeActor, {
      damage: 10, penetration: 0, location: 'Body', damageType: 'Impact'
    });

    expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(hordeActor, { "system.wounds.value": 30 });
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(expect.stringContaining('HORDE DESTROYED'));
  });

  it('batch applies multiple hits with single update', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 3;
    horde.wounds = { value: 0, max: 30 };
    horde.characteristics = { tg: { baseMod: 3, unnaturalMultiplier: 1 } };
    const hordeActor = { name: 'Test Horde', system: horde };
    horde.parent = hordeActor;

    await horde.receiveBatchDamage([
      { damage: 15, penetration: 2 },
      { damage: 12, penetration: 2 },
      { damage: 5, penetration: 0 }  // absorbed (5 <= 3 + 3)
    ]);

    // 2 penetrating hits, 1 absorbed = magnitude +2
    expect(FoundryAdapter.updateDocument).toHaveBeenCalledTimes(1);
    expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(hordeActor, { "system.wounds.value": 2 });
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledTimes(1);
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(expect.stringContaining('3</strong> hits'));
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(expect.stringContaining('2 Magnitude'));
  });

  it('batch shows hit table for multiple hits', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 3;
    horde.wounds = { value: 0, max: 30 };
    horde.characteristics = { tg: { baseMod: 3, unnaturalMultiplier: 1 } };
    const hordeActor = { name: 'Test Horde', system: horde };
    horde.parent = hordeActor;

    await horde.receiveBatchDamage([
      { damage: 15, penetration: 2 },
      { damage: 5, penetration: 0 }  // absorbed
    ]);

    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(expect.stringContaining('<details'));
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(expect.stringContaining('Absorbed'));
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(expect.stringContaining('1 penetrating, 1 absorbed'));
  });

  it('batch all absorbed posts single message with no update', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 8;
    horde.wounds = { value: 0, max: 30 };
    horde.characteristics = { tg: { baseMod: 4, unnaturalMultiplier: 1 } };
    const hordeActor = { name: 'Armored Horde', system: horde };
    horde.parent = hordeActor;

    await horde.receiveBatchDamage([
      { damage: 5, penetration: 0 },
      { damage: 3, penetration: 0 }
    ]);

    expect(FoundryAdapter.updateDocument).not.toHaveBeenCalled();
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledTimes(1);
    expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(expect.stringContaining('absorb all damage'));
  });

  it('batch includes magnitudeBonusDamage per penetrating hit', async () => {
    const horde = new DeathwatchHorde();
    horde.gearArmor = 3;
    horde.wounds = { value: 0, max: 30 };
    horde.characteristics = { tg: { baseMod: 3, unnaturalMultiplier: 1 } };
    const hordeActor = { name: 'Test Horde', system: horde };
    horde.parent = hordeActor;

    await horde.receiveBatchDamage([
      { damage: 15, penetration: 2, magnitudeBonusDamage: 1 },
      { damage: 15, penetration: 2, magnitudeBonusDamage: 1 },
      { damage: 5, penetration: 0, magnitudeBonusDamage: 1 }  // absorbed, no bonus
    ]);

    // 2 penetrating × (1 + 1 bonus) = 4 magnitude
    expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(hordeActor, { "system.wounds.value": 4 });
  });

  it('still uses wound-based damage for non-horde actors', async () => {
    const normalActor = {
      name: 'Normal Enemy',
      id: 'enemy1',
      system: {
        receiveDamage: jest.fn()
      }
    };

    await CombatHelper.applyDamage(normalActor, {
      damage: 15, penetration: 2, location: 'Body', damageType: 'Impact'
    });

    expect(normalActor.system.receiveDamage).toHaveBeenCalled();
  });
});
