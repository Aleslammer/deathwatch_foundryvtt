import { jest } from '@jest/globals';
import { ModifierCollector } from '../../src/module/helpers/modifier-collector.mjs';

describe('ModifierCollector - characteristic-post-multiplier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds post-multiplier value to characteristic value for tests', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    expect(characteristics.str.value).toBe(60);
  });

  it('applies post-multiplier bonus AFTER unnatural multiplier', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Unnatural Strength', modifier: 'x2', effectType: 'characteristic-bonus', valueAffected: 'str', enabled: true, source: 'Trait' },
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    // STR value = 40 + 20 = 60 (for tests)
    expect(characteristics.str.value).toBe(60);
    // baseMod = floor((60 - 20) / 10) = 4
    // Unnatural x2: mod = 4 * 2 = 8
    // Post-multiplier: mod += floor(20 / 10) = 2
    // Final mod = 10
    expect(characteristics.str.mod).toBe(10);
  });

  it('would produce wrong result if post-multiplier were applied before multiplier', () => {
    // This test documents the WRONG behavior to ensure we never regress.
    // If post-multiplier bonus (2) were added before Unnatural x2,
    // we'd get (4 + 2) * 2 = 12 instead of the correct 10.
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Unnatural Strength', modifier: 'x2', effectType: 'characteristic-bonus', valueAffected: 'str', enabled: true, source: 'Trait' },
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    // Must be 10, NOT 12
    expect(characteristics.str.mod).not.toBe(12);
    expect(characteristics.str.mod).toBe(10);
  });

  it('works without unnatural multiplier', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    expect(characteristics.str.value).toBe(60);
    // Without multiplier: baseMod = floor((60-20)/10) = 4, post = 2, total = 6
    expect(characteristics.str.mod).toBe(6);
  });

  it('shows post-multiplier in value tooltip', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    expect(characteristics.str.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Enhanced Strength', value: 20, source: 'Power Armor' })
      ])
    );
  });

  it('shows post-multiplier in bonus tooltip', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    expect(characteristics.str.bonusModifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Enhanced Strength', value: 2, display: '+2 (post-multiplier)' })
      ])
    );
  });

  it('does not add bonus tooltip when post-multiplier total is zero', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Zero Modifier', modifier: '0', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Test' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    const postMultBonusMods = characteristics.str.bonusModifiers.filter(m => m.display?.includes('post-multiplier'));
    expect(postMultBonusMods).toHaveLength(0);
  });

  it('ignores disabled post-multiplier modifiers', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: false, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    expect(characteristics.str.value).toBe(40);
    expect(characteristics.str.mod).toBe(4);
  });

  it('stacks with regular characteristic modifiers', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Chapter Bonus', modifier: '5', effectType: 'characteristic', valueAffected: 'str', enabled: true, source: 'Chapter' },
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    // Value: 40 + 5 + 20 = 65
    expect(characteristics.str.value).toBe(65);
    // baseMod = floor((65 - 20) / 10) = 4, post = 2, total = 6
    expect(characteristics.str.mod).toBe(6);
  });

  it('stacks with advances and unnatural multiplier', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: { simple: true, intermediate: true } }
    };
    const modifiers = [
      { name: 'Unnatural Strength', modifier: 'x2', effectType: 'characteristic-bonus', valueAffected: 'str', enabled: true, source: 'Trait' },
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    // Value: 40 + 5 + 5 + 20 = 70
    expect(characteristics.str.value).toBe(70);
    // baseMod = floor((70 - 20) / 10) = 5
    // Unnatural x2: 5 * 2 = 10
    // Post-multiplier: 10 + 2 = 12
    expect(characteristics.str.mod).toBe(12);
  });

  it('only affects the targeted characteristic', () => {
    const characteristics = {
      str: { value: 40, base: 40, damage: 0, advances: {} },
      tg: { value: 40, base: 40, damage: 0, advances: {} }
    };
    const modifiers = [
      { name: 'Enhanced Strength', modifier: '20', effectType: 'characteristic-post-multiplier', valueAffected: 'str', enabled: true, source: 'Power Armor' }
    ];

    ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);

    expect(characteristics.str.value).toBe(60);
    expect(characteristics.tg.value).toBe(40);
    expect(characteristics.tg.mod).toBe(4);
  });
});
