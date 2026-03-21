# Item Models: All 18 Item Type Definitions

## Overview

Each item type maps to a DataModel class. Below is the complete schema for every type, showing which shared templates it uses and what type-specific fields it adds.

**All types inherit `description`, `book`, `page`, and `modifiers` from `DeathwatchItemBase` automatically.**

## Simple Types (Phase 2 candidates)

### 1. characteristic (item/characteristic.mjs)

**Type-specific fields:** chapter

```javascript
import DeathwatchItemBase from './base-item.mjs';
const { fields } = foundry.data;

export default class DeathwatchCharacteristic extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.chapter = new fields.StringField({ initial: "", blank: true });
    return schema;
  }
}
```

### 2. demeanour (item/demeanour.mjs)

**Type-specific fields:** chapter

```javascript
export default class DeathwatchDemeanour extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.chapter = new fields.StringField({ initial: "", blank: true });
    return schema;
  }
}
```

### 3. trait (item/trait.mjs)

**Type-specific fields:** *(none — base class covers everything)*

```javascript
export default class DeathwatchTrait extends DeathwatchItemBase {
  static defineSchema() {
    return super.defineSchema();
  }
}
```

### 4. armor-history (item/armor-history.mjs)

**Type-specific fields:** *(none — base class covers everything)*

```javascript
export default class DeathwatchArmorHistory extends DeathwatchItemBase {
  static defineSchema() {
    return super.defineSchema();
  }
}
```

### 5. weapon-quality (item/weapon-quality.mjs)

**Composed templates:** key
**Type-specific fields:** value

```javascript
export default class DeathwatchWeaponQuality extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.keyTemplate()
    });
    schema.value = new fields.StringField({ initial: "", blank: true });
    return schema;
  }
}
```

### 6. critical-effect (item/critical-effect.mjs)

**Type-specific fields:** location, damageType, effects

```javascript
export default class DeathwatchCriticalEffect extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.location = new fields.StringField({ initial: "", blank: true });
    schema.damageType = new fields.StringField({ initial: "", blank: true });
    schema.effects = new fields.ArrayField(
      new fields.ObjectField(),
      { initial: [] }
    );
    return schema;
  }
}
```

### 7. implant (item/implant.mjs)

**Composed templates:** equipped, requisition
**Type-specific fields:** summary

```javascript
export default class DeathwatchImplant extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });
    schema.summary = new fields.StringField({ initial: "", blank: true });
    return schema;
  }
}
```

### 8. cybernetic (item/cybernetic.mjs)

**Composed templates:** equipped, requisition

```javascript
export default class DeathwatchCybernetic extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });
    return schema;
  }
}
```

## Medium Complexity Types (Phase 3 candidates)

### 9. gear (item/gear.mjs)

**Composed templates:** equipped, requisition
**Type-specific fields:** shortDescription, wt

```javascript
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

### 10. ammunition (item/ammunition.mjs)

**Composed templates:** capacity, requisition
**Type-specific fields:** quantity

```javascript
export default class DeathwatchAmmunition extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.capacityTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });
    schema.quantity = new fields.NumberField({ initial: 1, min: 0, integer: true });
    return schema;
  }
}
```

### 11. talent (item/talent.mjs)

**Type-specific fields:** prerequisite, benefit, cost, stackable, subsequentCost, compendiumId
**Derived data:** compendiumId auto-population, effectiveCost calculation

```javascript
export default class DeathwatchTalent extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.prerequisite = new fields.StringField({ initial: "", blank: true });
    schema.benefit = new fields.StringField({ initial: "", blank: true });
    schema.cost = new fields.NumberField({ initial: -1, integer: true });
    schema.stackable = new fields.BooleanField({ initial: false });
    schema.subsequentCost = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.compendiumId = new fields.StringField({ initial: "", blank: true });
    return schema;
  }

  prepareDerivedData() {
    if (!this.compendiumId && this.parent?._id?.startsWith('tal')) {
      this.compendiumId = this.parent._id;
    }

    const actor = this.parent?.actor;
    if (!actor) {
      this.effectiveCost = this.cost ?? 0;
      return;
    }

    const chapterId = actor.system.chapterId;
    if (!chapterId) {
      this.effectiveCost = this.cost ?? 0;
      return;
    }

    const chapter = actor.items.get(chapterId);
    if (!chapter?.system?.talentCosts) {
      this.effectiveCost = this.cost ?? 0;
      return;
    }

    const sourceId = this.compendiumId || this.parent._id;
    const chapterCost = chapter.system.talentCosts[sourceId];
    this.effectiveCost = chapterCost !== undefined ? chapterCost : (this.cost ?? 0);
  }
}
```

### 12. weapon-upgrade (item/weapon-upgrade.mjs)

**Composed templates:** key, requisition
**Type-specific fields:** singleShotOnly

```javascript
export default class DeathwatchWeaponUpgrade extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.keyTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });
    schema.singleShotOnly = new fields.BooleanField({ initial: false });
    return schema;
  }
}
```

### 13. psychic-power (item/psychic-power.mjs)

**Composed templates:** key
**Type-specific fields:** action, opposed, range, sustained, cost, class, chapterImg

```javascript
export default class DeathwatchPsychicPower extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.keyTemplate()
    });
    schema.action = new fields.StringField({ initial: "", blank: true });
    schema.opposed = new fields.StringField({ initial: "", blank: true });
    schema.range = new fields.StringField({ initial: "", blank: true });
    schema.sustained = new fields.StringField({ initial: "", blank: true });
    schema.cost = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.class = new fields.StringField({ initial: "", blank: true });
    schema.chapterImg = new fields.StringField({ initial: "", blank: true });
    return schema;
  }
}
```

### 14. special-ability (item/special-ability.mjs)

**Composed templates:** key
**Type-specific fields:** specialty

```javascript
export default class DeathwatchSpecialAbility extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.keyTemplate()
    });
    schema.specialty = new fields.StringField({ initial: "", blank: true });
    return schema;
  }
}
```

## Complex Types (Phase 3 candidates)

### 15. weapon (item/weapon.mjs)

**Composed templates:** equipped, capacity, requisition
**Type-specific fields:** damage, damageType, weaponType, range, rof, dmg, penetration, class, jammed, loadedAmmo, attachedQualities, attachedUpgrades, doublesStrengthBonus

```javascript
export default class DeathwatchWeapon extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.capacityTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });

    schema.damage = new fields.StringField({ initial: "1d10", blank: true });
    schema.damageType = new fields.StringField({ initial: "", blank: true });
    schema.weaponType = new fields.StringField({ initial: "", blank: true });
    schema.range = new fields.NumberField({ initial: 0, min: 0, integer: true, nullable: true });
    schema.rof = new fields.StringField({ initial: "S/-/-", blank: true });
    schema.dmg = new fields.StringField({ initial: "1d10", blank: true });
    schema.penetration = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.class = new fields.StringField({ initial: "", blank: true });
    schema.jammed = new fields.BooleanField({ initial: false });
    schema.loadedAmmo = new fields.StringField({ initial: null, nullable: true });
    schema.attachedQualities = new fields.ArrayField(
      new fields.ObjectField(), // Supports both string and {id, value} formats
      { initial: [] }
    );
    schema.attachedUpgrades = new fields.ArrayField(
      new fields.ObjectField(),
      { initial: [] }
    );
    schema.doublesStrengthBonus = new fields.BooleanField({ initial: false });

    return schema;
  }

  prepareDerivedData() {
    const actor = this.parent?.actor;
    if (!actor) return;

    if (Array.isArray(this.attachedUpgrades)) {
      this._applyWeaponUpgradeModifiers(actor);
    }

    if (this.loadedAmmo) {
      this._applyAmmunitionModifiers(actor);
    }

    // Force weapon modifiers are applied from DeathwatchCharacter.prepareDerivedData()
    // after psy rating is computed — not here. See 04-actor-models.md.
  }

  /**
   * Called from DeathwatchCharacter.prepareDerivedData() after psy rating is computed.
   */
  applyForceWeaponModifiers() {
    if (!this.attachedQualities?.includes('force')) return;
    const psyRating = this.parent?.actor?.system?.psyRating?.value || 0;
    if (psyRating <= 0) return;
    const baseDmg = this.effectiveDamage || this.dmg;
    const basePen = parseInt(this.effectivePenetration ?? this.penetration ?? 0);
    if (baseDmg) this.effectiveDamage = `${baseDmg} +${psyRating}`;
    this.effectivePenetration = basePen + psyRating;
  }

  // _applyWeaponUpgradeModifiers(actor) and _applyAmmunitionModifiers(actor)
  // move here from item.mjs — identical logic with updated access patterns.
  // See 08-derived-data.md for full method bodies.
}
```

**Note on `range` field:** Currently stores `0` for melee and numeric values for ranged, but some weapons use string ranges like "SBx3". The `nullable: true` allows this flexibility. May need `StringField` if non-numeric ranges are common.

**Note on `attachedQualities`:** Stores mixed types (strings and objects). Using `ObjectField` in the array preserves backward compatibility. A future enhancement could use a union type or custom field.

### 16. armor (item/armor.mjs)

**Composed templates:** equipped, requisition
**Type-specific fields:** body, head, left_arm, right_arm, left_leg, right_leg, effects, armorEffects, attachedHistories

```javascript
export default class DeathwatchArmor extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });

    // Location-based armor values
    schema.body = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.head = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.left_arm = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.right_arm = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.left_leg = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.right_leg = new fields.NumberField({ initial: 0, min: 0, integer: true });

    schema.effects = new fields.StringField({ initial: "", blank: true });
    schema.armorEffects = new fields.ArrayField(
      new fields.ObjectField(),
      { initial: [] }
    );
    schema.attachedHistories = new fields.ArrayField(
      new fields.StringField(),
      { initial: [] }
    );

    return schema;
  }
}
```

### 17. chapter (item/chapter.mjs)

**Type-specific fields:** skillCosts, talentCosts

```javascript
export default class DeathwatchChapter extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.skillCosts = new fields.ObjectField({ initial: {} });
    schema.talentCosts = new fields.ObjectField({ initial: {} });
    return schema;
  }
}
```

**Note:** `skillCosts` and `talentCosts` are dynamic key-value maps. `ObjectField` is the correct choice here — it allows arbitrary keys without predefined schema, matching the current behavior.

### 18. specialty (item/specialty.mjs)

**Type-specific fields:** hasPsyRating, talentCosts, skillCosts, characteristicCosts, rankCosts

```javascript
export default class DeathwatchSpecialty extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();

    schema.hasPsyRating = new fields.BooleanField({ initial: false });
    schema.talentCosts = new fields.ObjectField({ initial: {} });
    schema.skillCosts = new fields.ObjectField({ initial: {} });

    // Characteristic advance costs per characteristic
    const advanceCostFields = () => new fields.SchemaField({
      simple: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      intermediate: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      trained: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      expert: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });

    schema.characteristicCosts = new fields.SchemaField({
      ws: advanceCostFields(), bs: advanceCostFields(),
      str: advanceCostFields(), tg: advanceCostFields(),
      ag: advanceCostFields(), int: advanceCostFields(),
      per: advanceCostFields(), wil: advanceCostFields(),
      fs: advanceCostFields()
    });

    // Rank costs: dynamic per-rank overrides
    schema.rankCosts = new fields.ObjectField({ initial: {
      "1": { skills: {}, talents: {} },
      "2": { skills: {}, talents: {} },
      "3": { skills: {}, talents: {} },
      "4": { skills: {}, talents: {} },
      "5": { skills: {}, talents: {} },
      "6": { skills: {}, talents: {} },
      "7": { skills: {}, talents: {} },
      "8": { skills: {}, talents: {} }
    }});

    return schema;
  }
}
```

## Type-to-Class Mapping Summary

All types inherit `description`, `book`, `page`, and `modifiers` from `DeathwatchItemBase`. The "Composed templates" column shows additional opt-in templates.

| template.json type | DataModel class | Composed templates | Type-specific fields |
|--------------------|-----------------|-------------------|---------------------|
| weapon | DeathwatchWeapon | equipped, capacity, requisition | damage, damageType, weaponType, range, rof, dmg, penetration, class, jammed, loadedAmmo, attachedQualities, attachedUpgrades, doublesStrengthBonus |
| armor | DeathwatchArmor | equipped, requisition | body, head, left_arm, right_arm, left_leg, right_leg, effects, armorEffects, attachedHistories |
| armor-history | DeathwatchArmorHistory | *(none)* | *(none)* |
| gear | DeathwatchGear | equipped, requisition | shortDescription, wt |
| ammunition | DeathwatchAmmunition | capacity, requisition | quantity |
| characteristic | DeathwatchCharacteristic | *(none)* | chapter |
| demeanour | DeathwatchDemeanour | *(none)* | chapter |
| critical-effect | DeathwatchCriticalEffect | *(none)* | location, damageType, effects |
| talent | DeathwatchTalent | *(none)* | prerequisite, benefit, cost, stackable, subsequentCost, compendiumId |
| trait | DeathwatchTrait | *(none)* | *(none)* |
| specialty | DeathwatchSpecialty | *(none)* | hasPsyRating, talentCosts, skillCosts, characteristicCosts, rankCosts |
| chapter | DeathwatchChapter | *(none)* | skillCosts, talentCosts |
| implant | DeathwatchImplant | equipped, requisition | summary |
| cybernetic | DeathwatchCybernetic | equipped, requisition | *(none)* |
| weapon-quality | DeathwatchWeaponQuality | key | value |
| weapon-upgrade | DeathwatchWeaponUpgrade | key, requisition | singleShotOnly |
| psychic-power | DeathwatchPsychicPower | key | action, opposed, range, sustained, cost, class, chapterImg |
| special-ability | DeathwatchSpecialAbility | key | specialty |
