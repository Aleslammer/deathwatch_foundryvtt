import { jest } from '@jest/globals';
import '../setup.mjs';
import { DeathwatchActor } from '../../src/module/documents/actor.mjs';

describe('Stackable Talent XP Cost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Single instance of stackable talent', () => {
    it('uses base cost for first instance', () => {
      const mockItems = [
        { 
          name: 'Sound Constitution',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 15000, spent: 0 },
          characteristics: {
            ws: { value: 40 }, bs: { value: 40 }, str: { value: 40 },
            tg: { value: 40 }, ag: { value: 40 }, int: { value: 40 },
            per: { value: 40 }, wil: { value: 40 }, fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(12500); // 12000 + 500
    });
  });

  describe('Multiple instances of stackable talent', () => {
    it('uses base cost for first, subsequent cost for additional instances', () => {
      const mockItems = [
        { 
          name: 'Sound Constitution',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        },
        { 
          name: 'Sound Constitution',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        },
        { 
          name: 'Sound Constitution',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 20000, spent: 0 },
          characteristics: {
            ws: { value: 40 }, bs: { value: 40 }, str: { value: 40 },
            tg: { value: 40 }, ag: { value: 40 }, int: { value: 40 },
            per: { value: 40 }, wil: { value: 40 }, fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(14500); // 12000 + 500 + 1000 + 1000
    });
  });

  describe('Non-stackable talent taken multiple times', () => {
    it('uses base cost for each instance', () => {
      const mockItems = [
        { 
          name: 'Fearless',
          type: 'talent', 
          system: { 
            cost: 1000, 
            stackable: false, 
            subsequentCost: 0 
          } 
        },
        { 
          name: 'Fearless',
          type: 'talent', 
          system: { 
            cost: 1000, 
            stackable: false, 
            subsequentCost: 0 
          } 
        }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 20000, spent: 0 },
          characteristics: {
            ws: { value: 40 }, bs: { value: 40 }, str: { value: 40 },
            tg: { value: 40 }, ag: { value: 40 }, int: { value: 40 },
            per: { value: 40 }, wil: { value: 40 }, fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(14000); // 12000 + 1000 + 1000
    });
  });

  describe('Mixed stackable and non-stackable talents', () => {
    it('calculates costs correctly for both types', () => {
      const mockItems = [
        { 
          name: 'Sound Constitution',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        },
        { 
          name: 'Sound Constitution',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        },
        { 
          name: 'Fearless',
          type: 'talent', 
          system: { 
            cost: 1000, 
            stackable: false, 
            subsequentCost: 0 
          } 
        }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 20000, spent: 0 },
          characteristics: {
            ws: { value: 40 }, bs: { value: 40 }, str: { value: 40 },
            tg: { value: 40 }, ag: { value: 40 }, int: { value: 40 },
            per: { value: 40 }, wil: { value: 40 }, fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(14500); // 12000 + 500 + 1000 + 1000
    });
  });

  describe('Stackable talent without subsequentCost', () => {
    it('uses base cost for all instances', () => {
      const mockItems = [
        { 
          name: 'Test Talent',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 0 
          } 
        },
        { 
          name: 'Test Talent',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 0 
          } 
        }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 20000, spent: 0 },
          characteristics: {
            ws: { value: 40 }, bs: { value: 40 }, str: { value: 40 },
            tg: { value: 40 }, ag: { value: 40 }, int: { value: 40 },
            per: { value: 40 }, wil: { value: 40 }, fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      actor._prepareCharacterData(actor);

      expect(actor.system.xp.spent).toBe(13000); // 12000 + 500 + 500
    });
  });

  describe('Different stackable talents', () => {
    it('tracks each talent separately', () => {
      const mockItems = [
        { 
          name: 'Sound Constitution',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        },
        { 
          name: 'Sound Constitution',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        },
        { 
          name: 'Signature Wargear',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        },
        { 
          name: 'Signature Wargear',
          type: 'talent', 
          system: { 
            cost: 500, 
            stackable: true, 
            subsequentCost: 1000 
          } 
        }
      ];

      const actor = new DeathwatchActor({
        name: 'Test Actor',
        type: 'character',
        system: {
          xp: { total: 20000, spent: 0 },
          characteristics: {
            ws: { value: 40 }, bs: { value: 40 }, str: { value: 40 },
            tg: { value: 40 }, ag: { value: 40 }, int: { value: 40 },
            per: { value: 40 }, wil: { value: 40 }, fs: { value: 40 }
          },
          skills: {}
        }
      });

      actor.items = mockItems;
      actor._prepareCharacterData(actor);

      // Sound Constitution: 500 + 1000 = 1500
      // Signature Wargear: 500 + 1000 = 1500
      // Total: 12000 + 1500 + 1500 = 15000
      expect(actor.system.xp.spent).toBe(15000);
    });
  });
});
