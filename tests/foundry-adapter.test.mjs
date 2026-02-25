import { jest } from '@jest/globals';
import './setup.mjs';
import { CombatHelper } from '../src/module/helpers/combat.mjs';
import { CanvasHelper, FoundryAdapter } from '../src/module/helpers/foundry-adapter.mjs';

describe('CombatHelper', () => {
  describe('getTokenDistance', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns null if token1 is null', () => {
      const result = CombatHelper.getTokenDistance(null, {});
      expect(result).toBeNull();
    });

    it('returns null if token2 is null', () => {
      const result = CombatHelper.getTokenDistance({}, null);
      expect(result).toBeNull();
    });

    it('returns null if tokens are on different scenes', () => {
      const token1 = { scene: { id: 'scene1' } };
      const token2 = { scene: { id: 'scene2' } };
      
      const result = CombatHelper.getTokenDistance(token1, token2);
      expect(result).toBeNull();
    });

    it('returns distance from CanvasHelper for same scene tokens', () => {
      const token1 = { scene: { id: 'scene1' }, center: { x: 0, y: 0 } };
      const token2 = { scene: { id: 'scene1' }, center: { x: 10, y: 10 } };
      
      jest.spyOn(CanvasHelper, 'measureDistance').mockReturnValue(14.14);
      
      const result = CombatHelper.getTokenDistance(token1, token2);
      
      expect(result).toBe(14.14);
      expect(CanvasHelper.measureDistance).toHaveBeenCalledWith(token1, token2);
    });
  });

  describe('clearJam', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('shows notification if weapon not jammed', async () => {
      const weapon = { name: 'Bolter', system: { jammed: false } };
      const actor = { system: { characteristics: { bs: { value: 40, advances: 10 } } } };
      
      jest.spyOn(FoundryAdapter, 'showNotification').mockImplementation(() => {});
      
      await CombatHelper.clearJam(actor, weapon);
      
      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith('info', 'Bolter is not jammed.');
    });

    it('clears jam on success', async () => {
      const weapon = { 
        name: 'Bolter', 
        system: { jammed: true, loadedAmmo: 'ammo1' }
      };
      const loadedAmmo = { system: { capacity: { value: 10 } } };
      const actor = { 
        system: { characteristics: { bs: { value: 40, advances: 10 } } },
        items: { get: () => loadedAmmo }
      };
      const roll = { total: 45 };
      
      jest.spyOn(FoundryAdapter, 'evaluateRoll').mockResolvedValue(roll);
      jest.spyOn(FoundryAdapter, 'updateDocument').mockResolvedValue({});
      jest.spyOn(FoundryAdapter, 'showNotification').mockImplementation(() => {});
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'sendRollToChat').mockResolvedValue({});
      
      await CombatHelper.clearJam(actor, weapon);
      
      expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(weapon, { "system.jammed": false });
      expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(loadedAmmo, { "system.capacity.value": 0 });
      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith('info', 'Bolter jam cleared! Weapon needs reloading.');
    });

    it('fails to clear jam on failure', async () => {
      const weapon = { name: 'Bolter', system: { jammed: true } };
      const actor = { 
        system: { characteristics: { bs: { value: 40, advances: 10 } } },
        items: { get: () => null }
      };
      const roll = { total: 55 };
      
      jest.spyOn(FoundryAdapter, 'evaluateRoll').mockResolvedValue(roll);
      jest.spyOn(FoundryAdapter, 'showNotification').mockImplementation(() => {});
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'sendRollToChat').mockResolvedValue({});
      
      await CombatHelper.clearJam(actor, weapon);
      
      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith('warn', 'Failed to clear jam on Bolter.');
    });
  });

  describe('applyDamage', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('applies damage and shows notification', async () => {
      const targetActor = {
        id: 'actor1',
        name: 'Marine',
        system: { wounds: { value: 10, max: 20 } },
        items: { find: () => null }
      };
      
      jest.spyOn(FoundryAdapter, 'updateDocument').mockResolvedValue({});
      jest.spyOn(FoundryAdapter, 'showNotification').mockImplementation(() => {});
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue({});
      
      await CombatHelper.applyDamage(targetActor, 10, 0, 'Body');
      
      expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(targetActor, { "system.wounds.value": 20 });
      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith('info', 'Marine takes 10 wounds!');
      expect(FoundryAdapter.createChatMessage).toHaveBeenCalled();
    });

    it('shows critical damage warning', async () => {
      const targetActor = {
        id: 'actor1',
        name: 'Marine',
        system: { wounds: { value: 18, max: 20 } },
        items: { find: () => null }
      };
      
      jest.spyOn(FoundryAdapter, 'updateDocument').mockResolvedValue({});
      jest.spyOn(FoundryAdapter, 'showNotification').mockImplementation(() => {});
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue({});
      
      await CombatHelper.applyDamage(targetActor, 5, 0, 'Head');
      
      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith('warn', 'Marine is taking CRITICAL DAMAGE!');
    });

    it('shows armor absorb message', async () => {
      const armor = { type: 'armor', system: { equipped: true, body: 10 } };
      const targetActor = {
        name: 'Marine',
        system: { wounds: { value: 10, max: 20 } },
        items: { find: () => armor }
      };
      
      jest.spyOn(FoundryAdapter, 'showNotification').mockImplementation(() => {});
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue({});
      
      await CombatHelper.applyDamage(targetActor, 5, 0, 'Body');
      
      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith('info', "Marine's armor absorbs all damage!");
    });
  });

  describe('rollRighteousFury', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns true on confirmed fury', async () => {
      const actor = {};
      const weapon = { name: 'Bolter' };
      const roll = { total: 30 };
      
      jest.spyOn(FoundryAdapter, 'evaluateRoll').mockResolvedValue(roll);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'sendRollToChat').mockResolvedValue({});
      
      const result = await CombatHelper.rollRighteousFury(actor, weapon, 50, 'Body');
      
      expect(result).toBe(true);
      expect(FoundryAdapter.sendRollToChat).toHaveBeenCalled();
    });

    it('returns false on failed fury', async () => {
      const actor = {};
      const weapon = { name: 'Bolter' };
      const roll = { total: 60 };
      
      jest.spyOn(FoundryAdapter, 'evaluateRoll').mockResolvedValue(roll);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'sendRollToChat').mockResolvedValue({});
      
      const result = await CombatHelper.rollRighteousFury(actor, weapon, 50, 'Body');
      
      expect(result).toBe(false);
    });
  });
});
