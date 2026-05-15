# Cohesion & Squad Mode Checklist

**Purpose:** Validate cohesion mechanics and Squad Mode abilities

**Test Type:** Quick validation

**Duration:** 10-12 minutes

**Prerequisites:** Test world with Marines configured for Squad Mode

---

## Cohesion Calculation

### Cohesion Maximum Formula
**Setup:** Squad Leader character (Marine A)  
**Test:** Calculate cohesion maximum  
**Expected:** FS Bonus + Rank + Command DoS + GM Modifier

☐ Open Squad Leader character sheet  
☐ Note Fellowship Bonus (e.g., FS 45 = Bonus 4)  
☐ Note Rank (e.g., Rank 3)  
☐ Make Command skill test, note DoS (e.g., 2 DoS)  
☐ Add GM modifier (default 0)  
☐ **Cohesion Max = 4 + 3 + 2 + 0 = 9**  
☐ Cohesion panel shows correct maximum  

---

## Cohesion Panel UI

### Panel Access
**Setup:** Game session active  
**Test:** Open Cohesion Panel  
**Expected:** Panel displays cohesion values and Marine statuses

☐ Click shield icon in Token Controls (left sidebar)  
☐ Cohesion panel opens  
☐ Shows current/max cohesion (e.g., 7/10)  
☐ Lists all Marines with Squad/Solo Mode indicators  
☐ Shows active Squad Mode abilities  

---

### Squad Mode Indicators
**Setup:** Marines configured in Squad or Solo Mode  
**Test:** Check visual indicators  
**Expected:** Green = Squad Mode, Red = Solo Mode

☐ Marine in Squad Mode shows **green** indicator  
☐ Marine in Solo Mode shows **red** indicator  
☐ Indicators update in real-time when mode changes  

---

## Squad Mode Abilities

### Activate Ability
**Setup:** Squad Mode ability configured (e.g., "Tactical Spacing", cost 2)  
**Test:** Activate ability  
**Expected:** Cohesion decreases by cost, ability marked active

☐ Click "Activate" button on ability in Cohesion Panel  
☐ Cohesion decreases: 7 → 5 (cost of 2)  
☐ Ability marked "Active" with visual indicator  
☐ Effect applies to all Marines in Squad Mode  
☐ Chat message confirms activation  

---

### Deactivate Ability
**Setup:** Active Squad Mode ability  
**Test:** Deactivate ability  
**Expected:** Cohesion refunded, ability marked inactive

☐ Click "Deactivate" button on active ability  
☐ Cohesion increases: 5 → 7 (refund of 2)  
☐ Ability marked "Inactive"  
☐ Effect no longer applies  
☐ Chat message confirms deactivation  

---

## Cohesion Management

### Cohesion Damage (Manual)
**Setup:** GM access to Cohesion Panel  
**Test:** Manually reduce cohesion  
**Expected:** Cohesion decreases, threshold warnings if applicable

☐ GM clicks "Damage Cohesion" or adjustment control  
☐ Enter damage amount: 3  
☐ Cohesion decreases: 7 → 4  
☐ If below threshold (<4): Warning message appears  
☐ Chat message: "Cohesion reduced by 3"  

---

### Rally Test (Restore Cohesion)
**Setup:** Squad Leader character  
**Test:** Use Rally action  
**Expected:** Command test restores cohesion by DoS

☐ Squad Leader uses "Rally" action (Half Action)  
☐ Roll Command skill test  
☐ Achieve DoS (e.g., 3 DoS)  
☐ Cohesion increases by DoS: 4 → 7 (+3)  
☐ Cannot exceed cohesion maximum  
☐ Chat message: "Squad Leader rallies! Cohesion +3"  

---

### Threshold Effects
**Setup:** Reduce cohesion to critical levels  
**Test:** Check for threshold warnings/effects  
**Expected:** Below 4 and below 2 trigger warnings

☐ Cohesion drops to 3 (below 4): Warning appears  
☐ Chat message: "Cohesion low! Squad begins to falter."  
☐ Cohesion drops to 1 (below 2): Critical warning  
☐ Chat message: "Cohesion critical! Squad in disarray."  
☐ Mechanical effects may apply per core rules  

---

## Mode Toggle

### Switch to Solo Mode
**Setup:** Marine in Squad Mode  
**Test:** Toggle to Solo Mode  
**Expected:** Indicator changes, no squad benefits

☐ Select Marine character  
☐ In Cohesion Panel, click "Solo Mode" toggle  
☐ Indicator changes from green to red  
☐ Marine no longer benefits from active Squad Mode abilities  
☐ Marine does not cost or contribute to cohesion  
☐ Chat message: "[Marine name] enters Solo Mode"  

---

### Switch to Squad Mode
**Setup:** Marine in Solo Mode  
**Test:** Toggle to Squad Mode  
**Expected:** Indicator changes, gains squad benefits

☐ Click "Squad Mode" toggle for Marine  
☐ Indicator changes from red to green  
☐ Marine gains benefits from active Squad Mode abilities  
☐ Marine contributes to cohesion pool  
☐ Chat message: "[Marine name] returns to Squad Mode"  

---

## Validation Summary

☐ Cohesion max calculated: FS Bonus + Rank + Command DoS + GM Mod  
☐ Cohesion panel displays current/max values  
☐ Squad Mode shows green indicator, Solo Mode shows red  
☐ Activate ability: Cohesion decreases by cost  
☐ Deactivate ability: Cohesion refunded  
☐ GM can manually damage cohesion  
☐ Rally test restores cohesion by Command DoS  
☐ Threshold warnings at <4 and <2  
☐ Solo Mode toggle removes squad benefits  
☐ Squad Mode toggle grants squad benefits  

---

_Cohesion protocols verified, Tech-Priest. The kill-team stands united._ ⚙️
