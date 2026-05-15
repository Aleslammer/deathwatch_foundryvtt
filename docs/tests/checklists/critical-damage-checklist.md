# Critical Damage Checklist

**Purpose:** Validate Righteous Fury and critical damage mechanics

**Test Type:** Quick validation

**Duration:** 10-12 minutes

**Prerequisites:** Test world with Marine character and xenos enemy

---

## Righteous Fury Trigger

### Standard RF Trigger
**Setup:** Character attacks enemy  
**Test:** Roll attack result ≤ RF threshold (default 10)  
**Expected:** Righteous Fury triggers, confirmation roll required

☐ Make attack roll (1d100)  
☐ Result is 10 or below (or ≤ weapon RF threshold)  
☐ Chat message: "Righteous Fury! Confirm critical."  
☐ System prompts for confirmation roll (1d100 vs 95+)  
☐ If confirmation succeeds (≤95): Critical confirmed  
☐ If confirmation fails (>95): Normal hit, no critical  

---

### Deathwatch Training (Auto-Confirm vs. Xenos)
**Setup:** Marine with Deathwatch Training attacks xenos enemy (Ork, Tyranid, Tau)  
**Test:** Trigger Righteous Fury vs xenos  
**Expected:** Auto-confirms, no confirmation roll needed

☐ Marine attacks xenos target  
☐ Attack roll triggers RF (≤10)  
☐ System detects xenos target + Deathwatch Training  
☐ **Auto-confirms** critical (no confirmation roll)  
☐ Chat message: "Righteous Fury auto-confirmed! (Deathwatch Training vs xenos)"  
☐ Proceeds directly to critical damage  

---

## Critical Damage Roll

### Critical Effect Table
**Setup:** Confirmed Righteous Fury  
**Test:** Roll on Critical Effects table  
**Expected:** d100 lookup determines critical effect

☐ System prompts: "Roll 1d100 for Critical Effect"  
☐ Roll 1d100 (e.g., result 45)  
☐ System looks up result on appropriate table (Energy, Impact, Rending, Explosive)  
☐ Critical effect applied:  
  - Narrative description (e.g., "Limb severed")  
  - Mechanical effect (e.g., additional wounds, status effect, instant death)  
☐ Chat displays critical effect details  

---

### Critical Effect Application
**Setup:** Critical effect rolled  
**Test:** Apply effect to target  
**Expected:** Additional wounds, status, or special effect

☐ Normal attack damage applied first  
☐ Critical effect adds:  
  - Additional wounds (e.g., +1d5)  
  - Status effects (bleeding, stunned)  
  - Instant death (high rolls)  
☐ Target wounds updated  
☐ Status markers applied to token if applicable  

---

## Excess Damage

### Damage Beyond Zero
**Setup:** Attack deals damage exceeding target's remaining wounds  
**Test:** Apply damage that would reduce target below 0  
**Expected:** Excess damage = additional wounds lost

☐ Target has 5 wounds remaining  
☐ Attack deals 12 damage  
☐ **Excess damage: 12 - 5 = 7 excess**  
☐ Excess damage ÷ 5 (or system-specific) = additional wounds lost  
☐ Example: 7 ÷ 5 = 1 additional wound  
☐ Chat shows: "Excess damage: 7. Additional wounds: 1"  

---

## RF Threshold Modifiers

### Modified RF Threshold (Weapon Upgrades)
**Setup:** Weapon with RF threshold modifier (e.g., "Superior Craftsmanship" reduces threshold to 8)  
**Test:** Check RF trigger range  
**Expected:** Modified threshold applies

☐ Weapon equipped with RF modifier  
☐ Base RF threshold: 10  
☐ Modifier: -2 (Superior Craftsmanship)  
☐ **Effective RF threshold: 8**  
☐ Attack roll ≤8 triggers RF  
☐ Attack dialog shows modified threshold  

---

### Talent Modifiers
**Setup:** Character with talent affecting RF (e.g., "True Grit")  
**Test:** Check RF threshold  
**Expected:** Talent modifier applies

☐ Character has talent granting RF bonus  
☐ RF threshold adjusted (e.g., 10 → 12)  
☐ More likely to trigger RF  
☐ Chat shows RF threshold in attack breakdown  

---

## Special Cases

### RF vs. Non-Xenos (Normal Confirmation)
**Setup:** Marine attacks human/non-xenos enemy  
**Test:** Trigger RF against non-xenos  
**Expected:** Requires confirmation roll (no auto-confirm)

☐ Marine attacks human or daemon target  
☐ RF triggers (roll ≤10)  
☐ System prompts for confirmation (1d100 vs 95)  
☐ **No auto-confirm** (Deathwatch Training only vs xenos)  
☐ Must roll to confirm critical  

---

### Critical Damage Types
**Setup:** Different weapon damage types (Energy, Impact, Rending, Explosive)  
**Test:** Trigger RF with different weapon types  
**Expected:** Appropriate critical table used

☐ Energy weapon (e.g., las, plasma): Uses Energy Critical table  
☐ Impact weapon (e.g., bolter, stub gun): Uses Impact Critical table  
☐ Rending weapon (e.g., chainsword, blade): Uses Rending Critical table  
☐ Explosive weapon (e.g., grenade, krak): Uses Explosive Critical table  
☐ Chat message specifies which table used  

---

## Validation Summary

☐ RF triggers on attack roll ≤ threshold (default 10)  
☐ Standard RF requires confirmation roll (1d100 vs 95+)  
☐ Deathwatch Training auto-confirms RF vs xenos (no roll)  
☐ Critical effect rolls d100 on appropriate table  
☐ Critical effect applies additional wounds/status/instant death  
☐ Excess damage (beyond 0 wounds) calculates additional wounds lost  
☐ RF threshold modifiers from weapons/talents apply correctly  
☐ Non-xenos targets require confirmation roll (no auto-confirm)  
☐ Correct critical damage table used based on weapon damage type  

---

_Critical damage protocols verified, Tech-Priest. The Emperor's wrath strikes true._ ⚙️
