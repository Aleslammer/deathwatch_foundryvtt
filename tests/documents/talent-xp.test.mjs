import { jest } from '@jest/globals';
import { DeathwatchActor } from '../../src/module/documents/actor.mjs';
import DeathwatchCharacter from '../../src/module/data/actor/character.mjs';

function prepareCharacterData(actor) {
  const model = new DeathwatchCharacter();
  Object.assign(model, actor.system);
  model.parent = actor;
  model.prepareDerivedData();
  Object.assign(actor.system, model);
}

describe('Talent XP Cost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('XP calculation with talents', () => {
    it('includes talent cost in spent XP', () => {
      const mockItems = [
        { type: 'talent', system: { cost: 500 } },
        { type: 'talent', system: { cost: 300 } }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 15000, spent: 0 },
          characteristics: {
            ws: { value: 40 },
            bs: { value: 40 },
            str: { value: 40 },
            tg: { value: 40 },
            ag: { value: 40 },
            int: { value: 40 },
            per: { value: 40 },
            wil: { value: 40 },
            fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(12800); // 12000 base + 500 + 300
    });

    it('handles talents with zero cost', () => {
      const mockItems = [
        { type: 'talent', system: { cost: 0 } }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 15000, spent: 0 },
          characteristics: {
            ws: { value: 40 },
            bs: { value: 40 },
            str: { value: 40 },
            tg: { value: 40 },
            ag: { value: 40 },
            int: { value: 40 },
            per: { value: 40 },
            wil: { value: 40 },
            fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(12000); // 12000 base only
    });

    it('combines talent costs with skill and characteristic advance costs', () => {
      const mockSpecialty = { type: 'specialty', system: { characteristicCosts: { ws: { simple: 250 } } } };
      const mockItems = [
        { type: 'talent', system: { cost: 500 } },
        mockSpecialty
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 20000, spent: 0 },
          specialtyId: 'spec1',
          characteristics: {
            ws: { value: 40, advances: { simple: true } },
            bs: { value: 40 },
            str: { value: 40 },
            tg: { value: 40 },
            ag: { value: 40 },
            int: { value: 40 },
            per: { value: 40 },
            wil: { value: 40 },
            fs: { value: 40 }
          },
          skills: {
            awareness: {
              isBasic: true,
              characteristic: 'per',
              trained: true,
              mastered: false,
              expert: false,
              modifier: 0,
              costTrain: 0,
              costMaster: 300,
              costExpert: 800
            }
          }
        }
      });

      actor.items = { [Symbol.iterator]: function* () { yield* mockItems; }, get: (id) => id === 'spec1' ? mockSpecialty : null };
      prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(12750); // 12000 + 500 + 250 + 0
    });

    it('ignores talents without cost field', () => {
      const mockItems = [
        { type: 'talent', system: {} }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 15000, spent: 0 },
          characteristics: {
            ws: { value: 40 },
            bs: { value: 40 },
            str: { value: 40 },
            tg: { value: 40 },
            ag: { value: 40 },
            int: { value: 40 },
            per: { value: 40 },
            wil: { value: 40 },
            fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(12000); // 12000 base only
    });
  });
});
