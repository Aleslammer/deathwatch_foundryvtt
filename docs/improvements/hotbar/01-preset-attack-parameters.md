# Hotbar Preset Attack Parameters

## Overview
Allow hotbar weapon macros to accept pre-loaded combat parameters so that clicking the macro either skips the attack dialog entirely (auto-fire mode) or pre-fills the dialog with saved defaults. This enables "one-click" attack macros for common weapon configurations.

## Problem
Currently, `rollItemMacro(uuid)` always shows an intermediate Attack/Damage choice dialog, then the full attack dialog with all options at defaults (no aim, single shot, no called shot, no running target, 0 misc modifier). Players who repeatedly use the same weapon configuration (e.g., semi-auto burst with a +10 situational bonus) must manually set these options every time.

## Current Flow
```
Hotbar Click
  → rollItemMacro(uuid)
    → Attack/Damage Dialog (weapon image, two buttons)
      → "Attack" → CombatHelper.weaponAttackDialog(actor, weapon)
        → RangedCombatHelper.attackDialog(actor, weapon)  ← full dialog, all defaults
        → MeleeCombatHelper.attackDialog(actor, weapon)   ← full dialog, all defaults
      → "Damage" → CombatHelper.weaponDamageRoll(actor, weapon)
```

## Proposed API

### Ranged Weapons
```javascript
game.deathwatch.rollItemMacro(uuid, {
  aim: 0|1|2,           // 0=None, 1=Half(+10), 2=Full(+20)
  rof: 0|1|2,           // 0=Single, 1=Semi-Auto(+10), 2=Full-Auto(+20)
  calledShot: false,     // true = -20 Called Shot
  calledShotLocation: "Head",  // HIT_LOCATIONS value (only if calledShot=true)
  runningTarget: false,  // true = -20 Running Target
  miscModifier: 0,       // integer misc modifier
  skipDialog: false      // true = roll immediately, false = pre-fill dialog
});
```

### Melee Weapons
```javascript
game.deathwatch.rollItemMacro(uuid, {
  aim: 0|1|2,           // 0=None, 1=Half(+10), 2=Full(+20)
  allOut: false,         // true = +20 All Out Attack
  charge: false,         // true = +10 Charge
  calledShot: false,
  calledShotLocation: "Head",
  runningTarget: false,
  miscModifier: 0,
  skipDialog: false
});
```

### Signature
```javascript
function rollItemMacro(itemUuid, options = {}) {
  // options is always a named-argument object
}
```

## Proposed Flow

### With skipDialog: true
```
Hotbar Click
  → rollItemMacro(uuid, options)
    → Skip Attack/Damage dialog (go straight to Attack)
    → CombatHelper.weaponAttackDialog(actor, weapon, options)
      → RangedCombatHelper.attackDialog(actor, weapon, options)
        → Skip dialog, roll immediately with preset values
      → MeleeCombatHelper.attackDialog(actor, weapon, options)
        → Skip dialog, roll immediately with preset values
```

### With skipDialog: false (pre-fill mode)
```
Hotbar Click
  → rollItemMacro(uuid, options)
    → Skip Attack/Damage dialog (go straight to Attack)
    → CombatHelper.weaponAttackDialog(actor, weapon, options)
      → RangedCombatHelper.attackDialog(actor, weapon, options)
        → Show dialog with options pre-filled (user can adjust before rolling)
```

### With no options (backward compatible)
```
Hotbar Click
  → rollItemMacro(uuid)
    → Attack/Damage Dialog (unchanged current behavior)
```

## Implementation Plan

### Phase 1: Core Parameter Passing
**Files to modify:**

1. **`deathwatch.mjs`** — `rollItemMacro()`
   - Accept `...args` after uuid
   - Parse positional or object form into normalized options
   - For weapons with options: skip Attack/Damage dialog, go straight to attack
   - Pass options through to `CombatHelper.weaponAttackDialog()`

2. **`combat/combat.mjs`** — `weaponAttackDialog()`
   - Accept optional `options` parameter
   - Pass through to `RangedCombatHelper.attackDialog()` or `MeleeCombatHelper.attackDialog()`

3. **`combat/ranged-combat.mjs`** — `attackDialog()`
   - Accept optional `options` parameter
   - **skipDialog: true** — validate weapon + RoF, compute range, roll immediately using `resolveRangedAttack()` with preset values, post results, deduct ammo
   - **skipDialog: false (pre-fill)** — render dialog with form values pre-set from options (see Pre-Fill Details below)
   - Map option values to constants:
     - `rof: 0` → `RATE_OF_FIRE_MODIFIERS.SINGLE`
     - `rof: 1` → `RATE_OF_FIRE_MODIFIERS.SEMI_AUTO`
     - `rof: 2` → `RATE_OF_FIRE_MODIFIERS.FULL_AUTO`
     - `aim: 0/1/2` → `AIM_MODIFIERS.NONE/HALF/FULL`

4. **`combat/melee-combat.mjs`** — `attackDialog()`
   - Accept optional `options` parameter
   - Same skip/pre-fill logic as ranged
   - Map `allOut`/`charge` booleans to `MELEE_MODIFIERS` constants

### Pre-Fill Details (skipDialog: false)

When options are provided but `skipDialog` is false (or omitted), the dialog renders normally but with form values pre-set.

**Ranged dialog pre-fill:**
- `aim` → set `selected` attribute on matching `<option>` in `#aim` select
- `rof` → set `selected` attribute on matching `<option>` in `#autoFire` select
- `calledShot` → set checkbox checked, toggle icon to `fa-check-square`, show `#calledShotLocationGroup`
- `calledShotLocation` → set `selected` on matching `<option>` in `#calledShotLocation` select
- `runningTarget` → set checkbox checked, toggle icon to `fa-check-square`
- `miscModifier` → set `value` attribute on `#miscModifier` input

**Melee dialog pre-fill:**
- `aim` → set `selected` on `#aim` select
- `allOut` → set checkbox checked, toggle icon
- `charge` → set checkbox checked, toggle icon
- `calledShot` → set checkbox checked, toggle icon, show location group
- `calledShotLocation` → set `selected` on location select
- `runningTarget` → set checkbox checked, toggle icon
- `miscModifier` → set `value` on input

**Implementation approach:** Apply pre-fill in the dialog's `render` callback, after the existing event listener setup:
```javascript
render: (html) => {
  // ... existing event listeners ...

  // Pre-fill from options
  if (options.aim !== undefined) html.find('#aim').val(options.aim * 10); // map 0/1/2 to 0/10/20
  if (options.rof !== undefined) html.find('#autoFire').val(options.rof * 10);
  if (options.calledShot) {
    html.find('#calledShot').prop('checked', true);
    html.find('#calledShotIcon').removeClass('fa-square').addClass('fa-check-square');
    html.find('#calledShotLocationGroup').show();
    if (options.calledShotLocation) html.find('#calledShotLocation').val(options.calledShotLocation);
  }
  if (options.runningTarget) {
    html.find('#runningTarget').prop('checked', true);
    html.find('#runningTargetIcon').removeClass('fa-square').addClass('fa-check-square');
  }
  if (options.miscModifier !== undefined) html.find('#miscModifier').val(options.miscModifier);
}
```

The `render` callback fires after Foundry inserts the HTML into the DOM, so jQuery selectors work. The user sees the pre-filled values and can adjust before clicking Attack.

### Phase 2: Macro Command Generation
**Files to modify:**

1. **`deathwatch.mjs`** — `createItemMacro()`
   - Generate macro command with placeholder for options:
     ```javascript
     // Current:
     `game.deathwatch.rollItemMacro("${data.uuid}");`
     // New (same default, but user can edit):
     `game.deathwatch.rollItemMacro("${data.uuid}");`
     ```
   - No change to default macro creation — users edit the macro command manually to add parameters
   - Document the parameter format in a comment within the generated macro

2. **Optional: Macro edit helper dialog**
   - When right-clicking a weapon macro → "Configure Attack Preset"
   - Dialog with checkboxes/dropdowns matching attack dialog
   - Generates the correct `rollItemMacro()` call with parameters
   - This is a nice-to-have, not required for Phase 1

### Phase 3: Skip Attack/Damage Choice
When options are provided, skip the intermediate Attack/Damage dialog entirely and go straight to attack. The user's intent is clear — they want to attack with these specific parameters.

For damage-only macros, a separate approach could be:
```javascript
game.deathwatch.rollItemMacro(uuid, { action: "damage" });
```

## Constants Mapping

### Rate of Fire
| Shorthand | Constant | Value | Meaning |
|-----------|----------|-------|---------|
| 0 | `RATE_OF_FIRE_MODIFIERS.SINGLE` | 0 | Single shot |
| 1 | `RATE_OF_FIRE_MODIFIERS.SEMI_AUTO` | 10 | Semi-auto (+10) |
| 2 | `RATE_OF_FIRE_MODIFIERS.FULL_AUTO` | 20 | Full-auto (+20) |

### Aim
| Shorthand | Constant | Value | Meaning |
|-----------|----------|-------|---------|
| 0 | `AIM_MODIFIERS.NONE` | 0 | No aim |
| 1 | `AIM_MODIFIERS.HALF` | 10 | Half aim (+10) |
| 2 | `AIM_MODIFIERS.FULL` | 20 | Full aim (+20) |

### Called Shot Locations
Values from `HIT_LOCATIONS`: "Head", "Right Arm", "Left Arm", "Body", "Right Leg", "Left Leg"

## Validation Rules
- `rof` must be available on the weapon's RoF string (e.g., can't use Semi-Auto if weapon is S/-/-). If not available, **warn and abort** — do not fall back silently
- `rof` must have sufficient ammo (same check as dialog). If insufficient, **warn and abort**
- `calledShotLocation` only used when `calledShot` is true
- Weapon must pass `validateWeaponForAttack()` (not jammed, has ammo if needed)
- Target must be selected for range calculation (warn if missing, still allow roll)

### RoF Validation Logic
```javascript
static validateRofOption(rofOption, weapon, actor) {
  const rof = weapon.system.effectiveRof || weapon.system.rof || "S/-/-";
  const rofParts = rof.split('/');
  const clip = weapon.system.clip;
  const hasAmmoManagement = clip && clip !== '—' && clip !== '-' && clip !== '';
  const loadedAmmo = hasAmmoManagement && weapon.system.loadedAmmo
    ? actor.items.get(weapon.system.loadedAmmo) : null;
  const currentAmmo = loadedAmmo?.system.capacity.value || 0;

  if (rofOption === 1) { // Semi-Auto
    const semiAutoRounds = parseInt(rofParts[1]) || 0;
    if (!rofParts[1] || rofParts[1] === '-') {
      return { valid: false, message: `${weapon.name} does not support Semi-Auto fire.` };
    }
    if (hasAmmoManagement && currentAmmo < semiAutoRounds) {
      return { valid: false, message: `${weapon.name} needs ${semiAutoRounds} rounds for Semi-Auto but only has ${currentAmmo}.` };
    }
  }
  if (rofOption === 2) { // Full-Auto
    const fullAutoRounds = parseInt(rofParts[2]) || 0;
    if (!rofParts[2] || rofParts[2] === '-') {
      return { valid: false, message: `${weapon.name} does not support Full-Auto fire.` };
    }
    if (hasAmmoManagement && currentAmmo < fullAutoRounds) {
      return { valid: false, message: `${weapon.name} needs ${fullAutoRounds} rounds for Full-Auto but only has ${currentAmmo}.` };
    }
  }
  return { valid: true };
}
```

## Example Macros

### Semi-Auto Burst
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", { rof: 1, skipDialog: true });
```

### Full-Auto Suppression with +10 bonus
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", { rof: 2, miscModifier: 10, skipDialog: true });
```

### Called Shot to Head
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  calledShot: true,
  calledShotLocation: "Head",
  skipDialog: true
});
```

### Aimed Semi-Auto (pre-fill dialog)
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  aim: 2,
  rof: 1,
  skipDialog: false
});
```

### Melee Charge
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", { charge: true, skipDialog: true });
```

### Damage Only
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", { action: "damage" });
```

## Backward Compatibility
- `rollItemMacro(uuid)` with no extra args behaves exactly as today
- Existing macros with `game.deathwatch.rollItemMacro("uuid");` continue to work unchanged
- The Attack/Damage choice dialog only appears when no options are provided
- `skipDialog` defaults to `false` — passing options without `skipDialog: true` pre-fills the dialog

## Test Plan

### New Test File: `tests/hotbar/hotbar-macros.test.mjs`

**rollItemMacro option parsing:**
| Test | Description |
|------|-------------|
| No args → shows Attack/Damage dialog | Backward compatibility — choice dialog rendered |
| Empty object → shows Attack/Damage dialog | `{}` treated same as no args |
| Object with options → skips choice dialog | Goes straight to weaponAttackDialog |
| action: "damage" → skips to damage roll | Goes straight to weaponDamageRoll |
| action: "attack" explicit → goes to attack | Same as default when options present |
| Psychic power ignores options | Options don't affect psychic-power routing |
| Non-weapon item ignores options | Falls through to item.roll() |

**RoF validation (validateRofOption):**
| Test | Description |
|------|-------------|
| rof: 0 on S/-/- weapon → valid | Single always available if weapon has S |
| rof: 1 on S/3/- weapon → valid | Semi-Auto available |
| rof: 2 on S/3/- weapon → invalid | Full-Auto not available, warn + abort |
| rof: 1 on S/-/- weapon → invalid | Semi-Auto not available, warn + abort |
| rof: 2 on S/3/6 weapon → valid | Full-Auto available |
| rof: 1 with insufficient ammo → invalid | Not enough rounds for Semi-Auto |
| rof: 2 with insufficient ammo → invalid | Not enough rounds for Full-Auto |
| rof: 0 with 1 round remaining → valid | Single shot only needs 1 round |
| No ammo management (clip: '—') → valid | Ammo check skipped |
| effectiveRof overrides base rof | Ammunition-modified RoF used for validation |

### New Test File: `tests/combat/ranged-combat-options.test.mjs`

**skipDialog: true (immediate roll):**
| Test | Description |
|------|-------------|
| Single shot with defaults | rof: 0, no modifiers → resolveRangedAttack called with correct values |
| Semi-Auto preset | rof: 1 → autoFire = RATE_OF_FIRE_MODIFIERS.SEMI_AUTO |
| Full-Auto preset | rof: 2 → autoFire = RATE_OF_FIRE_MODIFIERS.FULL_AUTO |
| Aim half preset | aim: 1 → aim = AIM_MODIFIERS.HALF |
| Aim full preset | aim: 2 → aim = AIM_MODIFIERS.FULL |
| Called shot preset | calledShot: true → COMBAT_PENALTIES.CALLED_SHOT applied |
| Called shot location preset | calledShotLocation: "Head" → stored in lastCalledShotLocation |
| Running target preset | runningTarget: true → COMBAT_PENALTIES.RUNNING_TARGET applied |
| Misc modifier preset | miscModifier: 30 → added to modifier total |
| Combined options | aim: 2, rof: 1, calledShot: true, miscModifier: 10 → all applied |
| Range auto-calculated | Token distance still computed even in skip mode |
| Ammo deducted | Rounds fired deducted from loaded ammo |
| Jam check still runs | Jam threshold checked, weapon marked jammed if triggered |
| Chat message posted | Attack result posted to chat with modifier breakdown |
| lastAttack state stored | CombatHelper.lastAttackRoll etc. set for damage roll |
| Invalid RoF aborts | rof: 2 on S/-/- → warn, no roll |
| Weapon validation runs | Jammed weapon → warn, no roll |

**skipDialog: false (pre-fill):**
| Test | Description |
|------|-------------|
| aim pre-filled | aim: 2 → #aim select value set to 20 |
| rof pre-filled | rof: 1 → #autoFire select value set to 10 |
| calledShot pre-filled | calledShot: true → checkbox checked, icon toggled, location group shown |
| calledShotLocation pre-filled | calledShotLocation: "Head" → location select set |
| runningTarget pre-filled | runningTarget: true → checkbox checked, icon toggled |
| miscModifier pre-filled | miscModifier: 30 → input value set to 30 |
| No options → defaults unchanged | Empty options → dialog renders with normal defaults |
| Partial options → only specified fields set | rof: 1 only → aim stays None, misc stays 0 |

### New Test File: `tests/combat/melee-combat-options.test.mjs`

**skipDialog: true (immediate roll):**
| Test | Description |
|------|-------------|
| Defaults (no modifiers) | No options → resolves with base WS only |
| All Out Attack preset | allOut: true → MELEE_MODIFIERS.ALL_OUT_ATTACK applied |
| Charge preset | charge: true → MELEE_MODIFIERS.CHARGE applied |
| Aim preset | aim: 1 → AIM_MODIFIERS.HALF applied |
| Called shot preset | calledShot: true → COMBAT_PENALTIES.CALLED_SHOT applied |
| Running target preset | runningTarget: true → COMBAT_PENALTIES.RUNNING_TARGET applied |
| Misc modifier preset | miscModifier: 15 → added to modifier total |
| Combined options | charge: true, calledShot: true, miscModifier: 5 → all applied |
| Chat message posted | Attack result posted with modifier breakdown |
| lastAttack state stored | CombatHelper state set for damage roll |

**skipDialog: false (pre-fill):**
| Test | Description |
|------|-------------|
| allOut pre-filled | allOut: true → checkbox checked, icon toggled |
| charge pre-filled | charge: true → checkbox checked, icon toggled |
| aim pre-filled | aim: 2 → #aim select value set to 20 |
| calledShot pre-filled | calledShot: true → checkbox checked, icon toggled, location group shown |
| runningTarget pre-filled | runningTarget: true → checkbox checked, icon toggled |
| miscModifier pre-filled | miscModifier: 15 → input value set |
| Partial options → only specified fields set | charge only → allOut stays unchecked |

### Estimated Test Count
- `hotbar-macros.test.mjs`: ~17 tests
- `ranged-combat-options.test.mjs`: ~25 tests
- `melee-combat-options.test.mjs`: ~17 tests
- **Total: ~59 new tests**

## Files Summary

| File | Change |
|------|--------|
| `src/module/deathwatch.mjs` | `rollItemMacro()` accepts options, skips choice dialog when options present |
| `src/module/helpers/combat/combat.mjs` | `weaponAttackDialog()` passes options through |
| `src/module/helpers/combat/ranged-combat.mjs` | `attackDialog()` accepts options, skip/pre-fill logic, `validateRofOption()` |
| `src/module/helpers/combat/melee-combat.mjs` | `attackDialog()` accepts options, skip/pre-fill logic |
| `tests/hotbar/hotbar-macros.test.mjs` | New — option parsing, routing, backward compatibility (~17 tests) |
| `tests/combat/ranged-combat-options.test.mjs` | New — skip-dialog + pre-fill for ranged (~25 tests) |
| `tests/combat/melee-combat-options.test.mjs` | New — skip-dialog + pre-fill for melee (~17 tests) |

## Notes
- The `resolveRangedAttack()` and `resolveMeleeAttack()` pure functions already exist and handle all the combat math — the skip-dialog path just needs to call them directly with the preset values instead of reading from HTML form fields
- Range calculation still happens automatically from token positions even in skip-dialog mode
- Ammo deduction, jam checks, and all other side effects still apply
- Psychic power macros are unaffected (they already go straight to focusPowerDialog)
- Flame weapons are unaffected (they bypass the attack dialog anyway)

## Documentation
- **User-facing guide**: `docs/hotbar-macros.md` — linked from README Hotbar Macros section
- **README.md**: Updated Hotbar Macros feature bullet to mention presets with link to guide
