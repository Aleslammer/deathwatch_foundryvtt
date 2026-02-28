import { jest } from '@jest/globals';
import { DEBUG_FLAGS, debug } from '../src/module/helpers/debug.mjs';

describe('Debug', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('DEBUG_FLAGS', () => {
    it('defines debug flags', () => {
      expect(DEBUG_FLAGS).toHaveProperty('COMBAT');
      expect(DEBUG_FLAGS).toHaveProperty('MODIFIERS');
      expect(DEBUG_FLAGS).toHaveProperty('SHEETS');
    });
  });

  describe('debug', () => {
    it('logs when flag is enabled', () => {
      DEBUG_FLAGS.COMBAT = true;
      debug('COMBAT', 'test message', { data: 123 });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:COMBAT]', 'test message', { data: 123 });
    });

    it('does not log when flag is disabled', () => {
      DEBUG_FLAGS.MODIFIERS = false;
      debug('MODIFIERS', 'test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('handles multiple arguments', () => {
      DEBUG_FLAGS.SHEETS = true;
      debug('SHEETS', 'arg1', 'arg2', 'arg3');
      expect(consoleLogSpy).toHaveBeenCalledWith('[Deathwatch:SHEETS]', 'arg1', 'arg2', 'arg3');
    });

    it('formats context in log prefix', () => {
      DEBUG_FLAGS.COMBAT = true;
      debug('COMBAT', 'message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[Deathwatch:COMBAT]'), 'message');
    });
  });
});
