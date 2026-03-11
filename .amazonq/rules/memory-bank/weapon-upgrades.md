# Weapon Upgrades System

## Overview
Weapon upgrades are attachable items that modify weapon performance using the existing modifier system. Upgrades can be attached to weapons and provide various bonuses through modifiers.

## Architecture

### Core Components
- **WeaponUpgradeHelper** (`weapon-upgrade-helper.mjs`): Detection and modifier collection
- **Weapon Data Schema** (`template.json`): `attachedUpgrades` array on weapons
- **Item Type**: `weapon-upgrade` with modifiers array
- **Compendium Pack**: `weapon-upgrades` pack

### Data Structure

#### Weapon Schema
```json
{
  "weapon": {
    "attachedUpgrades": [
      {"id": "upgrade000000001"}
    ]
  }
}
```

#### Upgrade Schema
```json
{
  "weapon-upgrade": {
    "key": "red-dot-laser-sight",
    "singleShotOnly": true,
    "book": "Deathwatch Core Rulebook",
    "page": "157",
    "modifiers": [
      {
        "name": "Red-Dot Laser Sight",
        "modifier": "10",
        "effectType": "characteristic",
        "valueAffected": "bs",
        "enabled": true
      }
    ]
  }
}
```

## Modifier Types

Upgrades provide modifiers that are applied either during weapon attacks or to weapon statistics:

### characteristic (Attack Modifiers)
- Applied to BS/WS during attack rolls with the weapon
- Requires `valueAffected` field (e.g., "bs", "ws")
- Example: Red-Dot Laser Sight (+10 BS when attacking)
- Modifier name should match upgrade name for clarity
- Only applied when using the specific weapon

### weapon-range (Weapon Stat Modifiers)
- Applied to weapon's range during item data preparation
- Supports both additive and multiplicative modifiers:
  - Additive: "10" adds 10 to range
  - Multiplicative: "x0.7" multiplies range by 0.7 (30% reduction)
- Example: Arm Weapon Mounting ("x0.7" reduces range by 30%)
- Automatically applied when upgrade is attached
- Creates `effectiveRange` field (base range remains unchanged)
- Formula: `effectiveRange = (baseRange + additive) * multiplier`
- Used in combat calculations and displayed on character sheet

### Single Shot Only
- Boolean flag on upgrade
- When true, modifiers only collected for single shot attacks
- Checked in WeaponUpgradeHelper.getModifiers()

## Implementation

### Detection
```javascript
const upgrades = await WeaponUpgradeHelper.getUpgrades(weapon);
```

### Modifier Collection
```javascript
const modifiers = await WeaponUpgradeHelper.getModifiers(weapon, isSingleShot);
// Returns array of modifiers with source added
```

### Effective Range Calculation
```javascript
// In DeathwatchItem.prepareData()
if (this.type === 'weapon' && this.actor && Array.isArray(this.system.attachedUpgrades)) {
  this._applyWeaponUpgradeModifiers();
}

// Creates system.effectiveRange from system.range
// Base range remains unchanged for editing
```

### Integration Points

#### Item Data Preparation
- `_applyWeaponUpgradeModifiers()` called during prepareData()
- Calculates `effectiveRange` from base `range`
- Base range preserved for user editing

#### Ranged Combat
- Uses `weapon.system.effectiveRange || weapon.system.range` for calculations
- `WeaponUpgradeHelper.getModifiers()` called during attack
- BS modifiers summed and added to miscModifier
- Respects singleShotOnly flag

#### UI Display
- Weapon sheet shows both base range and effective range
- Character sheet Gear tab displays effective range
- Effective range only shown when different from base

## Example: Red-Dot Laser Sight

### Stats
- **Modifier**: +10 BS (during attacks only)
- **Modifier Name**: "Red-Dot Laser Sight" (matches upgrade name)
- **Single Shot Only**: Yes
- **Compatible**: Pistol/Basic (Las, Solid Projectile, Bolt, Plasma)

### Usage
1. Drag upgrade from compendium onto weapon (or add to `attachedUpgrades` array)
2. Fire weapon on single shot
3. Automatic +10 BS bonus applied during attack roll
4. No bonus on semi-auto/full-auto (singleShotOnly flag)
5. Bonus does not affect actor's base BS characteristic

## Example: Arm Weapon Mounting

### Stats
- **Effect**: Reduces weapon range by 30%
- **Modifier**: "x0.7" multiplier (weapon-range effectType)
- **Automatic**: Yes - applied during weapon data preparation
- **Compatible**: Las, Solid Projectile, Bolt, or Melta Pistol, or Auxiliary Grenade Launcher

### Usage
1. Drag upgrade from compendium onto weapon
2. Base range remains 100m (editable)
3. Effective range calculated as 70m (100 × 0.7)
4. Combat uses effective range (70m)
5. Removing upgrade removes effectiveRange field

## Test Coverage

### WeaponUpgradeHelper Tests (weapon-upgrade-helper.test.mjs)
- ✅ Get upgrades from compendium
- ✅ Get modifiers with source
- ✅ Single shot only filtering
- ✅ Multiple upgrade stacking
- ✅ Empty upgrade handling
- ✅ hasUpgrade() detection

### Effective Range Tests (item-effective-range.test.mjs)
- ✅ Sets effectiveRange when no upgrades
- ✅ Applies multiplicative modifiers (x0.7)
- ✅ Applies additive modifiers (+10)
- ✅ Combines additive and multiplicative
- ✅ Handles multiple upgrades
- ✅ Ignores disabled modifiers
- ✅ Handles non-numeric ranges (SBx3)
- ✅ Handles zero range
- ✅ Floors decimal results

**Total**: 15 tests, all passing

## Future Enhancements
- UI for attaching/detaching upgrades on weapon sheet
- Compatibility checking (weapon type restrictions)
- Upgrade slot limits (e.g., only one sight)
- Visual indicators for attached upgrades
- More weapon stat modifiers (damage, penetration, etc.)
