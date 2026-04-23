# Modifier System

## Overview

**Two modifier systems exist:**
- **System Modifiers** (`actor.system.modifiers` array) — Custom Deathwatch modifier system, displayed in Effects tab > Modifiers section
- **Active Effects** (`actor.effects` collection) — Foundry core system, NOT currently displayed in UI (prepared but not rendered)

For characteristic damage and manual modifiers, use System Modifiers. They integrate with the modifier-collector and show in the Effects tab.

---

## Modifier Schema

Items, talents, chapters, and traits can modify character attributes via the `modifier` field:

```json
{
  "modifier": 5,
  "effectType": "characteristic",
  "valueAffected": "str",
  "enabled": true
}
```

---

## Effect Types

- `characteristic` — +5 STR, +10 BS, etc. (applied pre-multiplier)
- `characteristic-post-multiplier` — Applied after Unnatural Characteristic multiplier
- `skill` — +10 to Awareness, +20 to Command, etc.
- `initiative` — Initiative bonus
- `wounds` — Max wounds adjustment
- `armor` — Armor bonus (all locations or specific location)
- `psy-rating` — Psy Rating modifier
- `movement` — Half/Full/Charge/Run movement modifier
- `movement-restriction` — Sets max movement type (e.g., "half" restricts to Half Action moves)
- `psychic-test` — Modifier to Focus Power tests
- `no-perils` — Suppresses Perils of the Warp (e.g., Psychic Hood)

---

## Modifier Collection and Application

**Two modifier collection systems exist:**

1. **ModifierCollector** (`src/module/helpers/character/modifier-collector.mjs`)
   - For actor-level modifiers (characteristics, skills, wounds, armor, movement, psy rating)
   - Collected once per `prepareDerivedData()` call
   - Sources: actor.system.modifiers, item modifiers (always-active), active effects

2. **WeaponModifierCollector** (`src/module/helpers/combat/weapon-modifier-collector.mjs`)
   - For weapon-specific modifiers (damage, penetration, range, righteous fury, etc.)
   - Collected per attack (context-dependent)
   - Sources: weapon.system.modifiers, attached upgrades, loaded ammunition

**Performance optimization**: Actor data models convert `actor.items` Map to Array once at the start of `prepareDerivedData()` and pass the array to all modifier methods. This eliminates redundant Map→Array conversions (previously 3+ per update, now only 1), providing ~3x performance improvement. Both collector classes accept Map or Array for backward compatibility.

---

## Weapon Modifier Collection

**Location**: `src/module/helpers/combat/weapon-modifier-collector.mjs`

For weapon-specific modifiers (damage, penetration, range, etc.), use `WeaponModifierCollector` instead of `ModifierCollector`.

**Why separate?**
- **Different lifecycle**: Actor modifiers collected once per update, weapon modifiers collected per attack
- **Different sources**: Weapon + upgrades + ammo (context-dependent)
- **Different context**: Attack context affects which modifiers apply (single-shot vs auto-fire)

### Usage

```javascript
import { WeaponModifierCollector } from '../helpers/combat/weapon-modifier-collector.mjs';

// Collect all weapon-related modifiers
const weaponMods = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {
  isSingleShot: true,
  isAutoFire: false
});

// Structured output (grouped by effect type)
console.log(weaponMods.damage);           // weapon-damage modifiers
console.log(weaponMods.penetration);      // weapon-penetration modifiers
console.log(weaponMods.characteristic);   // characteristic modifiers (BS bonuses from upgrades)
console.log(weaponMods.righteousFury);    // righteous-fury-threshold modifiers
console.log(weaponMods.magnitudeBonus);   // magnitude-bonus-damage modifiers
console.log(weaponMods.characteristicDamage);  // characteristic-damage effect (or null)
console.log(weaponMods.ignoresNaturalArmor);   // boolean flag
console.log(weaponMods.prematureDetonation);   // { threshold: 101, source: null }
```

### Context-Aware Filtering

Some modifiers only apply in specific contexts:

- **Motion Predictor** (`requiresAutoFire: true`): Only active during semi-auto/full-auto attacks
- **Single-shot upgrades** (`singleShotOnly: true`): Only active when `roundsFired === 1`

Pass context object to enable filtering:

```javascript
// Single shot attack - Motion Predictor won't be collected
const singleShotMods = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {
  isSingleShot: true,
  isAutoFire: false
});

// Full-auto attack - Motion Predictor WILL be collected
const fullAutoMods = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {
  isSingleShot: false,
  isAutoFire: true
});
```

### Collected Sources

`WeaponModifierCollector` collects modifiers from three sources:

1. **Weapon's own modifiers** (`weapon.system.modifiers`)
2. **Attached upgrades** (`weapon.system.attachedUpgrades` → `upgrade.system.modifiers`)
3. **Loaded ammunition** (`weapon.system.loadedAmmo` → `ammo.system.modifiers`)

All modifiers include a `source` field identifying which item provided the modifier.

### Migration from WeaponUpgradeHelper

**Old pattern** (deprecated):

```javascript
const upgradeModifiers = await WeaponUpgradeHelper.getModifiers(weapon, isSingleShot, isAutoFire);
const bsBonus = upgradeModifiers
  .filter(m => m.effectType === 'characteristic' && m.valueAffected === 'bs')
  .reduce((sum, m) => sum + parseInt(m.modifier), 0);
```

**New pattern** (recommended):

```javascript
const weaponMods = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, { isSingleShot, isAutoFire });
const bsBonus = weaponMods.characteristic
  .filter(m => m.valueAffected === 'bs')
  .reduce((sum, m) => sum + parseInt(m.modifier), 0);
```

**Benefits**:
- Collects weapon + upgrade + ammo modifiers in one pass
- Pre-grouped by effect type (no filter needed for most cases)
- Consistent with ModifierCollector pattern
- Easier to test and maintain

---

## Cybernetics System

**Location**: `src/module/helpers/cybernetic-helper.mjs`, `src/module/data/item/cybernetic.mjs`

Cybernetics can provide characteristic replacements (e.g., servo-arm replaces natural Strength). This is different from characteristic modifiers — the cybernetic provides a fixed value that completely replaces the natural characteristic.

### Cybernetic Item Fields

- `replacesCharacteristic` — "str", "ag", etc. (which characteristic is replaced)
- `replacementValue` — Fixed characteristic value (e.g., 75 for standard servo-arm)
- `unnaturalMultiplier` — Unnatural characteristic multiplier (e.g., 2 for Unnatural Strength x2)
- `replacementLabel` — Display name for UI (e.g., "Servo-Arm")
- `canBeModified` — Whether the replacement value can be affected by other modifiers (usually false)

### Weapon-Cybernetic Linking

Weapons can reference a cybernetic item via `weapon.system.cyberneticSource` (item ID). When set:

- Weapon damage rolls automatically use the cybernetic's strength bonus instead of character's natural strength
- Example: Servo-arm weapon has `dmg: "2d10+SBx2"` and `cyberneticSource: "cyb000000001"`
- When attacking with the weapon, system uses servo-arm's Str 75 (SB 14) instead of character's natural strength

### Characteristic Test Flow

1. Player clicks characteristic to roll a test (e.g., Strength test)
2. System checks for equipped cybernetics with `replacesCharacteristic: "str"`
3. If found, dialog shows source selector:
   - "Natural Strength (40) - Bonus: 4"
   - "Servo-Arm (75, Unnatural x2) - Bonus: 14"
4. Player selects source, roll proceeds with chosen value

### Example: Astartes Servo-Arm

```json
{
  "type": "cybernetic",
  "system": {
    "equipped": true,
    "replacesCharacteristic": "str",
    "replacementValue": 75,
    "unnaturalMultiplier": 2,
    "replacementLabel": "Servo-Arm",
    "canBeModified": false
  }
}
```

Exceptional craftsmanship is handled by creating a separate compendium entry with different values (e.g., Str 85 instead of 75).

---

_The modifier protocols are sanctified._ ⚙️
