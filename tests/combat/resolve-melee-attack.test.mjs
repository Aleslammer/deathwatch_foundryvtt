import { jest } from '@jest/globals';
import { MeleeCombatHelper } from '../../src/module/helpers/combat/melee-combat.mjs';
import { MELEE_MODIFIERS, COMBAT_PENALTIES } from '../../src/module/helpers/constants.mjs';

function makeActor(ws = 50) {
  return {
    type: 'character',
    system: { characteristics: { ws: { value: ws } } }
  };
}

function makeWeapon(overrides = {}) {
  return {
    name: 'Chainsword',
    system: {
      class: 'Melee',
      dmg: '1d10+3',
      dmgType: 'Rending',
      penetration: '2',
      attachedQualities: [],
      ...overrides
    }
  };
}

function baseOptions(overrides = {}) {
  return {
    hitValue: 30,
    aim: 0,
    allOut: 0,
    charge: 0,
    calledShot: 0,
    runningTarget: 0,
    miscModifier: 0,
    ...overrides
  };
}

describe('resolveMeleeAttack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockPack = {
      getDocument: jest.fn(async (id) => ({ _id: id, system: { key: id } }))
    };
    global.game.packs = new Map([['deathwatch.weapon-qualities', mockPack]]);
  });

  it('resolves a basic successful hit', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ hitValue: 30 }));
    expect(result.targetNumber).toBe(50);
    expect(result.success).toBe(true);
    expect(result.hitsTotal).toBe(1);
    expect(result.degreesOfSuccess).toBe(2);
  });

  it('resolves a miss', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ hitValue: 65 }));
    expect(result.success).toBe(false);
    expect(result.hitsTotal).toBe(0);
    expect(result.degreesOfSuccess).toBe(0);
  });

  it('applies aim modifier', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ aim: 10 }));
    expect(result.targetNumber).toBe(60);
  });

  it('applies all out attack modifier', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ allOut: MELEE_MODIFIERS.ALL_OUT_ATTACK }));
    expect(result.targetNumber).toBe(70);
  });

  it('applies charge modifier', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ charge: MELEE_MODIFIERS.CHARGE }));
    expect(result.targetNumber).toBe(60);
  });

  it('applies called shot penalty', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ calledShot: COMBAT_PENALTIES.CALLED_SHOT }));
    expect(result.targetNumber).toBe(30);
  });

  it('applies running target penalty', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ runningTarget: COMBAT_PENALTIES.RUNNING_TARGET }));
    expect(result.targetNumber).toBe(30);
  });

  it('applies misc modifier', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ miscModifier: -15 }));
    expect(result.targetNumber).toBe(35);
  });

  it('applies size modifier', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ sizeModifier: 20, sizeLabel: 'Target Size (Enormous)' }));
    expect(result.targetNumber).toBe(70);
  });

  it('combines all modifiers', async () => {
    const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({
      aim: 10, allOut: 20, charge: 10, calledShot: -20, runningTarget: -20, miscModifier: 5
    }));
    expect(result.targetNumber).toBe(55);
  });

  describe('Defensive quality', () => {
    it('applies -10 penalty for defensive weapon', async () => {
      const weapon = makeWeapon({ attachedQualities: [{ id: 'defensive' }] });
      const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), weapon, baseOptions());
      expect(result.defensivePenalty).toBe(-10);
      expect(result.targetNumber).toBe(40);
    });

    it('no penalty without defensive quality', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions());
      expect(result.defensivePenalty).toBe(0);
      expect(result.targetNumber).toBe(50);
    });
  });

  describe('Degrees of Success', () => {
    it('calculates 0 DoS on exact hit', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ hitValue: 50 }));
      expect(result.success).toBe(true);
      expect(result.degreesOfSuccess).toBe(0);
    });

    it('calculates 4 DoS on roll of 10 vs target 50', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ hitValue: 10 }));
      expect(result.degreesOfSuccess).toBe(4);
    });

    it('returns 0 DoS on miss', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ hitValue: 51 }));
      expect(result.degreesOfSuccess).toBe(0);
    });
  });

  describe('Horde target hit recalculation', () => {
    it('delegates to target calculateHitsReceived on hit', async () => {
      const targetActor = {
        type: 'horde',
        system: { calculateHitsReceived: jest.fn(() => 3) }
      };
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(50), makeWeapon(),
        baseOptions({ hitValue: 20, targetActor })
      );
      expect(targetActor.system.calculateHitsReceived).toHaveBeenCalledWith(
        expect.objectContaining({ isMelee: true, baseHits: 1 })
      );
      expect(result.hitsTotal).toBe(3);
    });

    it('does not recalculate on miss', async () => {
      const targetActor = {
        type: 'horde',
        system: { calculateHitsReceived: jest.fn(() => 3) }
      };
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(50), makeWeapon(),
        baseOptions({ hitValue: 65, targetActor })
      );
      expect(targetActor.system.calculateHitsReceived).not.toHaveBeenCalled();
      expect(result.hitsTotal).toBe(0);
    });

    it('passes power-field flag to horde calculation', async () => {
      const weapon = makeWeapon({ attachedQualities: [{ id: 'power-field' }] });
      const targetActor = {
        type: 'horde',
        system: { calculateHitsReceived: jest.fn(() => 2) }
      };
      await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(50), weapon,
        baseOptions({ hitValue: 20, targetActor })
      );
      expect(targetActor.system.calculateHitsReceived).toHaveBeenCalledWith(
        expect.objectContaining({ hasPowerField: true })
      );
    });
  });

  describe('Modifier parts', () => {
    it('returns modifier parts for chat display', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(makeActor(50), makeWeapon(), baseOptions({ aim: 10, charge: 10 }));
      expect(result.modifierParts).toContain('50 WS');
      expect(result.modifierParts).toContain('+10 Aim');
      expect(result.modifierParts).toContain('+10 Charge');
    });
  });
});
