import {
  CHARACTERISTICS,
  CHARACTERISTIC_LABELS,
  MODIFIER_TYPES,
  EFFECT_TYPES,
  AIM_MODIFIERS,
  RATE_OF_FIRE_MODIFIERS,
  COMBAT_PENALTIES,
  RANGE_MODIFIERS
} from '../src/module/helpers/constants.mjs';

describe('Constants', () => {
  describe('CHARACTERISTICS', () => {
    it('defines all nine characteristics', () => {
      expect(CHARACTERISTICS.WS).toBe('ws');
      expect(CHARACTERISTICS.BS).toBe('bs');
      expect(CHARACTERISTICS.STR).toBe('str');
      expect(CHARACTERISTICS.TG).toBe('tg');
      expect(CHARACTERISTICS.AG).toBe('ag');
      expect(CHARACTERISTICS.INT).toBe('int');
      expect(CHARACTERISTICS.PER).toBe('per');
      expect(CHARACTERISTICS.WIL).toBe('wil');
      expect(CHARACTERISTICS.FS).toBe('fs');
    });
  });

  describe('CHARACTERISTIC_LABELS', () => {
    it('maps characteristics to labels', () => {
      expect(CHARACTERISTIC_LABELS.ws).toBe('Weapon Skill');
      expect(CHARACTERISTIC_LABELS.bs).toBe('Ballistic Skill');
      expect(CHARACTERISTIC_LABELS.str).toBe('Strength');
      expect(CHARACTERISTIC_LABELS.tg).toBe('Toughness');
      expect(CHARACTERISTIC_LABELS.ag).toBe('Agility');
      expect(CHARACTERISTIC_LABELS.int).toBe('Intelligence');
      expect(CHARACTERISTIC_LABELS.per).toBe('Perception');
      expect(CHARACTERISTIC_LABELS.wil).toBe('Willpower');
      expect(CHARACTERISTIC_LABELS.fs).toBe('Fellowship');
    });
  });

  describe('MODIFIER_TYPES', () => {
    it('defines modifier types', () => {
      expect(MODIFIER_TYPES.UNTYPED).toBe('untyped');
      expect(MODIFIER_TYPES.CIRCUMSTANCE).toBe('circumstance');
      expect(MODIFIER_TYPES.EQUIPMENT).toBe('equipment');
      expect(MODIFIER_TYPES.TRAIT).toBe('trait');
    });
  });

  describe('EFFECT_TYPES', () => {
    it('defines effect types', () => {
      expect(EFFECT_TYPES.CHARACTERISTIC).toBe('characteristic');
      expect(EFFECT_TYPES.SKILL).toBe('skill');
      expect(EFFECT_TYPES.CHARACTERISTIC_BONUS).toBe('characteristic-bonus');
      expect(EFFECT_TYPES.INITIATIVE).toBe('initiative');
    });
  });

  describe('AIM_MODIFIERS', () => {
    it('defines aim modifiers', () => {
      expect(AIM_MODIFIERS.NONE).toBe(0);
      expect(AIM_MODIFIERS.HALF).toBe(10);
      expect(AIM_MODIFIERS.FULL).toBe(20);
    });
  });

  describe('RATE_OF_FIRE_MODIFIERS', () => {
    it('defines rate of fire modifiers', () => {
      expect(RATE_OF_FIRE_MODIFIERS.SINGLE).toBe(0);
      expect(RATE_OF_FIRE_MODIFIERS.SEMI_AUTO).toBe(10);
      expect(RATE_OF_FIRE_MODIFIERS.FULL_AUTO).toBe(20);
    });
  });

  describe('COMBAT_PENALTIES', () => {
    it('defines combat penalties', () => {
      expect(COMBAT_PENALTIES.CALLED_SHOT).toBe(-20);
      expect(COMBAT_PENALTIES.RUNNING_TARGET).toBe(-20);
    });
  });

  describe('RANGE_MODIFIERS', () => {
    it('defines range modifiers', () => {
      expect(RANGE_MODIFIERS.POINT_BLANK).toBe(20);
      expect(RANGE_MODIFIERS.SHORT).toBe(10);
      expect(RANGE_MODIFIERS.NORMAL).toBe(0);
      expect(RANGE_MODIFIERS.LONG).toBe(-10);
      expect(RANGE_MODIFIERS.EXTREME).toBe(-20);
    });
  });
});
