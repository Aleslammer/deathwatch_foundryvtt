import { jest } from '@jest/globals';
import './setup.mjs';
import { ActorConditionsMixin } from '../src/module/documents/actor-conditions.mjs';

class MockActor {
  constructor() {
    this.effects = [];
    this._createdEffects = [];
    this._deletedEffects = [];
    this.system = { modifiers: [] };
  }

  async createEmbeddedDocuments(type, data) {
    if (type !== 'ActiveEffect') return [];
    const effects = data.map(d => ({
      ...d,
      statuses: new Set(d.statuses || []),
      delete: jest.fn(async () => {
        this.effects = this.effects.filter(e => e !== effect);
        this._deletedEffects.push(effect);
      })
    }));
    this.effects.push(...effects);
    this._createdEffects.push(...effects);
    return effects;
  }

  async update(data) {
    if (data['system.modifiers']) {
      this.system.modifiers = data['system.modifiers'];
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
    global.CONFIG = { statusEffects: [
      { id: 'stunned', name: 'Stunned', img: 'icons/svg/daze.svg' },
      { id: 'prone', name: 'Prone', img: 'icons/svg/falling.svg', modifiers: [
        { name: 'Prone Penalty', modifier: -20, effectType: 'characteristic', valueAffected: 'ws' }
      ]},
      { id: 'blinded', name: 'Blinded', img: 'icons/svg/blind.svg', modifiers: [
        { name: 'Blinded Penalty', modifier: -30, effectType: 'characteristic', valueAffected: 'ws' }
      ]},
      { id: 'grappled', name: 'Grappled', img: 'icons/svg/net.svg', modifiers: [
        { name: 'Grappled Penalty', modifier: -20, effectType: 'characteristic', valueAffected: 'ws' },
        { name: 'Grappled Penalty', modifier: -20, effectType: 'characteristic', valueAffected: 'bs' }
      ]}
    ]};
    actor = new TestActor();
  });

  describe('hasCondition', () => {
    it('returns false when condition is not set', () => {
      expect(actor.hasCondition('stunned')).toBe(false);
    });

    it('returns true when condition is set', () => {
      actor.effects.push({
        statuses: new Set(['stunned'])
      });
      expect(actor.hasCondition('stunned')).toBe(true);
    });

    it('returns false when no effects exist', () => {
      expect(actor.hasCondition('prone')).toBe(false);
    });
  });

  describe('setCondition', () => {
    it('creates Active Effect when enabling condition', async () => {
      await actor.setCondition('stunned', true);
      expect(actor._createdEffects).toHaveLength(1);
      expect(actor._createdEffects[0].name).toBe('Stunned');
      expect(actor._createdEffects[0].statuses.has('stunned')).toBe(true);
    });

    it('deletes Active Effect when disabling condition', async () => {
      const effect = {
        statuses: new Set(['prone']),
        delete: jest.fn()
      };
      actor.effects.push(effect);
      
      await actor.setCondition('prone', false);
      expect(effect.delete).toHaveBeenCalled();
    });

    it('does nothing when enabling already enabled condition', async () => {
      actor.effects.push({
        statuses: new Set(['blinded'])
      });
      
      await actor.setCondition('blinded', true);
      expect(actor._createdEffects).toHaveLength(0);
    });

    it('does nothing when disabling already disabled condition', async () => {
      await actor.setCondition('stunned', false);
      expect(actor._deletedEffects).toHaveLength(0);
    });

    it('adds modifiers to actor when enabling condition with modifiers', async () => {
      await actor.setCondition('prone', true);
      expect(actor.system.modifiers).toHaveLength(1);
      expect(actor.system.modifiers[0]).toMatchObject({
        name: 'Prone Penalty',
        modifier: -20,
        effectType: 'characteristic',
        valueAffected: 'ws',
        _statusId: 'prone',
        source: 'Prone'
      });
    });

    it('does not add modifiers when enabling condition without modifiers', async () => {
      await actor.setCondition('stunned', true);
      expect(actor.system.modifiers).toHaveLength(0);
    });

    it('removes modifiers when disabling condition', async () => {
      actor.system.modifiers = [
        { name: 'Prone Penalty', modifier: -20, effectType: 'characteristic', valueAffected: 'ws', _statusId: 'prone' }
      ];
      const effect = {
        statuses: new Set(['prone']),
        delete: jest.fn()
      };
      actor.effects.push(effect);
      
      await actor.setCondition('prone', false);
      expect(actor.system.modifiers).toHaveLength(0);
    });

    it('adds multiple modifiers for effects with multiple modifiers', async () => {
      await actor.setCondition('grappled', true);
      expect(actor.system.modifiers).toHaveLength(2);
      expect(actor.system.modifiers[0].valueAffected).toBe('ws');
      expect(actor.system.modifiers[1].valueAffected).toBe('bs');
    });
  });

  describe('toggleStatusEffect', () => {
    it('enables condition when not set', async () => {
      await actor.toggleStatusEffect('blinded');
      expect(actor.hasCondition('blinded')).toBe(true);
    });

    it('disables condition when already set', async () => {
      const effect = {
        statuses: new Set(['blinded']),
        delete: jest.fn(async () => {
          actor.effects = actor.effects.filter(e => e !== effect);
        })
      };
      actor.effects.push(effect);
      
      await actor.toggleStatusEffect('blinded');
      expect(effect.delete).toHaveBeenCalled();
      expect(actor.hasCondition('blinded')).toBe(false);
    });
  });
});
