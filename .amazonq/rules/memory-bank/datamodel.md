# TypeDataModel System

## Overview
All document types use Foundry v13's programmatic `TypeDataModel` classes. Schemas are defined in code with proper field types, shared templates via composition, and derived data logic co-located with the data it operates on.

All 17 item types and 2 actor types have registered DataModels. `template.json` contains only type lists (no field definitions).

## Class Hierarchy

```
foundry.abstract.TypeDataModel
  └── DeathwatchDataModel (base-document.mjs)
        ├── DeathwatchActorBase (actor/base-actor.mjs)  ← polymorphic combat methods
        │     ├── DeathwatchCharacter (actor/character.mjs)  ← most complex actor, full prepareDerivedData()
        │     ├── DeathwatchNPC (actor/npc.mjs)
        │     └── DeathwatchEnemy (actor/enemy.mjs)  ← full characteristics, skills, psy rating, movement
        │           └── DeathwatchHorde (actor/horde.mjs)  ← magnitude-based, overrides combat methods
        └── DeathwatchItemBase (item/base-item.mjs)
              ├── DeathwatchGear (item/gear.mjs)
              ├── DeathwatchDemeanour (item/demeanour.mjs)
              ├── DeathwatchTrait (item/trait.mjs)
              ├── DeathwatchArmorHistory (item/armor-history.mjs)
              ├── DeathwatchWeaponQuality (item/weapon-quality.mjs)
              ├── DeathwatchCriticalEffect (item/critical-effect.mjs)
              ├── DeathwatchImplant (item/implant.mjs)
              ├── DeathwatchCybernetic (item/cybernetic.mjs)
              ├── DeathwatchTalent (item/talent.mjs)  ← first item model with prepareDerivedData()
              ├── DeathwatchAmmunition (item/ammunition.mjs)
              ├── DeathwatchWeaponUpgrade (item/weapon-upgrade.mjs)
              ├── DeathwatchPsychicPower (item/psychic-power.mjs)
              ├── DeathwatchSpecialAbility (item/special-ability.mjs)
              ├── DeathwatchArmor (item/armor.mjs)
              ├── DeathwatchChapter (item/chapter.mjs)
              ├── DeathwatchSpecialty (item/specialty.mjs)
              └── DeathwatchWeapon (item/weapon.mjs)  ← most complex item, migrateData + prepareDerivedData
```

## Shared Templates

Defined as static methods on `DeathwatchDataModel`, composed via spread into `defineSchema()`:

| Template | Fields | Used By |
|----------|--------|---------|
| `equippedTemplate()` | `equipped` (BooleanField) | weapon, gear, implant, cybernetic |
| `requisitionTemplate()` | `req` (NumberField), `renown` (StringField) | weapon, gear, ammunition, implant, cybernetic |
| `capacityTemplate()` | `capacity` (SchemaField: value, max) | ammunition |
| `keyTemplate()` | `key` (StringField) | weapon-quality, weapon-upgrade, psychic-power, special-ability |

**Note:** `DeathwatchSpecialAbility` has the most fields of any item type after weapon: `specialty`, `modeRequirement`, `requiredRank`, `chapter`, `abilityCategory`, `effect`, `improvements`, `abilityType`, `cohesionCost`, `sustained`, `action`, `chapterImg` (Phase 2+3 additions).

**Note:** Weapons do NOT use `capacityTemplate()`. Weapons use `clip` (StringField) for clip size. Ammunition items use `capacityTemplate()` for tracking current/max rounds.

## Registered Types

All 17 item types registered via `CONFIG.Item.dataModels` and 2 actor types via `CONFIG.Actor.dataModels`:

### Actor Types
| Type Key | DataModel Class | Phase |
|----------|----------------|-------|
| character | DeathwatchCharacter | 4 |
| npc | DeathwatchNPC | 4 |
| enemy | DeathwatchEnemy | 4 |
| horde | DeathwatchHorde | 4 |

### Item Types
| Type Key | DataModel Class | Phase |
|----------|----------------|-------|
| gear | DeathwatchGear | 1 |
| demeanour | DeathwatchDemeanour | 2 |
| trait | DeathwatchTrait | 2 |
| armor-history | DeathwatchArmorHistory | 2 |
| weapon-quality | DeathwatchWeaponQuality | 2 |
| critical-effect | DeathwatchCriticalEffect | 2 |
| implant | DeathwatchImplant | 2 |
| cybernetic | DeathwatchCybernetic | 2 |
| talent | DeathwatchTalent | 3a |
| ammunition | DeathwatchAmmunition | 3b |
| weapon-upgrade | DeathwatchWeaponUpgrade | 3b |
| psychic-power | DeathwatchPsychicPower | 3b |
| special-ability | DeathwatchSpecialAbility | 3b |
| armor | DeathwatchArmor | 3c |
| chapter | DeathwatchChapter | 3c |
| specialty | DeathwatchSpecialty | 3c |
| weapon | DeathwatchWeapon | 3d |

## Field Types Used

From `foundry.data.fields`:
- `StringField` — text values (names, keys, descriptions, clip, range, dmgType)
- `NumberField` — numeric values (costs, weights, armor values, penetration)
- `BooleanField` — toggles (equipped, jammed, stackable)
- `ArrayField` — collections (modifiers, qualities, effects)
- `ObjectField` — dynamic key-value maps (skillCosts, talentCosts)
- `SchemaField` — structured sub-objects (capacity: {value, max})
- `HTMLField` — rich text (description)

## Registration Pattern

```javascript
// In deathwatch.mjs init hook:
import * as models from './data/_module.mjs';

CONFIG.Actor.dataModels = {
  character: models.DeathwatchCharacter,
  npc: models.DeathwatchNPC
};

CONFIG.Item.dataModels = {
  gear: models.DeathwatchGear,
  demeanour: models.DeathwatchDemeanour,
  // ... all 17 types
  weapon: models.DeathwatchWeapon
};
```

## Access Patterns

In DataModel `prepareDerivedData()`:
- `this.fieldName` — direct field access (no `.system` prefix)
- `this.parent` — the Item or Actor document
- `this.parent._id` — document ID
- `this.parent.actor` — owning actor (for items)
- Derived values set directly: `this.effectiveCost = 500;` (accessible as `item.system.effectiveCost`)

**CRITICAL**: Derived properties set in `prepareDerivedData()` are NOT included in `toObject()` serialization. Actor sheets must use live item data to access derived values (see Actor Sheet Integration below).

## Test Mocks

`tests/setup.mjs` includes mocks for:
- `foundry.abstract.TypeDataModel` — base class with `defineSchema()`, `migrateData()`, `prepareDerivedData()`
- `foundry.data.fields.*` — all 7 field types as simple classes storing constructor options
- `foundry.utils.mergeObject` — uses `Object.assign` (must mutate in place)

## Derived Data (prepareDerivedData)

### DeathwatchCharacter (Phase 4)
Most complex DataModel overall. Full character derived data computation.

**Schema fields:** 9 characteristics (each with value, base, bonus, damage, advances), biography fields (chapterId, gender, age, etc.), progression (rank, xp, fatePoints, renown), modifiers, conditions, psyRating, skills (ObjectField), legacy fields (health, power, attributes).

**CRITICAL — `base` field on characteristics:** The `base` field MUST be in the schema. The Handlebars template binds user input to `system.characteristics.{{key}}.base`. Without it in the schema, Foundry silently drops the value on save. The `value` field is overwritten by `applyCharacteristicModifiers()` with the computed total.

**prepareDerivedData():**
1. Loads skills via `SkillLoader.loadSkills()`
2. Calculates rank via `XPCalculator.calculateRank()`
3. Calculates spent/available XP via `XPCalculator.calculateSpentXP()`
4. Collects all modifiers via `ModifierCollector.collectAllModifiers()`
5. Applies characteristic modifiers (advances, bonuses, post-multiplier, damage)
6. Applies skill modifiers
7. Applies initiative, wound, fatigue, armor, psy rating modifiers
8. Loops force weapons: `item.system.applyForceWeaponModifiers()` (after psy rating computed)
9. Calculates movement from AG bonus + movement modifiers/restrictions

**Access pattern:** `this.parent` is the Actor document. `this.parent.items` for items, `this.parent.effects` for active effects.

### DeathwatchNPC (Phase 4)
NPC DataModel with characteristics, skills, wounds, and modifiers. Simplified version of DeathwatchCharacter without biography, XP, psy rating, etc.

**Schema fields:** 9 characteristics (same structure as character), skills (ObjectField), modifiers (ArrayField), conditions (ObjectField), description (HTMLField). Inherits wounds and fatigue from base.

**prepareDerivedData():**
1. Loads skills via `SkillLoader.loadSkills()`
2. Collects all modifiers via `ModifierCollector.collectAllModifiers()`
3. Applies characteristic modifiers (advances, bonuses, post-multiplier, damage)
4. Applies skill modifiers
5. Applies initiative, wound, fatigue, armor modifiers
6. Calculates movement from AG bonus + movement modifiers/restrictions

### DeathwatchEnemy (Phase 4)
Enemy DataModel. Same as character but without chapters, specialties, rank, XP, fate points, renown, special abilities, demeanours, past events. Extends DeathwatchActorBase.

**Schema fields:** 9 characteristics (with value, base, bonus, damage, advances), skills (ObjectField), modifiers (ArrayField), conditions (ObjectField), description (HTMLField), biography fields (gender, age, complexion, hair), psyRating (SchemaField: value, base). Overrides `classification` initial to `"xenos"`.

**prepareDerivedData():**
1. Loads skills via `SkillLoader.loadSkills()`
2. Collects all modifiers via `ModifierCollector.collectAllModifiers()`
3. Applies characteristic, skill, initiative, wound, fatigue, armor, psy rating modifiers
4. Applies force weapon modifiers after psy rating is computed
5. Calculates movement from AG bonus + movement modifiers/restrictions

### DeathwatchHorde (Phase 4)
Horde DataModel. Extends DeathwatchEnemy with a single armor value. Wounds fields represent Magnitude instead of individual wounds. Overrides combat methods for horde-specific mechanics.

**Schema fields:** Inherits all from DeathwatchEnemy, plus `armor` (NumberField) — single armor value for all locations.

**Overridden methods:**
- `getArmorValue(_location)`: Returns single `armor` value (ignores location)
- `getDefenses(_location)`: Returns armor, baseMod TB, and unnaturalMultiplier
- `calculateHitsReceived(options)`: Delegates to `HordeCombatHelper.calculateHordeHits()`
- `receiveDamage(options)`: Delegates to `receiveBatchDamage([options])`
- `receiveBatchDamage(hits)`: Applies multiple hits as single magnitude update with summary message

### DeathwatchTalent (Phase 3a)
First item DataModel with `prepareDerivedData()`. Two responsibilities:

1. **compendiumId auto-population**: If `_id` starts with `"tal"` and `compendiumId` is empty, sets `this.compendiumId = this.parent._id`
2. **effectiveCost calculation**: Looks up chapter talent cost overrides from owning actor's chapter item (`actor.items.find(i => i.type === 'chapter')`). Sets `this.effectiveCost` — falls back to `this.cost` if no override.

### DeathwatchWeapon (Phase 3d)
Most complex item DataModel. Has `migrateData()`, `prepareDerivedData()`, and `applyForceWeaponModifiers()`.

**Schema fields:** damage, dmgType, weaponType, range (StringField — supports "100" and "SBx3"), rof, dmg, penetration, class, clip (StringField), reload, jammed, loadedAmmo, attachedQualities (ArrayField of ObjectField), attachedUpgrades, doublesStrengthBonus, wt, plus equipped and requisition templates.

**migrateData():** Populates `clip` from old `capacity.max` for pre-migration weapons.

**prepareDerivedData():** Calls `_applyWeaponUpgradeModifiers()` and `_applyAmmunitionModifiers()`. Sets derived properties: effectiveDamage, effectiveRange, effectiveRof, effectiveBlast, effectivePenetration, effectiveWeight, effectiveFelling.

**applyForceWeaponModifiers():** Called from `DeathwatchCharacter.prepareDerivedData()` after psy rating is computed. Adds psy rating bonus to damage and penetration for Force weapons.

## Data Migration (migrateData)

### DeathwatchWeapon
```javascript
static migrateData(source) {
  if (!source.clip && source.capacity?.max) {
    source.clip = String(source.capacity.max);
  }
  return super.migrateData(source);
}
```
Handles weapons created before the DataModel migration when `template.json` had `capacity: { value, max }` instead of `clip`.

## Actor Sheet Integration

**Problem:** `ActorSheet.getData()` calls `toObject()` which serializes data, losing derived DataModel properties set in `prepareDerivedData()`.

**Solution (Actor system data):** `getData()` uses live actor system data instead of serialized:
```javascript
context.system = { ...this.actor.system };
```
This preserves derived properties like `characteristic.mod`, `movement`, `xp.spent`, `xp.available`, `initiativeBonus`, etc.

**Solution (Item data):** `_prepareItems()` rebuilds `context.items` from live actor items:
```javascript
if (this.actor?.items?.map) {
  context.items = this.actor.items.map(i => ({
    ...i.toObject(false),
    system: { ...i.system }
  }));
}
```
This preserves derived properties like `effectiveDamage`, `effectiveRange`, etc.

**CRITICAL:** Both solutions are required. Without the actor system fix, characteristics show as 0. Without the item fix, weapon effective values are missing.

## Weapon Ammo Architecture

**Key distinction:**
- **Weapon `clip`** (StringField): Defines clip size (e.g., "28"). Used to determine if weapon has ammo management. Empty/dash means no ammo tracking.
- **Ammunition `capacity`** (SchemaField: value, max): Tracks actual current/max rounds. Updated during combat when rounds are fired.
- **Weapon `loadedAmmo`** (StringField, nullable): ID of the loaded ammunition item on the actor.

**Ammo management check:** `clip && clip !== '—' && clip !== '-' && clip !== ''`

**Validation:** `validateWeaponForAttack()` in `combat-dialog.mjs` checks `hasAmmoManagement` and loaded ammo's `capacity.value > 0`. Does NOT reference `weapon.system.capacity` (weapons don't have capacity).

## Quality Storage Format

Weapon qualities stored in `attachedQualities` as objects:
```json
[{"id": "tearing"}, {"id": "proven", "value": "3"}]
```

Quality checks use: `.some(q => (typeof q === 'string' ? q : q.id) === key)` for backward compatibility, though new data is always objects.

## Polymorphic Combat Methods

Combat methods are defined on `DeathwatchActorBase` and overridden by specific actor types:

| Method | Base (Character/NPC/Enemy) | Horde |
|--------|---------------------------|-------|
| `getArmorValue(location)` | Location-based from equipped armor | Single `armor` field |
| `getDefenses(location)` | Armor + baseMod TB + unnaturalMultiplier | Same but uses single armor |
| `calculateHitsReceived(options)` | Returns `baseHits` unchanged | Delegates to `HordeCombatHelper` |
| `receiveDamage(options)` | Wound-based with critical damage | Magnitude reduction |
| `canRighteousFury()` | `false` (overridden to `true` in Character) | `false` |

**Key:** `CombatHelper.applyDamage()` and `CombatHelper.weaponDamageRoll()` call `targetActor.system.receiveDamage()` — the correct implementation runs based on actor type.

## Document Classes (Thin Shells)

After DataModel migration, document classes are thin shells:

### actor.mjs
- `prepareData()` — calls super (triggers DataModel `prepareDerivedData()`)
- `_preCreate()` — sets actorLink for characters
- `getRollData()` — builds roll data from characteristics
- No business logic — all moved to `DeathwatchCharacter.prepareDerivedData()`

### item.mjs
- `prepareData()` — calls super (triggers DataModel `prepareDerivedData()`)
- `getRollData()` — builds roll data
- `roll()` — item roll handler
- No business logic — all moved to respective DataModel classes

## Detailed Documentation

Full migration plan with all 17 item types, 2 actor types, derived data movement, and test impact documented in `docs/datamodel/` (files 00-09).
