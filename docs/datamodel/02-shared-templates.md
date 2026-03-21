# Shared Templates: Reusable Field Compositions

## Overview

These static methods replace the duplicated fields currently scattered across template.json. Each method returns a plain object of field definitions that can be spread into any model's schema.

`book`, `page`, and `modifiers` are **not** templates — they live directly on `DeathwatchItemBase` so every item type inherits them automatically:
- Every piece of data in the Deathwatch system traces back to a rulebook and page number.
- Modifiers are a core mechanic — any item could potentially modify actor stats.

## Fields on DeathwatchItemBase (inherited by ALL item types)

| Field | Type | Purpose |
|-------|------|---------|
| `description` | HTMLField | Item description text |
| `book` | StringField | Source rulebook name |
| `page` | StringField | Page number reference |
| `modifiers` | ArrayField(ObjectField) | Modifier array for actor stat modifications |

## Opt-In Templates (composed per type)

| Template | Fields | Used By |
|----------|--------|---------|
| `equippedTemplate()` | `equipped: false` | weapon, armor, gear, implant, cybernetic (5 types) |
| `requisitionTemplate()` | `req: 0`, `renown: ""` | weapon, armor, gear, ammunition, implant, cybernetic, weapon-upgrade (7 types) |
| `capacityTemplate()` | `capacity: { value, max }` | weapon, ammunition (2 types) |
| `keyTemplate()` | `key: ""` | weapon-quality, weapon-upgrade, psychic-power, special-ability (4 types) |

## Template Definitions

### DeathwatchDataModel (base-document.mjs)

```javascript
const { fields } = foundry.data;

export default class DeathwatchDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {};
  }

  /**
   * Equipped toggle for wearable/usable items
   * Used by: 5 item types
   */
  static equippedTemplate() {
    return {
      equipped: new fields.BooleanField({ initial: false })
    };
  }

  /**
   * Requisition and renown requirements
   * Used by: weapon, armor, gear, ammunition, implant, cybernetic, weapon-upgrade
   */
  static requisitionTemplate() {
    return {
      req: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      renown: new fields.StringField({ initial: "", blank: true })
    };
  }

  /**
   * Capacity fields (current/max) for ammo and weapons
   * Used by: weapon, ammunition
   */
  static capacityTemplate() {
    return {
      capacity: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
        max: new fields.NumberField({ initial: 0, min: 0, integer: true })
      })
    };
  }

  /**
   * Key field for lookup-based items
   * Used by: weapon-quality, weapon-upgrade, psychic-power, special-ability
   */
  static keyTemplate() {
    return {
      key: new fields.StringField({ initial: "", blank: true })
    };
  }
}
```

### DeathwatchItemBase (item/base-item.mjs)

`description`, `book`, `page`, and `modifiers` are defined here — **every item type inherits them automatically**.

```javascript
import DeathwatchDataModel from '../base-document.mjs';

const { fields } = foundry.data;

export default class DeathwatchItemBase extends DeathwatchDataModel {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.description = new fields.HTMLField({ initial: "", blank: true });
    schema.book = new fields.StringField({ initial: "", blank: true });
    schema.page = new fields.StringField({ initial: "", blank: true });
    schema.modifiers = new fields.ArrayField(
      new fields.ObjectField(),
      { initial: [] }
    );
    return schema;
  }
}
```

## Usage Pattern

Item models get `description`, `book`, `page`, and `modifiers` for free. They only compose the optional templates they need:

```javascript
// Example: gear.mjs — needs equipped + requisition
import DeathwatchItemBase from './base-item.mjs';

const { fields } = foundry.data;

export default class DeathwatchGear extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();

    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });

    schema.shortDescription = new fields.StringField({ initial: "", blank: true });
    schema.wt = new fields.NumberField({ initial: 0, min: 0 });

    return schema;
  }
}
```

```javascript
// Example: trait.mjs — needs nothing extra, base class covers it all
import DeathwatchItemBase from './base-item.mjs';

export default class DeathwatchTrait extends DeathwatchItemBase {
  static defineSchema() {
    return super.defineSchema();
  }
}
```

## Template Inheritance Chain

```
DeathwatchDataModel
  └── equippedTemplate(), requisitionTemplate(),
      capacityTemplate(), keyTemplate()

DeathwatchItemBase extends DeathwatchDataModel
  └── adds: description, book, page, modifiers  (ALL items get these)

DeathwatchGear extends DeathwatchItemBase
  └── composes: equippedTemplate + requisitionTemplate
      adds: shortDescription, wt
      inherits: description, book, page, modifiers (from base)

DeathwatchTrait extends DeathwatchItemBase
  └── inherits everything from base, adds nothing
```

## Modifier Object Shape

The `modifiers` array stores plain objects. We do NOT use `EmbeddedDataField` for modifiers (unlike Starfinder) because our modifiers are simple data bags without their own lifecycle:

```javascript
// Each modifier in the array looks like:
{
  name: "Chapter Bonus",
  modifier: 5,
  effectType: "characteristic",
  valueAffected: "str",
  enabled: true,
  // Optional fields depending on effectType:
  weaponClass: "heavy",
  qualityException: "stalker-pattern",
  source: "Storm Wardens"
}
```

Using `ObjectField` keeps this flexible and backward-compatible. If we later want stricter validation on modifiers, we can create a `DeathwatchModifier` DataModel and switch to `EmbeddedDataField` — but that's a separate future enhancement.

## Benefits Over template.json

| Aspect | template.json | DataModel Approach |
|--------|--------------|------------------|
| Add book/page/modifiers to new type | Copy fields manually | Automatic — inherited from `DeathwatchItemBase` |
| Change modifier default | Edit 18 places | Edit 1 base class |
| Add new universal field | Edit 18 types | Add to `DeathwatchItemBase` |
| Validation | None | Per-field constraints |
| Documentation | External only | JSDoc on methods |
