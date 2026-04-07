import { jest } from '@jest/globals';
import { flameAttack } from '../../src/module/macros/flame-attack.mjs';
import * as CombatHelperModule from '../../src/module/helpers/combat/combat.mjs';
import * as FireHelperModule from '../../src/module/helpers/combat/fire-helper.mjs';

const CombatHelper = CombatHelperModule.CombatHelper;
const FireHelper = FireHelperModule.FireHelper;

describe('flameAttack', () => {
  let mockDialogElement;
  let mockDialog;
  let mockTargetActor;
  let mockTargetToken;
  let mockRoll;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DOM elements
    mockDialogElement = {
      querySelector: jest.fn((selector) => {
        const elements = {
          '#flameDamage': { value: '1d10+4' },
          '#flamePen': { value: '4' },
          '#flameDmgType': { value: 'Energy' },
          '#flameRange': { value: '20' },
          '#dodgeMod': { value: '0' }
        };
        return elements[selector] || { value: '' };
      })
    };

    mockDialog = {
      element: mockDialogElement
    };

    mockTargetActor = {
      name: 'Test Target',
      type: 'character',
      system: {
        characteristics: {
          ag: { value: 40 }
        },
        receiveBatchDamage: jest.fn().mockResolvedValue({})
      },
      setCondition: jest.fn().mockResolvedValue({})
    };

    mockTargetToken = {
      actor: mockTargetActor
    };

    mockRoll = {
      total: 50,
      evaluate: jest.fn(function() { return Promise.resolve(this); }),
      toMessage: jest.fn().mockResolvedValue({})
    };

    // Roll must be a proper constructor
    global.Roll = jest.fn(function(formula) {
      const roll = {
        formula,
        total: 50,
        evaluate: jest.fn(function() { return Promise.resolve(this); }),
        toMessage: jest.fn().mockResolvedValue({})
      };
      return roll;
    });
    global.ChatMessage = {
      getSpeaker: jest.fn(() => ({ alias: 'GM' })),
      create: jest.fn().mockResolvedValue({})
    };
    global.game = {
      user: {
        targets: {
          first: jest.fn(() => mockTargetToken)
        }
      },
      settings: {
        get: jest.fn(() => 'roll')
      }
    };
    global.ui = {
      notifications: {
        warn: jest.fn()
      }
    };
    global.foundry = {
      applications: {
        api: {
          DialogV2: {
            wait: jest.fn()
          }
        }
      }
    };

    // Mock helper functions
    CombatHelper.determineHitLocation = jest.fn(() => 'Body');
    CombatHelper.applyDamage = jest.fn().mockResolvedValue({});
    FireHelper.resolveDodgeFlameTest = jest.fn(() => ({ success: false, dos: -2 }));
    FireHelper.buildDodgeFlameFlavor = jest.fn(() => '<div>Dodge Failed</div>');
    FireHelper.resolveCatchFireTest = jest.fn(() => ({ success: false }));
    FireHelper.buildCatchFireFlavor = jest.fn(() => '<div>Caught Fire</div>');
  });

  describe('dialog initialization', () => {
    it('opens dialog with flame attack options', async () => {
      const waitMock = jest.fn().mockResolvedValue(null);
      global.foundry.applications.api.DialogV2.wait = waitMock;

      await flameAttack();

      expect(waitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          window: { title: '🔥 Flame Attack' },
          content: expect.stringContaining('Damage:'),
          buttons: expect.arrayContaining([
            expect.objectContaining({ label: '🔥 Burn', action: 'burn' }),
            expect.objectContaining({ label: 'Cancel', action: 'cancel' })
          ])
        })
      );
    });

    it('includes damage, penetration, damage type, and range inputs', async () => {
      const waitMock = jest.fn().mockResolvedValue(null);
      global.foundry.applications.api.DialogV2.wait = waitMock;

      await flameAttack();

      const call = waitMock.mock.calls[0][0];
      expect(call.content).toContain('flameDamage');
      expect(call.content).toContain('flamePen');
      expect(call.content).toContain('flameDmgType');
      expect(call.content).toContain('flameRange');
    });
  });

  describe('input validation', () => {
    it('warns when no damage formula provided', async () => {
      mockDialogElement.querySelector = jest.fn((selector) => {
        if (selector === '#flameDamage') return { value: '' };
        return { value: '0' };
      });

      const waitMock = jest.fn(async (config) => {
        const burnButton = config.buttons.find(b => b.action === 'burn');
        await burnButton.callback({}, {}, mockDialog);
      });
      global.foundry.applications.api.DialogV2.wait = waitMock;

      await flameAttack();

      expect(global.ui.notifications.warn).toHaveBeenCalledWith('Enter a damage formula.');
    });

    it('warns when no target selected', async () => {
      global.game.user.targets.first = jest.fn(() => null);

      const waitMock = jest.fn(async (config) => {
        const burnButton = config.buttons.find(b => b.action === 'burn');
        await burnButton.callback({}, {}, mockDialog);
      });
      global.foundry.applications.api.DialogV2.wait = waitMock;

      await flameAttack();

      expect(global.ui.notifications.warn).toHaveBeenCalledWith('Target a token before clicking Burn.');
    });

    it('warns when target has no actor', async () => {
      global.game.user.targets.first = jest.fn(() => ({ actor: null }));

      const waitMock = jest.fn(async (config) => {
        const burnButton = config.buttons.find(b => b.action === 'burn');
        await burnButton.callback({}, {}, mockDialog);
      });
      global.foundry.applications.api.DialogV2.wait = waitMock;

      await flameAttack();

      expect(global.ui.notifications.warn).toHaveBeenCalledWith('Target a token before clicking Burn.');
    });
  });

  describe('horde flame attack workflow', () => {
    it('identifies horde targets correctly', async () => {
      mockTargetActor.type = 'horde';

      const waitMock = jest.fn().mockResolvedValue(null);
      global.foundry.applications.api.DialogV2.wait = waitMock;

      await flameAttack();

      expect(waitMock).toHaveBeenCalled();
      const config = waitMock.mock.calls[0][0];
      expect(config.window.title).toBe('🔥 Flame Attack');
    });
  });

  describe('individual flame attack workflow', () => {
    it('identifies individual targets correctly', async () => {
      mockTargetActor.type = 'character';

      const waitMock = jest.fn().mockResolvedValue(null);
      global.foundry.applications.api.DialogV2.wait = waitMock;

      await flameAttack();

      expect(waitMock).toHaveBeenCalled();
      const config = waitMock.mock.calls[0][0];
      expect(config.window.title).toBe('🔥 Flame Attack');
    });
  });

});
