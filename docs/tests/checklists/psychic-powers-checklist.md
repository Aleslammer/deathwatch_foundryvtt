# Psychic Powers Checklist

**Purpose:** Validate psychic power mechanics and related systems

**Test Type:** Quick validation

**Duration:** 10-15 minutes

**Prerequisites:** Test world with psyker character (Librarian)

---

## Focus Power Test Mechanics

### Fettered Power Level
**Setup:** Psyker character with any psychic power  
**Test:** Cast power at Fettered level  
**Expected:** PR -1, safer casting, lower effect

☐ Focus Power dialog shows "Fettered" option  
☐ Effective PR = Base PR - 1 (e.g., 4 → 3)  
☐ Damage/effect reduced accordingly  
☐ Less likely to trigger Phenomena on failure  

---

### Unfettered Power Level
**Setup:** Psyker character  
**Test:** Cast power at Unfettered level  
**Expected:** PR unchanged, standard risk

☐ Focus Power dialog shows "Unfettered" option (default)  
☐ Effective PR = Base PR (e.g., 4)  
☐ Standard damage/effect  
☐ Phenomena triggers only on failure  

---

### Push Power Level
**Setup:** Psyker character  
**Test:** Cast power at Push level  
**Expected:** PR +1, higher effect, always triggers Phenomena

☐ Focus Power dialog shows "Push" option  
☐ Effective PR = Base PR + 1 (e.g., 4 → 5)  
☐ Damage/effect increased  
☐ **Always rolls Phenomena** (even on successful cast)  

---

## Psychic Phenomena

### Phenomena Trigger
**Setup:** Fail Focus Power Test (intentionally roll high)  
**Test:** Check Phenomena prompt  
**Expected:** System prompts for d100 roll on Phenomena table

☐ Failed Focus Power Test triggers Phenomena  
☐ System prompts: "Roll 1d100 for Psychic Phenomena"  
☐ Result looks up table entry  
☐ Chat shows Phenomena effect (minor disturbance to catastrophic)  

---

### Perils of the Warp
**Setup:** Roll Phenomena result ≥75  
**Test:** Check Perils cascade  
**Expected:** Phenomena ≥75 triggers Perils of the Warp

☐ Phenomena roll shows 75+  
☐ System prompts: "Roll 1d100 for Perils of the Warp"  
☐ Perils table lookup applies severe effect  
☐ Effects may include damage, debuffs, warp manifestations  

---

## Opposed Psychic Tests

### Opposed Power Cast
**Setup:** Cast opposed power (Compel, Dominate, Mind Probe)  
**Test:** Target makes opposed WP test  
**Expected:** Power success depends on opposed test result

☐ Psyker successfully casts power (passes Focus Power Test)  
☐ Chat message posts "Oppose Test" button for target  
☐ Target rolls WP test (1d100 vs WP)  
☐ Compare DoS: Psyker DoS > Target DoS = power succeeds  
☐ Chat shows opposed test result breakdown  

---

## Special Cases

### Hive Mind Backlash (Tyranid Psykers)
**Setup:** Tyranid psyker with "Tyranid" trait  
**Test:** Fail Focus Power Test  
**Expected:** Hive Mind backlash (1d10 Energy damage) instead of Phenomena

☐ Tyranid psyker fails Focus Power Test  
☐ System detects "Tyranid" trait  
☐ **No Phenomena roll**  
☐ Instead: 1d10 Energy damage to psyker  
☐ Chat message: "Hive Mind backlash: [X] Energy damage"  

---

### Psychic Hood (No Perils Modifier)
**Setup:** Psyker equipped with Psychic Hood  
**Test:** Trigger Phenomena that would cascade to Perils  
**Expected:** Perils suppressed by equipment modifier

☐ Phenomena roll ≥75 (normally triggers Perils)  
☐ System checks for "No Perils" modifier from Psychic Hood  
☐ Perils is suppressed (does not roll)  
☐ Chat message: "Perils suppressed by [equipment name]"  

---

### Psy Rating Modifiers
**Setup:** Equip talent/item granting PR modifier  
**Test:** Cast power, check effective PR  
**Expected:** Modifier applies to PR before power level adjustment

☐ Base PR: 4  
☐ Equipment grants: +1 PR  
☐ Effective PR before power level: 5  
☐ At Unfettered: PR 5  
☐ At Push: PR 6  
☐ Chat shows PR calculation breakdown  

---

## Validation Summary

☐ Fettered reduces PR by 1, safer casting  
☐ Unfettered uses base PR, standard risk  
☐ Push increases PR by 1, always triggers Phenomena  
☐ Failed tests trigger Psychic Phenomena  
☐ Phenomena ≥75 cascades to Perils of the Warp  
☐ Opposed powers require target WP test  
☐ Tyranid psykers use Hive Mind backlash (no Phenomena)  
☐ Psychic Hood suppresses Perils  
☐ PR modifiers from equipment apply correctly  

---

_Psychic protocols checked, Tech-Priest. The warp is controlled._ ⚙️
