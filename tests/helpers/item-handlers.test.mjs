import { jest } from '@jest/globals';
import { ItemHandlers } from '../../src/module/helpers/ui/item-handlers.mjs';

describe('ItemHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processItems', () => {
    it('should categorize implants correctly', () => {
      const items = [
        {
          _id: 'implant1',
          name: 'Secondary Heart',
          type: 'implant',
          img: 'systems/deathwatch/icons/implants/generic.webp',
          system: {
            description: 'Test implant',
            summary: 'Test summary',
            equipped: true,
            modifiers: []
          }
        }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.implants).toHaveLength(1);
      expect(result.implants[0].name).toBe('Secondary Heart');
      expect(result.implants[0].type).toBe('implant');
    });

    it('should categorize cybernetics correctly', () => {
      const items = [
        {
          _id: 'cyber1',
          name: 'Bionic Arm',
          type: 'cybernetic',
          img: 'icons/svg/book.svg',
          system: {
            description: 'Test cybernetic',
            equipped: false,
            modifiers: []
          }
        }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.cybernetics).toHaveLength(1);
      expect(result.cybernetics[0].name).toBe('Bionic Arm');
      expect(result.cybernetics[0].type).toBe('cybernetic');
    });

    it('should categorize multiple implants and cybernetics', () => {
      const items = [
        {
          _id: 'implant1',
          name: 'Secondary Heart',
          type: 'implant',
          img: 'systems/deathwatch/icons/implants/generic.webp',
          system: { equipped: true, modifiers: [] }
        },
        {
          _id: 'cyber1',
          name: 'Bionic Arm',
          type: 'cybernetic',
          img: 'icons/svg/book.svg',
          system: { equipped: false, modifiers: [] }
        },
        {
          _id: 'implant2',
          name: 'Ossmodula',
          type: 'implant',
          img: 'systems/deathwatch/icons/implants/generic.webp',
          system: { equipped: true, modifiers: [] }
        }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.implants).toHaveLength(2);
      expect(result.cybernetics).toHaveLength(1);
    });

    it('should handle items with no implants or cybernetics', () => {
      const items = [
        {
          _id: 'weapon1',
          name: 'Bolter',
          type: 'weapon',
          img: 'icons/svg/sword.svg',
          system: { equipped: true }
        }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.implants).toHaveLength(0);
      expect(result.cybernetics).toHaveLength(0);
      expect(result.weapons).toHaveLength(1);
    });

    it('should categorize special abilities correctly', () => {
      const items = [
        {
          _id: 'sabi1',
          name: 'Bolter Mastery',
          type: 'special-ability',
          system: { key: 'bolter-mastery', specialty: 'Tactical Marine', book: 'Core', page: '85' }
        }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.specialAbilities).toHaveLength(1);
      expect(result.specialAbilities[0].name).toBe('Bolter Mastery');
      expect(result.specialAbilities[0].system.specialty).toBe('Tactical Marine');
    });

    it('should sort talents numerically so Psy Rating 3 comes before Psy Rating 10', () => {
      const items = [
        { _id: 't1', name: 'Psy Rating 10', type: 'talent', system: { modifiers: [] } },
        { _id: 't2', name: 'Psy Rating 3', type: 'talent', system: { modifiers: [] } },
        { _id: 't3', name: 'Psy Rating 4', type: 'talent', system: { modifiers: [] } }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.talents[0].name).toBe('Psy Rating 3');
      expect(result.talents[1].name).toBe('Psy Rating 4');
      expect(result.talents[2].name).toBe('Psy Rating 10');
    });
  });

  describe('buildSummaries', () => {
    it('should summarize weapons with count and equipped', () => {
      const categories = {
        weapons: [
          { system: { equipped: true, loadedAmmo: 'a1' } },
          { system: { equipped: false } },
          { system: { equipped: true } }
        ],
        armor: [],
        gear: [],
        ammunition: []
      };

      const result = ItemHandlers.buildSummaries(categories);

      expect(result.weapons).toBe('3 weapons, 2 equipped');
    });

    it('should use singular for 1 weapon', () => {
      const categories = {
        weapons: [{ system: { equipped: true } }],
        armor: [],
        gear: [],
        ammunition: []
      };

      const result = ItemHandlers.buildSummaries(categories);

      expect(result.weapons).toBe('1 weapon, 1 equipped');
    });

    it('should summarize armor with count and equipped', () => {
      const categories = {
        weapons: [],
        armor: [
          { system: { equipped: true } },
          { system: { equipped: false } }
        ],
        gear: [],
        ammunition: []
      };

      const result = ItemHandlers.buildSummaries(categories);

      expect(result.armor).toBe('2 armor, 1 equipped');
    });

    it('should summarize gear with count and total weight', () => {
      const categories = {
        weapons: [],
        armor: [],
        gear: [
          { system: { wt: 2.5 } },
          { system: { wt: 1 } },
          { system: { wt: 0 } }
        ],
        ammunition: []
      };

      const result = ItemHandlers.buildSummaries(categories);

      expect(result.gear).toBe('3 items, 3.5 kg');
    });

    it('should summarize ammunition with count and loaded', () => {
      const categories = {
        weapons: [
          { system: { loadedAmmo: 'a1' } },
          { system: { loadedAmmo: null } }
        ],
        armor: [],
        gear: [],
        ammunition: [
          { _id: 'a2' },
          { _id: 'a3' }
        ]
      };

      const result = ItemHandlers.buildSummaries(categories);

      expect(result.ammunition).toBe('2 types, 1 loaded');
    });

    it('should handle empty categories', () => {
      const categories = {
        weapons: [],
        armor: [],
        gear: [],
        ammunition: []
      };

      const result = ItemHandlers.buildSummaries(categories);

      expect(result.weapons).toBe('0 weapons, 0 equipped');
      expect(result.armor).toBe('0 armor, 0 equipped');
      expect(result.gear).toBe('0 items, 0 kg');
      expect(result.ammunition).toBe('0 types, 0 loaded');
    });

    it('should count grouped gear items by quantity', () => {
      const categories = {
        weapons: [],
        armor: [],
        gear: [
          { system: { wt: 1 }, quantity: 3, ids: ['g1', 'g2', 'g3'] }, // Grouped: 3 De-Tox
          { system: { wt: 2 } }, // Non-grouped item
          { system: { wt: 0.5 }, quantity: 2, ids: ['g4', 'g5'] } // Grouped: 2 Stimms
        ],
        ammunition: []
      };

      const result = ItemHandlers.buildSummaries(categories);

      expect(result.gear).toBe('6 items, 6 kg'); // 3 + 1 + 2 = 6 items, (3*1) + (1*2) + (2*0.5) = 6 kg
    });

    it('should multiply weight by quantity for grouped items', () => {
      const categories = {
        weapons: [],
        armor: [],
        gear: [
          { system: { wt: 1 }, quantity: 3, ids: ['g1', 'g2', 'g3'] }, // 3 kg total
          { system: { wt: 2 }, quantity: 1, ids: ['g4'] }, // 2 kg total
          { system: { wt: 0.5 } } // 0.5 kg (non-grouped)
        ],
        ammunition: []
      };

      const result = ItemHandlers.buildSummaries(categories);

      expect(result.gear).toBe('5 items, 5.5 kg'); // 3+1+1=5 items, 3+2+0.5=5.5 kg
    });
  });
});
