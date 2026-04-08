import { jest } from '@jest/globals';
import { InsanityHelper } from '../../src/module/helpers/insanity/insanity-helper.mjs';
import { INSANITY_TRACK } from '../../src/module/helpers/constants/index.mjs';

describe('InsanityHelper', () => {
  describe('getTrackLevel', () => {
    it('returns 0 for insanity 0-30', () => {
      expect(InsanityHelper.getTrackLevel(0)).toBe(0);
      expect(InsanityHelper.getTrackLevel(15)).toBe(0);
      expect(InsanityHelper.getTrackLevel(30)).toBe(0);
    });

    it('returns 1 for insanity 31-60', () => {
      expect(InsanityHelper.getTrackLevel(31)).toBe(1);
      expect(InsanityHelper.getTrackLevel(45)).toBe(1);
      expect(InsanityHelper.getTrackLevel(60)).toBe(1);
    });

    it('returns 2 for insanity 61-90', () => {
      expect(InsanityHelper.getTrackLevel(61)).toBe(2);
      expect(InsanityHelper.getTrackLevel(75)).toBe(2);
      expect(InsanityHelper.getTrackLevel(90)).toBe(2);
    });

    it('returns 3 for insanity 91-99', () => {
      expect(InsanityHelper.getTrackLevel(91)).toBe(3);
      expect(InsanityHelper.getTrackLevel(95)).toBe(3);
      expect(InsanityHelper.getTrackLevel(99)).toBe(3);
    });

    it('returns 0 for insanity 100+ (removed from play)', () => {
      expect(InsanityHelper.getTrackLevel(100)).toBe(0);
      expect(InsanityHelper.getTrackLevel(150)).toBe(0);
    });

    it('handles negative insanity (edge case)', () => {
      expect(InsanityHelper.getTrackLevel(-10)).toBe(0);
    });

    it('matches INSANITY_TRACK constants', () => {
      expect(InsanityHelper.getTrackLevel(INSANITY_TRACK.THRESHOLD_1)).toBe(0);     // 30 is level 0
      expect(InsanityHelper.getTrackLevel(INSANITY_TRACK.THRESHOLD_1 + 1)).toBe(1); // 31 is level 1
      expect(InsanityHelper.getTrackLevel(INSANITY_TRACK.THRESHOLD_2)).toBe(1);     // 60 is level 1
      expect(InsanityHelper.getTrackLevel(INSANITY_TRACK.THRESHOLD_2 + 1)).toBe(2); // 61 is level 2
      expect(InsanityHelper.getTrackLevel(INSANITY_TRACK.THRESHOLD_3)).toBe(2);     // 90 is level 2
      expect(InsanityHelper.getTrackLevel(INSANITY_TRACK.THRESHOLD_3 + 1)).toBe(3); // 91 is level 3
      expect(InsanityHelper.getTrackLevel(INSANITY_TRACK.REMOVAL - 1)).toBe(3);     // 99 is level 3
      expect(InsanityHelper.getTrackLevel(INSANITY_TRACK.REMOVAL)).toBe(0);         // 100 is removed
    });
  });

  describe('getTraumaModifier', () => {
    it('returns 0 for track level 0 (0-30 IP)', () => {
      expect(InsanityHelper.getTraumaModifier(0)).toBe(0);
      expect(InsanityHelper.getTraumaModifier(15)).toBe(0);
      expect(InsanityHelper.getTraumaModifier(30)).toBe(0);
    });

    it('returns -10 for track level 1 (31-60 IP)', () => {
      expect(InsanityHelper.getTraumaModifier(31)).toBe(-10);
      expect(InsanityHelper.getTraumaModifier(45)).toBe(-10);
      expect(InsanityHelper.getTraumaModifier(60)).toBe(-10);
    });

    it('returns -20 for track level 2 (61-90 IP)', () => {
      expect(InsanityHelper.getTraumaModifier(61)).toBe(-20);
      expect(InsanityHelper.getTraumaModifier(75)).toBe(-20);
      expect(InsanityHelper.getTraumaModifier(90)).toBe(-20);
    });

    it('returns -30 for track level 3 (91-99 IP)', () => {
      expect(InsanityHelper.getTraumaModifier(91)).toBe(-30);
      expect(InsanityHelper.getTraumaModifier(95)).toBe(-30);
      expect(InsanityHelper.getTraumaModifier(99)).toBe(-30);
    });

    it('returns 0 for insanity 100+ (removed from play)', () => {
      expect(InsanityHelper.getTraumaModifier(100)).toBe(0);
      expect(InsanityHelper.getTraumaModifier(150)).toBe(0);
    });

    it('matches INSANITY_TRACK.MODIFIERS constants', () => {
      expect(InsanityHelper.getTraumaModifier(0)).toBe(INSANITY_TRACK.MODIFIERS.LEVEL_0);
      expect(InsanityHelper.getTraumaModifier(45)).toBe(INSANITY_TRACK.MODIFIERS.LEVEL_1);
      expect(InsanityHelper.getTraumaModifier(75)).toBe(INSANITY_TRACK.MODIFIERS.LEVEL_2);
      expect(InsanityHelper.getTraumaModifier(95)).toBe(INSANITY_TRACK.MODIFIERS.LEVEL_3);
    });

    it('handles negative insanity (edge case)', () => {
      expect(InsanityHelper.getTraumaModifier(-10)).toBe(0);
    });
  });

  // Note: Tests for addInsanity, performInsanityTest, acquireBattleTrauma, and other
  // FoundryAdapter-dependent methods are skipped in unit tests. These methods are
  // integration tests that require a real Foundry environment to test properly.
  // Pure helper functions (getTrackLevel, getTraumaModifier) are tested above.

  describe.skip('addInsanity', () => {
    let mockActor;
    let FoundryAdapterMock;

    beforeEach(() => {
      // Create mock actor
      mockActor = {
        name: "Test Character",
        system: {
          insanity: 25,
          insanityHistory: [],
          lastInsanityTestAt: 0,
          characteristics: {
            wil: { value: 40 }
          }
        }
      };

      // Mock FoundryAdapter
      FoundryAdapterMock = {
        updateDocument: jest.fn(),
        createChatMessage: jest.fn(),
        showDialog: jest.fn(),
        showNotification: jest.fn(),
        evaluateRoll: jest.fn(),
        sendRollToChat: jest.fn(),
        getChatSpeaker: jest.fn(() => ({}))
      };

      // Replace FoundryAdapter module in InsanityHelper
      jest.unstable_mockModule('../../src/module/helpers/foundry-adapter.mjs', () => ({
        FoundryAdapter: FoundryAdapterMock
      }));
    });

    it('updates actor insanity and history', async () => {
      await InsanityHelper.addInsanity(mockActor, 5, "Test Source");

      expect(FoundryAdapterMock.updateDocument).toHaveBeenCalledWith(
        mockActor,
        expect.objectContaining({
          "system.insanity": 30,
          "system.insanityHistory": expect.arrayContaining([
            expect.objectContaining({
              points: 5,
              source: "Test Source",
              testRolled: false
            })
          ])
        })
      );
    });

    it('adds history entry with timestamp and missionId', async () => {
      const beforeTime = Date.now();
      await InsanityHelper.addInsanity(mockActor, 5, "Test Source", "mission-123");
      const afterTime = Date.now();

      const call = FoundryAdapterMock.updateDocument.mock.calls[0];
      const history = call[1]["system.insanityHistory"];
      const entry = history[0];

      expect(entry.points).toBe(5);
      expect(entry.source).toBe("Test Source");
      expect(entry.missionId).toBe("mission-123");
      expect(entry.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(entry.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('posts insanity message to chat', async () => {
      await InsanityHelper.addInsanity(mockActor, 5, "Test Source");

      expect(FoundryAdapterMock.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Test Character")
        })
      );
    });

    it('does not trigger insanity test when not crossing 10-point boundary', async () => {
      mockActor.system.insanity = 25; // Adding 4 → 29 (no boundary crossed)

      await InsanityHelper.addInsanity(mockActor, 4, "Test Source");

      expect(FoundryAdapterMock.showDialog).not.toHaveBeenCalled();
    });

    it('triggers insanity test when crossing 10-point boundary', async () => {
      mockActor.system.insanity = 28; // Adding 5 → 33 (crosses 30 boundary)

      await InsanityHelper.addInsanity(mockActor, 5, "Test Source");

      // Should prompt for insanity test
      expect(FoundryAdapterMock.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Insanity Test Required"
        })
      );
    });

    it('does not trigger duplicate test for same threshold', async () => {
      mockActor.system.insanity = 35;
      mockActor.system.lastInsanityTestAt = 3; // Already tested at threshold 3

      await InsanityHelper.addInsanity(mockActor, 2, "Test Source");

      expect(FoundryAdapterMock.showDialog).not.toHaveBeenCalled();
    });

    it('triggers character removal at 100 IP', async () => {
      mockActor.system.insanity = 95;

      await InsanityHelper.addInsanity(mockActor, 5, "Final Trauma");

      expect(FoundryAdapterMock.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Has Fallen")
        })
      );
    });
  });

  describe.skip('rollInsanityTest', () => {
    let mockActor;
    let FoundryAdapterMock;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          insanity: 45,
          insanityHistory: [
            {
              points: 5,
              source: "Test",
              testRolled: false,
              testResult: "",
              testModifiers: 0
            }
          ],
          characteristics: {
            wil: { value: 40 }
          }
        }
      };

      FoundryAdapterMock = {
        updateDocument: jest.fn(),
        evaluateRoll: jest.fn(async () => ({ total: 35 })),
        sendRollToChat: jest.fn(),
        getChatSpeaker: jest.fn(() => ({}))
      };

      jest.unstable_mockModule('../../src/module/helpers/foundry-adapter.mjs', () => ({
        FoundryAdapter: FoundryAdapterMock
      }));
    });

    it('updates history with test result on success', async () => {
      FoundryAdapterMock.evaluateRoll.mockResolvedValue({ total: 25 }); // Success (40 target, 25 roll)

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: -10,
        situationalMod: 0,
        finalTarget: 30,
        threshold: 4
      });

      expect(FoundryAdapterMock.updateDocument).toHaveBeenCalledWith(
        mockActor,
        expect.objectContaining({
          "system.lastInsanityTestAt": 4,
          "system.insanityHistory": expect.arrayContaining([
            expect.objectContaining({
              testRolled: true,
              testResult: expect.stringContaining("Success")
            })
          ])
        })
      );
    });

    it('updates history with test result on failure', async () => {
      FoundryAdapterMock.evaluateRoll.mockResolvedValue({ total: 45 }); // Failure (30 target, 45 roll)

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: -10,
        situationalMod: 0,
        finalTarget: 30,
        threshold: 4
      });

      const call = FoundryAdapterMock.updateDocument.mock.calls[0];
      const history = call[1]["system.insanityHistory"];

      expect(history[0].testRolled).toBe(true);
      expect(history[0].testResult).toContain("Failure");
    });

    it('posts test result to chat', async () => {
      FoundryAdapterMock.evaluateRoll.mockResolvedValue({ total: 25 });

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: -10,
        situationalMod: 5,
        finalTarget: 35,
        threshold: 3
      });

      expect(FoundryAdapterMock.sendRollToChat).toHaveBeenCalled();
    });

    it('includes modifier breakdown in chat message', async () => {
      FoundryAdapterMock.evaluateRoll.mockResolvedValue({ total: 25 });

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: -10,
        situationalMod: 5,
        finalTarget: 35,
        threshold: 3
      });

      const call = FoundryAdapterMock.sendRollToChat.mock.calls[0];
      const flavor = call[1].flavor;

      expect(flavor).toContain("Base WP: 40");
      expect(flavor).toContain("Track Modifier: -10");
      expect(flavor).toContain("Situational: +5");
      expect(flavor).toContain("Target: 35");
    });

    it('omits zero modifiers from breakdown', async () => {
      FoundryAdapterMock.evaluateRoll.mockResolvedValue({ total: 25 });

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: 0,
        situationalMod: 0,
        finalTarget: 40,
        threshold: 2
      });

      const call = FoundryAdapterMock.sendRollToChat.mock.calls[0];
      const flavor = call[1].flavor;

      expect(flavor).toContain("Base WP: 40");
      expect(flavor).not.toContain("Track Modifier");
      expect(flavor).not.toContain("Situational");
    });
  });

  describe.skip('postInsanityMessage', () => {
    let mockActor;
    let FoundryAdapterMock;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          insanity: 45
        }
      };

      FoundryAdapterMock = {
        createChatMessage: jest.fn(),
        getChatSpeaker: jest.fn(() => ({}))
      };

      jest.unstable_mockModule('../../src/module/helpers/foundry-adapter.mjs', () => ({
        FoundryAdapter: FoundryAdapterMock
      }));
    });

    it('posts message with actor name and points', async () => {
      await InsanityHelper.postInsanityMessage(mockActor, 5, "Test Source", 50);

      expect(FoundryAdapterMock.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Test Character")
        })
      );

      const call = FoundryAdapterMock.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("5 IP");
      expect(call[0].content).toContain("Test Source");
      expect(call[0].content).toContain("50 IP");
    });

    it('includes track level in message', async () => {
      await InsanityHelper.postInsanityMessage(mockActor, 5, "Test Source", 50);

      const call = FoundryAdapterMock.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("Track Level 1");
    });

    it('shows test required warning when crossing threshold', async () => {
      await InsanityHelper.postInsanityMessage(mockActor, 8, "Major Trauma", 38);

      const call = FoundryAdapterMock.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("INSANITY TEST REQUIRED");
    });

    it('does not show test warning when not crossing threshold', async () => {
      await InsanityHelper.postInsanityMessage(mockActor, 3, "Minor Trauma", 28);

      const call = FoundryAdapterMock.createChatMessage.mock.calls[0];
      expect(call[0].content).not.toContain("INSANITY TEST REQUIRED");
    });
  });
});
