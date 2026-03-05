# Accurate Weapon Quality Implementation

## Overview
Implemented the **Accurate** weapon quality from the Deathwatch Core Rulebook (p. 142). This quality provides bonuses to precision weapons when used with the Aim action.

## Rules Implementation

### Attack Bonus
- **+10 to Ballistic Skill** when using any Aim action (Half or Full)
- Applied in addition to the normal aim bonus
- Only applies when the weapon has `isAccurate: true`

### Damage Bonus
When firing a **single shot** from an **Accurate Basic Weapon** with the **Aim action**:
- Gain **+1d10 damage per 2 degrees of success**
- **Maximum of +2d10** (capped at 4+ degrees of success)
- Only applies to the first hit
- Does not apply to melee weapons or multi-shot attacks

## Technical Changes

### 1. Data Schema (`template.json`)
```json
"weapon": {
  "isAccurate": false
}
```

### 2. Combat Dialog Helper (`combat-dialog.mjs`)

#### buildAttackModifiers
- Added `isAccurate` parameter
- Calculates `accurateBonus` (+10 if accurate and aiming)
- Returns `accurateBonus` in result object

#### buildModifierParts
- Added `accurateBonus` parameter
- Includes "+10 Accurate" in modifier breakdown when applicable

#### buildDamageFormula
- Added `isAccurate`, `isAiming`, `isSingleShot` parameters
- Calculates extra dice: `Math.min(Math.floor(degreesOfSuccess / 2), 2)`
- Only applies to first hit (`hitIndex === 0`)
- Only applies to ranged weapons (`!isMelee`)

### 3. Ranged Combat (`ranged-combat.mjs`)
- Passes `weapon.system.isAccurate` to `buildAttackModifiers`
- Extracts `accurateBonus` from result
- Passes `accurateBonus` to `buildModifierParts`

### 4. Damage Dialog (`combat.mjs`)
- Added "Aim Used" dropdown to damage dialog
- Passes aim status to damage formula calculation
- Determines if attack was single shot based on hit count

### 5. Weapon Sheet (`item-weapon-sheet.html`)
- Already had `isAccurate` checkbox in Qualities section
- No changes needed

## Usage

### Setting Up an Accurate Weapon
1. Open weapon item sheet
2. Go to Attributes tab
3. Check "Accurate" in the Qualities section

### Making an Attack
1. Click weapon attack button
2. Select Aim level (Half or Full)
3. Select Rate of Fire (Single for damage bonus)
4. Roll attack
5. **Automatic**: +10 bonus applied to BS if aiming

### Rolling Damage
1. Click damage button after attack
2. Select "Aim Used" dropdown (None/Half/Full)
3. Roll damage
4. **Automatic**: Extra d10s added based on degrees of success

## Examples

### Example 1: Accurate Weapon with Full Aim
- BS: 50
- Full Aim: +20
- Accurate Bonus: +10
- **Target Number: 80**

### Example 2: Damage with 4 Degrees of Success
- Base Damage: 1d10+5
- Degrees of Success: 4
- Single Shot: Yes
- Aiming: Yes
- Accurate: Yes
- **Formula: 1d10min4+5 + 2d10** (capped at 2d10)

### Example 3: No Bonus (Semi-Auto)
- Degrees of Success: 4
- Rate of Fire: Semi-Auto (3 hits)
- **No Accurate damage bonus** (not single shot)

## Test Coverage

### New Tests (`weapon-qualities.test.mjs`)
- ✅ Attack bonus with Half Aim
- ✅ Attack bonus with Full Aim
- ✅ No bonus without Aim
- ✅ No bonus when not Accurate
- ✅ Modifier parts include Accurate
- ✅ Damage bonus for 2 DoS
- ✅ Damage bonus for 4 DoS (2d10)
- ✅ Damage bonus capped at 2d10
- ✅ No bonus for 1 DoS
- ✅ No bonus without aiming
- ✅ No bonus when not accurate
- ✅ No bonus for multi-shot
- ✅ No bonus for melee
- ✅ No bonus for subsequent hits

**Total: 15 tests, all passing**

## Future Enhancements

This implementation provides a foundation for other weapon qualities:

### Similar Patterns
- **Reliable**: Modify jam threshold
- **Unreliable**: Modify jam threshold
- **Tearing**: Reroll damage dice
- **Proven**: Minimum damage value
- **Primitive**: Reduce penetration vs armor
- **Razor Sharp**: Increase penetration

### Recommended Approach
1. Add boolean field to weapon schema
2. Add checkbox to weapon sheet
3. Implement logic in combat helpers
4. Add tests for new quality
5. Update documentation

## Notes

- The Accurate quality is already present on many weapons in the compendium
- No migration needed for existing weapons
- Quality is opt-in via checkbox
- All logic is centralized in combat helpers
- Fully tested with 15 unit tests
