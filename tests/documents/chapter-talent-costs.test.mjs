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

describe('Chapter Talent Cost Overrides', () => {
  let actor;
  let mockChapter;
  let mockTalent;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockChapter = {
      _id: 'chapter123',
      name: 'Black Templars',
      type: 'chapter',
      system: {
        skillCosts: {},
        talentCosts: {
          'tal00000000001': 800,
          'tal00000000002': 800,
          'tal00000000003': 500
        }
      }
    };

    mockTalent = {
      _id: 'tal00000000001',
      name: 'Abhor the Witch',
      type: 'talent',
      flags: {
        core: {
          sourceId: 'Compendium.deathwatch.talents.tal00000000001'
        }
      },
      system: {
        cost: 1000,
        stackable: false,
        subsequentCost: 0,
        equipped: false,
        modifiers: []
      }
    };

    actor = new DeathwatchActor({
      name: 'Test Marine',
      type: 'character',
      system: {
        chapterId: 'chapter123',
        xp: { total: 13000, spent: 0 },
        characteristics: {
          ws: { value: 40, bonus: 4 },
          bs: { value: 40, bonus: 4 },
          str: { value: 40, bonus: 4 },
          tg: { value: 40, bonus: 4 },
          ag: { value: 40, bonus: 4 },
          int: { value: 40, bonus: 4 },
          per: { value: 40, bonus: 4 },
          wil: { value: 40, bonus: 4 },
          fs: { value: 40, bonus: 4 }
        },
        skills: {}
      }
    });

    actor.items = {
      get: jest.fn((id) => {
        if (id === 'chapter123') return mockChapter;
        if (id === 'tal00000000001') return mockTalent;
        return null;
      }),
      [Symbol.iterator]: function* () {
        yield mockChapter;
        yield mockTalent;
      }
    };
  });

  describe('Talent cost override application', () => {
    it('applies chapter talent cost override for matching talent', () => {
      prepareCharacterData(actor);
      
      // Base XP (12000) + chapter override cost (800) = 12800
      expect(actor.system.xp.spent).toBe(12800);
    });

    it('uses default talent cost when no chapter override exists', () => {
      mockTalent._id = 'tal99999999999';
      mockTalent.name = 'Some Other Talent';
      mockTalent.flags = { core: { sourceId: 'Compendium.deathwatch.talents.tal99999999999' } };
      
      prepareCharacterData(actor);
      
      // Base XP (12000) + default cost (1000) = 13000
      expect(actor.system.xp.spent).toBe(13000);
    });

    it('normalizes talent names with spaces for lookup', () => {
      mockTalent._id = 'tal00000000003';
      mockTalent.name = 'Hatred (Heretics)';
      mockTalent.system.cost = 1000;
      mockTalent.flags = { core: { sourceId: 'Compendium.deathwatch.talents.tal00000000003' } };
      
      prepareCharacterData(actor);
      
      // Should use chapter override 500 instead of 1000
      expect(actor.system.xp.spent).toBe(12500);
    });

    it('normalizes talent names with parentheses for lookup', () => {
      mockTalent._id = 'tal00000000004';
      mockTalent.name = 'Hatred (Mutants)';
      mockTalent.system.cost = 1000;
      mockTalent.flags = { core: { sourceId: 'Compendium.deathwatch.talents.tal00000000004' } };
      mockChapter.system.talentCosts['tal00000000004'] = 500;
      
      prepareCharacterData(actor);
      
      expect(actor.system.xp.spent).toBe(12500);
    });

    it('handles multiple talents with different costs', () => {
      const mockTalent2 = {
        _id: 'tal00000000002',
        name: 'Fearless',
        type: 'talent',
        flags: { core: { sourceId: 'Compendium.deathwatch.talents.tal00000000002' } },
        system: {
          cost: 1200,
          stackable: false,
          subsequentCost: 0,
          equipped: false,
          modifiers: []
        }
      };

      actor.items[Symbol.iterator] = function* () {
        yield mockChapter;
        yield mockTalent;
        yield mockTalent2;
      };

      prepareCharacterData(actor);
      
      // Base (12000) + Abhor the Witch (800) + Fearless (800) = 13600
      expect(actor.system.xp.spent).toBe(13600);
    });

    it('works when chapter has no talent cost overrides', () => {
      mockChapter.system.talentCosts = {};
      
      prepareCharacterData(actor);
      
      // Should use default cost
      expect(actor.system.xp.spent).toBe(13000);
    });

    it('works when actor has no chapter assigned', () => {
      actor.system.chapterId = null;
      actor.items.get = jest.fn(() => null);
      actor.items[Symbol.iterator] = function* () {
        yield mockTalent;
      };
      
      prepareCharacterData(actor);
      
      // Should use default cost
      expect(actor.system.xp.spent).toBe(13000);
    });

    it('handles stackable talents with chapter override on first instance', () => {
      mockTalent.system.stackable = true;
      mockTalent.system.subsequentCost = 500;
      
      const mockTalent2 = {
        _id: 'tal00000000002',
        name: 'Abhor the Witch',
        type: 'talent',
        flags: { core: { sourceId: 'Compendium.deathwatch.talents.tal00000000002' } },
        system: {
          cost: 1000,
          stackable: true,
          subsequentCost: 500,
          equipped: false,
          modifiers: []
        }
      };

      actor.items[Symbol.iterator] = function* () {
        yield mockChapter;
        yield mockTalent;
        yield mockTalent2;
      };

      prepareCharacterData(actor);
      
      // Base (12000) + first instance with override (800) + subsequent (500) = 13300
      expect(actor.system.xp.spent).toBe(13300);
    });
  });

  describe('Talent ID-based lookup', () => {
    it('uses talent _id for cost lookup', () => {
      mockTalent._id = 'tal00000000006';
      mockTalent.name = 'Inspire Wrath';
      mockTalent.flags = { core: { sourceId: 'Compendium.deathwatch.talents.tal00000000006' } };
      mockChapter.system.talentCosts['tal00000000006'] = 1000;
      
      prepareCharacterData(actor);
      
      expect(actor.system.xp.spent).toBe(13000);
    });

    it('ignores talent name when looking up cost', () => {
      mockTalent._id = 'tal00000000001';
      mockTalent.name = 'Different Name';
      mockTalent.flags = { core: { sourceId: 'Compendium.deathwatch.talents.tal00000000001' } };
      
      prepareCharacterData(actor);
      
      // Should match by ID and use 800
      expect(actor.system.xp.spent).toBe(12800);
    });

    it('works with talents that have parentheses in name', () => {
      mockTalent._id = 'tal00000000005';
      mockTalent.name = 'Hatred (Psykers)';
      mockTalent.flags = { core: { sourceId: 'Compendium.deathwatch.talents.tal00000000005' } };
      mockChapter.system.talentCosts['tal00000000005'] = 500;
      
      prepareCharacterData(actor);
      
      expect(actor.system.xp.spent).toBe(12500);
    });

    it('falls back to default cost when ID not in chapter costs', () => {
      mockTalent._id = 'tal99999999999';
      mockTalent.name = 'Unknown Talent';
      mockTalent.system.cost = 1200;
      mockTalent.flags = { core: { sourceId: 'Compendium.deathwatch.talents.tal99999999999' } };
      
      prepareCharacterData(actor);
      
      expect(actor.system.xp.spent).toBe(13200);
    });
  });
});
