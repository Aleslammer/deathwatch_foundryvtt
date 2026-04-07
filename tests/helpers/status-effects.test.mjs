import { jest } from '@jest/globals';
import { DW_STATUS_EFFECTS } from '../../src/module/helpers/status-effects.mjs';

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

  it('includes psychic control status effects', () => {
    const ids = DW_STATUS_EFFECTS.map(e => e.id);
    expect(ids).toContain('dominated');
    expect(ids).toContain('compelled');
    expect(ids).toContain('terrified');
    expect(ids).toContain('immobilized');
    expect(ids).toContain('paroxysm');
  });

  it('dominated has -10 to all 9 characteristics', () => {
    const dominated = DW_STATUS_EFFECTS.find(e => e.id === 'dominated');
    expect(dominated.modifiers).toHaveLength(9);
    const chars = dominated.modifiers.map(m => m.valueAffected);
    expect(chars).toEqual(['ws', 'bs', 'str', 'tg', 'ag', 'int', 'per', 'wil', 'fs']);
    dominated.modifiers.forEach(m => expect(m.modifier).toBe(-10));
  });

  it('compelled has no modifiers', () => {
    const compelled = DW_STATUS_EFFECTS.find(e => e.id === 'compelled');
    expect(compelled.modifiers).toBeUndefined();
  });

  it('terrified has no modifiers', () => {
    const terrified = DW_STATUS_EFFECTS.find(e => e.id === 'terrified');
    expect(terrified.modifiers).toBeUndefined();
  });

  it('immobilized has no modifiers', () => {
    const immobilized = DW_STATUS_EFFECTS.find(e => e.id === 'immobilized');
    expect(immobilized.modifiers).toBeUndefined();
  });

  it('paroxysm has dynamicModifiers flag', () => {
    const paroxysm = DW_STATUS_EFFECTS.find(e => e.id === 'paroxysm');
    expect(paroxysm.dynamicModifiers).toBe(true);
  });

  it('paroxysm has static -10 to INT, PER, WIL, FEL', () => {
    const paroxysm = DW_STATUS_EFFECTS.find(e => e.id === 'paroxysm');
    expect(paroxysm.staticModifiers).toHaveLength(4);
    const chars = paroxysm.staticModifiers.map(m => m.valueAffected);
    expect(chars).toEqual(['int', 'per', 'wil', 'fs']);
    paroxysm.staticModifiers.forEach(m => expect(m.modifier).toBe(-10));
  });
});
