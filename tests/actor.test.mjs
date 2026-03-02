import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchActor } from '../src/module/documents/actor.mjs';

describe('DeathwatchActor', () => {
  let mockActor;

  beforeEach(() => {
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

  describe('_prepareCharacterData', () => {
    it('skips if actor type is not character', () => {
      mockActor.type = 'npc';
      const initialValue = mockActor.system.characteristics.ws.value;
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.value).toBe(initialValue);
    });

    it('stores base value if not already stored', () => {
      mockActor.system.characteristics.ws.base = undefined;
      mockActor.system.characteristics.ws.value = 40;
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.base).toBe(40);
    });

    it('calculates characteristic mod correctly', () => {
      mockActor.system.characteristics.ws.base = 45;
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.skills.awareness.modifierTotal).toBe(10);
    });

    it('applies initiative modifiers', () => {
      mockActor.system.modifiers = [{
        name: 'Initiative Bonus',
        modifier: 5,
        effectType: 'initiative',
        enabled: true
      }];
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
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
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.characteristics.ws.value).toBe(50); // 40 + 5 + 5
    });

    it('calculates movement based on agility bonus', () => {
      mockActor.system.characteristics.ag.base = 50;
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.movement).toEqual({
        half: 5,
        full: 10,
        charge: 15,
        run: 30
      });
    });

    it('calculates movement with different agility bonuses', () => {
      mockActor.system.characteristics.ag.base = 30;
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.movement.half).toBe(3);
      expect(mockActor.system.movement.full).toBe(6);
      expect(mockActor.system.movement.charge).toBe(9);
      expect(mockActor.system.movement.run).toBe(18);
    });

    it('handles zero agility bonus for movement', () => {
      mockActor.system.characteristics.ag.base = 5;
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.movement).toEqual({
        half: 0,
        full: 0,
        charge: 0,
        run: 0
      });
    });

    it('initializes fatePoints if not present', () => {
      delete mockActor.system.fatePoints;
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.fatePoints).toEqual({ value: 0, max: 0 });
    });

    it('preserves existing fatePoints values', () => {
      mockActor.system.fatePoints = { value: 2, max: 3 };
      mockActor._prepareCharacterData(mockActor);
      expect(mockActor.system.fatePoints).toEqual({ value: 2, max: 3 });
    });
  });

  describe('_prepareNpcData', () => {
    it('skips if actor type is not npc', () => {
      mockActor.type = 'character';
      mockActor._prepareNpcData(mockActor);
      expect(mockActor.system.xp).toBeUndefined();
    });

    it('calculates xp for npc', () => {
      mockActor.type = 'npc';
      mockActor.system.cr = 5;
      mockActor._prepareNpcData(mockActor);
      expect(mockActor.system.xp).toBe(2500);
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
    it('sets actorLink for character type', async () => {
      const data = { type: 'character' };
      const options = {};
      const user = {};
      mockActor.updateSource = jest.fn();
      
      await mockActor._preCreate(data, options, user);
      
      expect(mockActor.updateSource).toHaveBeenCalledWith({
        'prototypeToken.actorLink': true
      });
    });

    it('does not set actorLink for npc type', async () => {
      const data = { type: 'npc' };
      const options = {};
      const user = {};
      mockActor.updateSource = jest.fn();
      
      await mockActor._preCreate(data, options, user);
      
      expect(mockActor.updateSource).not.toHaveBeenCalled();
    });
  });
});
