import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchActor } from '../src/module/documents/actor.mjs';

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
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(13800); // 13000 base + 500 + 300
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
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(13000); // 13000 base only
    });

    it('combines talent costs with skill and characteristic advance costs', () => {
      const mockItems = [
        { type: 'talent', system: { cost: 500 } },
        { type: 'characteristic-advance', system: { cost: 250 } }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 20000, spent: 0 },
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
          skills: {
            awareness: {
              isBasic: true,
              characteristic: 'per',
              trained: true,
              mastered: false,
              expert: false,
              modifier: 0,
              costTrain: 200,
              costMaster: 300,
              costExpert: 800
            }
          }
        }
      });

      actor.items = mockItems;
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(13950); // 13000 + 500 + 250 + 200
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
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(13000); // 13000 base only
    });
  });
});
