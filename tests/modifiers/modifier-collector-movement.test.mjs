import { jest } from '@jest/globals';
import '../setup.mjs';
import { ModifierCollector } from '../../src/module/helpers/modifier-collector.mjs';

describe('ModifierCollector - applyMovementModifiers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates movement from agility bonus with no modifiers', () => {
    const movement = {};
    ModifierCollector.applyMovementModifiers(movement, 4, []);

    expect(movement.half).toBe(4);
    expect(movement.full).toBe(8);
    expect(movement.charge).toBe(12);
    expect(movement.run).toBe(24);
    expect(movement.bonus).toBe(0);
    expect(movement.modifiers).toHaveLength(0);
  });

  it('applies movement modifier to all movement rates', () => {
    const movement = {};
    const modifiers = [
      { name: 'Giant Among Men', modifier: '1', effectType: 'movement', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

    expect(movement.half).toBe(5);
    expect(movement.full).toBe(10);
    expect(movement.charge).toBe(15);
    expect(movement.run).toBe(30);
    expect(movement.bonus).toBe(1);
  });

  it('stacks multiple movement modifiers', () => {
    const movement = {};
    const modifiers = [
      { name: 'Giant Among Men', modifier: '1', effectType: 'movement', enabled: true, source: 'Power Armor' },
      { name: 'Speed Boost', modifier: '2', effectType: 'movement', enabled: true, source: 'Talent' }
    ];

    ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

    expect(movement.half).toBe(7);
    expect(movement.full).toBe(14);
    expect(movement.charge).toBe(21);
    expect(movement.run).toBe(42);
    expect(movement.bonus).toBe(3);
  });

  it('ignores disabled movement modifiers', () => {
    const movement = {};
    const modifiers = [
      { name: 'Giant Among Men', modifier: '1', effectType: 'movement', enabled: false, source: 'Power Armor' }
    ];

    ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

    expect(movement.half).toBe(4);
    expect(movement.bonus).toBe(0);
  });

  it('ignores non-movement modifiers', () => {
    const movement = {};
    const modifiers = [
      { name: 'STR Bonus', modifier: '20', effectType: 'characteristic', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

    expect(movement.half).toBe(4);
    expect(movement.bonus).toBe(0);
  });

  it('tracks modifiers for tooltip display', () => {
    const movement = {};
    const modifiers = [
      { name: 'Giant Among Men', modifier: '1', effectType: 'movement', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

    expect(movement.modifiers).toHaveLength(1);
    expect(movement.modifiers[0]).toMatchObject({
      name: 'Giant Among Men',
      value: 1,
      source: 'Power Armor'
    });
  });

  it('handles zero agility bonus', () => {
    const movement = {};
    const modifiers = [
      { name: 'Giant Among Men', modifier: '1', effectType: 'movement', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyMovementModifiers(movement, 0, modifiers);

    expect(movement.half).toBe(1);
    expect(movement.full).toBe(2);
    expect(movement.charge).toBe(3);
    expect(movement.run).toBe(6);
  });

  it('does nothing when movement is null', () => {
    ModifierCollector.applyMovementModifiers(null, 4, []);
    // No error thrown
  });

  it('handles negative movement modifiers', () => {
    const movement = {};
    const modifiers = [
      { name: 'Encumbered', modifier: '-1', effectType: 'movement', enabled: true, source: 'Condition' }
    ];

    ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

    expect(movement.half).toBe(3);
    expect(movement.full).toBe(6);
    expect(movement.charge).toBe(9);
    expect(movement.run).toBe(18);
    expect(movement.bonus).toBe(-1);
  });

  describe('movement-restriction', () => {
    it('sets restricted movement type to N/A', () => {
      const movement = {};
      const modifiers = [
        { name: 'Terminator Armor', modifier: 'run', effectType: 'movement-restriction', enabled: true, source: 'Terminator Armor' }
      ];

      ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

      expect(movement.half).toBe(4);
      expect(movement.full).toBe(8);
      expect(movement.charge).toBe(12);
      expect(movement.run).toBe('N/A');
    });

    it('can restrict multiple movement types', () => {
      const movement = {};
      const modifiers = [
        { name: 'Terminator Armor', modifier: 'run', effectType: 'movement-restriction', enabled: true, source: 'Terminator Armor' },
        { name: 'Terminator Armor', modifier: 'charge', effectType: 'movement-restriction', enabled: true, source: 'Terminator Armor' }
      ];

      ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

      expect(movement.half).toBe(4);
      expect(movement.full).toBe(8);
      expect(movement.charge).toBe('N/A');
      expect(movement.run).toBe('N/A');
    });

    it('ignores disabled movement-restriction modifiers', () => {
      const movement = {};
      const modifiers = [
        { name: 'Terminator Armor', modifier: 'run', effectType: 'movement-restriction', enabled: false, source: 'Terminator Armor' }
      ];

      ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

      expect(movement.run).toBe(24);
    });

    it('ignores restriction for invalid movement type', () => {
      const movement = {};
      const modifiers = [
        { name: 'Bad Modifier', modifier: 'fly', effectType: 'movement-restriction', enabled: true, source: 'Test' }
      ];

      ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

      expect(movement.half).toBe(4);
      expect(movement.full).toBe(8);
      expect(movement.charge).toBe(12);
      expect(movement.run).toBe(24);
    });

    it('works alongside movement bonus modifiers', () => {
      const movement = {};
      const modifiers = [
        { name: 'Giant Among Men', modifier: '1', effectType: 'movement', enabled: true, source: 'Terminator Armor' },
        { name: 'Terminator Armor', modifier: 'run', effectType: 'movement-restriction', enabled: true, source: 'Terminator Armor' }
      ];

      ModifierCollector.applyMovementModifiers(movement, 4, modifiers);

      expect(movement.half).toBe(5);
      expect(movement.full).toBe(10);
      expect(movement.charge).toBe(15);
      expect(movement.run).toBe('N/A');
      expect(movement.bonus).toBe(1);
    });
  });
});
