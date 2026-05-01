// tests/helpers/constants/modifier-constants.test.mjs
import { MODIFIER_TYPES, MODIFIER_TYPE_LABELS } from '../../../src/module/helpers/constants/modifier-constants.mjs';

describe('Modifier Constants', () => {
  describe('MODIFIER_TYPES', () => {
    test('should include all required types', () => {
      expect(MODIFIER_TYPES.TRAIT).toBe('trait');
      expect(MODIFIER_TYPES.EQUIPMENT).toBe('equipment');
      expect(MODIFIER_TYPES.TALENT).toBe('talent');
      expect(MODIFIER_TYPES.CIRCUMSTANCE).toBe('circumstance');
      expect(MODIFIER_TYPES.CHAPTER).toBe('chapter');
      expect(MODIFIER_TYPES.PSYCHIC).toBe('psychic');
      expect(MODIFIER_TYPES.UNTYPED).toBe('untyped');
    });
  });

  describe('MODIFIER_TYPE_LABELS', () => {
    test('should have labels for all types', () => {
      expect(MODIFIER_TYPE_LABELS[MODIFIER_TYPES.TRAIT]).toBe('Trait');
      expect(MODIFIER_TYPE_LABELS[MODIFIER_TYPES.EQUIPMENT]).toBe('Equipment');
      expect(MODIFIER_TYPE_LABELS[MODIFIER_TYPES.TALENT]).toBe('Talent');
      expect(MODIFIER_TYPE_LABELS[MODIFIER_TYPES.CIRCUMSTANCE]).toBe('Circumstance');
      expect(MODIFIER_TYPE_LABELS[MODIFIER_TYPES.CHAPTER]).toBe('Chapter');
      expect(MODIFIER_TYPE_LABELS[MODIFIER_TYPES.PSYCHIC]).toBe('Psychic');
      expect(MODIFIER_TYPE_LABELS[MODIFIER_TYPES.UNTYPED]).toBe('Untyped (Legacy)');
    });
  });
});
