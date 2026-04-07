import { jest } from '@jest/globals';
import { DEBUG_FLAGS, debug } from '../../src/module/helpers/debug.mjs';
import { Logger } from '../../src/module/helpers/logger.mjs';

describe('Debug', () => {
  let loggerDebugSpy;

  beforeEach(() => {
    // Reset Logger to ensure clean state
    Logger._logger = null;
    Logger.init();

    // Spy on Logger.debug instead of console.log
    loggerDebugSpy = jest.spyOn(Logger, 'debug').mockImplementation();

    // Reset warning flag
    debug._warningShown = false;
  });

  afterEach(() => {
    loggerDebugSpy.mockRestore();
  });

  describe('DEBUG_FLAGS', () => {
    it('defines debug flags (deprecated)', () => {
      expect(DEBUG_FLAGS).toHaveProperty('COMBAT');
      expect(DEBUG_FLAGS).toHaveProperty('MODIFIERS');
      expect(DEBUG_FLAGS).toHaveProperty('SHEETS');
    });
  });

  describe('debug', () => {
    it('delegates to Logger.debug (new behavior)', () => {
      debug('COMBAT', 'test message', { data: 123 });
      expect(loggerDebugSpy).toHaveBeenCalledWith('COMBAT', 'test message', { data: 123 });
    });

    it('ignores DEBUG_FLAGS (deprecated behavior)', () => {
      DEBUG_FLAGS.MODIFIERS = false;
      debug('MODIFIERS', 'test message');
      // Should still call Logger.debug regardless of flag
      expect(loggerDebugSpy).toHaveBeenCalledWith('MODIFIERS', 'test message');
    });

    it('handles multiple arguments', () => {
      debug('SHEETS', 'arg1', 'arg2', 'arg3');
      expect(loggerDebugSpy).toHaveBeenCalledWith('SHEETS', 'arg1', 'arg2', 'arg3');
    });

    it('passes context to Logger', () => {
      debug('COMBAT', 'message');
      expect(loggerDebugSpy).toHaveBeenCalledWith('COMBAT', 'message');
    });

    it('shows deprecation warning on first use', () => {
      const compatSpy = jest.spyOn(Logger, 'compatibility').mockImplementation();

      debug('COMBAT', 'message');

      expect(compatSpy).toHaveBeenCalledWith(
        'debug() is deprecated, use Logger.debug() instead',
        { since: '2.1.0', until: '3.0.0' }
      );

      compatSpy.mockRestore();
    });
  });
});
