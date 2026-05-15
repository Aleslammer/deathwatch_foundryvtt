# Squad vs Horde Scenario

**Purpose:** Validate horde mechanics, magnitude tracking, blast/flame vs hordes, horde breaking, and cohesion/Squad Mode management

**Duration:** 30-35 minutes

**Prerequisites:** Test world setup complete

**Actors Required:**
- All 4 Marines (A, B, C, D)
- Ork Mob (Horde, magnitude 30)

**Role Assignments:**
- **GM:** Horde management, magnitude tracking, cohesion adjustments
- **Players:** Squad actions, cohesion abilities, attacks

---

## Setup

### Step 1: Prepare Squad Combat

**GM Actions:**
1. Open "Test Combat Arena" scene
2. Place all 4 Marine tokens at starting positions
3. Place Ork Mob horde token 20m away from Marines
4. Verify Ork Mob magnitude: 30
5. Open Cohesion Panel (shield icon in Token Controls)
6. Verify cohesion: 7/10, Squad Leader = Marine A
7. Verify all Marines in Squad Mode (green indicator)
8. Begin combat, roll initiative

**Expected Results:**
- All Marines show green Squad Mode indicator in cohesion panel
- Ork Mob shows magnitude 30
- Cohesion panel displays 7/10

---

## Test 1: Cohesion Calculation

**Objective:** Verify cohesion max calculation

### Step 2: Calculate Cohesion Maximum

**GM Actions:**
1. Open Marine A "Tactical" character sheet
2. Note Fellowship Bonus (e.g., FS 45 = Bonus 4)
3. Note Rank (e.g., Rank 3)
4. Make Command skill test for Marine A
5. Note Degrees of Success (DoS)

**Expected Calculation:**
- Cohesion Max = FS Bonus + Rank + Command DoS + GM Modifier
- Example: 4 (FS) + 3 (Rank) + 2 (Command DoS) + 0 (GM Mod) = 9
- Cohesion panel should show: 7/9 (or current/calculated max)

**GM Actions:**
6. Adjust cohesion maximum in panel to match calculation if needed

---

## Test 2: Activate Squad Mode Ability

**Objective:** Verify Squad Mode ability activation and cohesion cost

### Step 3: Activate Tactical Spacing

**Player Actions:**
1. In Cohesion Panel, find "Tactical Spacing" ability (or pre-configured ability)
2. Click "Activate" button
3. Confirm activation

**Expected Results:**
- Ability marked as "Active"
- Cohesion decreases by ability cost (e.g., 7 → 5 if cost is 2)
- Cohesion panel updates immediately
- All players see updated cohesion value
- Ability effect applies to all Marines in Squad Mode

---

## Test 3: Standard Attack vs Horde

**Objective:** Verify single-target attacks reduce magnitude

### Step 4: Marine A Shoots Ork Mob

**Player Actions:**
1. Marine A attacks Ork Mob with bolter
2. Standard Attack
3. Roll to hit, apply damage

**Expected Results:**
- Attack hits horde
- Damage rolled: 1d10+9
- Magnitude reduction calculated:
  - Damage ÷ 10 (rounded down) = magnitude lost
  - Example: 15 damage = 1 magnitude lost
  - Ork Mob: 30 → 29 magnitude
- Chat message shows:
  - Damage dealt
  - Magnitude lost
  - New magnitude value
- Token updates to show new magnitude

---

## Test 4: Blast Weapon vs Horde

**Objective:** Verify Blast weapons generate multiple hits vs hordes

### Step 5: Marine A Throws Frag Grenade at Horde

**Player Actions:**
1. Marine A throws Frag Grenade (Blast 4) at Ork Mob
2. Roll attack (BS test)
3. Apply damage

**Expected Results:**
- Blast weapon hits horde
- Hit count calculation: Blast value + explosive bonus
  - Frag Grenade (Blast 4): Base 4 hits
  - If weapon has explosive bonus trait: +1-2 hits
  - Total: ~4-5 hits
- Each hit rolls damage independently: 1d10+2 (frag damage) ×4
- Magnitude reduction: (Total damage ÷ 10) ×hit count
  - Example: 4 hits ×8 damage = 32 total / 10 = 3 magnitude lost
  - Ork Mob: 29 → 26 magnitude

---

## Test 6: Flame Weapon vs Horde

**Objective:** Verify Flame weapons apply 1.5× multiplier vs hordes

### Step 7: Marine B Uses Flamer on Horde

**Player Actions:**
1. Marine B positions within flamer range (template or 20m)
2. Attack Ork Mob with Astartes Flamer
3. Apply flame attack

**Expected Results:**
- Flame weapon auto-hits (cone weapon, Agility dodge for individuals in horde)
- Hit count: (Range ÷ 4) + 1d5
  - Example: 20m range ÷ 4 = 5 base + 1d5 = 6-10 hits
- Each hit rolls damage: 1d10+4 (flamer damage)
- **Horde multiplier:** Total damage ×1.5
  - Example: 8 hits ×8 damage = 64 ×1.5 = 96 total damage
  - Magnitude lost: 96 ÷ 10 = 9 magnitude
  - Ork Mob: 26 → 17 magnitude
- Chat shows flame multiplier applied

---

## Test 7: Horde Attacks

**Objective:** Verify horde deals multiple damage dice

### Step 8: Ork Mob Attacks Marine C

**GM Actions:**
1. On Ork Mob turn, attack Marine C (closest target)
2. Roll attack (horde uses single WS roll)
3. If hit, roll damage

**Expected Results:**
- Horde rolls single attack vs Marine C
- If hit:
  - Number of damage dice = (Magnitude ÷ 10, rounded down)
  - Example: Magnitude 17 = 1 damage die (1d10+4)
  - If magnitude ≥20: 2 damage dice (2d10+4)
  - If magnitude ≥30: 3 damage dice (3d10+4)
- Chat shows horde damage calculation
- Marine C wounds decrease

---

## Test 8: Horde Breaking

**Objective:** Verify horde breaks at low magnitude

### Step 9: Reduce Horde to Breaking Point

**Player Actions:**
1. Continue attacks until Ork Mob magnitude drops below 10

**Expected Results:**
- When magnitude drops to critical threshold (e.g., ≤10):
  - System prompts for Horde Breaking test
  - Horde rolls Willpower test (or morale test)
  - If failed: Horde breaks and flees
  - Token may be marked "Fleeing" or removed from combat
- Chat message: "Ork Mob is breaking! Magnitude critically low."

---

## Test 10: Deactivate Squad Mode Ability

**Objective:** Verify ability deactivation refunds cohesion

### Step 11: Deactivate Tactical Spacing

**Player Actions:**
1. In Cohesion Panel, find active "Tactical Spacing" ability
2. Click "Deactivate" button

**Expected Results:**
- Ability marked as "Inactive"
- Cohesion increases by refund amount (may be full cost or partial)
- Example: 5 → 7 cohesion (refund of 2)
- Cohesion panel updates
- Ability effect no longer applies to Marines

---

## Test 11: Cohesion Damage

**Objective:** Verify GM can manually adjust cohesion

### Step 12: GM Reduces Cohesion

**GM Actions:**
1. In Cohesion Panel, click "Damage Cohesion" button (or similar)
2. Enter damage amount: 3
3. Confirm

**Expected Results:**
- Cohesion decreases by damage amount: 7 → 4
- If cohesion drops below threshold (e.g., <4):
  - Chat warning: "Cohesion critically low! Squad begins to falter."
  - Mechanical effects may apply (per core rules)
- Panel shows updated value

---

## Test 12: Rally Test

**Objective:** Verify cohesion restoration via rally

### Step 13: Marine A Rallies the Squad

**Player Actions:**
1. Marine A (Squad Leader) uses "Rally" action (Half Action)
2. Roll Command skill test
3. Check DoS

**Expected Results:**
- Command test rolled
- Cohesion restored: +DoS to cohesion value
  - Example: 3 DoS = +3 cohesion (4 → 7)
- Cannot exceed cohesion maximum
- Chat message: "Squad Leader rallies! Cohesion restored by [X]."

---

## Test 14: Solo Mode Toggle

**Objective:** Verify Marines can switch between Solo and Squad Mode

### Step 15: Marine C Switches to Solo Mode

**Player Actions:**
1. Select Marine C
2. In Cohesion Panel, click "Solo Mode" toggle for Marine C

**Expected Results:**
- Marine C indicator changes from green (Squad) to red (Solo)
- Marine C no longer benefits from Squad Mode abilities
- Marine C does not contribute to or cost cohesion
- Chat message: "Marine C enters Solo Mode"

### Step 16: Marine C Returns to Squad Mode

**Player Actions:**
1. Click "Squad Mode" toggle for Marine C

**Expected Results:**
- Indicator changes back to green
- Marine C benefits from active Squad Mode abilities
- Chat message: "Marine C returns to Squad Mode"

---

## Cleanup

**GM Actions:**
1. End combat
2. Reset test world (restore horde magnitude to 30, cohesion to 7/10)

---

## Validation Checklist

After completing this scenario, verify:

- ☐ Cohesion max calculated correctly (FS Bonus + Rank + Command DoS + GM Mod)
- ☐ Squad Mode ability activation costs cohesion
- ☐ Squad Mode ability deactivation refunds cohesion
- ☐ Standard attacks reduce horde magnitude (damage ÷ 10)
- ☐ Blast weapons generate multiple hits vs hordes (Blast value + bonus)
- ☐ Flame weapons apply 1.5× damage multiplier vs hordes
- ☐ Horde attacks deal multiple damage dice (magnitude ÷ 10)
- ☐ Horde breaking triggers at low magnitude (<10)
- ☐ GM can manually adjust cohesion (damage/restore)
- ☐ Rally test restores cohesion (+Command DoS)
- ☐ Solo Mode toggle works (red indicator, no squad benefits)

---

_Squad protocols validated, Tech-Priest. The kill-team fights as one._ ⚙️
