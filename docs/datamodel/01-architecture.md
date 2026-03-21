# Architecture: Target File Structure & Class Hierarchy

## Directory Structure

```
src/module/data/
├── _module.mjs                    # Barrel export for all models
├── base-document.mjs              # Root base class (extends TypeDataModel)
├── actor/
│   ├── base-actor.mjs             # Shared actor fields (wounds, fatigue)
│   ├── character.mjs              # Character-specific (characteristics, skills, xp)
│   └── npc.mjs                    # NPC-specific (minimal)
└── item/
    ├── base-item.mjs              # Shared item fields (description) + template methods
    ├── weapon.mjs                 # Weapon fields + derived data
    ├── armor.mjs                  # Location-based armor
    ├── armor-history.mjs          # Armor history modifiers
    ├── gear.mjs                   # General equipment
    ├── ammunition.mjs             # Ammo with capacity/modifiers
    ├── characteristic.mjs         # Chapter characteristic items
    ├── demeanour.mjs              # Demeanour items
    ├── critical-effect.mjs        # Critical effect definitions
    ├── talent.mjs                 # Talents with costs/prerequisites
    ├── trait.mjs                  # Traits with modifiers
    ├── specialty.mjs              # Specialty with rank costs
    ├── chapter.mjs                # Chapter with skill/talent costs
    ├── implant.mjs                # Biological implants
    ├── cybernetic.mjs             # Mechanical augmentations
    ├── weapon-quality.mjs         # Weapon quality definitions
    ├── weapon-upgrade.mjs         # Weapon upgrade attachments
    ├── psychic-power.mjs          # Psychic power definitions
    └── special-ability.mjs        # Special ability definitions
```

## Class Hierarchy

```
foundry.abstract.TypeDataModel
└── DeathwatchDataModel (base-document.mjs)
    ├── DeathwatchActorBase (actor/base-actor.mjs)
    │   ├── DeathwatchCharacter (actor/character.mjs)
    │   └── DeathwatchNPC (actor/npc.mjs)
    └── DeathwatchItemBase (item/base-item.mjs)
        ├── DeathwatchWeapon (item/weapon.mjs)
        ├── DeathwatchArmor (item/armor.mjs)
        ├── DeathwatchArmorHistory (item/armor-history.mjs)
        ├── DeathwatchGear (item/gear.mjs)
        ├── DeathwatchAmmunition (item/ammunition.mjs)
        ├── DeathwatchCharacteristic (item/characteristic.mjs)
        ├── DeathwatchDemeanour (item/demeanour.mjs)
        ├── DeathwatchCriticalEffect (item/critical-effect.mjs)
        ├── DeathwatchTalent (item/talent.mjs)
        ├── DeathwatchTrait (item/trait.mjs)
        ├── DeathwatchSpecialty (item/specialty.mjs)
        ├── DeathwatchChapter (item/chapter.mjs)
        ├── DeathwatchImplant (item/implant.mjs)
        ├── DeathwatchCybernetic (item/cybernetic.mjs)
        ├── DeathwatchWeaponQuality (item/weapon-quality.mjs)
        ├── DeathwatchWeaponUpgrade (item/weapon-upgrade.mjs)
        ├── DeathwatchPsychicPower (item/psychic-power.mjs)
        └── DeathwatchSpecialAbility (item/special-ability.mjs)
```

## Base Class Pattern

```javascript
// base-document.mjs
const { fields } = foundry.data;

export default class DeathwatchDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {};
  }
}
```

Every model class follows this pattern:
1. Extend parent class
2. Override `static defineSchema()` calling `super.defineSchema()`
3. Merge in shared templates via static methods
4. Add type-specific fields
5. Optionally override `prepareDerivedData()` for computed values

**Types with `prepareDerivedData()`:**
- `DeathwatchWeapon` — weapon upgrade, ammunition, and force weapon modifiers
- `DeathwatchTalent` — compendiumId auto-population, effectiveCost calculation
- `DeathwatchCharacter` — skills, XP, rank, all modifier types, movement, force weapon orchestration
- `DeathwatchNPC` — XP calculation

## Relationship to Existing Code

### Before (current)
```
template.json  →  defines all fields statically
item.mjs       →  DeathwatchItem.prepareData() handles ALL item types
actor.mjs      →  DeathwatchActor.prepareDerivedData() handles ALL actor types
```

### After (target)
```
data/item/weapon.mjs     →  defines weapon fields + weapon-specific derived data
data/item/talent.mjs     →  defines talent fields + compendiumId/effectiveCost
data/actor/character.mjs →  defines character fields + skills/XP/modifiers/movement
data/actor/npc.mjs       →  defines NPC fields + NPC derived data
item.mjs                 →  thin shell: prepareData() calls super, getRollData(), roll()
actor.mjs                →  thin shell: prepareData() calls super, _preCreate(), getRollData()
```

The Document classes (`item.mjs`, `actor.mjs`) still exist but become thin shells — they handle Foundry lifecycle hooks (`_preCreate`, `getRollData`) and delegate all data concerns to the models.

## Key Design Decisions

### 1. One file per type
Each item/actor type gets its own file. This keeps files small and focused.

### 2. Shared templates as static methods
Common field groups (book/page, modifiers, equipped) are static methods on base classes, composed via spread operator — identical to Starfinder's approach.

### 3. Gradual migration
Types can be migrated one at a time. Foundry supports mixed mode: types with a DataModel use the model, types without fall back to template.json.

### 4. Field paths unchanged
`system.dmg`, `system.penetration`, `system.characteristics.ws.value` — all paths remain identical. No template or sheet changes needed.
