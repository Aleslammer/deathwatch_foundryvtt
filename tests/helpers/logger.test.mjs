import { jest } from '@jest/globals';
import { Logger } from '../../src/module/helpers/logger.mjs';

describe('Logger', () => {
  let consoleLogSpy;
  let consoleInfoSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset logger
    Logger._logger = null;
    Logger._enabledCategories.clear();
    Logger._noOpStub = undefined;

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock game.settings (not available in tests)
    // Don't initialize Logger here - let individual tests do it
    global.game = undefined;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    delete global.game;
  });

  describe('init', () => {
    it('initializes logger with default INFO level', () => {
      global.game = undefined;
      Logger.init();
      expect(Logger._logger).toBeDefined();
      expect(Logger._logger.level).toBe(1); // INFO
    });

    it('reads log level from settings if available', () => {
      // Set up mock before init
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (namespace === 'deathwatch' && key === 'logLevel') {
              return 'DEBUG';
            }
            return undefined;
          })
        }
      };
      Logger.init();
      expect(Logger._logger.level).toBe(0); // DEBUG
    });

    it('handles missing settings gracefully', () => {
      delete global.game;
      Logger.init();
      expect(Logger._logger).toBeDefined();
      expect(Logger._logger.level).toBe(1); // Default to INFO
    });
  });

  describe('debug', () => {
    it('logs debug messages when level is DEBUG', () => {
      // Set up mock before init
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (namespace === 'deathwatch' && key === 'logLevel') {
              return 'DEBUG';
            }
            return undefined;
          })
        }
      };
      Logger.init();
      Logger.debug('COMBAT', 'test message', { data: 123 });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:COMBAT]', 'test message', { data: 123 });
    });

    it('does not log debug messages when level is INFO', () => {
      global.game = {
        settings: {
          get: jest.fn(() => 'INFO')
        }
      };
      Logger.init();
      Logger.debug('COMBAT', 'test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('auto-initializes if not initialized', () => {
      Logger._logger = null;
      Logger.debug('COMBAT', 'message');
      expect(Logger._logger).toBeDefined();
    });
  });

  describe('info', () => {
    it('logs info messages when level is INFO or lower', () => {
      global.game = {
        settings: {
          get: jest.fn(() => 'INFO')
        }
      };
      Logger.init();
      Logger.info('INIT', 'System initialized');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[Deathwatch:INIT]', 'System initialized');
    });

    it('does not log info when level is WARN', () => {
      global.game = {
        settings: {
          get: jest.fn(() => 'WARN')
        }
      };
      Logger.init();
      Logger.info('INIT', 'message');
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('logs warnings when level is WARN or lower', () => {
      global.game = {
        settings: {
          get: jest.fn(() => 'WARN')
        }
      };
      Logger.init();
      Logger.warn('MODIFIERS', 'Deprecated modifier');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Deathwatch:MODIFIERS]', 'Deprecated modifier');
    });

    it('does not log warnings when level is ERROR', () => {
      global.game = {
        settings: {
          get: jest.fn(() => 'ERROR')
        }
      };
      Logger.init();
      Logger.warn('MODIFIERS', 'message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('always logs errors regardless of level', () => {
      global.game = {
        settings: {
          get: jest.fn(() => 'ERROR')
        }
      };
      Logger.init();
      Logger.error('SKILLS', 'Skills not loaded');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Deathwatch:SKILLS]', 'Skills not loaded');
    });

    it('logs errors even at DEBUG level', () => {
      global.game = {
        settings: {
          get: jest.fn(() => 'DEBUG')
        }
      };
      Logger.init();
      Logger.error('SKILLS', 'Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('compatibility', () => {
    it('calls foundry compatibility warning if available', () => {
      global.foundry = {
        utils: {
          logCompatibilityWarning: jest.fn()
        }
      };

      Logger.compatibility('deprecated() is deprecated', {
        since: '2.0.0',
        until: '3.0.0'
      });

      expect(global.foundry.utils.logCompatibilityWarning).toHaveBeenCalledWith(
        'deprecated() is deprecated',
        {
          since: '2.0.0',
          until: '3.0.0',
          details: 'See docs/improvements/ for migration guide'
        }
      );

      delete global.foundry;
    });

    it('falls back to Logger.warn if Foundry API not available', () => {
      const warnSpy = jest.spyOn(Logger, 'warn').mockImplementation();

      Logger.compatibility('deprecated() is deprecated', {
        since: '2.0.0',
        until: '3.0.0'
      });

      expect(warnSpy).toHaveBeenCalledWith(
        'COMPATIBILITY',
        'deprecated() is deprecated',
        '(since 2.0.0, until 3.0.0)'
      );

      warnSpy.mockRestore();
    });
  });

  describe('context formatting', () => {
    it('formats context in brackets', () => {
      global.game = {
        settings: {
          get: jest.fn(() => 'INFO')
        }
      };
      Logger.init();
      Logger.info('TEST_CONTEXT', 'message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[Deathwatch:TEST_CONTEXT]', 'message');
    });

    it('handles multiple arguments', () => {
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (namespace === 'deathwatch' && key === 'logLevel') {
              return 'DEBUG';
            }
            return undefined;
          })
        }
      };
      Logger.init();
      Logger.debug('COMBAT', 'arg1', 'arg2', { data: 'arg3' });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:COMBAT]', 'arg1', 'arg2', { data: 'arg3' });
    });
  });

  describe('category registry', () => {
    it('has valid registry structure', () => {
      expect(Logger.CATEGORY_REGISTRY).toBeDefined();
      expect(typeof Logger.CATEGORY_REGISTRY).toBe('object');
      expect(Object.keys(Logger.CATEGORY_REGISTRY).length).toBeGreaterThan(0);
    });

    it('all registry entries have required fields', () => {
      Object.entries(Logger.CATEGORY_REGISTRY).forEach(([context, meta]) => {
        expect(meta).toHaveProperty('group');
        expect(meta).toHaveProperty('key');
        expect(meta).toHaveProperty('label');
        expect(typeof meta.group).toBe('string');
        expect(typeof meta.key).toBe('string');
        expect(typeof meta.label).toBe('string');
      });
    });

    it('has no duplicate category keys', () => {
      const keys = Object.values(Logger.CATEGORY_REGISTRY).map(m => m.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it('context strings follow hierarchical pattern', () => {
      Object.keys(Logger.CATEGORY_REGISTRY).forEach(context => {
        expect(context).toMatch(/^[A-Z_]+\.[A-Z_]+$/);
      });
    });
  });

  describe('category initialization', () => {
    it('loads enabled categories from settings during init', () => {
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (key === 'logLevel') return 'INFO';
            if (key === 'enabledLogCategories') return ['ranged-attacks', 'modifiers'];
            return undefined;
          })
        }
      };

      Logger.init();

      expect(Logger._enabledCategories.has('ranged-attacks')).toBe(true);
      expect(Logger._enabledCategories.has('modifiers')).toBe(true);
      expect(Logger._enabledCategories.has('melee-attacks')).toBe(false);
    });

    it('handles missing enabledLogCategories setting', () => {
      global.game = {
        settings: {
          get: jest.fn(() => undefined)
        }
      };

      Logger.init();

      expect(Logger._enabledCategories.size).toBe(0);
    });

    it('handles empty enabledLogCategories array', () => {
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (key === 'enabledLogCategories') return [];
            return 'INFO';
          })
        }
      };

      Logger.init();

      expect(Logger._enabledCategories.size).toBe(0);
    });
  });

  describe('category()', () => {
    beforeEach(() => {
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (key === 'logLevel') return 'INFO';
            if (key === 'enabledLogCategories') return ['ranged-attacks'];
            return undefined;
          })
        }
      };
      Logger.init();
    });

    it('returns logger proxy when category is enabled', () => {
      const logger = Logger.category('COMBAT.RANGED');
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('enabled category logger outputs debug logs', () => {
      // Need DEBUG global level for debug output to appear
      global.game.settings.get = jest.fn((namespace, key) => {
        if (key === 'logLevel') return 'DEBUG';
        if (key === 'enabledLogCategories') return ['ranged-attacks'];
        return undefined;
      });
      Logger.init();

      const logger = Logger.category('COMBAT.RANGED');
      logger.debug('Test message', { data: 123 });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:COMBAT.RANGED]', 'Test message', { data: 123 });
    });

    it('returns no-op stub when category is disabled', () => {
      const logger = Logger.category('COMBAT.MELEE');
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
    });

    it('disabled category logger produces no output', () => {
      const logger = Logger.category('COMBAT.MELEE');
      logger.debug('Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('throws error for invalid context string', () => {
      expect(() => Logger.category('INVALID_CONTEXT')).toThrow('Unknown logging category context');
    });

    it('enabled category respects global log level', () => {
      // Global level INFO means debug won't appear even if category enabled
      const logger = Logger.category('COMBAT.RANGED');
      logger.debug('Should not appear due to global level');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('enabled category allows debug when global level is DEBUG', () => {
      global.game.settings.get = jest.fn((namespace, key) => {
        if (key === 'logLevel') return 'DEBUG';
        if (key === 'enabledLogCategories') return ['ranged-attacks'];
        return undefined;
      });
      Logger.init();

      const logger = Logger.category('COMBAT.RANGED');
      logger.debug('Should appear');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:COMBAT.RANGED]', 'Should appear');
    });

    it('returns same no-op stub instance for different disabled categories', () => {
      const logger1 = Logger.category('COMBAT.MELEE');
      const logger2 = Logger.category('COMBAT.DAMAGE');
      expect(logger1).toBe(logger2);
    });
  });

  describe('category logging integration', () => {
    it('additive behavior: global INFO + enabled category shows debug logs', () => {
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (key === 'logLevel') return 'INFO';
            if (key === 'enabledLogCategories') return ['ranged-attacks'];
            return undefined;
          })
        }
      };
      Logger.init();

      // Direct debug call should NOT appear (global level INFO)
      Logger.debug('GENERAL', 'Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Category debug call should NOT appear (global level INFO blocks it)
      Logger.category('COMBAT.RANGED').debug('Also should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('additive behavior: global DEBUG + enabled category shows debug logs', () => {
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (key === 'logLevel') return 'DEBUG';
            if (key === 'enabledLogCategories') return ['ranged-attacks'];
            return undefined;
          })
        }
      };
      Logger.init();

      // Direct debug call should appear (global level DEBUG)
      Logger.debug('GENERAL', 'Should appear');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:GENERAL]', 'Should appear');

      consoleLogSpy.mockClear();

      // Category debug call should also appear (global DEBUG + enabled)
      Logger.category('COMBAT.RANGED').debug('Also should appear');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:COMBAT.RANGED]', 'Also should appear');
    });

    it('disabled categories produce no output regardless of global level', () => {
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (key === 'logLevel') return 'DEBUG';
            if (key === 'enabledLogCategories') return [];
            return undefined;
          })
        }
      };
      Logger.init();

      Logger.category('COMBAT.RANGED').debug('Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('multiple enabled categories all work independently', () => {
      global.game = {
        settings: {
          get: jest.fn((namespace, key) => {
            if (key === 'logLevel') return 'DEBUG';
            if (key === 'enabledLogCategories') return ['ranged-attacks', 'modifiers', 'cohesion'];
            return undefined;
          })
        }
      };
      Logger.init();

      Logger.category('COMBAT.RANGED').debug('Ranged message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:COMBAT.RANGED]', 'Ranged message');

      consoleLogSpy.mockClear();

      Logger.category('CHARACTER.MODIFIERS').debug('Modifier message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:CHARACTER.MODIFIERS]', 'Modifier message');

      consoleLogSpy.mockClear();

      Logger.category('SQUAD.COHESION').debug('Cohesion message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:SQUAD.COHESION]', 'Cohesion message');

      consoleLogSpy.mockClear();

      // Disabled category produces no output
      Logger.category('COMBAT.MELEE').debug('Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
