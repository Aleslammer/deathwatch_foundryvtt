import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';
import { RATE_OF_FIRE_MODIFIERS } from '../../src/module/helpers/constants.mjs';

describe('CombatDialogHelper', () => {
  describe('buildAttackModifiers', () => {
    it('calculates total modifiers', () => {
      const result = CombatDialogHelper.buildAttackModifiers({
        bs: 40,
        bsAdv: 5,
        aim: 10,
        autoFire: 10,
        calledShot: -20,
        rangeMod: 10,
        runningTarget: -20,
        miscModifier: 5
      });
      expect(result.modifiers).toBe(0);
      expect(result.targetNumber).toBe(40);
    });

    it('clamps modifiers to -60', () => {
      const result = CombatDialogHelper.buildAttackModifiers({ bs: 40, bsAdv: -100 });
      expect(result.clampedModifiers).toBe(-60);
    });

    it('clamps modifiers to +60', () => {
      const result = CombatDialogHelper.buildAttackModifiers({ bs: 40, bsAdv: 100 });
      expect(result.clampedModifiers).toBe(60);
    });
  });

  describe('buildModifierParts', () => {
    it('includes all non-zero modifiers', () => {
      const parts = CombatDialogHelper.buildModifierParts(40, 5, 10, 10, -20, 10, -20, 5);
      expect(parts).toContain('40 Base BS');
      expect(parts).toContain('+5 BS Advances');
      expect(parts).toContain('+10 Aim');
      expect(parts).toContain('+10 Rate of Fire');
      expect(parts).toContain('-20 Called Shot');
      expect(parts).toContain('+10 Range');
      expect(parts).toContain('-20 Running Target');
      expect(parts).toContain('+5 Misc');
    });

    it('excludes zero modifiers', () => {
      const parts = CombatDialogHelper.buildModifierParts(40, 0, 0, 0, 0, 0, 0, 0);
      expect(parts).toHaveLength(1);
      expect(parts[0]).toBe('40 Base BS');
    });

    it('includes BS upgrade modifiers', () => {
      const upgradeModifiers = [
        { name: 'Red-Dot Laser Sight', modifier: '10', effectType: 'characteristic', valueAffected: 'bs', source: 'Red-Dot Laser Sight' }
      ];
      const parts = CombatDialogHelper.buildModifierParts(40, 0, 0, 0, 0, 0, 0, 0, 0, 0, upgradeModifiers);
      expect(parts).toContain('+10 Red-Dot Laser Sight');
    });

    it('excludes non-BS upgrade modifiers', () => {
      const upgradeModifiers = [
        { name: 'Brain Leech Worms', modifier: '2d10+6', effectType: 'weapon-damage', source: 'Brain Leech Worms' }
      ];
      const parts = CombatDialogHelper.buildModifierParts(40, 0, 0, 0, 0, 0, 0, 0, 0, 0, upgradeModifiers);
      expect(parts).not.toContain('Brain Leech Worms');
      expect(parts).toHaveLength(1);
    });
  });

  describe('calculateHits', () => {
    it('calculates hits for single shot (1 hit only)', () => {
      expect(CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE)).toBe(1);
      expect(CombatDialogHelper.calculateHits(45, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE)).toBe(1);
      expect(CombatDialogHelper.calculateHits(60, 50, 10, RATE_OF_FIRE_MODIFIERS.SINGLE)).toBe(0);
    });

    it('calculates hits for full-auto (1 + 1 per degree)', () => {
      expect(CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.FULL_AUTO)).toBe(3);
      expect(CombatDialogHelper.calculateHits(45, 50, 10, RATE_OF_FIRE_MODIFIERS.FULL_AUTO)).toBe(1);
      expect(CombatDialogHelper.calculateHits(10, 50, 10, RATE_OF_FIRE_MODIFIERS.FULL_AUTO)).toBe(5);
    });

    it('calculates hits for semi-auto (1 + 1 per 2 degrees)', () => {
      expect(CombatDialogHelper.calculateHits(30, 50, 10, RATE_OF_FIRE_MODIFIERS.SEMI_AUTO)).toBe(2);
      expect(CombatDialogHelper.calculateHits(45, 50, 10, RATE_OF_FIRE_MODIFIERS.SEMI_AUTO)).toBe(1);
      expect(CombatDialogHelper.calculateHits(10, 50, 10, RATE_OF_FIRE_MODIFIERS.SEMI_AUTO)).toBe(3);
      expect(CombatDialogHelper.calculateHits(20, 50, 10, RATE_OF_FIRE_MODIFIERS.SEMI_AUTO)).toBe(2);
    });

    it('caps hits at maxHits', () => {
      expect(CombatDialogHelper.calculateHits(10, 50, 2, RATE_OF_FIRE_MODIFIERS.FULL_AUTO)).toBe(2);
      expect(CombatDialogHelper.calculateHits(10, 50, 2, RATE_OF_FIRE_MODIFIERS.SEMI_AUTO)).toBe(2);
    });
  });

  describe('determineJamThreshold', () => {
    it('returns 94 for semi-auto', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SEMI_AUTO)).toBe(94);
    });

    it('returns 94 for full-auto', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.FULL_AUTO)).toBe(94);
    });

    it('returns 96 for single shot', () => {
      expect(CombatDialogHelper.determineJamThreshold(RATE_OF_FIRE_MODIFIERS.SINGLE)).toBe(96);
    });
  });

  describe('parseRateOfFire', () => {
    it('parses S/2/4 with sufficient ammo', () => {
      const result = CombatDialogHelper.parseRateOfFire('S/2/4', 10);
      expect(result.hasSingle).toBe(true);
      expect(result.hasSemiAuto).toBe(true);
      expect(result.hasFullAuto).toBe(true);
      expect(result.semiAutoRounds).toBe(2);
      expect(result.fullAutoRounds).toBe(4);
    });

    it('parses S/-/- with no auto fire', () => {
      const result = CombatDialogHelper.parseRateOfFire('S/-/-', 10);
      expect(result.hasSingle).toBe(true);
      expect(result.hasSemiAuto).toBe(false);
      expect(result.hasFullAuto).toBe(false);
    });

    it('disables modes with insufficient ammo', () => {
      const result = CombatDialogHelper.parseRateOfFire('S/2/4', 1);
      expect(result.hasSingle).toBe(true);
      expect(result.hasSemiAuto).toBe(false);
      expect(result.hasFullAuto).toBe(false);
    });
  });

  describe('buildRofOptions', () => {
    it('builds options for all available modes', () => {
      const rofData = {
        hasSingle: true,
        hasSemiAuto: true,
        hasFullAuto: true,
        semiAutoRounds: 2,
        fullAutoRounds: 4
      };
      const options = CombatDialogHelper.buildRofOptions(rofData);
      expect(options).toContain('Single (1 round)');
      expect(options).toContain('Semi-Auto');
      expect(options).toContain('Full-Auto');
    });

    it('builds options for single only', () => {
      const rofData = {
        hasSingle: true,
        hasSemiAuto: false,
        hasFullAuto: false
      };
      const options = CombatDialogHelper.buildRofOptions(rofData);
      expect(options).toContain('Single');
      expect(options).not.toContain('Semi-Auto');
    });
  });

  describe('determineRoundsFired', () => {
    it('returns 1 for single shot', () => {
      expect(CombatDialogHelper.determineRoundsFired(RATE_OF_FIRE_MODIFIERS.SINGLE, ['S', '2', '4'])).toBe(1);
    });

    it('returns semi-auto rounds', () => {
      expect(CombatDialogHelper.determineRoundsFired(RATE_OF_FIRE_MODIFIERS.SEMI_AUTO, ['S', '3', '6'])).toBe(3);
    });

    it('returns full-auto rounds', () => {
      expect(CombatDialogHelper.determineRoundsFired(RATE_OF_FIRE_MODIFIERS.FULL_AUTO, ['S', '3', '6'])).toBe(6);
    });
  });

  describe('buildAttackLabel', () => {
    it('builds hit label', () => {
      const label = CombatDialogHelper.buildAttackLabel('Bolter', 50, 2, false);
      expect(label).toContain('Bolter');
      expect(label).toContain('Target: 50');
      expect(label).toContain('HIT!');
      expect(label).toContain('2 Hits');
    });

    it('builds miss label', () => {
      const label = CombatDialogHelper.buildAttackLabel('Bolter', 50, 0, false);
      expect(label).toContain('MISS!');
      expect(label).toContain('0 Hits');
    });

    it('includes jam warning', () => {
      const label = CombatDialogHelper.buildAttackLabel('Bolter', 50, 1, true);
      expect(label).toContain('WEAPON JAMMED!');
    });
  });

  describe('buildAttackFlavor', () => {
    it('returns label when no modifiers', () => {
      const flavor = CombatDialogHelper.buildAttackFlavor('Test Label', []);
      expect(flavor).toBe('Test Label');
    });

    it('includes modifiers in details', () => {
      const flavor = CombatDialogHelper.buildAttackFlavor('Test Label', ['+10 Aim', '+5 Misc']);
      expect(flavor).toContain('Test Label');
      expect(flavor).toContain('<details');
      expect(flavor).toContain('+10 Aim');
      expect(flavor).toContain('+5 Misc');
    });
  });
});

describe('validateWeaponForAttack', () => {
  it('returns invalid if weapon is jammed', () => {
    const weapon = { name: 'Bolter', system: { jammed: true } };
    const actor = { items: { get: () => null } };
    
    const result = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Bolter is jammed! Clear the jam before firing.');
  });

  it('returns invalid if weapon has no ammo loaded', () => {
    const weapon = { 
      name: 'Bolter', 
      system: { 
        jammed: false,
        clip: '30',
        capacity: { max: 30 }, 
        loadedAmmo: null 
      } 
    };
    const actor = { items: { get: () => null } };
    
    const result = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Bolter has no ammunition loaded!');
  });

  it('returns invalid if loaded ammo is empty', () => {
    const weapon = { 
      name: 'Bolter', 
      system: { 
        jammed: false,
        clip: '30',
        capacity: { max: 30 }, 
        loadedAmmo: 'ammo1' 
      } 
    };
    const loadedAmmo = { system: { capacity: { value: 0 } } };
    const actor = { items: { get: () => loadedAmmo } };
    
    const result = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Bolter is out of ammunition!');
  });

  it('returns valid for weapon with ammo', () => {
    const weapon = { 
      name: 'Bolter', 
      system: { 
        jammed: false, 
        capacity: { max: 30 }, 
        loadedAmmo: 'ammo1' 
      } 
    };
    const loadedAmmo = { system: { capacity: { value: 20 } } };
    const actor = { items: { get: () => loadedAmmo } };
    
    const result = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('returns valid for weapon without capacity', () => {
    const weapon = { 
      name: 'Power Sword', 
      system: { jammed: false } 
    };
    const actor = { items: { get: () => null } };
    
    const result = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    
    expect(result.valid).toBe(true);
  });
});

describe('buildDamageFormula', () => {
  it('returns base damage for hit index > 0', () => {
    const result = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10+5', degreesOfSuccess: 3, isMelee: false, strBonus: 0, hitIndex: 1 });
    expect(result).toBe('2d10+5');
  });

  it('applies degrees of success to first hit', () => {
    const result = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10+5', degreesOfSuccess: 3, isMelee: false, strBonus: 0, hitIndex: 0 });
    expect(result).toBe('2d10min3+5');
  });

  it('applies degrees of success to single die', () => {
    const result = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10+5', degreesOfSuccess: 2, isMelee: false, strBonus: 0, hitIndex: 0 });
    expect(result).toBe('1d10min2+5');
  });

  it('adds strength bonus for melee', () => {
    const result = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10+5', degreesOfSuccess: 0, isMelee: true, strBonus: 8, hitIndex: 0 });
    expect(result).toBe('2d10+5 + 8');
  });

  it('applies both DoS and strength bonus', () => {
    const result = CombatDialogHelper.buildDamageFormula({ baseDmg: '2d10+5', degreesOfSuccess: 2, isMelee: true, strBonus: 6, hitIndex: 0 });
    expect(result).toBe('2d10min2+5 + 6');
  });

  it('handles negative strength bonus', () => {
    const result = CombatDialogHelper.buildDamageFormula({ baseDmg: '1d10', degreesOfSuccess: 0, isMelee: true, strBonus: -2, hitIndex: 0 });
    expect(result).toBe('1d10 + -2');
  });
});

describe('calculateDegreesOfSuccess', () => {
  it('returns 0 if attack missed', () => {
    expect(CombatDialogHelper.calculateDegreesOfSuccess(55, 50)).toBe(0);
  });

  it('returns 0 for exact hit', () => {
    expect(CombatDialogHelper.calculateDegreesOfSuccess(50, 50)).toBe(0);
  });

  it('returns 1 for 10-19 under target', () => {
    expect(CombatDialogHelper.calculateDegreesOfSuccess(40, 50)).toBe(1);
    expect(CombatDialogHelper.calculateDegreesOfSuccess(31, 50)).toBe(1);
  });

  it('returns 3 for 30-39 under target', () => {
    expect(CombatDialogHelper.calculateDegreesOfSuccess(20, 50)).toBe(3);
  });

  it('returns 5 for 50 under target', () => {
    expect(CombatDialogHelper.calculateDegreesOfSuccess(10, 60)).toBe(5);
  });
});

describe('calculateDamageResult', () => {
  it('calculates wounds taken with no armor', () => {
    const result = CombatDialogHelper.calculateDamageResult({ damage: 15, armorValue: 0, penetration: 0 });
    expect(result.effectiveArmor).toBe(0);
    expect(result.woundsTaken).toBe(15);
  });

  it('calculates wounds taken with armor', () => {
    const result = CombatDialogHelper.calculateDamageResult({ damage: 15, armorValue: 8, penetration: 0 });
    expect(result.effectiveArmor).toBe(8);
    expect(result.woundsTaken).toBe(7);
  });

  it('applies penetration to armor', () => {
    const result = CombatDialogHelper.calculateDamageResult({ damage: 15, armorValue: 8, penetration: 4 });
    expect(result.effectiveArmor).toBe(4);
    expect(result.woundsTaken).toBe(11);
  });

  it('prevents negative effective armor', () => {
    const result = CombatDialogHelper.calculateDamageResult({ damage: 15, armorValue: 5, penetration: 10 });
    expect(result.effectiveArmor).toBe(0);
    expect(result.woundsTaken).toBe(15);
  });

  it('prevents negative wounds taken', () => {
    const result = CombatDialogHelper.calculateDamageResult({ damage: 5, armorValue: 10, penetration: 0 });
    expect(result.effectiveArmor).toBe(10);
    expect(result.woundsTaken).toBe(0);
  });
});

describe('calculateCriticalDamage', () => {
  it('returns non-critical for wounds below max', () => {
    const result = CombatDialogHelper.calculateCriticalDamage(10, 5, 20);
    expect(result.newWounds).toBe(15);
    expect(result.isCritical).toBe(false);
    expect(result.criticalDamage).toBe(0);
  });

  it('returns non-critical for wounds at max', () => {
    const result = CombatDialogHelper.calculateCriticalDamage(15, 5, 20);
    expect(result.newWounds).toBe(20);
    expect(result.isCritical).toBe(false);
    expect(result.criticalDamage).toBe(0);
  });

  it('returns critical for wounds above max', () => {
    const result = CombatDialogHelper.calculateCriticalDamage(18, 5, 20);
    expect(result.newWounds).toBe(23);
    expect(result.isCritical).toBe(true);
    expect(result.criticalDamage).toBe(3);
  });

  it('calculates critical damage correctly', () => {
    const result = CombatDialogHelper.calculateCriticalDamage(20, 10, 20);
    expect(result.newWounds).toBe(30);
    expect(result.isCritical).toBe(true);
    expect(result.criticalDamage).toBe(10);
  });
});

describe('buildDamageMessage', () => {
  it('builds basic damage message', () => {
    const msg = CombatDialogHelper.buildDamageMessage(
      'Marine', 5, 'Body', 10, 5, 0, 5, 4, false, 0, 'actor1', 'Impact'
    );
    expect(msg).toContain('Marine');
    expect(msg).toContain('5 wounds');
    expect(msg).toContain('Body');
    expect(msg).toContain('Damage: 10');
    expect(msg).toContain('Armor: 5');
    expect(msg).toContain('TB: 4');
    expect(msg).not.toContain('CRITICAL');
  });

  it('includes critical damage section', () => {
    const msg = CombatDialogHelper.buildDamageMessage(
      'Marine', 8, 'Head', 15, 5, 2, 3, 4, true, 3, 'actor1', 'Energy'
    );
    expect(msg).toContain('CRITICAL DAMAGE: 3');
    expect(msg).toContain('roll-critical-btn');
    expect(msg).toContain('data-actor-id="actor1"');
    expect(msg).toContain('data-location="Head"');
    expect(msg).toContain('data-damage-type="Energy"');
    expect(msg).toContain('TB: 4');
  });
});

describe('buildArmorAbsorbMessage', () => {
  it('builds armor absorb message', () => {
    const msg = CombatDialogHelper.buildArmorAbsorbMessage('Marine', 'Body', 8, 10, 0, 5);
    expect(msg).toContain('Marine');
    expect(msg).toContain('armor and toughness absorb all damage');
    expect(msg).toContain('Body');
    expect(msg).toContain('Damage: 8');
    expect(msg).toContain('Armor: 10');
    expect(msg).toContain('TB: 5');
  });
});

describe('calculateClearJamTarget', () => {
  it('calculates target number', () => {
    expect(CombatDialogHelper.calculateClearJamTarget(40, 10)).toBe(50);
  });

  it('handles zero advances', () => {
    expect(CombatDialogHelper.calculateClearJamTarget(35, 0)).toBe(35);
  });

  it('handles negative advances', () => {
    expect(CombatDialogHelper.calculateClearJamTarget(40, -5)).toBe(35);
  });
});

describe('buildClearJamFlavor', () => {
  it('builds success message', () => {
    const msg = CombatDialogHelper.buildClearJamFlavor('Bolter', 50, true);
    expect(msg).toContain('Clear Jam: Bolter');
    expect(msg).toContain('Target: 50');
    expect(msg).toContain('SUCCESS - Jam Cleared!');
    expect(msg).toContain('Ammo lost');
  });

  it('builds failure message', () => {
    const msg = CombatDialogHelper.buildClearJamFlavor('Bolter', 50, false);
    expect(msg).toContain('Clear Jam: Bolter');
    expect(msg).toContain('Target: 50');
    expect(msg).toContain('FAILED - Still Jammed');
    expect(msg).not.toContain('Ammo lost');
  });
});
