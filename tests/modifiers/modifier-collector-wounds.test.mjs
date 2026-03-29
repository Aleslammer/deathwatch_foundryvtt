import { jest } from '@jest/globals';
import { ModifierCollector } from '../../src/module/helpers/character/modifier-collector.mjs';

describe('ModifierCollector - Wound Modifiers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyWoundModifiers', () => {
    it('initializes base from max if base is undefined', () => {
      const wounds = { value: 5, max: 20 };
      const modifiers = [];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.base).toBe(20);
      expect(wounds.max).toBe(20);
    });

    it('applies positive wound modifiers', () => {
      const wounds = { value: 5, base: 20, max: 20 };
      const modifiers = [
        { name: 'Bonus', modifier: 5, effectType: 'wounds', enabled: true }
      ];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.max).toBe(25);
      expect(wounds.base).toBe(20);
    });

    it('applies negative wound modifiers', () => {
      const wounds = { value: 5, base: 20, max: 20 };
      const modifiers = [
        { name: 'Penalty', modifier: -3, effectType: 'wounds', enabled: true }
      ];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.max).toBe(17);
    });

    it('applies multiple wound modifiers', () => {
      const wounds = { value: 5, base: 20, max: 20 };
      const modifiers = [
        { name: 'Bonus 1', modifier: 5, effectType: 'wounds', enabled: true },
        { name: 'Bonus 2', modifier: 3, effectType: 'wounds', enabled: true },
        { name: 'Penalty', modifier: -2, effectType: 'wounds', enabled: true }
      ];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.max).toBe(26);
    });

    it('ignores disabled wound modifiers', () => {
      const wounds = { value: 5, base: 20, max: 20 };
      const modifiers = [
        { name: 'Enabled', modifier: 5, effectType: 'wounds', enabled: true },
        { name: 'Disabled', modifier: 10, effectType: 'wounds', enabled: false }
      ];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.max).toBe(25);
    });

    it('ignores non-wound modifiers', () => {
      const wounds = { value: 5, base: 20, max: 20 };
      const modifiers = [
        { name: 'Characteristic', modifier: 5, effectType: 'characteristic', valueAffected: 'str', enabled: true },
        { name: 'Initiative', modifier: 3, effectType: 'initiative', enabled: true }
      ];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.max).toBe(20);
    });

    it('handles zero base wounds', () => {
      const wounds = { value: 0, base: 0, max: 0 };
      const modifiers = [
        { name: 'Bonus', modifier: 10, effectType: 'wounds', enabled: true }
      ];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.max).toBe(10);
    });

    it('handles string modifier values', () => {
      const wounds = { value: 5, base: 20, max: 20 };
      const modifiers = [
        { name: 'Bonus', modifier: '5', effectType: 'wounds', enabled: true }
      ];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.max).toBe(25);
    });

    it('tracks applied modifiers with sources', () => {
      const wounds = { value: 5, base: 20, max: 20 };
      const modifiers = [
        { name: 'True Grit', modifier: 3, effectType: 'wounds', enabled: true, source: 'Talent' },
        { name: 'Chapter Bonus', modifier: 2, effectType: 'wounds', enabled: true, source: 'Storm Wardens' }
      ];
      
      ModifierCollector.applyWoundModifiers(wounds, modifiers);
      
      expect(wounds.max).toBe(25);
      expect(wounds.modifiers).toHaveLength(2);
      expect(wounds.modifiers[0]).toEqual({ name: 'True Grit', value: 3, source: 'Talent' });
      expect(wounds.modifiers[1]).toEqual({ name: 'Chapter Bonus', value: 2, source: 'Storm Wardens' });
    });
  });
});
