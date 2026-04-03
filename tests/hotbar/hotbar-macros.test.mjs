import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';

function makeWeapon(overrides = {}) {
  return {
    name: 'Test Bolter',
    system: {
      class: 'Basic',
      rof: 'S/3/-',
      clip: '28',
      loadedAmmo: null,
      attachedQualities: [],
      ...overrides
    }
  };
}

function makeActor(overrides = {}) {
  return {
    items: { get: jest.fn(() => null) },
    ...overrides
  };
}

function makeActorWithAmmo(currentAmmo) {
  return {
    items: {
      get: jest.fn(() => ({
        system: { capacity: { value: currentAmmo } }
      }))
    }
  };
}

describe('validateRofOption', () => {
  it('validates Single on S/-/- weapon', () => {
    const result = CombatDialogHelper.validateRofOption(0, makeWeapon({ rof: 'S/-/-' }), makeActor());
    expect(result.valid).toBe(true);
  });

  it('validates Semi-Auto on S/3/- weapon', () => {
    const result = CombatDialogHelper.validateRofOption(1, makeWeapon({ rof: 'S/3/-' }), makeActor());
    expect(result.valid).toBe(true);
  });

  it('rejects Full-Auto on S/3/- weapon', () => {
    const result = CombatDialogHelper.validateRofOption(2, makeWeapon({ rof: 'S/3/-' }), makeActor());
    expect(result.valid).toBe(false);
    expect(result.message).toContain('does not support Full-Auto');
  });

  it('rejects Semi-Auto on S/-/- weapon', () => {
    const result = CombatDialogHelper.validateRofOption(1, makeWeapon({ rof: 'S/-/-' }), makeActor());
    expect(result.valid).toBe(false);
    expect(result.message).toContain('does not support Semi-Auto');
  });

  it('validates Full-Auto on S/3/6 weapon', () => {
    const result = CombatDialogHelper.validateRofOption(2, makeWeapon({ rof: 'S/3/6' }), makeActor());
    expect(result.valid).toBe(true);
  });

  it('rejects Semi-Auto with insufficient ammo', () => {
    const weapon = makeWeapon({ rof: 'S/3/-', clip: '28', loadedAmmo: 'ammo1' });
    const actor = makeActorWithAmmo(2);
    const result = CombatDialogHelper.validateRofOption(1, weapon, actor);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('needs 3 rounds for Semi-Auto but only has 2');
  });

  it('rejects Full-Auto with insufficient ammo', () => {
    const weapon = makeWeapon({ rof: 'S/3/6', clip: '28', loadedAmmo: 'ammo1' });
    const actor = makeActorWithAmmo(4);
    const result = CombatDialogHelper.validateRofOption(2, weapon, actor);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('needs 6 rounds for Full-Auto but only has 4');
  });

  it('validates Single with 1 round remaining', () => {
    const weapon = makeWeapon({ rof: 'S/3/-', clip: '28', loadedAmmo: 'ammo1' });
    const actor = makeActorWithAmmo(1);
    const result = CombatDialogHelper.validateRofOption(0, weapon, actor);
    expect(result.valid).toBe(true);
  });

  it('skips ammo check when no ammo management', () => {
    const weapon = makeWeapon({ rof: 'S/3/-', clip: '—' });
    const result = CombatDialogHelper.validateRofOption(1, weapon, makeActor());
    expect(result.valid).toBe(true);
  });

  it('uses effectiveRof when available', () => {
    const weapon = makeWeapon({ rof: 'S/3/-', effectiveRof: 'S/-/-' });
    const result = CombatDialogHelper.validateRofOption(1, weapon, makeActor());
    expect(result.valid).toBe(false);
    expect(result.message).toContain('does not support Semi-Auto');
  });
});

describe('mapAimOption', () => {
  it('maps 0 to NONE (0)', () => {
    expect(CombatDialogHelper.mapAimOption(0)).toBe(0);
  });

  it('maps 1 to HALF (10)', () => {
    expect(CombatDialogHelper.mapAimOption(1)).toBe(10);
  });

  it('maps 2 to FULL (20)', () => {
    expect(CombatDialogHelper.mapAimOption(2)).toBe(20);
  });

  it('maps undefined to NONE (0)', () => {
    expect(CombatDialogHelper.mapAimOption(undefined)).toBe(0);
  });
});

describe('mapRofOption', () => {
  it('maps 0 to SINGLE (0)', () => {
    expect(CombatDialogHelper.mapRofOption(0)).toBe(0);
  });

  it('maps 1 to SEMI_AUTO (10)', () => {
    expect(CombatDialogHelper.mapRofOption(1)).toBe(10);
  });

  it('maps 2 to FULL_AUTO (20)', () => {
    expect(CombatDialogHelper.mapRofOption(2)).toBe(20);
  });

  it('maps undefined to SINGLE (0)', () => {
    expect(CombatDialogHelper.mapRofOption(undefined)).toBe(0);
  });
});
