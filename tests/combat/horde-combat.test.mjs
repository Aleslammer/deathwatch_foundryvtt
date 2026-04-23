import { jest } from '@jest/globals';
import { HordeCombatHelper } from '../../src/module/helpers/combat/horde-combat.mjs';

describe('HordeCombatHelper', () => {

  describe('calculateHordeHits', () => {

    describe('Blast weapons', () => {
      it('Blast adds to default 1 baseHit', () => {
        // Default baseHits(1) + Blast(4) = 5
        expect(HordeCombatHelper.calculateHordeHits({ blastValue: 4 })).toBe(5);
      });

      it('Blast(3) adds to default baseHit', () => {
        // Default baseHits(1) + Blast(3) = 4
        expect(HordeCombatHelper.calculateHordeHits({ blastValue: 3 })).toBe(4);
      });

      it('Blast with Explosive damage type stacks both bonuses', () => {
        // Default baseHits(1) + Blast(4) + Explosive(1) = 6
        expect(HordeCombatHelper.calculateHordeHits({ blastValue: 4, damageType: 'Explosive' })).toBe(6);
      });

      it('Blast with non-Explosive damage type gets no explosive bonus', () => {
        // Default baseHits(1) + Blast(4) = 5
        expect(HordeCombatHelper.calculateHordeHits({ blastValue: 4, damageType: 'Energy' })).toBe(5);
      });

      it('Full Auto + Blast is additive (baseHits + blastValue)', () => {
        // Full Auto lands 5 hits, Blast(2) adds 2 more - total 7
        expect(HordeCombatHelper.calculateHordeHits({ blastValue: 2, baseHits: 5 })).toBe(7);
      });

      it('Blast adds to baseHits additively', () => {
        // 2 baseHits + Blast(10) - total 12
        expect(HordeCombatHelper.calculateHordeHits({ blastValue: 10, baseHits: 2 })).toBe(12);
      });

      it('Full Auto + Blast(2) + Explosive stacks all bonuses', () => {
        // baseHits(5) + Blast(2) + Explosive(1) = 8
        expect(HordeCombatHelper.calculateHordeHits({ blastValue: 2, baseHits: 5, damageType: 'Explosive' })).toBe(8);
      });

      it('Blast(2) with 3 capped baseHits + Explosive = 6 total', () => {
        // baseHits(3) + Blast(2) + Explosive(1) = 6
        expect(HordeCombatHelper.calculateHordeHits({ blastValue: 2, baseHits: 3, damageType: 'Explosive' })).toBe(6);
      });
    });

    describe('Flame weapons', () => {
      it('returns ceil(range / 4) as static component', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isFlame: true, flameRange: 10 })).toBe(3);
      });

      it('range 20 gives 5 static hits', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isFlame: true, flameRange: 20 })).toBe(5);
      });

      it('range 30 gives 8 static hits', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isFlame: true, flameRange: 30 })).toBe(8);
      });

      it('range 7 rounds up to 2', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isFlame: true, flameRange: 7 })).toBe(2);
      });
    });

    describe('Melee attacks', () => {
      it('1 hit on successful attack with 0 DoS', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isMelee: true, degreesOfSuccess: 0 })).toBe(1);
      });

      it('1 hit with 1 DoS (not enough for extra)', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isMelee: true, degreesOfSuccess: 1 })).toBe(1);
      });

      it('1 hit per 2 DoS', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isMelee: true, degreesOfSuccess: 2 })).toBe(1);
      });

      it('2 hits with 4 DoS', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isMelee: true, degreesOfSuccess: 4 })).toBe(2);
      });

      it('3 hits with 6 DoS', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isMelee: true, degreesOfSuccess: 6 })).toBe(3);
      });

      it('Power Field adds 1 hit', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isMelee: true, degreesOfSuccess: 4, hasPowerField: true })).toBe(3);
      });

      it('Power Field adds 1 even with 0 DoS', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isMelee: true, degreesOfSuccess: 0, hasPowerField: true })).toBe(2);
      });
    });

    describe('Psychic powers', () => {
      it('hits equal to effective PR', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isPsychic: true, effectivePR: 5 })).toBe(5);
      });

      it('PR 0 gives 0 hits', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isPsychic: true, effectivePR: 0 })).toBe(0);
      });

      it('high PR gives many hits', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isPsychic: true, effectivePR: 11 })).toBe(11);
      });

      it('ignores blast/flame/melee options', () => {
        expect(HordeCombatHelper.calculateHordeHits({ isPsychic: true, effectivePR: 5, blastValue: 10, isFlame: true, isMelee: true })).toBe(5);
      });
    });

    describe('Ranged attacks (non-blast, non-flame)', () => {
      it('uses base hits for normal ranged', () => {
        expect(HordeCombatHelper.calculateHordeHits({ baseHits: 3 })).toBe(3);
      });

      it('Explosive damage type adds +1 hit', () => {
        expect(HordeCombatHelper.calculateHordeHits({ baseHits: 2, damageType: 'Explosive' })).toBe(3);
      });

      it('non-Explosive damage type gets no bonus', () => {
        expect(HordeCombatHelper.calculateHordeHits({ baseHits: 2, damageType: 'Impact' })).toBe(2);
      });

      it('defaults to 1 base hit', () => {
        expect(HordeCombatHelper.calculateHordeHits({})).toBe(1);
      });
    });
  });

  describe('getFlameStaticHits', () => {
    it('range 10 gives 3', () => {
      expect(HordeCombatHelper.getFlameStaticHits(10)).toBe(3);
    });

    it('range 20 gives 5', () => {
      expect(HordeCombatHelper.getFlameStaticHits(20)).toBe(5);
    });

    it('range 1 gives 1', () => {
      expect(HordeCombatHelper.getFlameStaticHits(1)).toBe(1);
    });
  });

  describe('calculateHordeDamageBonusDice', () => {
    it('returns 0 for magnitude less than 10', () => {
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(9)).toBe(0);
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(0)).toBe(0);
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(5)).toBe(0);
    });

    it('returns 1 for magnitude 10-19', () => {
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(10)).toBe(1);
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(15)).toBe(1);
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(19)).toBe(1);
    });

    it('returns 2 for magnitude 20+', () => {
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(20)).toBe(2);
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(25)).toBe(2);
    });

    it('caps at 2 even for very high magnitude', () => {
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(50)).toBe(2);
      expect(HordeCombatHelper.calculateHordeDamageBonusDice(100)).toBe(2);
    });
  });

  describe('calculateMagnitudeReduction', () => {
    it('returns 1 when damage exceeds armor + TB', () => {
      expect(HordeCombatHelper.calculateMagnitudeReduction(10, 3, 0, 3)).toBe(1);
    });

    it('returns 0 when damage equals armor + TB', () => {
      expect(HordeCombatHelper.calculateMagnitudeReduction(6, 3, 0, 3)).toBe(0);
    });

    it('returns 0 when damage is less than armor + TB', () => {
      expect(HordeCombatHelper.calculateMagnitudeReduction(4, 3, 0, 3)).toBe(0);
    });

    it('penetration reduces effective armor', () => {
      // damage 5, armor 4, pen 3, TB 3 => effective armor 1, total 4 => 5 > 4 = 1
      expect(HordeCombatHelper.calculateMagnitudeReduction(5, 4, 3, 3)).toBe(1);
    });

    it('penetration cannot make armor negative', () => {
      // damage 4, armor 2, pen 5, TB 3 => effective armor 0, total 3 => 4 > 3 = 1
      expect(HordeCombatHelper.calculateMagnitudeReduction(4, 2, 5, 3)).toBe(1);
    });

    it('Primitive doubles armor before penetration', () => {
      // damage 10, armor 4, pen 2, TB 3 => effective armor (4*2)-2=6, total 9 => 10 > 9 = 1
      expect(HordeCombatHelper.calculateMagnitudeReduction(10, 4, 2, 3, { isPrimitive: true })).toBe(1);
    });

    it('Primitive can block more damage', () => {
      // damage 8, armor 4, pen 2, TB 3 => effective armor (4*2)-2=6, total 9 => 8 <= 9 = 0
      expect(HordeCombatHelper.calculateMagnitudeReduction(8, 4, 2, 3, { isPrimitive: true })).toBe(0);
    });

    it('Razor Sharp doubles penetration with 2+ DoS', () => {
      // damage 5, armor 6, pen 3 (doubled to 6), TB 2 => effective armor 0, total 2 => 5 > 2 = 1
      expect(HordeCombatHelper.calculateMagnitudeReduction(5, 6, 3, 2, { isRazorSharp: true, degreesOfSuccess: 2 })).toBe(1);
    });

    it('Razor Sharp does not double with < 2 DoS', () => {
      // damage 5, armor 6, pen 3, TB 2 => effective armor 3, total 5 => 5 <= 5 = 0
      expect(HordeCombatHelper.calculateMagnitudeReduction(5, 6, 3, 2, { isRazorSharp: true, degreesOfSuccess: 1 })).toBe(0);
    });

    it('Melta range doubles penetration', () => {
      // damage 8, armor 8, pen 4 (doubled to 8), TB 3 => effective armor 0, total 3 => 8 > 3 = 1
      expect(HordeCombatHelper.calculateMagnitudeReduction(8, 8, 4, 3, { isMeltaRange: true })).toBe(1);
    });

    it('returns 1 even for massive overkill damage', () => {
      expect(HordeCombatHelper.calculateMagnitudeReduction(50, 3, 0, 3)).toBe(1);
    });

    it('returns 0 with zero damage', () => {
      expect(HordeCombatHelper.calculateMagnitudeReduction(0, 0, 0, 0)).toBe(0);
    });
  });
});
