# Character Management Test Plan

**Coverage:** XP gains, rank advances, characteristic increases, skill purchases, talent acquisition, wounds, fate points, modifiers

## Prerequisites
- Test Marine (Rank 1, some XP available)
- Access to character sheet (all tabs)

---

## Test Cases

### CM-01: XP Award
**Goal:** Verify XP can be added to character

1. Open Test Marine character sheet
2. Note current XP (e.g., 5000)
3. Add +1000 XP (via sheet or macro)

**Expected:**
- XP increases to 6000
- Change persists after refresh
- Available XP shown in Advances tab

**Pass/Fail:** ____

---

### CM-02: Characteristic Advance (Purchase)
**Goal:** Verify characteristic can be increased with XP

1. Navigate to Advances tab
2. Click +1 next to Weapon Skill (WS)
3. Confirm XP cost (e.g., 250 XP for +5)

**Expected:**
- WS increases by +5 (e.g., 40 → 45)
- XP reduced by cost (250)
- Advance logged in history
- Derived stats update (e.g., WS Bonus)

**Pass/Fail:** ____

---

### CM-03: Characteristic Advance (Maximum)
**Goal:** Verify characteristics cap at species maximum

1. **Setup:** Increase characteristic to species max (e.g., 60 for Human)
2. Attempt to advance beyond max

**Expected:**
- Warning shown: "Cannot exceed species maximum"
- Advance blocked
- XP not spent

**Pass/Fail:** ____

---

### CM-04: Skill Advance (Known → +10)
**Goal:** Verify skill advance from Known to +10

1. Navigate to Skills section
2. Find skill at "Known" (e.g., Awareness)
3. Click +10 button
4. Confirm XP cost

**Expected:**
- Skill advances: Known → +10
- XP reduced by cost (e.g., 100 XP)
- Skill roll target increases by 10
- Advance logged

**Pass/Fail:** ____

---

### CM-05: Skill Advance (Untrained → Known)
**Goal:** Verify skill can be purchased from Untrained

1. Find Untrained skill (e.g., Forbidden Lore)
2. Click "Purchase" or +10 button
3. Confirm XP cost

**Expected:**
- Skill: Untrained → Known
- XP reduced by cost (e.g., 200 XP)
- Skill now rollable at base characteristic

**Pass/Fail:** ____

---

### CM-06: Talent Purchase
**Goal:** Verify talent acquisition with XP

1. Navigate to Talents tab
2. Click "Add Talent" button
3. Search for talent (e.g., "Swift Attack")
4. Confirm XP cost (e.g., 300 XP)

**Expected:**
- Talent added to character
- XP reduced by cost
- Talent effect active (if passive)
- Advance logged

**Pass/Fail:** ____

---

### CM-07: Rank Advance (1 → 2)
**Goal:** Verify rank increases when sufficient XP spent

1. **Setup:** Spend 5000+ XP on advances
2. Check character rank

**Expected:**
- Rank increases automatically: Rank 1 → Rank 2
- Rank shown on header/summary
- New abilities/talents unlocked per rank

**Pass/Fail:** ____

---

### CM-08: Wounds Calculation
**Goal:** Verify wounds = TB + 2× Space Marine Toughness Bonus

1. Check Test Marine's Toughness (e.g., T 40, TB 4)
2. Check Max Wounds

**Expected:**
- Max Wounds = TB + 2×(TB + Space Marine bonus)
- Example: TB 4 → 4 + 2×(4 + 2) = 16 wounds
- Updates when Toughness increases

**Pass/Fail:** ____

---

### CM-09: Fate Points (Usage)
**Goal:** Verify Fate Point can be spent to reroll

1. **Setup:** Test Marine has 3 Fate Points
2. Make a failed roll (e.g., attack)
3. Spend Fate Point to reroll

**Expected:**
- Fate Point: 3 → 2
- Roll rerolled (new result)
- Change persists

**Pass/Fail:** ____

---

### CM-10: Fate Points (Cheat Death)
**Goal:** Verify Fate Point can be burned to avoid death

1. **Setup:** Test Marine reduced to 0 wounds (critical damage)
2. Burn Fate Point to survive

**Expected:**
- Fate Point: 2 → 1 (permanently lost)
- Wounds restored to 1
- Character survives
- Chat shows "Fate Point burned"

**Pass/Fail:** ____

---

### CM-11: Characteristic Damage (Temporary)
**Goal:** Verify temporary characteristic damage tracked

1. **Setup:** Apply poison that reduces Toughness by −10
2. Check character sheet

**Expected:**
- Current Toughness: 40 − 10 = 30
- Max Toughness: 40 (unchanged)
- TB recalculated: 3 (down from 4)
- Wounds may reduce temporarily

**Pass/Fail:** ____

---

### CM-12: Characteristic Damage (Permanent)
**Goal:** Verify permanent characteristic damage (e.g., from critical injury)

1. **Setup:** Apply permanent −5 to Agility (critical leg injury)
2. Check character sheet

**Expected:**
- Max Agility reduced: e.g., 45 → 40
- Current Agility: 40
- Agility Bonus recalculated
- Permanent modifier tracked

**Pass/Fail:** ____

---

### CM-13: Cybernetics (Bionic Limb)
**Goal:** Verify cybernetic limb replaces characteristic

1. **Setup:** Install Bionic Arm (Strength 40)
2. Check Strength characteristic

**Expected:**
- Strength = 40 (bionic) if higher than natural
- Or use natural if higher
- Modifier shown in sheet
- Strength Bonus recalculated

**Pass/Fail:** ____

---

### CM-14: Modifiers (Stacked)
**Goal:** Verify multiple modifiers stack correctly

1. **Setup:** Apply the following modifiers to WS:
   - Talent: +5
   - Equipment: +10
   - Temporary: −10 (injury)
2. Check effective WS

**Expected:**
- Base WS: 40
- Total modifiers: +5 +10 −10 = +5
- Effective WS: 45
- All modifiers listed on sheet

**Pass/Fail:** ____

---

### CM-15: Modifiers (Conditional)
**Goal:** Verify conditional modifiers (e.g., +10 vs Orks)

1. **Setup:** Apply "Hatred (Orks)" talent
2. Attack Ork enemy

**Expected:**
- Attack shows +10 modifier (if targeting Ork)
- No modifier against non-Orks
- Chat shows "Hatred (Orks): +10"

**Pass/Fail:** ____

---

### CM-16: Experience Total vs Available
**Goal:** Verify XP total vs available XP tracking

1. **Setup:** Character has 10000 XP total, spent 7000
2. Check Advances tab

**Expected:**
- Total XP: 10000
- Spent XP: 7000
- Available XP: 3000
- All advances logged with costs

**Pass/Fail:** ____

---

### CM-17: Chapter Abilities
**Goal:** Verify chapter-specific abilities (e.g., Ultramarines' Tactical Versatility)

1. **Setup:** Create Space Marine from specific chapter
2. Check chapter abilities on sheet

**Expected:**
- Chapter listed (e.g., "Ultramarines")
- Chapter abilities shown (e.g., "+10 to two skills")
- Abilities active and applied to rolls

**Pass/Fail:** ____

---

### CM-18: Specialty Abilities
**Goal:** Verify specialty-specific abilities (e.g., Devastator's Bolter Drill)

1. **Setup:** Create Devastator Marine
2. Check specialty abilities

**Expected:**
- Specialty: Devastator
- Specialty abilities listed
- Abilities active (e.g., Bolter Drill: +10 to Heavy Weapons)

**Pass/Fail:** ____

---

### CM-19: Fatigue Tracking
**Goal:** Verify fatigue accumulation and effects

1. **Setup:** Test Marine at 0 Fatigue
2. Apply +1 Fatigue (e.g., from On Fire)
3. Repeat until Fatigue ≥ TB

**Expected:**
- Fatigue increases: 0 → 1 → 2...
- At Fatigue ≥ TB: Penalties applied (−10 to tests)
- At Fatigue ≥ 2×TB: Unconscious
- Fatigue shown on sheet and token

**Pass/Fail:** ____

---

### CM-20: Rest and Recovery (Wounds)
**Goal:** Verify natural wound recovery over time

1. **Setup:** Test Marine at 10/22 wounds
2. Rest for 1 day (GM advances time)

**Expected:**
- Wounds recover: +1 per day (or per Toughness Bonus per day)
- Chat/log shows recovery
- Wounds capped at max

**Pass/Fail:** ____

---

### CM-21: Rest and Recovery (Fatigue)
**Goal:** Verify fatigue recovery after rest

1. **Setup:** Test Marine at 4 Fatigue
2. Rest for 8 hours

**Expected:**
- Fatigue: −1 per hour of rest
- After 4 hours: Fatigue = 0
- Full recovery requires rest, not just time

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- XP not deducting correctly on advances
- Characteristic maximums not enforced
- Modifiers not stacking (replacing instead)
- Wounds not recalculating when Toughness changes
- Fate Points not tracking spent vs burned

**Reference:** 
- [.claude/docs/modifiers.md](../../.claude/docs/modifiers.md)
- `src/module/helpers/character/xp-calculator.mjs`
- `src/module/helpers/character/wounds-calculator.mjs`

_Character advancement protocols sanctified. The Codex approves._ ⚙️
