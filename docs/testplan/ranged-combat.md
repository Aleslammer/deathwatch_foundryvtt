# Ranged Combat Test Plan

**Coverage:** Attack rolls, DoS calculation, hit locations, weapon qualities, ammo tracking, multi-attacks

## Prerequisites
- Test Marine with Astartes Bolter (30 rounds Standard Ammo)
- Test Enemy token on combat scene
- Combat encounter active (initiative rolled)

---

## Test Cases

### RC-01: Basic Ranged Attack
**Goal:** Verify basic attack roll mechanics

1. Click Astartes Bolter on Test Marine sheet
2. Click "Attack" in dialog
3. Accept default modifiers (0)
4. Click "Roll"

**Expected:**
- Chat message shows attack roll (1d100)
- Target number displayed (BS characteristic)
- Hit/Miss result shown
- If hit: DoS (Degrees of Success) calculated
- If hit: Hit location shown
- If hit: "Apply Damage" button present

**Pass/Fail:** ____

---

### RC-02: Attack Modifiers
**Goal:** Verify modifier calculation

1. Attack with Astartes Bolter
2. Set modifiers:
   - Aim: +10
   - Range: Long (−10)
   - Target Dodging: −20
3. Click "Roll"

**Expected:**
- Modified target number: BS + 10 − 10 − 20 = BS − 20
- DoS calculated against modified target

**Pass/Fail:** ____

---

### RC-03: Called Shot (Hit Location)
**Goal:** Verify called shot to specific location

1. Attack with Astartes Bolter
2. Set "Called Shot" dropdown to "Head"
3. Click "Roll"

**Expected:**
- Additional −20 penalty applied
- If hit: Location forced to "Head"

**Pass/Fail:** ____

---

### RC-04: Semi-Auto Burst (Multiple Hits)
**Goal:** Verify Rate of Fire (S/2/6) multiple hits

1. Attack with Astartes Bolter
2. Set Rate of Fire: "Semi-Auto Burst" (2 rounds)
3. Roll and achieve 2+ DoS

**Expected:**
- If 2 DoS: 2 hits shown
- If 4 DoS: 3 hits shown (max = RoF + 1)
- Each hit has separate location
- Ammo: −2 rounds

**Pass/Fail:** ____

---

### RC-05: Full-Auto Burst
**Goal:** Verify Full-Auto (6 rounds)

1. Attack with Astartes Bolter (set to Full-Auto if available)
2. Roll and achieve high DoS

**Expected:**
- Hits = 1 + (DoS / 2), max 6
- Multiple hit locations displayed
- Ammo: −6 rounds

**Pass/Fail:** ____

---

### RC-06: Righteous Fury
**Goal:** Verify Righteous Fury on natural 10 or less

1. **Manual Setup:** Edit Test Marine's BS to ensure 10 or less is a success
2. Attack until natural 1-10 rolled (may require multiple attempts)

**Expected:**
- Chat message indicates "Righteous Fury!"
- If vs xenos (Enemy actor): Auto-confirms (Deathwatch Training)
- If not xenos: Requires confirmation roll (95+)
- If confirmed: Roll damage, apply critical damage

**Pass/Fail:** ____

---

### RC-07: Ammo Tracking
**Goal:** Verify ammo consumption and reload

1. Note starting ammo on Bolter (30 rounds)
2. Fire Semi-Auto Burst (2 rounds) → Ammo: 28
3. Fire Semi-Auto Burst again (2 rounds) → Ammo: 26
4. Reload weapon (click reload on sheet)

**Expected:**
- Ammo decrements correctly
- Reload restores to max (30)
- Warning shown when ammo low (<10%)

**Pass/Fail:** ____

---

### RC-08: Weapon Quality - Tearing
**Goal:** Verify Tearing quality (reroll 1s on damage dice)

1. **Setup:** Equip weapon with Tearing quality (e.g., Storm Bolter)
2. Attack and hit
3. Click "Apply Damage" button
4. Observe damage roll

**Expected:**
- Any 1s on damage dice are rerolled
- Reroll shown in chat ("Tearing: rerolled [1] → [X]")

**Pass/Fail:** ____

---

### RC-09: Weapon Quality - Accurate
**Goal:** Verify Accurate quality (+DoS to damage if Aim action)

1. **Setup:** Equip weapon with Accurate quality (e.g., Stalker Bolter)
2. Take Aim action (set Aim modifier +10)
3. Attack and hit with 2+ DoS
4. Apply damage

**Expected:**
- Damage roll shows base damage + DoS bonus
- Chat shows "Accurate: +[DoS] to damage"

**Pass/Fail:** ____

---

### RC-10: Weapon Quality - Blast
**Goal:** Verify Blast quality (affects multiple targets)

1. **Setup:** Equip Frag Grenade (Blast 5m)
2. Place multiple enemy tokens within 5m
3. Throw grenade (ranged attack)

**Expected:**
- Chat prompts for targets within blast radius
- Each target rolls Agility to dodge (−20)
- Hits applied to all who fail dodge

**Pass/Fail:** ____

---

### RC-11: Weapon Quality - Storm
**Goal:** Verify Storm quality (ignore range penalties, suppress)

1. **Setup:** Equip weapon with Storm quality (e.g., Storm Bolter)
2. Set Range: Extreme (normally −30)
3. Attack

**Expected:**
- No range penalty applied
- If 3+ hits: Target must test for Suppression

**Pass/Fail:** ____

---

### RC-12: Jamming (Optional)
**Goal:** Verify weapon jam on attack roll of 96-00

1. Attack until natural 96+ rolled

**Expected:**
- "Weapon Jammed!" message
- Attack fails regardless of target number
- Requires Unjam action (Tech-Use test)

**Pass/Fail:** ____

---

### RC-13: Point-Blank Range
**Goal:** Verify +30 bonus at Point-Blank (<2m)

1. Move Test Marine adjacent to target (within 1 square = 3m)
2. Attack with pistol or other ranged weapon

**Expected:**
- If within 2m: +30 bonus shown
- If 3m or more: No bonus

**Pass/Fail:** ____

---

### RC-14: Extreme Range
**Goal:** Verify −30 penalty at Extreme range

1. Move Test Enemy beyond weapon's Long range
2. Attack

**Expected:**
- −30 penalty shown
- May require special action (e.g., Aim) to be possible

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- DoS miscalculation (should be tens digit of success)
- Hit location not randomized correctly (1d100 table)
- Ammo not decrementing
- Weapon qualities not applying

**Reference:** [.claude/docs/combat-system.md](../../.claude/docs/combat-system.md)

_Blessed ranged combat protocols verified. Praise the Omnissiah._ ⚙️
