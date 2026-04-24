# Squad & Cohesion Test Plan

**Coverage:** Cohesion tracking, Solo Mode, Squad Mode, squad abilities, oath tracking, kill-team mechanics

## Prerequisites
- Multiple Test Marines (3-5) in a squad
- Squad Mode configured (Kill-team formed)
- Combat encounter with squad

---

## Test Cases

### SC-01: Cohesion Starting Value
**Goal:** Verify starting Cohesion for squad

1. **Setup:** Create new Kill-team with 5 Marines
2. Check Cohesion value

**Expected:**
- Starting Cohesion = 5 (1 per Marine, max 5-7)
- Cohesion shown on squad sheet or token
- Cohesion pool shared by all squad members

**Pass/Fail:** ____

---

### SC-02: Cohesion Loss (Squad Action)
**Goal:** Verify Cohesion spent on squad abilities

1. **Setup:** Squad at 5 Cohesion
2. Use Squad Mode ability (e.g., Bolter Assault, costs 3 Cohesion)

**Expected:**
- Cohesion: 5 → 2
- Ability activates
- All squad members benefit
- Chat shows Cohesion spent

**Pass/Fail:** ____

---

### SC-03: Cohesion Loss (Marine Defeated)
**Goal:** Verify Cohesion lost when Marine goes down

1. **Setup:** Squad at 5 Cohesion
2. One Marine reduced to 0 wounds (defeated)

**Expected:**
- Cohesion: 5 → 4 (or −1 per Marine down)
- Cohesion pool shrinks
- Chat shows "Cohesion reduced: Marine defeated"

**Pass/Fail:** ____

---

### SC-04: Cohesion Gain (Squad Test)
**Goal:** Verify Cohesion regained from successful actions

1. **Setup:** Squad at 2 Cohesion
2. Marine succeeds on difficult test (GM awards +1 Cohesion)

**Expected:**
- Cohesion: 2 → 3
- Cohesion pool increases
- Chat shows Cohesion gain reason

**Pass/Fail:** ____

---

### SC-05: Solo Mode Activation
**Goal:** Verify Solo Mode abilities when Cohesion = 0

1. **Setup:** Reduce squad Cohesion to 0
2. Check Solo Mode abilities

**Expected:**
- Cohesion = 0 → Solo Mode active
- Each Marine gains Solo Mode ability (chapter-specific)
- Squad Mode abilities unavailable
- Chat/status shows "Solo Mode"

**Pass/Fail:** ____

---

### SC-06: Squad Mode Ability (Bolter Assault)
**Goal:** Verify Squad Mode ability: Bolter Assault

1. **Setup:** Squad at 3+ Cohesion, Squad Mode active
2. Activate Bolter Assault (costs 3 Cohesion)
3. All squad members fire bolters

**Expected:**
- Cohesion: −3
- All Marines gain +10 to BS for this attack
- All Marines fire as one action
- Chat shows "Bolter Assault active"

**Pass/Fail:** ____

---

### SC-07: Squad Mode Ability (Storm of Iron)
**Goal:** Verify Squad Mode ability: Storm of Iron

1. **Setup:** Squad at 3+ Cohesion, Squad Mode active
2. Activate Storm of Iron (costs 3 Cohesion)
3. All Marines fire full-auto

**Expected:**
- Cohesion: −3
- All Marines fire full-auto at same target
- Damage combined or resolved separately
- Overwhelming firepower bonus

**Pass/Fail:** ____

---

### SC-08: Solo Mode Ability (Chapter-Specific)
**Goal:** Verify Solo Mode abilities are chapter-specific

1. **Setup:** Ultramarine at Cohesion 0 (Solo Mode)
2. Check Solo Mode ability

**Expected:**
- Ability shown: e.g., "Tactical Expertise" (+10 to INT tests)
- Ability active only in Solo Mode
- Different chapters have different abilities

**Pass/Fail:** ____

---

### SC-09: Oath Tracking (Squad Oath)
**Goal:** Verify squad oath tracking (e.g., "Slay the Warboss")

1. **Setup:** Squad takes oath: "Defeat 50 Orks"
2. Track progress (e.g., 23/50 Orks slain)

**Expected:**
- Oath listed on squad sheet
- Progress tracked (23/50)
- Completion grants reward (XP, Cohesion, etc.)

**Pass/Fail:** ____

---

### SC-10: Oath Completion
**Goal:** Verify oath completion rewards

1. **Setup:** Squad completes oath (50/50 Orks slain)
2. Claim reward

**Expected:**
- Oath marked complete
- Reward applied (e.g., +500 XP to all Marines)
- Cohesion may increase (+1 or +2)
- Chat shows oath completion

**Pass/Fail:** ____

---

### SC-11: Oath Failure
**Goal:** Verify oath failure penalties

1. **Setup:** Squad fails oath (e.g., Warboss escapes)
2. Mark oath failed

**Expected:**
- Oath marked failed
- Penalty applied (e.g., −1 Cohesion, no XP)
- May affect morale or future missions

**Pass/Fail:** ____

---

### SC-12: Kill-Team Formation
**Goal:** Verify Kill-team can be formed from multiple Marines

1. **Setup:** Select 5 Marines in actor directory
2. Create Kill-team (right-click → "Form Kill-team")

**Expected:**
- Kill-team actor created
- All Marines linked to Kill-team
- Cohesion initialized (5)
- Squad sheet accessible

**Pass/Fail:** ____

---

### SC-13: Kill-Team Roster Changes
**Goal:** Verify Marines can join/leave Kill-team

1. **Setup:** Kill-team with 4 Marines
2. Add new Marine to roster

**Expected:**
- Marine added to Kill-team
- Cohesion recalculated (4 → 5)
- Roster updated on squad sheet

**Pass/Fail:** ____

---

### SC-14: Cohesion Cap (Maximum)
**Goal:** Verify Cohesion caps at maximum (5-7)

1. **Setup:** Squad at max Cohesion (7)
2. Attempt to gain +1 Cohesion

**Expected:**
- Cohesion remains at 7 (capped)
- Warning shown: "Cohesion at maximum"

**Pass/Fail:** ____

---

### SC-15: Cohesion Minimum (Zero)
**Goal:** Verify Cohesion cannot go below 0

1. **Setup:** Squad at 1 Cohesion
2. Spend 2 Cohesion on ability

**Expected:**
- Warning shown: "Insufficient Cohesion"
- Ability fails to activate
- Cohesion remains at 1

**Pass/Fail:** ____

---

### SC-16: Squad Action (Coordinated Fire)
**Goal:** Verify coordinated fire bonus (+10 when all fire at same target)

1. **Setup:** Squad Mode active, 3+ Cohesion
2. All Marines declare same target
3. Spend Cohesion for coordinated fire

**Expected:**
- Cohesion: −2
- All Marines: +10 to BS
- Must fire at same target this turn

**Pass/Fail:** ____

---

### SC-17: Squad Leader Bonus
**Goal:** Verify Squad Leader grants Cohesion bonuses

1. **Setup:** Designate one Marine as Squad Leader
2. Leader succeeds on Command test

**Expected:**
- +1 Cohesion to squad (on success)
- Leader abilities affect all Marines in range
- Chat shows "Squad Leader: +1 Cohesion"

**Pass/Fail:** ____

---

### SC-18: Renown Tracking
**Goal:** Verify Renown points tracked per Marine

1. **Setup:** Marine completes mission objective
2. Award Renown points

**Expected:**
- Renown: +1 to +3 (depending on deed)
- Renown shown on character sheet
- High Renown grants bonuses (e.g., Requisition)

**Pass/Fail:** ____

---

### SC-19: Requisition (Squad Gear)
**Goal:** Verify Requisition system for mission gear

1. **Setup:** Squad at Renown 10+
2. Request gear for mission (e.g., Power Sword, Requisition 15)

**Expected:**
- Requisition test: 1d100 vs Renown
- If succeed: Gear granted for mission
- If fail: Gear unavailable
- Gear returned after mission

**Pass/Fail:** ____

---

### SC-20: Squad Mode vs Solo Mode Toggle
**Goal:** Verify toggling between Squad Mode and Solo Mode

1. **Setup:** Squad at 3 Cohesion (Squad Mode)
2. Spend Cohesion until 0 → Solo Mode
3. Regain Cohesion → Squad Mode

**Expected:**
- At 0 Cohesion: Solo Mode abilities active
- At 1+ Cohesion: Squad Mode abilities available
- Toggle is automatic, no action required

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- Cohesion not shared across squad members
- Solo Mode abilities not activating at 0 Cohesion
- Squad Mode abilities available at 0 Cohesion (should be disabled)
- Cohesion not decreasing when Marine defeated
- Oath progress not tracked correctly

**Reference:** 
- [.claude/docs/cohesion-squad.md](../../.claude/docs/cohesion-squad.md)
- `src/module/helpers/character/cohesion-calculator.mjs`

_Squad protocols sanctified. Together, brothers, we are invincible._ ⚙️
