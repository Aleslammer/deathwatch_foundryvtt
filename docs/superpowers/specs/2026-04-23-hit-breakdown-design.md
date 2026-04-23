# Hit Breakdown Display Design

**Date:** 2026-04-23  
**Status:** Approved  
**Author:** Claude (Machine Spirit)

## Overview

Add a collapsible "Hits" section to attack chat messages that explains the hit calculation breakdown using detailed step-by-step logic. This enhancement provides transparency and educational value for combat mechanics.

## Goals

- Display how total hits are calculated for all ranged and melee attacks
- Show calculation steps: Degrees of Success, Rate of Fire caps, bonuses (Blast, Explosive, Power Field)
- Use consistent UI pattern matching the existing "Modifiers" collapsible section
- Maintain backward compatibility with existing attack resolution code

## Non-Goals

- Changing the underlying hit calculation logic (already correct after blast fix)
- Adding new combat mechanics or rules
- Modifying damage resolution or application

## Architecture

### Pattern: Mirror Existing Modifiers System

The implementation follows the existing `modifierParts` array pattern:
1. Build `hitsParts` string array during attack resolution
2. Pass array to `buildAttackFlavor()` alongside `modifierParts`
3. Format into collapsible HTML `<details>` element

### Key Components

**Modified Files:**
- `src/module/helpers/combat/combat-dialog.mjs` - Enhanced `buildAttackFlavor()` function
- `src/module/helpers/combat/ranged-combat.mjs` - Build `hitsParts` during resolution
- `src/module/helpers/combat/melee-combat.mjs` - Build `hitsParts` during resolution

**New Return Values:**
- `resolveRangedAttack()` returns `hitsParts` array
- `resolveMeleeAttack()` returns `hitsParts` array (when implemented)

## Data Flow

### Ranged Attack Flow

1. `resolveRangedAttack()` calculates hits using existing logic
2. Build `hitsParts` array with calculation steps:
   - Degrees of Success
   - Rate of Fire and rounds fired
   - Base hits (capped by RoF)
   - Blast bonus (if applicable)
   - Explosive bonus (if applicable)
3. For flame weapons vs hordes, append flame 1d5 result after roll
4. Return `hitsParts` alongside existing return values
5. Pass to `buildAttackFlavor(label, modifierParts, hitsParts)`
6. Display in chat message with collapsible section

### Melee Attack Flow

1. Calculate hits based on target type (horde vs single)
2. Build `hitsParts` array:
   - **Horde:** DoS, base calculation (DoS ÷ 2, min 1), Power Field bonus
   - **Single:** Simple "1 Hit (successful attack)"
3. Pass to `buildAttackFlavor()`
4. Display in chat message

## Detailed Implementation

### 1. Enhanced `buildAttackFlavor()` Function

**Location:** `src/module/helpers/combat/combat-dialog.mjs`

```javascript
static buildAttackFlavor(label, modifierParts, hitsParts = []) {
  let flavor = label;
  
  // Add Hits section if hitsParts provided
  if (hitsParts.length > 0) {
    flavor += `<details style="margin-top:4px;">
      <summary style="cursor:pointer;font-size:0.9em;">Hits</summary>
      <div style="font-size:0.85em;margin-top:4px;">
        ${hitsParts.join('<br>')}
      </div>
    </details>`;
  }
  
  // Add Modifiers section if modifierParts provided
  if (modifierParts.length > 0) {
    flavor += `<details style="margin-top:4px;">
      <summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary>
      <div style="font-size:0.85em;margin-top:4px;">
        ${modifierParts.join('<br>')}
      </div>
    </details>`;
  }
  
  return flavor;
}
```

**Changes:**
- Add optional `hitsParts = []` parameter (backward compatible)
- Render Hits section before Modifiers section
- Use identical styling to Modifiers section

### 2. Ranged Attack Hit Breakdown

**Location:** `src/module/helpers/combat/ranged-combat.mjs`

#### 2.1 For Horde Targets

Build detailed breakdown showing full calculation:

```javascript
const hitsParts = [];
const degreesOfSuccess = CombatDialogHelper.calculateDegreesOfSuccess(hitValue, targetNumber);

hitsParts.push(`Degrees of Success: ${degreesOfSuccess}`);
hitsParts.push(`Rate of Fire: ${roundsFired} round${roundsFired !== 1 ? 's' : ''}`);

// Show base hits before horde calculation
const baseHitsBeforeHordeCalc = CombatDialogHelper.calculateHits(
  hitValue, targetNumber, maxHits, autoFire, isScatter, isPointBlank, isStorm, isTwinLinked
);
hitsParts.push(`Base Hits: ${baseHitsBeforeHordeCalc} (capped at ${maxHits})`);

// Show blast bonus if applicable
if (blastValue > 0) {
  hitsParts.push(`Blast [${blastValue}]: +${blastValue}`);
}

// Show explosive bonus if applicable
const isExplosive = weapon.system.dmgType?.toLowerCase() === 'explosive';
if (isExplosive && blastValue > 0) {
  hitsParts.push(`Explosive Damage: +1`);
}

hitsParts.push(`<strong>Total: ${hitsTotal}</strong>`);
```

**After flame 1d5 roll (if applicable):**
```javascript
if (isFlame && targetActor.type === 'horde') {
  const flameRoll = await new Roll('1d5').evaluate();
  hitsTotal += flameRoll.total;
  hitsParts.push(`Flame vs Horde: +${flameRoll.total} (1d5)`);
  // Update total line
  hitsParts[hitsParts.length - 1] = `<strong>Total: ${hitsTotal}</strong>`;
}
```

#### 2.2 For Single Targets

Simpler breakdown for non-horde targets:

```javascript
const hitsParts = [];
hitsParts.push(`Degrees of Success: ${degreesOfSuccess}`);

if (roundsFired > 1) {
  hitsParts.push(`Rate of Fire: ${roundsFired} rounds`);
  hitsParts.push(`Base Hits: ${hitsTotal} (capped at ${maxHits})`);
}

if (isTwinLinked && degreesOfSuccess >= 2) {
  hitsParts.push(`Twin-Linked: +1 (2+ DoS)`);
}

if (isStorm && hitsTotal > 0) {
  const preStormHits = Math.floor(hitsTotal / 2);
  hitsParts.push(`Storm Quality: ×2 (${preStormHits} → ${hitsTotal})`);
}

hitsParts.push(`<strong>Total: ${hitsTotal} Hit${hitsTotal !== 1 ? 's' : ''}</strong>`);
```

### 3. Melee Attack Hit Breakdown

**Location:** `src/module/helpers/combat/melee-combat.mjs`

#### 3.1 For Horde Targets

```javascript
const hitsParts = [];
const degreesOfSuccess = CombatDialogHelper.calculateDegreesOfSuccess(hitValue, targetNumber);

hitsParts.push(`Degrees of Success: ${degreesOfSuccess}`);

const baseHits = degreesOfSuccess >= 2 ? Math.floor(degreesOfSuccess / 2) : 1;
hitsParts.push(`Base Hits: ${baseHits} (DoS ÷ 2, minimum 1 on success)`);

if (hasPowerField) {
  hitsParts.push(`Power Field: +1`);
}

hitsParts.push(`<strong>Total: ${hitsTotal}</strong>`);
```

#### 3.2 For Single Targets

```javascript
const hitsParts = [`<strong>1 Hit</strong> (successful attack)`];
```

## Edge Cases and Special Scenarios

### Missed Attacks (hitsTotal = 0)

Show breakdown even on miss to explain why:

```javascript
hitsParts.push(`Degrees of Success: ${degreesOfSuccess} (negative = miss)`);
hitsParts.push(`<strong>Total: 0 Hits (MISS)</strong>`);
```

### Twin-Linked Bonus

Include when 2+ DoS adds extra hit:

```javascript
if (isTwinLinked && degreesOfSuccess >= 2) {
  hitsParts.push(`Twin-Linked: +1 (2+ DoS)`);
}
```

### Storm Quality

Show multiplication effect:

```javascript
if (isStorm && calculatedHits > 0) {
  const preStormHits = Math.floor(calculatedHits / 2);
  hitsParts.push(`Storm Quality: ×2 (${preStormHits} → ${calculatedHits})`);
}
```

### Scatter at Point Blank

Show scatter bonus calculation:

```javascript
if (isScatter && isPointBlank) {
  const scatterBonus = Math.floor(degreesOfSuccess / 2);
  hitsParts.push(`Scatter (Point Blank): +${scatterBonus} (DoS ÷ 2)`);
}
```

### Flame Weapons vs Hordes

Two-stage process:
1. Show initial calculation (base + blast + explosive)
2. After 1d5 roll, append flame result and update total line

```javascript
// Before flame roll
hitsParts.push(`<strong>Total: ${hitsTotal}</strong>`);

// After flame roll
const flameRoll = await new Roll('1d5').evaluate();
hitsTotal += flameRoll.total;
hitsParts.push(`Flame vs Horde: +${flameRoll.total} (1d5)`);
hitsParts[hitsParts.length - 1] = `<strong>Total: ${hitsTotal}</strong>`;
```

## Visual Design

### HTML Structure

```html
<details style="margin-top:4px;">
  <summary style="cursor:pointer;font-size:0.9em;">Hits</summary>
  <div style="font-size:0.85em;margin-top:4px;">
    Degrees of Success: 8<br>
    Rate of Fire: 3 rounds<br>
    Base Hits: 3 (capped at 3)<br>
    Blast [2]: +2<br>
    Explosive Damage: +1<br>
    <strong>Total: 6</strong>
  </div>
</details>
```

### Styling Consistency

- **Summary font-size:** 0.9em (matches Modifiers)
- **Content font-size:** 0.85em (matches Modifiers)
- **Margin-top:** 4px (matches Modifiers)
- **Cursor:** pointer on summary
- **Total line:** Bold via `<strong>` tag

### Section Ordering

1. Attack label (weapon, target number, hit/miss, warnings)
2. **Hits** collapsible section (new)
3. **Modifiers** collapsible section (existing)

## Testing Strategy

### Unit Tests

**File:** `tests/combat/combat-dialog.test.mjs`

1. ✅ `buildAttackFlavor()` with no hitsParts (backward compatibility)
2. ✅ `buildAttackFlavor()` with hitsParts array
3. ✅ `buildAttackFlavor()` with both modifierParts and hitsParts
4. ✅ Verify HTML structure and styling
5. ✅ Verify section ordering (Hits before Modifiers)

**File:** `tests/combat/resolve-ranged-attack.test.mjs`

6. ✅ Ranged attack hit breakdown for horde targets (blast + explosive)
7. ✅ Ranged attack hit breakdown for single targets
8. ✅ Twin-linked bonus in breakdown
9. ✅ Storm quality multiplication in breakdown
10. ✅ Scatter at point blank in breakdown
11. ✅ Missed attack (0 hits) shows breakdown

**File:** `tests/combat/resolve-melee-attack.test.mjs`

12. ✅ Melee attack hit breakdown for horde targets
13. ✅ Melee attack with Power Field bonus
14. ✅ Melee attack hit breakdown for single targets

**File:** `tests/combat/horde-combat.test.mjs`

15. ✅ Flame weapon breakdown (initial calc + 1d5 roll)

### Integration Tests

- Full ranged attack flow with hit breakdown display in chat
- Full melee attack flow with hit breakdown display in chat
- Verify collapsible sections work in Foundry chat

## Backward Compatibility

### No Breaking Changes

- `buildAttackFlavor()` uses optional parameter `hitsParts = []`
- Existing calls without `hitsParts` work unchanged
- No modifications to public APIs beyond adding optional parameter

### Migration Strategy

1. Update `buildAttackFlavor()` signature
2. Update ranged combat callers to pass `hitsParts`
3. Update melee combat callers to pass `hitsParts`
4. All changes in single PR, no intermediate broken states

## Success Criteria

### Functional Requirements

✅ Hit breakdown appears for all ranged attacks  
✅ Hit breakdown appears for all melee attacks  
✅ Breakdown shows calculation steps (DoS, RoF, bonuses)  
✅ Collapsible UI matches Modifiers section style  
✅ Works for both horde and single targets  
✅ Handles edge cases (flame, twin-linked, storm, scatter, misses)

### Non-Functional Requirements

✅ No breaking changes to existing code  
✅ Full test coverage for new functionality  
✅ Visual consistency with existing UI patterns  
✅ Performance impact negligible (string concatenation only)

## Future Enhancements (Out of Scope)

- Localization/i18n support for breakdown text
- Configurable visibility (user setting to hide breakdown)
- Tooltip explanations for each breakdown line
- Color-coding for bonuses vs penalties
- Expandable "learn more" links to rulebook sections

## References

- Existing implementation: `CombatDialogHelper.buildAttackFlavor()` (line 162)
- Ranged combat: `src/module/helpers/combat/ranged-combat.mjs`
- Melee combat: `src/module/helpers/combat/melee-combat.mjs`
- Horde combat rules: `src/module/helpers/combat/horde-combat.mjs`
- Recent blast calculation fix: 2026-04-23 (additive stacking implementation)
