import { jest } from '@jest/globals';
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

    it('returns false for Item drops to prevent default', () => {
      const data = { type: 'Item', uuid: 'Compendium.pack.item' };
      const result = hotbarDropCallback({}, data, 1);
      expect(result).toBe(false);
    });

    it('does not return false for non-Item drops', () => {
      const data = { type: 'Macro', uuid: 'some-macro' };
      const result = hotbarDropCallback({}, data, 1);
      expect(result).toBeUndefined();
    });

    it('warns for non-owned items', async () => {
      const data = { type: 'Item', uuid: 'Compendium.pack.item' };
      hotbarDropCallback({}, data, 1);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(ui.notifications.warn).toHaveBeenCalledWith('You can only create macro buttons for owned Items');
    });

    it('creates macro for owned item', async () => {
      const mockItem = { name: 'Test Item', img: 'test.png' };
      Item.fromDropData.mockResolvedValue(mockItem);
      game.macros.find.mockReturnValue(null);
      const mockMacro = { id: 'macro-1' };
      Macro.create.mockResolvedValue(mockMacro);

      const data = { type: 'Item', uuid: 'Actor.actor1.Item.item1' };
      hotbarDropCallback({}, data, 1);
      await new Promise(resolve => setTimeout(resolve, 0));

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

    it('rolls non-weapon item if found', async () => {
      const mockItem = {
        name: 'Test Gear',
        type: 'gear',
        parent: { id: 'actor-1' },
        roll: jest.fn()
      };
      Item.fromDropData.mockResolvedValue(mockItem);
      
      game.deathwatch.rollItemMacro('Actor.actor1.Item.item1');
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockItem.roll).toHaveBeenCalled();
    });

    it('opens attack/damage dialog for weapons instead of rolling', async () => {
      const mockItem = {
        name: 'Bolter',
        type: 'weapon',
        img: 'bolter.png',
        parent: { id: 'actor-1' },
        roll: jest.fn()
      };
      Item.fromDropData.mockResolvedValue(mockItem);
      
      game.deathwatch.rollItemMacro('Actor.actor1.Item.item1');
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockItem.roll).not.toHaveBeenCalled();
    });

    it('opens focus power dialog for psychic powers instead of rolling', async () => {
      const mockPower = {
        name: 'Smite',
        type: 'psychic-power',
        img: 'smite.png',
        system: { action: 'Half', range: '20m', opposed: 'No', sustained: 'No', damage: '1d10+5', damageType: 'Energy', penetration: 4, description: '' },
        parent: { id: 'actor-1', system: { characteristics: { wil: { value: 50 } }, psyRating: { value: 3 } }, items: [] },
        roll: jest.fn()
      };
      Item.fromDropData.mockResolvedValue(mockPower);
      
      game.deathwatch.rollItemMacro('Actor.actor1.Item.item1');
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockPower.roll).not.toHaveBeenCalled();
    });
  });
});
