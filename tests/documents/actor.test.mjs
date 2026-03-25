import { jest } from '@jest/globals';
import '../setup.mjs';
import { DeathwatchActor } from '../../src/module/documents/actor.mjs';
import DeathwatchCharacter from '../../src/module/data/actor/character.mjs';
import DeathwatchNPC from '../../src/module/data/actor/npc.mjs';

/**
 * Helper: creates a DeathwatchCharacter DataModel wired to a mock actor,
 * calls prepareDerivedData(), then syncs derived values back to actor.system.
 */
function prepareCharacterData(actor) {
  const model = new DeathwatchCharacter();
  Object.assign(model, actor.system);
  model.parent = actor;
  model.prepareDerivedData();
  Object.assign(actor.system, model);
}

describe('DeathwatchActor', () => {
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActor = new DeathwatchActor({
      name: 'Test Marine',
      type: 'character',
      system: {
        characteristics: {
          ws: { base: 40, value: 40, mod: 4, advances: { simple: false, intermediate: false, trained: false, expert: false } },
          bs: { base: 45, value: 45, mod: 4, advances: { simple: false, intermediate: false, trained: false, expert: false } },
          str: { base: 50, value: 50, mod: 5, advances: { simple: false, intermediate: false, trained: false, expert: false } },
          ag: { base: 35, value: 35, mod: 3, advances: { simple: false, intermediate: false, trained: false, expert: false } }
        },
        skills: {
          awareness: { trained: true, modifier: 0 }
        },
        modifiers: []
      },
      flags: { deathwatch: {} }
    });
    mockActor.items = [];
  });

  describe('prepareData', () => {
    it('calls super.prepareData', () => {
      const prepareDataSpy = jest.spyOn(mockActor, 'prepareData');
      mockActor.prepareData();
      expect(prepareDataSpy).toHaveBeenCalled();
      prepareDataSpy.mockRestore();
    });
  });

  describe('Character prepareDerivedData', () => {
    it('skips if model is not character type', () => {
      // NPC model now has its own characteristic logic
      const npc = new DeathwatchNPC();
      npc.characteristics = {
        ws: { base: 30, value: 30 },
        bs: { base: 30, value: 30 },
        str: { base: 30, value: 30 },
        tg: { base: 30, value: 30 },
        ag: { base: 30, value: 30 },
        int: { base: 30, value: 30 },
        per: { base: 30, value: 30 },
        wil: { base: 30, value: 30 },
        fs: { base: 30, value: 30 }
      };
      npc.modifiers = [];
      npc.skills = {};
      npc.wounds = { value: 0, base: 10, max: 10 };
      npc.fatigue = { value: 0, max: 0 };
      npc.parent = { items: [], effects: undefined, system: npc };
      npc.prepareDerivedData();
      // NPC characteristics are processed independently from character
      expect(npc.characteristics.ws.value).toBe(30);
    });

    it('stores base value if not already stored', () => {
      mockActor.system.characteristics.ws.base = undefined;
      mockActor.system.characteristics.ws.value = 40;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.base).toBe(40);
    });

    it('calculates characteristic mod correctly', () => {
      mockActor.system.characteristics.ws.base = 45;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.mod).toBe(4);
    });

    it('applies actor modifiers to characteristics', () => {
      mockActor.system.modifiers = [{
        name: 'Test Modifier',
        modifier: 10,
        effectType: 'characteristic',
        valueAffected: 'ws',
        enabled: true
      }];
      mockActor.system.characteristics.ws.base = 40;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.value).toBe(50);
      expect(mockActor.system.characteristics.ws.mod).toBe(5);
    });

    it('applies item modifiers from equipped items', () => {
      mockActor.items = [{
        name: 'Power Armor',
        type: 'armor',
        system: {
          equipped: true,
          modifiers: [{
            name: 'Armor Bonus',
            modifier: 5,
            effectType: 'characteristic',
            valueAffected: 'str',
            enabled: true
          }]
        }
      }];
      mockActor.system.characteristics.str.base = 50;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.str.value).toBe(55);
    });

    it('ignores modifiers from unequipped items', () => {
      mockActor.items = [{
        name: 'Unequipped Armor',
        type: 'armor',
        system: {
          equipped: false,
          modifiers: [{
            name: 'Armor Bonus',
            modifier: 10,
            effectType: 'characteristic',
            valueAffected: 'str',
            enabled: true
          }]
        }
      }];
      mockActor.system.characteristics.str.base = 50;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.str.value).toBe(50);
    });

    it('ignores disabled modifiers', () => {
      mockActor.system.modifiers = [{
        name: 'Disabled Modifier',
        modifier: 10,
        effectType: 'characteristic',
        valueAffected: 'ws',
        enabled: false
      }];
      mockActor.system.characteristics.ws.base = 40;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.value).toBe(40);
    });

    it('applies modifiers from armor histories on equipped armor', () => {
      const historyId = 'history-123';
      mockActor.items = [
        {
          name: 'Power Armor',
          type: 'armor',
          system: {
            equipped: true,
            attachedHistories: [historyId]
          }
        }
      ];
      mockActor.items.get = jest.fn((id) => {
        if (id === historyId) {
          return {
            name: 'Armor History',
            system: {
              modifiers: [{
                name: 'History Bonus',
                modifier: 5,
                effectType: 'characteristic',
                valueAffected: 'ag',
                enabled: true
              }]
            }
          };
        }
        return null;
      });
      mockActor.system.characteristics.ag.base = 35;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ag.value).toBe(40);
    });

    it('applies skill modifiers', () => {
      mockActor.system.modifiers = [{
        name: 'Skill Bonus',
        modifier: 10,
        effectType: 'skill',
        valueAffected: 'awareness',
        enabled: true
      }];
      prepareCharacterData(mockActor);
      expect(mockActor.system.skills.awareness.modifierTotal).toBe(10);
    });

    it('applies initiative modifiers', () => {
      mockActor.system.modifiers = [{
        name: 'Initiative Bonus',
        modifier: 5,
        effectType: 'initiative',
        enabled: true
      }];
      prepareCharacterData(mockActor);
      expect(mockActor.system.initiativeBonus).toBe(5);
    });

    it('combines multiple modifiers', () => {
      mockActor.system.modifiers = [
        {
          name: 'Modifier 1',
          modifier: 5,
          effectType: 'characteristic',
          valueAffected: 'ws',
          enabled: true
        },
        {
          name: 'Modifier 2',
          modifier: 10,
          effectType: 'characteristic',
          valueAffected: 'ws',
          enabled: true
        }
      ];
      mockActor.system.characteristics.ws.base = 40;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.value).toBe(55);
    });

    it('tracks applied modifiers with source', () => {
      mockActor.system.modifiers = [{
        name: 'Test Modifier',
        modifier: 10,
        effectType: 'characteristic',
        valueAffected: 'ws',
        enabled: true
      }];
      mockActor.system.characteristics.ws.base = 40;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.modifiers).toHaveLength(1);
      expect(mockActor.system.characteristics.ws.modifiers[0]).toEqual({
        name: 'Test Modifier',
        value: 10,
        source: undefined
      });
    });

    it('applies characteristic advances from checkboxes', () => {
      mockActor.system.characteristics.ws.base = 40;
      mockActor.system.characteristics.ws.advances.simple = true;
      mockActor.system.characteristics.ws.advances.intermediate = true;
      prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.value).toBe(50); // 40 + 5 + 5
    });

    it('calculates movement based on agility bonus', () => {
      mockActor.system.characteristics.ag.base = 50;
      prepareCharacterData(mockActor);
      expect(mockActor.system.movement).toEqual({
        half: 5,
        full: 10,
        charge: 15,
        run: 30,
        bonus: 0,
        modifiers: []
      });
    });

    it('calculates movement with different agility bonuses', () => {
      mockActor.system.characteristics.ag.base = 30;
      prepareCharacterData(mockActor);
      expect(mockActor.system.movement.half).toBe(3);
      expect(mockActor.system.movement.full).toBe(6);
      expect(mockActor.system.movement.charge).toBe(9);
      expect(mockActor.system.movement.run).toBe(18);
    });

    it('handles zero agility bonus for movement', () => {
      mockActor.system.characteristics.ag.base = 5;
      prepareCharacterData(mockActor);
      expect(mockActor.system.movement).toEqual({
        half: 0,
        full: 0,
        charge: 0,
        run: 0,
        bonus: 0,
        modifiers: []
      });
    });

    it('initializes fatePoints if not present', () => {
      delete mockActor.system.fatePoints;
      prepareCharacterData(mockActor);
      expect(mockActor.system.fatePoints).toEqual({ value: 0, max: 0 });
    });

    it('preserves existing fatePoints values', () => {
      mockActor.system.fatePoints = { value: 2, max: 3 };
      prepareCharacterData(mockActor);
      expect(mockActor.system.fatePoints).toEqual({ value: 2, max: 3 });
    });

    it('initializes renown to 0 if not present', () => {
      delete mockActor.system.renown;
      prepareCharacterData(mockActor);
      expect(mockActor.system.renown).toBe(0);
    });

    it('preserves existing renown value', () => {
      mockActor.system.renown = 50;
      prepareCharacterData(mockActor);
      expect(mockActor.system.renown).toBe(50);
    });

    it('applies fatigue modifiers based on toughness bonus', () => {
      mockActor.system.characteristics.tg = { base: 40, value: 40, mod: 4 };
      mockActor.system.fatigue = { value: 2, max: 0 };
      prepareCharacterData(mockActor);
      expect(mockActor.system.fatigue.max).toBe(4);
      expect(mockActor.system.fatigue.penalty).toBe(-10);
      expect(mockActor.system.fatigue.unconscious).toBe(false);
    });

    it('marks character unconscious when fatigue exceeds TB', () => {
      mockActor.system.characteristics.tg = { base: 40, value: 40, mod: 4 };
      mockActor.system.fatigue = { value: 5, max: 0 };
      prepareCharacterData(mockActor);
      expect(mockActor.system.fatigue.unconscious).toBe(true);
    });

    it('applies no penalty when fatigue is 0', () => {
      mockActor.system.characteristics.tg = { base: 40, value: 40, mod: 4 };
      mockActor.system.fatigue = { value: 0, max: 0 };
      prepareCharacterData(mockActor);
      expect(mockActor.system.fatigue.penalty).toBe(0);
    });
  });

  describe('NPC prepareDerivedData', () => {
    it('applies characteristic modifiers for npc', () => {
      const npc = new DeathwatchNPC();
      npc.characteristics = {
        ws: { base: 40, value: 40 },
        bs: { base: 30, value: 30 },
        str: { base: 30, value: 30 },
        tg: { base: 40, value: 40 },
        ag: { base: 35, value: 35 },
        int: { base: 30, value: 30 },
        per: { base: 30, value: 30 },
        wil: { base: 30, value: 30 },
        fs: { base: 30, value: 30 }
      };
      npc.modifiers = [{
        name: 'Test',
        modifier: 10,
        effectType: 'characteristic',
        valueAffected: 'ws',
        enabled: true
      }];
      npc.skills = {};
      npc.wounds = { value: 0, base: 15, max: 15 };
      npc.fatigue = { value: 0, max: 0 };
      npc.parent = { items: [], effects: undefined, system: npc };
      npc.prepareDerivedData();
      expect(npc.characteristics.ws.value).toBe(50);
    });

    it('calculates movement for npc', () => {
      const npc = new DeathwatchNPC();
      npc.characteristics = {
        ws: { base: 30, value: 30 },
        bs: { base: 30, value: 30 },
        str: { base: 30, value: 30 },
        tg: { base: 30, value: 30 },
        ag: { base: 40, value: 40 },
        int: { base: 30, value: 30 },
        per: { base: 30, value: 30 },
        wil: { base: 30, value: 30 },
        fs: { base: 30, value: 30 }
      };
      npc.modifiers = [];
      npc.skills = {};
      npc.wounds = { value: 0, base: 10, max: 10 };
      npc.fatigue = { value: 0, max: 0 };
      npc.parent = { items: [], effects: undefined, system: npc };
      npc.prepareDerivedData();
      expect(npc.movement.half).toBe(4);
      expect(npc.movement.full).toBe(8);
    });
  });

  describe('getRollData', () => {
    it('returns roll data object', () => {
      const result = mockActor.getRollData();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('_getCharacterRollData', () => {
    it('skips if actor type is not character', () => {
      mockActor.type = 'npc';
      const data = {};
      mockActor._getCharacterRollData(data);
      expect(data.agBonus).toBeUndefined();
    });

    it('adds agility bonus for initiative', () => {
      mockActor.type = 'character';
      const data = {
        characteristics: {
          ag: { value: 45, bonus: 4 }
        }
      };
      mockActor._getCharacterRollData(data);
      expect(data.agBonus).toBe(4);
    });

    it('calculates agility bonus if not provided', () => {
      mockActor.type = 'character';
      const data = {
        characteristics: {
          ag: { value: 45 }
        }
      };
      mockActor._getCharacterRollData(data);
      expect(data.agBonus).toBe(4);
    });

    it('adds initiative bonus from modifiers', () => {
      mockActor.type = 'character';
      const data = {
        characteristics: { ag: { value: 35 } },
        initiativeBonus: 5
      };
      mockActor._getCharacterRollData(data);
      expect(data.initiativeBonus).toBe(5);
    });

    it('defaults initiative bonus to 0', () => {
      mockActor.type = 'character';
      const data = {
        characteristics: { ag: { value: 35 } }
      };
      mockActor._getCharacterRollData(data);
      expect(data.initiativeBonus).toBe(0);
    });
  });

  describe('_preCreate', () => {
    it('sets actorLink and token name for character type', async () => {
      const data = { type: 'character', name: 'Test Marine' };
      const options = {};
      const user = {};
      mockActor.updateSource = jest.fn();
      
      await mockActor._preCreate(data, options, user);
      
      expect(mockActor.updateSource).toHaveBeenCalledWith({
        'prototypeToken.name': 'Test Marine',
        'prototypeToken.displayName': 30,
        'prototypeToken.actorLink': true
      });
    });

    it('sets token name but not actorLink for npc type', async () => {
      const data = { type: 'npc', name: 'Ork Boy' };
      const options = {};
      const user = {};
      mockActor.updateSource = jest.fn();
      
      await mockActor._preCreate(data, options, user);
      
      expect(mockActor.updateSource).toHaveBeenCalledWith({
        'prototypeToken.name': 'Ork Boy',
        'prototypeToken.displayName': 20
      });
    });

    it('sets token name but not actorLink for enemy type', async () => {
      const data = { type: 'enemy', name: 'Genestealer' };
      const options = {};
      const user = {};
      mockActor.updateSource = jest.fn();
      
      await mockActor._preCreate(data, options, user);
      
      expect(mockActor.updateSource).toHaveBeenCalledWith({
        'prototypeToken.name': 'Genestealer',
        'prototypeToken.displayName': 20
      });
    });

    it('sets actorLink and token name for horde type', async () => {
      const data = { type: 'horde', name: 'Hormagaunt Horde' };
      const options = {};
      const user = {};
      mockActor.updateSource = jest.fn();
      
      await mockActor._preCreate(data, options, user);
      
      expect(mockActor.updateSource).toHaveBeenCalledWith({
        'prototypeToken.name': 'Hormagaunt Horde',
        'prototypeToken.displayName': 30,
        'prototypeToken.actorLink': true
      });
    });
  });
});
