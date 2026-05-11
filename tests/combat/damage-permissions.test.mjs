import { jest } from '@jest/globals';
import { CombatHelper } from '../../src/module/helpers/combat/combat.mjs';
import { FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';

/**
 * Test socket-based damage routing for player attacks on GM-owned actors.
 *
 * When a player attacks a GM-owned actor (enemy, horde, NPC), damage must
 * route through socket messaging so the GM's permissions execute the update.
 */
describe('CombatHelper damage permission routing', () => {
  let mockGame;
  let mockSocket;
  let originalGame;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save original global.game
    originalGame = global.game;

    // Mock socket infrastructure
    mockSocket = {
      emit: jest.fn()
    };

    mockGame = {
      socket: mockSocket,
      user: {
        isGM: false,  // Simulate player
        id: 'player1',
        name: 'TestPlayer'
      }
    };

    global.game = mockGame;

    // Mock FoundryAdapter methods
    FoundryAdapter.updateDocument = jest.fn();
    FoundryAdapter.createChatMessage = jest.fn();
  });

  afterEach(() => {
    global.game = originalGame;
  });

  describe('Player attacking GM-owned actor', () => {
    it('routes damage through socket instead of direct update', async () => {
      // ARRANGE: Create GM-owned actor (player cannot update)
      const mockActor = {
        id: 'enemy123',
        name: 'Ork Boy',
        type: 'enemy',
        testUserPermission: jest.fn(() => false),  // Player lacks OWNER permission
        system: {
          receiveDamage: jest.fn()
        }
      };

      const damageOptions = {
        damage: 15,
        penetration: 4,
        location: 'Body',
        damageType: 'Impact'
      };

      // ACT: Player applies damage
      await CombatHelper.applyDamageWithPermissionCheck(mockActor, damageOptions);

      // ASSERT: Should emit socket message
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'system.deathwatch',
        expect.objectContaining({
          type: 'applyActorDamage',
          actorId: 'enemy123',
          damageOptions: damageOptions,
          userId: 'player1',
          userName: 'TestPlayer'
        })
      );

      // Should NOT call receiveDamage directly (would fail with permission error)
      expect(mockActor.system.receiveDamage).not.toHaveBeenCalled();
    });
  });

  describe('GM applying damage', () => {
    it('applies damage directly without socket routing', async () => {
      // ARRANGE: GM user
      mockGame.user.isGM = true;

      const mockActor = {
        id: 'enemy123',
        name: 'Ork Boy',
        type: 'enemy',
        testUserPermission: jest.fn(() => true),  // GM has permission
        system: {
          receiveDamage: jest.fn()
        }
      };

      const damageOptions = {
        damage: 15,
        penetration: 4,
        location: 'Body',
        damageType: 'Impact'
      };

      // ACT: GM applies damage
      await CombatHelper.applyDamageWithPermissionCheck(mockActor, damageOptions);

      // ASSERT: Direct update (no socket)
      expect(mockActor.system.receiveDamage).toHaveBeenCalledWith(damageOptions);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Player applying damage to own actor', () => {
    it('applies damage directly when player owns the actor', async () => {
      // ARRANGE: Player owns this actor
      const mockActor = {
        id: 'character123',
        name: 'Brother Marcus',
        type: 'character',
        testUserPermission: jest.fn(() => true),  // Player owns this
        system: {
          receiveDamage: jest.fn()
        }
      };

      const damageOptions = {
        damage: 8,
        penetration: 2,
        location: 'Right Arm',
        damageType: 'Energy'
      };

      // ACT: Player damages their own character
      await CombatHelper.applyDamageWithPermissionCheck(mockActor, damageOptions);

      // ASSERT: Direct update
      expect(mockActor.system.receiveDamage).toHaveBeenCalledWith(damageOptions);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});
