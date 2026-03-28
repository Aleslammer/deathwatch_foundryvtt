import { jest } from '@jest/globals';
import { WoundHelper } from '../../src/module/helpers/wound-helper.mjs';

describe('WoundHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWoundColorClass', () => {
    it('returns empty string for 0% wounds (0/20)', () => {
      expect(WoundHelper.getWoundColorClass(0, 20)).toBe('');
    });

    it('returns empty string for 25% wounds (5/20)', () => {
      expect(WoundHelper.getWoundColorClass(5, 20)).toBe('');
    });

    it('returns wounds-warning for 26% wounds (5.2/20)', () => {
      expect(WoundHelper.getWoundColorClass(5.2, 20)).toBe('wounds-warning');
    });

    it('returns wounds-warning for 50% wounds (10/20)', () => {
      expect(WoundHelper.getWoundColorClass(10, 20)).toBe('wounds-warning');
    });

    it('returns wounds-warning for 74% wounds (14.8/20)', () => {
      expect(WoundHelper.getWoundColorClass(14.8, 20)).toBe('wounds-warning');
    });

    it('returns wounds-danger for 75% wounds (15/20)', () => {
      expect(WoundHelper.getWoundColorClass(15, 20)).toBe('wounds-danger');
    });

    it('returns wounds-danger for 100% wounds (20/20)', () => {
      expect(WoundHelper.getWoundColorClass(20, 20)).toBe('wounds-danger');
    });

    it('returns wounds-danger for over 100% wounds (25/20)', () => {
      expect(WoundHelper.getWoundColorClass(25, 20)).toBe('wounds-danger');
    });

    it('returns empty string when max is 0', () => {
      expect(WoundHelper.getWoundColorClass(5, 0)).toBe('');
    });

    it('returns empty string when max is null', () => {
      expect(WoundHelper.getWoundColorClass(5, null)).toBe('');
    });

    it('returns empty string when max is undefined', () => {
      expect(WoundHelper.getWoundColorClass(5, undefined)).toBe('');
    });

    it('handles edge case at exactly 26% boundary (5.2/20)', () => {
      expect(WoundHelper.getWoundColorClass(5.2, 20)).toBe('wounds-warning');
    });

    it('handles edge case just below 26% boundary (5.19/20)', () => {
      expect(WoundHelper.getWoundColorClass(5.19, 20)).toBe('');
    });

    it('handles edge case at exactly 75% boundary (15/20)', () => {
      expect(WoundHelper.getWoundColorClass(15, 20)).toBe('wounds-danger');
    });

    it('handles edge case just below 75% boundary (14.99/20)', () => {
      expect(WoundHelper.getWoundColorClass(14.99, 20)).toBe('wounds-warning');
    });
  });
});
