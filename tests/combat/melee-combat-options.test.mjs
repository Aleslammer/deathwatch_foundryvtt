import { jest } from '@jest/globals';
import { MeleeCombatHelper } from '../../src/module/helpers/combat/melee-combat.mjs';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';
import { MELEE_MODIFIERS, COMBAT_PENALTIES, AIM_MODIFIERS } from '../../src/module/helpers/constants.mjs';

function makeActor(ws = 40) {
  return {
    type: 'character',
    system: { characteristics: { ws: { value: ws } } },
    items: { get: jest.fn(() => null) }
  };
}

function setupQualityPack(qualityKeys = []) {
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

describe('Melee Combat with Preset Options', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupQualityPack([]);
  });

  describe('Option mapping to resolveMeleeAttack', () => {
    it('resolves with base WS when no modifiers', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        { hitValue: 30, aim: 0, allOut: 0, charge: 0, calledShot: 0, runningTarget: 0, miscModifier: 0 }
      );
      expect(result.targetNumber).toBe(40);
      expect(result.success).toBe(true);
    });

    it('applies All Out Attack from preset', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        { hitValue: 30, aim: 0, allOut: MELEE_MODIFIERS.ALL_OUT_ATTACK, charge: 0, calledShot: 0, runningTarget: 0, miscModifier: 0 }
      );
      expect(result.targetNumber).toBe(60); // 40 WS + 20 All Out
    });

    it('applies Charge from preset', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        { hitValue: 30, aim: 0, allOut: 0, charge: MELEE_MODIFIERS.CHARGE, calledShot: 0, runningTarget: 0, miscModifier: 0 }
      );
      expect(result.targetNumber).toBe(50); // 40 WS + 10 Charge
    });

    it('applies aim from preset', async () => {
      const aim = CombatDialogHelper.mapAimOption(2);
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        { hitValue: 30, aim, allOut: 0, charge: 0, calledShot: 0, runningTarget: 0, miscModifier: 0 }
      );
      expect(result.targetNumber).toBe(60); // 40 WS + 20 Full Aim
    });

    it('applies Called Shot from preset', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        { hitValue: 30, aim: 0, allOut: 0, charge: 0, calledShot: COMBAT_PENALTIES.CALLED_SHOT, runningTarget: 0, miscModifier: 0 }
      );
      expect(result.targetNumber).toBe(20); // 40 WS - 20 Called Shot
    });

    it('applies Running Target from preset', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        { hitValue: 30, aim: 0, allOut: 0, charge: 0, calledShot: 0, runningTarget: COMBAT_PENALTIES.RUNNING_TARGET, miscModifier: 0 }
      );
      expect(result.targetNumber).toBe(20); // 40 WS - 20 Running Target
    });

    it('applies miscModifier from preset', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        { hitValue: 30, aim: 0, allOut: 0, charge: 0, calledShot: 0, runningTarget: 0, miscModifier: 15 }
      );
      expect(result.targetNumber).toBe(55); // 40 WS + 15 Misc
    });

    it('combines Charge + Called Shot + misc', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        {
          hitValue: 30, aim: 0, allOut: 0,
          charge: MELEE_MODIFIERS.CHARGE,
          calledShot: COMBAT_PENALTIES.CALLED_SHOT,
          runningTarget: 0, miscModifier: 5
        }
      );
      // 40 WS + 10 Charge - 20 Called Shot + 5 Misc = 35
      expect(result.targetNumber).toBe(35);
    });
  });

  describe('Modifier parts with preset options', () => {
    it('includes all preset modifiers in breakdown', async () => {
      const aim = CombatDialogHelper.mapAimOption(1);
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        {
          hitValue: 30, aim,
          allOut: MELEE_MODIFIERS.ALL_OUT_ATTACK,
          charge: MELEE_MODIFIERS.CHARGE,
          calledShot: COMBAT_PENALTIES.CALLED_SHOT,
          runningTarget: COMBAT_PENALTIES.RUNNING_TARGET,
          miscModifier: 10
        }
      );
      expect(result.modifierParts).toContain('40 WS');
      expect(result.modifierParts.some(p => p.includes('Aim'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('All Out Attack'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('Charge'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('Called Shot'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('Running Target'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('Misc'))).toBe(true);
    });
  });

  describe('Degrees of Success with preset', () => {
    it('calculates DoS correctly with charge preset', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        {
          hitValue: 10, aim: 0, allOut: 0,
          charge: MELEE_MODIFIERS.CHARGE,
          calledShot: 0, runningTarget: 0, miscModifier: 0
        }
      );
      // Target 50, roll 10 → DoS = floor((50-10)/10) = 4
      expect(result.targetNumber).toBe(50);
      expect(result.success).toBe(true);
      expect(result.degreesOfSuccess).toBe(4);
      expect(result.hitsTotal).toBe(1);
    });

    it('returns 0 DoS on miss', async () => {
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(30), makeWeapon(),
        { hitValue: 50, aim: 0, allOut: 0, charge: 0, calledShot: 0, runningTarget: 0, miscModifier: 0 }
      );
      expect(result.success).toBe(false);
      expect(result.degreesOfSuccess).toBe(0);
      expect(result.hitsTotal).toBe(0);
    });
  });

  describe('Horde target with preset', () => {
    it('delegates to calculateHitsReceived for horde targets', async () => {
      const targetActor = {
        type: 'horde',
        system: { calculateHitsReceived: jest.fn(() => 3) }
      };
      const result = await MeleeCombatHelper.resolveMeleeAttack(
        makeActor(40), makeWeapon(),
        {
          hitValue: 10, aim: 0, allOut: 0,
          charge: MELEE_MODIFIERS.CHARGE,
          calledShot: 0, runningTarget: 0, miscModifier: 0,
          targetActor
        }
      );
      expect(targetActor.system.calculateHitsReceived).toHaveBeenCalled();
      expect(result.hitsTotal).toBe(3);
    });
  });
});
