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

Upgrades provide modifiers that are applied during weapon attacks, not to the actor's base characteristics:

### characteristic (Attack Modifiers)
- Applied to BS/WS during attack rolls with the weapon
- Requires `valueAffected` field (e.g., "bs", "ws")
- Example: Red-Dot Laser Sight (+10 BS when attacking)
- Modifier name should match upgrade name for clarity
- Only applied when using the specific weapon

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

### Integration Points

#### Ranged Combat
- `WeaponUpgradeHelper.getModifiers()` called during attack
- BS modifiers summed and added to miscModifier
- Respects singleShotOnly flag
- Applied only when using the specific weapon

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

## Test Coverage
- ✅ Get upgrades from compendium
- ✅ Get modifiers with source
- ✅ Single shot only filtering
- ✅ Multiple upgrade stacking
- ✅ Empty upgrade handling

## Future Enhancements
- UI for attaching/detaching upgrades on weapon sheet
- Compatibility checking (weapon type restrictions)
- Upgrade slot limits (e.g., only one sight)
- Visual indicators for attached upgrades
