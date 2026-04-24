# Mental State Test Plan

**Coverage:** Insanity Points, Corruption Points, mental disorders, malignancies, chapter curses, Fear tests, Willpower tests

## Prerequisites
- Test Marine with mental state tracking enabled
- Access to character sheet (Mental tab)
- Scenarios that trigger Fear or Corruption

---

## Test Cases

### MS-01: Insanity Points (Gain)
**Goal:** Verify Insanity Points gained from Fear/trauma

1. **Setup:** Test Marine at 0 Insanity Points (IP)
2. Fail Fear test (e.g., see daemon)
3. GM awards +1d5 Insanity Points

**Expected:**
- IP increases (e.g., 0 → 3)
- IP shown on character sheet (Mental tab)
- Change persists after refresh

**Pass/Fail:** ____

---

### MS-02: Insanity Threshold (10 IP)
**Goal:** Verify mental disorder gained at 10+ IP

1. **Setup:** Test Marine at 8 IP
2. Gain +3 IP (total: 11)

**Expected:**
- Warning: "Insanity threshold reached!"
- Roll on Mental Disorders table (or GM assigns)
- Disorder added to character sheet
- Disorder has mechanical effects

**Pass/Fail:** ____

---

### MS-03: Mental Disorder (Active)
**Goal:** Verify active mental disorder effects

1. **Setup:** Character has "Paranoia" disorder
2. Enter social situation (GM discretion)

**Expected:**
- Disorder triggers: WP test to avoid paranoid behavior
- If fail: Character acts paranoid (roleplaying effect)
- If severe: Mechanical penalty (e.g., −10 to Fellowship tests)

**Pass/Fail:** ____

---

### MS-04: Insanity Points (Recovery)
**Goal:** Verify IP can be reduced through rest/therapy

1. **Setup:** Test Marine at 15 IP
2. Undergo therapy or extended rest (1d5 days)

**Expected:**
- IP reduced: e.g., −1d5 IP (minimum 0)
- Disorder may remain even if IP reduced
- Chat shows IP recovery

**Pass/Fail:** ____

---

### MS-05: Corruption Points (Gain)
**Goal:** Verify Corruption Points gained from Chaos exposure

1. **Setup:** Test Marine at 0 Corruption Points (CP)
2. Exposed to Chaos artifact (e.g., touch daemon weapon)
3. GM awards +1d10 CP

**Expected:**
- CP increases (e.g., 0 → 7)
- CP shown on character sheet (Mental tab)
- Change persists

**Pass/Fail:** ____

---

### MS-06: Corruption Threshold (10 CP)
**Goal:** Verify malignancy gained at 10+ CP

1. **Setup:** Test Marine at 8 CP
2. Gain +5 CP (total: 13)

**Expected:**
- Warning: "Corruption threshold reached!"
- Roll on Malignancies table (or GM assigns)
- Malignancy added to character sheet
- Malignancy has visible/mechanical effect

**Pass/Fail:** ____

---

### MS-07: Malignancy (Physical)
**Goal:** Verify physical malignancy effects (e.g., mutations)

1. **Setup:** Character has "Unnatural Eyes" malignancy
2. Check character appearance/stats

**Expected:**
- Description updated: "Eyes glow with warp energy"
- Mechanical effect: e.g., −10 to Fellowship tests vs Imperial citizens
- Effect shown on sheet

**Pass/Fail:** ____

---

### MS-08: Malignancy (Mental)
**Goal:** Verify mental malignancy effects (e.g., voices)

1. **Setup:** Character has "Warp Whispers" malignancy
2. Make WP test in stressful situation

**Expected:**
- Test triggered: WP test to resist voices
- If fail: Character distracted or confused (−10 to next action)
- Effect roleplayed and mechanical

**Pass/Fail:** ____

---

### MS-09: Corruption Points (Cannot Recover)
**Goal:** Verify CP is permanent (no recovery)

1. **Setup:** Test Marine at 15 CP
2. Attempt to reduce CP (rest, prayer, etc.)

**Expected:**
- CP remains at 15 (no reduction)
- Warning: "Corruption is permanent"
- Only exception: GM intervention or special quest

**Pass/Fail:** ____

---

### MS-10: Corruption Threshold (100 CP)
**Goal:** Verify character lost to Chaos at 100 CP

1. **Setup:** Test Marine at 95 CP
2. Gain +10 CP (total: 105)

**Expected:**
- **Character lost to Chaos** (becomes NPC)
- Warning shown: "You have fallen to Chaos"
- Character sheet marked as "Fallen" or "Corrupted"
- GM takes control

**Pass/Fail:** ____

---

### MS-11: Chapter Curse (Blood Angels)
**Goal:** Verify chapter-specific curse: Blood Angels' Black Rage

1. **Setup:** Create Blood Angels Marine
2. Check curse conditions (e.g., <50% wounds, high IP)

**Expected:**
- Curse listed: "Black Rage" or "Red Thirst"
- When triggered: WP test to resist rage
- If fail: +10 WS, +10 S, cannot retreat (until combat ends)
- Status effect shown

**Pass/Fail:** ____

---

### MS-12: Chapter Curse (Space Wolves)
**Goal:** Verify Space Wolves' Curse of the Wulfen

1. **Setup:** Create Space Wolves Marine
2. Trigger curse (e.g., high IP, moon phase, GM discretion)

**Expected:**
- Curse listed: "Curse of the Wulfen"
- When triggered: Physical changes (fangs, claws)
- Mechanical effect: +10 S, −10 Fellowship
- May lose control (GM discretion)

**Pass/Fail:** ____

---

### MS-13: Fear Test (Fear 1)
**Goal:** Verify Fear test mechanics (basic fear)

1. **Setup:** Test Marine encounters Fear 1 creature (e.g., zombies)
2. Make Fear test: WP − 10

**Expected:**
- Roll 1d100 vs (WP − 10)
- If succeed: No effect
- If fail: Gain 1 IP, may be shaken (−10 to tests for 1 round)
- Chat shows Fear test result

**Pass/Fail:** ____

---

### MS-14: Fear Test (Fear 4)
**Goal:** Verify high-level Fear test (Fear 4 = Greater Daemon)

1. **Setup:** Test Marine encounters Fear 4 creature
2. Make Fear test: WP − 40

**Expected:**
- Roll 1d100 vs (WP − 40) (extremely difficult)
- If succeed: No effect
- If fail: Gain 1d10 IP, stunned for 1d5 rounds
- May flee or cower

**Pass/Fail:** ____

---

### MS-15: Fear Immunity (Fearless)
**Goal:** Verify Fearless talent/trait negates Fear tests

1. **Setup:** Test Marine has "Fearless" talent
2. Encounter Fear 4 creature

**Expected:**
- No Fear test required
- No IP gained
- Chat shows "Fearless: immune to Fear"

**Pass/Fail:** ____

---

### MS-16: Willpower Test (Resist Psychic Power)
**Goal:** Verify WP test to resist psychic attack

1. **Setup:** Enemy psyker uses Compel on Test Marine
2. Make opposed WP test

**Expected:**
- Roll 1d100 vs WP
- Compare DoS with attacker's DoS
- If succeed: Power resisted
- If fail: Power takes effect

**Pass/Fail:** ____

---

### MS-17: Trauma (Narrative Insanity)
**Goal:** Verify narrative trauma awards IP

1. **Setup:** Test Marine witnesses ally's death (GM scenario)
2. GM awards trauma IP

**Expected:**
- IP gained: e.g., +1d5
- Narrative justification shown in chat
- May trigger disorder if threshold crossed

**Pass/Fail:** ____

---

### MS-18: Insanity Disorders (Multiple)
**Goal:** Verify character can have multiple disorders

1. **Setup:** Test Marine at 25 IP (crossed 10 and 20 thresholds)

**Expected:**
- Two disorders listed (one at 10 IP, one at 20 IP)
- Both disorders may trigger independently
- Each has separate effects

**Pass/Fail:** ____

---

### MS-19: Malignancies (Multiple)
**Goal:** Verify character can have multiple malignancies

1. **Setup:** Test Marine at 35 CP (crossed 10, 20, 30 thresholds)

**Expected:**
- Three malignancies listed
- All malignancies visible/active
- Cumulative effects shown

**Pass/Fail:** ____

---

### MS-20: IP/CP Display on Sheet
**Goal:** Verify IP and CP clearly displayed

1. Open character sheet → Mental tab

**Expected:**
- IP shown: e.g., "Insanity: 12 / 100"
- CP shown: e.g., "Corruption: 7 / 100"
- Disorders listed below IP
- Malignancies listed below CP
- Thresholds marked (10, 20, 30, etc.)

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- IP/CP not incrementing correctly
- Disorders/malignancies not applying mechanical effects
- Fear tests not scaled by Fear rating
- Corruption not permanent (incorrectly allowing reduction)
- Chapter curses not triggering at appropriate thresholds

**Reference:** 
- [.claude/docs/insanity-corruption.md](../../.claude/docs/insanity-corruption.md)
- `src/module/helpers/character/mental-state.mjs`

_Mental fortitude protocols verified. The Emperor's light shields us from madness._ ⚙️
