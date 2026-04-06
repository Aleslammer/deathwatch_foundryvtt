import { jest } from '@jest/globals';
import { CombatHelper } from '../../src/module/helpers/combat/combat.mjs';
import { CanvasHelper, FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';

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
      const actor = { system: { characteristics: { bs: { value: 40, advances: { simple: true, intermediate: false, trained: false, expert: false } } } } };
      
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
        system: { characteristics: { bs: { value: 40, advances: { simple: true, intermediate: true, trained: false, expert: false } } } },
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
        system: { characteristics: { bs: { value: 40, advances: { simple: true, intermediate: true, trained: false, expert: false } } } },
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

    it('delegates to targetActor.system.receiveDamage', async () => {
      const targetActor = {
        system: { receiveDamage: jest.fn() }
      };
      const options = { damage: 10, penetration: 0, location: 'Body' };
      
      await CombatHelper.applyDamage(targetActor, options);
      
      expect(targetActor.system.receiveDamage).toHaveBeenCalledWith(options);
    });

    it('passes all options through to receiveDamage', async () => {
      const targetActor = {
        system: { receiveDamage: jest.fn() }
      };
      const options = { damage: 5, penetration: 0, location: 'Head', damageType: 'Energy', isShocking: true };
      
      await CombatHelper.applyDamage(targetActor, options);
      
      expect(targetActor.system.receiveDamage).toHaveBeenCalledWith(options);
    });

    it('works with armor absorb scenario', async () => {
      const targetActor = {
        system: { receiveDamage: jest.fn() }
      };
      
      await CombatHelper.applyDamage(targetActor, { damage: 5, penetration: 0, location: 'Body' });
      
      expect(targetActor.system.receiveDamage).toHaveBeenCalled();
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
