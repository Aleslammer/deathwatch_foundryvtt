import { jest } from '@jest/globals';
import '../setup.mjs';
import { CombatDialogHelper } from '../../src/module/helpers/combat-dialog.mjs';
import { ChatMessageBuilder } from '../../src/module/helpers/chat-message-builder.mjs';

describe('Force Weapon Channeling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CombatDialogHelper.buildDamageMessage', () => {
    const baseArgs = ['Target', 5, 'Body', 10, 8, 2, 6, 4, false, 0, 'target123', 'Energy'];

    it('should include force channel button when forceWeaponData provided and wounds taken', () => {
      const forceData = { attackerId: 'attacker123', psyRating: 3 };
      const message = CombatDialogHelper.buildDamageMessage(...baseArgs, false, false, '', null, forceData);

      expect(message).toContain('force-channel-btn');
      expect(message).toContain('data-attacker-id="attacker123"');
      expect(message).toContain('data-target-id="target123"');
      expect(message).toContain('data-psy-rating="3"');
      expect(message).toContain('Force: Channel Psychic Energy');
    });

    it('should not include force button when no wounds taken', () => {
      const forceData = { attackerId: 'attacker123', psyRating: 3 };
      const message = CombatDialogHelper.buildDamageMessage(
        'Target', 0, 'Body', 10, 8, 2, 6, 4, false, 0, 'target123', 'Energy',
        false, false, '', null, forceData
      );

      expect(message).not.toContain('force-channel-btn');
    });

    it('should not include force button when forceWeaponData is null', () => {
      const message = CombatDialogHelper.buildDamageMessage(...baseArgs, false, false, '', null, null);

      expect(message).not.toContain('force-channel-btn');
    });

    it('should include force button alongside shocking and toxic buttons', () => {
      const forceData = { attackerId: 'attacker123', psyRating: 5 };
      const message = CombatDialogHelper.buildDamageMessage(
        'Target', 5, 'Body', 10, 8, 2, 6, 4, false, 0, 'target123', 'Energy',
        true, true, '', null, forceData
      );

      expect(message).toContain('shocking-test-btn');
      expect(message).toContain('toxic-test-btn');
      expect(message).toContain('force-channel-btn');
    });
  });

  describe('ChatMessageBuilder.createDamageApplyButton', () => {
    it('should include force data attributes when forceWeaponData provided', () => {
      const forceData = { attackerId: 'attacker123', psyRating: 4 };
      const button = ChatMessageBuilder.createDamageApplyButton(
        10, 2, 'Body', 'target123', 'Energy',
        false, false, 0, false, false, false, false, false, null, forceData
      );

      expect(button).toContain('data-is-force="true"');
      expect(button).toContain('data-force-attacker-id="attacker123"');
      expect(button).toContain('data-force-psy-rating="4"');
    });

    it('should not include force data attributes when forceWeaponData is null', () => {
      const button = ChatMessageBuilder.createDamageApplyButton(
        10, 2, 'Body', 'target123', 'Energy',
        false, false, 0, false, false, false, false, false, null, null
      );

      expect(button).not.toContain('data-is-force');
      expect(button).not.toContain('data-force-attacker-id');
      expect(button).not.toContain('data-force-psy-rating');
    });
  });
});
