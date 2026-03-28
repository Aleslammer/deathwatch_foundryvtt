import { jest } from '@jest/globals';
import { DeathwatchActor } from '../../src/module/documents/actor.mjs';
import DeathwatchCharacter from '../../src/module/data/actor/character.mjs';
import { XPCalculator } from '../../src/module/helpers/xp-calculator.mjs';

function prepareCharacterData(actor) {
  const model = new DeathwatchCharacter();
  Object.assign(model, actor.system);
  model.parent = actor;
  model.prepareDerivedData();
  Object.assign(actor.system, model);
}

describe('Stackable Talent with Specialty Rank Overrides', () => {
  let actor;
  let mockSpecialty;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Apothecary specialty with Sound Constitution in ranks 6, 7, 8
    mockSpecialty = {
      _id: 'specialty123',
      name: 'Apothecary',
      type: 'specialty',
      system: {
        characteristicCosts: {},
        skillCosts: {},
        rankCosts: {
          '6': {
            skills: {},
            talents: {
              'tal00000000244': 500  // First Sound Constitution
            }
          },
          '7': {
            skills: {},
            talents: {
              'tal00000000244': 1000  // Second Sound Constitution
            }
          },
          '8': {
            skills: {},
            talents: {
              'tal00000000244': 1000  // Third Sound Constitution
            }
          }
        }
      }
    };

    actor = new DeathwatchActor({
      name: 'Test Apothecary',
      type: 'character',
      system: {
        specialtyId: 'specialty123',
        rank: 8,
        xp: { total: 20000, spent: 0 },
        characteristics: {
          ws: { value: 40 }, bs: { value: 40 }, str: { value: 40 },
          tg: { value: 40 }, ag: { value: 40 }, int: { value: 40 },
          per: { value: 40 }, wil: { value: 40 }, fs: { value: 40 }
        },
        skills: {}
      }
    });
  });

  it('applies rank-specific overrides to first three instances of Sound Constitution', () => {
    const mockTalent1 = {
      _id: 'talent001',
      name: 'Sound Constitution',
      type: 'talent',
      system: {
        cost: 500,
        stackable: true,
        subsequentCost: 1000,
        compendiumId: 'tal00000000244',
        equipped: false,
        modifiers: []
      }
    };

    const mockTalent2 = {
      _id: 'talent002',
      name: 'Sound Constitution',
      type: 'talent',
      system: {
        cost: 500,
        stackable: true,
        subsequentCost: 1000,
        compendiumId: 'tal00000000244',
        equipped: false,
        modifiers: []
      }
    };

    const mockTalent3 = {
      _id: 'talent003',
      name: 'Sound Constitution',
      type: 'talent',
      system: {
        cost: 500,
        stackable: true,
        subsequentCost: 1000,
        compendiumId: 'tal00000000244',
        equipped: false,
        modifiers: []
      }
    };

    actor.items = {
      get: jest.fn((id) => {
        if (id === 'specialty123') return mockSpecialty;
        return null;
      }),
      [Symbol.iterator]: function* () {
        yield mockSpecialty;
        yield mockTalent1;
        yield mockTalent2;
        yield mockTalent3;
      }
    };

    prepareCharacterData(actor);
    
    // Base (12000) + rank 6 override (500) + rank 7 override (1000) + rank 8 override (1000) = 14500
    expect(actor.system.xp.spent).toBe(14500);
  });

  it('uses subsequentCost for fourth instance when no rank override exists', () => {
    const mockTalent1 = {
      _id: 'talent001',
      name: 'Sound Constitution',
      type: 'talent',
      system: {
        cost: 500,
        stackable: true,
        subsequentCost: 1000,
        compendiumId: 'tal00000000244',
        equipped: false,
        modifiers: []
      }
    };

    const mockTalent2 = {
      _id: 'talent002',
      name: 'Sound Constitution',
      type: 'talent',
      system: {
        cost: 500,
        stackable: true,
        subsequentCost: 1000,
        compendiumId: 'tal00000000244',
        equipped: false,
        modifiers: []
      }
    };

    const mockTalent3 = {
      _id: 'talent003',
      name: 'Sound Constitution',
      type: 'talent',
      system: {
        cost: 500,
        stackable: true,
        subsequentCost: 1000,
        compendiumId: 'tal00000000244',
        equipped: false,
        modifiers: []
      }
    };

    const mockTalent4 = {
      _id: 'talent004',
      name: 'Sound Constitution',
      type: 'talent',
      system: {
        cost: 500,
        stackable: true,
        subsequentCost: 1000,
        compendiumId: 'tal00000000244',
        equipped: false,
        modifiers: []
      }
    };

    actor.items = {
      get: jest.fn((id) => {
        if (id === 'specialty123') return mockSpecialty;
        return null;
      }),
      [Symbol.iterator]: function* () {
        yield mockSpecialty;
        yield mockTalent1;
        yield mockTalent2;
        yield mockTalent3;
        yield mockTalent4;
      }
    };

    prepareCharacterData(actor);
    
    // Base (12000) + 500 + 1000 + 1000 + 1000 (subsequentCost) = 15500
    expect(actor.system.xp.spent).toBe(15500);
  });

  it('non-stackable talent uses last rank override (not per-instance)', () => {
    const mockSpecialtyNonStackable = {
      _id: 'specialty456',
      name: 'Test Specialty',
      type: 'specialty',
      system: {
        characteristicCosts: {},
        skillCosts: {},
        rankCosts: {
          '1': {
            skills: {},
            talents: {
              'tal00000000100': 500
            }
          },
          '2': {
            skills: {},
            talents: {
              'tal00000000100': 300
            }
          },
          '3': {
            skills: {},
            talents: {
              'tal00000000100': 200
            }
          }
        }
      }
    };

    const mockNonStackableTalent = {
      _id: 'talent100',
      name: 'Non-Stackable Talent',
      type: 'talent',
      system: {
        cost: 1000,
        stackable: false,
        subsequentCost: 0,
        compendiumId: 'tal00000000100',
        equipped: false,
        modifiers: []
      }
    };

    const testActor = {
      system: {
        specialtyId: 'specialty456',
        rank: 3,
        characteristics: {},
        skills: {}
      },
      items: {
        get: jest.fn((id) => {
          if (id === 'specialty456') return mockSpecialtyNonStackable;
          return null;
        }),
        [Symbol.iterator]: function* () {
          yield mockSpecialtyNonStackable;
          yield mockNonStackableTalent;
        }
      }
    };

    const result = XPCalculator.calculateSpentXP(testActor);
    
    // Base (12000) + 200 (last rank override wins for non-stackable) = 12200
    expect(result).toBe(12200);
  });
});
