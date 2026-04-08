import { jest } from '@jest/globals';
import DeathwatchChapter from '../../src/module/data/item/chapter.mjs';
import { INSANITY_TRACK } from '../../src/module/helpers/constants/index.mjs';

describe('DeathwatchChapter - Primarch\'s Curse', () => {
  describe('defineSchema', () => {
    it('includes key field from keyTemplate', () => {
      const schema = DeathwatchChapter.defineSchema();
      expect(schema.key).toBeDefined();
      expect(schema.key.options.initial).toBe("");
    });

    it('includes curse name and description fields', () => {
      const schema = DeathwatchChapter.defineSchema();
      expect(schema.curseName).toBeDefined();
      expect(schema.curseName.options.initial).toBe("");
      expect(schema.curseDescription).toBeDefined();
      expect(schema.curseDescription.options.initial).toBe("");
    });

    it('includes Level 1 curse fields', () => {
      const schema = DeathwatchChapter.defineSchema();
      expect(schema.curseLevel1Name).toBeDefined();
      expect(schema.curseLevel1Description).toBeDefined();
      expect(schema.curseLevel1Effect).toBeDefined();
      expect(schema.curseLevel1Modifier).toBeDefined();
      expect(schema.curseLevel1Target).toBeDefined();
      expect(schema.curseLevel1Effect.options.initial).toBe("none");
    });

    it('includes Level 2 curse fields', () => {
      const schema = DeathwatchChapter.defineSchema();
      expect(schema.curseLevel2Name).toBeDefined();
      expect(schema.curseLevel2Description).toBeDefined();
      expect(schema.curseLevel2Effect).toBeDefined();
      expect(schema.curseLevel2Modifier).toBeDefined();
      expect(schema.curseLevel2Target).toBeDefined();
      expect(schema.curseLevel2CohesionPenalty).toBeDefined();
      expect(schema.curseLevel2Effect.options.initial).toBe("none");
    });

    it('includes Level 3 curse fields', () => {
      const schema = DeathwatchChapter.defineSchema();
      expect(schema.curseLevel3Name).toBeDefined();
      expect(schema.curseLevel3Description).toBeDefined();
      expect(schema.curseLevel3Effect).toBeDefined();
      expect(schema.curseLevel3Modifier).toBeDefined();
      expect(schema.curseLevel3Target).toBeDefined();
      expect(schema.curseLevel3CohesionPenalty).toBeDefined();
      expect(schema.curseLevel3Effect.options.initial).toBe("none");
    });

    it('includes correct effect type choices for Level 1', () => {
      const schema = DeathwatchChapter.defineSchema();
      expect(schema.curseLevel1Effect.options.choices).toEqual({
        none: "No Mechanical Effect",
        modifier: "Stat/Skill Modifier",
        fellowshipPenalty: "Fellowship Penalty vs Target",
        cohesionPenalty: "Cohesion Penalty",
        custom: "Custom Effect (see description)"
      });
    });

    it('includes correct effect type choices for Level 3', () => {
      const schema = DeathwatchChapter.defineSchema();
      expect(schema.curseLevel3Effect.options.choices).toEqual({
        none: "No Mechanical Effect",
        modifier: "Stat/Skill Modifier",
        behavioralRequirement: "Behavioral Requirement",
        cohesionPenalty: "Cohesion Penalty",
        custom: "Custom Effect (see description)"
      });
    });
  });

  describe('hasCurse', () => {
    it('returns false when curseName is empty', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "";

      expect(chapter.hasCurse()).toBe(false);
    });

    it('returns false when curseName is null', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = null;

      expect(chapter.hasCurse()).toBe(false);
    });

    it('returns false when curseName is undefined', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = undefined;

      expect(chapter.hasCurse()).toBe(false);
    });

    it('returns true when curseName is set', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Red Thirst";

      expect(chapter.hasCurse()).toBe(true);
    });
  });

  describe('_getCurseLevel', () => {
    it('returns 0 for insanity below threshold 1 (0-30)', () => {
      const chapter = new DeathwatchChapter();

      expect(chapter._getCurseLevel(0)).toBe(0);
      expect(chapter._getCurseLevel(15)).toBe(0);
      expect(chapter._getCurseLevel(30)).toBe(0);
    });

    it('returns 1 for insanity at threshold 1 (31-60)', () => {
      const chapter = new DeathwatchChapter();

      expect(chapter._getCurseLevel(31)).toBe(1);
      expect(chapter._getCurseLevel(45)).toBe(1);
      expect(chapter._getCurseLevel(60)).toBe(1);
    });

    it('returns 2 for insanity at threshold 2 (61-90)', () => {
      const chapter = new DeathwatchChapter();

      expect(chapter._getCurseLevel(61)).toBe(2);
      expect(chapter._getCurseLevel(75)).toBe(2);
      expect(chapter._getCurseLevel(90)).toBe(2);
    });

    it('returns 3 for insanity at threshold 3 (91-99)', () => {
      const chapter = new DeathwatchChapter();

      expect(chapter._getCurseLevel(91)).toBe(3);
      expect(chapter._getCurseLevel(95)).toBe(3);
      expect(chapter._getCurseLevel(99)).toBe(3);
    });

    it('returns 0 for insanity at removal threshold (100+)', () => {
      const chapter = new DeathwatchChapter();

      expect(chapter._getCurseLevel(100)).toBe(0);
      expect(chapter._getCurseLevel(150)).toBe(0);
    });

    it('matches constants from INSANITY_TRACK', () => {
      const chapter = new DeathwatchChapter();

      expect(chapter._getCurseLevel(INSANITY_TRACK.THRESHOLD_1)).toBe(0);     // 30 is level 0
      expect(chapter._getCurseLevel(INSANITY_TRACK.THRESHOLD_1 + 1)).toBe(1); // 31 is level 1
      expect(chapter._getCurseLevel(INSANITY_TRACK.THRESHOLD_2)).toBe(1);     // 60 is level 1
      expect(chapter._getCurseLevel(INSANITY_TRACK.THRESHOLD_2 + 1)).toBe(2); // 61 is level 2
      expect(chapter._getCurseLevel(INSANITY_TRACK.THRESHOLD_3)).toBe(2);     // 90 is level 2
      expect(chapter._getCurseLevel(INSANITY_TRACK.THRESHOLD_3 + 1)).toBe(3); // 91 is level 3
      expect(chapter._getCurseLevel(INSANITY_TRACK.REMOVAL - 1)).toBe(3);     // 99 is level 3
      expect(chapter._getCurseLevel(INSANITY_TRACK.REMOVAL)).toBe(0);         // 100 is removed
    });
  });

  describe('getActiveCurseLevel', () => {
    it('returns null when chapter has no curse', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "";

      const result = chapter.getActiveCurseLevel(50);

      expect(result).toBeNull();
    });

    it('returns null when insanity is below threshold 1', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Red Thirst";
      chapter.curseLevel1Name = "Blood Rage";

      const result = chapter.getActiveCurseLevel(25);

      expect(result).toBeNull();
    });

    it('returns null when insanity is at removal threshold', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Red Thirst";

      const result = chapter.getActiveCurseLevel(100);

      expect(result).toBeNull();
    });

    it('returns Level 1 data for insanity 31-60', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Red Thirst";
      chapter.curseLevel1Name = "Blood Rage";
      chapter.curseLevel1Description = "<p>Minor rage</p>";
      chapter.curseLevel1Effect = "modifier";
      chapter.curseLevel1Modifier = -10;
      chapter.curseLevel1Target = "wil";

      const result = chapter.getActiveCurseLevel(45);

      expect(result).toEqual({
        level: 1,
        name: "Blood Rage",
        description: "<p>Minor rage</p>",
        effectType: "modifier",
        modifier: -10,
        target: "wil",
        cohesionPenalty: 0
      });
    });

    it('returns Level 2 data for insanity 61-90', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Red Thirst";
      chapter.curseLevel2Name = "Blood Fury";
      chapter.curseLevel2Description = "<p>Moderate rage</p>";
      chapter.curseLevel2Effect = "cohesionPenalty";
      chapter.curseLevel2Modifier = 0;
      chapter.curseLevel2Target = "";
      chapter.curseLevel2CohesionPenalty = 2;

      const result = chapter.getActiveCurseLevel(75);

      expect(result).toEqual({
        level: 2,
        name: "Blood Fury",
        description: "<p>Moderate rage</p>",
        effectType: "cohesionPenalty",
        modifier: 0,
        target: "",
        cohesionPenalty: 2
      });
    });

    it('returns Level 3 data for insanity 91-99', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Red Thirst";
      chapter.curseLevel3Name = "Blood Madness";
      chapter.curseLevel3Description = "<p>Severe rage</p>";
      chapter.curseLevel3Effect = "behavioralRequirement";
      chapter.curseLevel3Modifier = -20;
      chapter.curseLevel3Target = "fel";
      chapter.curseLevel3CohesionPenalty = 3;

      const result = chapter.getActiveCurseLevel(95);

      expect(result).toEqual({
        level: 3,
        name: "Blood Madness",
        description: "<p>Severe rage</p>",
        effectType: "behavioralRequirement",
        modifier: -20,
        target: "fel",
        cohesionPenalty: 3
      });
    });

    it('handles missing cohesionPenalty field (returns 0)', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Black Rage";
      chapter.curseLevel1Name = "Dark Whispers";
      chapter.curseLevel1Description = "<p>Voices</p>";
      chapter.curseLevel1Effect = "modifier";
      chapter.curseLevel1Modifier = -5;
      chapter.curseLevel1Target = "per";
      // curseLevel1CohesionPenalty not set

      const result = chapter.getActiveCurseLevel(40);

      expect(result.cohesionPenalty).toBe(0);
    });

    it('handles fellowship penalty effect type', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "Sons of the Gorgon";
      chapter.curseLevel1Name = "Cold Logic";
      chapter.curseLevel1Description = "<p>Emotionless demeanor</p>";
      chapter.curseLevel1Effect = "fellowshipPenalty";
      chapter.curseLevel1Modifier = -10;
      chapter.curseLevel1Target = "fel";

      const result = chapter.getActiveCurseLevel(50);

      expect(result.effectType).toBe("fellowshipPenalty");
      expect(result.modifier).toBe(-10);
      expect(result.target).toBe("fel");
    });

    it('handles custom effect type', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Rage";
      chapter.curseLevel2Name = "Fury Unbound";
      chapter.curseLevel2Description = "<p>See description for effects</p>";
      chapter.curseLevel2Effect = "custom";
      chapter.curseLevel2Modifier = 0;
      chapter.curseLevel2Target = "";

      const result = chapter.getActiveCurseLevel(70);

      expect(result.effectType).toBe("custom");
      expect(result.modifier).toBe(0);
      expect(result.target).toBe("");
    });

    it('handles no mechanical effect type', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "The Curse";
      chapter.curseLevel1Name = "Minor Manifestation";
      chapter.curseLevel1Description = "<p>Narrative only</p>";
      chapter.curseLevel1Effect = "none";
      chapter.curseLevel1Modifier = 0;
      chapter.curseLevel1Target = "";

      const result = chapter.getActiveCurseLevel(35);

      expect(result.effectType).toBe("none");
    });

    it('returns correct level at each threshold boundary', () => {
      const chapter = new DeathwatchChapter();
      chapter.curseName = "Test Curse";
      chapter.curseLevel1Name = "Level 1";
      chapter.curseLevel2Name = "Level 2";
      chapter.curseLevel3Name = "Level 3";
      chapter.curseLevel1Effect = "none";
      chapter.curseLevel2Effect = "none";
      chapter.curseLevel3Effect = "none";

      expect(chapter.getActiveCurseLevel(30)).toBeNull();
      expect(chapter.getActiveCurseLevel(31).level).toBe(1);
      expect(chapter.getActiveCurseLevel(60).level).toBe(1);
      expect(chapter.getActiveCurseLevel(61).level).toBe(2);
      expect(chapter.getActiveCurseLevel(90).level).toBe(2);
      expect(chapter.getActiveCurseLevel(91).level).toBe(3);
      expect(chapter.getActiveCurseLevel(99).level).toBe(3);
      expect(chapter.getActiveCurseLevel(100)).toBeNull();
    });
  });
});
