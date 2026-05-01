import { jest } from '@jest/globals';
import { ItemHandlers } from '../../src/module/helpers/ui/item-handlers.mjs';

describe('ItemHandlers.groupGear', () => {
  it('should group stackable gear items by name and sum quantities', () => {
    const gearItems = [
      { _id: 'detox1', name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 3 } },
      { _id: 'detox2', name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 5 } },
      { _id: 'detox3', name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 4 } }
    ];

    const result = ItemHandlers.groupGear(gearItems);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('De-Tox');
    expect(result[0].quantity).toBe(12);
    expect(result[0].ids).toEqual(['detox1', 'detox2', 'detox3']);
  });

  it('should leave non-stackable items ungrouped', () => {
    const gearItems = [
      { _id: 'auspex1', name: 'Auspex', type: 'gear', system: { stackable: false, quantity: 1 } },
      { _id: 'auspex2', name: 'Auspex', type: 'gear', system: { stackable: false, quantity: 1 } }
    ];

    const result = ItemHandlers.groupGear(gearItems);

    expect(result).toHaveLength(2);
    expect(result[0]._id).toBe('auspex1');
    expect(result[1]._id).toBe('auspex2');
  });

  it('should handle mixed stackable and non-stackable items', () => {
    const gearItems = [
      { _id: 'detox1', name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 2 } },
      { _id: 'detox2', name: 'De-Tox', type: 'gear', system: { stackable: true, quantity: 3 } },
      { _id: 'auspex1', name: 'Auspex', type: 'gear', system: { stackable: false, quantity: 1 } }
    ];

    const result = ItemHandlers.groupGear(gearItems);

    expect(result).toHaveLength(2);
    const detox = result.find(i => i.name === 'De-Tox');
    const auspex = result.find(i => i.name === 'Auspex');
    expect(detox.quantity).toBe(5);
    expect(auspex._id).toBe('auspex1');
  });

  it('should handle empty array', () => {
    const result = ItemHandlers.groupGear([]);
    expect(result).toEqual([]);
  });

  it('should handle items with same name but different stackable flags', () => {
    const gearItems = [
      { _id: 'item1', name: 'Item', type: 'gear', system: { stackable: true, quantity: 2 } },
      { _id: 'item2', name: 'Item', type: 'gear', system: { stackable: false, quantity: 1 } }
    ];

    const result = ItemHandlers.groupGear(gearItems);

    expect(result).toHaveLength(2);
    const stackable = result.find(i => i.ids);
    const nonStackable = result.find(i => !i.ids);
    expect(stackable.quantity).toBe(2);
    expect(nonStackable._id).toBe('item2');
  });

  it('should sort grouped gear alphabetically', () => {
    const gearItems = [
      { _id: 'z1', name: 'Zed Item', type: 'gear', system: { stackable: true, quantity: 1 } },
      { _id: 'a1', name: 'Alpha Item', type: 'gear', system: { stackable: true, quantity: 1 } },
      { _id: 'm1', name: 'Middle Item', type: 'gear', system: { stackable: true, quantity: 1 } }
    ];

    const result = ItemHandlers.groupGear(gearItems);

    expect(result[0].name).toBe('Alpha Item');
    expect(result[1].name).toBe('Middle Item');
    expect(result[2].name).toBe('Zed Item');
  });
});
