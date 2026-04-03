import { jest } from '@jest/globals';
import { ChatMessageBuilder } from '../../src/module/helpers/ui/chat-message-builder.mjs';

describe('ChatMessageBuilder', () => {
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActor = { name: 'Test Actor' };
    global.ChatMessage = {
      getSpeaker: jest.fn(() => ({ alias: 'Test Actor' })),
      create: jest.fn()
    };
    global.game = {
      settings: {
        get: jest.fn(() => 'roll')
      }
    };
  });

  describe('createItemCard', () => {
    it('creates armor history card', async () => {
      const item = {
        type: 'armor-history',
        name: 'Test History',
        system: {
          description: '<p>Test description</p>',
          book: 'Test Book',
          page: 42
        }
      };

      await ChatMessageBuilder.createItemCard(item, mockActor);

      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('armor-history-card')
      });
      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('Test History')
      });
    });

    it('creates critical effect card with image', async () => {
      const item = {
        type: 'critical-effect',
        name: 'Broken Arm',
        img: 'icons/test.png',
        system: {
          description: '<p>Arm is broken</p>',
          location: 'Right Arm',
          damageType: 'Impact'
        }
      };

      await ChatMessageBuilder.createItemCard(item, mockActor);

      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('critical-effect-card')
      });
      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('icons/test.png')
      });
    });

    it('creates talent card with prerequisite and benefit', async () => {
      const item = {
        type: 'talent',
        name: 'Marksman',
        system: {
          description: '<p>Better shooting</p>',
          prerequisite: 'BS 40',
          benefit: '+10 to aimed shots',
          book: 'Core',
          page: 100
        }
      };

      await ChatMessageBuilder.createItemCard(item, mockActor);

      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('talent-card')
      });
      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('BS 40')
      });
    });

    it('creates trait card', async () => {
      const item = {
        type: 'trait',
        name: 'Unnatural Strength',
        system: {
          description: '<p>Double strength bonus</p>',
          book: 'Core',
          page: 50
        }
      };

      await ChatMessageBuilder.createItemCard(item, mockActor);

      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('trait-card')
      });
    });

    it('creates special ability card with specialty', async () => {
      const item = {
        type: 'special-ability',
        name: 'Bolter Mastery',
        system: {
          description: '<p>+10 BS with Bolt weapons</p>',
          specialty: 'Tactical Marine',
          book: 'Deathwatch Core Rulebook',
          page: '85'
        }
      };

      await ChatMessageBuilder.createItemCard(item, mockActor);

      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('special-ability-card')
      });
      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('Tactical Marine')
      });
      expect(global.ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        content: expect.stringContaining('Bolter Mastery')
      });
    });
  });

  describe('createRollMessage', () => {
    it('creates roll message with flavor', async () => {
      const mockRoll = {
        toMessage: jest.fn()
      };

      await ChatMessageBuilder.createRollMessage(mockRoll, mockActor, 'Test Flavor');

      expect(mockRoll.toMessage).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        flavor: 'Test Flavor',
        rollMode: 'roll'
      });
    });
  });

  describe('createDamageApplyButton', () => {
    it('creates apply damage button with all parameters', () => {
      const button = ChatMessageBuilder.createDamageApplyButton({
        damage: 10, penetration: 5, location: 'Head', targetId: 'actor123', damageType: 'Energy'
      });

      expect(button).toContain('apply-damage-btn');
      expect(button).toContain('data-damage="10"');
      expect(button).toContain('data-penetration="5"');
      expect(button).toContain('data-location="Head"');
      expect(button).toContain('data-target-id="actor123"');
      expect(button).toContain('data-damage-type="Energy"');
    });

    it('defaults damage type to Impact', () => {
      const button = ChatMessageBuilder.createDamageApplyButton({
        damage: 10, penetration: 5, location: 'Body', targetId: 'actor123'
      });

      expect(button).toContain('data-damage-type="Impact"');
    });
  });

  describe('createDamageFlavor', () => {
    it('creates flavor for single hit', () => {
      const flavor = ChatMessageBuilder.createDamageFlavor('Bolter', 1, 1, 'Body', 3, 4, false, 0);

      expect(flavor).toContain('Bolter');
      expect(flavor).toContain('Hit 1');
      expect(flavor).toContain('Body');
      expect(flavor).toContain('DoS:</strong> 3');
      expect(flavor).toContain('Penetration:</strong> 4');
      expect(flavor).not.toContain('(1/1)');
    });

    it('creates flavor for multiple hits', () => {
      const flavor = ChatMessageBuilder.createDamageFlavor('Bolter', 2, 3, 'Right Arm', 0, 4, false, 0);

      expect(flavor).toContain('(2/3)');
      expect(flavor).toContain('Hit 2');
      expect(flavor).not.toContain('DoS');
    });

    it('includes STR bonus for melee first hit', () => {
      const flavor = ChatMessageBuilder.createDamageFlavor('Chainsword', 1, 1, 'Body', 2, 0, true, 10);

      expect(flavor).toContain('STR Bonus: 10');
    });

    it('excludes STR bonus for melee subsequent hits', () => {
      const flavor = ChatMessageBuilder.createDamageFlavor('Chainsword', 2, 3, 'Body', 0, 0, true, 10);

      expect(flavor).not.toContain('STR Bonus');
    });

    it('includes apply button when provided', () => {
      const button = '<button>Apply</button>';
      const flavor = ChatMessageBuilder.createDamageFlavor('Bolter', 1, 1, 'Body', 0, 4, false, 0, button);

      expect(flavor).toContain('<button>Apply</button>');
    });
  });

  describe('createRighteousFuryFlavor', () => {
    it('creates confirmed fury flavor', () => {
      const flavor = ChatMessageBuilder.createRighteousFuryFlavor(50, true);

      expect(flavor).toContain('RIGHTEOUS FURY CONFIRMATION');
      expect(flavor).toContain('Target: 50');
      expect(flavor).toContain('CONFIRMED!');
      expect(flavor).toContain('color: green');
    });

    it('creates failed fury flavor', () => {
      const flavor = ChatMessageBuilder.createRighteousFuryFlavor(50, false);

      expect(flavor).toContain('RIGHTEOUS FURY CONFIRMATION');
      expect(flavor).toContain('Failed');
      expect(flavor).toContain('color: red');
    });
  });

  describe('createRighteousFuryDamageFlavor', () => {
    it('creates fury damage flavor with count', () => {
      const flavor = ChatMessageBuilder.createRighteousFuryDamageFlavor(2);

      expect(flavor).toContain('RIGHTEOUS FURY DAMAGE 2');
      expect(flavor).toContain('⚡');
    });
  });

  describe('createRighteousFurySummary', () => {
    it('creates fury summary without button', () => {
      const summary = ChatMessageBuilder.createRighteousFurySummary(3, 'Head', 45);

      expect(summary).toContain('Righteous Fury x3');
      expect(summary).toContain('Location:</strong> Head');
      expect(summary).toContain('Total Damage: 45');
    });

    it('creates fury summary with apply button', () => {
      const button = '<button>Apply</button>';
      const summary = ChatMessageBuilder.createRighteousFurySummary(2, 'Body', 30, button);

      expect(summary).toContain('Righteous Fury x2');
      expect(summary).toContain('<button>Apply</button>');
    });
  });
});
