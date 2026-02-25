import { jest } from '@jest/globals';
import './setup.mjs';
import { CombatHelper } from '../src/module/helpers/combat.mjs';
import { RANGE_MODIFIERS, AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from '../src/module/helpers/constants.mjs';

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
    let mockActor;

    beforeEach(() => {
      mockActor = {
        items: {
          find: jest.fn()
        }
      };
    });

    it('returns 0 if no armor equipped', () => {
      mockActor.items.find.mockReturnValue(null);
      const result = CombatHelper.getArmorValue(mockActor, 'Head');
      expect(result).toBe(0);
    });

    it('returns head armor value', () => {
      mockActor.items.find.mockReturnValue({
        type: 'armor',
        system: { equipped: true, head: 8 }
      });
      const result = CombatHelper.getArmorValue(mockActor, 'Head');
      expect(result).toBe(8);
    });

    it('returns body armor value', () => {
      mockActor.items.find.mockReturnValue({
        type: 'armor',
        system: { equipped: true, body: 10 }
      });
      const result = CombatHelper.getArmorValue(mockActor, 'Body');
      expect(result).toBe(10);
    });

    it('returns right arm armor value', () => {
      mockActor.items.find.mockReturnValue({
        type: 'armor',
        system: { equipped: true, right_arm: 7 }
      });
      const result = CombatHelper.getArmorValue(mockActor, 'Right Arm');
      expect(result).toBe(7);
    });

    it('returns 0 for unknown location', () => {
      mockActor.items.find.mockReturnValue({
        type: 'armor',
        system: { equipped: true }
      });
      const result = CombatHelper.getArmorValue(mockActor, 'Unknown');
      expect(result).toBe(0);
    });
  });

  describe('applyDamage', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        id: 'actor123',
        name: 'Test Marine',
        system: {
          wounds: { value: 5, max: 20 }
        },
        update: jest.fn(),
        items: {
          find: jest.fn(() => null)
        }
      };
    });

    it('applies damage after armor reduction', async () => {
      CombatHelper.getArmorValue = jest.fn(() => 8);
      await CombatHelper.applyDamage(mockActor, 15, 2, 'Body', 'Impact');

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.wounds.value': 14
      });
    });

    it('does not apply damage if armor absorbs all', async () => {
      CombatHelper.getArmorValue = jest.fn(() => 8);
      await CombatHelper.applyDamage(mockActor, 5, 0, 'Body', 'Impact');

      expect(mockActor.update).not.toHaveBeenCalled();
    });

    it('creates chat message for damage', async () => {
      CombatHelper.getArmorValue = jest.fn(() => 8);
      await CombatHelper.applyDamage(mockActor, 15, 2, 'Body', 'Impact');

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('detects critical damage', async () => {
      jest.clearAllMocks();
      CombatHelper.getArmorValue = jest.fn(() => 8);
      mockActor.system.wounds.value = 18;
      await CombatHelper.applyDamage(mockActor, 20, 2, 'Body', 'Energy');

      const chatCall = global.ChatMessage.create.mock.calls[0][0];
      expect(chatCall.content).toContain('CRITICAL DAMAGE');
      expect(chatCall.content).toContain('Apply Critical Effect');
    });

    it('handles penetration correctly', async () => {
      CombatHelper.getArmorValue = jest.fn(() => 10);
      await CombatHelper.applyDamage(mockActor, 15, 5, 'Body', 'Impact');

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.wounds.value': 15
      });
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

  describe('edge cases', () => {
    it('handles zero damage', async () => {
      CombatHelper.getArmorValue = jest.fn(() => 10);
      const mockActor = {
        name: 'Test',
        system: { wounds: { value: 5, max: 20 } },
        update: jest.fn(),
        items: { find: jest.fn(() => null) }
      };
      
      await CombatHelper.applyDamage(mockActor, 5, 0, 'Body', 'Impact');
      expect(mockActor.update).not.toHaveBeenCalled();
    });

    it('handles zero armor', async () => {
      CombatHelper.getArmorValue = jest.fn(() => 0);
      const mockActor = {
        name: 'Test',
        system: { wounds: { value: 5, max: 20 } },
        update: jest.fn(),
        items: { find: jest.fn(() => null) }
      };
      
      await CombatHelper.applyDamage(mockActor, 10, 0, 'Body', 'Impact');
      expect(mockActor.update).toHaveBeenCalledWith({ 'system.wounds.value': 15 });
    });

    it('handles high penetration', async () => {
      CombatHelper.getArmorValue = jest.fn(() => 5);
      const mockActor = {
        name: 'Test',
        system: { wounds: { value: 5, max: 20 } },
        update: jest.fn(),
        items: { find: jest.fn(() => null) }
      };
      
      await CombatHelper.applyDamage(mockActor, 10, 10, 'Body', 'Impact');
      expect(mockActor.update).toHaveBeenCalledWith({ 'system.wounds.value': 15 });
    });

    it('handles exactly max wounds', async () => {
      jest.clearAllMocks();
      CombatHelper.getArmorValue = jest.fn(() => 0);
      const mockActor = {
        id: 'test',
        name: 'Test',
        system: { wounds: { value: 15, max: 20 } },
        update: jest.fn(),
        items: { find: jest.fn(() => null) }
      };
      
      await CombatHelper.applyDamage(mockActor, 5, 0, 'Body', 'Impact');
      const chatCall = global.ChatMessage.create.mock.calls[0][0];
      expect(chatCall.content).not.toContain('CRITICAL DAMAGE');
    });
  });
});
