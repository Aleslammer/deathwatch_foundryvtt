import { jest } from '@jest/globals';
import DeathwatchBattleTrauma from '../../src/module/data/item/battle-trauma.mjs';

describe('DeathwatchBattleTrauma', () => {
  describe('defineSchema', () => {
    it('includes all base fields from DeathwatchItemBase', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.description).toBeDefined();
      expect(schema.book).toBeDefined();
      expect(schema.page).toBeDefined();
      expect(schema.modifiers).toBeDefined();
    });

    it('includes key field from keyTemplate', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.key).toBeDefined();
      expect(schema.key.options.initial).toBe("");
    });

    it('includes trigger type field with correct choices', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.triggerType).toBeDefined();
      expect(schema.triggerType.options.initial).toBe("always");
      expect(schema.triggerType.options.choices).toEqual({
        always: "Always Active",
        combat: "During Combat",
        righteousFury: "On Righteous Fury",
        psychicPower: "When Using Psychic Powers",
        fellowship: "During Social Interaction",
        willpowerTest: "During Willpower Tests"
      });
    });

    it('includes effect type field with correct choices', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.effectType).toBeDefined();
      expect(schema.effectType.options.initial).toBe("modifier");
      expect(schema.effectType.options.choices).toEqual({
        modifier: "Stat/Skill Modifier",
        behavior: "Behavioral Requirement",
        cohesion: "Cohesion Penalty",
        custom: "Custom Effect (see description)"
      });
    });

    it('includes modifier field with default value', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.modifier).toBeDefined();
      expect(schema.modifier.options.initial).toBe(0);
      expect(schema.modifier.options.integer).toBe(true);
    });

    it('includes modifierTarget field', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.modifierTarget).toBeDefined();
      expect(schema.modifierTarget.options.initial).toBe("");
      expect(schema.modifierTarget.options.blank).toBe(true);
    });

    it('includes cohesionPenalty field with minimum constraint', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.cohesionPenalty).toBeDefined();
      expect(schema.cohesionPenalty.options.initial).toBe(0);
      expect(schema.cohesionPenalty.options.min).toBe(0);
      expect(schema.cohesionPenalty.options.integer).toBe(true);
    });

    it('includes canResist field with default value', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.canResist).toBeDefined();
      expect(schema.canResist.options.initial).toBe(false);
    });

    it('includes resistDifficulty field with correct choices', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.resistDifficulty).toBeDefined();
      expect(schema.resistDifficulty.options.initial).toBe("challenging");
      expect(schema.resistDifficulty.options.choices).toEqual({
        easy: "Easy (+30)",
        routine: "Routine (+20)",
        ordinary: "Ordinary (+10)",
        challenging: "Challenging (+0)",
        difficult: "Difficult (-10)",
        hard: "Hard (-20)",
        veryHard: "Very Hard (-30)"
      });
    });

    it('does not include equipped or requisition templates', () => {
      const schema = DeathwatchBattleTrauma.defineSchema();
      expect(schema.equipped).toBeUndefined();
      expect(schema.req).toBeUndefined();
      expect(schema.renown).toBeUndefined();
    });
  });

  describe('getModifiers', () => {
    it('returns empty array when effectType is not "modifier"', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.effectType = "behavior";
      trauma.modifier = -10;
      trauma.modifierTarget = "ws";
      trauma.parent = { name: "Test Trauma" };

      const modifiers = trauma.getModifiers();

      expect(modifiers).toEqual([]);
    });

    it('returns empty array when modifier is zero', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.effectType = "modifier";
      trauma.modifier = 0;
      trauma.modifierTarget = "ws";
      trauma.parent = { name: "Test Trauma" };

      const modifiers = trauma.getModifiers();

      expect(modifiers).toEqual([]);
    });

    it('returns empty array when modifierTarget is empty', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.effectType = "modifier";
      trauma.modifier = -10;
      trauma.modifierTarget = "";
      trauma.parent = { name: "Test Trauma" };

      const modifiers = trauma.getModifiers();

      expect(modifiers).toEqual([]);
    });

    it('returns modifier object when effectType is "modifier" with valid data', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.effectType = "modifier";
      trauma.modifier = -10;
      trauma.modifierTarget = "ws";
      trauma.parent = { name: "Battle Rage" };

      const modifiers = trauma.getModifiers();

      expect(modifiers).toHaveLength(1);
      expect(modifiers[0]).toEqual({
        value: -10,
        target: "ws",
        source: "Battle Rage",
        type: "battle-trauma"
      });
    });

    it('handles positive modifiers', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.effectType = "modifier";
      trauma.modifier = 10;
      trauma.modifierTarget = "willpower";
      trauma.parent = { name: "Ironclad Mind" };

      const modifiers = trauma.getModifiers();

      expect(modifiers).toHaveLength(1);
      expect(modifiers[0]).toEqual({
        value: 10,
        target: "willpower",
        source: "Ironclad Mind",
        type: "battle-trauma"
      });
    });

    it('uses fallback name when parent has no name', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.effectType = "modifier";
      trauma.modifier = -5;
      trauma.modifierTarget = "bs";
      trauma.parent = null;

      const modifiers = trauma.getModifiers();

      expect(modifiers).toHaveLength(1);
      expect(modifiers[0].source).toBe("Battle Trauma");
    });

    it('handles cohesion effect type (returns empty array)', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.effectType = "cohesion";
      trauma.modifier = 0;
      trauma.modifierTarget = "";
      trauma.cohesionPenalty = 2;
      trauma.parent = { name: "Test Trauma" };

      const modifiers = trauma.getModifiers();

      expect(modifiers).toEqual([]);
    });

    it('handles custom effect type (returns empty array)', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.effectType = "custom";
      trauma.modifier = 0;
      trauma.modifierTarget = "";
      trauma.parent = { name: "Test Trauma" };

      const modifiers = trauma.getModifiers();

      expect(modifiers).toEqual([]);
    });
  });

  describe('prepareDerivedData', () => {
    it('sets default icon when parent has no img', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.parent = { img: null };

      trauma.prepareDerivedData();

      expect(trauma.img).toBe("systems/deathwatch/assets/icons/battle-trauma.svg");
    });

    it('sets default icon when parent has default item bag icon', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.parent = { img: "icons/svg/item-bag.svg" };

      trauma.prepareDerivedData();

      expect(trauma.img).toBe("systems/deathwatch/assets/icons/battle-trauma.svg");
    });

    it('does not override custom icon', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.parent = { img: "custom/icon.png" };

      trauma.prepareDerivedData();

      expect(trauma.img).toBeUndefined();
    });

    it('handles missing parent gracefully', () => {
      const trauma = new DeathwatchBattleTrauma();
      trauma.parent = null;

      expect(() => trauma.prepareDerivedData()).not.toThrow();
    });
  });
});
