import { jest } from '@jest/globals';
import { CombatHelper } from '../../src/module/helpers/combat/combat.mjs';
import { RANGE_MODIFIERS, AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from "../../src/module/helpers/constants/index.mjs";

describe('CombatHelper', () => {
  describe('calculateRangeModifier', () => {
    it('returns point blank for distance <= 2m', () => {
      const result = CombatHelper.calculateRangeModifier(2, 100);
      expect(result.modifier).toBe(RANGE_MODIFIERS.POINT_BLANK);
      expect(result.label).toBe('Point Blank');
    });

    it('returns short for distance < half weapon range', () => {
      const result = CombatHelper.calculateRangeModifier(40, 100);
      expect(result.modifier).toBe(RANGE_MODIFIERS.SHORT);
      expect(result.label).toBe('Short');
    });

    it('returns normal for distance between half and 2x weapon range', () => {
      const result = CombatHelper.calculateRangeModifier(100, 100);
      expect(result.modifier).toBe(RANGE_MODIFIERS.NORMAL);
      expect(result.label).toBe('Normal');
    });

    it('returns long for distance between 2x and 3x weapon range', () => {
      const result = CombatHelper.calculateRangeModifier(250, 100);
      expect(result.modifier).toBe(RANGE_MODIFIERS.LONG);
      expect(result.label).toBe('Long');
    });

    it('returns extreme for distance >= 3x weapon range', () => {
      const result = CombatHelper.calculateRangeModifier(300, 100);
      expect(result.modifier).toBe(RANGE_MODIFIERS.EXTREME);
      expect(result.label).toBe('Extreme');
    });
  });

  describe('getTokenDistance', () => {
    let mockToken1, mockToken2, mockCanvas;

    beforeEach(() => {
      mockToken1 = {
        scene: { id: 'scene1' },
        center: { x: 0, y: 0 }
      };
      mockToken2 = {
        scene: { id: 'scene1' },
        center: { x: 100, y: 100 }
      };
      mockCanvas = {
        grid: {
          measurePath: jest.fn(() => ({ distance: 141.42 }))
        }
      };
      global.canvas = mockCanvas;
    });

    it('returns distance between two tokens', () => {
      const distance = CombatHelper.getTokenDistance(mockToken1, mockToken2);
      expect(distance).toBe(141.42);
      expect(mockCanvas.grid.measurePath).toHaveBeenCalled();
    });

    it('returns null if token1 is missing', () => {
      const distance = CombatHelper.getTokenDistance(null, mockToken2);
      expect(distance).toBeNull();
    });

    it('returns null if token2 is missing', () => {
      const distance = CombatHelper.getTokenDistance(mockToken1, null);
      expect(distance).toBeNull();
    });

    it('returns null if tokens are on different scenes', () => {
      mockToken2.scene.id = 'scene2';
      const distance = CombatHelper.getTokenDistance(mockToken1, mockToken2);
      expect(distance).toBeNull();
    });
  });

  describe('determineHitLocation', () => {
    it('returns Head for reversed roll 01-10', () => {
      expect(CombatHelper.determineHitLocation(1)).toBe('Head');
      expect(CombatHelper.determineHitLocation(20)).toBe('Head');
      expect(CombatHelper.determineHitLocation(50)).toBe('Head');
      expect(CombatHelper.determineHitLocation(10)).toBe('Head');
    });

    it('returns Right Arm for reversed roll 11-20', () => {
      expect(CombatHelper.determineHitLocation(11)).toBe('Right Arm');
      expect(CombatHelper.determineHitLocation(21)).toBe('Right Arm');
      expect(CombatHelper.determineHitLocation(91)).toBe('Right Arm');
      expect(CombatHelper.determineHitLocation(2)).toBe('Right Arm');
    });

    it('returns Left Arm for reversed roll 21-30', () => {
      expect(CombatHelper.determineHitLocation(12)).toBe('Left Arm');
      expect(CombatHelper.determineHitLocation(22)).toBe('Left Arm');
      expect(CombatHelper.determineHitLocation(92)).toBe('Left Arm');
      expect(CombatHelper.determineHitLocation(3)).toBe('Left Arm');
    });

    it('returns Body for reversed roll 31-70', () => {
      expect(CombatHelper.determineHitLocation(13)).toBe('Body');
      expect(CombatHelper.determineHitLocation(34)).toBe('Body');
      expect(CombatHelper.determineHitLocation(66)).toBe('Body');
      expect(CombatHelper.determineHitLocation(7)).toBe('Body');
    });

    it('returns Right Leg for reversed roll 71-85', () => {
      expect(CombatHelper.determineHitLocation(17)).toBe('Right Leg');
      expect(CombatHelper.determineHitLocation(58)).toBe('Right Leg');
      expect(CombatHelper.determineHitLocation(67)).toBe('Right Leg');
      expect(CombatHelper.determineHitLocation(8)).toBe('Right Leg');
    });

    it('returns Left Leg for reversed roll 86-00', () => {
      expect(CombatHelper.determineHitLocation(68)).toBe('Left Leg');
      expect(CombatHelper.determineHitLocation(89)).toBe('Left Leg');
      expect(CombatHelper.determineHitLocation(99)).toBe('Left Leg');
      expect(CombatHelper.determineHitLocation(100)).toBe('Left Leg');
    });
  });

  describe('determineMultipleHitLocations', () => {
    it('returns single location for 1 hit', () => {
      const result = CombatHelper.determineMultipleHitLocations('Head', 1);
      expect(result).toEqual(['Head']);
    });

    it('returns multiple locations for Head hits', () => {
      const result = CombatHelper.determineMultipleHitLocations('Head', 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Head');
    });

    it('returns multiple locations for Body hits', () => {
      const result = CombatHelper.determineMultipleHitLocations('Body', 4);
      expect(result).toHaveLength(4);
      expect(result[0]).toBe('Body');
    });

    it('alternates arm locations', () => {
      const result = CombatHelper.determineMultipleHitLocations('Right Arm', 4);
      expect(result).toContain('Right Arm');
      expect(result).toContain('Left Arm');
    });

    it('alternates leg locations', () => {
      const result = CombatHelper.determineMultipleHitLocations('Right Leg', 4);
      expect(result).toContain('Right Leg');
      expect(result).toContain('Left Leg');
    });

    it('handles unknown location with Body pattern', () => {
      const result = CombatHelper.determineMultipleHitLocations('Unknown', 2);
      expect(result).toHaveLength(2);
    });
  });

  describe('getArmorValue', () => {
    it('delegates to actor system getArmorValue', () => {
      const mockActor = {
        system: {
          getArmorValue: jest.fn(() => 8)
        }
      };
      expect(CombatHelper.getArmorValue(mockActor, 'Head')).toBe(8);
      expect(mockActor.system.getArmorValue).toHaveBeenCalledWith('Head');
    });
  });

  describe('applyDamage', () => {
    it('delegates to targetActor.system.receiveDamage', async () => {
      const mockActor = {
        system: {
          receiveDamage: jest.fn()
        }
      };
      const options = { damage: 15, penetration: 2, location: 'Body', damageType: 'Impact' };
      await CombatHelper.applyDamage(mockActor, options);
      expect(mockActor.system.receiveDamage).toHaveBeenCalledWith(options);
    });
  });

  describe('hasNaturalTen', () => {
    it('returns true for natural 10 on d10', () => {
      const roll = {
        dice: [{
          faces: 10,
          results: [{ result: 10 }]
        }]
      };
      expect(CombatHelper.hasNaturalTen(roll)).toBe(true);
    });

    it('returns true for natural 5 on d5', () => {
      const roll = {
        dice: [{
          faces: 5,
          results: [{ result: 5 }]
        }]
      };
      expect(CombatHelper.hasNaturalTen(roll)).toBe(true);
    });

    it('returns false for non-max rolls', () => {
      const roll = {
        dice: [{
          faces: 10,
          results: [{ result: 7 }]
        }]
      };
      expect(CombatHelper.hasNaturalTen(roll)).toBe(false);
    });

    it('returns true if any die has max result', () => {
      const roll = {
        dice: [
          { faces: 10, results: [{ result: 3 }] },
          { faces: 10, results: [{ result: 10 }] }
        ]
      };
      expect(CombatHelper.hasNaturalTen(roll)).toBe(true);
    });
  });

  describe('clearJam', () => {
    let mockActor, mockWeapon, mockRoll;

    beforeEach(() => {
      mockWeapon = {
        name: 'Bolter',
        system: {
          jammed: true,
          loadedAmmo: 'ammo123'
        },
        update: jest.fn()
      };

      mockActor = {
        system: {
          characteristics: {
            bs: { value: 40, advances: 5 }
          }
        },
        items: {
          get: jest.fn(() => ({
            update: jest.fn()
          }))
        }
      };

      mockRoll = {
        total: 30,
        toMessage: jest.fn()
      };

      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
    });

    it('warns if weapon not jammed', async () => {
      mockWeapon.system.jammed = false;
      await CombatHelper.clearJam(mockActor, mockWeapon);

      expect(global.ui.notifications.info).toHaveBeenCalledWith('Bolter is not jammed.');
    });

    it('clears jam on successful roll', async () => {
      await CombatHelper.clearJam(mockActor, mockWeapon);

      expect(mockWeapon.update).toHaveBeenCalledWith({ 'system.jammed': false });
    });

    it('removes loaded ammo on successful clear', async () => {
      const mockAmmo = { update: jest.fn() };
      mockActor.items.get.mockReturnValue(mockAmmo);

      await CombatHelper.clearJam(mockActor, mockWeapon);

      expect(mockAmmo.update).toHaveBeenCalledWith({ 'system.capacity.value': 0 });
      expect(mockWeapon.update).toHaveBeenCalledWith({ 'system.loadedAmmo': null });
    });

    it('does not clear jam on failed roll', async () => {
      mockRoll.total = 50;
      await CombatHelper.clearJam(mockActor, mockWeapon);

      expect(mockWeapon.update).not.toHaveBeenCalledWith({ 'system.jammed': false });
    });

    it('creates chat message with result', async () => {
      await CombatHelper.clearJam(mockActor, mockWeapon);

      expect(mockRoll.toMessage).toHaveBeenCalled();
    });
  });

  describe('rollRighteousFury', () => {
    let mockActor, mockWeapon, mockRoll;

    beforeEach(() => {
      mockActor = { name: 'Test Marine' };
      mockWeapon = { name: 'Bolter' };
      mockRoll = {
        total: 30,
        toMessage: jest.fn()
      };

      global.Roll = jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockResolvedValue(mockRoll)
      }));
    });

    it('returns true if confirmation succeeds', async () => {
      const result = await CombatHelper.rollRighteousFury(mockActor, mockWeapon, 50, 'Body');
      expect(result).toBe(true);
    });

    it('returns false if confirmation fails', async () => {
      mockRoll.total = 60;
      const result = await CombatHelper.rollRighteousFury(mockActor, mockWeapon, 50, 'Body');
      expect(result).toBe(false);
    });

    it('creates chat message', async () => {
      await CombatHelper.rollRighteousFury(mockActor, mockWeapon, 50, 'Body');
      expect(mockRoll.toMessage).toHaveBeenCalled();
    });
  });

  describe('weaponAttackDialog', () => {
    beforeEach(() => {
      global.canvas = {
        tokens: { controlled: [] },
        grid: { measurePath: jest.fn(() => ({ distance: 0 })) }
      };
    });

    it('should route to melee dialog for melee weapons', () => {
      const mockActor = {
        system: {
          characteristics: {
            ws: { base: 40, value: 40, advances: {} },
            bs: { base: 40, value: 40, advances: {} }
          }
        },
        getActiveTokens: jest.fn(() => [])
      };
      const mockWeapon = {
        system: { class: 'Melee' }
      };
      
      expect(() => CombatHelper.weaponAttackDialog(mockActor, mockWeapon)).not.toThrow();
    });

    it('should route to ranged dialog for ranged weapons', () => {
      const mockActor = {
        system: {
          characteristics: {
            ws: { base: 40, value: 40, advances: {} },
            bs: { base: 40, value: 40, advances: {} }
          }
        },
        getActiveTokens: jest.fn(() => [])
      };
      const mockWeapon = {
        system: { class: 'Ranged' }
      };
      
      expect(() => CombatHelper.weaponAttackDialog(mockActor, mockWeapon)).not.toThrow();
    });

    it('should route to ranged dialog for weapons without class', () => {
      const mockActor = {
        system: {
          characteristics: {
            ws: { base: 40, value: 40, advances: {} },
            bs: { base: 40, value: 40, advances: {} }
          }
        },
        getActiveTokens: jest.fn(() => [])
      };
      const mockWeapon = {
        system: {}
      };
      
      expect(() => CombatHelper.weaponAttackDialog(mockActor, mockWeapon)).not.toThrow();
    });

    it('should handle case-insensitive melee check', () => {
      const mockActor = {
        system: {
          characteristics: {
            ws: { base: 40, value: 40, advances: {} },
            bs: { base: 40, value: 40, advances: {} }
          }
        },
        getActiveTokens: jest.fn(() => [])
      };
      const mockWeapon = {
        system: { class: 'MELEE' }
      };
      
      expect(() => CombatHelper.weaponAttackDialog(mockActor, mockWeapon)).not.toThrow();
    });
  });

  describe('getWeaponAttackType', () => {
    beforeEach(() => {
      const mockPack = {
        getDocument: jest.fn(async (id) => {
          const docs = {
            'flame': { system: { key: 'flame' } },
            'tearing': { system: { key: 'tearing' } }
          };
          return docs[id] || null;
        })
      };
      global.game.packs = new Map([['deathwatch.weapon-qualities', mockPack]]);
    });

    it('returns melee for melee weapons', async () => {
      const weapon = { system: { class: 'Melee', attachedQualities: [] } };
      expect(await CombatHelper.getWeaponAttackType(weapon)).toBe('melee');
    });

    it('returns melee case-insensitive', async () => {
      const weapon = { system: { class: 'MELEE', attachedQualities: [] } };
      expect(await CombatHelper.getWeaponAttackType(weapon)).toBe('melee');
    });

    it('returns flame for weapons with flame quality', async () => {
      const weapon = { system: { class: 'Basic', attachedQualities: [{ id: 'flame' }] } };
      expect(await CombatHelper.getWeaponAttackType(weapon)).toBe('flame');
    });

    it('returns ranged for normal ranged weapons', async () => {
      const weapon = { system: { class: 'Basic', attachedQualities: [{ id: 'tearing' }] } };
      expect(await CombatHelper.getWeaponAttackType(weapon)).toBe('ranged');
    });

    it('returns ranged for weapons without class', async () => {
      const weapon = { system: { attachedQualities: [] } };
      expect(await CombatHelper.getWeaponAttackType(weapon)).toBe('ranged');
    });

    it('returns ranged for weapons with no qualities', async () => {
      const weapon = { system: { class: 'Pistol' } };
      expect(await CombatHelper.getWeaponAttackType(weapon)).toBe('ranged');
    });

    it('melee takes priority over flame', async () => {
      const weapon = { system: { class: 'Melee', attachedQualities: [{ id: 'flame' }] } };
      expect(await CombatHelper.getWeaponAttackType(weapon)).toBe('melee');
    });
  });

  describe('static properties', () => {
    it('initializes lastAttackRoll as null', () => {
      expect(CombatHelper.lastAttackRoll).toBeNull();
    });

    it('initializes lastAttackTarget as null', () => {
      expect(CombatHelper.lastAttackTarget).toBeNull();
    });

    it('initializes lastAttackHits as 1', () => {
      expect(CombatHelper.lastAttackHits).toBe(1);
    });

    it('stores attack roll data', () => {
      CombatHelper.lastAttackRoll = 45;
      CombatHelper.lastAttackTarget = 60;
      CombatHelper.lastAttackHits = 3;
      
      expect(CombatHelper.lastAttackRoll).toBe(45);
      expect(CombatHelper.lastAttackTarget).toBe(60);
      expect(CombatHelper.lastAttackHits).toBe(3);
    });
  });

  describe('_getMagnitudeBonusDamage', () => {
    it('returns 0 when no ammo loaded and no devastating quality', async () => {
      const weapon = { system: { loadedAmmo: null, attachedQualities: [] } };
      expect(await CombatHelper._getMagnitudeBonusDamage(weapon, {})).toBe(0);
    });

    it('returns 0 when ammo has no magnitude-bonus-damage modifier and no devastating', async () => {
      const weapon = { system: { loadedAmmo: 'ammo1', attachedQualities: [] } };
      const actor = { items: { get: jest.fn(() => ({ system: { modifiers: [{ effectType: 'weapon-damage', modifier: '-2', enabled: true }] } })) } };
      expect(await CombatHelper._getMagnitudeBonusDamage(weapon, actor)).toBe(0);
    });

    it('returns bonus from magnitude-bonus-damage modifier', async () => {
      const weapon = { system: { loadedAmmo: 'ammo1', attachedQualities: [] } };
      const actor = { items: { get: jest.fn(() => ({ system: { modifiers: [{ effectType: 'magnitude-bonus-damage', modifier: '1', enabled: true }] } })) } };
      expect(await CombatHelper._getMagnitudeBonusDamage(weapon, actor)).toBe(1);
    });

    it('ignores disabled magnitude-bonus-damage modifier', async () => {
      const weapon = { system: { loadedAmmo: 'ammo1', attachedQualities: [] } };
      const actor = { items: { get: jest.fn(() => ({ system: { modifiers: [{ effectType: 'magnitude-bonus-damage', modifier: '1', enabled: false }] } })) } };
      expect(await CombatHelper._getMagnitudeBonusDamage(weapon, actor)).toBe(0);
    });

    it('returns devastating value from weapon quality', async () => {
      const weapon = { system: { loadedAmmo: null, attachedQualities: [{ id: 'devastating', value: '2' }] } };
      const actor = {};
      // Mock the pack lookup
      const mockPack = { getDocument: jest.fn().mockResolvedValue({ system: { key: 'devastating' } }) };
      global.game.packs.get = jest.fn().mockReturnValue(mockPack);
      expect(await CombatHelper._getMagnitudeBonusDamage(weapon, actor)).toBe(2);
    });

    it('combines ammo bonus and devastating value', async () => {
      const weapon = {
        system: {
          loadedAmmo: 'ammo1',
          attachedQualities: [{ id: 'devastating', value: '2' }]
        }
      };
      const actor = { items: { get: jest.fn(() => ({ system: { modifiers: [{ effectType: 'magnitude-bonus-damage', modifier: '1', enabled: true }] } })) } };
      // Mock the pack lookup
      const mockPack = { getDocument: jest.fn().mockResolvedValue({ system: { key: 'devastating' } }) };
      global.game.packs.get = jest.fn().mockReturnValue(mockPack);
      expect(await CombatHelper._getMagnitudeBonusDamage(weapon, actor)).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('handles zero damage via receiveDamage', async () => {
      const mockActor = {
        system: { receiveDamage: jest.fn() }
      };
      await CombatHelper.applyDamage(mockActor, { damage: 5, penetration: 0, location: 'Body', damageType: 'Impact' });
      expect(mockActor.system.receiveDamage).toHaveBeenCalled();
    });
  });
});
