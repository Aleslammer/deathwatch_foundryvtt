import { jest } from '@jest/globals';
import { AnimationHook } from '../../src/module/hooks/animation-hook.mjs';

describe('AnimationHook', () => {
  let mockMessage;
  let mockSourceToken;
  let mockTargetToken;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSourceToken = { id: 'source1', x: 100, y: 100 };
    mockTargetToken = { id: 'target1', x: 200, y: 200 };

    // Mock DOMParser
    global.DOMParser = class {
      parseFromString(content) {
        return {
          querySelector: (selector) => {
            if (selector === '.dw-attack-roll' && content.includes('dw-attack-roll')) {
              // Extract data attributes from content
              const actorIdMatch = content.match(/data-actor-id="([^"]*)"/);
              const itemIdMatch = content.match(/data-item-id="([^"]*)"/);
              const roundsFiredMatch = content.match(/data-rounds-fired="([^"]*)"/);
              const animationKeyMatch = content.match(/data-animation-key="([^"]*)"/);

              if (actorIdMatch) {
                return {
                  dataset: {
                    actorId: actorIdMatch[1],
                    itemId: itemIdMatch ? itemIdMatch[1] : '',
                    roundsFired: roundsFiredMatch ? roundsFiredMatch[1] : '1',
                    animationKey: animationKeyMatch ? animationKeyMatch[1] : ''
                  }
                };
              }
            }
            return null;
          }
        };
      }
    };

    mockMessage = {
      content: `<div class="dw-attack-roll"
        data-actor-id="actor123"
        data-item-id="item456"
        data-item-uuid="Actor.actor123.Item.item456"
        data-rounds-fired="3"
        data-fire-mode="semi"
        data-animation-key=""
        data-damage-type="Explosive"
        data-weapon-class="basic">
        <div class="attack-flavor">Test Attack</div>
      </div>`,
      rolls: [{ total: 42 }]
    };

    global.game = {
      modules: {
        get: jest.fn()
      },
      actors: {
        get: jest.fn()
      },
      user: {
        targets: {
          first: jest.fn()
        }
      }
    };

    global.canvas = {
      tokens: {
        get: jest.fn()
      }
    };

    global.Sequence = jest.fn();
  });

  describe('register', () => {
    it('registers createChatMessage hook', () => {
      const mockHooksOn = jest.fn();
      global.Hooks = { on: mockHooksOn };

      AnimationHook.register();

      expect(mockHooksOn).toHaveBeenCalledWith(
        'createChatMessage',
        expect.any(Function)
      );
    });
  });

  describe('onCreateChatMessage', () => {
    it('does nothing if animation libraries not available', async () => {
      global.game.modules.get = jest.fn(() => ({ active: false }));

      await AnimationHook.onCreateChatMessage(mockMessage);

      // Should exit early, no token lookups
      expect(global.canvas.tokens.get).not.toHaveBeenCalled();
    });

    it('does nothing if message has no dw-attack-roll div', async () => {
      global.game.modules.get = jest.fn(() => ({ active: true }));
      mockMessage.content = '<div>Regular message</div>';

      await AnimationHook.onCreateChatMessage(mockMessage);

      expect(global.canvas.tokens.get).not.toHaveBeenCalled();
    });

    it('does nothing if no source token found', async () => {
      global.game.modules.get = jest.fn(() => ({ active: true }));
      global.game.actors.get = jest.fn(() => ({
        getActiveTokens: jest.fn(() => [])
      }));

      await AnimationHook.onCreateChatMessage(mockMessage);

      expect(global.Sequence).not.toHaveBeenCalled();
    });

    it('does nothing if no target token selected', async () => {
      global.game.modules.get = jest.fn(() => ({ active: true }));
      global.game.actors.get = jest.fn(() => ({
        getActiveTokens: jest.fn(() => [mockSourceToken])
      }));
      global.game.user.targets.first = jest.fn(() => null);

      await AnimationHook.onCreateChatMessage(mockMessage);

      expect(global.Sequence).not.toHaveBeenCalled();
    });

    it('extracts metadata and plays animation', async () => {
      global.game.modules.get = jest.fn((id) => {
        if (id === 'sequencer') return { active: true };
        if (id === 'jb2a_patreon') return { active: true };
        return null;
      });

      const mockActor = {
        getActiveTokens: jest.fn(() => [mockSourceToken]),
        items: {
          get: jest.fn(() => ({
            name: 'Bolter',
            system: { dmgType: 'Explosive' }
          }))
        }
      };

      global.game.actors.get = jest.fn(() => mockActor);
      global.game.user.targets.first = jest.fn(() => mockTargetToken);

      const mockSequence = {
        effect: jest.fn().mockReturnValue({
          file: jest.fn().mockReturnThis(),
          atLocation: jest.fn().mockReturnThis(),
          stretchTo: jest.fn().mockReturnThis(),
          repeats: jest.fn().mockReturnValue(null)
        }),
        play: jest.fn()
      };

      global.Sequence = jest.fn(() => mockSequence);

      await AnimationHook.onCreateChatMessage(mockMessage);

      expect(global.game.actors.get).toHaveBeenCalledWith('actor123');
      expect(mockActor.items.get).toHaveBeenCalledWith('item456');
      expect(mockSequence.play).toHaveBeenCalled();
    });

    it('uses animationKey when provided', async () => {
      mockMessage.content = `<div class="dw-attack-roll"
        data-actor-id="actor123"
        data-item-id="item456"
        data-animation-key="plasma"
        data-damage-type="Explosive">
      </div>`;

      global.game.modules.get = jest.fn((id) => {
        if (id === 'sequencer') return { active: true };
        if (id === 'jb2a_patreon') return { active: true };
        return null;
      });

      const mockActor = {
        getActiveTokens: jest.fn(() => [mockSourceToken]),
        items: {
          get: jest.fn(() => ({
            name: 'Bolter',
            system: { dmgType: 'Explosive' }
          }))
        }
      };

      global.game.actors.get = jest.fn(() => mockActor);
      global.game.user.targets.first = jest.fn(() => mockTargetToken);

      const mockEffect = {
        file: jest.fn().mockReturnThis(),
        atLocation: jest.fn().mockReturnThis(),
        stretchTo: jest.fn().mockReturnThis(),
        repeats: jest.fn().mockReturnValue(null)
      };

      const mockSequence = {
        effect: jest.fn(() => mockEffect),
        play: jest.fn()
      };

      global.Sequence = jest.fn(() => mockSequence);

      await AnimationHook.onCreateChatMessage(mockMessage);

      // Plasma config has specific file
      expect(mockEffect.file).toHaveBeenCalledWith('jb2a.lasershot.blue');
    });
  });
});
