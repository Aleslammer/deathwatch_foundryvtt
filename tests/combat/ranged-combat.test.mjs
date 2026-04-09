import { jest } from '@jest/globals';
import { RangedCombatHelper } from '../../src/module/helpers/combat/ranged-combat.mjs';
import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from "../../src/module/helpers/constants/index.mjs";

describe('RangedCombatHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateThrownWeaponRange', () => {
    it('should calculate range for thrown weapon with SBx3', () => {
      const weapon = { system: { class: 'Thrown', range: 'SBx3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(12);
    });

    it('should calculate range for thrown weapon with SBx2', () => {
      const weapon = { system: { class: 'Thrown', range: 'SBx2' } };
      const actor = { system: { characteristics: { str: { mod: 5 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(10);
    });

    it('should return null for non-thrown weapon', () => {
      const weapon = { system: { class: 'Basic', range: 'SBx3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBeNull();
    });

    it('should return null if range does not match SBx pattern', () => {
      const weapon = { system: { class: 'Thrown', range: '100' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBeNull();
    });

    it('should handle missing strength bonus', () => {
      const weapon = { system: { class: 'Thrown', range: 'SBx3' } };
      const actor = { system: { characteristics: { str: {} } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(0);
    });

    it('should handle case insensitive class check', () => {
      const weapon = { system: { class: 'THROWN', range: 'SBx3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(12);
    });

    it('should handle case insensitive range pattern', () => {
      const weapon = { system: { class: 'Thrown', range: 'sbx3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(12);
    });

    it('should handle spaces in range pattern', () => {
      const weapon = { system: { class: 'Thrown', range: 'SB x 3' } };
      const actor = { system: { characteristics: { str: { mod: 4 } } } };
      expect(RangedCombatHelper.calculateThrownWeaponRange(weapon, actor)).toBe(12);
    });
  });

  describe('attackDialog', () => {
    it('should be defined', () => {
      expect(RangedCombatHelper.attackDialog).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof RangedCombatHelper.attackDialog).toBe('function');
    });
  });

  describe('calculateAmmoExpenditure', () => {
    it('returns rounds fired with no qualities', () => {
      expect(RangedCombatHelper.calculateAmmoExpenditure(3)).toBe(3);
    });

    it('returns 1 for single shot', () => {
      expect(RangedCombatHelper.calculateAmmoExpenditure(1)).toBe(1);
    });

    it('doubles for Storm', () => {
      expect(RangedCombatHelper.calculateAmmoExpenditure(3, true, false)).toBe(6);
    });

    it('doubles for Twin-Linked', () => {
      expect(RangedCombatHelper.calculateAmmoExpenditure(3, false, true)).toBe(6);
    });

    it('quadruples for Storm + Twin-Linked', () => {
      expect(RangedCombatHelper.calculateAmmoExpenditure(3, true, true)).toBe(12);
    });

    it('handles single shot with Storm', () => {
      expect(RangedCombatHelper.calculateAmmoExpenditure(1, true, false)).toBe(2);
    });
  });

  describe('checkPrematureDetonation', () => {
    it('returns false when no ammo loaded', () => {
      const weapon = { system: { loadedAmmo: null } };
      const result = RangedCombatHelper.checkPrematureDetonation(weapon, null, 95);
      expect(result.detonates).toBe(false);
      expect(result.threshold).toBe(101);
    });

    it('returns false when ammo has no detonation modifier', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const actor = { items: { get: jest.fn(() => ({ system: { modifiers: [] } })) } };
      const result = RangedCombatHelper.checkPrematureDetonation(weapon, actor, 95);
      expect(result.detonates).toBe(false);
    });

    it('returns true when roll meets threshold', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const actor = { items: { get: jest.fn(() => ({ system: { modifiers: [
        { effectType: 'premature-detonation', modifier: '91', enabled: true }
      ] } })) } };
      const result = RangedCombatHelper.checkPrematureDetonation(weapon, actor, 91);
      expect(result.detonates).toBe(true);
      expect(result.threshold).toBe(91);
    });

    it('returns false when roll is below threshold', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const actor = { items: { get: jest.fn(() => ({ system: { modifiers: [
        { effectType: 'premature-detonation', modifier: '96', enabled: true }
      ] } })) } };
      const result = RangedCombatHelper.checkPrematureDetonation(weapon, actor, 90);
      expect(result.detonates).toBe(false);
    });

    it('ignores disabled detonation modifier', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const actor = { items: { get: jest.fn(() => ({ system: { modifiers: [
        { effectType: 'premature-detonation', modifier: '91', enabled: false }
      ] } })) } };
      const result = RangedCombatHelper.checkPrematureDetonation(weapon, actor, 95);
      expect(result.detonates).toBe(false);
    });

    it('handles ammo not found on actor', () => {
      const weapon = { system: { loadedAmmo: 'ammo1' } };
      const actor = { items: { get: jest.fn(() => null) } };
      const result = RangedCombatHelper.checkPrematureDetonation(weapon, actor, 95);
      expect(result.detonates).toBe(false);
    });
  });

  describe('calculateMaxHits', () => {
    it('returns rounds fired without Twin-Linked', () => {
      expect(RangedCombatHelper.calculateMaxHits(3)).toBe(3);
    });

    it('adds 1 for Twin-Linked', () => {
      expect(RangedCombatHelper.calculateMaxHits(3, true)).toBe(4);
    });

    it('returns 1 for single shot without Twin-Linked', () => {
      expect(RangedCombatHelper.calculateMaxHits(1)).toBe(1);
    });

    it('returns 2 for single shot with Twin-Linked', () => {
      expect(RangedCombatHelper.calculateMaxHits(1, true)).toBe(2);
    });
  });

  describe('rollScatter', () => {
    let mockActor, mockWeapon, mockTable, mockTablePack;

    beforeEach(() => {
      mockActor = {
        name: 'Test Marine',
        getActiveTokens: jest.fn(() => [])
      };
      mockWeapon = {
        name: 'Frag Grenade',
        system: { class: 'Thrown' }
      };

      // Mock the scatter table
      mockTable = {
        draw: jest.fn().mockResolvedValue({
          results: [{
            name: '',
            description: 'Upper Right'
          }]
        })
      };

      // Mock compendium pack
      mockTablePack = {
        index: [{ _id: 'scatter-table-id', name: 'Scatter' }],
        getDocument: jest.fn().mockResolvedValue(mockTable)
      };

      global.game.packs = {
        get: jest.fn((packId) => {
          if (packId === 'deathwatch.tables') return mockTablePack;
          return null;
        })
      };

      global.game.tables = {
        getName: jest.fn(() => null)
      };

      // Mock Roll
      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue({ total: 3 })
      }));

      // Mock ChatMessage
      global.ChatMessage = {
        create: jest.fn().mockResolvedValue({}),
        getSpeaker: jest.fn(() => ({}))
      };

      global.game.settings = {
        get: jest.fn(() => 'roll')
      };
    });

    it('rolls scatter direction and distance when weapon misses', async () => {
      const result = await RangedCombatHelper.rollScatter(mockActor, mockWeapon);

      expect(result).toEqual({
        direction: 'Upper Right',
        distance: 3
      });
      expect(mockTable.draw).toHaveBeenCalledWith({ displayChat: false });
      expect(ChatMessage.create).toHaveBeenCalled();
    });

    it('creates chat message with scatter results', async () => {
      await RangedCombatHelper.rollScatter(mockActor, mockWeapon);

      const chatCall = ChatMessage.create.mock.calls[0][0];
      expect(chatCall.content).toContain('Test Marine');
      expect(chatCall.content).toContain('Frag Grenade');
      expect(chatCall.content).toContain('Upper Right');
      expect(chatCall.content).toContain('3 meters');
    });

    it('returns null and warns if scatter table not found', async () => {
      global.game.packs.get = jest.fn(() => null);
      global.game.tables.getName = jest.fn(() => null);
      global.ui = { notifications: { warn: jest.fn() } };

      const result = await RangedCombatHelper.rollScatter(mockActor, mockWeapon);

      expect(result).toBeNull();
      expect(ui.notifications.warn).toHaveBeenCalledWith('Scatter table not found! Import it from the Tables compendium.');
    });

    it('falls back to world tables if compendium not found', async () => {
      global.game.packs.get = jest.fn(() => null);
      global.game.tables.getName = jest.fn(() => mockTable);

      const result = await RangedCombatHelper.rollScatter(mockActor, mockWeapon);

      expect(result).not.toBeNull();
      expect(game.tables.getName).toHaveBeenCalledWith('Scatter');
    });
  });
});
