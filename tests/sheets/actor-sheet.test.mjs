import { jest } from '@jest/globals';
import { DeathwatchActorSheet } from '../../src/module/sheets/actor-sheet.mjs';
import { ItemListPreparer } from '../../src/module/sheets/shared/data-preparers/item-list-preparer.mjs';
import { CharacterDataPreparer } from '../../src/module/sheets/shared/data-preparers/character-data-preparer.mjs';

global.$ = jest.fn((selector) => ({
  find: jest.fn(() => ({
    val: jest.fn(),
    click: jest.fn(),
    change: jest.fn(),
    focus: jest.fn(),
    select: jest.fn()
  })),
  data: jest.fn(),
  parents: jest.fn(() => ({
    data: jest.fn()
  })),
  closest: jest.fn(() => ({
    data: jest.fn()
  }))
}));

global.duplicate = jest.fn((obj) => JSON.parse(JSON.stringify(obj)));

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

describe('DeathwatchActorSheet', () => {
  let mockActor;
  let sheet;

  beforeEach(() => {
    jest.clearAllMocks();

    mockActor = {
      _id: 'actor1',
      name: 'Test Marine',
      type: 'character',
      system: {
        characteristics: {
          ws: { value: 40, mod: 4 },
          bs: { value: 45, mod: 4 }
        },
        skills: {},
        modifiers: []
      },
      items: {
        get: jest.fn(),
        filter: jest.fn(() => []),
        map: jest.fn((fn) => [])
      },
      effects: [],
      toObject: jest.fn(() => ({
        type: 'character',
        system: mockActor.system,
        flags: {}
      })),
      getRollData: jest.fn(() => ({})),
      isOwner: true,
      hasCondition: jest.fn(() => false),
      getFlag: jest.fn(() => ({}))
    };

    sheet = new DeathwatchActorSheet(mockActor, {});
  });

  describe('defaultOptions', () => {
    it('returns merged default options', () => {
      const options = DeathwatchActorSheet.defaultOptions;
      expect(options.classes).toContain('deathwatch');
      expect(options.classes).toContain('sheet');
      expect(options.classes).toContain('actor');
      expect(options.width).toBe(1000);
      expect(options.height).toBe(800);
    });

    it('configures tabs', () => {
      const options = DeathwatchActorSheet.defaultOptions;
      expect(options.tabs).toHaveLength(1);
      expect(options.tabs[0].navSelector).toBe('.sheet-tabs');
      expect(options.tabs[0].contentSelector).toBe('.sheet-body');
      expect(options.tabs[0].initial).toBe('characteristics');
    });
  });

  describe('template', () => {
    it('returns template path based on actor type', () => {
      mockActor.type = 'character';
      const template = sheet.template;
      expect(template).toBe('systems/deathwatch/templates/actor/actor-character-sheet.html');
    });

    it('returns correct path for npc type', () => {
      mockActor.type = 'npc';
      sheet.actor = mockActor;
      const template = sheet.template;
      expect(template).toBe('systems/deathwatch/templates/actor/actor-npc-sheet.html');
    });
  });

  describe('_prepareItems', () => {
    it('categorizes weapons', () => {
      const context = {
        items: [
          { _id: 'w1', type: 'weapon', name: 'Bolter', img: 'icon.png', system: { equipped: false, loadedAmmo: null, modifiers: [] } }
        ]
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.weapons).toHaveLength(1);
      expect(context.weapons[0].name).toBe('Bolter');
    });

    it('categorizes armor', () => {
      const context = {
        items: [
          { _id: 'a1', type: 'armor', name: 'Power Armor', img: 'icon.png', system: { equipped: false, attachedHistories: [], modifiers: [] } }
        ]
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.armor).toHaveLength(1);
      expect(context.armor[0].name).toBe('Power Armor');
    });

    it('categorizes gear', () => {
      const context = {
        items: [
          { _id: 'g1', type: 'gear', name: 'Auspex', img: 'icon.png', system: { equipped: false, modifiers: [] } }
        ]
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.gear).toHaveLength(1);
      expect(context.gear[0].name).toBe('Auspex');
    });

    it('categorizes ammunition', () => {
      const context = {
        items: [
          { _id: 'am1', type: 'ammunition', name: 'Bolter Rounds', img: 'icon.png', system: { quantity: 100 } }
        ]
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.ammunition).toHaveLength(1);
      expect(context.ammunition[0].name).toBe('Bolter Rounds');
    });

    it('categorizes chapters', () => {
      const context = {
        items: [
          { _id: 'ch1', type: 'chapter', name: 'Ultramarines', img: 'icon.png', system: {} }
        ]
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.chapters).toHaveLength(1);
      expect(context.chapters[0].name).toBe('Ultramarines');
    });

    it('categorizes specialties', () => {
      const context = {
        items: [
          { _id: 'sp1', type: 'specialty', name: 'Tactical Marine', img: 'icon.png', system: {} }
        ]
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.specialties).toHaveLength(1);
      expect(context.specialties[0].name).toBe('Tactical Marine');
    });

    it('categorizes implants', () => {
      const context = {
        items: [
          { _id: 'im1', type: 'implant', name: 'Secondary Heart', img: 'icon.png', system: {} }
        ]
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.implants).toHaveLength(1);
      expect(context.implants[0].name).toBe('Secondary Heart');
    });

    it('categorizes cybernetics', () => {
      const context = {
        items: [
          { _id: 'cy1', type: 'cybernetic', name: 'Bionic Arm', img: 'icon.png', system: { equipped: false } }
        ]
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.cybernetics).toHaveLength(1);
      expect(context.cybernetics[0].name).toBe('Bionic Arm');
    });

    it('initializes empty arrays for all categories', () => {
      const context = { items: [] };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.weapons).toEqual([]);
      expect(context.armor).toEqual([]);
      expect(context.gear).toEqual([]);
      expect(context.ammunition).toEqual([]);
      expect(context.chapters).toEqual([]);
      expect(context.specialties).toEqual([]);
      expect(context.implants).toEqual([]);
      expect(context.cybernetics).toEqual([]);
    });

    it('applies chapter talent cost overrides', () => {
      const context = {
        items: [
          { _id: 'tal1', type: 'talent', name: 'Test Talent', img: 'icon.png', system: { cost: 1000, compendiumId: 'tal00000000001' } }
        ],
        chapterTalentCosts: { 'tal00000000001': 500 },
        specialtyTalentCosts: {}
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.talents[0].system.effectiveCost).toBe(500);
    });

    it('applies specialty talent cost overrides (takes precedence over chapter)', () => {
      const context = {
        items: [
          { _id: 'tal1', type: 'talent', name: 'Test Talent', img: 'icon.png', system: { cost: 1000, compendiumId: 'tal00000000001', stackable: false } }
        ],
        chapterTalentCosts: { 'tal00000000001': 500 },
        specialtyTalentCosts: { 'tal00000000001': [300] } // Array format for non-stackable
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.talents[0].system.effectiveCost).toBe(300);
    });

    it('uses compendiumId for matching talent costs (drag from compendium scenario)', () => {
      const context = {
        items: [
          { _id: 'newRandomId123', type: 'talent', name: 'Test Talent', img: 'icon.png', system: { cost: 1000, compendiumId: 'tal00000000001', stackable: false } }
        ],
        chapterTalentCosts: {},
        specialtyTalentCosts: { 'tal00000000001': [500] } // Array format
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.talents[0].system.effectiveCost).toBe(500);
    });

    it('falls back to _id when compendiumId is not set', () => {
      const context = {
        items: [
          { _id: 'tal00000000001', type: 'talent', name: 'Test Talent', img: 'icon.png', system: { cost: 1000, stackable: false } }
        ],
        chapterTalentCosts: {},
        specialtyTalentCosts: { 'tal00000000001': [500] } // Array format
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.talents[0].system.effectiveCost).toBe(500);
    });

    it('keeps base cost when no overrides match', () => {
      const context = {
        items: [
          { _id: 'tal1', type: 'talent', name: 'Test Talent', img: 'icon.png', system: { cost: 1000, compendiumId: 'tal00000000001' } }
        ],
        chapterTalentCosts: { 'tal00000000002': 500 },
        specialtyTalentCosts: { 'tal00000000003': 300 }
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.talents[0].system.effectiveCost).toBe(1000);
    });

    it('applies specialty base talent cost overrides', () => {
      const context = {
        items: [
          { _id: 'tal1', type: 'talent', name: 'Psy Rating 3', img: 'icon.png', system: { cost: -1, compendiumId: 'tal00000000275' } }
        ],
        chapterTalentCosts: {},
        specialtyBaseTalentCosts: { 'tal00000000275': 0 },
        specialtyTalentCosts: {}
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.talents[0].system.effectiveCost).toBe(0);
    });

    it('specialty base talent costs take precedence over chapter costs', () => {
      const context = {
        items: [
          { _id: 'tal1', type: 'talent', name: 'Psy Rating 3', img: 'icon.png', system: { cost: -1, compendiumId: 'tal00000000275' } }
        ],
        chapterTalentCosts: { 'tal00000000275': 200 },
        specialtyBaseTalentCosts: { 'tal00000000275': 0 },
        specialtyTalentCosts: {}
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.talents[0].system.effectiveCost).toBe(0);
    });

    it('specialty rank talent costs take precedence over specialty base costs', () => {
      const context = {
        items: [
          { _id: 'tal1', type: 'talent', name: 'Test Talent', img: 'icon.png', system: { cost: 1000, compendiumId: 'tal00000000001', stackable: false } }
        ],
        chapterTalentCosts: {},
        specialtyBaseTalentCosts: { 'tal00000000001': 500 },
        specialtyTalentCosts: { 'tal00000000001': [300] }
      };

      ItemListPreparer.prepare(context, mockActor);

      expect(context.talents[0].system.effectiveCost).toBe(300);
    });
  });

  describe('_prepareCharacterData - showPsyRating', () => {
    beforeEach(() => {
      global.game.deathwatch = { config: { CharacteristicWords: {}, Skills: {} } };
    });

    it('sets showPsyRating true when specialty has hasPsyRating', () => {
      const context = {
        system: {
          characteristics: {},
          skills: {},
          chapterId: '',
          specialtyId: 'spec1',
          rank: 1,
          xp: { total: 13000, spent: 0 },
          wounds: { value: 0, max: 20 },
          renown: 0
        },
        items: []
      };
      mockActor.items.get.mockImplementation((id) => {
        if (id === 'spec1') return { _id: 'spec1', system: { hasPsyRating: true, talentCosts: {} } };
        return null;
      });

      CharacterDataPreparer.prepare(context, mockActor);

      expect(context.showPsyRating).toBe(true);
    });

    it('sets showPsyRating false when specialty does not have hasPsyRating', () => {
      const context = {
        system: {
          characteristics: {},
          skills: {},
          chapterId: '',
          specialtyId: 'spec1',
          rank: 1,
          xp: { total: 13000, spent: 0 },
          wounds: { value: 0, max: 20 },
          renown: 0
        },
        items: []
      };
      mockActor.items.get.mockImplementation((id) => {
        if (id === 'spec1') return { _id: 'spec1', system: { hasPsyRating: false, talentCosts: {} } };
        return null;
      });

      CharacterDataPreparer.prepare(context, mockActor);

      expect(context.showPsyRating).toBe(false);
    });

    it('sets showPsyRating false when no specialty assigned', () => {
      const context = {
        system: {
          characteristics: {},
          skills: {},
          chapterId: '',
          specialtyId: '',
          rank: 1,
          xp: { total: 13000, spent: 0 },
          wounds: { value: 0, max: 20 },
          renown: 0
        },
        items: []
      };

      CharacterDataPreparer.prepare(context, mockActor);

      expect(context.showPsyRating).toBe(false);
    });
  });

  describe('calculateSkillTotal', () => {
    it('calculates skill total for trained skill', () => {
      const skill = { characteristic: 'ws', trained: true, expert: false, mastered: false, modifier: 5 };
      const characteristics = { ws: { value: 40 } };
      
      const total = DeathwatchActorSheet.calculateSkillTotal(skill, characteristics);
      expect(total).toBe(45); // 40 + 0 + 5
    });

    it('calculates skill total for untrained skill', () => {
      const skill = { characteristic: 'ws', trained: false, expert: false, mastered: false, modifier: 0 };
      const characteristics = { ws: { value: 40 } };
      
      const total = DeathwatchActorSheet.calculateSkillTotal(skill, characteristics);
      expect(total).toBe(20); // floor(40/2) + 0 + 0
    });

    it('calculates skill total for mastered skill', () => {
      const skill = { characteristic: 'ws', trained: true, expert: false, mastered: true, modifier: 0 };
      const characteristics = { ws: { value: 40 } };
      
      const total = DeathwatchActorSheet.calculateSkillTotal(skill, characteristics);
      expect(total).toBe(50); // 40 + 10 + 0
    });

    it('calculates skill total for expert skill', () => {
      const skill = { characteristic: 'ws', trained: true, expert: true, mastered: false, modifier: 0 };
      const characteristics = { ws: { value: 40 } };
      
      const total = DeathwatchActorSheet.calculateSkillTotal(skill, characteristics);
      expect(total).toBe(60); // 40 + 20 + 0
    });
  });

  describe('_onItemEdit', () => {
    it('opens item sheet', () => {
      const mockItem = {
        sheet: {
          render: jest.fn()
        }
      };
      mockActor.items.get.mockReturnValue(mockItem);

      const event = {
        preventDefault: jest.fn(),
        currentTarget: {}
      };

      const mockJQuery = {
        parents: jest.fn(() => ({
          data: jest.fn(() => 'item1')
        }))
      };
      global.$ = jest.fn(() => mockJQuery);

      // Call through activateListeners to test the bound handler
      const html = {
        find: jest.fn((selector) => {
          if (selector === '.item-edit') {
            return {
              click: (handler) => {
                handler(event);
              }
            };
          }
          return { click: jest.fn(), change: jest.fn(), focus: jest.fn(), each: jest.fn() };
        })
      };

      sheet.activateListeners(html);
      expect(mockItem.sheet.render).toHaveBeenCalledWith(true);
    });
  });

  describe('_onItemCreate', () => {
    it('creates new item with default name', async () => {
      const event = {
        preventDefault: jest.fn(),
        currentTarget: {
          dataset: {
            type: 'weapon'
          }
        }
      };

      global.Item = {
        create: jest.fn()
      };

      await sheet._onItemCreate(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(global.Item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Weapon',
          type: 'weapon'
        }),
        { parent: mockActor }
      );
    });
  });
});

