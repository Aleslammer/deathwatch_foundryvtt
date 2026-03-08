import { jest } from '@jest/globals';
import './setup.mjs';
import { RighteousFuryHelper } from '../src/module/helpers/righteous-fury-helper.mjs';

describe('RighteousFuryHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasNaturalTen', () => {
    it('detects natural 10 on d10', () => {
      const roll = {
        dice: [{
          faces: 10,
          results: [{ result: 10 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(true);
    });

    it('detects natural 5 on d5', () => {
      const roll = {
        dice: [{
          faces: 5,
          results: [{ result: 5 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(true);
    });

    it('returns false for non-10 result', () => {
      const roll = {
        dice: [{
          faces: 10,
          results: [{ result: 7 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(false);
    });

    it('detects 10 in multiple dice', () => {
      const roll = {
        dice: [{
          faces: 10,
          results: [{ result: 3 }, { result: 10 }, { result: 7 }]
        }]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(true);
    });

    it('detects 10 across multiple die groups', () => {
      const roll = {
        dice: [
          { faces: 10, results: [{ result: 3 }] },
          { faces: 10, results: [{ result: 10 }] }
        ]
      };
      expect(RighteousFuryHelper.hasNaturalTen(roll)).toBe(true);
    });
  });
});
