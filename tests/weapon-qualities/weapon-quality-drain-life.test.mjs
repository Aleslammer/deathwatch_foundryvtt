import { jest } from '@jest/globals';
import { CombatDialogHelper } from '../../src/module/helpers/combat/combat-dialog.mjs';

describe('Drain Life Weapon Quality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildDamageMessage with Drain Life', () => {
    it('includes drain life button when drainLifeMessage provided', () => {
      const drainLifeMessage = '<button class="drain-life-test-btn" data-attacker-id="attacker123" data-target-id="target456">Drain Life: Opposed Willpower Test</button>';
      
      const message = CombatDialogHelper.buildDamageMessage(
        'Target Name',
        10,
        'Body',
        15,
        5,
        2,
        3,
        4,
        false,
        0,
        'target456',
        'Rending',
        false,
        false,
        drainLifeMessage
      );

      expect(message).toContain('drain-life-test-btn');
      expect(message).toContain('data-attacker-id="attacker123"');
      expect(message).toContain('data-target-id="target456"');
      expect(message).toContain('Drain Life: Opposed Willpower Test');
    });

    it('does not include drain life button when drainLifeMessage empty', () => {
      const message = CombatDialogHelper.buildDamageMessage(
        'Target Name',
        10,
        'Body',
        15,
        5,
        2,
        3,
        4,
        false,
        0,
        'target456',
        'Rending',
        false,
        false,
        ''
      );

      expect(message).not.toContain('drain-life-test-btn');
      expect(message).not.toContain('Drain Life');
    });

    it('includes drain life button with other quality buttons', () => {
      const drainLifeMessage = '<button class="drain-life-test-btn">Drain Life</button>';
      
      const message = CombatDialogHelper.buildDamageMessage(
        'Target Name',
        10,
        'Body',
        15,
        5,
        2,
        3,
        4,
        false,
        0,
        'target456',
        'Rending',
        true,
        true,
        drainLifeMessage
      );

      expect(message).toContain('shocking-test-btn');
      expect(message).toContain('toxic-test-btn');
      expect(message).toContain('drain-life-test-btn');
    });
  });

  describe('Drain Life button format', () => {
    it('creates properly formatted button with attacker and target IDs', () => {
      const attackerId = 'actor123';
      const targetId = 'actor456';
      const drainLifeMessage = `<button class="drain-life-test-btn" data-attacker-id="${attackerId}" data-target-id="${targetId}">Drain Life: Opposed Willpower Test</button>`;

      expect(drainLifeMessage).toContain('class="drain-life-test-btn"');
      expect(drainLifeMessage).toContain(`data-attacker-id="${attackerId}"`);
      expect(drainLifeMessage).toContain(`data-target-id="${targetId}"`);
    });
  });
});
