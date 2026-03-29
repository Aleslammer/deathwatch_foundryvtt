import { jest } from '@jest/globals';
import { FireHelper } from '../../src/module/helpers/combat/fire-helper.mjs';

describe('FireHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPowerArmor', () => {
    it('returns true when actor has equipped power armor', () => {
      const actor = { items: [{ type: 'armor', system: { equipped: true }, name: 'Mk VII Power Armour' }] };
      expect(FireHelper.hasPowerArmor(actor)).toBe(true);
    });

    it('returns false when power armor is not equipped', () => {
      const actor = { items: [{ type: 'armor', system: { equipped: false }, name: 'Mk VII Power Armour' }] };
      expect(FireHelper.hasPowerArmor(actor)).toBe(false);
    });

    it('returns false when actor has no armor', () => {
      const actor = { items: [{ type: 'weapon', system: { equipped: true }, name: 'Bolter' }] };
      expect(FireHelper.hasPowerArmor(actor)).toBe(false);
    });

    it('returns false when actor has non-power armor', () => {
      const actor = { items: [{ type: 'armor', system: { equipped: true }, name: 'Flak Vest' }] };
      expect(FireHelper.hasPowerArmor(actor)).toBe(false);
    });

    it('returns false for null actor', () => {
      expect(FireHelper.hasPowerArmor(null)).toBe(false);
    });

    it('returns false for actor with no items', () => {
      expect(FireHelper.hasPowerArmor({ items: null })).toBe(false);
    });

    it('handles Map-based items collection', () => {
      const items = new Map();
      items.set('a1', { type: 'armor', system: { equipped: true }, name: 'Power Armour' });
      const actor = { items };
      expect(FireHelper.hasPowerArmor(actor)).toBe(true);
    });

    it('case-insensitive power armor detection', () => {
      const actor = { items: [{ type: 'armor', system: { equipped: true }, name: 'POWER ARMOUR MK VIII' }] };
      expect(FireHelper.hasPowerArmor(actor)).toBe(true);
    });
  });

  describe('buildOnFireMessage', () => {
    it('includes damage and fatigue', () => {
      const msg = FireHelper.buildOnFireMessage('Marine', 7, 5, 20, 2, { autoPass: true }, 'actor1');
      expect(msg).toContain('On Fire');
      expect(msg).toContain('Marine');
      expect(msg).toContain('7');
      expect(msg).toContain('now 2');
    });

    it('shows critical damage when wounds exceed max', () => {
      const msg = FireHelper.buildOnFireMessage('Marine', 8, 18, 20, 1, { autoPass: true }, 'actor1');
      // 18 + 8 = 26 > 20 → critical 6
      expect(msg).toContain('CRITICAL DAMAGE: 6');
    });

    it('no critical when wounds within max', () => {
      const msg = FireHelper.buildOnFireMessage('Marine', 3, 5, 20, 1, { autoPass: true }, 'actor1');
      expect(msg).not.toContain('CRITICAL');
    });

    it('shows auto-pass for power armor', () => {
      const msg = FireHelper.buildOnFireMessage('Marine', 5, 5, 20, 1, { autoPass: true }, 'actor1');
      expect(msg).toContain('AUTO-PASS');
      expect(msg).toContain('Power Armour');
    });

    it('shows WP success', () => {
      const msg = FireHelper.buildOnFireMessage('Marine', 5, 5, 20, 1, { autoPass: false, roll: 30, success: true, wp: 55 }, 'actor1');
      expect(msg).toContain('SUCCESS');
      expect(msg).toContain('Can act normally');
      expect(msg).toContain('WP 55');
    });

    it('shows WP failure with no extinguish button', () => {
      const msg = FireHelper.buildOnFireMessage('Marine', 5, 5, 20, 1, { autoPass: false, roll: 70, success: false, wp: 55 }, 'actor1');
      expect(msg).toContain('FAILED');
      expect(msg).toContain('run and scream');
      expect(msg).not.toContain('extinguish-btn');
    });

    it('includes extinguish button on WP success', () => {
      const msg = FireHelper.buildOnFireMessage('Marine', 5, 5, 20, 1, { autoPass: false, roll: 30, success: true, wp: 55 }, 'actor123');
      expect(msg).toContain('extinguish-btn');
      expect(msg).toContain('actor123');
    });

    it('includes extinguish button on auto-pass', () => {
      const msg = FireHelper.buildOnFireMessage('Marine', 5, 5, 20, 1, { autoPass: true }, 'actor123');
      expect(msg).toContain('extinguish-btn');
    });
  });

  describe('resolveExtinguishTest', () => {
    it('success when roll <= AG - 20', () => {
      const result = FireHelper.resolveExtinguishTest(50, 25);
      expect(result.targetNumber).toBe(30);
      expect(result.success).toBe(true);
    });

    it('failure when roll > AG - 20', () => {
      const result = FireHelper.resolveExtinguishTest(50, 35);
      expect(result.targetNumber).toBe(30);
      expect(result.success).toBe(false);
    });

    it('exact roll equals target succeeds', () => {
      const result = FireHelper.resolveExtinguishTest(50, 30);
      expect(result.success).toBe(true);
    });

    it('low AG makes it very hard', () => {
      const result = FireHelper.resolveExtinguishTest(15, 1);
      expect(result.targetNumber).toBe(-5);
      expect(result.success).toBe(false);
    });

    it('high AG makes it easier', () => {
      const result = FireHelper.resolveExtinguishTest(80, 55);
      expect(result.targetNumber).toBe(60);
      expect(result.success).toBe(true);
    });

    it('positive misc modifier increases target', () => {
      const result = FireHelper.resolveExtinguishTest(50, 35, 10);
      expect(result.targetNumber).toBe(40);
      expect(result.success).toBe(true);
    });

    it('negative misc modifier decreases target', () => {
      const result = FireHelper.resolveExtinguishTest(50, 25, -10);
      expect(result.targetNumber).toBe(20);
      expect(result.success).toBe(false);
    });
  });

  describe('resolveDodgeFlameTest', () => {
    it('success when roll <= AG', () => {
      const result = FireHelper.resolveDodgeFlameTest(40, 30);
      expect(result.targetNumber).toBe(40);
      expect(result.success).toBe(true);
    });

    it('failure when roll > AG', () => {
      const result = FireHelper.resolveDodgeFlameTest(40, 50);
      expect(result.success).toBe(false);
    });

    it('exact roll equals target succeeds', () => {
      const result = FireHelper.resolveDodgeFlameTest(40, 40);
      expect(result.success).toBe(true);
    });

    it('positive misc modifier increases target', () => {
      const result = FireHelper.resolveDodgeFlameTest(40, 55, 20);
      expect(result.targetNumber).toBe(60);
      expect(result.success).toBe(true);
    });

    it('negative misc modifier decreases target', () => {
      const result = FireHelper.resolveDodgeFlameTest(40, 30, -20);
      expect(result.targetNumber).toBe(20);
      expect(result.success).toBe(false);
    });
  });

  describe('resolveCatchFireTest', () => {
    it('success when roll <= AG', () => {
      const result = FireHelper.resolveCatchFireTest(40, 30);
      expect(result.targetNumber).toBe(40);
      expect(result.success).toBe(true);
    });

    it('failure when roll > AG', () => {
      const result = FireHelper.resolveCatchFireTest(40, 50);
      expect(result.success).toBe(false);
    });

    it('exact roll equals target succeeds', () => {
      const result = FireHelper.resolveCatchFireTest(40, 40);
      expect(result.success).toBe(true);
    });
  });

  describe('buildDodgeFlameFlavor', () => {
    it('shows success message', () => {
      const result = { targetNumber: 40, success: true };
      const flavor = FireHelper.buildDodgeFlameFlavor('Ork Boy', 40, result);
      expect(flavor).toContain('Ork Boy');
      expect(flavor).toContain('Dodged the flames');
      expect(flavor).toContain('AG 40');
    });

    it('shows failure message', () => {
      const result = { targetNumber: 40, success: false };
      const flavor = FireHelper.buildDodgeFlameFlavor('Ork Boy', 40, result);
      expect(flavor).toContain('Hit by flames');
    });

    it('shows misc modifier in breakdown', () => {
      const result = { targetNumber: 60, success: true };
      const flavor = FireHelper.buildDodgeFlameFlavor('Ork Boy', 40, result, 20);
      expect(flavor).toContain('+20 Misc');
    });

    it('shows negative misc modifier', () => {
      const result = { targetNumber: 20, success: false };
      const flavor = FireHelper.buildDodgeFlameFlavor('Ork Boy', 40, result, -20);
      expect(flavor).toContain('-20 Misc');
    });

    it('omits misc when zero', () => {
      const result = { targetNumber: 40, success: true };
      const flavor = FireHelper.buildDodgeFlameFlavor('Ork Boy', 40, result, 0);
      expect(flavor).not.toContain('Misc');
    });
  });

  describe('buildCatchFireFlavor', () => {
    it('shows success message', () => {
      const result = { targetNumber: 40, success: true };
      const flavor = FireHelper.buildCatchFireFlavor('Ork Boy', 40, result);
      expect(flavor).toContain('Does not catch fire');
    });

    it('shows failure message', () => {
      const result = { targetNumber: 40, success: false };
      const flavor = FireHelper.buildCatchFireFlavor('Ork Boy', 40, result);
      expect(flavor).toContain('On Fire');
    });

    it('includes target AG', () => {
      const result = { targetNumber: 55, success: true };
      const flavor = FireHelper.buildCatchFireFlavor('Marine', 55, result);
      expect(flavor).toContain('AG');
      expect(flavor).toContain('55');
    });
  });

  describe('buildExtinguishFlavor', () => {
    it('shows success message', () => {
      const result = { targetNumber: 30, success: true };
      const flavor = FireHelper.buildExtinguishFlavor('Marine', 50, 25, result);
      expect(flavor).toContain('Marine');
      expect(flavor).toContain('Fire extinguished');
      expect(flavor).toContain('AG 50');
    });

    it('shows failure message', () => {
      const result = { targetNumber: 30, success: false };
      const flavor = FireHelper.buildExtinguishFlavor('Marine', 50, 45, result);
      expect(flavor).toContain('Still on fire');
    });

    it('includes target number', () => {
      const result = { targetNumber: 25, success: false };
      const flavor = FireHelper.buildExtinguishFlavor('Marine', 45, 30, result);
      expect(flavor).toContain('Target: 25');
    });

    it('shows misc modifier in breakdown', () => {
      const result = { targetNumber: 40, success: true };
      const flavor = FireHelper.buildExtinguishFlavor('Marine', 50, 30, result, 10);
      expect(flavor).toContain('+10 Misc');
    });

    it('shows negative misc modifier', () => {
      const result = { targetNumber: 10, success: false };
      const flavor = FireHelper.buildExtinguishFlavor('Marine', 50, 30, result, -20);
      expect(flavor).toContain('-20 Misc');
    });

    it('omits misc when zero', () => {
      const result = { targetNumber: 30, success: true };
      const flavor = FireHelper.buildExtinguishFlavor('Marine', 50, 25, result, 0);
      expect(flavor).not.toContain('Misc');
    });
  });
});
