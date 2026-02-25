import { jest } from '@jest/globals';
import './setup.mjs';

let initCallback;
let readyCallback;
let renderChatCallback;
let hotbarDropCallback;

global.Hooks = {
  once: jest.fn((hook, callback) => {
    if (hook === 'init') initCallback = callback;
    if (hook === 'ready') readyCallback = callback;
  }),
  on: jest.fn((hook, callback) => {
    if (hook === 'renderChatMessage') renderChatCallback = callback;
    if (hook === 'hotbarDrop') hotbarDropCallback = callback;
  })
};

global.CONFIG = {
  Combat: {},
  Actor: {},
  Item: {}
};

global.Actors = {
  unregisterSheet: jest.fn(),
  registerSheet: jest.fn()
};

global.Items = {
  unregisterSheet: jest.fn(),
  registerSheet: jest.fn()
};

global.RollTable = { create: jest.fn() };
global.Macro = { create: jest.fn() };

await import('../src/module/deathwatch.mjs');

describe('deathwatch.mjs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    global.game = {
      user: { isGM: false, assignHotbarMacro: jest.fn() },
      tables: { getName: jest.fn() },
      actors: { get: jest.fn() },
      macros: { find: jest.fn() }
    };
  });

  describe('init hook', () => {
    beforeEach(async () => {
      await initCallback();
    });

    it('registers game.deathwatch namespace', () => {
      expect(game.deathwatch).toBeDefined();
      expect(game.deathwatch.DeathwatchActor).toBeDefined();
      expect(game.deathwatch.DeathwatchItem).toBeDefined();
      expect(game.deathwatch.rollItemMacro).toBeDefined();
    });

    it('registers config', () => {
      expect(game.deathwatch.config).toBeDefined();
    });

    it('sets initiative formula', () => {
      expect(CONFIG.Combat.initiative.formula).toBe('1d10 + @agBonus + @initiativeBonus');
      expect(CONFIG.Combat.initiative.decimals).toBe(2);
    });

    it('registers document classes', () => {
      expect(CONFIG.Actor.documentClass).toBeDefined();
      expect(CONFIG.Item.documentClass).toBeDefined();
    });

    it('registers sheets', () => {
      expect(Actors.unregisterSheet).toHaveBeenCalledWith('core', ActorSheet);
      expect(Actors.registerSheet).toHaveBeenCalledWith('deathwatch', expect.any(Function), { makeDefault: true });
      expect(Items.unregisterSheet).toHaveBeenCalledWith('core', ItemSheet);
      expect(Items.registerSheet).toHaveBeenCalledWith('deathwatch', expect.any(Function), { makeDefault: true });
    });
  });

  describe('ready hook', () => {
    it('registers hotbar drop hook', async () => {
      await readyCallback();
      expect(Hooks.on).toHaveBeenCalledWith('hotbarDrop', expect.any(Function));
    });

    it('creates scatter table for GM', async () => {
      game.user.isGM = true;
      game.tables.getName.mockReturnValue(null);
      const mockTable = {
        createEmbeddedDocuments: jest.fn()
      };
      RollTable.create.mockResolvedValue(mockTable);

      await readyCallback();

      expect(RollTable.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Scatter',
        formula: '1d10'
      }));
      expect(mockTable.createEmbeddedDocuments).toHaveBeenCalledWith('TableResult', expect.any(Array));
    });

    it('updates scatter table if results count wrong', async () => {
      game.user.isGM = true;
      const mockTable = {
        results: { size: 5 },
        delete: jest.fn()
      };
      game.tables.getName.mockReturnValue(mockTable);
      const mockNewTable = {
        createEmbeddedDocuments: jest.fn()
      };
      RollTable.create.mockResolvedValue(mockNewTable);

      await readyCallback();

      expect(mockTable.delete).toHaveBeenCalled();
      expect(RollTable.create).toHaveBeenCalled();
    });
  });

  describe('renderChatMessage hook', () => {
    beforeEach(async () => {
      await initCallback();
      await readyCallback();
    });

    it('registers chat message handlers', () => {
      const mockHtml = {
        find: jest.fn(() => ({
          click: jest.fn()
        }))
      };
      
      renderChatCallback({}, mockHtml);
      expect(mockHtml.find).toHaveBeenCalled();
    });
  });

  describe('createItemMacro', () => {
    beforeEach(async () => {
      await initCallback();
      await readyCallback();
      Item.fromDropData = jest.fn();
    });

    it('warns for non-owned items', async () => {
      const data = { type: 'Item', uuid: 'Compendium.pack.item' };
      await hotbarDropCallback({}, data, 1);
      expect(ui.notifications.warn).toHaveBeenCalledWith('You can only create macro buttons for owned Items');
    });

    it('creates macro for owned item', async () => {
      const mockItem = { name: 'Test Item', img: 'test.png' };
      Item.fromDropData.mockResolvedValue(mockItem);
      game.macros.find.mockReturnValue(null);
      const mockMacro = { id: 'macro-1' };
      Macro.create.mockResolvedValue(mockMacro);

      const data = { type: 'Item', uuid: 'Actor.actor1.Item.item1' };
      await hotbarDropCallback({}, data, 1);

      expect(Macro.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Item',
        type: 'script',
        command: expect.stringContaining('rollItemMacro')
      }));
      expect(game.user.assignHotbarMacro).toHaveBeenCalledWith(mockMacro, 1);
    });
  });

  describe('rollItemMacro', () => {
    beforeEach(async () => {
      await initCallback();
      Item.fromDropData = jest.fn();
    });

    it('warns if item not found', async () => {
      Item.fromDropData.mockResolvedValue(null);
      game.deathwatch.rollItemMacro('Actor.actor1.Item.item1');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(ui.notifications.warn).toHaveBeenCalled();
    });

    it('rolls item if found', async () => {
      const mockItem = {
        name: 'Test Item',
        parent: { id: 'actor-1' },
        roll: jest.fn()
      };
      Item.fromDropData.mockResolvedValue(mockItem);
      
      game.deathwatch.rollItemMacro('Actor.actor1.Item.item1');
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockItem.roll).toHaveBeenCalled();
    });
  });
});
