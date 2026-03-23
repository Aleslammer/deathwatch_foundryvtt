# Combat Systems

## Overview
The combat system is split into separate modules for ranged and melee combat, with shared utilities for common operations like hit location determination and damage application.

## Architecture

### Core Combat Files
- **combat.mjs**: Core combat logic and routing
  - Hit location determination
  - Damage application (delegates to actor DataModel via `receiveDamage()`)
  - Righteous Fury handling
  - Weapon attack routing (delegates to ranged/melee)
  - Horde batch damage routing
- **ranged-combat.mjs**: Ranged weapon attack dialog and logic
  - BS-based attack rolls (uses fully computed `bs.value`)
  - Rate of fire (Single/Semi-Auto/Full-Auto)
  - Aim modifiers
  - Range calculation
  - Ammunition tracking
  - Jamming mechanics
  - Horde hit calculation via `calculateHitsReceived()`
- **melee-combat.mjs**: Melee weapon attack dialog and logic
  - WS-based attack rolls (uses fully computed `ws.value`)
  - All Out Attack modifier
  - Charge modifier
  - Called Shot and Running Target penalties
  - Degrees of Success displayed in chat
  - Horde hit calculation via `calculateHitsReceived()`
- **horde-combat.mjs**: Horde-specific combat mechanics
  - Horde hit calculation (blast, flame, melee DoS, ranged)
  - Magnitude reduction per penetrating hit
  - Horde damage bonus dice
- **combat-dialog.mjs**: Pure function helpers for combat calculations
  - Modifier building
  - Hit calculation
  - Damage calculation
  - Jam threshold determination

## Weapon Attack Routing

### weaponAttackDialog(actor, weapon)
Routes to appropriate attack dialog based on weapon class:
```javascript
static async weaponAttackDialog(actor, weapon) {
  const isMelee = weapon.system.class?.toLowerCase().includes('melee');
  if (isMelee) {
    return MeleeCombatHelper.attackDialog(actor, weapon);
  }
  return RangedCombatHelper.attackDialog(actor, weapon);
}
```

**Detection Logic:**
- Checks `weapon.system.class` field
- Case-insensitive check for "melee"
- Defaults to ranged if class is undefined or doesn't contain "melee"

## Characteristic Value Usage

**CRITICAL:** Both ranged and melee combat use the fully computed `characteristics.{ws|bs}.value` from `prepareDerivedData()`. This value includes base + advances + all modifiers (chapter bonuses, gear, Power Armor, etc.).

```javascript
// Correct (current)
const ws = actor.system.characteristics.ws.value || 0;
const bs = actor.system.characteristics.bs.value || 0;
```

Dialog modifiers (aim, charge, etc.) are added on top of this computed value. The modifier clamping range is -60 to +60.

## Ranged Combat

### Attack Dialog Options
- **Aim**: None (0), Half (+10), Full (+20)
- **Rate of Fire**: Single (0), Semi-Auto (+10), Full-Auto (+20)
- **Called Shot**: -20 penalty
- **Running Target**: -20 penalty
- **Misc Modifier**: Custom modifier input
- **Range**: Auto-calculated from token distance

### Range Modifiers
- **Point Blank** (≤2m): +20
- **Short** (<50% range): +10
- **Normal** (50%-200% range): 0
- **Long** (200%-300% range): -10
- **Extreme** (≥300% range): -20

### Jamming
- **Single Fire**: Jams on 96+
- **Semi/Full Auto**: Jams on 94+
- Weapon marked as jammed, requires clearJam() to fix
- Clearing jam removes loaded ammunition

### Ammunition Tracking
- Weapon `clip` field (StringField) determines if ammo management applies
- Ammo management active when: `clip && clip !== '—' && clip !== '-' && clip !== ''`
- Actual round count tracked on loaded ammunition item's `capacity.value`
- Deducts rounds based on rate of fire (Storm/Twin-Linked multiply expenditure)
- Warns when ammunition depleted (capacity.value reaches 0)
- Validates loaded ammo before attack via `validateWeaponForAttack()`
- Rejects attack if no ammo loaded or ammo is empty

### Hit Calculation
```javascript
const hitsTotal = CombatDialogHelper.calculateHits(hitValue, targetNumber, maxHits, autoFire);
// Single Shot: 1 hit only (no additional hits for degrees of success)
// Semi-Auto: 1 + 1 hit per 2 degrees of success
// Full-Auto: 1 + 1 hit per degree of success
// Capped at maxHits (rounds fired)
```

## Melee Combat

### Attack Dialog Options
- **Aim**: None (0), Half (+10), Full (+20)
- **All Out Attack**: +20 bonus
- **Charge**: +10 bonus
- **Called Shot**: -20 penalty
- **Running Target**: -20 penalty
- **Misc Modifier**: Custom modifier input

### Melee Modifiers (constants.mjs)
```javascript
export const MELEE_MODIFIERS = {
  ALL_OUT_ATTACK: 20,
  CHARGE: 10
};
```

### Hit Calculation
```javascript
const modifiers = wsAdv + aim + allOut + charge + calledShot + runningTarget + miscModifier;
const clampedModifiers = Math.max(-60, Math.min(60, modifiers));
const targetNumber = ws + clampedModifiers;
const success = hitValue <= targetNumber;
```

**Melee vs Hordes:** When target is a horde, `calculateHitsReceived()` is called with `isMelee: true` and `degreesOfSuccess`. Horde returns 1 hit per 2 DoS (min 1), +1 for Power Field.

**Chat Display:** Melee attacks show hit count (via `buildAttackLabel()`) and Degrees of Success on successful hits.

**Note:** Melee attacks currently result in single hit against non-horde targets (no multiple hits like ranged)

## Shared Combat Logic

### Hit Location Determination
```javascript
static determineHitLocation(attackRoll) {
  // Reverse the d100 roll digits
  // 01-10: Head
  // 11-20: Right Arm
  // 21-30: Left Arm
  // 31-70: Body
  // 71-85: Right Leg
  // 86-00: Left Leg
}
```

### Multiple Hit Locations
For ranged weapons with multiple hits, uses hit pattern tables:
```javascript
static determineMultipleHitLocations(firstLocation, totalHits) {
  // Uses predefined patterns for each body location
  // Alternates arms/legs appropriately
}
```

### Damage Application
```javascript
// Polymorphic — delegates to actor DataModel
static async applyDamage(targetActor, options) {
  return targetActor.system.receiveDamage(options);
}
```

**Character/NPC/Enemy:** Standard wound-based damage with armor, penetration, TB, critical damage.
**Horde:** Magnitude reduction — each penetrating hit reduces magnitude by 1.

### Horde Batch Damage
For horde targets, `weaponDamageRoll()` collects all hit results into an array and calls `receiveBatchDamage()` once:
```javascript
if (isHordeTarget && hordeHitResults.length > 0) {
  await targetToken.actor.system.receiveBatchDamage(hordeHitResults);
}
```
This produces a single summary chat message with hit-by-hit breakdown.
```

### Armor Value Lookup
```javascript
// Polymorphic — delegates to actor DataModel
static getArmorValue(actor, location) {
  return actor.system.getArmorValue(location);
}
```

**Character/NPC/Enemy:** Location-based from equipped armor item.
**Horde:** Single `armor` field (ignores location).

### Righteous Fury
```javascript
static async rollRighteousFury(actor, weapon, targetNumber, hitLocation) {
  // Roll 1d100 confirmation
  // Success if roll <= targetNumber
  // Creates chat message with result
  // Returns true/false for confirmation
}
```

Triggered by natural 10 on damage dice (or 5 on d5).

## Damage Rolling

### weaponDamageRoll(actor, weapon)
Shared damage dialog for both ranged and melee:
- Uses last attack roll data (lastAttackRoll, lastAttackTarget, lastAttackHits)
- Determines hit locations
- Rolls damage for each hit
- Applies degrees of success to first hit
- Adds STR bonus for melee weapons
- Handles Righteous Fury chains
- Creates apply damage buttons for targeted tokens

### Degrees of Success
```javascript
const degreesOfSuccess = Math.floor((targetNumber - attackRoll) / 10);
// Applied to first hit only
// Increases minimum die result
```

## Combat Constants

### From constants.mjs
```javascript
// Ranged Combat
export const AIM_MODIFIERS = {
  NONE: 0,
  HALF: 10,
  FULL: 20
};

export const RATE_OF_FIRE_MODIFIERS = {
  SINGLE: 0,
  SEMI_AUTO: 10,
  FULL_AUTO: 20
};

// Melee Combat
export const MELEE_MODIFIERS = {
  ALL_OUT_ATTACK: 20,
  CHARGE: 10
};

// Shared Penalties
export const COMBAT_PENALTIES = {
  CALLED_SHOT: -20,
  RUNNING_TARGET: -20
};

// Range Modifiers
export const RANGE_MODIFIERS = {
  POINT_BLANK: 20,
  SHORT: 10,
  NORMAL: 0,
  LONG: -10,
  EXTREME: -20
};
```

## Horde Combat

### Overview
Hordes use Magnitude instead of individual wounds. Each hit that penetrates armor+TB reduces Magnitude by 1. Special rules apply for blast, flame, and melee attacks.

### HordeCombatHelper (`horde-combat.mjs`)

**calculateHordeHits(options):**
- **Blast weapons**: Hits = Blast value (+1 for Explosive damage type)
- **Flame weapons**: Hits = ceil(range / 4) + 1d5 (1d5 rolled separately)
- **Melee**: 1 hit per 2 DoS (min 1 on success), +1 for Power Field
- **Ranged (other)**: Uses normal hit count (+1 for Explosive)

**calculateMagnitudeReduction(damage, armor, pen, TB, qualityOptions):**
- Returns 1 if damage > (effective armor + TB), else 0
- Supports Primitive (doubles armor), Razor Sharp (doubles pen at 2+ DoS), Melta (doubles pen)

**calculateHordeDamageBonusDice(magnitude):**
- Horde attacks get bonus d10s based on current magnitude
- floor(magnitude / 10), max 2d10

### Magnitude Bonus Damage (Ammunition)
Ammunition can have `magnitude-bonus-damage` modifier:
- Adds extra magnitude loss per penetrating hit
- Extracted by `CombatHelper._getMagnitudeBonusDamage()`
- Applied in `receiveBatchDamage()`: `lost = baseLost > 0 ? baseLost + magnitudeBonusDamage : 0`

### Horde Damage Message
- Single summary message for all hits
- Shows total magnitude lost, current/max magnitude
- Collapsible details table for multi-hit attacks (penetrating vs absorbed)
- "HORDE DESTROYED" when magnitude reaches max

## Testing

### Test Files
- **combat.test.mjs**: Core combat logic tests (hit locations, damage, routing)
- **ranged-combat.test.mjs**: Ranged combat helper tests
- **melee-combat.test.mjs**: Melee combat helper tests
- **combat-dialog.test.mjs**: Combat dialog helper tests
- **horde-combat.test.mjs**: Horde combat mechanics tests
- **horde.test.mjs**: Horde DataModel tests (receiveBatchDamage, getDefenses)

### Coverage
- Core combat logic: Well tested
- Dialog methods: Marked with `/* istanbul ignore next */` (UI-heavy)
- Routing logic: Tested for melee/ranged detection
- Weapon qualities: 23+ qualities tested
- Ammunition modifiers: Fully tested
- Modifier system: Comprehensive coverage
- Overall: 947 tests passing across 77 suites

## Force Weapon Integration

Force weapon modifiers are applied from `DeathwatchCharacter.prepareDerivedData()` (in `actor/character.mjs`) after psy rating is computed:
```javascript
// In DeathwatchCharacter.prepareDerivedData()
for (const item of actor.items) {
  if (item.type === 'weapon') {
    item.system.applyForceWeaponModifiers();
  }
}
```
The `applyForceWeaponModifiers()` method lives on `DeathwatchWeapon` DataModel (`item/weapon.mjs`).

## Future Enhancements

### Weapon Qualities
See `weapon-qualities.md` for implemented qualities:
- **Accurate**: +10 BS when aiming, bonus damage on single shots
- **Primitive**: Doubles armor before penetration
- **Tearing**: Roll extra die, drop lowest
- **Proven (X)**: Minimum damage roll
- **Razor Sharp**: Doubles penetration with 2+ DoS
- **Twin-Linked**: +20 BS, +1 hit with 2+ DoS
- **Gyro-Stabilised**: Caps range penalty at -10
- **Scatter**: Bonus hits at point blank, doubles armor at long range
- **Storm**: Doubles total hits
- **Shocking**: Stun test on damage
- **Toxic**: Toughness test on damage
- **Felling (X)**: Reduces Unnatural Toughness
- **Power Field**: Doubles STR bonus when active
- **Force**: +1 Damage/Pen per Psy Rating, Opposed Willpower channeling

### Planned Melee Features
- Swift Attack (multiple melee attacks)
- Lightning Attack (even more attacks)
- Parry mechanics
- Dodge mechanics
- Defensive stance
- Power field activation for power weapons

### Planned Ranged Features
- Suppressive fire
- Called shot location selection
- Overwatch
- Blast/scatter mechanics

## Usage Examples

### Ranged Attack
```javascript
// From actor sheet
CombatHelper.weaponAttackDialog(actor, weapon);
// Detects ranged weapon, shows ranged dialog
// User selects aim, rate of fire, modifiers
// Rolls attack, calculates hits
// Stores results in CombatHelper.lastAttack* properties
```

### Melee Attack
```javascript
// From actor sheet
CombatHelper.weaponAttackDialog(actor, weapon);
// Detects melee weapon, shows melee dialog
// User selects all out attack, charge, modifiers
// Rolls attack, determines hit/miss
// Stores results in CombatHelper.lastAttack* properties
```

### Damage Roll
```javascript
// After attack
CombatHelper.weaponDamageRoll(actor, weapon);
// Uses stored attack data
// Determines hit locations
// Rolls damage with degrees of success
// Adds STR bonus for melee
// Handles Righteous Fury
// Creates apply damage buttons
```

### Apply Damage
```javascript
// From chat button or direct call
CombatHelper.applyDamage(targetActor, damage, penetration, location, damageType);
// Calculates effective armor
// Applies wounds
// Checks for critical damage
// Creates chat message
```

## Integration Points

### Actor Sheet
- Attack buttons call `CombatHelper.weaponAttackDialog()`
- Damage buttons call `CombatHelper.weaponDamageRoll()`

### Chat Messages
- Apply damage buttons call `CombatHelper.applyDamage()`
- Critical effect buttons trigger critical effect dialogs

### Token Targeting
- Ranged combat uses `game.user.targets.first()` for range calculation
- Damage rolls use targeting for apply damage buttons

### Foundry Adapter
- All Foundry API calls go through `FoundryAdapter` for testability
- Roll evaluation, chat messages, notifications, document updates
