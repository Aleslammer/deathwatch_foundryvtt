# Modifier System

## Overview
The modifier system allows items, talents, chapters, and other effects to modify character attributes dynamically. Modifiers are collected from multiple sources and applied during actor data preparation.

## Architecture

### Core Components
- **ModifierCollector** (`modifier-collector.mjs`): Collects and applies modifiers
- **Actor Data Preparation** (`actor.mjs`): Calls modifier application during `_prepareCharacterData()`
- **Item System**: Items store modifiers in `system.modifiers` array

### Data Flow
1. Actor data preparation triggered
2. `ModifierCollector.collectAllModifiers()` gathers modifiers from:
   - Actor's own modifiers (`actor.system.modifiers`)
   - Equipped items
   - Chapter items (always active)
   - Armor histories (on equipped armor)
3. Modifiers applied to characteristics, skills, initiative, wounds, armor, psy rating, and movement
4. Modified values used throughout system

## Modifier Structure

### Basic Format
```json
{
  "name": "Modifier Name",
  "modifier": 5,
  "effectType": "characteristic|characteristic-post-multiplier|skill|initiative|wounds|armor|psy-rating|movement|movement-restriction",
  "valueAffected": "ws|bs|str|tg|ag|int|per|wil|fs|skillName",
  "enabled": true,
  "source": "Item Name"
}
```

### Properties
- **name**: Display name for the modifier
- **modifier**: Numeric value (positive or negative)
- **effectType**: Type of effect (see Effect Types below)
- **valueAffected**: Target characteristic or skill (for characteristic/skill types)
- **enabled**: Boolean, set to `false` to disable without removing
- **source**: Automatically added by system (item name)

## Effect Types

### 1. Characteristic Modifiers
Modify character characteristics with damage tracking.

**Structure:**
```json
{
  "name": "Strength Bonus",
  "modifier": 10,
  "effectType": "characteristic",
  "valueAffected": "str",
  "enabled": true
}
```

**Behavior:**
- Applied to characteristic `value` field
- Stored in `characteristic.base` before modification
- Characteristic bonus (`mod`) recalculated from modified value
- Tracked in `characteristic.modifiers` array with source
- Characteristic damage subtracts from final value

**Characteristic Damage:**
- Each characteristic has `damage` field (default 0)
- Damage subtracts from effective value after advances and modifiers
- Applied by ammunition (e.g., Implosion Shells deal 1d5 AG damage)
- Displayed in characteristic tooltip
- Persistent until healed

**Example Use Cases:**
- Chapter bonuses (e.g., Storm Wardens +5 STR)
- Armor bonuses
- Temporary buffs/debuffs
- Characteristic damage from special ammunition

### 2. Skill Modifiers
Modify skill totals.

**Structure:**
```json
{
  "name": "Awareness Bonus",
  "modifier": 10,
  "effectType": "skill",
  "valueAffected": "awareness",
  "enabled": true
}
```

**Behavior:**
- Applied to skill calculations
- Stored in `skill.modifierTotal`
- Added to final skill total

**Example Use Cases:**
- Gear bonuses (e.g., Auspex +10 Awareness)
- Talent bonuses
- Situational modifiers

### 3. Initiative Modifiers
Modify initiative rolls.

**Structure:**
```json
{
  "name": "Quick Draw",
  "modifier": 2,
  "effectType": "initiative",
  "enabled": true
}
```

**Behavior:**
- Applied to initiative formula
- Stored in `actor.system.initiativeBonus`
- Added to initiative rolls (1d10 + AG Bonus + Initiative Bonus)

**Example Use Cases:**
- Talents (e.g., Lightning Reflexes)
- Gear bonuses
- Temporary effects

### 4. Wound Modifiers
Modify maximum wounds.

**Structure:**
```json
{
  "name": "True Grit",
  "modifier": 3,
  "effectType": "wounds",
  "enabled": true
}
```

**Behavior:**
- Applied to max wounds
- Base wounds stored in `wounds.base`
- Modified wounds in `wounds.max`
- All combat mechanics use modified max

**Example Use Cases:**
- Talents (e.g., True Grit)
- Chapter bonuses
- Injuries (negative modifiers)

### 5. Armor Modifiers
Modify armor values on all locations of equipped armor.

**Structure:**
```json
{
  "name": "Armor Enhancement",
  "modifier": 2,
  "effectType": "armor",
  "enabled": true
}
```

**Behavior:**
- Applied to all armor locations (head, body, left_arm, right_arm, left_leg, right_leg)
- Only affects equipped armor
- Base armor values stored in `{location}_base` fields
- Modified values in location fields
- Applies to all equipped armor on the actor (not source-specific)

**Example Use Cases:**
- Talents that enhance armor (e.g., +2 to all armor locations)
- Temporary armor bonuses from abilities
- Armor degradation (negative modifiers)

### 6. Psy Rating Modifiers
Modify Psy Rating for Librarian characters.

**Structure:**
```json
{
  "name": "Psy Rating 3",
  "modifier": 3,
  "effectType": "psy-rating",
  "enabled": true
}
```

**Behavior:**
- Applied to `psyRating.value` field
- Base value stored in `psyRating.base`
- Modified value in `psyRating.value`
- Tracked in `psyRating.modifiers` array with source (for tooltip display)
- No `valueAffected` needed (like wounds/initiative/armor)
- Psy Rating box only visible when specialty has `hasPsyRating: true` (Librarian)

**Example Use Cases:**
- Psy Rating talents (Psy Rating 3 through 10)
- Temporary psychic buffs/debuffs
- Equipment that enhances psychic ability

**Psy Rating Talents:**
- Psy Rating 3 (tal00000000275): +3 modifier, cost -1 (overridden to 0 for Librarians)
- Psy Rating 4-10 (tal00000000276-282): +1 modifier each, escalating costs
- Each requires the previous level as prerequisite

### 7. Characteristic Post-Multiplier Modifiers
Modify characteristic value for tests while applying bonus AFTER Unnatural multiplier.

**CRITICAL ORDERING**: This effectType exists specifically because Power Armor Enhanced Strength (+20 STR) must add to the characteristic value for skill tests, but the resulting +2 SB must NOT be multiplied by Unnatural Strength. If the post-multiplier bonus is moved before the Unnatural multiplier step in `applyCharacteristicModifiers()`, SB calculations will be wrong.

**Structure:**
```json
{
  "name": "Enhanced Strength",
  "modifier": 20,
  "effectType": "characteristic-post-multiplier",
  "valueAffected": "str",
  "enabled": true
}
```

**Behavior:**
- Adds full value (+20) to characteristic `value` (for skill tests)
- Calculates `baseMod` excluding post-multiplier contributions
- Applies Unnatural multiplier to `baseMod` only
- Adds `floor(postMultiplierValue / 10)` to `mod` AFTER multiplier
- Tracked in both `characteristic.modifiers[]` (value tooltip: +20) and `characteristic.bonusModifiers[]` (bonus tooltip: +2 post-multiplier)

**Example** (STR 40, Unnatural x2, Power Armor +20):
- Value: 60 (40 + 20) — used for STR tests
- baseMod: floor((60 - 20) / 10) = 4
- Unnatural x2: mod = 8
- Post-multiplier: mod += floor(20 / 10) = 2
- Final mod: **10** (NOT 12 which would result from multiplying the +20)

**Example Use Cases:**
- Power Armor Enhanced Strength (+20 STR)
- Any equipment bonus that should not be multiplied by Unnatural characteristics

### 8. Movement Modifiers
Modify base movement rates.

**Structure:**
```json
{
  "name": "Giant Among Men",
  "modifier": 1,
  "effectType": "movement",
  "enabled": true
}
```

**Behavior:**
- Applied to base movement (AG Bonus + movement modifiers)
- All movement rates derived from modified base: half = base, full = base x 2, charge = base x 3, run = base x 6
- Tracked in `movement.modifiers[]` for tooltip display
- `movement.bonus` stores total modifier sum
- No `valueAffected` needed

**Example Use Cases:**
- Power Armor Giant Among Men (+1 movement)
- Talents or traits that modify speed
- Encumbrance penalties (negative modifiers)

### 9. Movement Restriction Modifiers
Disable specific movement types entirely (set to "N/A").

**Structure:**
```json
{
  "name": "Terminator Armor",
  "modifier": "run",
  "effectType": "movement-restriction",
  "enabled": true
}
```

**Behavior:**
- `modifier` field contains the movement type to disable: `half`, `full`, `charge`, or `run`
- Sets the specified movement type to the string `"N/A"` (replaces numeric value)
- Applied after all movement bonus modifiers are calculated
- Multiple restrictions can stack (e.g., disable both `run` and `charge`)
- Invalid movement type names are silently ignored
- No `valueAffected` needed

**Example Use Cases:**
- Terminator Armor cannot Run
- Heavy equipment preventing certain movement types
- Conditions that restrict movement

## Modifier Sources

### 1. Actor Modifiers
Stored directly on actor: `actor.system.modifiers[]`

**Always Active:** Yes

**Example:**
```json
{
  "system": {
    "modifiers": [
      {
        "name": "Temporary Buff",
        "modifier": 5,
        "effectType": "characteristic",
        "valueAffected": "str",
        "enabled": true
      }
    ]
  }
}
```

### 2. Item Modifiers
Stored on items: `item.system.modifiers[]`

**Active When:** Item is equipped (`item.system.equipped === true`)

**Exception:** Chapter items are always active (no equipped check)

**Supported Item Types:**
- Weapons
- Armor
- Gear
- Talents
- Traits
- Chapters
- Armor Histories

**Example:**
```json
{
  "type": "gear",
  "name": "Auspex",
  "system": {
    "equipped": true,
    "modifiers": [
      {
        "name": "Auspex Bonus",
        "modifier": 10,
        "effectType": "skill",
        "valueAffected": "awareness",
        "enabled": true
      }
    ]
  }
}
```

### 3. Armor History Modifiers
Stored on armor-history items, applied when attached to equipped armor.

**Active When:** 
- Armor history attached to armor (`armor.system.attachedHistories[]`)
- Armor is equipped

**Example:**
```json
{
  "type": "armor-history",
  "name": "Blessed by Chaplain",
  "system": {
    "modifiers": [
      {
        "name": "Faith Bonus",
        "modifier": 5,
        "effectType": "characteristic",
        "valueAffected": "wil",
        "enabled": true
      }
    ]
  }
}
```

## Implementation Details

### Collection Process
**File:** `modifier-collector.mjs`

```javascript
// Collect all modifiers
const allModifiers = ModifierCollector.collectAllModifiers(actor);

// Apply to different systems
ModifierCollector.applyCharacteristicModifiers(characteristics, allModifiers);
ModifierCollector.applySkillModifiers(skills, allModifiers);
ModifierCollector.applyInitiativeModifiers(allModifiers);
ModifierCollector.applyWoundModifiers(wounds, allModifiers);
ModifierCollector.applyPsyRatingModifiers(psyRating, allModifiers);
ModifierCollector.applyMovementModifiers(movement, agBonus, allModifiers);
```

### Characteristic Application
```javascript
static applyCharacteristicModifiers(characteristics, modifiers) {
  for (const [key, characteristic] of Object.entries(characteristics)) {
    // Store base value
    if (characteristic.base === undefined) {
      characteristic.base = characteristic.value;
    }
    
    let total = characteristic.base || 0;
    
    // Apply advances (+5 each)
    if (characteristic.advances) {
      if (characteristic.advances.simple) total += 5;
      if (characteristic.advances.intermediate) total += 5;
      if (characteristic.advances.trained) total += 5;
      if (characteristic.advances.expert) total += 5;
    }
    
    // Apply modifiers
    for (const mod of modifiers) {
      if (mod.enabled !== false && 
          mod.effectType === 'characteristic' && 
          mod.valueAffected === key) {
        total += parseInt(mod.modifier) || 0;
      }
    }
    
    characteristic.value = total;
    characteristic.mod = Math.floor(total / 10);
  }
}
```

### Wound Application
```javascript
static applyWoundModifiers(wounds, modifiers) {
  if (!wounds) return;
  
  // Initialize base from max if not set
  if (wounds.base === undefined) {
    wounds.base = wounds.max;
  }
  
  let total = wounds.base || 0;
  
  // Apply wound modifiers
  for (const mod of modifiers) {
    if (mod.enabled !== false && mod.effectType === 'wounds') {
      total += parseInt(mod.modifier) || 0;
    }
  }
  
  wounds.max = total;
}
```

## Common Patterns

### Chapter Bonuses
```json
{
  "type": "chapter",
  "name": "Storm Wardens",
  "system": {
    "modifiers": [
      {
        "name": "Chapter Bonus",
        "modifier": 5,
        "effectType": "characteristic",
        "valueAffected": "str",
        "enabled": true
      }
    ]
  }
}
```

### Talent Bonuses
```json
{
  "type": "talent",
  "name": "True Grit",
  "system": {
    "modifiers": [
      {
        "name": "True Grit Bonus",
        "modifier": 3,
        "effectType": "wounds",
        "enabled": true
      }
    ]
  }
}
```

### Gear Bonuses
```json
{
  "type": "gear",
  "name": "Auspex",
  "system": {
    "equipped": true,
    "modifiers": [
      {
        "name": "Auspex Bonus",
        "modifier": 10,
        "effectType": "skill",
        "valueAffected": "awareness",
        "enabled": true
      }
    ]
  }
}
```

### Multiple Modifiers on One Item
```json
{
  "type": "armor",
  "name": "Power Armor",
  "system": {
    "equipped": true,
    "modifiers": [
      {
        "name": "Strength Enhancement",
        "modifier": 20,
        "effectType": "characteristic",
        "valueAffected": "str",
        "enabled": true
      },
      {
        "name": "Toughness Enhancement",
        "modifier": 20,
        "effectType": "characteristic",
        "valueAffected": "tg",
        "enabled": true
      }
    ]
  }
}
```

### Temporary Debuffs
```json
{
  "type": "trait",
  "name": "Wounded",
  "system": {
    "modifiers": [
      {
        "name": "Injury Penalty",
        "modifier": -10,
        "effectType": "characteristic",
        "valueAffected": "ag",
        "enabled": true
      },
      {
        "name": "Wound Reduction",
        "modifier": -5,
        "effectType": "wounds",
        "enabled": true
      }
    ]
  }
}
```

## Testing

### Test Files
- `tests/modifiers/modifier-collector.test.mjs`: Core modifier collection tests
- `tests/modifiers/modifier-collector-wounds.test.mjs`: Wound modifier tests
- `tests/modifiers/modifier-collector-psy-rating.test.mjs`: Psy Rating modifier tests
- `tests/modifiers/modifier-collector-post-multiplier.test.mjs`: Post-multiplier modifier tests (11 tests)
- `tests/modifiers/modifier-collector-movement.test.mjs`: Movement and movement-restriction modifier tests (14 tests)
- `tests/documents/actor.test.mjs`: Integration tests

### Coverage
- Characteristic modifiers: ✓
- Characteristic post-multiplier modifiers: ✓
- Skill modifiers: ✓
- Initiative modifiers: ✓
- Wound modifiers: ✓
- Psy Rating modifiers: ✓
- Movement modifiers: ✓
- Movement restriction modifiers: ✓
- Equipped item filtering: ✓
- Chapter item handling: ✓
- Armor history modifiers: ✓
- Disabled modifier handling: ✓
- Multiple modifier stacking: ✓
- Post-multiplier + Unnatural ordering: ✓

### Test Count
- Total: 947 tests
- Modifier-specific: ~85 tests
- All passing ✓

## Best Practices

### 1. Use Descriptive Names
```json
// Good
{ "name": "Chapter Strength Bonus", "modifier": 5 }

// Bad
{ "name": "Bonus", "modifier": 5 }
```

### 2. Always Set effectType
```json
// Required
{ "effectType": "characteristic", "valueAffected": "str" }
```

### 3. Use enabled Flag for Toggles
```json
// Disable without removing
{ "enabled": false }
```

### 4. Group Related Modifiers
```json
{
  "modifiers": [
    { "name": "STR Bonus", "modifier": 10, "effectType": "characteristic", "valueAffected": "str" },
    { "name": "TG Bonus", "modifier": 10, "effectType": "characteristic", "valueAffected": "tg" }
  ]
}
```

### 5. Use Negative Values for Penalties
```json
{ "name": "Injury", "modifier": -10, "effectType": "characteristic", "valueAffected": "ag" }
```

## Migration Notes

### Existing Data
- Backwards compatible with existing actors/items
- Base values automatically initialized on first data preparation
- No manual migration required

### Adding New Effect Types
1. Add new effectType constant to `EFFECT_TYPES` in constants.mjs
2. Create `apply[Type]Modifiers()` method in ModifierCollector
3. Call from `_prepareCharacterData()` in actor.mjs
4. Add option to edit modifier dialog in modifiers.mjs
5. Add tests for new type

## Debug Support

Enable modifier debugging in `debug.mjs`:
```javascript
export const DEBUG_FLAGS = {
  MODIFIERS: true  // Enable modifier logging
};
```

Logs show:
- Items being checked
- Modifiers found
- Sources of modifiers
- Total modifiers collected
