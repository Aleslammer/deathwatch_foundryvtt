import { jest } from '@jest/globals';
import './setup.mjs';
import { ModifierCollector } from '../src/module/helpers/modifier-collector.mjs';

describe('Fatigue System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyFatigueModifiers', () => {
    it('sets max fatigue to toughness bonus', () => {
      const fatigue = { value: 0, max: 0 };
      const toughnessBonus = 4;

      ModifierCollector.applyFatigueModifiers(fatigue, toughnessBonus);

      expect(fatigue.max).toBe(4);
    });

    it('marks character unconscious when fatigue exceeds TB', () => {
      const fatigue = { value: 5, max: 0 };
      const toughnessBonus = 4;

      ModifierCollector.applyFatigueModifiers(fatigue, toughnessBonus);

      expect(fatigue.unconscious).toBe(true);
    });

    it('does not mark unconscious when fatigue equals TB', () => {
      const fatigue = { value: 4, max: 0 };
      const toughnessBonus = 4;

      ModifierCollector.applyFatigueModifiers(fatigue, toughnessBonus);

      expect(fatigue.unconscious).toBe(false);
    });

    it('does not mark unconscious when fatigue is below TB', () => {
      const fatigue = { value: 2, max: 0 };
      const toughnessBonus = 4;

      ModifierCollector.applyFatigueModifiers(fatigue, toughnessBonus);

      expect(fatigue.unconscious).toBe(false);
    });

    it('applies -10 penalty when fatigue is greater than 0', () => {
      const fatigue = { value: 1, max: 0 };
      const toughnessBonus = 4;

      ModifierCollector.applyFatigueModifiers(fatigue, toughnessBonus);

      expect(fatigue.penalty).toBe(-10);
    });

    it('applies no penalty when fatigue is 0', () => {
      const fatigue = { value: 0, max: 0 };
      const toughnessBonus = 4;

      ModifierCollector.applyFatigueModifiers(fatigue, toughnessBonus);

      expect(fatigue.penalty).toBe(0);
    });

    it('handles zero toughness bonus', () => {
      const fatigue = { value: 0, max: 0 };
      const toughnessBonus = 0;

      ModifierCollector.applyFatigueModifiers(fatigue, toughnessBonus);

      expect(fatigue.max).toBe(0);
      expect(fatigue.unconscious).toBe(false);
    });

    it('handles high toughness bonus', () => {
      const fatigue = { value: 5, max: 0 };
      const toughnessBonus = 10;

      ModifierCollector.applyFatigueModifiers(fatigue, toughnessBonus);

      expect(fatigue.max).toBe(10);
      expect(fatigue.unconscious).toBe(false);
      expect(fatigue.penalty).toBe(-10);
    });

    it('handles null fatigue gracefully', () => {
      expect(() => {
        ModifierCollector.applyFatigueModifiers(null, 4);
      }).not.toThrow();
    });

    it('handles undefined fatigue gracefully', () => {
      expect(() => {
        ModifierCollector.applyFatigueModifiers(undefined, 4);
      }).not.toThrow();
    });
  });
});
