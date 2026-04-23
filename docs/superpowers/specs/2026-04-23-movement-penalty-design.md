# Movement Penalty for Auto-Fire Attacks - Design Specification

**Date:** 2026-04-23  
**Status:** Approved  
**Related Rules:** Deathwatch Core Rulebook p. 247 (Semi-Auto), p. 248 (Full-Auto)

## Overview

Implement movement penalties for Semi-Auto and Full-Auto ranged attacks per Warhammer 40K: Deathwatch rules. When firing Semi-Auto or Full-Auto with a Pistol or Basic weapon, characters can move up to their Agility Bonus in meters, but suffer penalties:

- **Semi-Auto + Moving:** Loses the +10 bonus (net modifier: 0)
- **Full-Auto + Moving:** Loses the +20 bonus and gains -10 penalty (net modifier: -10)
- **Heavy weapons:** Cannot move while firing auto-fire
- **Thrown weapons:** Cannot move during auto-fire attacks

## Rules Reference

### Semi-Auto (Deathwatch Core p. 247)
> "A character using this Action with a Pistol- or Basic-class weapon may also move up to his Agility Bonus in metres. However, if he does so, he gains no bonus to his Ballistic Skill Test."

**Effect:** +10 bonus becomes +0 (loses +10)

### Full-Auto (Deathwatch Core p. 248)
> "A character using this Action with a Pistol- or Basic-class weapon may also move up to his Agility Bonus in metres. However, if he does so, he gains no bonus to his Ballistic Skill Test and instead suffers a −10% penalty."

**Effect:** +20 bonus becomes -10 (loses +20, gains -10)

---

## UI Design

### Dialog Changes

**New Checkbox Element:**
- **Location:** Below "Rate of Fire" dropdown, above "Called Shot / Running Target" row
- **ID:** `moving`
- **Label (Dynamic):**
  - Semi-Auto: `"Move up to {agBonus}m (loses +10 bonus)"`
  - Full-Auto: `"Move up to {agBonus}m (becomes -10 penalty)"`
  - Example: `"Move up to 4m (loses +10 bonus)"` for character with AG Bonus 4
- **Icon:** FontAwesome checkbox (`fa-square` / `fa-check-square`)
- **Initial State:** Hidden (only visible when Semi-Auto or Full-Auto selected)

**Dynamic Visibility:**
- **Show:** When Rate of Fire dropdown = Semi-Auto (10) or Full-Auto (20)
- **Hide:** When Rate of Fire dropdown = Single Shot (0)
- **Trigger:** JavaScript `change` event listener on RoF `<select>` element
- **Reset:** Checkbox unchecks automatically when hidden

**Weapon Class Restrictions:**

| Weapon Class | Checkbox State | Tooltip |
|--------------|----------------|---------|
| Pistol | Enabled | "Semi/Full-Auto: moving cancels bonus" |
| Basic | Enabled | "Semi/Full-Auto: moving cancels bonus" |
| Heavy | Disabled | "Heavy weapons cannot move while firing auto-fire" |
| Thrown | Disabled | "Thrown weapons cannot move during auto-fire attacks" |

**Agility Bonus Display:**
- Extracted from `actor.system.characteristics.ag.mod`
- Displayed in meters: `"Move up to 4m"`
- Defaults to 0 if AG characteristic missing

**HTML Structure:**
```html
<div class="form-group" id="movingGroup" style="display: none;">
  <label title="Movement penalty tooltip">
    <i class="far fa-square" id="movingIcon"></i> Move up to 4m (loses +10 bonus)
    <input type="checkbox" id="moving" name="moving" style="display:none;" />
  </label>
</div>
```

---

## Backend Architecture

### Approach: Explicit Movement Parameter with Transparent Display

**Design Philosophy:**
- Pass `isMoving` boolean through the system (semantic intent)
- Calculate penalty in business logic layer (`buildAttackModifiers()`)
- Return penalty value for transparent chat display
- Keep `autoFire` value unchanged (preserves existing logic dependencies)

### Why Not Modify `autoFire` Directly?

**Critical Dependencies on `autoFire` Value:**

1. **Jam Threshold (`determineJamThreshold()`):**
   ```javascript
   if (autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO || autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
     return 94;  // Must match exact values
   }
   ```

2. **Rounds Fired (`determineRoundsFired()`):**
   ```javascript
   if (autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO) {
     return parseInt(rofParts[1]) || 1;  // Must match exact values
   }
   ```

3. **Hit Calculation (`calculateHits()`):**
   ```javascript
   if (rateOfFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
     calculatedHits += degreesOfSuccess;  // Must match exact values
   }
   ```

4. **Weapon Modifier Collection (`isAutoFire` flag):**
   ```javascript
   const isAutoFire = autoFire !== RATE_OF_FIRE_MODIFIERS.SINGLE;
   WeaponModifierCollector.collectWeaponModifiers(weapon, actor, { isAutoFire });
   ```

5. **Chat Display Label:**
   ```javascript
   const rateLabel = autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO ? 'Full Auto' : 'Semi-Auto';
   ```

**Conclusion:** Modifying `autoFire` value breaks five critical logic paths. Movement penalty must be handled as a separate modifier.

---

## Implementation Details

### 1. Modifier Calculation

**File:** `src/module/helpers/combat/combat-dialog.mjs`

**Function:** `buildAttackModifiers()`

**Signature Change:**
```javascript
static buildAttackModifiers({
  bs, bsAdv, aim, autoFire, calledShot, rangeMod, runningTarget,
  miscModifier, sizeModifier,
  isAccurate, isInaccurate, isGyroStabilised, isTwinLinked,
  isMoving = false  // NEW PARAMETER
})
```

**Logic:**
```javascript
// Calculate movement penalty
let movementPenalty = 0;

if (isMoving) {
  if (autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO) {
    movementPenalty = -10;  // Cancels the +10 bonus
  } else if (autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
    movementPenalty = -30;  // Cancels +20 and adds -10
  }
  // Single shot (autoFire === 0) gets no penalty
}

// Apply to target number
const modifiers = bsAdv + effectiveAim + autoFire + movementPenalty + 
                  calledShot + gyroRangeMod + runningTarget + 
                  miscModifier + accurateBonus + twinLinkedBonus + sizeModifier;

// Return penalty for chat display
return {
  targetNumber: bs + modifiers,
  accurateBonus,
  gyroRangeMod,
  twinLinkedBonus,
  movementPenalty  // NEW RETURN VALUE
};
```

---

### 2. Modifier Display

**File:** `src/module/helpers/combat/combat-dialog.mjs`

**Function:** `buildModifierParts()`

**Signature Change:**
```javascript
static buildModifierParts(
  bs, bsAdv, aim, autoFire, calledShot, autoRangeMod, runningTarget,
  miscModifier, accurateBonus, twinLinkedBonus, upgradeModifiers,
  sizeModifier, sizeLabel,
  movementPenalty = 0  // NEW PARAMETER
)
```

**Display Logic:**
```javascript
const parts = [];
parts.push(`+${bs} Ballistic Skill`);
if (bsAdv !== 0) parts.push(`${bsAdv >= 0 ? '+' : ''}${bsAdv} Ballistic Skill Advances`);
if (aim !== 0) parts.push(`+${aim} Aim ${aimLabel}`);
if (autoFire !== 0) parts.push(`+${autoFire} Rate of Fire`);
if (movementPenalty !== 0) parts.push(`${movementPenalty} Moving while firing`);  // NEW
// ... remaining modifiers
```

**Chat Display Example:**
```
Modifiers:
  +40 Ballistic Skill
  +10 Aim (Half)
  +20 Rate of Fire
  -30 Moving while firing      ← NEW LINE
  +10 Range (Short)
  = Target: 50
```

---

### 3. Attack Resolution

**File:** `src/module/helpers/combat/ranged-combat.mjs`

**Function:** `resolveRangedAttack()`

**Options Enhancement:**
```javascript
const {
  hitValue, aim, autoFire, calledShot, runningTarget, miscModifier,
  rangeMod, rangeLabel, rofParts,
  sizeModifier = 0, sizeLabel = '', targetActor = null,
  isMoving = false  // NEW PARAMETER
} = options;
```

**Pass to buildAttackModifiers:**
```javascript
const { targetNumber, accurateBonus, gyroRangeMod, twinLinkedBonus, movementPenalty } 
  = CombatDialogHelper.buildAttackModifiers({
    bs, bsAdv: 0, aim, autoFire, calledShot,
    rangeMod: telescopicRangeMod, runningTarget,
    miscModifier: miscModifier + upgradeBSBonus,
    sizeModifier, isAccurate, isInaccurate, isGyroStabilised, isTwinLinked,
    isMoving  // NEW
  });
```

**Pass to buildModifierParts:**
```javascript
const modifierParts = CombatDialogHelper.buildModifierParts(
  bs, 0, aim, autoFire, calledShot, gyroRangeMod, runningTarget,
  miscModifier, accurateBonus, twinLinkedBonus, weaponMods.characteristic,
  sizeModifier, sizeLabel,
  movementPenalty  // NEW
);
```

---

### 4. Dialog Integration

**File:** `src/module/helpers/combat/ranged-combat.mjs`

**Function:** `attackDialog()`

**AG Bonus Calculation (after line 474):**
```javascript
const agBonus = actor.system.characteristics?.ag?.mod || 0;
```

**Weapon Class Check (after line 510):**
```javascript
const weaponClass = weapon.system.class?.toLowerCase() || '';
const canMoveWhileFiring = weaponClass === 'pistol' || weaponClass === 'basic';
```

**HTML Content Addition (after line 546):**
```html
<div class="form-group" id="movingGroup" style="display: none;">
  <label title="Movement penalty info">
    <i class="far fa-square" id="movingIcon"></i> Move up to ${agBonus}m (loses +10 bonus)
    <input type="checkbox" id="moving" name="moving" style="display:none;" />
  </label>
</div>
```

**Render Callback Enhancement (after line 571):**
```javascript
render: (event, dialog) => {
  const el = dialog.element;
  
  // Get references
  const rofSelect = el.querySelector('#autoFire');
  const movingGroup = el.querySelector('#movingGroup');
  const movingCheckbox = el.querySelector('#moving');
  const movingLabel = movingGroup?.querySelector('label');
  
  // Function to update checkbox visibility and label
  const updateMovingCheckbox = () => {
    const selectedRoF = parseInt(rofSelect.value);
    
    if (selectedRoF === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO) {
      movingGroup.style.display = '';  // Show
      movingCheckbox.disabled = !canMoveWhileFiring;
      
      if (canMoveWhileFiring) {
        movingLabel.textContent = `Move up to ${agBonus}m (loses +10 bonus)`;
        movingLabel.title = 'Semi-Auto: moving cancels the +10 bonus (net modifier: 0)';
      } else {
        const reason = weaponClass === 'heavy' 
          ? 'Heavy weapons cannot move while firing auto-fire'
          : 'Thrown weapons cannot move during auto-fire attacks';
        movingLabel.textContent = `Move up to ${agBonus}m (loses +10 bonus)`;
        movingLabel.title = reason;
      }
    } 
    else if (selectedRoF === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
      movingGroup.style.display = '';  // Show
      movingCheckbox.disabled = !canMoveWhileFiring;
      
      if (canMoveWhileFiring) {
        movingLabel.textContent = `Move up to ${agBonus}m (becomes -10 penalty)`;
        movingLabel.title = 'Full-Auto: moving cancels +20 and adds -10 (net modifier: -10)';
      } else {
        const reason = weaponClass === 'heavy' 
          ? 'Heavy weapons cannot move while firing auto-fire'
          : 'Thrown weapons cannot move during auto-fire attacks';
        movingLabel.textContent = `Move up to ${agBonus}m (becomes -10 penalty)`;
        movingLabel.title = reason;
      }
    } 
    else {
      movingGroup.style.display = 'none';  // Hide for Single Shot
      movingCheckbox.checked = false;  // Reset state when hidden
    }
  };
  
  // Initial update
  updateMovingCheckbox();
  
  // Listen for RoF changes
  rofSelect.addEventListener('change', updateMovingCheckbox);
  
  // Setup moving checkbox with icon toggle
  setupCheckbox('moving');
  
  // Existing checkbox setup...
  setupCheckbox('calledShot');
  setupCheckbox('runningTarget');
  
  // Preset options handling...
  if (hasOptions) {
    // Existing presets...
    
    // NEW: Handle preset moving option
    if (options.moving) {
      const movingCb = el.querySelector('#moving');
      const movingIcon = el.querySelector('#movingIcon');
      if (movingCb && !movingCb.disabled) {
        movingCb.checked = true;
        movingIcon?.classList.replace('fa-square', 'fa-check-square');
      }
    }
    
    // Update checkbox visibility after setting presets
    updateMovingCheckbox();
  }
}
```

**Button Callback (after line 618):**
```javascript
const isMoving = el.querySelector('#moving')?.checked || false;

const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
  hitValue, aim, autoFire, calledShot, runningTarget, miscModifier,
  rangeMod: autoRangeMod, rangeLabel, rofParts,
  sizeModifier, sizeLabel, targetActor,
  isMoving  // NEW
});
```

---

### 5. Skip-Dialog Support

**File:** `src/module/helpers/combat/ranged-combat.mjs`

**Function:** `_attackWithOptions()`

**Extract moving option:**
```javascript
const isMoving = options.moving || false;

const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
  hitValue, aim, autoFire, calledShot, runningTarget, miscModifier,
  rangeMod: autoRangeMod, rangeLabel, rofParts,
  sizeModifier, sizeLabel, targetActor,
  isMoving  // NEW
});
```

---

## Error Handling and Edge Cases

### Input Validation

**Missing Agility Bonus:**
```javascript
const agBonus = actor.system.characteristics?.ag?.mod || 0;
```
- Defaults to 0 if AG characteristic missing
- Label displays "Move up to 0m" (valid, indicates no movement capability)

**Missing Weapon Class:**
```javascript
const weaponClass = weapon.system.class?.toLowerCase() || '';
const canMoveWhileFiring = weaponClass === 'pistol' || weaponClass === 'basic';
```
- Defaults to empty string
- Checkbox disabled (restrictive default is safer)

**Missing Checkbox Element:**
```javascript
const isMoving = el.querySelector('#moving')?.checked || false;
```
- Optional chaining prevents errors
- Defaults to `false` (no movement penalty)

### Edge Cases

**1. Moving with Single Shot:**
- Movement penalty logic checks for Semi/Full-Auto
- Single Shot (`autoFire === 0`) gets no penalty
- Checkbox hidden anyway, so defensive only

**2. Disabled Checkbox:**
- Heavy/Thrown weapons disable checkbox
- User cannot check it via UI
- Preset options respect disabled state

**3. Negative Target Number:**
```javascript
// Example: BS 20 + Full-Auto +20 + Moving -30 + Called Shot -20 = -10
```
- Foundry handles negative target numbers (auto-fail)
- No special handling needed
- All modifiers shown in chat for transparency

**4. RoF Changed After Checking:**
- `updateMovingCheckbox()` resets checkbox when hidden
- Prevents invisible checked state
- Clean UX behavior

**5. Zero Agility Bonus:**
- Label: "Move up to 0m (loses +10 bonus)"
- Technically correct (character can't move, but that's their limitation)
- Checkbox still functional (penalty applies if checked)

**6. Preset Options with Invalid Weapon:**
```javascript
if (options.moving) {
  const movingCb = el.querySelector('#moving');
  if (movingCb && !movingCb.disabled) {  // Only if enabled
    movingCb.checked = true;
  }
}
```
- Heavy/Thrown weapons ignore `moving: true` preset
- Safe fallback behavior

### Backwards Compatibility

**Default Parameter Values:**
- `isMoving = false` in all function signatures
- Existing calls without `isMoving` continue to work
- No movement penalty applied by default
- Existing tests pass without modification

**Hotbar Macro Support:**
```javascript
// New hotbar macro option
await actor.items.getName("Bolter").attackDialog({
  rof: 2,           // Full-Auto
  aim: 2,           // Full Aim
  moving: true,     // NEW: Moving while firing
  skipDialog: true
});
```

---

## Testing Strategy

### Unit Tests

**File:** `tests/combat/combat-dialog.test.mjs`

**Test Suite 1: `buildAttackModifiers()` movement penalties**
1. No movement penalty when `isMoving: false`
2. Semi-Auto + moving → `movementPenalty = -10`, target number = BS + 10 - 10
3. Full-Auto + moving → `movementPenalty = -30`, target number = BS + 20 - 30
4. Single Shot + moving → `movementPenalty = 0` (no effect)
5. Movement + other modifiers → correct stacking

**Test Suite 2: `buildModifierParts()` display**
1. `movementPenalty = 0` → not displayed
2. `movementPenalty = -10` → displays "-10 Moving while firing"
3. `movementPenalty = -30` → displays "-30 Moving while firing"
4. RoF displayed before movement penalty (correct order)

### Integration Tests

**File:** `tests/combat/resolve-ranged-attack.test.mjs`

**Test Suite: Movement penalties**
1. Semi-Auto + `isMoving: true` → target number, modifierParts correct
2. Full-Auto + `isMoving: true` → target number, modifierParts correct
3. Jam threshold still 94+ with movement
4. Rounds fired still correct with movement
5. Hit calculation still correct with movement
6. Movement + aim + range modifiers → all stack correctly
7. Backwards compatibility: no `isMoving` param → defaults to false

### Manual Testing Checklist

**UI Behavior:**
- [ ] RoF dropdown "Single" → moving checkbox hidden
- [ ] Change to "Semi-Auto" → moving checkbox appears with correct label
- [ ] Change to "Full-Auto" → label updates to "becomes -10 penalty"
- [ ] Change back to "Single" → checkbox hides and unchecks
- [ ] Pistol weapon → checkbox enabled
- [ ] Basic weapon → checkbox enabled
- [ ] Heavy weapon → checkbox disabled with tooltip
- [ ] Thrown weapon → checkbox disabled with tooltip
- [ ] Check/uncheck → icon toggles correctly

**Attack Results:**
- [ ] Semi-Auto + moving → target number shows net 0 modifier
- [ ] Full-Auto + moving → target number shows net -10 modifier
- [ ] Chat message shows "-10 Moving while firing" or "-30 Moving while firing"
- [ ] Jam threshold still 94-00 for auto-fire when moving
- [ ] Correct rounds fired when moving
- [ ] Correct hit calculation when moving

**Edge Cases:**
- [ ] Character with AG 0 → label shows "Move up to 0m"
- [ ] Hotbar macro `moving: true` works
- [ ] Hotbar macro `moving: true` on Heavy weapon → ignored

---

## Files Modified

### Source Files

**1. `src/module/helpers/combat/combat-dialog.mjs`**
- `buildAttackModifiers()`: Add `isMoving` parameter, movement penalty logic, return `movementPenalty`
- `buildModifierParts()`: Add `movementPenalty` parameter, display logic

**2. `src/module/helpers/combat/ranged-combat.mjs`**
- `resolveRangedAttack()`: Accept `isMoving`, pass to helpers, destructure `movementPenalty`
- `attackDialog()`: Add moving checkbox HTML, AG Bonus calculation, weapon class check, dynamic visibility logic, event handlers, preset handling
- `_attackWithOptions()`: Extract `isMoving` from options, pass to `resolveRangedAttack()`

### Test Files

**3. `tests/combat/combat-dialog.test.mjs`**
- New test suite: `buildAttackModifiers()` movement penalties (5 tests)
- New test suite: `buildModifierParts()` display (4 tests)

**4. `tests/combat/resolve-ranged-attack.test.mjs`**
- New test suite: Movement penalties integration (7 tests)

### Summary

**Total Files Modified:** 4  
**Estimated Lines Changed:**
- Source code: ~150 lines
- Test code: ~220 lines
- **Total: ~370 lines**

---

## Implementation Notes

### JavaScript Event Handling

**Dynamic Label Updates:**
- Label text and tooltip update when RoF dropdown changes
- AG Bonus displayed in real-time from actor data
- Disabled state and tooltips reflect weapon class restrictions

**Icon Toggle Pattern:**
- Reuses existing `setupCheckbox()` helper
- Consistent with Called Shot / Running Target checkboxes
- FontAwesome `fa-square` ↔ `fa-check-square`

**State Management:**
- Checkbox resets to unchecked when hidden
- Prevents invisible checked state
- Clean UX behavior

### Performance Considerations

**Minimal Overhead:**
- Movement penalty calculation is a simple if/else check
- No additional API calls or database queries
- Event listeners are lightweight (change event only)
- AG Bonus extracted once at dialog creation

**No Impact on Existing Systems:**
- All existing logic paths unchanged
- `autoFire` value preserved for critical checks
- Backwards compatible (defaults to `false`)

---

## Future Enhancements (Out of Scope)

**Potential Future Work:**
1. Movement distance tracking (currently binary: moving or not)
2. Different penalties for partial movement (< AG Bonus)
3. Movement visualization on grid/hex map
4. Movement macro commands for hotbar
5. Movement history tracking in combat log

**These are NOT part of this implementation.**

---

## Success Criteria

**Feature is complete when:**
1. ✅ Moving checkbox appears dynamically for Semi/Full-Auto
2. ✅ Checkbox shows AG Bonus in label
3. ✅ Checkbox disabled for Heavy/Thrown weapons with tooltip
4. ✅ Semi-Auto + moving applies -10 penalty (net 0)
5. ✅ Full-Auto + moving applies -30 penalty (net -10)
6. ✅ Movement penalty shown separately in chat modifiers
7. ✅ All existing logic (jam, rounds, hits) still works correctly
8. ✅ Hotbar macro support (`moving: true/false`)
9. ✅ All unit tests pass
10. ✅ All integration tests pass
11. ✅ Manual testing checklist complete

---

_Blessed be the code. Praise the Omnissiah._ ⚙️
