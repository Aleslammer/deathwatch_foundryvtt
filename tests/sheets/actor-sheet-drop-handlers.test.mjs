import { jest } from '@jest/globals';
import { DeathwatchActorSheetV2 } from '../../src/module/sheets/actor-sheet-v2.mjs';

/**
 * Tests for item-on-item drop handlers in actor sheet.
 *
 * These tests verify the fix for the bug where event.currentTarget becomes null
 * after async operations (await), causing "Cannot read properties of null (reading 'dataset')".
 *
 * Root cause: JavaScript event objects reset currentTarget to null after event dispatch.
 * When code uses await (yielding control), currentTarget is lost.
 *
 * Fix: Extract currentTarget reference BEFORE any await operations.
 */
describe('DeathwatchActorSheetV2 - Drop Handlers', () => {
  let mockActor;
  let sheet;
  let mockEvent;
  let mockDroppedItem;
  let mockTargetElement;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock target element with dataset
    mockTargetElement = {
      dataset: {
        itemId: 'armor123'
      }
    };

    // Mock event object
    mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: mockTargetElement,
      dataTransfer: {
        getData: jest.fn()
      }
    };

    // Mock actor with items collection
    mockActor = {
      _id: 'actor1',
      name: 'Test Marine',
      type: 'character',
      system: {},
      items: new Map([
        ['armor123', {
          _id: 'armor123',
          name: 'Power Armor',
          type: 'armor',
          system: {
            attachedHistories: []
          },
          update: jest.fn().mockResolvedValue(true)
        }],
        ['weapon123', {
          _id: 'weapon123',
          name: 'Bolter',
          type: 'weapon',
          system: {
            attachedUpgrades: []
          },
          update: jest.fn().mockResolvedValue(true)
        }]
      ]),
      getRollData: jest.fn(() => ({})),
      isOwner: true
    };

    // Make items.get() work with Map
    mockActor.items.get = jest.fn((id) => {
      return mockActor.items.has(id) ? Array.from(mockActor.items.values()).find(i => i._id === id) : undefined;
    });

    // Mock sheet instance
    sheet = {
      actor: mockActor
    };

    // Mock global Foundry APIs
    global.Item = {
      implementation: {
        fromDropData: jest.fn(),
      },
      create: jest.fn()
    };

    global.foundry = {
      applications: {
        ux: {
          TextEditor: {
            implementation: {
              getDragEventData: jest.fn()
            }
          }
        }
      }
    };

    global.ui = {
      notifications: {
        warn: jest.fn(),
        info: jest.fn()
      }
    };
  });

  describe('_onDropItemOnItem - Armor History', () => {
    beforeEach(() => {
      // Mock dropped armor-history item from compendium (no parent)
      mockDroppedItem = {
        _id: 'history1',
        name: 'Battle Honors',
        type: 'armor-history',
        parent: null,
        toObject: jest.fn(() => ({
          _id: 'history1',
          name: 'Battle Honors',
          type: 'armor-history',
          system: {}
        })),
        flags: {
          core: {
            sourceId: 'Compendium.deathwatch.armor-histories.history1'
          }
        }
      };

      // Setup mock responses
      global.foundry.applications.ux.TextEditor.implementation.getDragEventData.mockReturnValue({
        type: 'Item'
      });
      global.Item.implementation.fromDropData.mockResolvedValue(mockDroppedItem);
    });

    test('should not crash when currentTarget accessed after Item.create() await', async () => {
      // Mock Item.create to return imported item, and CLEAR currentTarget during the await
      const mockImportedItem = {
        id: 'history1-imported',
        name: 'Battle Honors',
        type: 'armor-history'
      };

      // Create a promise that clears currentTarget when awaited (simulates real browser behavior)
      global.Item.create.mockImplementation(async () => {
        mockEvent.currentTarget = null; // Simulate browser clearing currentTarget
        return mockImportedItem;
      });

      // Should NOT throw after fix (currentTarget extracted before await)
      await expect(
        DeathwatchActorSheetV2.prototype._onDropItemOnItem.call(sheet, mockEvent)
      ).resolves.not.toThrow();
    });

    test('should extract dataset.itemId before await operations', async () => {
      const mockImportedItem = {
        id: 'history1-imported',
        name: 'Battle Honors',
        type: 'armor-history'
      };

      // Mock Item.create to clear currentTarget (simulating browser behavior)
      global.Item.create.mockImplementation(async () => {
        mockEvent.currentTarget = null;
        return mockImportedItem;
      });

      // With fix, this should work even though currentTarget becomes null
      // Without fix, this would throw
      await DeathwatchActorSheetV2.prototype._onDropItemOnItem.call(sheet, mockEvent);

      // Verify armor was updated with the history
      const armorItem = Array.from(mockActor.items.values()).find(i => i._id === 'armor123');
      expect(armorItem.update).toHaveBeenCalledWith({
        "system.attachedHistories": ['history1-imported']
      });
    });

    test('should attach history to armor item successfully', async () => {
      // Item already in actor inventory (has parent) - needs .id property
      mockDroppedItem.parent = mockActor;
      mockDroppedItem.id = 'history1'; // Foundry uses .id not ._id

      await DeathwatchActorSheetV2.prototype._onDropItemOnItem.call(sheet, mockEvent);

      const armorItem = Array.from(mockActor.items.values()).find(i => i._id === 'armor123');
      expect(armorItem.update).toHaveBeenCalledWith({
        "system.attachedHistories": ['history1']
      });
      expect(global.ui.notifications.info).toHaveBeenCalledWith('Battle Honors attached to Power Armor.');
    });
  });

  describe('_onDropItemOnItem - Weapon Upgrade', () => {
    beforeEach(() => {
      // Mock dropped weapon-upgrade item from compendium (no parent)
      mockDroppedItem = {
        id: 'upgrade1',
        name: 'Motion Predictor',
        type: 'weapon-upgrade',
        parent: null,
        toObject: jest.fn(() => ({
          id: 'upgrade1',
          name: 'Motion Predictor',
          type: 'weapon-upgrade',
          system: {}
        }))
      };

      // Update target element to point to weapon
      mockTargetElement.dataset.itemId = 'weapon123';
      mockEvent.currentTarget = mockTargetElement;

      // Setup mock responses
      global.foundry.applications.ux.TextEditor.implementation.getDragEventData.mockReturnValue({
        type: 'Item'
      });
      global.Item.implementation.fromDropData.mockResolvedValue(mockDroppedItem);
    });

    test('should not crash when currentTarget accessed after Item.create() await', async () => {
      // Mock Item.create to return imported item, and CLEAR currentTarget during the await
      const mockImportedItem = {
        id: 'upgrade1-imported',
        name: 'Motion Predictor',
        type: 'weapon-upgrade'
      };

      // Simulate browser clearing currentTarget during async operation
      global.Item.create.mockImplementation(async () => {
        mockEvent.currentTarget = null;
        return mockImportedItem;
      });

      // Should NOT throw after fix (currentTarget extracted before await)
      await expect(
        DeathwatchActorSheetV2.prototype._onDropItemOnItem.call(sheet, mockEvent)
      ).resolves.not.toThrow();
    });

    test('should extract dataset.itemId before await operations', async () => {
      const mockImportedItem = {
        id: 'upgrade1-imported',
        name: 'Motion Predictor',
        type: 'weapon-upgrade'
      };

      // Mock Item.create to clear currentTarget (simulating browser behavior)
      global.Item.create.mockImplementation(async () => {
        mockEvent.currentTarget = null;
        return mockImportedItem;
      });

      // With fix, this should work even though currentTarget becomes null
      await DeathwatchActorSheetV2.prototype._onDropItemOnItem.call(sheet, mockEvent);

      // Verify weapon was updated with the upgrade
      const weaponItem = Array.from(mockActor.items.values()).find(i => i._id === 'weapon123');
      expect(weaponItem.update).toHaveBeenCalledWith({
        "system.attachedUpgrades": [{ id: 'upgrade1-imported' }]
      });
    });

    test('should attach upgrade to weapon item successfully', async () => {
      // Item already in actor inventory
      mockDroppedItem.parent = mockActor;

      await DeathwatchActorSheetV2.prototype._onDropItemOnItem.call(sheet, mockEvent);

      const weaponItem = Array.from(mockActor.items.values()).find(i => i._id === 'weapon123');
      expect(weaponItem.update).toHaveBeenCalledWith({
        "system.attachedUpgrades": [{ id: 'upgrade1' }]
      });
      expect(global.ui.notifications.info).toHaveBeenCalledWith('Motion Predictor attached to Bolter.');
    });
  });
});
