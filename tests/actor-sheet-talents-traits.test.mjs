import { jest } from '@jest/globals';
import './setup.mjs';
import { DeathwatchActorSheet } from '../src/module/sheets/actor-sheet.mjs';

describe('DeathwatchActorSheet - Talents and Traits', () => {
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
          ws: { value: 40, bonus: 4, mod: 4 },
          bs: { value: 45, bonus: 4, mod: 4 }
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
      isOwner: true
    };

    sheet = new DeathwatchActorSheet(mockActor, {});
  });

  describe('_prepareItems', () => {
    it('should categorize talents correctly', () => {
      const context = {
        items: [
          {
            _id: 'talent1',
            type: 'talent',
            name: 'Deadeye Shot',
            img: 'icons/talent.png',
            system: {
              prerequisite: 'BS 40',
              benefit: 'Reduce called shot penalty',
              description: '<p>Talent description</p>',
              book: 'Core Rulebook',
              page: '50',
              modifiers: []
            }
          },
          {
            _id: 'talent2',
            type: 'talent',
            name: 'True Grit',
            img: 'icons/talent2.png',
            system: {
              prerequisite: 'TG 40',
              benefit: 'Reduce critical damage',
              description: '<p>Another talent</p>',
              book: 'Core Rulebook',
              page: '55',
              modifiers: []
            }
          }
        ]
      };

      sheet._prepareItems(context);

      expect(context.talents).toBeDefined();
      expect(context.talents.length).toBe(2);
      expect(context.talents[0].name).toBe('Deadeye Shot');
      expect(context.talents[1].name).toBe('True Grit');
    });

    it('should categorize traits correctly', () => {
      const context = {
        items: [
          {
            _id: 'trait1',
            type: 'trait',
            name: 'Unnatural Strength (x2)',
            img: 'icons/trait.png',
            system: {
              description: '<p>Trait description</p>',
              book: 'Core Rulebook',
              page: '100',
              modifiers: []
            }
          },
          {
            _id: 'trait2',
            type: 'trait',
            name: 'Fear (2)',
            img: 'icons/trait2.png',
            system: {
              description: '<p>Another trait</p>',
              book: 'Core Rulebook',
              page: '105',
              modifiers: []
            }
          }
        ]
      };

      sheet._prepareItems(context);

      expect(context.traits).toBeDefined();
      expect(context.traits.length).toBe(2);
      expect(context.traits[0].name).toBe('Unnatural Strength (x2)');
      expect(context.traits[1].name).toBe('Fear (2)');
    });

    it('should handle mixed item types including talents and traits', () => {
      const context = {
        items: [
          { _id: 'weapon1', type: 'weapon', name: 'Bolter', img: 'icons/weapon.png', system: { equipped: false, loadedAmmo: null, modifiers: [] } },
          { _id: 'talent1', type: 'talent', name: 'Deadeye Shot', img: 'icons/talent.png', system: { prerequisite: 'BS 40', benefit: '', description: '', book: '', page: '', modifiers: [] } },
          { _id: 'armor1', type: 'armor', name: 'Power Armor', img: 'icons/armor.png', system: { equipped: false, attachedHistories: [], modifiers: [] } },
          { _id: 'trait1', type: 'trait', name: 'Unnatural Strength', img: 'icons/trait.png', system: { description: '', book: '', page: '', modifiers: [] } },
          { _id: 'gear1', type: 'gear', name: 'Auspex', img: 'icons/gear.png', system: { equipped: false, modifiers: [] } }
        ]
      };

      sheet._prepareItems(context);

      expect(context.weapons.length).toBe(1);
      expect(context.talents.length).toBe(1);
      expect(context.armor.length).toBe(1);
      expect(context.traits.length).toBe(1);
      expect(context.gear.length).toBe(1);
    });

    it('should initialize empty arrays when no talents or traits exist', () => {
      const context = {
        items: [
          { _id: 'weapon1', type: 'weapon', name: 'Bolter', img: 'icons/weapon.png', system: { equipped: false, loadedAmmo: null, modifiers: [] } }
        ]
      };

      sheet._prepareItems(context);

      expect(context.talents).toBeDefined();
      expect(context.talents.length).toBe(0);
      expect(context.traits).toBeDefined();
      expect(context.traits.length).toBe(0);
    });

    it('should preserve talent properties for display', () => {
      const context = {
        items: [
          {
            _id: 'talent1',
            type: 'talent',
            name: 'Deadeye Shot',
            img: 'icons/talent.png',
            system: {
              prerequisite: 'BS 40',
              benefit: 'Reduce called shot penalty',
              description: '<p>Detailed description</p>',
              book: 'Core Rulebook',
              page: '50',
              modifiers: [{ name: 'Called Shot', modifier: 10, effectType: 'skill' }]
            }
          }
        ]
      };

      sheet._prepareItems(context);

      const talent = context.talents[0];
      expect(talent.system.prerequisite).toBe('BS 40');
      expect(talent.system.benefit).toBe('Reduce called shot penalty');
      expect(talent.system.description).toBe('<p>Detailed description</p>');
      expect(talent.system.book).toBe('Core Rulebook');
      expect(talent.system.page).toBe('50');
      expect(talent.system.modifiers.length).toBe(1);
    });

    it('should preserve trait properties for display', () => {
      const context = {
        items: [
          {
            _id: 'trait1',
            type: 'trait',
            name: 'Unnatural Strength (x2)',
            img: 'icons/trait.png',
            system: {
              description: '<p>Doubles strength bonus</p>',
              book: 'Core Rulebook',
              page: '100',
              modifiers: [{ name: 'Strength Multiplier', modifier: 2, effectType: 'characteristic' }]
            }
          }
        ]
      };

      sheet._prepareItems(context);

      const trait = context.traits[0];
      expect(trait.system.description).toBe('<p>Doubles strength bonus</p>');
      expect(trait.system.book).toBe('Core Rulebook');
      expect(trait.system.page).toBe('100');
      expect(trait.system.modifiers.length).toBe(1);
    });
  });

  describe('getData', () => {
    it('should include talents and traits in context for character sheets', () => {
      // Mock game.deathwatch.config
      global.game.deathwatch = {
        config: {
          CharacteristicWords: {
            ws: 'Weapon Skill',
            bs: 'Ballistic Skill'
          },
          Skills: {}
        }
      };

      // Mock the parent getData to return a proper context
      const parentGetData = jest.spyOn(Object.getPrototypeOf(DeathwatchActorSheet.prototype), 'getData');
      parentGetData.mockReturnValue({
        actor: mockActor,
        system: mockActor.system,
        flags: {},
        items: [
          { _id: 'talent1', type: 'talent', name: 'Deadeye Shot', img: 'icons/talent.png', system: { prerequisite: '', benefit: '', description: '', book: '', page: '', modifiers: [] } },
          { _id: 'trait1', type: 'trait', name: 'Unnatural Strength', img: 'icons/trait.png', system: { description: '', book: '', page: '', modifiers: [] } }
        ]
      });

      const context = sheet.getData();

      expect(context.talents).toBeDefined();
      expect(context.traits).toBeDefined();
      expect(context.talents.length).toBe(1);
      expect(context.traits.length).toBe(1);

      parentGetData.mockRestore();
    });
  });
});
