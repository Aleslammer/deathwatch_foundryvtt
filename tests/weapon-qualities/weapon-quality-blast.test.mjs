import { jest } from '@jest/globals';
import { WeaponQualityHelper } from '../../src/module/helpers/weapon-quality-helper.mjs';

describe('WeaponQualityHelper.getBlastValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockPack = {
      getDocument: jest.fn(async (id) => {
        const docs = {
          'blast': { _id: 'blast', name: 'Blast', system: { key: 'blast', value: '4' } },
          'tearing': { _id: 'tearing', name: 'Tearing', system: { key: 'tearing' } }
        };
        return docs[id] || null;
      })
    };

    global.game.packs = new Map([
      ['deathwatch.weapon-qualities', mockPack]
    ]);
  });

  it('returns effectiveBlast from ammunition modifier when present', async () => {
    const weapon = {
      system: { effectiveBlast: 3, attachedQualities: [] }
    };
    expect(await WeaponQualityHelper.getBlastValue(weapon)).toBe(3);
  });

  it('returns blast value from innate weapon quality', async () => {
    const weapon = {
      system: { attachedQualities: [{ id: 'blast', value: '4' }] }
    };
    expect(await WeaponQualityHelper.getBlastValue(weapon)).toBe(4);
  });

  it('prefers effectiveBlast over innate quality', async () => {
    const weapon = {
      system: { effectiveBlast: 5, attachedQualities: [{ id: 'blast', value: '4' }] }
    };
    expect(await WeaponQualityHelper.getBlastValue(weapon)).toBe(5);
  });

  it('returns 0 when weapon has no blast', async () => {
    const weapon = {
      system: { attachedQualities: [{ id: 'tearing' }] }
    };
    expect(await WeaponQualityHelper.getBlastValue(weapon)).toBe(0);
  });

  it('returns 0 when weapon has no qualities', async () => {
    const weapon = {
      system: { attachedQualities: [] }
    };
    expect(await WeaponQualityHelper.getBlastValue(weapon)).toBe(0);
  });

  it('handles string quality ID for blast', async () => {
    const weapon = {
      system: { attachedQualities: ['blast'] }
    };
    // String format has no value property, falls back to compendium lookup
    expect(await WeaponQualityHelper.getBlastValue(weapon)).toBe(4);
  });
});
