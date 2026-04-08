# Insanity and Corruption - Data Model Specification

## Character Actor Schema Extensions

### Location: `src/module/data/actor/character.mjs`

Add the following fields to the character schema:

```javascript
// In DeathwatchCharacter.defineSchema()
static defineSchema() {
  return {
    ...super.defineSchema(),
    
    // Corruption tracking
    corruption: new foundry.data.fields.NumberField({
      initial: 0,
      min: 0,
      integer: true,
      label: "Corruption Points"
    }),
    
    corruptionHistory: new foundry.data.fields.ArrayField(
      new foundry.data.fields.SchemaField({
        points: new foundry.data.fields.NumberField({ integer: true }),
        source: new foundry.data.fields.StringField({ blank: false }),
        timestamp: new foundry.data.fields.NumberField({ integer: true }),
        missionId: new foundry.data.fields.StringField({ blank: true })
      }),
      {
        initial: [],
        max: 100,
        label: "Corruption History"
      }
    ),
    
    // Insanity tracking
    insanity: new foundry.data.fields.NumberField({
      initial: 0,
      min: 0,
      integer: true,
      label: "Insanity Points"
    }),
    
    insanityHistory: new foundry.data.fields.ArrayField(
      new foundry.data.fields.SchemaField({
        points: new foundry.data.fields.NumberField({ integer: true }),
        source: new foundry.data.fields.StringField({ blank: false }),
        timestamp: new foundry.data.fields.NumberField({ integer: true }),
        missionId: new foundry.data.fields.StringField({ blank: true }),
        testRolled: new foundry.data.fields.BooleanField({ initial: false }),
        testResult: new foundry.data.fields.StringField({ blank: true }),
        testModifiers: new foundry.data.fields.SchemaField({
          base: new foundry.data.fields.NumberField({ integer: true }),
          track: new foundry.data.fields.NumberField({ integer: true }),
          situational: new foundry.data.fields.NumberField({ integer: true }),
          total: new foundry.data.fields.NumberField({ integer: true })
        }, { required: false })
      }),
      {
        initial: [],
        max: 100,
        label: "Insanity History"
      }
    ),
    
    // Track insanity tests to trigger at correct intervals
    lastInsanityTestAt: new foundry.data.fields.NumberField({
      initial: 0,
      min: 0,
      integer: true,
      label: "Last Insanity Test Threshold"
    })
  };
}
```

### Derived Data Computation

```javascript
// In prepareDerivedData()
prepareDerivedData() {
  super.prepareDerivedData();
  
  // Compute insanity track level
  this.insanityTrackLevel = InsanityHelper.getTrackLevel(this.insanity);
  
  // Compute Primarch's Curse level
  this.primarchsCurseLevel = InsanityHelper.getCurseLevel(this.insanity);
  
  // Get active curse data from chapter
  if (this.chapter) {
    this.activeCurse = this.chapter.system.getActiveCurseLevel(this.insanity);
  } else {
    this.activeCurse = null;
  }
  
  // Check for character removal
  this.isCorrupted = this.corruption >= CORRUPTION.PURITY_THRESHOLD;
  this.isInsane = this.insanity >= INSANITY_TRACK.REMOVAL;
  this.shouldBeRemoved = this.isCorrupted || this.isInsane;
  
  // Compute trauma modifier
  this.traumaModifier = INSANITY_TRACK.MODIFIERS[`LEVEL_${this.insanityTrackLevel}`];
}
```

## Battle Trauma Item Type

### Location: `src/module/data/item/battle-trauma.mjs`

```javascript
import { DeathwatchItemBase } from './base-item.mjs';

export class DeathwatchBattleTrauma extends DeathwatchItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      ...super.defineSchema(),
      ...DeathwatchItemBase.keyTemplate(), // For stable identification
      
      // Trauma description and effects
      description: new fields.HTMLField({
        blank: true,
        label: "Description"
      }),
      
      // Trigger condition (when does this trauma activate?)
      triggerType: new fields.StringField({
        initial: "always",
        choices: {
          always: "Always Active",
          combat: "During Combat",
          righteousFury: "On Righteous Fury",
          psychicPower: "When Using Psychic Powers",
          fellowship: "During Social Interaction",
          willpowerTest: "During Willpower Tests"
        },
        label: "Trigger Type"
      }),
      
      // Mechanical effect
      effectType: new fields.StringField({
        initial: "modifier",
        choices: {
          modifier: "Stat/Skill Modifier",
          behavior: "Behavioral Requirement",
          cohesion: "Cohesion Penalty",
          custom: "Custom Effect (see description)"
        },
        label: "Effect Type"
      }),
      
      // If effectType is "modifier"
      modifier: new fields.NumberField({
        initial: 0,
        integer: true,
        label: "Modifier Value"
      }),
      
      modifierTarget: new fields.StringField({
        blank: true,
        label: "What to Modify (characteristic/skill/etc)"
      }),
      
      // If effectType is "cohesion"
      cohesionPenalty: new fields.NumberField({
        initial: 0,
        min: 0,
        integer: true,
        label: "Cohesion Penalty"
      }),
      
      // Willpower test to resist trigger
      canResist: new fields.BooleanField({
        initial: false,
        label: "Can Resist with Willpower Test"
      }),
      
      resistDifficulty: new fields.StringField({
        initial: "challenging",
        choices: {
          easy: "Easy (+30)",
          routine: "Routine (+20)",
          ordinary: "Ordinary (+10)",
          challenging: "Challenging (+0)",
          difficult: "Difficult (-10)",
          hard: "Hard (-20)",
          veryHard: "Very Hard (-30)"
        },
        label: "Resist Difficulty"
      }),
      
      // Metadata
      book: new fields.StringField({
        initial: "Deathwatch Core Rulebook",
        label: "Source Book"
      }),
      
      page: new fields.NumberField({
        initial: 0,
        integer: true,
        label: "Page Number"
      })
    };
  }
  
  prepareDerivedData() {
    super.prepareDerivedData();
    
    // Set item type icon
    this.img = this.img || "systems/deathwatch/assets/icons/battle-trauma.svg";
  }
}
```

## Chapter Item Extensions (Primarch's Curse)

### Location: `src/module/data/item/chapter.mjs`

Add Primarch's Curse fields to the existing Chapter item schema:

```javascript
import { DeathwatchItemBase } from './base-item.mjs';
import { InsanityHelper } from '../helpers/insanity-helper.mjs';

export class DeathwatchChapter extends DeathwatchItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      ...super.defineSchema(),
      ...DeathwatchItemBase.keyTemplate(),
      
      // Existing chapter fields (solo mode abilities, modifiers, etc.)
      // ...
      
      // ═══════════════════════════════════════════════════════════
      // PRIMARCH'S CURSE
      // ═══════════════════════════════════════════════════════════
      
      // Overall curse information
      curseName: new fields.StringField({
        blank: true,
        label: "Primarch's Curse Name"
      }),
      
      curseDescription: new fields.HTMLField({
        blank: true,
        label: "Curse Overview"
      }),
      
      // Level 1 (31-60 IP)
      curseLevel1Name: new fields.StringField({
        blank: true,
        label: "Level 1 Name"
      }),
      
      curseLevel1Description: new fields.HTMLField({
        blank: true,
        label: "Level 1 Description"
      }),
      
      curseLevel1Effect: new fields.StringField({
        initial: "none",
        choices: {
          none: "No Mechanical Effect",
          modifier: "Stat/Skill Modifier",
          fellowshipPenalty: "Fellowship Penalty vs Target",
          cohesionPenalty: "Cohesion Penalty",
          custom: "Custom Effect (see description)"
        },
        label: "Level 1 Effect Type"
      }),
      
      curseLevel1Modifier: new fields.NumberField({
        initial: 0,
        integer: true,
        label: "Level 1 Modifier"
      }),
      
      curseLevel1Target: new fields.StringField({
        blank: true,
        label: "Level 1 Modifier Target"
      }),
      
      // Level 2 (61-90 IP)
      curseLevel2Name: new fields.StringField({
        blank: true,
        label: "Level 2 Name"
      }),
      
      curseLevel2Description: new fields.HTMLField({
        blank: true,
        label: "Level 2 Description"
      }),
      
      curseLevel2Effect: new fields.StringField({
        initial: "none",
        choices: {
          none: "No Mechanical Effect",
          modifier: "Stat/Skill Modifier",
          fellowshipPenalty: "Fellowship Penalty vs Target",
          cohesionPenalty: "Cohesion Penalty",
          custom: "Custom Effect (see description)"
        },
        label: "Level 2 Effect Type"
      }),
      
      curseLevel2Modifier: new fields.NumberField({
        initial: 0,
        integer: true,
        label: "Level 2 Modifier"
      }),
      
      curseLevel2Target: new fields.StringField({
        blank: true,
        label: "Level 2 Modifier Target"
      }),
      
      curseLevel2CohesionPenalty: new fields.NumberField({
        initial: 0,
        min: 0,
        integer: true,
        label: "Level 2 Cohesion Penalty"
      }),
      
      // Level 3 (91-99 IP)
      curseLevel3Name: new fields.StringField({
        blank: true,
        label: "Level 3 Name"
      }),
      
      curseLevel3Description: new fields.HTMLField({
        blank: true,
        label: "Level 3 Description"
      }),
      
      curseLevel3Effect: new fields.StringField({
        initial: "none",
        choices: {
          none: "No Mechanical Effect",
          modifier: "Stat/Skill Modifier",
          behavioralRequirement: "Behavioral Requirement",
          cohesionPenalty: "Cohesion Penalty",
          custom: "Custom Effect (see description)"
        },
        label: "Level 3 Effect Type"
      }),
      
      curseLevel3Modifier: new fields.NumberField({
        initial: 0,
        integer: true,
        label: "Level 3 Modifier"
      }),
      
      curseLevel3Target: new fields.StringField({
        blank: true,
        label: "Level 3 Modifier Target"
      }),
      
      curseLevel3CohesionPenalty: new fields.NumberField({
        initial: 0,
        min: 0,
        integer: true,
        label: "Level 3 Cohesion Penalty"
      })
    };
  }
  
  /**
   * Get the active curse level data for a given insanity point value.
   * 
   * @param {number} insanityPoints - Current insanity points
   * @returns {Object|null} Active level data or null if curse not active
   */
  getActiveCurseLevel(insanityPoints) {
    const level = InsanityHelper.getCurseLevel(insanityPoints);
    
    if (level === 0) return null;
    
    return {
      level,
      name: this[`curseLevel${level}Name`],
      description: this[`curseLevel${level}Description`],
      effectType: this[`curseLevel${level}Effect`],
      modifier: this[`curseLevel${level}Modifier`],
      target: this[`curseLevel${level}Target`],
      cohesionPenalty: this[`curseLevel${level}CohesionPenalty`] || 0
    };
  }
  
  /**
   * Check if this chapter has a Primarch's Curse defined.
   * 
   * @returns {boolean}
   */
  hasCurse() {
    return !!this.curseName;
  }
}
```

**Why in Chapter instead of separate item?**
- Primarch's Curse is intrinsic to the chapter, not a separate acquisition
- Character automatically has access to their chapter's curse
- Simpler data model (no linking/key matching needed)
- Matches lore: being from a chapter means inheriting that chapter's curse
- Easier to maintain: edit chapter compendium entry, curse is right there

## Item Type Registration

### Location: `src/module/documents/item.mjs`

```javascript
// Add to item type mapping
CONFIG.Item.dataModels = {
  // ... existing types
  "battle-trauma": DeathwatchBattleTrauma
  // Note: Primarch's Curse is now part of Chapter item, not a separate type
};
```

## Template Definition

### Location: `src/template.json`

Add new item types to the template:

```json
{
  "Item": {
    "types": [
      "weapon",
      "armor",
      // ... existing types
      "battle-trauma"
      // Note: primarchs-curse removed - now part of chapter
    ],
    "battle-trauma": {
      "description": "",
      "triggerType": "always",
      "effectType": "modifier",
      "modifier": 0,
      "modifierTarget": "",
      "cohesionPenalty": 0,
      "canResist": false,
      "resistDifficulty": "challenging",
      "book": "Deathwatch Core Rulebook",
      "page": 0
    },
    "chapter": {
      // ... existing chapter fields
      
      // Primarch's Curse fields (added to chapter type)
      "curseName": "",
      "curseDescription": "",
      "curseLevel1Name": "",
      "curseLevel1Description": "",
      "curseLevel1Effect": "none",
      "curseLevel1Modifier": 0,
      "curseLevel1Target": "",
      "curseLevel2Name": "",
      "curseLevel2Description": "",
      "curseLevel2Effect": "none",
      "curseLevel2Modifier": 0,
      "curseLevel2Target": "",
      "curseLevel2CohesionPenalty": 0,
      "curseLevel3Name": "",
      "curseLevel3Description": "",
      "curseLevel3Effect": "none",
      "curseLevel3Modifier": 0,
      "curseLevel3Target": "",
      "curseLevel3CohesionPenalty": 0
    }
  }
}
```

## Migration Script

### Location: `src/module/migrations/add-insanity-corruption.mjs`

```javascript
/**
 * Migration to add insanity and corruption fields to existing characters.
 * 
 * Run this migration when updating to the version that includes insanity/corruption.
 */
export async function migrateAddInsanityCorruption() {
  // Migrate all character actors
  for (const actor of game.actors.filter(a => a.type === "character")) {
    const updates = {};
    
    if (actor.system.corruption === undefined) {
      updates["system.corruption"] = 0;
      updates["system.corruptionHistory"] = [];
    }
    
    if (actor.system.insanity === undefined) {
      updates["system.insanity"] = 0;
      updates["system.insanityHistory"] = [];
      updates["system.lastInsanityTestAt"] = 0;
    }
    
    if (Object.keys(updates).length > 0) {
      await actor.update(updates);
      console.log(`Deathwatch | Migrated ${actor.name} with insanity/corruption fields`);
    }
  }
  
  ui.notifications.info("Deathwatch | Migration complete: Added insanity and corruption tracking");
}
```

## Constants

### Location: `src/module/helpers/constants/insanity-constants.mjs`

```javascript
/**
 * Insanity system constants (Core p. 215-217)
 */

export const INSANITY_TRACK = {
  /** Insanity threshold levels */
  THRESHOLD_1: 30,  // Level 1: Primarch's Curse Level 1
  THRESHOLD_2: 60,  // Level 2: Primarch's Curse Level 2
  THRESHOLD_3: 90,  // Level 3: Primarch's Curse Level 3
  REMOVAL: 100,     // Character removed from play
  
  /** Test triggered every X insanity points gained */
  TEST_INTERVAL: 10,
  
  /** Trauma test modifiers by track level (Core p. 216) */
  MODIFIERS: {
    LEVEL_0: 0,    // 0-30 IP: No modifier
    LEVEL_1: -10,  // 31-60 IP: -10 to trauma tests
    LEVEL_2: -20,  // 61-90 IP: -20 to trauma tests
    LEVEL_3: -30   // 91-99 IP: -30 to trauma tests
  }
};

/**
 * Primarch's Curse level thresholds
 */
export const PRIMARCHS_CURSE_LEVELS = {
  NONE: 0,    // 0-30 IP
  LEVEL_1: 1, // 31-60 IP
  LEVEL_2: 2, // 61-90 IP
  LEVEL_3: 3  // 91-99 IP
};

/**
 * Battle Trauma table size (d10 roll)
 */
export const BATTLE_TRAUMA = {
  TABLE_SIZE: 10, // d10 roll for trauma
  MAX_REROLL_ATTEMPTS: 20 // Safety limit for duplicate prevention
};
```

### Location: `src/module/helpers/constants/corruption-constants.mjs`

```javascript
/**
 * Corruption system constants (Core p. 215)
 */

export const CORRUPTION = {
  /** Space Marine Purity Threshold (Core p. 215) */
  PURITY_THRESHOLD: 100
};
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Corruption/Insanity Point Gain                              │
│ (from psychic phenomena, warp exposure, etc.)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Update actor.system.corruption or actor.system.insanity     │
│ Append to history log with source/timestamp                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ prepareDerivedData() computes:                              │
│ - insanityTrackLevel (0-3)                                  │
│ - primarchsCurseLevel (0-3)                                 │
│ - traumaModifier (-0/-10/-20/-30)                           │
│ - shouldBeRemoved flag                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Trigger insanity test if crossed TEST_INTERVAL threshold    │
│ (handled in insanity-helper.mjs)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Modifier system collects:                                   │
│ - Battle Trauma modifiers (if trigger active)              │
│ - Primarch's Curse modifiers (from chapter.getActiveCurse) │
│ - Applied during characteristic/skill tests                 │
└─────────────────────────────────────────────────────────────┘
```

## Accessing Primarch's Curse Data

### In Character Sheet

```javascript
// In actor-sheet.mjs getData()
async getData() {
  const context = await super.getData();
  
  // Get chapter
  context.chapter = this.actor.items.find(i => i.type === "chapter");
  
  // Get active curse
  if (context.chapter && context.chapter.system.hasCurse()) {
    context.activeCurse = context.chapter.system.getActiveCurseLevel(
      this.actor.system.insanity
    );
    context.curseName = context.chapter.system.curseName;
    context.curseDescription = context.chapter.system.curseDescription;
  } else {
    context.activeCurse = null;
  }
  
  return context;
}
```

### In Modifier Collector

```javascript
// In modifier-collector.mjs
function collectPrimarchsCurseModifiers(actor) {
  const modifiers = [];
  
  // Find chapter
  const chapter = actor.items.find(i => i.type === "chapter");
  if (!chapter || !chapter.system.hasCurse()) return modifiers;
  
  // Get active curse level
  const activeCurse = chapter.system.getActiveCurseLevel(actor.system.insanity);
  if (!activeCurse) return modifiers;
  
  // Apply curse effects based on effectType
  switch (activeCurse.effectType) {
    case "modifier":
      modifiers.push({
        value: activeCurse.modifier,
        target: activeCurse.target,
        source: `${chapter.system.curseName} (Level ${activeCurse.level})`,
        type: "primarchs-curse"
      });
      break;
      
    case "fellowshipPenalty":
      // Conditional modifier (applied contextually)
      modifiers.push({
        value: activeCurse.modifier,
        target: "fellowship",
        source: `${chapter.system.curseName} (Level ${activeCurse.level})`,
        type: "primarchs-curse",
        conditional: true
      });
      break;
      
    // cohesionPenalty handled in cohesion-helper.mjs
  }
  
  return modifiers;
}
```

### In Cohesion Helper

```javascript
// In cohesion-helper.mjs
function getCurseCohesionPenalty(actor) {
  const chapter = actor.items.find(i => i.type === "chapter");
  if (!chapter) return 0;
  
  const activeCurse = chapter.system.getActiveCurseLevel(actor.system.insanity);
  if (!activeCurse) return 0;
  
  return activeCurse.cohesionPenalty || 0;
}
```
