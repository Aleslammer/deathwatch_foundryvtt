import { jest } from '@jest/globals';
import { InsanityHelper } from '../../src/module/helpers/insanity/insanity-helper.mjs';
import { INSANITY_TRACK, BATTLE_TRAUMA, INSANITY_REDUCTION } from '../../src/module/helpers/constants/index.mjs';
import { FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';

describe('InsanityHelper', () => {
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

    // Mock global game object for RollTable tests
    global.game = {
      ...global.game,
      packs: {
        get: jest.fn()
      },
      tables: {
        getName: jest.fn()
      }
    };

    // Mock global fromUuid for compendium item resolution
    global.fromUuid = jest.fn();
  });
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

  describe('addInsanity', () => {
    let mockActor;

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

      // Mock FoundryAdapter methods
      jest.spyOn(FoundryAdapter, 'updateDocument').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'showDialog').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'showNotification').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'evaluateRoll').mockResolvedValue({ total: 50 });
      jest.spyOn(FoundryAdapter, 'sendRollToChat').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
    });

    it('updates actor insanity and history', async () => {
      await InsanityHelper.addInsanity(mockActor, 5, "Test Source");

      expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(
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

      const call = FoundryAdapter.updateDocument.mock.calls[0];
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

      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Test Character")
        })
      );
    });

    it('does not trigger insanity test when not crossing 10-point boundary', async () => {
      mockActor.system.insanity = 25; // Adding 4 → 29 (no boundary crossed)

      await InsanityHelper.addInsanity(mockActor, 4, "Test Source");

      expect(FoundryAdapter.showDialog).not.toHaveBeenCalled();
    });

    it('triggers insanity test when crossing 10-point boundary', async () => {
      mockActor.system.insanity = 28; // Adding 5 → 33 (crosses 30 boundary)

      await InsanityHelper.addInsanity(mockActor, 5, "Test Source");

      // Should prompt for insanity test
      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Insanity Test Required"
        })
      );
    });

    it('does not trigger duplicate test for same threshold', async () => {
      mockActor.system.insanity = 35;
      mockActor.system.lastInsanityTestAt = 3; // Already tested at threshold 3

      await InsanityHelper.addInsanity(mockActor, 2, "Test Source");

      expect(FoundryAdapter.showDialog).not.toHaveBeenCalled();
    });

    it('triggers character removal at 100 IP', async () => {
      mockActor.system.insanity = 95;

      await InsanityHelper.addInsanity(mockActor, 5, "Final Trauma");

      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Has Fallen")
        })
      );
    });
  });

  describe('rollInsanityTest', () => {
    let mockActor;

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
        },
        items: {
          filter: jest.fn(() => [])
        }
      };

      // Mock FoundryAdapter methods
      jest.spyOn(FoundryAdapter, 'updateDocument').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'evaluateRoll').mockResolvedValue({ total: 35 });
      jest.spyOn(FoundryAdapter, 'sendRollToChat').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
    });

    it('updates history with test result on success', async () => {
      FoundryAdapter.evaluateRoll.mockResolvedValue({ total: 25 }); // Success (40 target, 25 roll)

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: -10,
        situationalMod: 0,
        finalTarget: 30,
        threshold: 4
      });

      expect(FoundryAdapter.updateDocument).toHaveBeenCalledWith(
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
      FoundryAdapter.evaluateRoll.mockResolvedValue({ total: 45 }); // Failure (30 target, 45 roll)

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: -10,
        situationalMod: 0,
        finalTarget: 30,
        threshold: 4
      });

      const call = FoundryAdapter.updateDocument.mock.calls[0];
      const history = call[1]["system.insanityHistory"];

      expect(history[0].testRolled).toBe(true);
      expect(history[0].testResult).toContain("Failure");
    });

    it('posts test result to chat', async () => {
      FoundryAdapter.evaluateRoll.mockResolvedValue({ total: 25 });

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: -10,
        situationalMod: 5,
        finalTarget: 35,
        threshold: 3
      });

      expect(FoundryAdapter.sendRollToChat).toHaveBeenCalled();
    });

    it('includes modifier breakdown in chat message', async () => {
      FoundryAdapter.evaluateRoll.mockResolvedValue({ total: 25 });

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: -10,
        situationalMod: 5,
        finalTarget: 35,
        threshold: 3
      });

      const call = FoundryAdapter.sendRollToChat.mock.calls[0];
      const flavor = call[1].flavor;

      expect(flavor).toContain("Base WP: 40");
      expect(flavor).toContain("Track Modifier: -10");
      expect(flavor).toContain("Situational: +5");
      expect(flavor).toContain("Target: 35");
    });

    it('omits zero modifiers from breakdown', async () => {
      FoundryAdapter.evaluateRoll.mockResolvedValue({ total: 25 });

      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 40,
        trackModifier: 0,
        situationalMod: 0,
        finalTarget: 40,
        threshold: 2
      });

      const call = FoundryAdapter.sendRollToChat.mock.calls[0];
      const flavor = call[1].flavor;

      expect(flavor).toContain("Base WP: 40");
      expect(flavor).not.toContain("Track Modifier");
      expect(flavor).not.toContain("Situational");
    });
  });

  describe('postInsanityMessage', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          insanity: 45
        }
      };

      // Mock FoundryAdapter methods
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
    });

    it('posts message with actor name and points', async () => {
      await InsanityHelper.postInsanityMessage(mockActor, 5, "Test Source", 50);

      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Test Character")
        })
      );

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("5 IP");
      expect(call[0].content).toContain("Test Source");
      expect(call[0].content).toContain("50 IP");
    });

    it('includes track level in message', async () => {
      await InsanityHelper.postInsanityMessage(mockActor, 5, "Test Source", 50);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("Track Level 1");
    });

    it('shows test required warning when crossing threshold', async () => {
      // oldTotal=25, adding 8 points → newTotal=33 (crosses 30 threshold)
      // needsTest = 33 >= 10 && (33 % 10 = 3) < 8 = true
      await InsanityHelper.postInsanityMessage(mockActor, 8, "Major Trauma", 33);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("TEST REQUIRED");
    });

    it('does not show test warning when not crossing threshold', async () => {
      await InsanityHelper.postInsanityMessage(mockActor, 3, "Minor Trauma", 28);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).not.toContain("TEST REQUIRED");
    });
  });

  /* -------------------------------------------- */
  /*  promptInsanityTest                          */
  /* -------------------------------------------- */

  describe('promptInsanityTest', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          insanity: 45,
          characteristics: {
            wil: { value: 40 }
          }
        }
      };

      jest.spyOn(FoundryAdapter, 'showDialog').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'showNotification').mockResolvedValue(undefined);
    });

    it('shows dialog with correct title', async () => {
      await InsanityHelper.promptInsanityTest(mockActor, 4);

      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Insanity Test Required"
        })
      );
    });

    it('includes actor name and current insanity', async () => {
      await InsanityHelper.promptInsanityTest(mockActor, 4);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain("Test Character");
      expect(call[0].content).toContain("45");
    });

    it('shows track level and modifier', async () => {
      mockActor.system.insanity = 45; // Track level 1, modifier -10

      await InsanityHelper.promptInsanityTest(mockActor, 4);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain("Track Level 1");
      expect(call[0].content).toContain("-10");
    });

    it('calculates correct base target number', async () => {
      mockActor.system.insanity = 45; // Track level 1, modifier -10
      mockActor.system.characteristics.wil.value = 50;

      await InsanityHelper.promptInsanityTest(mockActor, 4);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      // Base target = WP 50 + modifier -10 = 40
      expect(call[0].content).toContain("40");
    });

    it('includes roll and later buttons', async () => {
      await InsanityHelper.promptInsanityTest(mockActor, 4);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].buttons.roll).toBeDefined();
      expect(call[0].buttons.later).toBeDefined();
    });

    it('sets default button to roll', async () => {
      await InsanityHelper.promptInsanityTest(mockActor, 4);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].default).toBe("roll");
    });

    it('includes render callback for dynamic updates', async () => {
      await InsanityHelper.promptInsanityTest(mockActor, 4);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].render).toBeDefined();
      expect(typeof call[0].render).toBe('function');
    });

    it('sanitizes actor name for XSS', async () => {
      mockActor.name = '<script>alert("XSS")</script>';

      await InsanityHelper.promptInsanityTest(mockActor, 4);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).not.toContain('<script>');
    });
  });

  /* -------------------------------------------- */
  /*  rollBattleTrauma                            */
  /* -------------------------------------------- */

  describe('rollBattleTrauma', () => {
    let mockActor, mockTable, mockTablePack, mockTraumaItem;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        items: {
          filter: jest.fn(() => [])
        }
      };

      mockTraumaItem = {
        name: "Battle Trauma Test",
        uuid: "Compendium.deathwatch.battle-traumas.bt-000000000001",
        system: {
          key: "trauma-test",
          description: "Test trauma description"
        },
        toObject: jest.fn(() => ({ name: "Battle Trauma Test" }))
      };

      mockTable = {
        name: "Battle Trauma Table",
        draw: jest.fn(async () => ({
          results: [{
            name: "Battle Trauma Test",
            description: "Compendium.deathwatch.battle-traumas.bt-000000000001",
            type: "document",
            uuid: "result-uuid"
          }]
        }))
      };

      mockTablePack = {
        index: {
          find: jest.fn(() => ({ _id: "table-123", name: "Battle Trauma Table" }))
        },
        getDocument: jest.fn(async () => mockTable)
      };

      global.game.packs.get.mockReturnValue(mockTablePack);
      global.fromUuid.mockResolvedValue(mockTraumaItem);

      jest.spyOn(FoundryAdapter, 'createEmbeddedDocuments').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
      jest.spyOn(FoundryAdapter, 'showNotification').mockResolvedValue(undefined);
    });

    it('finds Battle Trauma Table from compendium', async () => {
      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(global.game.packs.get).toHaveBeenCalledWith("deathwatch.tables");
      expect(mockTablePack.index.find).toHaveBeenCalled();
      expect(mockTablePack.getDocument).toHaveBeenCalledWith("table-123");
    });

    it('falls back to world tables if compendium not found', async () => {
      global.game.packs.get.mockReturnValue(null);
      global.game.tables.getName.mockReturnValue(mockTable);

      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(global.game.tables.getName).toHaveBeenCalledWith("Battle Trauma Table");
    });

    it('shows error if table not found', async () => {
      global.game.packs.get.mockReturnValue(null);
      global.game.tables.getName.mockReturnValue(null);

      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith(
        "error",
        expect.stringContaining("Battle Trauma Table not found")
      );
    });

    it('draws from table without displaying chat', async () => {
      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(mockTable.draw).toHaveBeenCalledWith({ displayChat: false });
    });

    it('resolves trauma item from compendium UUID', async () => {
      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(global.fromUuid).toHaveBeenCalledWith("Compendium.deathwatch.battle-traumas.bt-000000000001");
    });

    it('adds trauma item to actor', async () => {
      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(FoundryAdapter.createEmbeddedDocuments).toHaveBeenCalledWith(
        mockActor,
        "Item",
        [{ name: "Battle Trauma Test" }]
      );
    });

    it('posts trauma details to chat', async () => {
      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(FoundryAdapter.createChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Test Character")
        })
      );

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).toContain("Battle Trauma Test");
    });

    it('rerolls on duplicate trauma', async () => {
      // Actor already has this trauma
      mockActor.items.filter.mockReturnValue([
        { system: { key: "trauma-test" } }
      ]);

      // First roll returns duplicate, second returns different trauma
      const differentTrauma = {
        ...mockTraumaItem,
        name: "Different Trauma",
        system: { key: "trauma-different", description: "" }
      };

      let callCount = 0;
      mockTable.draw.mockImplementation(async () => {
        callCount++;
        return {
          results: [{
            name: callCount === 1 ? "Battle Trauma Test" : "Different Trauma",
            description: callCount === 1
              ? "Compendium.deathwatch.battle-traumas.bt-000000000001"
              : "Compendium.deathwatch.battle-traumas.bt-000000000002",
            type: "document"
          }]
        };
      });

      global.fromUuid.mockImplementation(async (uuid) => {
        return uuid.includes("bt-000000000001") ? mockTraumaItem : differentTrauma;
      });

      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(mockTable.draw).toHaveBeenCalledTimes(2);
      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith(
        "info",
        expect.stringContaining("already has")
      );
    });

    it('stops rerolling after max attempts', async () => {
      // Actor has all traumas
      const existingTraumas = Array.from({ length: 20 }, (_, i) => ({
        system: { key: `trauma-${i}` }
      }));
      mockActor.items.filter.mockReturnValue(existingTraumas);

      // Always return duplicate
      mockTraumaItem.system.key = "trauma-0";

      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(mockTable.draw).toHaveBeenCalledTimes(BATTLE_TRAUMA.MAX_REROLL_ATTEMPTS);
      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith(
        "warn",
        expect.stringContaining("has all possible battle traumas")
      );
      expect(FoundryAdapter.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it('shows error if trauma item cannot be resolved', async () => {
      global.fromUuid.mockResolvedValue(null);

      await InsanityHelper.rollBattleTrauma(mockActor);

      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith(
        "error",
        expect.stringContaining("Could not find trauma item")
      );
      expect(FoundryAdapter.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it('sanitizes actor and trauma names for XSS', async () => {
      mockActor.name = '<script>alert("XSS")</script>';
      mockTraumaItem.name = '<img src=x onerror="alert(1)">';

      await InsanityHelper.rollBattleTrauma(mockActor);

      const call = FoundryAdapter.createChatMessage.mock.calls[0];
      expect(call[0].content).not.toContain('<script>');
      expect(call[0].content).not.toContain('<img src=x');
    });
  });

  /* -------------------------------------------- */
  /*  handleCharacterRemoval                      */
  /* -------------------------------------------- */

  describe('handleCharacterRemoval', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          insanity: 100,
          corruption: 50
        }
      };

      jest.spyOn(FoundryAdapter, 'showDialog').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'showNotification').mockResolvedValue(undefined);
    });

    it('shows dialog with character name and insanity points', async () => {
      await InsanityHelper.handleCharacterRemoval(mockActor, "insanity");

      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Test Character"),
          content: expect.stringContaining("100 Insanity Points")
        })
      );
    });

    it('shows dialog with corruption points when reason is corruption', async () => {
      await InsanityHelper.handleCharacterRemoval(mockActor, "corruption");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain("50 Corruption Points");
    });

    it('includes appropriate message for insanity', async () => {
      await InsanityHelper.handleCharacterRemoval(mockActor, "insanity");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain("shattered by the horrors");
    });

    it('includes appropriate message for corruption', async () => {
      await InsanityHelper.handleCharacterRemoval(mockActor, "corruption");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain("taint is too great");
    });

    it('includes three dialog buttons', async () => {
      await InsanityHelper.handleCharacterRemoval(mockActor, "insanity");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].buttons.archive).toBeDefined();
      expect(call[0].buttons.keep).toBeDefined();
      expect(call[0].buttons.delay).toBeDefined();
    });

    it('sets default button to archive', async () => {
      await InsanityHelper.handleCharacterRemoval(mockActor, "insanity");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].default).toBe("archive");
    });

    it('sanitizes actor name for XSS', async () => {
      mockActor.name = '<script>alert("XSS")</script>';

      await InsanityHelper.handleCharacterRemoval(mockActor, "insanity");

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).not.toContain('<script>');
    });
  });

  /* -------------------------------------------- */
  /*  purchaseInsanityReduction                   */
  /* -------------------------------------------- */

  describe('purchaseInsanityReduction', () => {
    let mockActor;

    beforeEach(() => {
      mockActor = {
        name: "Test Character",
        system: {
          insanity: 50,
          insanityHistory: [],
          xp: {
            available: 500
          }
        }
      };

      jest.spyOn(FoundryAdapter, 'showDialog').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'showNotification').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'updateDocument').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'createChatMessage').mockResolvedValue(undefined);
      jest.spyOn(FoundryAdapter, 'getChatSpeaker').mockReturnValue({});
    });

    it('shows dialog with current insanity and XP', async () => {
      await InsanityHelper.purchaseInsanityReduction(mockActor);

      expect(FoundryAdapter.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Purchase Insanity Reduction",
          content: expect.stringContaining("50 IP")
        })
      );

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain("500");
    });

    it('calculates track floor correctly for level 1', async () => {
      mockActor.system.insanity = 45; // Track level 1, floor is 31

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      // Max points = 45 - 31 = 14
      expect(call[0].content).toContain("31 IP minimum");
    });

    it('calculates track floor correctly for level 2', async () => {
      mockActor.system.insanity = 75; // Track level 2, floor is 61

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain("61 IP minimum");
    });

    it('calculates track floor correctly for level 3', async () => {
      mockActor.system.insanity = 95; // Track level 3, floor is 91

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain("91 IP minimum");
    });

    it('limits max points by XP affordability', async () => {
      mockActor.system.insanity = 50;
      mockActor.system.xp.available = 250; // Can afford 2 points

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      const maxAttr = call[0].content.match(/max="(\d+)"/);
      expect(parseInt(maxAttr[1])).toBe(2);
    });

    it('limits max points by track floor', async () => {
      mockActor.system.insanity = 33; // Track level 1, floor 31, only 2 points available
      mockActor.system.xp.available = 1000; // Plenty of XP

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      const maxAttr = call[0].content.match(/max="(\d+)"/);
      expect(parseInt(maxAttr[1])).toBe(2);
    });

    it('shows warning if insufficient XP', async () => {
      mockActor.system.xp.available = 50; // Not enough for 1 point

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith(
        'warn',
        expect.stringContaining("Not enough XP")
      );
      expect(FoundryAdapter.showDialog).not.toHaveBeenCalled();
    });

    it('shows warning if at track floor', async () => {
      mockActor.system.insanity = 31; // Exactly at track level 1 floor
      mockActor.system.xp.available = 500;

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      expect(FoundryAdapter.showNotification).toHaveBeenCalledWith(
        'warn',
        expect.stringContaining("Cannot reduce insanity below current track level")
      );
      expect(FoundryAdapter.showDialog).not.toHaveBeenCalled();
    });

    it('treats 100+ insanity as track level 3 for floor calculation', async () => {
      mockActor.system.insanity = 105; // Above removal threshold
      mockActor.system.xp.available = 2000;

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      // Floor should be 91 (track level 3)
      expect(call[0].content).toContain("91 IP minimum");
    });

    it('includes purchase and cancel buttons', async () => {
      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].buttons.purchase).toBeDefined();
      expect(call[0].buttons.cancel).toBeDefined();
    });

    it('sets default button to purchase', async () => {
      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].default).toBe("purchase");
    });

    it('includes render callback for dynamic preview', async () => {
      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].render).toBeDefined();
      expect(typeof call[0].render).toBe('function');
    });

    it('shows XP cost per point', async () => {
      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).toContain(INSANITY_REDUCTION.XP_COST_PER_POINT.toString());
    });

    it('sanitizes actor name for XSS', async () => {
      mockActor.name = '<script>alert("XSS")</script>';

      await InsanityHelper.purchaseInsanityReduction(mockActor);

      const call = FoundryAdapter.showDialog.mock.calls[0];
      expect(call[0].content).not.toContain('<script>');
    });
  });
});
