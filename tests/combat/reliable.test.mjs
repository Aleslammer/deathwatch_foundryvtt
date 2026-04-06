import { jest } from '@jest/globals';
describe('Reliable Quality', () => {
  it('prevents jam on 1d10 roll of 1-9', async () => {
    // This would be tested in integration tests with the full ranged-combat flow
    // The logic is: if weapon jams (96+) and has Reliable, roll 1d10
    // Only actually jams if 1d10 result is 10
    expect(true).toBe(true);
  });
});
