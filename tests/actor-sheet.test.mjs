import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchActorSheet } from '../src/module/sheets/actor-sheet.mjs';

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
        filter: jest.fn(() => [])
      },
      effects: [],
      toObject: jest.fn(() => ({
        type: 'character',
        system: mockActor.system,
        flags: {}
      })),
      getRollData: jest.fn(() => ({})),
      isOwner: true,
      hasCondition: jest.fn(() => false)
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

      sheet._prepareItems(context);

      expect(context.weapons).toHaveLength(1);
      expect(context.weapons[0].name).toBe('Bolter');
    });

    it('categorizes armor', () => {
      const context = {
        items: [
          { _id: 'a1', type: 'armor', name: 'Power Armor', img: 'icon.png', system: { equipped: false, attachedHistories: [], modifiers: [] } }
        ]
      };

      sheet._prepareItems(context);

      expect(context.armor).toHaveLength(1);
      expect(context.armor[0].name).toBe('Power Armor');
    });

    it('categorizes gear', () => {
      const context = {
        items: [
          { _id: 'g1', type: 'gear', name: 'Auspex', img: 'icon.png', system: { equipped: false, modifiers: [] } }
        ]
      };

      sheet._prepareItems(context);

      expect(context.gear).toHaveLength(1);
      expect(context.gear[0].name).toBe('Auspex');
    });

    it('categorizes ammunition', () => {
      const context = {
        items: [
          { _id: 'am1', type: 'ammunition', name: 'Bolter Rounds', img: 'icon.png', system: { quantity: 100 } }
        ]
      };

      sheet._prepareItems(context);

      expect(context.ammunition).toHaveLength(1);
      expect(context.ammunition[0].name).toBe('Bolter Rounds');
    });

    it('categorizes chapters', () => {
      const context = {
        items: [
          { _id: 'ch1', type: 'chapter', name: 'Ultramarines', img: 'icon.png', system: {} }
        ]
      };

      sheet._prepareItems(context);

      expect(context.chapters).toHaveLength(1);
      expect(context.chapters[0].name).toBe('Ultramarines');
    });

    it('categorizes specialties', () => {
      const context = {
        items: [
          { _id: 'sp1', type: 'specialty', name: 'Tactical Marine', img: 'icon.png', system: {} }
        ]
      };

      sheet._prepareItems(context);

      expect(context.specialties).toHaveLength(1);
      expect(context.specialties[0].name).toBe('Tactical Marine');
    });

    it('categorizes implants', () => {
      const context = {
        items: [
          { _id: 'im1', type: 'implant', name: 'Secondary Heart', img: 'icon.png', system: {} }
        ]
      };

      sheet._prepareItems(context);

      expect(context.implants).toHaveLength(1);
      expect(context.implants[0].name).toBe('Secondary Heart');
    });

    it('categorizes cybernetics', () => {
      const context = {
        items: [
          { _id: 'cy1', type: 'cybernetic', name: 'Bionic Arm', img: 'icon.png', system: { equipped: false } }
        ]
      };

      sheet._prepareItems(context);

      expect(context.cybernetics).toHaveLength(1);
      expect(context.cybernetics[0].name).toBe('Bionic Arm');
    });

    it('initializes empty arrays for all categories', () => {
      const context = { items: [] };

      sheet._prepareItems(context);

      expect(context.weapons).toEqual([]);
      expect(context.armor).toEqual([]);
      expect(context.gear).toEqual([]);
      expect(context.ammunition).toEqual([]);
      expect(context.chapters).toEqual([]);
      expect(context.specialties).toEqual([]);
      expect(context.implants).toEqual([]);
      expect(context.cybernetics).toEqual([]);
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

