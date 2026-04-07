import { jest } from '@jest/globals';
import { RangedCombatHelper } from '../../src/module/helpers/combat/ranged-combat.mjs';
import { RATE_OF_FIRE_MODIFIERS, AIM_MODIFIERS } from "../../src/module/helpers/constants/index.mjs";

function makeActor(bs = 40) {
  return {
    type: 'character',
    system: { characteristics: { bs: { value: bs } } },
    items: { get: jest.fn(() => null) }
  };
}

function setupQualityPack(qualityKeys) {
  const mockPack = {
    getDocument: jest.fn(async (id) => {
      if (qualityKeys.includes(id)) {
        return { _id: id, system: { key: id } };
      }
      return null;
    })
  };
  global.game.packs = new Map([['deathwatch.weapon-qualities', mockPack]]);
}

function makeWeapon(overrides = {}) {
  return {
    name: 'Bolter',
    system: {
      class: 'Basic',
      dmg: '1d10+5',
      dmgType: 'Explosive',
      penetration: '4',
      range: '100',
      rof: 'S/3/-',
      clip: '28',
      loadedAmmo: null,
      attachedQualities: [],
      attachedUpgrades: [],
      ...overrides
    }
  };
}

function baseOptions(overrides = {}) {
  return {
    hitValue: 30,
    aim: 0,
    autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
    calledShot: 0,
    runningTarget: 0,
    miscModifier: 0,
    rangeMod: 0,
    rangeLabel: 'Normal',
    rofParts: ['S', '3', '-'],
    ...overrides
  };
}

describe('resolveRangedAttack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupQualityPack([]);
  });

  it('resolves a basic successful single shot', async () => {
    const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ hitValue: 25 }));
    expect(result.targetNumber).toBe(40);
    expect(result.hitsTotal).toBe(1);
    expect(result.isJammed).toBe(false);
    expect(result.isOverheated).toBe(false);
    expect(result.hasPrematureDetonation).toBe(false);
    expect(result.roundsFired).toBe(1);
  });

  it('resolves a miss', async () => {
    const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ hitValue: 55 }));
    expect(result.hitsTotal).toBe(0);
  });

  it('applies aim modifier', async () => {
    const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ aim: 10 }));
    expect(result.targetNumber).toBe(50);
  });

  it('applies range modifier', async () => {
    const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ rangeMod: -10 }));
    expect(result.targetNumber).toBe(30);
  });

  it('applies called shot and running target penalties', async () => {
    const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ calledShot: -20, runningTarget: -20 }));
    expect(result.targetNumber).toBe(0);
  });

  it('applies size modifier', async () => {
    const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ sizeModifier: 20 }));
    expect(result.targetNumber).toBe(60);
  });

  it('applies misc modifier', async () => {
    const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ miscModifier: 15 }));
    expect(result.targetNumber).toBe(55);
  });

  describe('Twin-Linked', () => {
    const twinWeapon = () => makeWeapon({ attachedQualities: [{ id: 'twin-linked' }] });

    beforeEach(() => setupQualityPack(['twin-linked']));

    it('adds +1 to maxHits', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), twinWeapon(), baseOptions({ hitValue: 25 }));
      expect(result.maxHits).toBe(2);
      expect(result.isTwinLinked).toBe(true);
    });

    it('doubles ammo expenditure', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), twinWeapon(), baseOptions());
      expect(result.ammoExpended).toBe(2);
    });

    it('adds +20 BS bonus', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), twinWeapon(), baseOptions());
      expect(result.twinLinkedBonus).toBe(20);
      expect(result.targetNumber).toBe(60);
    });
  });

  describe('Storm', () => {
    const stormWeapon = () => makeWeapon({ attachedQualities: [{ id: 'storm' }] });

    beforeEach(() => setupQualityPack(['storm']));

    it('doubles ammo expenditure', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), stormWeapon(), baseOptions());
      expect(result.ammoExpended).toBe(2);
      expect(result.isStorm).toBe(true);
    });
  });

  describe('Storm + Twin-Linked', () => {
    const comboWeapon = () => makeWeapon({ attachedQualities: [{ id: 'storm' }, { id: 'twin-linked' }] });

    beforeEach(() => setupQualityPack(['storm', 'twin-linked']));

    it('quadruples ammo expenditure', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), comboWeapon(), baseOptions());
      expect(result.ammoExpended).toBe(4);
    });

    it('maxHits includes twin-linked bonus', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), comboWeapon(), baseOptions());
      expect(result.maxHits).toBe(2);
    });
  });

  describe('Accurate', () => {
    const accurateWeapon = () => makeWeapon({ attachedQualities: [{ id: 'accurate' }] });

    beforeEach(() => setupQualityPack(['accurate']));

    it('adds accurate bonus when aiming', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), accurateWeapon(), baseOptions({ aim: 10 }));
      expect(result.accurateBonus).toBe(10);
      expect(result.targetNumber).toBe(60);
    });

    it('no accurate bonus without aim', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), accurateWeapon(), baseOptions({ aim: 0 }));
      expect(result.accurateBonus).toBe(0);
    });
  });

  describe('Jamming', () => {
    it('jams on 96+ for single shot', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ hitValue: 96 }));
      expect(result.isJammed).toBe(true);
    });

    it('does not jam on 95 for single shot', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ hitValue: 95 }));
      expect(result.isJammed).toBe(false);
    });

    it('jams on 94+ for semi-auto', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({
        hitValue: 94, autoFire: RATE_OF_FIRE_MODIFIERS.SEMI_AUTO
      }));
      expect(result.isJammed).toBe(true);
    });

    it('does not jam for hordes', async () => {
      const actor = { ...makeActor(40), type: 'horde' };
      const result = await RangedCombatHelper.resolveRangedAttack(actor, makeWeapon(), baseOptions({ hitValue: 100 }));
      expect(result.isJammed).toBe(false);
    });

    it('does not jam with living ammunition', async () => {
      setupQualityPack(['living-ammunition']);
      const weapon = makeWeapon({ attachedQualities: [{ id: 'living-ammunition' }] });
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), weapon, baseOptions({ hitValue: 100 }));
      expect(result.isJammed).toBe(false);
    });

    it('returns hasReliable flag for reliable weapons', async () => {
      setupQualityPack(['reliable']);
      const weapon = makeWeapon({ attachedQualities: [{ id: 'reliable' }] });
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), weapon, baseOptions({ hitValue: 96 }));
      expect(result.isJammed).toBe(true);
      expect(result.hasReliable).toBe(true);
    });
  });

  describe('Unreliable', () => {
    const unreliableWeapon = () => makeWeapon({ attachedQualities: [{ id: 'unreliable' }] });

    beforeEach(() => setupQualityPack(['unreliable']));

    it('jams on 91+ for single shot', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), unreliableWeapon(), baseOptions({ hitValue: 91 }));
      expect(result.isJammed).toBe(true);
    });

    it('does not jam on 90 for single shot', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), unreliableWeapon(), baseOptions({ hitValue: 90 }));
      expect(result.isJammed).toBe(false);
    });
  });

  describe('Overheats', () => {
    const overheatsWeapon = () => makeWeapon({ attachedQualities: [{ id: 'overheats' }] });

    beforeEach(() => setupQualityPack(['overheats']));

    it('overheats on 91+', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), overheatsWeapon(), baseOptions({ hitValue: 91 }));
      expect(result.isOverheated).toBe(true);
    });

    it('does not overheat on 90', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), overheatsWeapon(), baseOptions({ hitValue: 90 }));
      expect(result.isOverheated).toBe(false);
    });
  });

  describe('Premature Detonation', () => {
    it('detects premature detonation from ammo modifier', async () => {
      const weapon = makeWeapon({ loadedAmmo: 'ammo1' });
      const actor = makeActor(40);
      actor.items.get = jest.fn(() => ({
        system: { modifiers: [{ effectType: 'premature-detonation', modifier: '96', enabled: true }] }
      }));
      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({ hitValue: 96 }));
      expect(result.hasPrematureDetonation).toBe(true);
    });
  });

  describe('Gyro-Stabilised', () => {
    const gyroWeapon = () => makeWeapon({ attachedQualities: [{ id: 'gyro-stabilised' }] });

    beforeEach(() => setupQualityPack(['gyro-stabilised']));

    it('caps range penalty at -10', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), gyroWeapon(), baseOptions({ rangeMod: -20 }));
      expect(result.gyroRangeMod).toBe(-10);
      expect(result.targetNumber).toBe(30);
    });

    it('does not affect positive range modifiers', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), gyroWeapon(), baseOptions({ rangeMod: 20 }));
      expect(result.gyroRangeMod).toBe(20);
    });
  });

  describe('Horde target hit recalculation', () => {
    it('delegates to target calculateHitsReceived', async () => {
      const targetActor = {
        type: 'horde',
        system: { calculateHitsReceived: jest.fn(() => 5) }
      };
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(),
        baseOptions({ hitValue: 25, targetActor })
      );
      expect(targetActor.system.calculateHitsReceived).toHaveBeenCalled();
      expect(result.hitsTotal).toBe(5);
    });

    it('does not recalculate on miss', async () => {
      const targetActor = {
        type: 'horde',
        system: { calculateHitsReceived: jest.fn(() => 5) }
      };
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(),
        baseOptions({ hitValue: 55, targetActor })
      );
      expect(targetActor.system.calculateHitsReceived).not.toHaveBeenCalled();
      expect(result.hitsTotal).toBe(0);
    });
  });

  describe('Semi-Auto hits', () => {
    it('calculates multiple hits on semi-auto with high DoS', async () => {
      // BS 60, hitValue 10 → DoS = 5, semi-auto = 1 + floor(5/2) = 3 hits, capped at 3 rounds
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(60), makeWeapon(), baseOptions({
        hitValue: 10,
        autoFire: RATE_OF_FIRE_MODIFIERS.SEMI_AUTO,
        rofParts: ['S', '3', '-']
      }));
      expect(result.roundsFired).toBe(3);
      expect(result.hitsTotal).toBe(3);
    });
  });

  describe('Modifier parts', () => {
    it('returns modifier parts for chat display', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({ aim: 10, rangeMod: -10 }));
      expect(result.modifierParts).toContain('40 Base BS');
      expect(result.modifierParts.some(p => p.includes('Aim'))).toBe(true);
    });
  });
});
