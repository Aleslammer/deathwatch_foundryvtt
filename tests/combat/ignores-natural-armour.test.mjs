import { jest } from '@jest/globals';
import { CombatHelper } from '../../src/module/helpers/combat/combat.mjs';

describe('CombatHelper - Ignores Natural Armour', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('_getIgnoresNaturalArmour', () => {
    it('returns false when no ammo loaded', () => {
      const weapon = { system: { loadedAmmo: null } };
      const actor = { items: { get: jest.fn() } };

      expect(CombatHelper._getIgnoresNaturalArmour(weapon, actor)).toBe(false);
    });

    it('returns false when actor is null', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };

      expect(CombatHelper._getIgnoresNaturalArmour(weapon, null)).toBe(false);
    });

    it('returns false when ammo has no modifiers', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const ammo = { system: { modifiers: [] } };
      const actor = { items: { get: jest.fn(() => ammo) } };

      expect(CombatHelper._getIgnoresNaturalArmour(weapon, actor)).toBe(false);
    });

    it('returns false when ammo not found', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const actor = { items: { get: jest.fn(() => null) } };

      expect(CombatHelper._getIgnoresNaturalArmour(weapon, actor)).toBe(false);
    });

    it('returns true when ammo has ignores-natural-armour modifier', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const ammo = {
        system: {
          modifiers: [
            { name: 'Hellfire Ignores Natural Armour', modifier: '1', effectType: 'ignores-natural-armour', enabled: true }
          ]
        }
      };
      const actor = { items: { get: jest.fn(() => ammo) } };

      expect(CombatHelper._getIgnoresNaturalArmour(weapon, actor)).toBe(true);
    });

    it('returns false when ignores-natural-armour modifier is disabled', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const ammo = {
        system: {
          modifiers: [
            { name: 'Hellfire Ignores Natural Armour', modifier: '1', effectType: 'ignores-natural-armour', enabled: false }
          ]
        }
      };
      const actor = { items: { get: jest.fn(() => ammo) } };

      expect(CombatHelper._getIgnoresNaturalArmour(weapon, actor)).toBe(false);
    });

    it('returns true even with other modifiers present', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const ammo = {
        system: {
          modifiers: [
            { name: 'Hellfire Righteous Fury', modifier: '9', effectType: 'righteous-fury-threshold', enabled: true },
            { name: 'Hellfire Ignores Natural Armour', modifier: '1', effectType: 'ignores-natural-armour', enabled: true },
            { name: 'Hellfire Anti-Horde', modifier: '1', effectType: 'magnitude-bonus-damage', enabled: true }
          ]
        }
      };
      const actor = { items: { get: jest.fn(() => ammo) } };

      expect(CombatHelper._getIgnoresNaturalArmour(weapon, actor)).toBe(true);
    });

    it('returns false when ammo modifiers is not an array', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const ammo = { system: { modifiers: null } };
      const actor = { items: { get: jest.fn(() => ammo) } };

      expect(CombatHelper._getIgnoresNaturalArmour(weapon, actor)).toBe(false);
    });
  });
});
