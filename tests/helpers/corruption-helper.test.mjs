import { jest } from '@jest/globals';
import { CorruptionHelper } from '../../src/module/helpers/corruption/corruption-helper.mjs';
import { CORRUPTION } from '../../src/module/helpers/constants/index.mjs';
import { FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';

describe('CorruptionHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Ensure foundry.utils.escapeHTML is available (needed by Sanitizer)
    if (!global.foundry) {
      global.foundry = {};
    }
    if (!global.foundry.utils) {
      global.foundry.utils = {};
    }
    global.foundry.utils.escapeHTML = jest.fn((text) => {
      if (typeof text !== 'string') return text;
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    });
  });
  describe('getFellowshipPenalty', () => {
    it('returns 0 for corruption below 50', () => {
      expect(CorruptionHelper.getFellowshipPenalty(0)).toBe(0);
      expect(CorruptionHelper.getFellowshipPenalty(25)).toBe(0);
      expect(CorruptionHelper.getFellowshipPenalty(49)).toBe(0);
    });

    it('returns 0 for corruption 50-74', () => {
      // floor((50-50)/25) * -10 = 0 * -10 = 0
      expect(CorruptionHelper.getFellowshipPenalty(50)).toBe(0);
      expect(CorruptionHelper.getFellowshipPenalty(60)).toBe(0);
      // floor((74-50)/25) * -10 = floor(24/25) * -10 = 0 * -10 = 0
      expect(CorruptionHelper.getFellowshipPenalty(74)).toBe(0);
    });

    it('returns -10 for corruption 75-99', () => {
      // floor((75-50)/25) * -10 = floor(25/25) * -10 = 1 * -10 = -10
      expect(CorruptionHelper.getFellowshipPenalty(75)).toBe(-10);
      expect(CorruptionHelper.getFellowshipPenalty(85)).toBe(-10);
      // floor((99-50)/25) * -10 = floor(49/25) * -10 = 1 * -10 = -10
      expect(CorruptionHelper.getFellowshipPenalty(99)).toBe(-10);
    });

    it('returns -20 for corruption 100-124', () => {
      // floor((100-50)/25) * -10 = floor(50/25) * -10 = 2 * -10 = -20
      expect(CorruptionHelper.getFellowshipPenalty(100)).toBe(-20);
      expect(CorruptionHelper.getFellowshipPenalty(110)).toBe(-20);
      // floor((124-50)/25) * -10 = floor(74/25) * -10 = 2 * -10 = -20
      expect(CorruptionHelper.getFellowshipPenalty(124)).toBe(-20);
    });

    it('returns -30 for corruption 125-149', () => {
      // floor((125-50)/25) * -10 = floor(75/25) * -10 = 3 * -10 = -30
      expect(CorruptionHelper.getFellowshipPenalty(125)).toBe(-30);
      expect(CorruptionHelper.getFellowshipPenalty(149)).toBe(-30);
    });

    it('returns -40 for corruption 150+', () => {
      // floor((150-50)/25) * -10 = floor(100/25) * -10 = 4 * -10 = -40
      expect(CorruptionHelper.getFellowshipPenalty(150)).toBe(-40);
      expect(CorruptionHelper.getFellowshipPenalty(175)).toBe(-50);
    });

    it('handles negative corruption (edge case)', () => {
      expect(CorruptionHelper.getFellowshipPenalty(-10)).toBe(0);
    });

    it('uses correct formula: -10 per 25 CP over 50', () => {
      // Formula: Math.floor((corruption - 50) / 25) * -10
      // Test boundary values
      expect(CorruptionHelper.getFellowshipPenalty(50)).toBe(0);   // 0 increments
      expect(CorruptionHelper.getFellowshipPenalty(75)).toBe(-10); // 1 increment
      expect(CorruptionHelper.getFellowshipPenalty(100)).toBe(-20); // 2 increments
      expect(CorruptionHelper.getFellowshipPenalty(125)).toBe(-30); // 3 increments
    });
  });

  // Note: Tests for addCorruption, postCorruptionMessage, handleCharacterRemoval, and other
  // FoundryAdapter-dependent methods are skipped in unit tests. These methods are
  // integration tests that require a real Foundry environment to test properly.
  // Pure helper functions (getFellowshipPenalty) are tested above.

  describe('addCorruption', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          corruption: 45,
          corruptionHistory: []
        }
      };

      // Mock FoundryAdapter methods
      jest.spyOn(FoundryAdapter, 'updateDocument').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'showDialog').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'showNotification').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
    });

    it('updates actor corruption and history', async () => {
      await CorruptionHelper.addCorruption(mockActor, 5, "Test Source");

      expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(
        mockActor,
        expect.objectContaining({
          "system.corruption": 50,
          "system.corruptionHistory": expect.arrayContaining([
            expect.objectContaining({
              points: 5,
              source: "Test Source"
            })
          ])
        })
      );
    });

    it('adds history entry with timestamp and missionId', async () => {
      const beforeTime = Date.now();
      await CorruptionHelper.addCorruption(mockActor, 10, "Warp Exposure", "mission-456");
      const afterTime = Date.now();

      const call = FoundryAdapter.updateDocument.mock.calls[0];
      const history = call[1]["system.corruptionHistory"];
      const entry = history[0];

      expect(entry.points).toBe(10);
      expect(entry.source).toBe("Warp Exposure");
      expect(entry.missionId).toBe("mission-456");
      expect(entry.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(entry.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('posts corruption message to chat', async () => {
      await CorruptionHelper.addCorruption(mockActor, 5, "Test Source");

      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Test Character")
        })
      );
    });

    it('does not trigger removal when below threshold', async () => {
      mockActor.system.corruption = 80;

      await CorruptionHelper.addCorruption(mockActor, 10, "Test Source");

      expect(FoundryAdapter.showDialog).not.toHaveBeenCalled();
    });

    it('triggers character removal at 100 CP', async () => {
      mockActor.system.corruption = 95;

      await CorruptionHelper.addCorruption(mockActor, 5, "Final Taint");

      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Has Fallen")
        })
      );
    });

    it('triggers character removal above 100 CP', async () => {
      mockActor.system.corruption = 98;

      await CorruptionHelper.addCorruption(mockActor, 10, "Massive Corruption");

      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Has Fallen")
        })
      );
    });

    it('handles empty history array', async () => {
      mockActor.system.corruptionHistory = [];

      await CorruptionHelper.addCorruption(mockActor, 5, "First Corruption");

      const call = FoundryAdapter.updateDocument.mock.calls[0];
      const history = call[1]["system.corruptionHistory"];

      expect(history).toHaveLength(1);
      expect(history[0].points).toBe(5);
    });

    it('appends to existing history', async () => {
      mockActor.system.corruptionHistory = [
        { points: 3, source: "Previous", timestamp: 123456, missionId: "" }
      ];

      await CorruptionHelper.addCorruption(mockActor, 5, "New Corruption");

      const call = FoundryAdapter.updateDocument.mock.calls[0];
      const history = call[1]["system.corruptionHistory"];

      expect(history).toHaveLength(2);
      expect(history[0].points).toBe(3);
      expect(history[1].points).toBe(5);
    });

    it('handles null corruptionHistory gracefully', async () => {
      mockActor.system.corruptionHistory = null;

      await CorruptionHelper.addCorruption(mockActor, 5, "Test");

      const call = FoundryAdapter.updateDocument.mock.calls[0];
      const history = call[1]["system.corruptionHistory"];

      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(1);
    });

    it('handles undefined corruption value', async () => {
      mockActor.system.corruption = undefined;

      await CorruptionHelper.addCorruption(mockActor, 5, "Test");

      const call = FoundryAdapter.updateDocument.mock.calls[0];
      expect(call[1]["system.corruption"]).toBe(5);
    });
  });

  describe('postCorruptionMessage', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          corruption: 75
        }
      };

      // Mock FoundryAdapter methods
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
    });

    it('posts message with actor name and points', async () => {
      await CorruptionHelper.postCorruptionMessage(mockActor, 5, "Test Source", 80);

      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Test Character")
        })
      );

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("5 CP");
      expect(call[0].content).toContain("Test Source");
      expect(call[0].content).toContain("80 CP");
    });

    it('includes threshold in message', async () => {
      await CorruptionHelper.postCorruptionMessage(mockActor, 5, "Test Source", 80);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("100"); // CORRUPTION.PURITY_THRESHOLD
    });

    it('shows near threshold warning at 90+ CP', async () => {
      await CorruptionHelper.postCorruptionMessage(mockActor, 5, "Major Corruption", 92);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("Nearing Purity Threshold");
    });

    it('does not show near threshold warning below 90 CP', async () => {
      await CorruptionHelper.postCorruptionMessage(mockActor, 5, "Minor Corruption", 85);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).not.toContain("Nearing Purity Threshold");
    });

    it('shows breach warning at 100+ CP', async () => {
      await CorruptionHelper.postCorruptionMessage(mockActor, 5, "Final Corruption", 100);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("PURITY THRESHOLD BREACHED");
    });

    it('does not show breach warning below threshold', async () => {
      await CorruptionHelper.postCorruptionMessage(mockActor, 5, "Corruption", 99);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).not.toContain("PURITY THRESHOLD BREACHED");
    });

    it('sanitizes actor name and source for XSS', async () => {
      mockActor.name = '<script>alert("XSS")</script>';

      await CorruptionHelper.postCorruptionMessage(
        mockActor,
        5,
        '<img src=x onerror="alert(1)">',
        85
      );

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      // Sanitizer should have escaped the HTML
      expect(call[0].content).not.toContain('<script>');
      expect(call[0].content).not.toContain('<img src=x');
    });
  });

  describe('handleCharacterRemoval', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          corruption: 100,
          insanity: 50
        }
      };

      // Mock FoundryAdapter methods
      jest.spyOn(FoundryAdapter, 'showDialog').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'showNotification').mockResolvedValue(undefined);
    });

    it('shows dialog with character name and reason', async () => {
      await CorruptionHelper.handleCharacterRemoval(mockActor, "corruption");

      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Test Character"),
          content: expect.stringContaining("100 Corruption Points")
        })
      );
    });

    it('shows dialog for insanity reason', async () => {
      await CorruptionHelper.handleCharacterRemoval(mockActor, "insanity");

      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("50 Insanity Points")
        })
      );
    });

    it('includes three dialog buttons', async () => {
      await CorruptionHelper.handleCharacterRemoval(mockActor, "corruption");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      const buttons = call[0].buttons;

      expect(buttons.archive).toBeDefined();
      expect(buttons.keep).toBeDefined();
      expect(buttons.delay).toBeDefined();
    });

    it('sets default button to archive', async () => {
      await CorruptionHelper.handleCharacterRemoval(mockActor, "corruption");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].default).toBe("archive");
    });

    it('sanitizes actor name for XSS', async () => {
      mockActor.name = '<script>alert("XSS")</script>';

      await CorruptionHelper.handleCharacterRemoval(mockActor, "corruption");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).not.toContain('<script>');
    });
  });
});
