import { DW_STATUS_EFFECTS } from '../../src/module/helpers/status-effects.mjs';

describe('Status Effects - Psychic Qualities', () => {
  test('should include Crippled status effect', () => {
    const crippled = DW_STATUS_EFFECTS.find(e => e.id === 'crippled');

    expect(crippled).toBeDefined();
    expect(crippled.name).toBe('Crippled');
    expect(crippled.img).toBe('icons/svg/blood.svg');
    expect(crippled.description).toContain('Half Action');
    expect(crippled.description).toContain('Rending Damage');
  });

  test('should include Snared status effect', () => {
    const snared = DW_STATUS_EFFECTS.find(e => e.id === 'snared');

    expect(snared).toBeDefined();
    expect(snared.name).toBe('Snared');
    expect(snared.img).toBe('icons/svg/net.svg');
    expect(snared.description).toContain('Movement');
  });

  test('Crippled should not have automatic modifiers', () => {
    const crippled = DW_STATUS_EFFECTS.find(e => e.id === 'crippled');

    expect(crippled.modifiers).toBeUndefined();
  });

  test('Snared should not have automatic modifiers', () => {
    const snared = DW_STATUS_EFFECTS.find(e => e.id === 'snared');

    expect(snared.modifiers).toBeUndefined();
  });
});
