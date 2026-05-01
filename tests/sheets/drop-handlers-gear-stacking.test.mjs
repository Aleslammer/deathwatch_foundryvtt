import { jest } from '@jest/globals';
import { DropHandlers } from '../../src/module/sheets/shared/handlers/drop-handlers.mjs';

describe('DropHandlers gear stacking', () => {
  let mockActor;
  let mockEvent;

  beforeEach(() => {
    jest.clearAllMocks();

    mockActor = {
      id: 'actor1',
      items: {
        find: jest.fn(),
        get: jest.fn()
      },
      update: jest.fn()
    };

    mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };

    // Mock global Foundry APIs
    global.Item = {
      implementation: {
        fromDropData: jest.fn()
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

  it('should increment quantity when dropping stackable gear with existing match', async () => {
    const droppedItem = {
      type: 'gear',
      name: 'De-Tox',
      system: { stackable: true, quantity: 1 },
      toObject: () => ({ name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 1 } })
    };

    const existingItem = {
      _id: 'detox1',
      name: 'De-Tox',
      type: 'gear',
      system: { stackable: true, quantity: 5 },
      update: jest.fn().mockResolvedValue({})
    };

    global.foundry.applications.ux.TextEditor.implementation.getDragEventData.mockReturnValue({ type: 'Item' });
    global.Item.implementation.fromDropData.mockResolvedValue(droppedItem);
    mockActor.items.find.mockReturnValue(existingItem);

    await DropHandlers._onDropGearForStacking(mockEvent, mockActor, droppedItem);

    expect(existingItem.update).toHaveBeenCalledWith({ 'system.quantity': 6 });
    expect(global.ui.notifications.info).toHaveBeenCalledWith(expect.stringContaining('De-Tox'));
  });

  it('should return false when dropping stackable gear with no match', async () => {
    const droppedItem = {
      type: 'gear',
      name: 'De-Tox',
      system: { stackable: true, quantity: 1 },
      toObject: () => ({ name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 1 } })
    };

    global.foundry.applications.ux.TextEditor.implementation.getDragEventData.mockReturnValue({ type: 'Item' });
    global.Item.implementation.fromDropData.mockResolvedValue(droppedItem);
    mockActor.items.find.mockReturnValue(null);

    const result = await DropHandlers._onDropGearForStacking(mockEvent, mockActor, droppedItem);

    expect(result).toBe(false);
    expect(mockActor.items.find).toHaveBeenCalled();
  });

  it('should return false when dropping non-stackable gear', async () => {
    const droppedItem = {
      type: 'gear',
      name: 'Auspex',
      system: { stackable: false, quantity: 1 },
      toObject: () => ({ name: 'Auspex', type: 'gear', system: { stackable: false, quantity: 1 } })
    };

    global.foundry.applications.ux.TextEditor.implementation.getDragEventData.mockReturnValue({ type: 'Item' });
    global.Item.implementation.fromDropData.mockResolvedValue(droppedItem);

    const result = await DropHandlers._onDropGearForStacking(mockEvent, mockActor, droppedItem);

    expect(result).toBe(false);
    expect(mockActor.items.find).not.toHaveBeenCalled();
  });

  it('should not stack items with different names', async () => {
    const droppedItem = {
      type: 'gear',
      name: 'De-Tox',
      system: { stackable: true, quantity: 1 },
      toObject: () => ({ name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 1 } })
    };

    const existingItem = {
      _id: 'pain1',
      name: 'Pain Suppressant',
      type: 'gear',
      system: { stackable: true, quantity: 3 },
      update: jest.fn()
    };

    global.foundry.applications.ux.TextEditor.implementation.getDragEventData.mockReturnValue({ type: 'Item' });
    global.Item.implementation.fromDropData.mockResolvedValue(droppedItem);
    mockActor.items.find.mockReturnValue(null);

    const result = await DropHandlers._onDropGearForStacking(mockEvent, mockActor, droppedItem);

    expect(result).toBe(false);
    expect(existingItem.update).not.toHaveBeenCalled();
  });

  it('should return true when successfully stacking items', async () => {
    const droppedItem = {
      type: 'gear',
      name: 'De-Tox',
      system: { stackable: true, quantity: 2 },
      toObject: () => ({ name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 2 } })
    };

    const existingItem = {
      _id: 'detox1',
      name: 'De-Tox',
      type: 'gear',
      system: { stackable: true, quantity: 3 },
      update: jest.fn().mockResolvedValue({})
    };

    global.foundry.applications.ux.TextEditor.implementation.getDragEventData.mockReturnValue({ type: 'Item' });
    global.Item.implementation.fromDropData.mockResolvedValue(droppedItem);
    mockActor.items.find.mockReturnValue(existingItem);

    const result = await DropHandlers._onDropGearForStacking(mockEvent, mockActor, droppedItem);

    expect(result).toBe(true);
    expect(existingItem.update).toHaveBeenCalledWith({ 'system.quantity': 5 });
  });
});
