import { jest } from '@jest/globals';
import './setup.mjs';
import { DW_STATUS_EFFECTS } from '../src/module/helpers/status-effects.mjs';

describe('DW_STATUS_EFFECTS', () => {
  it('is an array', () => {
    expect(Array.isArray(DW_STATUS_EFFECTS)).toBe(true);
  });

  it('has at least one status effect', () => {
    expect(DW_STATUS_EFFECTS.length).toBeGreaterThan(0);
  });

  it('all effects have required properties', () => {
    DW_STATUS_EFFECTS.forEach(effect => {
      expect(effect).toHaveProperty('id');
      expect(effect).toHaveProperty('name');
      expect(effect).toHaveProperty('img');
      expect(effect).toHaveProperty('description');
      expect(typeof effect.id).toBe('string');
      expect(typeof effect.name).toBe('string');
      expect(typeof effect.img).toBe('string');
      expect(typeof effect.description).toBe('string');
    });
  });

  it('all effect ids are unique', () => {
    const ids = DW_STATUS_EFFECTS.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('includes common status effects', () => {
    const ids = DW_STATUS_EFFECTS.map(e => e.id);
    expect(ids).toContain('stunned');
    expect(ids).toContain('prone');
    expect(ids).toContain('unconscious');
  });
});
