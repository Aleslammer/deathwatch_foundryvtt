// tests/data/psychic-power-qualities.test.mjs
import DeathwatchPsychicPower from '../../src/module/data/item/psychic-power.mjs';

describe('DeathwatchPsychicPower - attachedQualities', () => {
  test('should initialize attachedQualities as empty array', () => {
    const schema = DeathwatchPsychicPower.defineSchema();
    expect(schema.attachedQualities.options.initial).toEqual([]);
  });

  test('should accept array of quality objects', () => {
    const power = new DeathwatchPsychicPower();
    Object.assign(power, {
      attachedQualities: [
        { id: 'tearing' },
        { id: 'felling', value: '2' }
      ]
    });

    expect(power.attachedQualities).toHaveLength(2);
    expect(power.attachedQualities[0]).toEqual({ id: 'tearing' });
    expect(power.attachedQualities[1]).toEqual({ id: 'felling', value: '2' });
  });

  test('should accept simple string IDs', () => {
    const power = new DeathwatchPsychicPower();
    Object.assign(power, {
      attachedQualities: [{ id: 'tearing' }]
    });

    expect(power.attachedQualities[0].id).toBe('tearing');
  });

  test('should accept qualities with values', () => {
    const power = new DeathwatchPsychicPower();
    Object.assign(power, {
      attachedQualities: [{ id: 'crippling', value: '1d10' }]
    });

    expect(power.attachedQualities[0].id).toBe('crippling');
    expect(power.attachedQualities[0].value).toBe('1d10');
  });
});
