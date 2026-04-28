import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';
import { CombatHelper } from '../../src/module/helpers/combat/combat.mjs';
import { ChatMessageBuilder } from '../../src/module/helpers/ui/chat-message-builder.mjs';

describe('Talent Damage Bonuses', () => {

  describe('CombatHelper.hasTalent', () => {
    it('returns true when actor has the talent', () => {
      const actor = { items: [{ type: 'talent', name: 'Crushing Blow', system: {} }] };
      expect(CombatHelper.hasTalent(actor, 'Crushing Blow')).toBe(true);
    });

    it('returns false when actor lacks the talent', () => {
      const actor = { items: [{ type: 'talent', name: 'Swift Attack', system: {} }] };
      expect(CombatHelper.hasTalent(actor, 'Crushing Blow')).toBe(false);
    });

    it('returns false for null actor', () => {
      expect(CombatHelper.hasTalent(null, 'Crushing Blow')).toBe(false);
    });

    it('returns false for actor with no items', () => {
      expect(CombatHelper.hasTalent({ items: null }, 'Crushing Blow')).toBe(false);
    });

    it('ignores non-talent items with same name', () => {
      const actor = { items: [{ type: 'gear', name: 'Crushing Blow', system: {} }] };
      expect(CombatHelper.hasTalent(actor, 'Crushing Blow')).toBe(false);
    });

    it('works with Map items', () => {
      const items = new Map();
      items.set('t1', { type: 'talent', name: 'Mighty Shot', system: {} });
      const actor = { items };
      expect(CombatHelper.hasTalent(actor, 'Mighty Shot')).toBe(true);
    });

    it('returns false for empty items array', () => {
      const actor = { items: [] };
      expect(CombatHelper.hasTalent(actor, 'Crushing Blow')).toBe(false);
    });
  });

  describe('CombatHelper.getCrushingBlowBonus', () => {
    it('returns 2 when actor has Crushing Blow', () => {
      const actor = { items: [{ type: 'talent', name: 'Crushing Blow', system: {} }] };
      expect(CombatHelper.getCrushingBlowBonus(actor)).toBe(2);
    });

    it('returns 0 when actor lacks Crushing Blow', () => {
      const actor = { items: [] };
      expect(CombatHelper.getCrushingBlowBonus(actor)).toBe(0);
    });
  });

  describe('CombatHelper.getMightyShotBonus', () => {
    it('returns 2 when actor has Mighty Shot', () => {
      const actor = { items: [{ type: 'talent', name: 'Mighty Shot', system: {} }] };
      expect(CombatHelper.getMightyShotBonus(actor)).toBe(2);
    });

    it('returns 0 when actor lacks Mighty Shot', () => {
      const actor = { items: [] };
      expect(CombatHelper.getMightyShotBonus(actor)).toBe(0);
    });
  });

  describe('buildDamageFormula - Crushing Blow', () => {
    it('adds +2 to melee damage formula', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10+5', degreesOfSuccess: 0, isMelee: true, strBonus: 4, hitIndex: 0, crushingBlowBonus: 2
      });
      expect(formula).toBe('1d10+5 + 4 + 2');
    });

    it('does not add to ranged damage formula', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10+5', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, crushingBlowBonus: 2
      });
      expect(formula).toBe('1d10+5');
    });

    it('does not add when bonus is 0', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10+5', degreesOfSuccess: 0, isMelee: true, strBonus: 4, hitIndex: 0, crushingBlowBonus: 0
      });
      expect(formula).toBe('1d10+5 + 4');
    });

    it('stacks with Power Fist STR doubling', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '2d10', degreesOfSuccess: 0, isMelee: true, strBonus: 10, hitIndex: 0, isPowerFist: true, crushingBlowBonus: 2
      });
      expect(formula).toBe('2d10 + 20 + 2');
    });

    it('stacks with Lightning Claw bonus', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 3, isMelee: true, strBonus: 4, hitIndex: 1,
        isLightningClaw: true, hasLightningClawPair: false, crushingBlowBonus: 2
      });
      expect(formula).toBe('1d10 + 4 + 3 + 2');
    });
  });

  describe('buildDamageFormula - Mighty Shot', () => {
    it('adds +2 to ranged damage formula', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '2d10+5', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, mightyShotBonus: 2
      });
      expect(formula).toBe('2d10+5 + 2');
    });

    it('does not add to melee damage formula', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10+5', degreesOfSuccess: 0, isMelee: true, strBonus: 4, hitIndex: 0, mightyShotBonus: 2
      });
      expect(formula).toBe('1d10+5 + 4');
    });

    it('does not add when bonus is 0', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '2d10+5', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0, mightyShotBonus: 0
      });
      expect(formula).toBe('2d10+5');
    });

    it('stacks with Accurate bonus damage', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 4, isMelee: false, strBonus: 0, hitIndex: 0,
        isAccurate: true, isAiming: true, isSingleShot: true, mightyShotBonus: 2
      });
      expect(formula).toBe('1d10min4 + 2d10 + 2');
    });
  });

  describe('buildDamageFormula - both talents have no cross-contamination', () => {
    it('melee gets Crushing Blow but not Mighty Shot', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 0, isMelee: true, strBonus: 5, hitIndex: 0,
        crushingBlowBonus: 2, mightyShotBonus: 2
      });
      expect(formula).toBe('1d10 + 5 + 2');
    });

    it('ranged gets Mighty Shot but not Crushing Blow', () => {
      const formula = CombatDialogHelper.buildDamageFormula({
        baseDmg: '1d10', degreesOfSuccess: 0, isMelee: false, strBonus: 0, hitIndex: 0,
        crushingBlowBonus: 2, mightyShotBonus: 2
      });
      expect(formula).toBe('1d10 + 2');
    });
  });

  describe('CombatHelper.getCriticalDamageBonus', () => {
    it('returns 2 for ranged with critical-damage modifier (modifier-based)', () => {
      // Use a different talent name to prove it's using modifiers, not name lookup
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [{
          type: 'talent',
          name: 'Some Other Talent',
          system: {
            modifiers: [{
              name: 'Ranged Critical Bonus',
              modifier: 2,
              effectType: 'critical-damage',
              valueAffected: 'ranged',
              enabled: true
            }]
          }
        }]
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, false)).toBe(2);
    });

    it('returns 2 for ranged with Crack Shot', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [{
          type: 'talent',
          name: 'Crack Shot',
          system: {
            modifiers: [{
              name: 'Crack Shot',
              modifier: 2,
              effectType: 'critical-damage',
              valueAffected: 'ranged',
              enabled: true
            }]
          }
        }]
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, false)).toBe(2);
    });

    it('returns 0 for ranged without Crack Shot', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: []
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, false)).toBe(0);
    });

    it('returns 0 for melee with Crack Shot (ranged only)', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [{
          type: 'talent',
          name: 'Crack Shot',
          system: {
            modifiers: [{
              name: 'Crack Shot',
              modifier: 2,
              effectType: 'critical-damage',
              valueAffected: 'ranged',
              enabled: true
            }]
          }
        }]
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, true)).toBe(0);
    });

    it('returns 4 for melee with Crippling Strike', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [{
          type: 'talent',
          name: 'Crippling Strike',
          system: {
            modifiers: [{
              name: 'Crippling Strike',
              modifier: 4,
              effectType: 'critical-damage',
              valueAffected: 'melee',
              enabled: true
            }]
          }
        }]
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, true)).toBe(4);
    });

    it('returns 0 for ranged with Crippling Strike (melee only)', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [{
          type: 'talent',
          name: 'Crippling Strike',
          system: {
            modifiers: [{
              name: 'Crippling Strike',
              modifier: 4,
              effectType: 'critical-damage',
              valueAffected: 'melee',
              enabled: true
            }]
          }
        }]
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, false)).toBe(0);
    });

    it('returns 2 for melee with Street Fighting and unarmed weapon', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [{
          type: 'talent',
          name: 'Street Fighting',
          system: {
            modifiers: [{
              name: 'Street Fighting',
              modifier: 2,
              effectType: 'critical-damage',
              valueAffected: 'melee',
              enabled: true
            }]
          }
        }]
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, true, 'Unarmed')).toBe(2);
    });

    it('returns 2 for melee with Street Fighting and knife weapon', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [{
          type: 'talent',
          name: 'Street Fighting',
          system: {
            modifiers: [{
              name: 'Street Fighting',
              modifier: 2,
              effectType: 'critical-damage',
              valueAffected: 'melee',
              enabled: true
            }]
          }
        }]
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, true, 'Combat Knife')).toBe(2);
    });

    it('returns 0 for melee with Street Fighting and non-knife weapon', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [{
          type: 'talent',
          name: 'Street Fighting',
          system: {
            modifiers: [{
              name: 'Street Fighting',
              modifier: 2,
              effectType: 'critical-damage',
              valueAffected: 'melee',
              enabled: true,
              weaponRestriction: 'unarmed-or-knife'
            }]
          }
        }]
      };
      // Street Fighting restricted to unarmed/knife only
      expect(CombatHelper.getCriticalDamageBonus(actor, true, 'Power Sword')).toBe(0);
    });

    it('Crippling Strike and Street Fighting stack for knife', () => {
      const actor = {
        system: { modifiers: [] },
        effects: [],
        items: [
          {
            type: 'talent',
            name: 'Crippling Strike',
            system: {
              modifiers: [{
                name: 'Crippling Strike',
                modifier: 4,
                effectType: 'critical-damage',
                valueAffected: 'melee',
                enabled: true
              }]
            }
          },
          {
            type: 'talent',
            name: 'Street Fighting',
            system: {
              modifiers: [{
                name: 'Street Fighting',
                modifier: 2,
                effectType: 'critical-damage',
                valueAffected: 'melee',
                enabled: true
              }]
            }
          }
        ]
      };
      expect(CombatHelper.getCriticalDamageBonus(actor, true, 'Combat Knife')).toBe(6);
    });

    it('returns 0 for null actor', () => {
      expect(CombatHelper.getCriticalDamageBonus(null, true)).toBe(0);
    });
  });

  describe('createDamageApplyButton - criticalDamageBonus', () => {
    it('includes data attribute when bonus > 0', () => {
      const html = ChatMessageBuilder.createDamageApplyButton({
        damage: 15, penetration: 4, location: 'Body', targetId: 'abc',
        criticalDamageBonus: 2
      });
      expect(html).toContain('data-critical-damage-bonus="2"');
    });

    it('omits data attribute when bonus is 0', () => {
      const html = ChatMessageBuilder.createDamageApplyButton({
        damage: 15, penetration: 4, location: 'Body', targetId: 'abc',
        criticalDamageBonus: 0
      });
      expect(html).not.toContain('data-critical-damage-bonus');
    });

    it('omits data attribute when bonus not provided', () => {
      const html = ChatMessageBuilder.createDamageApplyButton({
        damage: 15, penetration: 4, location: 'Body', targetId: 'abc'
      });
      expect(html).not.toContain('data-critical-damage-bonus');
    });
  });
});
