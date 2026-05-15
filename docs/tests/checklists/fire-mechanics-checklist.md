# Fire Mechanics Checklist

**Purpose:** Validate flame weapons and On Fire status effects

**Test Type:** Quick validation

**Duration:** 10-12 minutes

**Prerequisites:** Test world with flamer weapon and target

---

## Flame Weapon Attack

### Flame Attack Execution
**Setup:** Character with Astartes Flamer  
**Test:** Attack enemy with flame weapon  
**Expected:** Cone targeting, auto-hit within range

☐ Click Flamer from character sheet  
☐ Select "Flame Attack"  
☐ Target enemy within range (≤20m typical)  
☐ Flame cone template appears (or auto-hit prompt)  
☐ Targets in cone auto-hit (no BS roll required)  

---

### Individual Target Dodge Test
**Setup:** Flame attack targets single enemy  
**Test:** Enemy makes Agility dodge test  
**Expected:** Failed dodge = damage + catch fire test

☐ Target prompted for Agility dodge test  
☐ Target rolls 1d100 vs AG  
☐ If dodge succeeds: No damage, no catch fire  
☐ If dodge fails: Proceed to damage and catch fire test  

---

### Catch Fire Test
**Setup:** Target failed dodge against flame attack  
**Test:** Target makes catch fire test (AG)  
**Expected:** Failed test applies "On Fire" status

☐ Target prompted for catch fire test (Agility)  
☐ Target rolls 1d100 vs AG  
☐ If test succeeds: Damage applies, no On Fire status  
☐ If test fails: Damage applies + "On Fire" status added  
☐ Token shows "On Fire" visual indicator  

---

## On Fire Status Effects

### On Fire Round Effects
**Setup:** Character with "On Fire" status  
**Test:** Start character's turn in combat  
**Expected:** 1d10 Energy damage (ignores armor), +1 Fatigue, WP test to act

☐ At start of turn, system prompts for On Fire effects  
☐ Roll 1d10 Energy damage  
☐ Damage ignores armor (directly to wounds)  
☐ Fatigue increases by 1  
☐ Character makes WP test to act normally  
☐ If WP test fails: Character stunned or limited actions  
☐ Chat shows On Fire effect breakdown  

---

### Power Armor Interaction
**Setup:** Marine with Power Armor and "On Fire" status  
**Test:** On Fire effects trigger  
**Expected:** Auto-pass WP test (Power Armor protection)

☐ Marine with Power Armor catches fire  
☐ On Fire round effects trigger (1d10 Energy, +1 Fatigue)  
☐ **WP test automatically passed** (Power Armor feature)  
☐ Chat message: "Power Armor environmental seals: WP test auto-passed"  
☐ Marine acts normally (no action restrictions)  

---

## Extinguish Mechanics

### Extinguish Test
**Setup:** Character with "On Fire" status  
**Test:** Attempt to extinguish flames (AG -20)  
**Expected:** Success removes On Fire status

☐ Character uses action to extinguish (Half Action)  
☐ Roll Agility test: 1d100 vs (AG - 20)  
☐ This is a Hard (-20) test  
☐ If success: "On Fire" status removed immediately  
☐ If fail: Status remains, can try again next turn  
☐ Chat shows extinguish test result  

---

### Automatic Extinguish (Optional)
**Setup:** Some systems allow automatic extinguish after X rounds  
**Test:** Leave character On Fire for multiple rounds  
**Expected:** May auto-extinguish after duration

☐ Character remains On Fire for 3+ rounds  
☐ Check if system automatically removes status  
☐ If implemented: Status removed with message  
☐ If not implemented: Status persists until manually extinguished  

---

## Flame vs. Horde

### Horde Flame Multiplier
**Setup:** Flame weapon attacks horde  
**Test:** Apply flame damage to horde  
**Expected:** 1.5× damage multiplier

☐ Flame weapon targets horde  
☐ Hit count: (Range ÷ 4) + 1d5 (e.g., 20m ÷ 4 = 5 + 1d5)  
☐ Each hit rolls damage  
☐ Total damage calculated  
☐ **Horde multiplier: ×1.5 applied**  
☐ Magnitude reduction: (Total damage ×1.5) ÷ 10  
☐ Chat shows flame multiplier in breakdown  

---

## Validation Summary

☐ Flame attack auto-hits within cone/range  
☐ Individual targets make Agility dodge test  
☐ Failed dodge triggers catch fire test (AG)  
☐ On Fire status applies on failed catch fire test  
☐ On Fire effects: 1d10 Energy (ignores armor), +1 Fatigue, WP test  
☐ Power Armor auto-passes WP test (no action restriction)  
☐ Extinguish test (AG -20) removes On Fire status  
☐ Flame vs horde applies 1.5× damage multiplier  

---

_Fire protocols verified, Tech-Priest. The Emperor's flame purges with precision._ ⚙️
