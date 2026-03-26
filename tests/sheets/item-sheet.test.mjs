import { jest } from '@jest/globals';
import { DeathwatchItemSheet } from '../../src/module/sheets/item-sheet.mjs';

// Mock jQuery
global.$ = jest.fn((selector) => ({
  find: jest.fn(() => ({
    val: jest.fn(),
    click: jest.fn(),
    change: jest.fn(),
    closest: jest.fn(() => ({
      data: jest.fn()
    })),
    data: jest.fn(),
    remove: jest.fn(),
    append: jest.fn()
  })),
  data: jest.fn(),
  closest: jest.fn(() => ({
    data: jest.fn()
  }))
}));

// Mock Dialog
global.Dialog = class Dialog {
  constructor(config) {
    this.config = config;
  }
  render() {}
};

describe('DeathwatchItemSheet', () => {
  let mockSheet;
  let mockItem;

  beforeEach(() => {
    mockItem = {
      type: 'weapon',
      name: 'Test Weapon',
      system: {
        description: 'Test description',
        modifiers: []
      },
      pack: null,
      update: jest.fn(),
      actor: null
    };

    mockSheet = new DeathwatchItemSheet(mockItem);
    mockSheet.item = mockItem;
    mockSheet.object = mockItem;
    mockSheet.isEditable = true;
  });

  describe('defaultOptions', () => {
    it('returns merged default options', () => {
      const options = DeathwatchItemSheet.defaultOptions;
      expect(options.classes).toContain('deathwatch');
      expect(options.classes).toContain('sheet');
      expect(options.classes).toContain('item');
      expect(options.width).toBe(520);
      expect(options.height).toBe(480);
    });

    it('configures tabs', () => {
      const options = DeathwatchItemSheet.defaultOptions;
      expect(options.tabs).toHaveLength(1);
      expect(options.tabs[0].navSelector).toBe('.sheet-tabs');
      expect(options.tabs[0].contentSelector).toBe('.sheet-body');
      expect(options.tabs[0].initial).toBe('description');
    });
  });

  describe('template', () => {
    it('returns template path based on item type', () => {
      mockSheet.item.type = 'weapon';
      const template = mockSheet.template;
      expect(template).toBe('systems/deathwatch/templates/item/item-weapon-sheet.html');
    });

    it('returns correct path for armor type', () => {
      mockSheet.item.type = 'armor';
      const template = mockSheet.template;
      expect(template).toBe('systems/deathwatch/templates/item/item-armor-sheet.html');
    });
  });

  describe('getData', () => {
    it('returns context with system and flags', () => {
      const result = mockSheet.getData();
      expect(result.system).toBeDefined();
    });

    it('populates attached histories for armor with actor', () => {
      mockItem.type = 'armor';
      mockItem.system.attachedHistories = ['hist-1'];
      const mockActor = {
        items: {
          get: jest.fn(() => ({
            id: 'hist-1',
            name: 'Test History',
            img: 'test.png'
          }))
        },
        getRollData: jest.fn(() => ({}))
      };
      mockSheet.object = { parent: mockActor };

      const result = mockSheet.getData();
      expect(result.system.attachedHistories).toHaveLength(1);
      expect(result.system.attachedHistories[0].name).toBe('Test History');
    });

    it('sets empty array for armor without actor', () => {
      mockItem.type = 'armor';
      mockSheet.object = { parent: null };

      const result = mockSheet.getData();
      expect(result.system.attachedHistories).toEqual([]);
    });
  });

  describe('_onModifierCreate', () => {
    it('creates new modifier with default values', async () => {
      const event = { preventDefault: jest.fn() };
      mockItem.system.modifiers = [];

      await mockSheet._onModifierCreate(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.modifiers': expect.arrayContaining([
          expect.objectContaining({
            name: 'New Modifier',
            modifier: '0',
            type: 'untyped',
            effectType: 'characteristic',
            enabled: true
          })
        ])
      });
    });

    it('appends to existing modifiers', async () => {
      const event = { preventDefault: jest.fn() };
      mockItem.system.modifiers = [{ _id: 'existing', name: 'Existing' }];

      await mockSheet._onModifierCreate(event);

      expect(mockItem.update).toHaveBeenCalledWith({
        'system.modifiers': expect.arrayContaining([
          { _id: 'existing', name: 'Existing' },
          expect.objectContaining({ name: 'New Modifier' })
        ])
      });
    });
  });

  describe('_onModifierDelete', () => {
    it('removes modifier by id', async () => {
      const event = {
        preventDefault: jest.fn(),
        currentTarget: {}
      };
      const mockJQuery = {
        closest: jest.fn(() => ({
          data: jest.fn(() => 'mod-1')
        }))
      };
      global.$ = jest.fn(() => mockJQuery);

      mockItem.system.modifiers = [
        { _id: 'mod-1', name: 'Modifier 1' },
        { _id: 'mod-2', name: 'Modifier 2' }
      ];

      await mockSheet._onModifierDelete(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.modifiers': [{ _id: 'mod-2', name: 'Modifier 2' }]
      });
    });
  });

  describe('_onToggleModifierEnabled', () => {
    it('toggles modifier enabled state', async () => {
      const event = {
        preventDefault: jest.fn(),
        currentTarget: {}
      };
      const mockJQuery = {
        closest: jest.fn(() => ({
          data: jest.fn(() => 'mod-1')
        }))
      };
      global.$ = jest.fn(() => mockJQuery);

      mockItem.system.modifiers = [
        { _id: 'mod-1', name: 'Modifier 1', enabled: true }
      ];

      await mockSheet._onToggleModifierEnabled(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.modifiers': [
          { _id: 'mod-1', name: 'Modifier 1', enabled: false }
        ]
      });
    });
  });

  describe('_onWeaponAttack', () => {
    it('warns if weapon has no actor', async () => {
      const event = { preventDefault: jest.fn() };
      mockItem.actor = null;

      await mockSheet._onWeaponAttack(event);

      expect(global.ui.notifications.warn).toHaveBeenCalledWith(
        'This weapon must be owned by an actor to roll attacks.'
      );
    });

    it('rolls attack with actor BS', async () => {
      const event = { preventDefault: jest.fn() };
      const mockRoll = {
        total: 45,
        toMessage: jest.fn()
      };
      global.Roll = jest.fn(() => ({
        evaluate: jest.fn(async () => mockRoll)
      }));

      mockItem.actor = {
        system: {
          characteristics: {
            bs: { value: 50 }
          }
        }
      };

      await mockSheet._onWeaponAttack(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockRoll.toMessage).toHaveBeenCalled();
    });
  });

  describe('_onWeaponDamage', () => {
    it('warns if weapon has no actor', async () => {
      const event = { preventDefault: jest.fn() };
      mockItem.actor = null;

      await mockSheet._onWeaponDamage(event);

      expect(global.ui.notifications.warn).toHaveBeenCalledWith(
        'This weapon must be owned by an actor to roll damage.'
      );
    });

    it('warns if weapon has no damage value', async () => {
      const event = { preventDefault: jest.fn() };
      mockItem.actor = { system: {} };
      mockItem.system.dmg = null;

      await mockSheet._onWeaponDamage(event);

      expect(global.ui.notifications.warn).toHaveBeenCalledWith(
        'This weapon has no damage value.'
      );
    });

    it('rolls damage with weapon dmg', async () => {
      const event = { preventDefault: jest.fn() };
      const mockRoll = {
        toMessage: jest.fn()
      };
      global.Roll = jest.fn(() => ({
        evaluate: jest.fn(async () => mockRoll)
      }));

      mockItem.actor = { system: {} };
      mockItem.system.dmg = '1d10+5';
      mockItem.system.penetration = 4;

      await mockSheet._onWeaponDamage(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(global.Roll).toHaveBeenCalledWith('1d10+5');
      expect(mockRoll.toMessage).toHaveBeenCalled();
    });
  });

  describe('_onHistoryRemove', () => {
    it('removes history from attached histories', async () => {
      const event = {
        preventDefault: jest.fn(),
        currentTarget: {}
      };
      const mockJQuery = {
        data: jest.fn(() => 'hist-1')
      };
      global.$ = jest.fn(() => mockJQuery);

      mockItem.system.attachedHistories = ['hist-1', 'hist-2'];
      mockSheet.render = jest.fn();

      await mockSheet._onHistoryRemove(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedHistories': ['hist-2']
      });
      expect(mockSheet.render).toHaveBeenCalledWith(false);
    });
  });

  describe('_onQualityRemove', () => {
    it('removes quality from attached qualities (string format)', async () => {
      const event = {
        preventDefault: jest.fn(),
        currentTarget: {}
      };
      const mockJQuery = {
        data: jest.fn(() => 'qual-1')
      };
      global.$ = jest.fn(() => mockJQuery);

      mockItem.system.attachedQualities = ['qual-1', 'qual-2'];
      mockSheet.render = jest.fn();

      await mockSheet._onQualityRemove(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedQualities': ['qual-2']
      });
      expect(mockSheet.render).toHaveBeenCalledWith(false);
    });

    it('removes quality from attached qualities (object format)', async () => {
      const event = {
        preventDefault: jest.fn(),
        currentTarget: {}
      };
      const mockJQuery = {
        data: jest.fn(() => 'qual-1')
      };
      global.$ = jest.fn(() => mockJQuery);

      mockItem.system.attachedQualities = [
        { id: 'qual-1', value: '4' },
        { id: 'qual-2', value: '2' }
      ];
      mockSheet.render = jest.fn();

      await mockSheet._onQualityRemove(event);

      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedQualities': [{ id: 'qual-2', value: '2' }]
      });
    });
  });

  describe('_onQualityValueChange', () => {
    it('updates quality value', async () => {
      const event = {
        preventDefault: jest.fn(),
        currentTarget: {}
      };
      const mockJQuery = {
        data: jest.fn(() => 'qual-1'),
        val: jest.fn(() => '5')
      };
      global.$ = jest.fn(() => mockJQuery);

      mockItem.system.attachedQualities = [
        { id: 'qual-1', value: '4' },
        'qual-2'
      ];

      await mockSheet._onQualityValueChange(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedQualities': [
          { id: 'qual-1', value: '5' },
          'qual-2'
        ]
      });
    });
  });

  describe('getData - specialty', () => {
    it('adds characteristic labels for specialty items', () => {
      mockItem.type = 'specialty';
      const result = mockSheet.getData();
      
      expect(result.characteristics).toBeDefined();
      expect(result.characteristics.ws).toBe('Weapon Skill');
      expect(result.characteristics.bs).toBe('Ballistic Skill');
    });
  });

  describe('getData - weapon qualities', () => {
    it('populates attached qualities from pack', () => {
      mockItem.type = 'weapon';
      mockItem.system.attachedQualities = ['qual-1'];
      
      const mockQuality = {
        _id: 'qual-1',
        name: 'Accurate',
        system: { key: 'accurate', value: '' }
      };
      
      global.game.packs = new Map([
        ['deathwatch.weapon-qualities', {
          index: new Map([['qual-1', mockQuality]])
        }]
      ]);

      const result = mockSheet.getData();
      
      expect(result.attachedQualities).toHaveLength(1);
      expect(result.attachedQualities[0].name).toBe('Accurate');
    });

    it('handles quality with value', () => {
      mockItem.type = 'weapon';
      mockItem.system.attachedQualities = [{ id: 'qual-1', value: '4' }];
      
      const mockQuality = {
        _id: 'qual-1',
        name: 'Proven',
        system: { key: 'proven', value: '3' }
      };
      
      global.game.packs = new Map([
        ['deathwatch.weapon-qualities', {
          index: new Map([['qual-1', mockQuality]])
        }]
      ]);

      const result = mockSheet.getData();
      
      expect(result.attachedQualities[0].system.value).toBe('4');
    });
  });

  describe('_onDrop', () => {
    it('attaches armor history to armor', async () => {
      mockItem.type = 'armor';
      mockItem.system.attachedHistories = [];
      
      const droppedItem = {
        id: 'hist-1',
        name: 'Battle History',
        type: 'armor-history'
      };
      
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      global.foundry = {
        applications: {
          ux: {
            TextEditor: {
              implementation: {
                getDragEventData: jest.fn(() => ({ type: 'Item' }))
              }
            }
          }
        }
      };
      
      global.Item = {
        implementation: {
          fromDropData: jest.fn(async () => droppedItem)
        }
      };

      const result = await mockSheet._onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedHistories': ['hist-1']
      });
      expect(global.ui.notifications.info).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('warns if history already attached', async () => {
      mockItem.type = 'armor';
      mockItem.system.attachedHistories = ['hist-1'];
      
      const droppedItem = {
        id: 'hist-1',
        name: 'Battle History',
        type: 'armor-history'
      };
      
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      global.foundry = {
        applications: {
          ux: {
            TextEditor: {
              implementation: {
                getDragEventData: jest.fn(() => ({ type: 'Item' }))
              }
            }
          }
        }
      };
      
      global.Item = {
        implementation: {
          fromDropData: jest.fn(async () => droppedItem)
        }
      };

      await mockSheet._onDrop(event);

      expect(global.ui.notifications.warn).toHaveBeenCalled();
    });

    it('attaches weapon quality to weapon', async () => {
      mockItem.type = 'weapon';
      mockItem.system.attachedQualities = [];
      
      const droppedItem = {
        id: 'qual-1',
        name: 'Accurate',
        type: 'weapon-quality',
        system: { value: '' }
      };
      
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      global.foundry = {
        applications: {
          ux: {
            TextEditor: {
              implementation: {
                getDragEventData: jest.fn(() => ({ type: 'Item' }))
              }
            }
          }
        }
      };
      
      global.Item = {
        implementation: {
          fromDropData: jest.fn(async () => droppedItem)
        }
      };

      const result = await mockSheet._onDrop(event);

      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedQualities': ['qual-1']
      });
      expect(result).toBe(false);
    });

    it('attaches quality with value', async () => {
      mockItem.type = 'weapon';
      mockItem.system.attachedQualities = [];
      
      const droppedItem = {
        id: 'qual-1',
        name: 'Proven',
        type: 'weapon-quality',
        system: { value: '4' }
      };
      
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      global.foundry = {
        applications: {
          ux: {
            TextEditor: {
              implementation: {
                getDragEventData: jest.fn(() => ({ type: 'Item' }))
              }
            }
          }
        }
      };
      
      global.Item = {
        implementation: {
          fromDropData: jest.fn(async () => droppedItem)
        }
      };

      await mockSheet._onDrop(event);

      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedQualities': [{ id: 'qual-1', value: '4' }]
      });
    });
  });
});
