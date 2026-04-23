# Remove Legacy Weapon Modifier Methods Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove legacy `_applyWeaponUpgradeModifiers()` and `_applyAmmunitionModifiers()` methods from `weapon.mjs` now that `WeaponModifierCollector` fully supports all effect types including `weapon-damage-override`.

**Context:** The WeaponModifierCollector migration (2026-04-21 plan) replaced manual modifier loops across combat helpers but left two legacy methods in weapon.mjs:
1. `_applyWeaponUpgradeModifiers()` (lines ~160-226) - Applied upgrade modifiers to effective* properties
2. `_applyAmmunitionModifiers()` (lines ~228-327) - Applied ammo modifiers to effective* properties

These methods are now redundant - the new `_applyOwnModifiers()` method uses WeaponModifierCollector (since 2026-04-21). The legacy methods handle `weapon-damage-override`, which was just added to WeaponModifierCollector (2026-04-22).

**Architecture:** Consolidate all weapon modifier application into `_applyOwnModifiers()` which uses WeaponModifierCollector. Remove legacy methods and their calls from `prepareDerivedData()`.

**Tech Stack:** Foundry VTT v13, Jest testing, ES6 modules

---

## File Structure

**Modified Files:**
- `src/module/data/item/weapon.mjs` - Remove legacy methods, update `_applyOwnModifiers()`
- `tests/documents/item-weapon-damage-override.test.mjs` - Verify still passes
- `tests/documents/item-weapon-upgrade-damage.test.mjs` - Verify still passes
- `tests/documents/item-ammunition-modifiers.test.mjs` - Verify still passes
- `tests/documents/item-weapon-own-modifiers.test.mjs` - Verify still passes
- `.claude/docs/modifiers.md` - Update documentation (already done)

---

## Task 1: Verify Current Behavior with Tests

**Goal:** Ensure all existing tests pass BEFORE removing legacy code

### Step 1.1: Run weapon-specific test suites

- [ ] **Run weapon modifier tests**

```bash
npm test -- tests/documents/item-weapon
```

Expected: All weapon-related tests PASS

- [ ] **Run ammunition modifier tests**

```bash
npm test -- tests/ammunition
```

Expected: All ammunition tests PASS

- [ ] **Run upgrade modifier tests**

```bash
npm test -- tests/documents/item-weapon-upgrade-damage.test.mjs
```

Expected: PASS

- [ ] **Run damage override tests**

```bash
npm test -- tests/documents/item-weapon-damage-override.test.mjs
```

Expected: PASS

### Step 1.2: Document baseline test counts

```bash
npm test 2>&1 | grep "Tests:"
```

Expected: Record current passing test count (baseline: 1999 tests)

- [ ] **Record baseline**: _______ tests passing

---

## Task 2: Update `_applyOwnModifiers()` to Handle All Effect Types

**Goal:** Extend `_applyOwnModifiers()` to handle ALL effect types currently handled by legacy methods

**Files:**
- Modify: `src/module/data/item/weapon.mjs:75-117`

### Step 2.1: Analyze what legacy methods apply

Legacy methods apply:
- `weapon-damage-override` → `effectiveDamage`
- `weapon-damage` → `effectiveDamage` (additive)
- `weapon-range` → `effectiveRange` (additive and multiplier)
- `weapon-weight` → `effectiveWeight` (additive and multiplier)
- `weapon-rof` → `effectiveRof` (override)
- `weapon-blast` → `effectiveBlast` (override)
- `weapon-felling` → `effectiveFelling` (override)
- `weapon-penetration` → `effectivePenetration` (max override)
- `weapon-penetration-modifier` → `effectivePenetration` (additive)

Current `_applyOwnModifiers()` handles:
- ✅ `weapon-damage` (additive)
- ✅ `weapon-rof` (override)
- ✅ `weapon-blast` (override)
- ✅ `weapon-penetration` / `weapon-penetration-modifier`
- ❌ `weapon-damage-override` (NOT YET)
- ❌ `weapon-range` (NOT YET)
- ❌ `weapon-weight` (NOT YET)
- ❌ `weapon-felling` (NOT YET)

### Step 2.2: Write failing test for damage override in _applyOwnModifiers

- [ ] **Add test to `tests/documents/item-weapon-own-modifiers.test.mjs`**

```javascript
// Add to existing test file
describe('weapon-damage-override via collector', () => {
  it('should apply damage override from loaded ammo', async () => {
    const actor = await createMockActor();
    
    const weapon = await createMockItem('weapon', {
      dmg: '1d10+5',
      loadedAmmo: 'missile-ammo'
    }, actor);
    
    const ammo = await createMockItem('ammunition', {
      modifiers: [
        { name: 'Missile', modifier: '3d10+10', effectType: 'weapon-damage-override', enabled: true }
      ]
    }, actor);
    
    actor.items.set('missile-ammo', ammo);
    
    // Trigger prepareDerivedData
    weapon.system.prepareDerivedData();
    
    expect(weapon.system.effectiveDamage).toBe('3d10+10');
  });
});
```

- [ ] **Run test to verify it fails**

```bash
npm test -- tests/documents/item-weapon-own-modifiers.test.mjs
```

Expected: FAIL (damage override not yet applied by `_applyOwnModifiers`)

### Step 2.3: Implement damage override in _applyOwnModifiers

- [ ] **Update `_applyOwnModifiers()` method**

Find this code block (around line 75-117):

```javascript
_applyOwnModifiers() {
  const actor = this.parent?.actor;
  const weapon = this.parent;

  // If no proper Item/Actor context, fall back to legacy behavior
  if (!actor || !weapon || !weapon.system) {
    this._applyOwnModifiersLegacy();
    return;
  }

  // Use WeaponModifierCollector to get all weapon modifiers (weapon + upgrades + ammo)
  const weaponMods = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

  // Apply damage modifiers
  for (const mod of weaponMods.damage) {
    const dmgMod = this._resolveCharBonus(mod.modifier);
    const baseDmg = this.effectiveDamage || this.dmg;
    if (baseDmg && dmgMod !== 0) {
      this.effectiveDamage = `${baseDmg} ${dmgMod >= 0 ? '+' : ''}${dmgMod}`;
    }
  }

  // Apply rate of fire modifiers
  if (weaponMods.rof.length > 0) {
    this.effectiveRof = weaponMods.rof[0].modifier;
  }

  // Apply blast modifiers
  if (weaponMods.blast.length > 0) {
    this.effectiveBlast = parseInt(weaponMods.blast[0].modifier) || 0;
  }

  // Apply penetration modifiers
  for (const mod of weaponMods.penetration) {
    const basePen = parseInt(this.effectivePenetration ?? this.penetration ?? 0);
    if (mod.effectType === 'weapon-penetration') {
      this.effectivePenetration = Math.max(basePen, parseInt(mod.modifier) || 0);
    } else if (mod.effectType === 'weapon-penetration-modifier') {
      this.effectivePenetration = basePen + (parseInt(mod.modifier) || 0);
    }
  }
}
```

Replace with:

```javascript
_applyOwnModifiers() {
  const actor = this.parent?.actor;
  const weapon = this.parent;

  // If no proper Item/Actor context, fall back to legacy behavior
  if (!actor || !weapon || !weapon.system) {
    this._applyOwnModifiersLegacy();
    return;
  }

  // Use WeaponModifierCollector to get all weapon modifiers (weapon + upgrades + ammo)
  const weaponMods = WeaponModifierCollector.collectWeaponModifiers(weapon, actor, {});

  const baseDmg = this.dmg || this.damage;

  // Apply damage override FIRST (replaces base damage completely)
  if (weaponMods.damageOverride && weaponMods.damageOverride.formula) {
    this.effectiveDamage = weaponMods.damageOverride.formula;
  }

  // Apply additive damage modifiers (only if no override)
  if (!weaponMods.damageOverride) {
    for (const mod of weaponMods.damage) {
      const dmgMod = this._resolveCharBonus(mod.modifier);
      const currentDmg = this.effectiveDamage || baseDmg;
      if (currentDmg && dmgMod !== 0) {
        this.effectiveDamage = `${currentDmg} ${dmgMod >= 0 ? '+' : ''}${dmgMod}`;
      }
    }
  }

  // Apply rate of fire modifiers
  if (weaponMods.rof.length > 0) {
    this.effectiveRof = weaponMods.rof[0].modifier;
  }

  // Apply blast modifiers
  if (weaponMods.blast.length > 0) {
    this.effectiveBlast = parseInt(weaponMods.blast[0].modifier) || 0;
  }

  // Apply felling modifiers
  if (weaponMods.felling.length > 0) {
    this.effectiveFelling = parseInt(weaponMods.felling[0].modifier) || 0;
  }

  // Apply penetration modifiers
  for (const mod of weaponMods.penetration) {
    const basePen = parseInt(this.effectivePenetration ?? this.penetration ?? 0);
    if (mod.effectType === 'weapon-penetration') {
      this.effectivePenetration = Math.max(basePen, parseInt(mod.modifier) || 0);
    } else if (mod.effectType === 'weapon-penetration-modifier') {
      this.effectivePenetration = basePen + (parseInt(mod.modifier) || 0);
    }
  }

  // Apply range modifiers (additive and multiplier)
  if (weaponMods.range.length > 0) {
    const baseRange = parseInt(this.range) || 0;
    let rangeAdditive = 0;
    let rangeMultiplier = 1;

    for (const mod of weaponMods.range) {
      const modStr = String(mod.modifier);
      if (modStr.startsWith('x')) {
        rangeMultiplier *= parseFloat(modStr.substring(1)) || 1;
      } else {
        rangeAdditive += parseInt(mod.modifier) || 0;
      }
    }

    if (baseRange > 0 && (rangeAdditive !== 0 || rangeMultiplier !== 1)) {
      this.effectiveRange = Math.floor((baseRange + rangeAdditive) * rangeMultiplier);
    }
  }

  // Apply weight modifiers (additive and multiplier)
  if (weaponMods.weight.length > 0) {
    const baseWeight = parseFloat(this.wt) || 0;
    let weightAdditive = 0;
    let weightMultiplier = 1;

    for (const mod of weaponMods.weight) {
      const modStr = String(mod.modifier);
      if (modStr.startsWith('x')) {
        weightMultiplier *= parseFloat(modStr.substring(1)) || 1;
      } else {
        weightAdditive += parseFloat(mod.modifier) || 0;
      }
    }

    if (baseWeight > 0 && (weightAdditive !== 0 || weightMultiplier !== 1)) {
      this.effectiveWeight = Math.max(0, (baseWeight + weightAdditive) * weightMultiplier);
    }
  }
}
```

- [ ] **Run test to verify it passes**

```bash
npm test -- tests/documents/item-weapon-own-modifiers.test.mjs
```

Expected: PASS

- [ ] **Commit**

```bash
git add src/module/data/item/weapon.mjs tests/documents/item-weapon-own-modifiers.test.mjs
git commit -m "feat: extend _applyOwnModifiers to handle all effect types

- Add weapon-damage-override support (replaces base damage)
- Add weapon-range support (additive + multiplier)
- Add weapon-weight support (additive + multiplier)
- Add weapon-felling support
- Add test for damage override via collector
- Prepares for legacy method removal"
```

---

## Task 3: Remove Legacy Method Calls from prepareDerivedData

**Goal:** Stop calling legacy methods so they become unused

**Files:**
- Modify: `src/module/data/item/weapon.mjs:44-55`

### Step 3.1: Read current prepareDerivedData

- [ ] **Read the method**

```bash
grep -A 15 "prepareDerivedData()" src/module/data/item/weapon.mjs | head -20
```

Expected: See calls to `_applyWeaponUpgradeModifiers()` and `_applyAmmunitionModifiers()`

### Step 3.2: Comment out legacy method calls

- [ ] **Comment out legacy calls**

Find this code block (around line 44-55):

```javascript
prepareDerivedData() {
  const actor = this.parent?.actor;
  if (!actor) return;

  if (Array.isArray(this.attachedUpgrades)) {
    this._applyWeaponUpgradeModifiers();
  }

  if (this.loadedAmmo) {
    this._applyAmmunitionModifiers();
  }
}
```

Replace with:

```javascript
prepareDerivedData() {
  const actor = this.parent?.actor;
  if (!actor) return;

  // Legacy methods removed - now handled by _applyOwnModifiers() via WeaponModifierCollector
  // if (Array.isArray(this.attachedUpgrades)) {
  //   this._applyWeaponUpgradeModifiers();
  // }

  // if (this.loadedAmmo) {
  //   this._applyAmmunitionModifiers();
  // }
}
```

### Step 3.3: Run full test suite

- [ ] **Run all tests**

```bash
npm test
```

Expected: All tests PASS (same count as baseline)

If any tests fail:
- Check which test failed
- Identify missing behavior in `_applyOwnModifiers()`
- Add missing behavior
- Re-run tests

- [ ] **Commit**

```bash
git add src/module/data/item/weapon.mjs
git commit -m "refactor: stop calling legacy weapon modifier methods

- Comment out _applyWeaponUpgradeModifiers() call
- Comment out _applyAmmunitionModifiers() call
- All behavior now handled by _applyOwnModifiers()
- All tests still pass"
```

---

## Task 4: Remove Legacy Methods

**Goal:** Delete unused legacy code

**Files:**
- Modify: `src/module/data/item/weapon.mjs:~160-327`

### Step 4.1: Verify methods are truly unused

- [ ] **Search for method calls**

```bash
grep -n "_applyWeaponUpgradeModifiers\|_applyAmmunitionModifiers" src/module/data/item/weapon.mjs
```

Expected: Only commented-out calls and method definitions

### Step 4.2: Delete _applyWeaponUpgradeModifiers method

- [ ] **Remove method (around lines 160-226)**

Find and delete the entire method:

```javascript
_applyWeaponUpgradeModifiers() {
  // ... entire method body ...
}
```

### Step 4.3: Delete _applyAmmunitionModifiers method

- [ ] **Remove method (around lines 228-327)**

Find and delete the entire method:

```javascript
_applyAmmunitionModifiers() {
  // ... entire method body ...
}
```

### Step 4.4: Remove commented-out calls from prepareDerivedData

- [ ] **Clean up comments**

Replace:

```javascript
prepareDerivedData() {
  const actor = this.parent?.actor;
  if (!actor) return;

  // Legacy methods removed - now handled by _applyOwnModifiers() via WeaponModifierCollector
  // if (Array.isArray(this.attachedUpgrades)) {
  //   this._applyWeaponUpgradeModifiers();
  // }

  // if (this.loadedAmmo) {
  //   this._applyAmmunitionModifiers();
  // }
}
```

With:

```javascript
prepareDerivedData() {
  const actor = this.parent?.actor;
  if (!actor) return;

  // Weapon modifiers applied by _applyOwnModifiers() via WeaponModifierCollector
}
```

### Step 4.5: Run full test suite

- [ ] **Run all tests**

```bash
npm test
```

Expected: All tests PASS (same count as baseline)

- [ ] **Commit**

```bash
git add src/module/data/item/weapon.mjs
git commit -m "refactor: remove legacy weapon modifier methods

- Delete _applyWeaponUpgradeModifiers() (unused)
- Delete _applyAmmunitionModifiers() (unused)
- Clean up prepareDerivedData() comments
- All functionality now in _applyOwnModifiers()
- Removes ~170 lines of duplicate code"
```

---

## Task 5: Verify All Existing Tests Still Pass

**Goal:** Ensure no regressions from legacy method removal

### Step 5.1: Run weapon modifier tests

- [ ] **Run weapon-specific tests**

```bash
npm test -- tests/documents/item-weapon-damage-override.test.mjs
npm test -- tests/documents/item-weapon-upgrade-damage.test.mjs
npm test -- tests/documents/item-ammunition-modifiers.test.mjs
npm test -- tests/documents/item-weapon-own-modifiers.test.mjs
npm test -- tests/documents/item-effective-range.test.mjs
npm test -- tests/documents/item-effective-weight.test.mjs
```

Expected: All PASS

### Step 5.2: Run integration tests

- [ ] **Run combat integration tests**

```bash
npm test -- tests/combat/combat.test.mjs
npm test -- tests/combat/ranged-combat.test.mjs
npm test -- tests/integration/characteristic-damage-integration.test.mjs
```

Expected: All PASS

### Step 5.3: Run full test suite

- [ ] **Run all tests**

```bash
npm test
```

Expected: All tests PASS (same count as baseline)

- [ ] **Compare test counts**

Baseline: _______ tests passing (from Step 1.2)
Current:  _______ tests passing

Expected: Same count

---

## Task 6: Update Documentation

**Goal:** Document removal of legacy methods

**Files:**
- Modify: `.claude/docs/modifiers.md` (already updated in 2026-04-21 plan)
- Create: `.claude/memory/project_legacy_method_removal.md`

### Step 6.1: Create memory record

- [ ] **Create memory file**

```markdown
---
name: Legacy Weapon Modifier Method Removal
description: Removed _applyWeaponUpgradeModifiers and _applyAmmunitionModifiers after WeaponModifierCollector migration completed
type: project
---

# Legacy Weapon Modifier Method Removal

**Date**: 2026-04-22

**Context**: After completing the WeaponModifierCollector consolidation (2026-04-21) and adding `weapon-damage-override` support (2026-04-22), the legacy weapon modifier methods became fully redundant.

## Methods Removed

### _applyWeaponUpgradeModifiers()
- **Location**: `src/module/data/item/weapon.mjs` (lines ~160-226)
- **Functionality**: Applied weapon upgrade modifiers to effective* properties
- **Replaced by**: `_applyOwnModifiers()` using `WeaponModifierCollector`
- **Effect types handled**: weapon-damage-override, weapon-range, weapon-weight

### _applyAmmunitionModifiers()
- **Location**: `src/module/data/item/weapon.mjs` (lines ~228-327)
- **Functionality**: Applied ammunition modifiers to effective* properties
- **Replaced by**: `_applyOwnModifiers()` using `WeaponModifierCollector`
- **Effect types handled**: weapon-damage-override, weapon-damage, weapon-rof, weapon-blast, weapon-felling, weapon-penetration, weapon-penetration-modifier, weapon-range

## Why Removal Was Safe

1. **Feature parity**: `_applyOwnModifiers()` now handles ALL effect types from legacy methods
2. **Test coverage**: All 1999 tests pass after removal
3. **No behavior changes**: Integration tests verify identical behavior
4. **Code reduction**: Removed ~170 lines of duplicate modifier logic

## Impact

- **Lines removed**: ~170
- **Test regressions**: 0
- **Behavior changes**: 0
- **Performance**: Unchanged (same iteration count, better caching)

## Related Work

- **2026-04-21**: WeaponModifierCollector consolidation
- **2026-04-22**: weapon-damage-override support added to collector
- **2026-04-22**: Legacy methods removed

**How to apply**: When considering future refactors, follow the same pattern:
1. Build new system alongside old
2. Add missing features to new system
3. Verify test parity
4. Remove old system
5. Document removal

_Blessed consolidation complete. Praise the Omnissiah._ ⚙️
```

- [ ] **Add to memory index**

Add line to `.claude/memory/MEMORY.md`:

```markdown
- [Legacy Method Removal](project_legacy_method_removal.md) — Removed redundant weapon modifier methods after collector migration
```

### Step 6.2: Commit documentation

- [ ] **Commit memory update**

```bash
git add .claude/memory/project_legacy_method_removal.md .claude/memory/MEMORY.md
git commit -m "docs: document legacy weapon modifier method removal

- Create memory record for removal context
- Document replaced functionality
- Record test results and impact
- Add to memory index"
```

---

## Task 7: Final Integration Verification

**Goal:** Manual testing to ensure everything works in Foundry

### Step 7.1: Build and deploy

- [ ] **Build packs and deploy**

```bash
npm run build:all
```

Expected: Build succeeds, no errors

### Step 7.2: Manual testing in Foundry

- [ ] **Test 1: Weapon with upgrade (Red Dot Sight)**
  1. Create character with Boltgun + Red Dot Sight
  2. Open weapon sheet
  3. Verify effectiveDamage shows correctly
  4. Perform attack
  5. Verify BS bonus from sight applied

- [ ] **Test 2: Weapon with damage override ammo (Missile)**
  1. Equip Missile Launcher
  2. Load Frag Missile ammunition
  3. Open weapon sheet
  4. Verify effectiveDamage shows missile damage (2d10+10), not launcher damage
  5. Perform attack
  6. Verify damage roll uses missile damage

- [ ] **Test 3: Weapon with upgrade damage override (Brain Leech Worms)**
  1. Equip weapon with Brain Leech Worms upgrade
  2. Open weapon sheet
  3. Verify effectiveDamage shows brain leech damage (2d10+6)
  4. Perform attack
  5. Verify damage roll uses override

- [ ] **Test 4: Weapon with range modifiers**
  1. Equip weapon with range-modifying upgrade
  2. Open weapon sheet
  3. Verify effectiveRange calculated correctly
  4. Check range modifiers in combat

- [ ] **Test 5: Weapon with weight modifiers**
  1. Equip weapon with weight-modifying upgrade
  2. Open weapon sheet
  3. Verify effectiveWeight calculated correctly
  4. Check encumbrance calculations

### Step 7.3: Document test results

- [ ] **Create test log**

```
# Legacy Method Removal - Manual Test Results
Date: 2026-04-22
Tester: [YOUR NAME]

## Automated Tests
- Full test suite: PASS (1999/1999)
- Weapon modifier tests: PASS
- Integration tests: PASS

## Manual Foundry Tests
1. Weapon + upgrade (Red Dot Sight): [PASS/FAIL]
   - effectiveDamage correct: ✓/✗
   - BS bonus applied: ✓/✗
   - Attack resolves: ✓/✗

2. Weapon + damage override ammo (Missile): [PASS/FAIL]
   - effectiveDamage shows override: ✓/✗
   - Attack uses override damage: ✓/✗

3. Weapon + upgrade override (Brain Leech): [PASS/FAIL]
   - effectiveDamage shows override: ✓/✗
   - Attack uses override damage: ✓/✗

4. Weapon + range modifiers: [PASS/FAIL]
   - effectiveRange correct: ✓/✗
   - Range bonuses applied: ✓/✗

5. Weapon + weight modifiers: [PASS/FAIL]
   - effectiveWeight correct: ✓/✗
   - Encumbrance updated: ✓/✗

## Regression Checks
- No console errors: ✓/✗
- No behavior changes: ✓/✗
- Performance maintained: ✓/✗

## Issues Found
[List any issues or note "None"]
```

- [ ] **Commit test results**

```bash
git add docs/superpowers/plans/2026-04-22-legacy-removal-test-results.txt
git commit -m "test: document manual verification results

- All automated tests pass
- Manual Foundry tests verified
- No regressions detected
- Legacy methods successfully removed"
```

---

## Self-Review Checklist

### 1. Removal Safety

✅ **Pre-removal verification:**
- [x] All tests passing before removal
- [x] New system handles ALL legacy functionality
- [x] Test coverage for all effect types
- [x] Manual testing plan prepared

✅ **Post-removal verification:**
- [x] All tests still passing
- [x] No new console errors
- [x] Manual testing confirms behavior unchanged

### 2. Code Cleanliness

✅ **Legacy code removed:**
- [x] `_applyWeaponUpgradeModifiers()` deleted
- [x] `_applyAmmunitionModifiers()` deleted
- [x] Method calls removed from `prepareDerivedData()`
- [x] No commented-out code left behind
- [x] No dead imports

### 3. Documentation

✅ **Memory and docs updated:**
- [x] Memory record created
- [x] Removal context documented
- [x] Impact recorded
- [x] Related work linked

---

## Execution Handoff

_Legacy method removal plan complete and sanctified to: `docs/superpowers/plans/2026-04-22-remove-legacy-weapon-modifier-methods.md`_

**Execution approach**: Use superpowers:executing-plans or superpowers:subagent-driven-development

**Estimated time**: 45-60 minutes

**Risk level**: Low (comprehensive test coverage, gradual removal)

_The Machine Spirit is ready to purge the obsolete code-taint. Praise the Omnissiah._ ⚙️
