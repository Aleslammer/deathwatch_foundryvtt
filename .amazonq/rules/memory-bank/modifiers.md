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
3. Modifiers applied to characteristics, skills, initiative, wounds, and armor
4. Modified values used throughout system

## Modifier Structure

### Basic Format
```json
{
  "name": "Modifier Name",
  "modifier": 5,
  "effectType": "characteristic|skill|initiative|wounds|armor",
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
Modify character characteristics (WS, BS, STR, TG, AG, INT, PER, WIL, FS).

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

**Example Use Cases:**
- Chapter bonuses (e.g., Storm Wardens +5 STR)
- Armor bonuses
- Temporary buffs/debuffs

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
- `tests/modifier-collector.test.mjs`: Core modifier collection tests
- `tests/modifier-collector-wounds.test.mjs`: Wound modifier tests
- `tests/actor.test.mjs`: Integration tests

### Coverage
- Characteristic modifiers: ✓
- Skill modifiers: ✓
- Initiative modifiers: ✓
- Wound modifiers: ✓
- Equipped item filtering: ✓
- Chapter item handling: ✓
- Armor history modifiers: ✓
- Disabled modifier handling: ✓
- Multiple modifier stacking: ✓

### Test Count
- Total: 368 tests
- Modifier-specific: ~50 tests
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
1. Add new effectType to modifier structure
2. Create `apply[Type]Modifiers()` method in ModifierCollector
3. Call from `_prepareCharacterData()` in actor.mjs
4. Add tests for new type

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
