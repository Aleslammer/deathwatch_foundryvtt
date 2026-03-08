# Lightning Claws Implementation

## Overview
Implemented the Lightning Claws special weapon rules from the Deathwatch RPG. Lightning Claws provide bonus damage based on degrees of success, with an enhanced bonus when wielding a pair.

## Rules

### Single Lightning Claw
- **+1 damage per degree of success** on the attack roll
- Applied to all hits from the attack

### Paired Lightning Claws
- **+2 damage per degree of success** on the attack roll
- Requires 2 equipped lightning claws
- Applied to all hits from the attack

## Implementation

### Detection Method
Lightning Claws are detected by weapon quality:
```javascript
await WeaponQualityHelper.isLightningClaw(weapon)
// Returns true if weapon has 'lightning-claw' quality attached
```

### Pair Detection
Checks if actor has 2+ equipped lightning claws:
```javascript
await WeaponQualityHelper.hasLightningClawPair(actor)
// Returns true if actor has 2+ equipped weapons with lightning-claw quality
```

### Damage Calculation
Bonus damage added in `CombatDialogHelper.buildDamageFormula()`:
```javascript
if (isLightningClaw && degreesOfSuccess > 0) {
  const bonusPerDegree = hasLightningClawPair ? 2 : 1;
  formula += ` + ${degreesOfSuccess * bonusPerDegree}`;
}
```

## Technical Changes

### Files Modified
1. **weapon-quality-helper.mjs**
   - Added `isLightningClaw(weapon)` method
   - Added `hasLightningClawPair(actor)` method

2. **combat-dialog.mjs**
   - Added `isLightningClaw` and `hasLightningClawPair` parameters to `buildDamageFormula()`
   - Added lightning claw damage bonus calculation

3. **combat.mjs**
   - Detects lightning claws in damage roll dialog
   - Passes lightning claw flags to damage formula

### Test Coverage
Created `lightning-claws.test.mjs` with 12 tests:
- Detection methods (2 tests)
- Pair detection (3 tests)
- Damage formula calculations (7 tests)

All tests passing ✓

## Usage Examples

### Example 1: Single Lightning Claw
- Attack Roll: 32
- Target Number: 62
- Degrees of Success: 3
- Base Damage: 1d10+10
- **Bonus: +3 damage**
- **Final Formula: 1d10min3 + 10 + 3**

### Example 2: Paired Lightning Claws
- Attack Roll: 32
- Target Number: 62
- Degrees of Success: 3
- Base Damage: 1d10+10
- **Bonus: +6 damage** (3 DoS × 2)
- **Final Formula: 1d10min3 + 10 + 6**

### Example 3: High Degrees of Success
- Attack Roll: 15
- Target Number: 75
- Degrees of Success: 6
- Base Damage: 1d10+10
- Paired Lightning Claws
- **Bonus: +12 damage** (6 DoS × 2)
- **Final Formula: 1d10min6 + 10 + 12**

## Integration with Other Qualities

Lightning Claw bonus stacks with:
- **Strength Bonus**: Applied separately
- **Power Fist**: Doubles STR bonus, lightning claw bonus separate
- **Tearing**: Affects dice rolls, lightning claw bonus added after
- **Proven**: Affects minimum die value, lightning claw bonus added after
- **Degrees of Success minimum**: Both applied to first hit

## Notes

- Lightning Claws are melee weapons only
- Bonus applies to all hits from a single attack
- Detection is quality-based (requires 'lightning-claw' weapon quality)
- Pair detection checks for 2+ equipped weapons with the quality
- Bonus is flat damage, not dice
- Works with all existing combat mechanics (Righteous Fury, critical damage, etc.)

## Future Enhancements

Potential improvements:
- Add UI indicator when pair bonus is active
- Add chat message annotation showing lightning claw bonus breakdown
- Support for specialized lightning claw variants (e.g., Master-Crafted)
