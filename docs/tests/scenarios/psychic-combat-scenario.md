# Psychic Combat Scenario

**Purpose:** Validate psychic power mechanics, Focus Power Tests, Psychic Phenomena, Perils of the Warp, and Tyranid Hive Mind backlash

**Duration:** 25-30 minutes

**Prerequisites:** Test world setup complete

**Actors Required:**
- Marine D "Librarian" (psyker, PR 4, 3 powers)
- Tau Fire Warrior (target for attack power)
- Ork Boy (target for opposed power)
- Tyranid Warrior (for Hive Mind backlash test)

**Role Assignments:**
- **GM:** Enemy setup, Phenomena/Perils table rolls, opposed tests
- **Player:** Execute psychic powers, Focus Power Tests

---

## Setup

### Step 1: Prepare Psychic Combat

**GM Actions:**
1. Open "Test Combat Arena" scene
2. Place Marine D "Librarian" at starting position
3. Place Tau Fire Warrior 20m away
4. Place Ork Boy 15m away
5. Place Tyranid Warrior 25m away (will become psyker for backlash test)
6. Begin combat, roll initiative

**Expected Results:**
- All tokens positioned
- Combat tracker active

---

## Test 1: Focus Power Test (Unfettered)

**Objective:** Verify basic psychic power activation

### Step 2: Cast Smite (Attack Power)

**Player Actions:**
1. Select Marine D token
2. Click "Smite" power from character sheet
3. Focus Power Test dialog opens:
   - Power Level: Unfettered (default)
   - Target: Tau Fire Warrior
4. Roll Focus Power Test (1d100 vs WP)

**Expected Results:**
- Dialog shows:
  - WP: 50
  - Base Psy Rating: 4
  - Effective PR: 4 (Unfettered = +0 modifier)
  - Power Level: Unfettered
- Roll 1d100 vs 50
- DoS calculated
- If successful:
  - Power activates
  - Damage calculated: PR × d10 (4d10 for PR 4)
  - "Apply Damage" button in chat
- If failed:
  - Power fails
  - Roll Psychic Phenomena (next test)

---

## Test 2: Psychic Phenomena (Failed Test)

**Objective:** Verify Phenomena triggers on failure

### Step 3: Deliberately Fail Focus Power Test

**GM Note:** For testing, either roll naturally to fail, or manually simulate failure

**Player Actions:**
1. Attempt another psychic power (e.g., Iron Arm)
2. Power Level: Unfettered
3. Roll and intentionally fail (roll above WP)

**Expected Results:**
- Focus Power Test fails (roll > WP)
- System prompts for Psychic Phenomena roll
- Roll 1d100 on Phenomena table
- Chat message shows:
  - Phenomena roll result (e.g., 45)
  - Table lookup result (e.g., "Minor disturbance, no effect")
  - If roll is 75+: Triggers Perils of the Warp (next test)

---

## Test 3: Perils of the Warp

**Objective:** Verify Perils cascade from high Phenomena roll

### Step 4: Trigger Perils of the Warp

**GM Actions:**
1. Manually set up Phenomena roll result of 75+ (or roll naturally)

**Expected Results:**
- Phenomena roll ≥ 75
- System prompts for Perils of the Warp roll
- Roll 1d100 on Perils table
- Chat message shows:
  - Perils roll result (e.g., 62)
  - Table lookup result (e.g., "Psyker takes 1d10 Energy damage")
  - Apply Perils effect immediately

**Example Perils Effects:**
- Damage to psyker
- Fatigue gain
- Temporary debuffs
- Catastrophic results (high rolls)

---

## Test 4: Push Power Level

**Objective:** Verify Push increases PR and Phenomena risk

### Step 5: Cast Power at Push Level

**Player Actions:**
1. Cast Smite power again
2. In Focus Power Test dialog:
   - Power Level: **Push**
   - Target: Tau Fire Warrior
3. Roll Focus Power Test

**Expected Results:**
- Effective PR: Base PR + 1 = 5 (shown in dialog)
- Damage potential increases: 5d10 instead of 4d10
- **Important:** Even if successful, roll Psychic Phenomena (Push always triggers Phenomena)
- Chat shows:
  - Power success
  - Damage rolled (5d10)
  - Phenomena roll required
  - Phenomena result

---

## Test 5: Fettered Power Level

**Objective:** Verify Fettered reduces PR and Phenomena risk

### Step 6: Cast Power at Fettered Level

**Player Actions:**
1. Cast Smite power
2. Power Level: **Fettered**
3. Roll Focus Power Test

**Expected Results:**
- Effective PR: Base PR - 1 = 3 (shown in dialog)
- Damage potential decreases: 3d10
- Easier to cast (safer)
- If failed: Still rolls Phenomena, but less likely to fail with conservative approach

---

## Test 6: Opposed Psychic Test

**Objective:** Verify opposed power mechanics (e.g., Compel, Dominate)

### Step 7: Cast Compel on Ork Boy

**Player Actions:**
1. Cast "Compel" power (or similar opposed power)
2. Power Level: Unfettered
3. Target: Ork Boy
4. Roll Focus Power Test

**Expected Results:**
- Focus Power Test succeeds (roll under WP)
- Chat message posts "Oppose Test" button for target
- **GM** clicks "Oppose Test" button
- Target (Ork Boy) rolls opposed WP test (1d100 vs WP)
- Compare DoS:
  - Psyker DoS > Target DoS: Power succeeds, effect applies
  - Target DoS ≥ Psyker DoS: Target resists, no effect
- Chat shows opposed test result

---

## Test 7: Psychic Hood (No Perils Modifier)

**Objective:** Verify equipment modifiers suppress Perils

### Step 8: Equip Psychic Hood

**Player Actions:**
1. Open Marine D character sheet
2. Verify "Psychic Hood" is equipped (should be in test world setup)
3. Attempt power that would normally trigger Phenomena
4. Roll Phenomena

**Expected Results:**
- Psychic Hood grants "No Perils" modifier
- When Phenomena roll would trigger Perils (75+):
  - System checks for "No Perils" modifier
  - Perils is suppressed (does not cascade)
  - Chat message: "Perils suppressed by Psychic Hood"

---

## Test 8: Tyranid Hive Mind Backlash

**Objective:** Verify Tyranid psykers use Hive Mind instead of Phenomena

**Setup:**
For this test, the Tyranid Warrior needs to be a psyker. If not already configured, temporarily give it a psychic power for testing.

### Step 9: Tyranid Warrior Fails Psychic Test

**GM Actions:**
1. Have Tyranid Warrior attempt psychic power
2. Ensure it has "Tyranid" trait
3. Deliberately fail Focus Power Test

**Expected Results:**
- Focus Power Test fails
- System detects "Tyranid" trait
- **Instead of Psychic Phenomena:**
  - Rolls Hive Mind backlash: 1d10 Energy damage
  - Damage applied directly to Tyranid Warrior
  - Chat message: "Hive Mind backlash: [X] Energy damage"
- No Phenomena or Perils rolls

---

## Test 9: Psy Rating Modifiers

**Objective:** Verify equipment/talents modify Psy Rating

### Step 10: Apply PR Modifier

**GM Actions:**
1. Add a talent or equipment item to Marine D that grants "+1 Psy Rating"
2. Open character sheet, verify modifier appears in Effects tab

**Player Actions:**
1. Cast Smite power
2. Check Focus Power Test dialog

**Expected Results:**
- Base PR: 4
- Modifier: +1 (from equipment/talent)
- Effective PR: 5 (before power level adjustment)
- Damage: 5d10 at Unfettered
- Chat shows PR calculation breakdown

---

## Cleanup

**GM Actions:**
1. End combat
2. Remove temporary psychic powers from Tyranid (if added)
3. Reset test world

---

## Validation Checklist

After completing this scenario, verify:

- ☐ Focus Power Test works at Fettered/Unfettered/Push levels
- ☐ Effective Psy Rating adjusts based on power level (-1/0/+1)
- ☐ Successful power applies effect (damage, buff, etc.)
- ☐ Failed power triggers Psychic Phenomena roll
- ☐ Phenomena roll ≥75 cascades to Perils of the Warp
- ☐ Push always triggers Phenomena (even on success)
- ☐ Opposed powers prompt target for opposed WP test
- ☐ Psychic Hood suppresses Perils of the Warp
- ☐ Tyranid psykers use Hive Mind backlash (1d10 Energy) instead of Phenomena

---

_Psychic protocols validated, Tech-Priest. The warp is perilous but contained._ ⚙️
