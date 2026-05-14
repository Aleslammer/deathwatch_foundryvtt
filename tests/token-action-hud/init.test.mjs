/**
 * @file Token Action HUD initialization tests
 */

import { jest } from '@jest/globals';

describe('Token Action HUD Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure game.modules exists
    game.modules = game.modules || new Map();
    game.modules.get = jest.fn();
  });

  describe('registerSettings', () => {
    it('should register enableTokenActionHUD setting', async () => {
      const { registerSettings } = await import('../../src/module/token-action-hud/init.mjs');

      registerSettings();

      expect(game.settings.register).toHaveBeenCalledWith(
        'deathwatch',
        'enableTokenActionHUD',
        expect.objectContaining({
          name: 'DEATHWATCH.Settings.EnableTokenActionHUD.Name',
          hint: 'DEATHWATCH.Settings.EnableTokenActionHUD.Hint',
          scope: 'world',
          config: true,
          type: Boolean,
          default: false
        })
      );
    });

    it('should not throw if TAH Core is not active', async () => {
      game.modules.get = jest.fn().mockReturnValue(undefined);

      const { registerSettings } = await import('../../src/module/token-action-hud/init.mjs');

      expect(() => registerSettings()).not.toThrow();
    });
  });

  describe('shouldLoadTAH', () => {
    it('should return false if setting is disabled', async () => {
      game.settings.get = jest.fn().mockReturnValue(false);
      game.modules.get = jest.fn().mockReturnValue({ active: true });

      const { shouldLoadTAH } = await import('../../src/module/token-action-hud/init.mjs');

      expect(shouldLoadTAH()).toBe(false);
    });

    it('should return false if TAH Core is not active', async () => {
      game.settings.get = jest.fn().mockReturnValue(true);
      game.modules.get = jest.fn().mockReturnValue(undefined);

      const { shouldLoadTAH } = await import('../../src/module/token-action-hud/init.mjs');

      expect(shouldLoadTAH()).toBe(false);
    });

    it('should return true if setting enabled and TAH Core active', async () => {
      game.settings.get = jest.fn().mockReturnValue(true);
      game.modules.get = jest.fn().mockReturnValue({ active: true });

      const { shouldLoadTAH } = await import('../../src/module/token-action-hud/init.mjs');

      expect(shouldLoadTAH()).toBe(true);
    });
  });
});
