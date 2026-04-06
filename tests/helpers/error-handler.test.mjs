import { jest } from '@jest/globals';
import { ErrorHandler } from '../../src/module/helpers/error-handler.mjs';

describe('ErrorHandler', () => {
  describe('wrap', () => {
    it('should execute handler successfully when no error occurs', async () => {
      const handler = jest.fn(async () => 'success');
      const wrapped = ErrorHandler.wrap(handler, 'Test Operation');

      await wrapped();

      expect(handler).toHaveBeenCalled();
    });

    it('should catch errors and show notification', async () => {
      const error = new Error('Test error');
      const handler = jest.fn(async () => {
        throw error;
      });
      const wrapped = ErrorHandler.wrap(handler, 'Test Operation');

      // Mock ui.notifications.error
      global.ui = { notifications: { error: jest.fn() } };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await wrapped();

      expect(consoleSpy).toHaveBeenCalledWith('[Deathwatch:ERROR_HANDLER]', 'Test Operation failed:', error);
      expect(ui.notifications.error).toHaveBeenCalledWith('Test Operation failed: Test error');

      consoleSpy.mockRestore();
    });

    it('should preserve context (this) when calling handler', async () => {
      let capturedThis;
      const handler = async function() {
        capturedThis = this;
      };
      const context = { foo: 'bar' };
      const wrapped = ErrorHandler.wrap(handler, 'Test');

      await wrapped.call(context);

      expect(capturedThis).toBe(context);
    });

    it('should pass event argument to handler', async () => {
      const handler = jest.fn(async (event) => event);
      const wrapped = ErrorHandler.wrap(handler, 'Test');
      const mockEvent = { type: 'click', target: {} };

      await wrapped(mockEvent);

      expect(handler).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle errors with no message', async () => {
      const handler = jest.fn(async () => {
        throw new Error();
      });
      const wrapped = ErrorHandler.wrap(handler, 'Test');

      global.ui = { notifications: { error: jest.fn() } };
      jest.spyOn(console, 'error').mockImplementation();

      await wrapped();

      expect(ui.notifications.error).toHaveBeenCalledWith('Test failed: ');
    });
  });

  describe('safe', () => {
    it('should return promise result on success', async () => {
      const promise = Promise.resolve('success');

      const result = await ErrorHandler.safe(promise, 'fallback');

      expect(result).toBe('success');
    });

    it('should return fallback value on error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const promise = Promise.reject(new Error('Failed'));
      const result = await ErrorHandler.safe(promise, 'fallback');

      expect(result).toBe('fallback');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should return null by default when no fallback provided', async () => {
      jest.spyOn(console, 'warn').mockImplementation();

      const promise = Promise.reject(new Error('Failed'));
      const result = await ErrorHandler.safe(promise);

      expect(result).toBeNull();
    });

    it('should handle non-Error rejections', async () => {
      jest.spyOn(console, 'warn').mockImplementation();

      const promise = Promise.reject('string error');
      const result = await ErrorHandler.safe(promise, 'fallback');

      expect(result).toBe('fallback');
    });
  });
});
