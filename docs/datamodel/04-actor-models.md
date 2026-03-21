# Actor Models: Character and NPC Definitions

## Overview

Two actor types: `character` (full PC sheet) and `npc` (minimal). Both share a base with wounds and fatigue. Each model owns its derived data computation via `prepareDerivedData()`.

## Base Actor (actor/base-actor.mjs)

Shared fields for all actor types.

```javascript
import DeathwatchDataModel from '../base-document.mjs';

const { fields } = foundry.data;

export default class DeathwatchActorBase extends DeathwatchDataModel {
  static defineSchema() {
    const schema = super.defineSchema();

    schema.wounds = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      base: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });

    schema.fatigue = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });

    return schema;
  }
}
```

## Character (actor/character.mjs)

The full PC data model. Owns all character-specific derived data computation.

```javascript
import DeathwatchActorBase from './base-actor.mjs';
import { ModifierCollector } from '../../helpers/modifier-collector.mjs';
import { XPCalculator } from '../../helpers/xp-calculator.mjs';
import { SkillLoader } from '../../helpers/skill-loader.mjs';

const { fields } = foundry.data;

export default class DeathwatchCharacter extends DeathwatchActorBase {

  /**
   * Helper: creates the full schema for a single characteristic
   */
  static _characteristicFields() {
    return new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      bonus: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      damage: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      advances: new fields.SchemaField({
        simple: new fields.BooleanField({ initial: false }),
        intermediate: new fields.BooleanField({ initial: false }),
        trained: new fields.BooleanField({ initial: false }),
        expert: new fields.BooleanField({ initial: false })
      })
    });
  }

  static defineSchema() {
    const schema = super.defineSchema();

    // Biography fields
    schema.chapterId = new fields.StringField({ initial: "", blank: true });
    schema.gender = new fields.StringField({ initial: "", blank: true });
    schema.age = new fields.StringField({ initial: "", blank: true });
    schema.complexion = new fields.StringField({ initial: "", blank: true });
    schema.hair = new fields.StringField({ initial: "", blank: true });
    schema.description = new fields.HTMLField({ initial: "", blank: true });
    schema.pastEvents = new fields.HTMLField({ initial: "", blank: true });
    schema.specialty = new fields.StringField({ initial: "", blank: true });
    schema.specialtyId = new fields.StringField({ initial: "", blank: true });

    // Progression
    schema.rank = new fields.NumberField({ initial: 1, min: 1, max: 8, integer: true });
    schema.xp = new fields.SchemaField({
      total: new fields.NumberField({ initial: 13000, min: 0, integer: true }),
      spent: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });
    schema.fatePoints = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });
    schema.renown = new fields.NumberField({ initial: 0, min: 0, integer: true });

    // Modifiers
    schema.modifiers = new fields.ArrayField(
      new fields.ObjectField(),
      { initial: [] }
    );

    // Conditions
    schema.conditions = new fields.ObjectField({ initial: {} });

    // Characteristics (all 9)
    schema.characteristics = new fields.SchemaField({
      ws: DeathwatchCharacter._characteristicFields(),
      bs: DeathwatchCharacter._characteristicFields(),
      str: DeathwatchCharacter._characteristicFields(),
      tg: DeathwatchCharacter._characteristicFields(),
      ag: DeathwatchCharacter._characteristicFields(),
      int: DeathwatchCharacter._characteristicFields(),
      per: DeathwatchCharacter._characteristicFields(),
      wil: DeathwatchCharacter._characteristicFields(),
      fs: DeathwatchCharacter._characteristicFields()
    });

    // Psy Rating
    schema.psyRating = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      base: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });

    // Skills (dynamic, loaded from skills.json at runtime)
    schema.skills = new fields.ObjectField({ initial: {} });

    // Legacy fields (kept for compatibility, may remove later)
    schema.health = new fields.SchemaField({
      value: new fields.NumberField({ initial: 10, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 10, min: 0, integer: true })
    });
    schema.power = new fields.SchemaField({
      value: new fields.NumberField({ initial: 5, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 5, min: 0, integer: true })
    });
    schema.attributes = new fields.SchemaField({
      level: new fields.SchemaField({
        value: new fields.NumberField({ initial: 1, min: 1, integer: true })
      })
    });

    return schema;
  }

  /**
   * Compute all character derived data: skills, rank, XP, modifiers, movement.
   * Replaces actor.mjs _prepareCharacterData().
   */
  prepareDerivedData() {
    const actor = this.parent;

    // Initialize defaults
    if (!this.fatePoints) this.fatePoints = { value: 0, max: 0 };
    if (this.renown === undefined) this.renown = 0;

    // Load skills dynamically from JSON
    this.skills = SkillLoader.loadSkills(this.skills);

    // Calculate rank and XP
    this.rank = XPCalculator.calculateRank(this.xp?.total || this.xp);
    const spentXP = XPCalculator.calculateSpentXP(actor);

    if (typeof this.xp === 'object') {
      this.xp.spent = spentXP;
      this.xp.available = (this.xp.total || XPCalculator.STARTING_XP) - spentXP;
    }

    // Collect and apply modifiers
    const allModifiers = ModifierCollector.collectAllModifiers(actor);
    ModifierCollector.applyCharacteristicModifiers(this.characteristics, allModifiers);

    if (this.skills) {
      ModifierCollector.applySkillModifiers(this.skills, allModifiers);
    }

    this.initiativeBonus = ModifierCollector.applyInitiativeModifiers(allModifiers);
    ModifierCollector.applyWoundModifiers(this.wounds, allModifiers);
    ModifierCollector.applyFatigueModifiers(this.fatigue, this.characteristics?.tg?.mod || 0);
    ModifierCollector.applyArmorModifiers(actor.items, allModifiers);
    ModifierCollector.applyPsyRatingModifiers(this.psyRating, allModifiers);

    // Apply force weapon modifiers AFTER psy rating is computed
    for (const item of actor.items) {
      if (item.type === 'weapon') {
        item.system.applyForceWeaponModifiers();
      }
    }

    // Calculate movement from Agility Bonus
    const agBonus = this.characteristics?.ag?.mod || 0;
    if (!this.movement) this.movement = {};
    ModifierCollector.applyMovementModifiers(this.movement, agBonus, allModifiers);
  }
}
```

## NPC (actor/npc.mjs)

Minimal NPC model.

```javascript
import DeathwatchActorBase from './base-actor.mjs';

const { fields } = foundry.data;

export default class DeathwatchNPC extends DeathwatchActorBase {
  static defineSchema() {
    const schema = super.defineSchema();
    // Future: add NPC-specific fields (CR, threat level, etc.)
    return schema;
  }

  prepareDerivedData() {
    this.xp = (this.cr * this.cr) * 100;
  }
}
```

## Characteristic Helper Method

The `_characteristicFields()` helper eliminates the 9x duplication of the characteristic schema in template.json. Currently template.json repeats this block for ws, bs, str, tg, ag, int, per, wil, fs — 36 lines of identical JSON. The helper reduces this to a single method call per characteristic. The advance sub-fields (simple, intermediate, trained, expert) are inlined directly since they are only ever used as part of a characteristic.

## Skills Field

Skills use `ObjectField` rather than `SchemaField` because:
1. Skills are loaded dynamically from `skills.json` at runtime via `SkillLoader`
2. The skill keys are not known at schema definition time
3. New skills can be added without changing the model

This matches the current behavior where `template.json` defines `"skills": {}` and the actor populates it during `prepareData()`.

## Relationship to actor.mjs

After migration, `DeathwatchActor` becomes a thin shell handling only Document-level concerns:

```javascript
export class DeathwatchActor extends ActorConditionsMixin(Actor) {
  prepareData() {
    super.prepareData();
    // DataModel.prepareDerivedData() called automatically by super
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (data.type === 'character') {
      this.updateSource({ 'prototypeToken.actorLink': true });
    }
  }

  getRollData() {
    const data = super.getRollData();
    this._getCharacterRollData(data);
    this._getNpcRollData(data);
    return data;
  }

  _getCharacterRollData(data) { /* unchanged */ }
  _getNpcRollData(data) { /* unchanged */ }
}
```

`getRollData()` stays on the Document class — it formats data for Foundry's roll formula system, which is a Document-level concern. The DataModel computes the values; the Document exposes them to rolls.
