import { WeaponQualityHelper } from '../../src/module/helpers/combat/weapon-quality-helper.mjs';

describe('WeaponQualityHelper - Psychic Power Quality Extraction', () => {
  describe('getCripplingValue', () => {
    test('should return value when crippling quality is present', () => {
      const attachedQualities = [
        { key: 'crippling', value: 3 },
        { key: 'tainted', value: 2 }
      ];
      expect(WeaponQualityHelper.getCripplingValue(attachedQualities)).toBe(3);
    });

    test('should return null when crippling quality is absent', () => {
      const attachedQualities = [
        { key: 'tainted', value: 2 },
        { key: 'warp-weapon', value: 1 }
      ];
      expect(WeaponQualityHelper.getCripplingValue(attachedQualities)).toBeNull();
    });

    test('should return null when attachedQualities is undefined', () => {
      expect(WeaponQualityHelper.getCripplingValue(undefined)).toBeNull();
    });
  });

  describe('getSnareValue', () => {
    test('should return value when snared quality is present', () => {
      const attachedQualities = [
        { key: 'snared', value: 2 },
        { key: 'felling', value: 4 }
      ];
      expect(WeaponQualityHelper.getSnareValue(attachedQualities)).toBe(2);
    });

    test('should return null when snared quality is absent', () => {
      const attachedQualities = [
        { key: 'crippling', value: 3 },
        { key: 'warp-weapon', value: 1 }
      ];
      expect(WeaponQualityHelper.getSnareValue(attachedQualities)).toBeNull();
    });

    test('should return null when attachedQualities is undefined', () => {
      expect(WeaponQualityHelper.getSnareValue(undefined)).toBeNull();
    });
  });

  describe('getFellingValue', () => {
    test('should return value when felling quality is present', () => {
      const attachedQualities = [
        { key: 'felling', value: 4 },
        { key: 'tainted', value: 2 }
      ];
      expect(WeaponQualityHelper.getFellingValue(attachedQualities)).toBe(4);
    });

    test('should return null when felling quality is absent', () => {
      const attachedQualities = [
        { key: 'crippling', value: 3 },
        { key: 'snared', value: 2 }
      ];
      expect(WeaponQualityHelper.getFellingValue(attachedQualities)).toBeNull();
    });

    test('should return null when attachedQualities is undefined', () => {
      expect(WeaponQualityHelper.getFellingValue(undefined)).toBeNull();
    });
  });
});
