import { jest } from '@jest/globals';
import './setup.mjs';
import { ModifierCollector } from '../src/module/helpers/modifier-collector.mjs';

describe('ModifierCollector - Armor Modifiers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyArmorModifiers', () => {
    it('applies armor modifiers to all equipped armor regardless of source', () => {
      const items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: true,
            head: 8,
            body: 10
          }
        }
      ];

      const modifiers = [
        { name: 'Armor Enhancement', modifier: 2, effectType: 'armor', source: 'Talent', enabled: true }
      ];

      ModifierCollector.applyArmorModifiers(items, modifiers);

      expect(items[0].system.head).toBe(10);
      expect(items[0].system.body).toBe(12);
    });

    it('stores base armor values', () => {
      const items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: true,
            head: 8,
            body: 10
          }
        }
      ];

      const modifiers = [
        { name: 'Enhancement', modifier: 2, effectType: 'armor', source: 'Talent', enabled: true }
      ];

      ModifierCollector.applyArmorModifiers(items, modifiers);

      expect(items[0].system.head_base).toBe(8);
      expect(items[0].system.body_base).toBe(10);
    });

    it('does not apply modifiers to unequipped armor', () => {
      const items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: false,
            head: 8,
            body: 10
          }
        }
      ];

      const modifiers = [
        { name: 'Enhancement', modifier: 2, effectType: 'armor', source: 'Power Armor', enabled: true }
      ];

      ModifierCollector.applyArmorModifiers(items, modifiers);

      expect(items[0].system.head).toBe(8);
      expect(items[0].system.body).toBe(10);
    });

    it('applies modifiers to all equipped armor', () => {
      const items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: true,
            head: 8
          }
        },
        {
          name: 'Scout Armor',
          type: 'armor',
          system: {
            equipped: true,
            head: 6
          }
        }
      ];

      const modifiers = [
        { name: 'Enhancement', modifier: 2, effectType: 'armor', source: 'Talent', enabled: true }
      ];

      ModifierCollector.applyArmorModifiers(items, modifiers);

      expect(items[0].system.head).toBe(10);
      expect(items[1].system.head).toBe(8);
    });

    it('applies multiple armor modifiers', () => {
      const items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: true,
            head: 8
          }
        }
      ];

      const modifiers = [
        { name: 'Enhancement 1', modifier: 2, effectType: 'armor', source: 'Talent 1', enabled: true },
        { name: 'Enhancement 2', modifier: 3, effectType: 'armor', source: 'Talent 2', enabled: true }
      ];

      ModifierCollector.applyArmorModifiers(items, modifiers);

      expect(items[0].system.head).toBe(13);
    });

    it('handles negative armor modifiers', () => {
      const items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: true,
            head: 8
          }
        }
      ];

      const modifiers = [
        { name: 'Damage', modifier: -2, effectType: 'armor', source: 'Effect', enabled: true }
      ];

      ModifierCollector.applyArmorModifiers(items, modifiers);

      expect(items[0].system.head).toBe(6);
    });

    it('ignores disabled armor modifiers', () => {
      const items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: true,
            head: 8
          }
        }
      ];

      const modifiers = [
        { name: 'Enhancement', modifier: 2, effectType: 'armor', source: 'Talent', enabled: false }
      ];

      ModifierCollector.applyArmorModifiers(items, modifiers);

      expect(items[0].system.head).toBe(8);
    });

    it('works with Map of items', () => {
      const itemsMap = new Map();
      const armor = {
        name: 'Power Armor',
        type: 'armor',
        system: {
          equipped: true,
          head: 8
        }
      };
      itemsMap.set('armor1', armor);

      const modifiers = [
        { name: 'Enhancement', modifier: 2, effectType: 'armor', source: 'Talent', enabled: true }
      ];

      ModifierCollector.applyArmorModifiers(itemsMap, modifiers);

      expect(armor.system.head).toBe(10);
    });
  });
});
