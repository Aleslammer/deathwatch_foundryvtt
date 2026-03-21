# Registration: Wiring Models into deathwatch.mjs

## Overview

DataModels are registered on `CONFIG.Actor.dataModels` and `CONFIG.Item.dataModels` during the `init` hook. This tells Foundry to use the model class for constructing `system` data instead of reading from template.json.

## Barrel Export (_module.mjs)

```javascript
// src/module/data/_module.mjs

// Actors
export { default as DeathwatchCharacter } from './actor/character.mjs';
export { default as DeathwatchNPC } from './actor/npc.mjs';

// Items
export { default as DeathwatchWeapon } from './item/weapon.mjs';
export { default as DeathwatchArmor } from './item/armor.mjs';
export { default as DeathwatchArmorHistory } from './item/armor-history.mjs';
export { default as DeathwatchGear } from './item/gear.mjs';
export { default as DeathwatchAmmunition } from './item/ammunition.mjs';
export { default as DeathwatchCharacteristic } from './item/characteristic.mjs';
export { default as DeathwatchDemeanour } from './item/demeanour.mjs';
export { default as DeathwatchCriticalEffect } from './item/critical-effect.mjs';
export { default as DeathwatchTalent } from './item/talent.mjs';
export { default as DeathwatchTrait } from './item/trait.mjs';
export { default as DeathwatchSpecialty } from './item/specialty.mjs';
export { default as DeathwatchChapter } from './item/chapter.mjs';
export { default as DeathwatchImplant } from './item/implant.mjs';
export { default as DeathwatchCybernetic } from './item/cybernetic.mjs';
export { default as DeathwatchWeaponQuality } from './item/weapon-quality.mjs';
export { default as DeathwatchWeaponUpgrade } from './item/weapon-upgrade.mjs';
export { default as DeathwatchPsychicPower } from './item/psychic-power.mjs';
export { default as DeathwatchSpecialAbility } from './item/special-ability.mjs';
```

## Registration in deathwatch.mjs

Add to the `init` hook, **after** setting `CONFIG.Actor.documentClass` and `CONFIG.Item.documentClass`:

```javascript
// At top of file, add import:
import * as models from './data/_module.mjs';

// Inside Hooks.once('init', ...), after document class registration:

// Register DataModels
CONFIG.Actor.dataModels = {
  character: models.DeathwatchCharacter,
  npc: models.DeathwatchNPC
};

CONFIG.Item.dataModels = {
  weapon: models.DeathwatchWeapon,
  armor: models.DeathwatchArmor,
  "armor-history": models.DeathwatchArmorHistory,
  gear: models.DeathwatchGear,
  ammunition: models.DeathwatchAmmunition,
  characteristic: models.DeathwatchCharacteristic,
  demeanour: models.DeathwatchDemeanour,
  "critical-effect": models.DeathwatchCriticalEffect,
  talent: models.DeathwatchTalent,
  trait: models.DeathwatchTrait,
  specialty: models.DeathwatchSpecialty,
  chapter: models.DeathwatchChapter,
  implant: models.DeathwatchImplant,
  cybernetic: models.DeathwatchCybernetic,
  "weapon-quality": models.DeathwatchWeaponQuality,
  "weapon-upgrade": models.DeathwatchWeaponUpgrade,
  "psychic-power": models.DeathwatchPsychicPower,
  "special-ability": models.DeathwatchSpecialAbility
};
```

**Note:** Hyphenated type names (e.g., `armor-history`) must be quoted as object keys.

## Incremental Registration

During migration, you can register types one at a time. Only types listed in `CONFIG.*.dataModels` use the model; all others fall back to template.json:

```javascript
// Phase 1: Just gear as proof of concept
CONFIG.Item.dataModels = {
  gear: models.DeathwatchGear
};

// Phase 2: Add simple types
CONFIG.Item.dataModels = {
  gear: models.DeathwatchGear,
  trait: models.DeathwatchTrait,
  "armor-history": models.DeathwatchArmorHistory,
  characteristic: models.DeathwatchCharacteristic,
  demeanour: models.DeathwatchDemeanour,
  "critical-effect": models.DeathwatchCriticalEffect,
  implant: models.DeathwatchImplant,
  cybernetic: models.DeathwatchCybernetic,
  "weapon-quality": models.DeathwatchWeaponQuality
};

// ... and so on
```

## template.json Changes

### During Migration (mixed mode)
Keep template.json as-is. Types with DataModels ignore their template.json definition; types without DataModels still use it.

### After Full Migration
template.json can be reduced to just the type lists:

```json
{
  "Actor": {
    "types": ["character", "npc"]
  },
  "Item": {
    "types": [
      "weapon", "armor", "armor-history", "gear", "ammunition",
      "characteristic", "demeanour", "critical-effect", "talent",
      "trait", "specialty", "chapter", "implant", "cybernetic",
      "weapon-quality", "weapon-upgrade", "psychic-power", "special-ability"
    ]
  }
}
```

**Note:** In Foundry v13, even the type lists may be optional if all types are registered via `CONFIG.*.dataModels`. Test this before removing.

## Order of Operations

In the `init` hook, the registration order should be:

```javascript
Hooks.once('init', async function () {
  // 1. Load skills
  await SkillLoader.init();

  // 2. Set up game object
  game.deathwatch = { ... };

  // 3. Register document classes
  CONFIG.Actor.documentClass = DeathwatchActor;
  CONFIG.Item.documentClass = DeathwatchItem;

  // 4. Register data models (NEW)
  CONFIG.Actor.dataModels = { ... };
  CONFIG.Item.dataModels = { ... };

  // 5. Register sheets (unchanged)
  Actors.registerSheet(...);
  Items.registerSheet(...);

  // 6. Everything else (unchanged)
});
```

DataModels must be registered before any documents are created (which happens after `init` completes), but after document classes are set.
