import { jest } from '@jest/globals';
import './setup.mjs';
import { ActorConditionsMixin } from '../src/module/documents/actor-conditions.mjs';

class MockActor {
  constructor() {
    this.system = { conditions: {} };
    this._updates = [];
  }

  async update(data) {
    this._updates.push(data);
    // Apply update to system
    for (const [key, value] of Object.entries(data)) {
      const path = key.split('.');
      let target = this;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      target[path[path.length - 1]] = value;
    }
  }

  getActiveTokens() {
    return [];
  }
}

const TestActor = ActorConditionsMixin(MockActor);

describe('ActorConditionsMixin', () => {
  let actor;

  beforeEach(() => {
    jest.clearAllMocks();
    actor = new TestActor();
  });

  describe('hasCondition', () => {
    it('returns false when condition is not set', () => {
      expect(actor.hasCondition('stunned')).toBe(false);
    });

    it('returns true when condition is set', () => {
      actor.system.conditions.stunned = true;
      expect(actor.hasCondition('stunned')).toBe(true);
    });

    it('returns false when condition is explicitly false', () => {
      actor.system.conditions.stunned = false;
      expect(actor.hasCondition('stunned')).toBe(false);
    });
  });

  describe('setCondition', () => {
    it('sets condition to true', async () => {
      await actor.setCondition('stunned', true);
      expect(actor.system.conditions.stunned).toBe(true);
    });

    it('sets condition to false', async () => {
      actor.system.conditions.stunned = true;
      await actor.setCondition('stunned', false);
      expect(actor.system.conditions.stunned).toBe(false);
    });

    it('updates actor data with correct path', async () => {
      await actor.setCondition('prone', true);
      expect(actor._updates).toHaveLength(1);
      expect(actor._updates[0]).toEqual({ 'system.conditions.prone': true });
    });
  });

  describe('toggleStatusEffect', () => {
    it('enables condition when not set', async () => {
      await actor.toggleStatusEffect('blinded');
      expect(actor.system.conditions.blinded).toBe(true);
    });

    it('disables condition when already set', async () => {
      actor.system.conditions.blinded = true;
      await actor.toggleStatusEffect('blinded');
      expect(actor.system.conditions.blinded).toBe(false);
    });
  });
});
