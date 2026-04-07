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
});
