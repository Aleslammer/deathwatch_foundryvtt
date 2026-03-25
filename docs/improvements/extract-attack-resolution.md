# Extract Attack Resolution from Dialog Callbacks

## Problem

The ranged and melee attack resolution logic lives inside Dialog button callbacks in `ranged-combat.mjs` and `melee-combat.mjs`. These callbacks are marked `/* istanbul ignore next */` because they depend on Foundry UI globals (`Dialog`, `Roll`, `html.find`, etc.) that can't run in Jest.

This means the full attack flow — quality detection, maxHits calculation, hit resolution, jam checks, ammo deduction — is untestable as a unit. Bugs like variable ordering issues (e.g., using `isTwinLinked` before it's declared) can only be caught at runtime in Foundry.

### Example: Twin-Linked Bug

```javascript
// Inside Dialog callback — untestable
const roundsFired = CombatDialogHelper.determineRoundsFired(autoFire, rofParts);
let maxHits = roundsFired;
if (isTwinLinked) maxHits += 1;  // ReferenceError — isTwinLinked declared below

const isTwinLinked = await WeaponQualityHelper.hasQuality(weapon, 'twin-linked');
```

Unit tests for `calculateHits()` passed because they test the pure function in isolation with `isTwinLinked` passed as a parameter. The ordering bug only existed in the callback glue code.

## Proposed Solution

Extract the attack resolution into a testable static method that takes parsed inputs and returns results. The Dialog callback becomes thin glue that parses UI inputs, calls the resolution method, and posts results.

### Before (current)

```
attackDialog()
  └── new Dialog({ callback: async (html) => {
        // 100+ lines: parse inputs, detect qualities, calculate hits,
        // check jams, deduct ammo, build messages — all untestable
      }})
```

### After (proposed)

```
attackDialog()
  └── new Dialog({ callback: async (html) => {
        const inputs = parseDialogInputs(html);        // thin UI parsing
        const result = await resolveRangedAttack(...);  // testable
        await postAttackResults(result);                // thin UI output
      }})

resolveRangedAttack(actor, weapon, options)
  ├── Detect weapon qualities
  ├── Calculate maxHits (with twin-linked adjustment)
  ├── Build attack modifiers
  ├── Calculate hits
  ├── Check jam/overheat/detonation
  └── Return { hitValue, targetNumber, hitsTotal, isJammed, ... }
```

### New Method Signature

```javascript
static async resolveRangedAttack(actor, weapon, options) {
  // options: { aim, autoFire, calledShot, runningTarget, miscModifier,
  //            rangeMod, rangeLabel, roundsFired, rofParts }
  // Returns: { hitValue, targetNumber, hitsTotal, maxHits, isJammed,
  //            isOverheated, hasPrematureDetonation, modifierParts, ... }
}
```

### Test Coverage Gained

- Variable ordering (qualities detected before use)
- maxHits calculation with Twin-Linked, Storm combinations
- Jam threshold with Reliable interaction
- Premature detonation check
- Ammo expenditure calculation (Storm × Twin-Linked multipliers)
- Full quality interaction chains (Accurate + Twin-Linked + Storm)
- Horde hit recalculation flow

## Scope

- `ranged-combat.mjs`: Extract `resolveRangedAttack()` from callback
- `melee-combat.mjs`: Extract `resolveMeleeAttack()` from callback (same pattern)
- New test files or extend existing `ranged-combat.test.mjs` / `melee-combat.test.mjs`

## Effort

Medium — the logic extraction is straightforward but touches the core combat flow. Needs careful testing to ensure no regressions in the Dialog UI behavior.

## Priority

Low-medium. Current pure function tests cover the calculation logic well. This improvement catches integration/ordering bugs in the glue code.
