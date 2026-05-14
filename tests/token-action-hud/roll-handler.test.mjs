import { jest } from '@jest/globals';

describe('RollHandler', () => {
  let RollHandler;
  let mockToken;
  let mockActor;
  let mockRollExecutor;
  let mockCombatHelper;

  beforeEach(async () => {
    // Mock game.user
    global.game = {
      user: {
        isGM: false,
      },
      socket: {
        emit: jest.fn(),
      },
    };

    // Mock ui.notifications
    global.ui = {
      notifications: {
        warn: jest.fn(),
        info: jest.fn(),
      },
    };

    // Create mock actor
    mockActor = {
      id: 'test-actor-123',
      type: 'character',
      name: 'Test Marine',
      system: {
        characteristics: {
          ws: { value: 45, total: 45 },
          bs: { value: 50, total: 50 },
        },
        skills: [
          { key: 'awareness', total: 55, label: 'Awareness' },
          { key: 'stealth', total: 40, label: 'Stealth' },
        ],
      },
      testUserPermission: jest.fn(() => false),
      items: [],
    };

    // Create mock token
    mockToken = {
      actor: mockActor,
    };

    // Mock RollExecutor
    mockRollExecutor = {
      showSkillDialog: jest.fn(),
      showCharacteristicDialog: jest.fn(),
    };

    // Mock CombatHelper
    mockCombatHelper = {
      weaponAttackDialog: jest.fn(),
      clearJam: jest.fn(),
    };

    // Import RollHandler and inject mocks
    const module = await import('../../src/module/token-action-hud/roll-handler.mjs');
    const BaseRollHandler = class {
      constructor(actor, token) {
        this.actor = actor;
        this.token = token;
      }
    };
    RollHandler = module.createRollHandler(BaseRollHandler, mockRollExecutor, mockCombatHelper);
  });

  describe('handleAction', () => {
    test('should decode weapon attack action and call CombatHelper.weaponAttackDialog', async () => {
      const handler = new RollHandler(mockActor, mockToken);
      const weaponId = 'weapon-abc123';
      const encodedValue = `weapon|${weaponId}|attack`;

      // Add weapon to actor
      const mockWeapon = { id: weaponId, name: 'Bolter', type: 'rangedWeapon' };
      mockActor.items = {
        get: jest.fn(() => mockWeapon),
      };

      // Grant permission
      game.user.isGM = true;

      await handler.handleAction({ actionId: 'weaponAttack', encodedValue });

      expect(mockCombatHelper.weaponAttackDialog).toHaveBeenCalledWith(mockActor, mockWeapon);
    });

    test('should decode skill action and call RollExecutor.showSkillDialog', async () => {
      const handler = new RollHandler(mockActor, mockToken);
      const skillKey = 'awareness';
      const encodedValue = `skill|${skillKey}`;

      // Grant permission
      game.user.isGM = true;

      await handler.handleAction({ actionId: 'skillTest', encodedValue });

      expect(mockRollExecutor.showSkillDialog).toHaveBeenCalledWith(
        mockActor,
        { key: 'awareness', total: 55, label: 'Awareness' },
        'Awareness',
        55
      );
    });

    test('should decode characteristic action and call RollExecutor.showCharacteristicDialog', async () => {
      const handler = new RollHandler(mockActor, mockToken);
      const charKey = 'ws';
      const encodedValue = `characteristic|${charKey}`;

      // Grant permission
      game.user.isGM = true;

      await handler.handleAction({ actionId: 'charTest', encodedValue });

      expect(mockRollExecutor.showCharacteristicDialog).toHaveBeenCalledWith(
        mockActor,
        'ws',
        'Weapon Skill',
        { value: 45, total: 45 }
      );
    });

    test('should emit socket when user lacks permission', async () => {
      const handler = new RollHandler(mockActor, mockToken);
      const encodedValue = 'skill|awareness';

      // No permission
      game.user.isGM = false;
      mockActor.testUserPermission.mockReturnValue(false);

      await handler.handleAction({ actionId: 'skillTest', encodedValue });

      expect(game.socket.emit).toHaveBeenCalledWith('system.deathwatch', {
        type: 'tah-action',
        actorId: mockActor.id,
        actionId: 'skillTest',
        encodedValue: 'skill|awareness',
      });

      // Should NOT call executor
      expect(mockRollExecutor.showSkillDialog).not.toHaveBeenCalled();
    });

    test('should handle un-jam action for jammed weapon', async () => {
      const handler = new RollHandler(mockActor, mockToken);
      const weaponId = 'weapon-jammed';
      const encodedValue = `combat-action|unjam`;

      // Add jammed weapon to actor
      const mockWeapon = {
        id: weaponId,
        name: 'Bolter',
        type: 'rangedWeapon',
        system: { jammed: true },
      };
      mockActor.items = [mockWeapon];

      // Grant permission
      game.user.isGM = true;

      await handler.handleAction({ actionId: 'unjam', encodedValue });

      expect(mockCombatHelper.clearJam).toHaveBeenCalledWith(mockActor, mockWeapon);
    });

    test('should warn if no jammed weapons found for un-jam', async () => {
      const handler = new RollHandler(mockActor, mockToken);
      const encodedValue = `combat-action|unjam`;

      // No jammed weapons
      mockActor.items = [];

      // Grant permission
      game.user.isGM = true;

      await handler.handleAction({ actionId: 'unjam', encodedValue });

      expect(ui.notifications.warn).toHaveBeenCalledWith('No jammed weapons found.');
      expect(mockCombatHelper.clearJam).not.toHaveBeenCalled();
    });

    test('should show pending notification for damage action', async () => {
      const handler = new RollHandler(mockActor, mockToken);
      const weaponId = 'weapon-abc123';
      const encodedValue = `weapon|${weaponId}|damage`;

      // Add weapon to actor
      const mockWeapon = { id: weaponId, name: 'Bolter', type: 'rangedWeapon' };
      mockActor.items = {
        get: jest.fn(() => mockWeapon),
      };

      // Grant permission
      game.user.isGM = true;

      await handler.handleAction({ actionId: 'weaponDamage', encodedValue });

      expect(ui.notifications.info).toHaveBeenCalledWith('Damage rolls not yet implemented.');
    });

    test('should show pending notification for extinguish action', async () => {
      const handler = new RollHandler(mockActor, mockToken);
      const encodedValue = `combat-action|extinguish`;

      // Grant permission
      game.user.isGM = true;

      await handler.handleAction({ actionId: 'extinguish', encodedValue });

      expect(ui.notifications.info).toHaveBeenCalledWith(
        'Extinguish action not yet implemented.'
      );
    });
  });
});
