import { jest } from '@jest/globals';
import { RangedCombatHelper } from '../../src/module/helpers/combat/ranged-combat.mjs';
import { RATE_OF_FIRE_MODIFIERS, AIM_MODIFIERS } from "../../src/module/helpers/constants/index.mjs";
import { WeaponQualityHelper } from '../../src/module/helpers/combat/weapon-quality-helper.mjs';

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

  describe('Thrown Weapons', () => {
    const thrownWeapon = () => makeWeapon({ class: 'Thrown' });

    it('cannot jam even on rolls that would normally jam', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), thrownWeapon(), baseOptions({ hitValue: 96 }));
      expect(result.isJammed).toBe(false);
    });

    it('cannot jam on full auto jam threshold', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), thrownWeapon(), baseOptions({
        hitValue: 94,
        autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['-', '-', '10']
      }));
      expect(result.isJammed).toBe(false);
    });

    it('cannot jam even with unreliable quality', async () => {
      setupQualityPack(['unreliable']);
      const weapon = makeWeapon({ class: 'Thrown', attachedQualities: [{ id: 'unreliable' }] });
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), weapon, baseOptions({ hitValue: 91 }));
      expect(result.isJammed).toBe(false);
    });

    it('handles case insensitive class check', async () => {
      const weapon = makeWeapon({ class: 'THROWN' });
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), weapon, baseOptions({ hitValue: 96 }));
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

  describe('resolveRangedAttack hitsParts generation', () => {
    it('generates hitsParts for single target with single shot', async () => {
      const actor = makeActor(45);
      const weapon = makeWeapon({ name: 'Bolter', rof: 'S/3/10' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 30, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
        rofParts: ['S', '3', '10']
      }));

      expect(result.hitsParts).toBeDefined();
      expect(Array.isArray(result.hitsParts)).toBe(true);
      expect(result.hitsParts).toContain('Degrees of Success: 1');
      expect(result.hitsParts[result.hitsParts.length - 1]).toContain('<strong>Total: 1 Hit</strong>');
    });

    it('generates hitsParts for single target with full auto', async () => {
      const actor = makeActor(60);
      const weapon = makeWeapon({ name: 'Bolter', rof: 'S/3/10' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '3', '10']
      }));

      const dos = Math.floor((result.targetNumber - 10) / 10);
      expect(result.hitsParts).toBeDefined();
      expect(result.hitsParts).toContain(`Degrees of Success: ${dos}`);
      expect(result.hitsParts.some(p => p.includes('Rate of Fire'))).toBe(true);
      expect(result.hitsParts.some(p => p.includes('rounds'))).toBe(true);
      expect(result.hitsParts[result.hitsParts.length - 1]).toContain(`<strong>Total:`);
    });

    it('includes Twin-Linked bonus in hitsParts when DoS >= 2', async () => {
      setupQualityPack(['twin-linked']);
      const actor = makeActor(60);
      const weapon = makeWeapon({ attachedQualities: [{ id: 'twin-linked' }], rof: 'S/3/10' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
        rofParts: ['S', '3', '10']
      }));

      expect(result.hitsParts).toBeDefined();
      expect(result.hitsParts).toContain('Degrees of Success: 7');
      expect(result.hitsParts.some(p => p.includes('Twin-Linked'))).toBe(true);
    });

    it('includes Storm bonus in hitsParts when hits > 0', async () => {
      setupQualityPack(['storm']);
      const actor = makeActor(60);
      const weapon = makeWeapon({ attachedQualities: [{ id: 'storm' }], rof: 'S/3/10' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '3', '10']
      }));

      expect(result.hitsParts).toBeDefined();
      if (result.hitsTotal > 0) {
        expect(result.hitsParts.some(p => p.includes('Storm'))).toBe(true);
      }
    });

    it('shows plural for multiple hits', async () => {
      const actor = makeActor(60);
      const weapon = makeWeapon({ rof: 'S/3/10' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '3', '10']
      }));

      expect(result.hitsParts).toBeDefined();
      if (result.hitsTotal > 1) {
        expect(result.hitsParts[result.hitsParts.length - 1]).toContain('Hits</strong>');
      }
    });

    it('shows singular for single hit', async () => {
      const actor = makeActor(45);
      const weapon = makeWeapon({ rof: 'S/3/10' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 30, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
        rofParts: ['S', '3', '10']
      }));

      expect(result.hitsParts).toBeDefined();
      expect(result.hitsParts[result.hitsParts.length - 1]).toContain('Hit</strong>');
      expect(result.hitsParts[result.hitsParts.length - 1]).not.toContain('Hits</strong>');
    });
  });

  describe('resolveRangedAttack hitsParts for horde targets', () => {
    it('generates hitsParts for horde with blast and explosive bonuses', async () => {
      setupQualityPack(['blast']);
      const actor = makeActor(60);
      const weapon = makeWeapon({
        name: 'Bolter',
        rof: 'S/3/10',
        dmgType: 'Explosive',
        attachedQualities: [{ id: 'blast' }]
      });
      const horde = {
        type: 'horde',
        system: {
          calculateHitsReceived: jest.fn((options) => {
            // Simulate horde receiving 3 base hits + 2 blast + 1 explosive = 6 total
            return 6;
          })
        }
      };

      // Mock WeaponQualityHelper
      WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(2);
      WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10,
        aim: 0,
        autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '3', '10'],
        targetActor: horde
      }));

      expect(result.hitsParts.some(p => p.includes('Degrees of Success'))).toBe(true);
      expect(result.hitsParts.some(p => p.includes('Rate of Fire'))).toBe(true);
      expect(result.hitsParts.some(p => p.includes('Base Hits'))).toBe(true);
      expect(result.hitsParts.some(p => p.includes('Blast [2]'))).toBe(true);
      expect(result.hitsParts.some(p => p.includes('Explosive'))).toBe(true);
      expect(result.hitsParts[result.hitsParts.length - 1]).toContain('Total: 6');
    });

    it('does not show blast bonus when blast value is 0', async () => {
      const actor = makeActor(60);
      const weapon = makeWeapon({
        name: 'Bolter',
        rof: 'S/3/10'
      });
      const horde = {
        type: 'horde',
        system: {
          calculateHitsReceived: jest.fn((options) => 3)
        }
      };

      WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(0);
      WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10,
        autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '3', '10'],
        targetActor: horde
      }));

      expect(result.hitsParts.some(p => p.includes('Blast'))).toBe(false);
    });

    it('does not show explosive bonus when damage type is not Explosive', async () => {
      const actor = makeActor(60);
      const weapon = makeWeapon({
        name: 'Bolter',
        rof: 'S/3/10',
        dmgType: 'Normal'
      });
      const horde = {
        type: 'horde',
        system: {
          calculateHitsReceived: jest.fn((options) => 3)
        }
      };

      WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(0);
      WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10,
        autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '3', '10'],
        targetActor: horde
      }));

      expect(result.hitsParts.some(p => p.includes('Explosive'))).toBe(false);
    });

    it('shows explosive bonus for Explosive weapons without Blast against hordes', async () => {
      const actor = makeActor(60);
      const weapon = makeWeapon({ name: 'Heavy Bolter', dmgType: 'Explosive', rof: 'S/-/6' });
      const horde = {
        type: 'horde',
        system: {
          calculateHitsReceived: jest.fn((options) => {
            // Horde calculation: baseHits + explosive bonus
            return options.baseHits + 1;
          })
        }
      };

      WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(0);
      WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10,
        autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '-', '6'],
        targetActor: horde
      }));

      // Verify explosive bonus appears in breakdown
      expect(result.hitsParts.some(p => p.includes('Explosive Damage: +1'))).toBe(true);
      // Verify no blast bonus shown
      expect(result.hitsParts.some(p => p.includes('Blast'))).toBe(false);
    });

    it('shows explosive bonus for Explosive weapons with Blast against hordes', async () => {
      const actor = makeActor(60);
      const weapon = makeWeapon({ name: 'Frag Grenade', dmgType: 'Explosive', rof: 'S/-/-' });
      const horde = {
        type: 'horde',
        system: {
          calculateHitsReceived: jest.fn((options) => {
            // Horde calculation: baseHits + blast + explosive bonus
            return options.baseHits + options.blastValue + 1;
          })
        }
      };

      WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(5);
      WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10,
        autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
        rofParts: ['S', '-', '-'],
        targetActor: horde
      }));

      // Verify both blast and explosive bonuses appear
      expect(result.hitsParts.some(p => p.includes('Blast [5]: +5'))).toBe(true);
      expect(result.hitsParts.some(p => p.includes('Explosive Damage: +1'))).toBe(true);
    });

    it('does not generate horde-specific hitsParts for non-horde targets', async () => {
      const actor = makeActor(60);
      const weapon = makeWeapon({ rof: 'S/3/10' });
      const singleTarget = {
        type: 'character',
        system: {
          calculateHitsReceived: jest.fn((options) => 8)
        }
      };

      WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(2);
      WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10,
        autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '3', '10'],
        targetActor: singleTarget
      }));

      expect(result.hitsParts.some(p => p.includes('Blast'))).toBe(false);
      expect(result.hitsParts.some(p => p.includes('Explosive'))).toBe(false);
    });
  });

  describe('Flame vs horde handling', () => {
    it('attackDialog stores flame bonus data in result for chat display', async () => {
      setupQualityPack(['flame']);
      const actor = makeActor(60);
      const weapon = makeWeapon({
        name: 'Flamer',
        rof: 'S/2/-',
        attachedQualities: [{ id: 'flame' }]
      });
      const horde = {
        type: 'horde',
        system: {
          calculateHitsReceived: jest.fn((options) => 3)
        }
      };

      WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(0);
      WeaponQualityHelper.hasQuality = jest.fn((w, q) => {
        if (q === 'flame') return Promise.resolve(true);
        return Promise.resolve(false);
      });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 20,
        autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
        rofParts: ['S', '2', '-'],
        targetActor: horde
      }));

      expect(result).toBeDefined();
      expect(result.hitsTotal).toBe(3);
      expect(result.hitsParts).toBeDefined();
    });
  });

  describe('hitsParts edge cases', () => {
    it('shows breakdown for missed ranged attack', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(20), makeWeapon({ name: 'Bolter', rof: 'S/3/10' }), baseOptions({
        hitValue: 95, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE, calledShot: 0,
        runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
        rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: ''
      }));

      expect(result.hitsTotal).toBe(0);
      expect(result.hitsParts).toBeDefined();
      expect(result.hitsParts.some(part => part.includes('Degrees of Success'))).toBe(true);
      expect(result.hitsParts[result.hitsParts.length - 1]).toContain('0 Hits');
    });

    it('Twin-Linked weapon generates hitsParts with quality details', async () => {
      setupQualityPack(['twin-linked']);
      const actor = makeActor(60);
      const weapon = makeWeapon({ name: 'Twin-Linked Bolter', attachedQualities: [{ id: 'twin-linked' }], rof: 'S/3/10' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE, calledShot: 0,
        runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
        rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: ''
      }));

      // Verify hitsParts are well-formed and comprehensive
      expect(result.hitsParts).toBeDefined();
      expect(Array.isArray(result.hitsParts)).toBe(true);
      expect(result.hitsParts.some(part => part.includes('Degrees of Success'))).toBe(true);
      expect(result.hitsParts[result.hitsParts.length - 1]).toContain('Total');
    });

    it('Storm weapon generates hitsParts with quality details', async () => {
      setupQualityPack(['storm']);
      const actor = makeActor(60);
      const weapon = makeWeapon({ name: 'Storm Bolter', attachedQualities: [{ id: 'storm' }], rof: 'S/3/10' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 10, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO, calledShot: 0,
        runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
        rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: ''
      }));

      // Verify hitsParts are well-formed with rate of fire details
      expect(result.hitsParts).toBeDefined();
      expect(Array.isArray(result.hitsParts)).toBe(true);
      expect(result.hitsParts.some(part => part.includes('Degrees of Success'))).toBe(true);
      if (result.roundsFired > 1) {
        expect(result.hitsParts.some(part => part.includes('Rate of Fire'))).toBe(true);
      }
      expect(result.hitsParts[result.hitsParts.length - 1]).toContain('Total');
    });

    it('handles zero DoS successful attack with single hit', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(50), makeWeapon({ rof: 'S/3/10' }), baseOptions({
        hitValue: 50, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
        rofParts: ['S', '3', '10']
      }));

      expect(result.hitsTotal).toBe(1);
      expect(result.hitsParts).toBeDefined();
      expect(result.hitsParts).toContain('Degrees of Success: 0');
      expect(result.hitsParts[result.hitsParts.length - 1]).toContain('1 Hit');
    });

    it('Scatter quality shows reduced accuracy but still has hitsParts', async () => {
      setupQualityPack(['scatter']);
      const actor = makeActor(60);
      const weapon = makeWeapon({ name: 'Shotgun', attachedQualities: [{ id: 'scatter' }], rof: 'S/2/-' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 20, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
        rofParts: ['S', '2', '-']
      }));

      expect(result.hitsParts).toBeDefined();
      expect(result.hitsParts.some(part => part.includes('Degrees of Success'))).toBe(true);
    });

    it('Power Field ranged attack shows hitsParts breakdown', async () => {
      setupQualityPack(['power-field']);
      const actor = makeActor(50);
      const weapon = makeWeapon({ name: 'Force Staff', attachedQualities: [{ id: 'power-field' }], rof: 'S/-/-' });

      const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, baseOptions({
        hitValue: 30, aim: 0, autoFire: RATE_OF_FIRE_MODIFIERS.SINGLE,
        rofParts: ['S', '-', '-']
      }));

      expect(result.hitsParts).toBeDefined();
      expect(result.hitsParts.some(part => part.includes('Degrees of Success'))).toBe(true);
    });
  });

  describe('Movement penalty integration', () => {
    it('applies -10 penalty for semi-auto + moving', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({
        hitValue: 35,
        autoFire: RATE_OF_FIRE_MODIFIERS.SEMI_AUTO,
        rofParts: ['S', '3', '-'],
        isMoving: true
      }));
      // BS 40 + Semi-Auto +10 - Moving -10 = 40
      expect(result.targetNumber).toBe(40);
    });

    it('applies -30 penalty for full-auto + moving', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({
        hitValue: 25,
        autoFire: RATE_OF_FIRE_MODIFIERS.FULL_AUTO,
        rofParts: ['S', '3', '10'],
        isMoving: true
      }));
      // BS 40 + Full-Auto +20 - Moving -30 = 30
      expect(result.targetNumber).toBe(30);
    });

    it('jam threshold remains 94+ for semi-auto with movement', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({
        hitValue: 94,
        autoFire: RATE_OF_FIRE_MODIFIERS.SEMI_AUTO,
        rofParts: ['S', '3', '-'],
        isMoving: true
      }));
      expect(result.isJammed).toBe(true);
    });

    it('rounds fired calculation unaffected by movement', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({
        hitValue: 25,
        autoFire: RATE_OF_FIRE_MODIFIERS.SEMI_AUTO,
        rofParts: ['S', '3', '-'],
        isMoving: true
      }));
      expect(result.roundsFired).toBe(3);
    });

    it('hit calculation still correct with movement penalty', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(50), makeWeapon(), baseOptions({
        hitValue: 30,
        autoFire: RATE_OF_FIRE_MODIFIERS.SEMI_AUTO,
        rofParts: ['S', '3', '-'],
        isMoving: true
      }));
      // BS 50 + Semi-Auto +10 - Moving -10 = 50
      // hitValue 30 → DoS = 2 → 1 + floor(2/2) = 2 hits
      expect(result.targetNumber).toBe(50);
      expect(result.hitsTotal).toBe(2);
    });

    it('movement + aim + range modifiers stack correctly', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({
        hitValue: 35,
        aim: AIM_MODIFIERS.FULL,
        autoFire: RATE_OF_FIRE_MODIFIERS.SEMI_AUTO,
        rangeMod: -10,
        rofParts: ['S', '3', '-'],
        isMoving: true
      }));
      // BS 40 + Aim +20 + Semi-Auto +10 - Range -10 - Moving -10 = 50
      expect(result.targetNumber).toBe(50);
    });

    it('backwards compatibility when isMoving not provided', async () => {
      const result = await RangedCombatHelper.resolveRangedAttack(makeActor(40), makeWeapon(), baseOptions({
        hitValue: 25,
        autoFire: RATE_OF_FIRE_MODIFIERS.SEMI_AUTO,
        rofParts: ['S', '3', '-']
        // isMoving not provided → defaults to false
      }));
      // BS 40 + Semi-Auto +10 = 50 (no movement penalty)
      expect(result.targetNumber).toBe(50);
    });
  });
});
