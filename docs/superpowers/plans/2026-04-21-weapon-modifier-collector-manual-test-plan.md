# Weapon Modifier Collector - Manual Testing Plan

**Date:** 2026-04-21  
**Tester:** ****\*\*****\_****\*\*****  
**Foundry Version:** v13  
**System Version:** ****\*\*****\_****\*\*****

---

## Purpose

Verify that the consolidated WeaponModifierCollector correctly handles all weapon modifier scenarios in actual Foundry VTT gameplay without regressions.

---

## Pre-Test Setup

### Required Test World

- [ ] Create clean test world or use existing test world
- [ ] Import Deathwatch system
- [ ] Verify system loaded correctly (check console for errors)

### Required Test Actors

- [ ] Create test Space Marine character ("Test Brother")
  - Set BS to 50 (BS Bonus 5)
  - Set STR to 40 (SB 4)
  - Set TGH to 40 (TB 4)

### Required Test Items

Create these items in the test world:

**Weapons:**

- [ ] Boltgun (basic weapon, no modifiers)
- [ ] Plasma Gun (for premature detonation testing)
- [ ] Heavy Bolter (for Motion Predictor testing)

**Weapon Upgrades:**

- [ ] Red Dot Sight (BS +10 modifier)
- [ ] Motion Predictor (BS +10, requiresAutoFire: true)
- [ ] Telescopic Sight (for range testing)

**Ammunition:**

- [ ] Standard Bolts (baseline, no modifiers)
- [ ] Hellfire Rounds (righteous-fury-threshold: 9, ignores-natural-armour: true)
- [ ] Metal Storm Rounds (magnitude-bonus-damage: 1)
- [ ] Toxin Rounds (characteristic-damage: 1d10 TGH)
- [ ] Plasma Cell (premature-detonation: 95)

---

## Test Suite

---

## Test 1: Basic Weapon Modifier Collection

**Objective:** Verify weapon's own modifiers are collected correctly.

**Setup:**

1. Equip Test Brother with Boltgun
2. Add weapon modifier to Boltgun: +2 weapon-damage

**Test Steps:**

- [x] Open character sheet
- [x] Click Boltgun to view weapon details
- [x] Verify effective damage shows base damage + 2

**Expected Results:**

- Damage display shows modifier applied
- No console errors

**Actual Results:**

```
Works as expected
```

**Status:** ✅ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 2: Weapon Upgrade Modifier Collection

**Objective:** Verify weapon upgrade modifiers are collected and applied to attacks.

**Setup:**

1. Equip Test Brother with Boltgun
2. Attach Red Dot Sight upgrade to Boltgun

**Test Steps:**

- [x] Open ranged attack dialog for Boltgun (single shot)
- [x] Check modifier breakdown
- [x] Verify BS modifier includes +10 from Red Dot Sight

**Expected Results:**

- Attack dialog shows BS 50 + 10 (Red Dot Sight) = 60 target number (before other modifiers)
- Modifier parts list includes "Red Dot Sight: +10"
- Attack resolves correctly
- Modifier ONLY applies on single shot attacks (not semi-auto/full-auto)

**Actual Results:**

```
FAILED initially - Red Dot Sight modifier not applying
Root Cause: singleShotOnly flag was at upgrade level, not modifier level
Fix Applied: Moved singleShotOnly: true to modifier object in red-dot-laser-sight.json
After fix: Modifier applies correctly on single shot, filtered out on auto-fire
```

**Status:** ✅ PASS (after fix) ⬜ FAIL ⬜ BLOCKED

**Bug Fixed:** Red Dot Laser Sight and Motion Predictor had conditional flags at wrong data structure level. Fixed in commit [pending].

---

## Test 3: Ammunition Modifier Collection - Righteous Fury

**Objective:** Verify ammo modifiers affect righteous fury threshold.

**Setup:**

1. Equip Test Brother with Boltgun
2. Load Hellfire Rounds (fury threshold 9)

**Test Steps:**

- [x] Make multiple ranged attacks with Boltgun
- [x] Observe damage rolls that roll 9 on attack die (d100 ending in 9)
- [x] Verify Righteous Fury triggers on 9 (not just 10)

**Expected Results:**

- Rolls of 09, 19, 29, 39, 49, 59, 69, 79, 89, 99 trigger Righteous Fury
- Chat message shows "Righteous Fury!" message
- Confirmation roll dialog appears

**Actual Results:**

```
Righteous Fury correctly triggers on rolls ending in 9 when Hellfire Rounds loaded
Ammo modifier successfully lowers fury threshold from 10 to 9
```

**Status:** ✅ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 4: Ammunition Modifier Collection - Magnitude Bonus

**Objective:** Verify magnitude bonus damage from ammo works against hordes.

**Setup:**

1. Equip Test Brother with Heavy Bolter
2. Load Metal Storm Rounds (magnitude-bonus-damage: 1)
3. Create test Horde enemy (magnitude 20)
4. Make ranged attack against horde

**Test Steps:**

- [ ] Attack horde with Heavy Bolter
- [ ] Hit and penetrate armor
- [ ] Check magnitude reduction in chat
- [ ] Verify magnitude reduced by (base damage/10) + 1

**Expected Results:**

- Magnitude reduction includes +1 bonus from Metal Storm Rounds
- Chat message shows "Magnitude Bonus Damage: +1"

**Actual Results:**

```
[Record magnitude reduction: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 5: Ammunition Modifier Collection - Characteristic Damage

**Objective:** Verify characteristic damage from ammo (Toxin Rounds).

**Setup:**

1. Equip Test Brother with Boltgun
2. Load Toxin Rounds (characteristic-damage: 1d10 TGH)
3. Create test Enemy actor
4. Make successful ranged attack

**Test Steps:**

- [ ] Attack enemy with Boltgun
- [ ] Successfully hit and deal damage
- [ ] Verify chat shows characteristic damage roll
- [ ] Check that TGH damage is rolled and displayed

**Expected Results:**

- Chat message shows "Toxin: 1d10 TGH damage"
- Additional damage roll for characteristic damage
- Roll formula shows 1d10

**Actual Results:**

```
[Record characteristic damage: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 6: Ammunition Modifier Collection - Ignores Natural Armor

**Objective:** Verify ignores-natural-armour flag from ammo.

**Setup:**

1. Equip Test Brother with Boltgun
2. Load Hellfire Rounds (ignores-natural-armour: true)
3. Create test Enemy with natural armor (e.g., Tyranid with Machine trait providing armor)
4. Make ranged attack

**Test Steps:**

- [ ] Attack enemy with natural armor
- [ ] Check damage calculation
- [ ] Verify natural armor is bypassed

**Expected Results:**

- Damage penetration ignores natural armor value
- Chat shows "Ignores Natural Armor" or similar indicator

**Actual Results:**

```
[Record armor interaction: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 7: Ammunition Modifier Collection - Premature Detonation

**Objective:** Verify premature detonation threshold from ammo.

**Setup:**

1. Equip Test Brother with Plasma Gun
2. Load Plasma Cell (premature-detonation: 95)

**Test Steps:**

- [ ] Make multiple ranged attacks with Plasma Gun
- [ ] Use dice roller or make attacks until roll ≥95
- [ ] Verify detonation triggers on 95+

**Expected Results:**

- Rolls of 95, 96, 97, 98, 99 trigger premature detonation
- Chat message shows "Premature Detonation!" or similar
- Weapon deals damage to wielder instead of target

**Actual Results:**

```
[Record detonation triggers: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 8: Context-Aware Filtering - Motion Predictor

**Objective:** Verify Motion Predictor only applies bonus on semi-auto/full-auto attacks.

**Setup:**

1. Equip Test Brother with Heavy Bolter
2. Attach Motion Predictor upgrade (requiresAutoFire: true)

**Test Steps:**

- [ ] Make SINGLE SHOT attack
- [ ] Check modifier breakdown - Motion Predictor should NOT appear
- [ ] Make SEMI-AUTO or FULL-AUTO attack
- [ ] Check modifier breakdown - Motion Predictor SHOULD appear

**Expected Results:**

- Single shot: NO Motion Predictor bonus
- Semi-auto/Full-auto: +10 Motion Predictor bonus
- Modifier parts correctly show/hide based on fire mode

**Actual Results:**

```
Single Shot: _________________
Auto Fire: _________________
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 9: Multiple Source Integration

**Objective:** Verify weapon + upgrade + ammo modifiers all apply simultaneously.

**Setup:**

1. Equip Test Brother with Boltgun
2. Add weapon modifier: +2 weapon-damage
3. Attach Red Dot Sight: +10 BS
4. Load Hellfire Rounds: fury threshold 9, ignores natural armor

**Test Steps:**

- [ ] Open ranged attack dialog
- [ ] Verify BS bonus includes Red Dot Sight (+10)
- [ ] Make attack and check damage
- [ ] Verify weapon damage modifier applies
- [ ] Make attack roll that triggers fury (9)
- [ ] Verify Righteous Fury triggers on 9

**Expected Results:**

- All three sources contribute modifiers simultaneously:
  - Weapon: +2 damage
  - Upgrade: +10 BS
  - Ammo: Fury on 9, ignores natural armor
- No conflicts or missing modifiers
- All modifiers visible in appropriate locations

**Actual Results:**

```
[Record all active modifiers: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 10: Disabled Modifiers

**Objective:** Verify disabled modifiers (enabled: false) are skipped.

**Setup:**

1. Equip Test Brother with Boltgun
2. Add weapon modifier: +10 weapon-damage, enabled: false

**Test Steps:**

- [ ] Open character sheet
- [ ] Check Boltgun damage display
- [ ] Verify disabled modifier does NOT apply
- [ ] Enable the modifier
- [ ] Verify modifier NOW applies

**Expected Results:**

- Disabled modifier: damage unchanged
- Enabled modifier: damage increased by +10

**Actual Results:**

```
[Record behavior: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 11: Edge Case - Missing Ammunition

**Objective:** Verify system doesn't crash when weapon references missing ammo.

**Setup:**

1. Equip Test Brother with Boltgun
2. Manually set weapon.system.loadedAmmo to invalid ID

**Test Steps:**

- [ ] Open ranged attack dialog
- [ ] Verify no console errors
- [ ] Attack resolves normally (no ammo modifiers)

**Expected Results:**

- No JavaScript errors
- Attack proceeds with weapon base stats only
- System gracefully handles missing ammo reference

**Actual Results:**

```
[Record behavior and console: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 12: Edge Case - Missing Upgrade

**Objective:** Verify system doesn't crash when weapon references missing upgrade.

**Setup:**

1. Equip Test Brother with Boltgun
2. Manually set weapon.system.attachedUpgrades to include invalid ID

**Test Steps:**

- [ ] Open ranged attack dialog
- [ ] Verify no console errors
- [ ] Attack resolves normally (missing upgrade ignored)

**Expected Results:**

- No JavaScript errors
- Attack proceeds normally
- Missing upgrade gracefully skipped

**Actual Results:**

```
[Record behavior and console: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 13: Regression - Existing Combat Still Works

**Objective:** Verify existing combat scenarios work unchanged.

**Setup:**

1. Equip Test Brother with standard equipment (no special modifiers)
2. Create standard enemy

**Test Steps:**

- [ ] Perform standard ranged attack
- [ ] Perform standard melee attack
- [ ] Roll damage for both
- [ ] Verify combat flow identical to before refactoring

**Expected Results:**

- Combat works exactly as before
- No new dialogs or prompts
- Same target numbers and damage calculations
- No console errors

**Actual Results:**

```
[Record any differences: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 14: Performance - No Lag

**Objective:** Verify modifier collection doesn't cause performance issues.

**Setup:**

1. Equip Test Brother with complex weapon (multiple upgrades, special ammo)
2. Open ranged attack dialog multiple times

**Test Steps:**

- [ ] Open/close attack dialog 10 times rapidly
- [ ] Note any lag or delays
- [ ] Check browser performance tools if available

**Expected Results:**

- Dialog opens instantly (<100ms)
- No perceptible lag
- No console warnings about performance

**Actual Results:**

```
[Record timing observations: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Test 15: Weapon Sheet Display

**Objective:** Verify weapon sheets show effective values correctly.

**Setup:**

1. Create weapon with modifiers from multiple sources
2. Open weapon sheet

**Test Steps:**

- [ ] Check effective damage display
- [ ] Check effective penetration display
- [ ] Check effective rate of fire display
- [ ] Verify all show modified values

**Expected Results:**

- Weapon sheet displays effective values (base + modifiers)
- Values update when modifiers change
- Clear indication of modified vs base values

**Actual Results:**

```
[Record display behavior: _________________]
```

**Status:** ⬜ PASS ⬜ FAIL ⬜ BLOCKED

---

## Console Error Check

Throughout all tests, monitor browser console for errors:

**Errors Found:**

```
[List any console errors, warnings, or unexpected messages]
```

**Error Frequency:**

- Critical errors (red): **\_**
- Warnings (yellow): **\_**
- Info messages: **\_**

---

## Summary

**Total Tests:** 15  
**Passed:** **\_**  
**Failed:** **\_**  
**Blocked:** **\_**

**Critical Issues Found:**

```
[List any critical issues that prevent functionality]
```

**Minor Issues Found:**

```
[List any minor issues or improvements needed]
```

**Regression Issues:**

```
[List any features that worked before but broke]
```

**Overall Assessment:**
⬜ Ready for production  
⬜ Minor fixes needed  
⬜ Major issues - not ready

---

## Notes

```
[Additional observations, edge cases discovered, suggestions]
```

---

## Sign-Off

**Tester:** ****\*\*****\_****\*\*****  
**Date:** ****\*\*****\_****\*\*****  
**Status:** ⬜ APPROVED ⬜ NEEDS WORK

---

_Blessed be the testing protocols. May the Omnissiah guide the verification rituals._ ⚙️
