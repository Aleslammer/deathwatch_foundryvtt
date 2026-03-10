# Ammunition Modifier System

## Overview
Ammunition items can modify weapon statistics when loaded, using the same modifier system as weapon upgrades. Modifiers are applied during weapon data preparation and create effective properties.

## Architecture

### Core Components
- **Item Data Preparation** (`item.mjs`): `_applyAmmunitionModifiers()` method
- **Ammunition Schema** (`template.json`): `modifiers` array on ammunition
- **Combat System** (`combat.mjs`): Extracts special modifiers for combat effects

### Data Flow
1. Weapon prepareData() triggered
2. Check if ammunition is loaded (`weapon.system.loadedAmmo`)
3. Get ammunition item from actor
4. Extract modifiers from ammunition
5. Apply modifiers to create effective properties
6. Combat system uses effective properties

## Modifier Types

### 1. weapon-damage
Modifies weapon damage (additive).

**Structure:**
```json
{
  "name": "Dragonfire Rounds",
  "modifier": "-2",
  "effectType": "weapon-damage",
  "enabled": true
}
```

**Behavior:**
- Adds to base damage value
- Creates `weapon.system.effectiveDamage`
- Displayed in weapon sheet and gear tab
- Used in damage calculations

**Example:**
- Dragonfire Rounds: -2 damage

### 2. weapon-rof
Modifies weapon rate of fire (override).

**Structure:**
```json
{
  "name": "Hellfire Rounds",
  "modifier": "S/-/-",
  "effectType": "weapon-rof",
  "weaponClass": "heavy",
  "enabled": true
}
```

**Behavior:**
- Overrides entire RoF string
- Creates `weapon.system.effectiveRof`
- Displayed in weapon sheet and gear tab
- Used in attack dialog

**weaponClass Restriction:**
- Optional field restricts to specific weapon classes
- Example: "heavy" only applies to Heavy weapons

**Example:**
- Hellfire Rounds: Changes Heavy Bolter RoF to S/-/-

### 3. weapon-blast
Adds Blast quality to weapon.

**Structure:**
```json
{
  "name": "Hellfire Rounds",
  "modifier": "3",
  "effectType": "weapon-blast",
  "weaponClass": "heavy",
  "enabled": true
}
```

**Behavior:**
- Adds Blast(X) quality dynamically
- Creates `weapon.system.effectiveBlast`
- Appears in weapon qualities list with gray background
- Cannot be removed (dynamic quality)

**weaponClass Restriction:**
- Optional field restricts to specific weapon classes

**Example:**
- Hellfire Rounds: Blast(3) for heavy weapons

### 4. righteous-fury-threshold
Modifies Righteous Fury trigger threshold.

**Structure:**
```json
{
  "name": "Hellfire Rounds",
  "modifier": "9",
  "effectType": "righteous-fury-threshold",
  "enabled": true
}
```

**Behavior:**
- Changes natural 10 requirement to specified value
- Default threshold: 10
- Lower values trigger more frequently
- Extracted by `CombatHelper._getFuryThreshold()`

**Example:**
- Hellfire Rounds: Triggers on 9 or 10 (instead of just 10)

### 5. characteristic-damage
Deals damage to target's characteristics when wounds are taken.

**Structure:**
```json
{
  "name": "Implosion Effect",
  "modifier": "1d5",
  "effectType": "characteristic-damage",
  "valueAffected": "ag",
  "enabled": true
}
```

**Behavior:**
- Extracted by `CombatHelper._getCharacteristicDamageEffect()`
- Button appears in damage message when wounds taken
- Rolls formula and adds to `characteristic.damage`
- Damage subtracts from effective characteristic value

**Example:**
- Implosion Shells: 1d5 Agility damage when target takes wounds

## Implementation

### Ammunition Data Preparation
**File:** `item.mjs`

```javascript
_applyAmmunitionModifiers() {
  if (!this.actor || !Array.isArray(this.system.modifiers)) return;
  
  const weaponClass = this.system.class?.toLowerCase();
  
  for (const mod of this.system.modifiers) {
    if (mod.enabled === false) continue;
    
    // Check weaponClass restriction
    if (mod.weaponClass && weaponClass !== mod.weaponClass.toLowerCase()) continue;
    
    if (mod.effectType === 'weapon-damage') {
      const damageModifier = parseInt(mod.modifier) || 0;
      this.system.effectiveDamage = this.system.dmg + (damageModifier >= 0 ? '+' : '') + damageModifier;
    }
    
    if (mod.effectType === 'weapon-rof') {
      this.system.effectiveRof = mod.modifier;
    }
    
    if (mod.effectType === 'weapon-blast') {
      this.system.effectiveBlast = parseInt(mod.modifier) || 0;
    }
  }
}
```

### Combat Integration
**File:** `combat.mjs`

```javascript
static _getFuryThreshold(weapon, actor) {
  if (!weapon.system.loadedAmmo || !actor) return 10;
  const ammo = actor.items.get(weapon.system.loadedAmmo);
  if (!ammo || !Array.isArray(ammo.system.modifiers)) return 10;
  
  for (const mod of ammo.system.modifiers) {
    if (mod.enabled !== false && mod.effectType === 'righteous-fury-threshold') {
      return parseInt(mod.modifier) || 10;
    }
  }
  return 10;
}

static _getCharacteristicDamageEffect(weapon, actor) {
  if (!weapon.system.loadedAmmo || !actor) return null;
  const ammo = actor.items.get(weapon.system.loadedAmmo);
  if (!ammo || !Array.isArray(ammo.system.modifiers)) return null;
  
  for (const mod of ammo.system.modifiers) {
    if (mod.enabled !== false && mod.effectType === 'characteristic-damage') {
      return {
        formula: mod.modifier,
        characteristic: mod.valueAffected,
        name: mod.name
      };
    }
  }
  return null;
}
```

## UI Display

### Weapon Sheet
- Effective damage shown below base damage (gray background, read-only)
- Effective RoF shown below base RoF (gray background, read-only)
- Effective Blast appears in qualities list (gray background, no remove button)

### Actor Gear Tab
- Weapons display effective damage when available
- Effective RoF displayed in weapon stats

### Ammunition Sheet
- Modifiers section with create/edit/toggle/delete controls
- Same UI as weapon upgrades

## Characteristic Damage System

### Data Structure
**File:** `template.json`

```json
"characteristics": {
  "ws": { "value": 0, "damage": 0 },
  "bs": { "value": 0, "damage": 0 },
  // ... all 9 characteristics
}
```

### Damage Application
**File:** `modifier-collector.mjs`

```javascript
static applyCharacteristicModifiers(characteristics, modifiers) {
  // ... apply advances and modifiers ...
  
  // Subtract characteristic damage
  const damage = characteristic.damage || 0;
  characteristic.value = total - damage;
  
  // Add damage to modifiers array for tooltip
  if (damage > 0) {
    characteristic.modifiers.push({
      name: 'Characteristic Damage',
      value: -damage,
      source: 'Damage'
    });
  }
}
```

### Chat Button Handler
**File:** `deathwatch.mjs`

```javascript
html.find('.char-damage-btn').click(async (ev) => {
  const actorId = button.data('actorId');
  const formula = button.data('formula');
  const characteristic = button.data('characteristic');
  
  const roll = await new Roll(formula).evaluate();
  const charDamage = roll.total;
  
  const currentDamage = actor.system.characteristics[characteristic]?.damage || 0;
  await actor.update({ 
    [`system.characteristics.${characteristic}.damage`]: currentDamage + charDamage 
  });
  
  // Post chat message with result
});
```

## Examples

### Dragonfire Rounds
```json
{
  "name": "Dragonfire Rounds",
  "type": "ammunition",
  "system": {
    "modifiers": [
      {
        "name": "Dragonfire Rounds",
        "modifier": "-2",
        "effectType": "weapon-damage",
        "enabled": true
      }
    ]
  }
}
```

**Effect:** Reduces weapon damage by 2

### Hellfire Rounds
```json
{
  "name": "Hellfire Rounds",
  "type": "ammunition",
  "system": {
    "modifiers": [
      {
        "name": "Hellfire Rounds",
        "modifier": "S/-/-",
        "effectType": "weapon-rof",
        "weaponClass": "heavy",
        "enabled": true
      },
      {
        "name": "Hellfire Rounds",
        "modifier": "9",
        "effectType": "righteous-fury-threshold",
        "enabled": true
      },
      {
        "name": "Hellfire Rounds",
        "modifier": "3",
        "effectType": "weapon-blast",
        "weaponClass": "heavy",
        "enabled": true
      }
    ]
  }
}
```

**Effects:**
- Changes Heavy weapon RoF to Single Shot only
- Righteous Fury triggers on 9 or 10
- Adds Blast(3) to Heavy weapons

### Implosion Shells
```json
{
  "name": "Implosion Shells",
  "type": "ammunition",
  "system": {
    "modifiers": [
      {
        "name": "Implosion Effect",
        "modifier": "1d5",
        "effectType": "characteristic-damage",
        "valueAffected": "ag",
        "enabled": true
      }
    ]
  }
}
```

**Effect:** Deals 1d5 Agility damage when target takes wounds

## Test Coverage

### Test Files
- `tests/documents/item-ammunition-modifiers.test.mjs`: 15 tests
- `tests/helpers/righteous-fury-threshold.test.mjs`: 8 tests
- `tests/modifiers/modifier-collector-damage.test.mjs`: 8 tests
- `tests/integration/characteristic-damage-integration.test.mjs`: 5 tests

### Coverage
- weapon-damage modifiers: ✓
- weapon-rof modifiers: ✓
- weapon-blast modifiers: ✓
- weaponClass restrictions: ✓
- Stacking multiple modifiers: ✓
- Disabled modifiers: ✓
- Righteous Fury threshold: ✓
- Characteristic damage: ✓
- Integration tests: ✓

**Total: 36 tests, all passing**

## Notes

- Ammunition modifiers follow same pattern as weapon upgrades
- Base properties remain unchanged (editable)
- Effective properties calculated and displayed
- weaponClass field restricts modifiers to specific weapon types
- Characteristic damage is cumulative and persistent
- Damage buttons appear only when wounds are taken
