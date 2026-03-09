# Melta Weapon Quality Implementation

## Overview
Implemented the **Melta** weapon quality rule: Astartes melta weapons double their Penetration when firing at Short Range or closer.

## Rules Implementation

### Range Detection
- **Short Range**: Distance < 50% of weapon range
- **Point Blank**: Distance ≤ 2m (also qualifies)
- Penetration is doubled when either condition is met

### Penetration Calculation
- Base penetration × 2 when at Short Range or closer
- Does not stack with Razor Sharp (Razor Sharp takes precedence)
- Works with Primitive weapons (armor doubled first, then penetration applied)

## Technical Changes

### 1. WeaponQualityHelper (`weapon-quality-helper.mjs`)
Added detection method:
```javascript
static async isMelta(weapon) {
  return await this.hasQuality(weapon, 'melta');
}
```

### 2. CombatHelper (`combat.mjs`)
- Added `lastAttackDistance` property to store range
- Detects melta weapons during damage roll
- Calculates if attack is within melta range
- Passes `isMeltaRange` flag to damage application

### 3. RangedCombatHelper (`ranged-combat.mjs`)
- Stores distance in `CombatHelper.lastAttackDistance` during attack

### 4. CombatDialogHelper (`combat-dialog.mjs`)
Updated `calculateDamageResult()`:
```javascript
let effectivePenetration = penetration;
if (isRazorSharp && degreesOfSuccess >= 2) {
  effectivePenetration = penetration * 2;
} else if (isMeltaRange) {
  effectivePenetration = penetration * 2;
}
```

### 5. ChatMessageBuilder (`chat-message-builder.mjs`)
- Added `isMeltaRange` parameter to `createDamageApplyButton()`
- Passes flag through damage button data attributes

### 6. Main Entry Point (`deathwatch.mjs`)
- Updated apply damage button handler to read `isMeltaRange` from button data
- Passes flag to `CombatHelper.applyDamage()`

## Usage

### Setting Up a Melta Weapon
1. Open weapon item sheet
2. Add 'melta' quality to `attachedQualities` array
3. Ensure weapon has a valid range value

### Combat Flow
1. Make ranged attack (distance automatically calculated)
2. Roll damage
3. System automatically detects if weapon is melta
4. System checks if distance < 50% of weapon range
5. If true, penetration is doubled in damage calculation
6. Apply damage button includes melta range flag

## Examples

### Example 1: Melta Gun at Point Blank (2m)
- Weapon Range: 20m
- Distance: 2m (Point Blank, < 50% range)
- Base Penetration: 12
- **Effective Penetration: 24** (doubled)

### Example 2: Melta Gun at Short Range (8m)
- Weapon Range: 20m
- Distance: 8m (< 10m = 50% range)
- Base Penetration: 12
- **Effective Penetration: 24** (doubled)

### Example 3: Melta Gun at Normal Range (15m)
- Weapon Range: 20m
- Distance: 15m (> 50% range)
- Base Penetration: 12
- **Effective Penetration: 12** (not doubled)

### Example 4: Melta vs Heavy Armor
- Damage: 20
- Armor: 15
- Base Penetration: 12
- At Short Range:
  - Effective Penetration: 24
  - Effective Armor: 0 (15 - 24, clamped to 0)
  - Wounds: 16 (20 - 0 - 4 TB)

## Test Coverage
Created `melta.test.mjs` with 8 tests:
- ✅ Melta quality detection
- ✅ Non-melta weapon detection
- ✅ Penetration doubling at Short Range
- ✅ No doubling outside melta range
- ✅ Interaction with Razor Sharp (no stacking)
- ✅ Interaction with Primitive weapons
- ✅ Zero armor handling
- ✅ High armor handling

All tests passing ✓

## Integration Notes
- Melta range check only applies to ranged weapons
- Range must be stored from attack to damage roll
- Works with all existing weapon qualities
- Fully integrated with apply damage button system
- No UI changes required (automatic detection)
