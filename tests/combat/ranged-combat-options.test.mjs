import { jest } from '@jest/globals';
import { RangedCombatHelper } from '../../src/module/helpers/combat/ranged-combat.mjs';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';
import { RATE_OF_FIRE_MODIFIERS, AIM_MODIFIERS, COMBAT_PENALTIES } from '../../src/module/helpers/constants.mjs';

function makeActor(bs = 40) {
  return {
    type: 'character',
    system: { characteristics: { bs: { value: bs } } },
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
    name: 'Bolter',
    system: {
      class: 'Basic',
      dmg: '1d10+5',
      dmgType: 'Explosive',
      penetration: '4',
      range: '100',
      rof: 'S/3/6',
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
    rofParts: ['S', '3', '6'],
    ...overrides
  };
}

describe('Ranged Combat with Preset Options', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupQualityPack([]);
  });

  describe('Option mapping to resolveRangedAttack', () => {
    it('maps rof: 0 to SINGLE', async () => {
      const autoFire = CombatDialogHelper.mapRofOption(0);
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({ autoFire })
      );
      expect(result.roundsFired).toBe(1);
    });

    it('maps rof: 1 to SEMI_AUTO', async () => {
      const autoFire = CombatDialogHelper.mapRofOption(1);
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({ hitValue: 10, autoFire })
      );
      expect(result.roundsFired).toBe(3);
      expect(result.targetNumber).toBe(50); // 40 BS + 10 Semi-Auto
    });

    it('maps rof: 2 to FULL_AUTO', async () => {
      const autoFire = CombatDialogHelper.mapRofOption(2);
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({ hitValue: 10, autoFire })
      );
      expect(result.roundsFired).toBe(6);
      expect(result.targetNumber).toBe(60); // 40 BS + 20 Full-Auto
    });

    it('maps aim: 1 to HALF aim', async () => {
      const aim = CombatDialogHelper.mapAimOption(1);
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({ aim })
      );
      expect(result.targetNumber).toBe(50); // 40 BS + 10 Half Aim
    });

    it('maps aim: 2 to FULL aim', async () => {
      const aim = CombatDialogHelper.mapAimOption(2);
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({ aim })
      );
      expect(result.targetNumber).toBe(60); // 40 BS + 20 Full Aim
    });

    it('applies calledShot penalty', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({ calledShot: COMBAT_PENALTIES.CALLED_SHOT })
      );
      expect(result.targetNumber).toBe(20); // 40 BS - 20 Called Shot
    });

    it('applies runningTarget penalty', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({ runningTarget: COMBAT_PENALTIES.RUNNING_TARGET })
      );
      expect(result.targetNumber).toBe(20); // 40 BS - 20 Running Target
    });

    it('applies miscModifier', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({ miscModifier: 30 })
      );
      expect(result.targetNumber).toBe(70); // 40 BS + 30 Misc
    });

    it('combines multiple options', async () => {
      const aim = CombatDialogHelper.mapAimOption(2);
      const autoFire = CombatDialogHelper.mapRofOption(1);
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({
          aim,
          autoFire,
          calledShot: COMBAT_PENALTIES.CALLED_SHOT,
          miscModifier: 10
        })
      );
      // 40 BS + 20 Full Aim + 10 Semi-Auto - 20 Called Shot + 10 Misc = 60
      expect(result.targetNumber).toBe(60);
    });
  });

  describe('RoF validation', () => {
    it('rejects Full-Auto on S/3/- weapon', () => {
      const weapon = makeWeapon({ rof: 'S/3/-' });
      const result = CombatDialogHelper.validateRofOption(2, weapon, makeActor());
      expect(result.valid).toBe(false);
    });

    it('accepts Single on any weapon', () => {
      const weapon = makeWeapon({ rof: 'S/-/-' });
      const result = CombatDialogHelper.validateRofOption(0, weapon, makeActor());
      expect(result.valid).toBe(true);
    });
  });

  describe('Modifier parts with preset options', () => {
    it('includes all preset modifiers in breakdown', async () => {
      const aim = CombatDialogHelper.mapAimOption(1);
      const autoFire = CombatDialogHelper.mapRofOption(1);
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(40), makeWeapon(), baseOptions({
          aim, autoFire, calledShot: COMBAT_PENALTIES.CALLED_SHOT,
          runningTarget: COMBAT_PENALTIES.RUNNING_TARGET, miscModifier: 15
        })
      );
      expect(result.modifierParts).toContain('40 Base BS');
      expect(result.modifierParts.some(p => p.includes('Aim'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('Rate of Fire'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('Called Shot'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('Running Target'))).toBe(true);
      expect(result.modifierParts.some(p => p.includes('Misc'))).toBe(true);
    });
  });

  describe('Semi-Auto hits with preset', () => {
    it('calculates correct hits on semi-auto preset', async () => {
      const autoFire = CombatDialogHelper.mapRofOption(1);
      // BS 60, hitValue 10 → target 70, DoS = 6, semi = 1 + 3 = 4, capped at 3
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(60), makeWeapon({ rof: 'S/3/-' }), baseOptions({
          hitValue: 10, autoFire, rofParts: ['S', '3', '-']
        })
      );
      expect(result.roundsFired).toBe(3);
      expect(result.hitsTotal).toBe(3);
    });
  });

  describe('Full-Auto hits with preset', () => {
    it('calculates correct hits on full-auto preset', async () => {
      const autoFire = CombatDialogHelper.mapRofOption(2);
      // BS 60, hitValue 10 → target 80, DoS = 7, full = 1 + 7 = 8, capped at 6
      const result = await RangedCombatHelper.resolveRangedAttack(
        makeActor(60), makeWeapon({ rof: 'S/3/6' }), baseOptions({
          hitValue: 10, autoFire, rofParts: ['S', '3', '6']
        })
      );
      expect(result.roundsFired).toBe(6);
      expect(result.hitsTotal).toBe(6);
    });
  });
});
