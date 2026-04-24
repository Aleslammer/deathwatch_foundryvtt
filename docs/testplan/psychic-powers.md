# Psychic Powers Test Plan

**Coverage:** Focus Power Test, power levels, Psy Rating, Phenomena/Perils, Hive Mind, opposed tests, psychic damage

## Prerequisites
- Test Marine (Librarian) with psychic powers (e.g., Smite, Avenger, Compel)
- Psy Rating: 3 or higher
- Test Enemy token on scene
- Active combat encounter

---

## Test Cases

### PP-01: Focus Power Test (Fettered)
**Goal:** Verify basic psychic power activation at Fettered level

1. Click psychic power (e.g., Smite) on Librarian sheet
2. Select "Fettered" power level
3. Click "Roll"

**Expected:**
- Roll 1d100 vs WP (no modifier)
- Effective Psy Rating: PR − 1 (e.g., PR 3 → 2)
- If success: Power activates, no Phenomena
- If fail: Power fails, no Phenomena
- Chat shows power result

**Pass/Fail:** ____

---

### PP-02: Focus Power Test (Unfettered)
**Goal:** Verify Unfettered power level (standard PR)

1. Activate power at Unfettered level

**Expected:**
- Roll 1d100 vs WP
- Effective PR: Full PR (e.g., 3)
- If success: Power activates, **no Phenomena**
- If fail: Power fails, **roll Psychic Phenomena** (d100)

**Pass/Fail:** ____

---

### PP-03: Focus Power Test (Push)
**Goal:** Verify Push power level (PR +1, always Phenomena)

1. Activate power at Push level

**Expected:**
- Roll 1d100 vs WP
- Effective PR: PR + 1 (e.g., PR 3 → 4)
- If success: Power activates, **roll Phenomena**
- If fail: Power fails, **roll Phenomena**
- Push always risks Phenomena/Perils

**Pass/Fail:** ____

---

### PP-04: Psychic Phenomena (Minor)
**Goal:** Verify Phenomena roll (d100) for minor results (01-75)

1. Activate power at Unfettered, fail test
2. Roll Phenomena: 01-75

**Expected:**
- Phenomena result displayed (e.g., "Unnatural Cold", "Veil of Darkness")
- Minor effect described in chat
- No Perils of the Warp triggered

**Pass/Fail:** ____

---

### PP-05: Perils of the Warp (Major)
**Goal:** Verify Perils triggered on Phenomena 76-00

1. Activate power at Unfettered, fail test
2. Roll Phenomena: 76-00

**Expected:**
- Phenomena result displayed
- **Perils of the Warp** rolled (second d100)
- Perils effect applied (e.g., 1d10 Energy damage, warp entity, etc.)
- Chat shows full Perils result

**Pass/Fail:** ____

---

### PP-06: Tyranid Hive Mind (No Phenomena)
**Goal:** Verify Tyranid psykers use Hive Mind backlash instead of Phenomena

1. **Setup:** Create Tyranid psyker enemy (e.g., Zoanthrope)
2. Activate psychic power, fail test

**Expected:**
- **No** Psychic Phenomena roll
- **Hive Mind backlash:** 1d10 Energy damage (ignores armor)
- Chat shows "Hive Mind backlash: [X] Energy damage"

**Pass/Fail:** ____

---

### PP-07: Opposed Psychic Test (Compel)
**Goal:** Verify opposed WP test for powers like Compel, Dominate

1. Activate Compel power on Test Enemy
2. Succeed on Focus Power Test

**Expected:**
- Chat message shows power activated
- "Oppose Test" button appears for target
- Target (GM) clicks button → Rolls WP test
- If target fails: Power takes effect (enemy compelled)
- If target succeeds: Power resisted

**Pass/Fail:** ____

---

### PP-08: Psychic Damage (Smite)
**Goal:** Verify damage-dealing psychic power

1. Activate Smite (or similar attack power)
2. Succeed on Focus Power Test
3. Roll damage

**Expected:**
- Damage: 1d10 + PR (e.g., PR 3 → 1d10+3)
- Type: Energy
- Penetration: Specified in power (e.g., Pen 4)
- "Apply Damage" button present
- Apply damage to target

**Pass/Fail:** ____

---

### PP-09: Psychic Barrage (Multiple Bolts)
**Goal:** Verify powers that attack multiple targets (e.g., Avenger)

1. Activate Avenger (fires multiple psychic bolts)
2. Succeed on Focus Power Test
3. Target multiple enemies

**Expected:**
- Number of bolts = PR (e.g., PR 3 → 3 bolts)
- Each bolt requires ranged attack roll (BS test)
- Each hit applies damage separately
- Chat shows all attack rolls

**Pass/Fail:** ____

---

### PP-10: Psychic Shield (Defensive Power)
**Goal:** Verify defensive/utility powers (e.g., Force Dome)

1. Activate Force Dome or similar shield power
2. Succeed on Focus Power Test

**Expected:**
- Effect described in chat (e.g., +armor, deflect attacks)
- Duration specified (e.g., PR rounds)
- Effect tracked on token/character

**Pass/Fail:** ____

---

### PP-11: Sustained Powers
**Goal:** Verify sustained power duration and concentration

1. Activate sustained power (e.g., Psychic Shriek)
2. Check duration: PR rounds or until concentration broken

**Expected:**
- Duration shown in chat
- Status effect applied to token (if applicable)
- Power ends after specified rounds or if caster takes damage

**Pass/Fail:** ____

---

### PP-12: Psy Rating Modifier (Gear)
**Goal:** Verify Psy Rating bonuses from items (e.g., Psychic Hood)

1. **Setup:** Equip Psychic Hood (+1 Psy Rating)
2. Check character sheet Psy Rating
3. Activate power at Unfettered

**Expected:**
- Effective PR: Base PR + 1 (e.g., 3 → 4)
- Power uses modified PR for damage/effect
- Chat confirms PR value

**Pass/Fail:** ____

---

### PP-13: Willpower Bonus Calculation
**Goal:** Verify WP Bonus used in Focus Power Tests

1. **Setup:** Check Librarian's Willpower (e.g., WP 45)
2. Activate power
3. Verify target number

**Expected:**
- Target number = Willpower characteristic (e.g., 45)
- WP Bonus (WP / 10) may affect power effects (not test)

**Pass/Fail:** ____

---

### PP-14: Force Weapon (Psychic Focus)
**Goal:** Verify Force weapon quality adds PR to damage

1. **Setup:** Equip Force Sword
2. Make melee attack, succeed
3. Apply damage

**Expected:**
- Base damage: 1d10+5
- Force bonus: +PR (e.g., +3)
- Total damage: 1d10+5+3
- Chat shows "Force: +3 (Psy Rating)"

**Pass/Fail:** ____

---

### PP-15: Psychic Strength Test
**Goal:** Verify opposed tests against psychic powers

1. Enemy psyker attacks Librarian with Compel
2. Librarian resists with WP test

**Expected:**
- WP test rolled (1d100 vs WP)
- If success: Power resisted
- If fail: Effect takes hold
- DoS comparison if both succeed

**Pass/Fail:** ____

---

### PP-16: Corruption from Perils
**Goal:** Verify Corruption Points gained from severe Perils

1. Trigger Perils of the Warp (roll 76-00 on Phenomena)
2. Roll Perils result: 81-00 (severe effects)

**Expected:**
- Some results add 1d5 or 1d10 Corruption Points
- CP updated on character sheet
- Chat shows CP gain

**Pass/Fail:** ____

---

### PP-17: Psy Focus Action
**Goal:** Verify Psy Focus action (+10 to next power test)

1. Declare Psy Focus action (Full Action)
2. Next round, activate power

**Expected:**
- +10 bonus to WP test
- Bonus applies to next power only
- Chat shows modifier

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- Phenomena not rolling on Unfettered failure
- Perils not triggering on Phenomena 76-00
- Tyranid Hive Mind not replacing Phenomena
- Opposed tests not prompting target
- Psy Rating not scaling damage

**Reference:** 
- [.claude/docs/combat-system.md](../../.claude/docs/combat-system.md) (Psychic Powers section)
- `src/module/helpers/combat/psychic-combat.mjs`

_Psychic protocols sanctified. The Warp bends to your will, Librarian._ ⚙️
