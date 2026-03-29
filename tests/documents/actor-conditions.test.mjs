import { jest } from '@jest/globals';
import { ActorConditionsMixin } from '../../src/module/documents/actor-conditions.mjs';

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
      ]},
      { id: 'dominated', name: 'Dominated', img: 'icons/svg/mystery-man.svg', modifiers: [
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'ws' },
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'bs' },
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'str' },
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'tg' },
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'ag' },
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'int' },
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'per' },
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'wil' },
        { name: 'Dominated', modifier: -10, effectType: 'characteristic', valueAffected: 'fs' }
      ]},
      { id: 'compelled', name: 'Compelled', img: 'icons/svg/daze.svg' },
      { id: 'paroxysm', name: 'Paroxysm', img: 'icons/svg/downgrade.svg', dynamicModifiers: true, staticModifiers: [
        { name: 'Paroxysm', modifier: -10, effectType: 'characteristic', valueAffected: 'int' },
        { name: 'Paroxysm', modifier: -10, effectType: 'characteristic', valueAffected: 'per' },
        { name: 'Paroxysm', modifier: -10, effectType: 'characteristic', valueAffected: 'wil' },
        { name: 'Paroxysm', modifier: -10, effectType: 'characteristic', valueAffected: 'fs' }
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

  describe('psychic status effects', () => {
    it('dominated adds -10 to all 9 characteristics', async () => {
      await actor.setCondition('dominated', true);
      expect(actor.system.modifiers).toHaveLength(9);
      actor.system.modifiers.forEach(m => {
        expect(m.modifier).toBe(-10);
        expect(m._statusId).toBe('dominated');
        expect(m.source).toBe('Dominated');
      });
    });

    it('compelled adds no modifiers', async () => {
      await actor.setCondition('compelled', true);
      expect(actor.system.modifiers).toHaveLength(0);
      expect(actor.hasCondition('compelled')).toBe(true);
    });

    it('dominated modifiers removed on toggle off', async () => {
      await actor.setCondition('dominated', true);
      expect(actor.system.modifiers).toHaveLength(9);
      const effect = actor.effects.find(e => e.statuses.has('dominated'));
      effect.delete = jest.fn();
      await actor.setCondition('dominated', false);
      expect(actor.system.modifiers).toHaveLength(0);
    });
  });

  describe('paroxysm dynamic modifiers', () => {
    it('reduces WS to 10 via dynamic modifier', async () => {
      actor.system.characteristics = { ws: { value: 45 }, bs: { value: 30 } };
      await actor.setCondition('paroxysm', true);
      const wsMod = actor.system.modifiers.find(m => m.valueAffected === 'ws');
      expect(wsMod.modifier).toBe(-35);
    });

    it('reduces BS to 10 via dynamic modifier', async () => {
      actor.system.characteristics = { ws: { value: 45 }, bs: { value: 30 } };
      await actor.setCondition('paroxysm', true);
      const bsMod = actor.system.modifiers.find(m => m.valueAffected === 'bs');
      expect(bsMod.modifier).toBe(-20);
    });

    it('includes static -10 to INT, PER, WIL, FEL', async () => {
      actor.system.characteristics = { ws: { value: 40 }, bs: { value: 40 } };
      await actor.setCondition('paroxysm', true);
      const staticMods = actor.system.modifiers.filter(m => ['int', 'per', 'wil', 'fs'].includes(m.valueAffected));
      expect(staticMods).toHaveLength(4);
      staticMods.forEach(m => expect(m.modifier).toBe(-10));
    });

    it('WS already at 10 produces no WS modifier', async () => {
      actor.system.characteristics = { ws: { value: 10 }, bs: { value: 40 } };
      await actor.setCondition('paroxysm', true);
      const wsMod = actor.system.modifiers.find(m => m.valueAffected === 'ws');
      expect(wsMod).toBeUndefined();
    });

    it('WS below 10 does not buff (clamped to 0)', async () => {
      actor.system.characteristics = { ws: { value: 5 }, bs: { value: 40 } };
      await actor.setCondition('paroxysm', true);
      const wsMod = actor.system.modifiers.find(m => m.valueAffected === 'ws');
      expect(wsMod).toBeUndefined();
    });

    it('high WS produces large negative modifier', async () => {
      actor.system.characteristics = { ws: { value: 75 }, bs: { value: 60 } };
      await actor.setCondition('paroxysm', true);
      const wsMod = actor.system.modifiers.find(m => m.valueAffected === 'ws');
      const bsMod = actor.system.modifiers.find(m => m.valueAffected === 'bs');
      expect(wsMod.modifier).toBe(-65);
      expect(bsMod.modifier).toBe(-50);
    });

    it('all modifiers tagged with _statusId paroxysm', async () => {
      actor.system.characteristics = { ws: { value: 40 }, bs: { value: 40 } };
      await actor.setCondition('paroxysm', true);
      actor.system.modifiers.forEach(m => {
        expect(m._statusId).toBe('paroxysm');
        expect(m.source).toBe('Paroxysm');
      });
    });

    it('toggling off removes all paroxysm modifiers', async () => {
      actor.system.characteristics = { ws: { value: 45 }, bs: { value: 30 } };
      await actor.setCondition('paroxysm', true);
      expect(actor.system.modifiers.length).toBeGreaterThan(0);
      const effect = actor.effects.find(e => e.statuses.has('paroxysm'));
      effect.delete = jest.fn();
      await actor.setCondition('paroxysm', false);
      expect(actor.system.modifiers).toHaveLength(0);
    });

    it('total modifier count is dynamic WS + dynamic BS + 4 static', async () => {
      actor.system.characteristics = { ws: { value: 45 }, bs: { value: 30 } };
      await actor.setCondition('paroxysm', true);
      // WS -35, BS -20, INT -10, PER -10, WIL -10, FEL -10 = 6
      expect(actor.system.modifiers).toHaveLength(6);
    });

    it('does not stack when applied twice', async () => {
      actor.system.characteristics = { ws: { value: 40 }, bs: { value: 40 } };
      await actor.setCondition('paroxysm', true);
      const count = actor.system.modifiers.length;
      await actor.setCondition('paroxysm', true);
      expect(actor.system.modifiers).toHaveLength(count);
    });
  });
});
