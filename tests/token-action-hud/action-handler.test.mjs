import { jest } from '@jest/globals';

describe('Token Action HUD - ActionHandler', () => {
  let ActionHandler;
  let mockActor;
  let mockToken;

  beforeEach(async () => {
    // Mock TAH Core's ActionHandler base class
    const BaseActionHandler = class {
      constructor(tokenId) {
        this.tokenId = tokenId;
        this.actors = [];
      }
      addGroup(groupId, groupName) {}
      addAction(groupId, action) {}
    };

    // Import our factory function
    const module = await import('../../src/module/token-action-hud/action-handler.mjs');
    const createActionHandler = module.createActionHandler;

    // Create our ActionHandler class from the factory
    ActionHandler = createActionHandler(BaseActionHandler);

    // Mock actor with items
    mockActor = {
      id: 'test-actor-123',
      type: 'character',
      name: 'Test Marine',
      system: {
        characteristics: {
          ws: { bonus: 5 },
          bs: { bonus: 4 },
          s: { bonus: 4 },
          t: { bonus: 4 },
          ag: { bonus: 4 },
          int: { bonus: 3 },
          per: { bonus: 4 },
          wp: { bonus: 4 },
          fel: { bonus: 3 }
        }
      },
      items: []
    };

    mockToken = {
      id: 'test-token-456',
      actor: mockActor
    };
  });

  describe('Weapon Categorization', () => {
    test('categorizes ranged weapons correctly', () => {
      mockActor.items = [
        {
          id: 'weapon1',
          type: 'weapon',
          name: 'Bolter',
          system: {
            class: 'basic',
            damage: { formula: '1d10+5' },
            equipped: true
          },
          img: 'icons/weapons/bolter.webp'
        },
        {
          id: 'weapon2',
          type: 'weapon',
          name: 'Plasma Gun',
          system: {
            class: 'plasma',
            damage: { formula: '1d10+6' },
            equipped: true
          },
          img: 'icons/weapons/plasma.webp'
        }
      ];

      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ rangedWeapons: true });

      // Should have created nested groups for ranged weapons
      const calls = spy.mock.calls;
      const rangedCalls = calls.filter(call => call[0] === 'rangedWeapons');

      expect(rangedCalls.length).toBeGreaterThan(0);

      // Check that weapons have nested attack/damage actions
      const bolterGroup = rangedCalls.find(call =>
        call[1].id === 'weapon-weapon1'
      );
      expect(bolterGroup).toBeDefined();
      expect(bolterGroup[1].actions).toHaveLength(2);
      expect(bolterGroup[1].actions[0].name).toBe('Attack');
      expect(bolterGroup[1].actions[1].name).toBe('Damage');
    });

    test('categorizes melee weapons correctly', () => {
      mockActor.items = [
        {
          id: 'weapon1',
          type: 'weapon',
          name: 'Chainsword',
          system: {
            class: 'melee',
            damage: { formula: '1d10+5' },
            equipped: true
          },
          img: 'icons/weapons/chainsword.webp'
        }
      ];

      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ meleeWeapons: true });

      const calls = spy.mock.calls;
      const meleeCalls = calls.filter(call => call[0] === 'meleeWeapons');

      expect(meleeCalls.length).toBeGreaterThan(0);

      const chainswordGroup = meleeCalls.find(call =>
        call[1].id === 'weapon-weapon1'
      );
      expect(chainswordGroup).toBeDefined();
    });

    test('categorizes grenades correctly', () => {
      mockActor.items = [
        {
          id: 'weapon1',
          type: 'weapon',
          name: 'Frag Grenade',
          system: {
            class: 'thrown',
            damage: { formula: '2d10' },
            equipped: true
          },
          img: 'icons/weapons/grenade.webp'
        },
        {
          id: 'weapon2',
          type: 'weapon',
          name: 'Krak Grenade',
          system: {
            class: 'grenade',
            damage: { formula: '2d10+4' },
            equipped: true
          },
          img: 'icons/weapons/krak.webp'
        }
      ];

      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ grenades: true });

      const calls = spy.mock.calls;
      const grenadeCalls = calls.filter(call => call[0] === 'grenades');

      expect(grenadeCalls.length).toBe(2);
    });

    test('only shows equipped weapons', () => {
      mockActor.items = [
        {
          id: 'weapon1',
          type: 'weapon',
          name: 'Bolter',
          system: {
            class: 'basic',
            damage: { formula: '1d10+5' },
            equipped: true
          },
          img: 'icons/weapons/bolter.webp'
        },
        {
          id: 'weapon2',
          type: 'weapon',
          name: 'Unequipped Gun',
          system: {
            class: 'basic',
            damage: { formula: '1d10+3' },
            equipped: false
          },
          img: 'icons/weapons/gun.webp'
        }
      ];

      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ rangedWeapons: true });

      const calls = spy.mock.calls;
      const rangedCalls = calls.filter(call => call[0] === 'rangedWeapons');

      // Should only have one weapon (the equipped one)
      expect(rangedCalls.length).toBe(1);
      expect(rangedCalls[0][1].name).toBe('Bolter');
    });
  });

  describe('Action Encoding', () => {
    test('encodes weapon actions correctly', () => {
      mockActor.items = [
        {
          id: 'weapon-abc123',
          type: 'weapon',
          name: 'Bolter',
          system: {
            class: 'basic',
            damage: { formula: '1d10+5' },
            equipped: true
          },
          img: 'icons/weapons/bolter.webp'
        }
      ];

      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ rangedWeapons: true });

      const calls = spy.mock.calls;
      const weaponGroup = calls.find(call =>
        call[1].id === 'weapon-weapon-abc123'
      );

      expect(weaponGroup).toBeDefined();
      expect(weaponGroup[1].actions[0].encodedValue).toBe('weapon|weapon-abc123|attack');
      expect(weaponGroup[1].actions[1].encodedValue).toBe('weapon|weapon-abc123|damage');
    });

    test('encodes skill actions correctly', () => {
      mockActor.items = [
        {
          id: 'skill1',
          type: 'skill',
          name: 'Awareness',
          system: {
            isAdvanced: false,
            rating: 3
          }
        }
      ];

      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ basicSkills: true });

      const calls = spy.mock.calls;
      const skillAction = calls.find(call =>
        call[1].name === 'Awareness'
      );

      expect(skillAction).toBeDefined();
      expect(skillAction[1].encodedValue).toBe('skill|skill1');
    });

    test('encodes characteristic actions correctly', () => {
      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ characteristics: true });

      const calls = spy.mock.calls;
      const agAction = calls.find(call =>
        call[1].name === 'Agility'
      );

      expect(agAction).toBeDefined();
      expect(agAction[1].encodedValue).toBe('characteristic|ag');
    });
  });

  describe('Skills', () => {
    test('separates basic and advanced skills', () => {
      mockActor.items = [
        {
          id: 'skill1',
          type: 'skill',
          name: 'Awareness',
          system: { isAdvanced: false, rating: 3 }
        },
        {
          id: 'skill2',
          type: 'skill',
          name: 'Scholastic Lore',
          system: { isAdvanced: true, rating: 2 }
        }
      ];

      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ basicSkills: true, advancedSkills: true });

      const calls = spy.mock.calls;
      const basicCalls = calls.filter(call => call[0] === 'basicSkills');
      const advancedCalls = calls.filter(call => call[0] === 'advancedSkills');

      expect(basicCalls.length).toBe(1);
      expect(basicCalls[0][1].name).toBe('Awareness');

      expect(advancedCalls.length).toBe(1);
      expect(advancedCalls[0][1].name).toBe('Scholastic Lore');
    });
  });

  describe('Characteristics', () => {
    test('creates actions for all 9 characteristics', () => {
      const handler = new ActionHandler('test-token-456');
      handler.actors = [mockActor];

      const spy = jest.spyOn(handler, 'addAction');
      handler.buildSystemActions({ characteristics: true });

      const calls = spy.mock.calls;
      const charCalls = calls.filter(call => call[0] === 'characteristics');

      expect(charCalls.length).toBe(9);

      const charNames = charCalls.map(call => call[1].name);
      expect(charNames).toContain('Weapon Skill');
      expect(charNames).toContain('Ballistic Skill');
      expect(charNames).toContain('Strength');
      expect(charNames).toContain('Toughness');
      expect(charNames).toContain('Agility');
      expect(charNames).toContain('Intelligence');
      expect(charNames).toContain('Perception');
      expect(charNames).toContain('Willpower');
      expect(charNames).toContain('Fellowship');
    });
  });
});
