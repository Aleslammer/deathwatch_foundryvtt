# Quick Smoke Test

**Purpose:** 30-minute rapid validation after system updates, Foundry upgrades, or major code changes

**Prerequisites:** Test world loaded OR any active game session with at least 1 character and 1 enemy

---

## Combat Basics (10 minutes)

### Ranged Attack
☐ Select Marine character  
☐ Click weapon (e.g., bolter) from character sheet  
☐ Select "Standard Attack"  
☐ Target enemy  
☐ Roll to hit (1d100 vs BS)  
☐ **Expected:** Attack dialog shows, roll posts to chat, hit location determined  

### Damage Application
☐ Click "Apply Damage" button in chat message  
☐ **Expected:** Damage rolls, target wounds decrease, chat shows breakdown  

### Armor Reduction
☐ Check chat damage breakdown  
☐ **Expected:** Shows: Total Damage - (Armor + TB - Penetration) = Wounds Lost  

### Melee Attack
☐ Select Marine character adjacent to enemy  
☐ Click melee weapon (e.g., chainsword)  
☐ Attack target  
☐ **Expected:** WS-based roll, damage applied on hit  

### Full Auto Fire
☐ Select weapon with Storm quality or switch to Full Auto mode  
☐ Make attack with 3+ Degrees of Success  
☐ **Expected:** Multiple hits generated (DoS ÷ 2), multiple hit locations  

---

## Character Sheet (5 minutes)

### Characteristics Display
☐ Open character sheet  
☐ Check Characteristics tab  
☐ **Expected:** All 9 characteristics show value, bonus, and any multipliers (Unnatural)  

### Skills Calculation
☐ Check Skills tab  
☐ Hover over skill (e.g., Awareness)  
☐ **Expected:** Shows base characteristic + advances + modifiers = total  

### Wounds & Fatigue Bars
☐ Deal damage to character  
☐ Check token  
☐ **Expected:** Primary bar (wounds) decreases, value updates in real-time  

### Equipment Tab
☐ Open Equipment tab  
☐ Click "Add Item" (+ icon)  
☐ Drag weapon from compendium  
☐ **Expected:** Item appears in equipment list with stats  

### Hotbar Macro Creation
☐ Drag weapon from character sheet to hotbar  
☐ Click hotbar macro  
☐ **Expected:** Attack dialog opens with weapon pre-selected  

---

## Psychic Powers (5 minutes)

### Focus Power Test Dialog
☐ Open Librarian character (or any psyker)  
☐ Click psychic power from character sheet  
☐ **Expected:** Focus Power Test dialog opens with power level options  

### Power Level Effects
☐ Select "Push" power level  
☐ Check Psy Rating display  
☐ **Expected:** Effective PR = Base PR + 1 (shows in dialog)  

☐ Select "Fettered" power level  
☐ **Expected:** Effective PR = Base PR - 1  

### Failed Test → Phenomena
☐ Make Focus Power Test that fails (intentionally roll high)  
☐ **Expected:** Psychic Phenomena dialog appears, prompts for 1d100 roll  

### Successful Power Effect
☐ Make successful Focus Power Test (roll under WP)  
☐ **Expected:** Power effect applies (damage, buff, etc.), chat message confirms  

---

## Cohesion & Squad Mode (5 minutes)

### Cohesion Panel Access
☐ Open Token Controls (left sidebar)  
☐ Click shield icon  
☐ **Expected:** Cohesion panel opens showing current/max cohesion  

### Squad Mode Toggle
☐ Select Marine character  
☐ Click Squad Mode toggle in cohesion panel  
☐ **Expected:** Indicator changes color (green = Squad, red = Solo)  

### Activate Squad Ability
☐ In cohesion panel, click "Activate" on a Squad Mode ability  
☐ Check cohesion value  
☐ **Expected:** Cohesion decreases by ability cost, ability marked active  

### Deactivate Ability
☐ Click "Deactivate" on active ability  
☐ **Expected:** Cohesion increases by refund amount, ability marked inactive  

---

## Data Integrity (5 minutes)

### Compendium Loading
☐ Open Compendium Packs sidebar  
☐ Click "Deathwatch: Weapons"  
☐ Scroll through entries  
☐ **Expected:** All items load without errors, no missing data warnings  

### Drag-Drop from Compendium
☐ Drag weapon from compendium to character sheet  
☐ Open character sheet  
☐ **Expected:** Weapon appears with correct stats, qualities, damage  

### Weapon Modifiers Apply
☐ Equip weapon with quality (e.g., Accurate)  
☐ Make attack with 3+ DoS  
☐ Apply damage  
☐ **Expected:** Damage bonus from quality applies correctly (chat breakdown shows it)  

### Token Bars Sync
☐ Select token on scene  
☐ Open character sheet  
☐ Check wounds value matches token primary bar  
☐ Deal 5 damage  
☐ **Expected:** Token bar updates immediately, sheet value updates  

### Console Errors
☐ Open browser console (F12)  
☐ Perform standard actions (attack, open sheet, drag item)  
☐ **Expected:** No red errors, only standard Foundry info/warnings  

---

## Critical Failures

**If ANY of these fail, stop and investigate immediately:**

- ❌ **Attack rolls don't post to chat** → Core combat broken
- ❌ **Damage application errors or doesn't reduce wounds** → Damage system broken
- ❌ **Character sheet won't open or shows NaN values** → Data model corruption
- ❌ **Compendium packs fail to load** → Pack validation failure
- ❌ **Console floods with errors** → JavaScript errors blocking execution

---

## Smoke Test Results

**Date:** _____________  
**Tester:** _____________  
**System Version:** _____________  
**Foundry Version:** _____________  

**Overall Result:** ☐ PASS  ☐ FAIL  

**Failed Items:**
_____________________________________________
_____________________________________________
_____________________________________________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

_Swift validation rituals complete, Tech-Priest. The Machine Spirit approves._ ⚙️
