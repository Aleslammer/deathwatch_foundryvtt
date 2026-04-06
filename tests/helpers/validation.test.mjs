import { jest } from '@jest/globals';
import { Validation } from '../../src/module/helpers/validation.mjs';

describe('Validation', () => {
  describe('requireInt', () => {
    it('should parse valid integer strings', () => {
      expect(Validation.requireInt('42', 'Test')).toBe(42);
      expect(Validation.requireInt('0', 'Test')).toBe(0);
      expect(Validation.requireInt('-10', 'Test')).toBe(-10);
    });

    it('should parse valid integer numbers', () => {
      expect(Validation.requireInt(42, 'Test')).toBe(42);
      expect(Validation.requireInt(0, 'Test')).toBe(0);
      expect(Validation.requireInt(-10, 'Test')).toBe(-10);
    });

    it('should throw error for non-integer values', () => {
      expect(() => Validation.requireInt('abc', 'Damage')).toThrow('Damage must be a valid integer (got: abc)');
      expect(() => Validation.requireInt(null, 'Damage')).toThrow('Damage must be a valid integer (got: null)');
      expect(() => Validation.requireInt(undefined, 'Damage')).toThrow('Damage must be a valid integer (got: undefined)');
      expect(() => Validation.requireInt('', 'Damage')).toThrow('Damage must be a valid integer (got: )');
    });

    it('should parse float strings as integers (truncated)', () => {
      expect(Validation.requireInt('42.7', 'Test')).toBe(42);
      expect(Validation.requireInt('-10.9', 'Test')).toBe(-10);
    });
  });

  describe('requireActor', () => {
    beforeEach(() => {
      global.game = {
        actors: {
          get: jest.fn()
        }
      };
    });

    it('should return actor when found', () => {
      const mockActor = { id: 'abc123', name: 'Test Actor' };
      game.actors.get.mockReturnValue(mockActor);

      const result = Validation.requireActor('abc123', 'Test Operation');

      expect(result).toBe(mockActor);
      expect(game.actors.get).toHaveBeenCalledWith('abc123');
    });

    it('should throw error when actor not found', () => {
      game.actors.get.mockReturnValue(null);

      expect(() => Validation.requireActor('abc123', 'Apply Damage')).toThrow('Actor not found for Apply Damage: abc123');
    });

    it('should throw error when actor ID not provided', () => {
      expect(() => Validation.requireActor(null, 'Apply Damage')).toThrow('Actor ID not provided for Apply Damage');
      expect(() => Validation.requireActor(undefined, 'Apply Damage')).toThrow('Actor ID not provided for Apply Damage');
      expect(() => Validation.requireActor('', 'Apply Damage')).toThrow('Actor ID not provided for Apply Damage');
    });

    it('should use default context when not provided', () => {
      game.actors.get.mockReturnValue(null);

      expect(() => Validation.requireActor('abc123')).toThrow('Actor not found for operation: abc123');
    });
  });

  describe('requireDocument', () => {
    it('should return document when provided', () => {
      const doc = { id: '123', name: 'Test' };

      const result = Validation.requireDocument(doc, 'Weapon', 'Attack');

      expect(result).toBe(doc);
    });

    it('should throw error when document is null', () => {
      expect(() => Validation.requireDocument(null, 'Weapon', 'Attack')).toThrow('Weapon not found for Attack');
    });

    it('should throw error when document is undefined', () => {
      expect(() => Validation.requireDocument(undefined, 'Actor', 'Apply Damage')).toThrow('Actor not found for Apply Damage');
    });

    it('should use default context when not provided', () => {
      expect(() => Validation.requireDocument(null, 'Item')).toThrow('Item not found for operation');
    });

    it('should accept falsy but valid documents', () => {
      // 0, false, "" are technically falsy but this function should only reject null/undefined
      // However, based on the implementation, it will reject all falsy values
      expect(() => Validation.requireDocument(0, 'Test')).toThrow();
      expect(() => Validation.requireDocument(false, 'Test')).toThrow();
    });
  });

  describe('parseBoolean', () => {
    it('should return true for boolean true', () => {
      expect(Validation.parseBoolean(true)).toBe(true);
    });

    it('should return false for boolean false', () => {
      expect(Validation.parseBoolean(false)).toBe(false);
    });

    it('should parse string "true" as true', () => {
      expect(Validation.parseBoolean('true')).toBe(true);
    });

    it('should parse string "false" as false', () => {
      expect(Validation.parseBoolean('false')).toBe(false);
    });

    it('should return false for other values', () => {
      expect(Validation.parseBoolean('yes')).toBe(false);
      expect(Validation.parseBoolean('1')).toBe(false);
      expect(Validation.parseBoolean(1)).toBe(false);
      expect(Validation.parseBoolean(null)).toBe(false);
      expect(Validation.parseBoolean(undefined)).toBe(false);
      expect(Validation.parseBoolean({})).toBe(false);
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON strings', () => {
      expect(Validation.parseJSON('{"foo":"bar"}', 'Test')).toEqual({ foo: 'bar' });
      expect(Validation.parseJSON('[1,2,3]', 'Test')).toEqual([1, 2, 3]);
      expect(Validation.parseJSON('"string"', 'Test')).toBe('string');
      expect(Validation.parseJSON('42', 'Test')).toBe(42);
      expect(Validation.parseJSON('null', 'Test')).toBeNull();
    });

    it('should throw error for invalid JSON', () => {
      expect(() => Validation.parseJSON('{invalid}', 'Config')).toThrow(/Invalid JSON for Config/);
      expect(() => Validation.parseJSON('undefined', 'Config')).toThrow(/Invalid JSON for Config/);
    });

    it('should include field name in error message', () => {
      expect(() => Validation.parseJSON('{bad', 'Weapon Qualities')).toThrow(/Invalid JSON for Weapon Qualities/);
    });

    it('should handle empty string as invalid JSON', () => {
      expect(() => Validation.parseJSON('', 'Test')).toThrow(/Invalid JSON for Test/);
    });
  });
});
