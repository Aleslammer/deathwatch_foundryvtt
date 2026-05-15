# Ranged Combat Scenario

**Purpose:** Validate ranged attack mechanics, range modifiers, ammunition tracking, Righteous Fury, and damage application

**Duration:** 25-30 minutes

**Prerequisites:** Test world setup complete (see TEST-WORLD-SETUP.md)

**Actors Required:**
- Marine A "Tactical" (bolter, frag grenades)
- Marine B "Heavy" (heavy bolter)
- Ork Boy (basic melee enemy)
- Tau Fire Warrior (basic ranged enemy)

**Role Assignments:**
- **GM:** Scene setup, enemy placement, damage verification
- **Player:** Execute attacks, roll dice

---

## Setup

### Step 1: Prepare Combat Scene

**GM Actions:**
1. Open "Test Combat Arena" scene
2. Place Marine A at "Marine Start N1" (if not already placed)
3. Place Marine B at "Marine Start N2"
4. Place Ork Boy at 15m distance from Marine A (5 squares)
5. Place Tau Fire Warrior at 60m distance from Marine B (20 squares)
6. Click "Begin Combat" in Combat Tracker
7. Roll initiative for all combatants

**Expected Results:**
- All 4 tokens on scene at correct positions
- Combat tracker shows initiative order
- Token bars display Wounds (primary) and Fatigue (secondary)

---

## Test 1: Standard Ranged Attack

**Objective:** Verify basic attack mechanics

### Step 2: Marine A Attacks Ork Boy

**Player Actions:**
1. Select Marine A token
2. Open character sheet → Equipment tab
3. Click "Astartes Bolter"
4. In attack dialog:
   - Attack Type: Standard Attack
   - Target: Ork Boy
   - Range: 15m (should show "Short Range" modifier)
5. Click "Roll Attack"

**Expected Results:**
- Attack dialog shows BS 45 + modifiers
- Range modifier applied (e.g., +10 for short range)
- 1d100 rolled vs modified BS
- DoS (Degrees of Success) calculated
- Hit location determined (1d100 roll)
- Chat message posts with:
  - Attack roll result
  - Whether hit or miss
  - Hit location (if hit)
  - "Roll Damage" button (if hit)

### Step 3: Roll and Apply Damage

**Player Actions:**
1. Click "Roll Damage" button in chat
2. Click "Apply Damage" button in chat

**Expected Results:**
- Damage rolled: 1d10+9 (bolter base damage + Tearing quality may reroll low dice)
- Chat shows damage breakdown:
  - Base damage
  - Tearing rerolls (if any 1-3 rolled)
  - Penetration: 4
  - Target armor (Ork Boy: 2 AP)
  - Target TB (Toughness Bonus: 4)
  - Final wounds lost: Damage - (Armor + TB - Pen)
- Ork Boy wounds decrease
- Token bar updates to reflect new wounds value

---

## Test 2: Full Auto Fire

**Objective:** Verify multiple hits from Full Auto

### Step 4: Marine B Full Auto Attack on Tau

**Player Actions:**
1. Select Marine B token
2. Click "Astartes Heavy Bolter" from character sheet
3. In attack dialog:
   - Attack Type: Full Auto
   - Target: Tau Fire Warrior
   - Range: 60m
   - Intentionally aim for high DoS (e.g., if BS 43, rolling 23 = 2 DoS)
4. Roll attack

**GM Note:** If roll doesn't achieve 2+ DoS naturally, allow re-roll or adjust for test purposes

**Expected Results:**
- Attack hits
- Number of hits calculated: 1 + (DoS ÷ 2) = at least 2 hits
- Multiple hit locations determined
- Chat message shows:
  - Primary hit location
  - Additional hit locations (if 2+ DoS)
  - "Roll Damage" button for each hit

### Step 5: Apply Multiple Hit Damage

**Player Actions:**
1. Click "Roll Damage" for first hit
2. Click "Apply Damage"
3. Repeat for each additional hit

**Expected Results:**
- Each hit rolls damage independently
- Each hit applies damage to same target
- Tau Fire Warrior wounds decrease multiple times
- Heavy Bolter ammunition count decreases by number of rounds fired (full auto = 10 rounds)

---

## Test 3: Ammunition Tracking

**Objective:** Verify ammo consumption and reload mechanics

### Step 6: Fire Until Low on Ammo

**Player Actions:**
1. Continue making attacks with Marine B's Heavy Bolter
2. Note current ammunition count in character sheet (Equipment tab)
3. Make 2-3 more Full Auto attacks
4. Check ammunition count after each attack

**Expected Results:**
- Each Full Auto attack consumes 10 rounds
- Each Standard Attack consumes 1 round
- Ammunition count in character sheet decreases correctly
- When magazine reaches 0, weapon requires reload

### Step 7: Reload Weapon

**Player Actions:**
1. Open Marine B character sheet → Equipment tab
2. Click "Reload" button on Heavy Bolter
3. Confirm reload action

**Expected Results:**
- Reload action consumes 1 reload clip from inventory
- Magazine refilled to max capacity
- Chat message confirms reload action
- Action economy: Reload is a Half Action (if in combat)

---

## Test 4: Aimed Shot

**Objective:** Verify Aim action and accuracy bonus

### Step 8: Marine A Aims and Fires

**Player Actions:**
1. Select Marine A
2. On Marine A's turn, declare "Aim" action (Half Action)
3. Next round, attack Ork Boy with "Aimed Shot"
4. In attack dialog:
   - Attack Type: Aimed Shot
   - Target: Ork Boy
5. Roll attack

**Expected Results:**
- Aim action recorded (GM tracks, or use token status marker)
- Aimed Shot attack receives +10 bonus to BS
- Attack dialog shows: BS 45 + 10 (Aim) + range modifier
- Hit more likely due to bonus
- If hit with 2+ DoS, Accurate quality may apply (if weapon has it)

---

## Test 5: Range Modifiers

**Objective:** Verify different range bands apply correct modifiers

### Step 9: Attack at Different Ranges

**GM Actions:**
1. Move Ork Boy to 3m from Marine A (1 square = Point Blank)
2. Have Marine A attack

**Expected Results:**
- Point Blank range: +30 to BS
- Attack very likely to hit

**GM Actions:**
3. Move Ork Boy to 150m from Marine A (50 squares = Long Range for bolter)
4. Have Marine A attack

**Expected Results:**
- Long Range: -10 to BS (or appropriate penalty)
- Attack harder to hit

**GM Actions:**
5. Move Ork Boy to 300m (100 squares = Extreme Range)

**Expected Results:**
- Extreme Range: -30 to BS
- Attack very difficult

---

## Test 6: Righteous Fury

**Objective:** Verify Righteous Fury trigger and confirmation

### Step 10: Trigger Righteous Fury

**GM Note:** For testing, either roll naturally until RF triggers (10 or below), or manually set up a scenario where RF is guaranteed

**Player Actions:**
1. Marine A attacks Ork Boy (xenos target)
2. Roll attack: Result is 10 or below (Righteous Fury threshold)

**Expected Results:**
- Chat message indicates Righteous Fury triggered
- Because Ork Boy is xenos and Marine has Deathwatch Training:
  - **Auto-confirms** (no confirmation roll needed)
  - Immediate critical hit confirmed
- Prompt to roll damage normally
- Prompt to roll on Critical Effects table (d100)

### Step 11: Resolve Righteous Fury

**Player Actions:**
1. Roll damage as normal
2. Apply damage
3. Roll d100 for Critical Effect
4. Apply critical effect from table lookup

**Expected Results:**
- Normal damage applied
- Critical effect adds additional narrative/mechanical effect
- Ork Boy may take additional wounds, status effects, or instant death (depending on roll)

---

## Test 7: Blast Weapons (Grenades)

**Objective:** Verify blast area damage

### Step 12: Throw Frag Grenade

**GM Actions:**
1. Place 3 Ork Boys in a cluster (within 4m of each other)

**Player Actions:**
1. Select Marine A
2. Click "Frag Grenade" from equipment
3. Target center of Ork Boy cluster
4. Roll attack (grenades use BS)

**Expected Results:**
- Attack roll determines if grenade lands on target or scatters
- If hit: Blast affects all targets within 4m radius (Blast 4)
- Blast hit calculation: 1d5 hits per target in blast
- Each affected Ork Boy takes damage
- Chat shows damage for each target

---

## Test 8: Special Ammunition

**Objective:** Verify different ammo types apply correctly

### Step 13: Load Special Ammo

**Player Actions:**
1. Open Marine A character sheet
2. Navigate to Equipment → Astartes Bolter
3. Change loaded ammo to "Hellfire Rounds" (if available in test world)
4. Make attack against Ork Boy

**Expected Results:**
- Ammo type shows in attack dialog
- Special ammo properties apply (e.g., Hellfire: +2d10 vs Tyranids, ignores armor)
- Damage calculation uses special ammo stats
- If no special properties apply to current target, shows standard damage

---

## Cleanup

**GM Actions:**
1. End combat
2. Reset test world using TEST-WORLD-SETUP.md reset instructions

---

## Validation Checklist

After completing this scenario, verify:

- ☐ Standard attacks work (roll, hit location, damage)
- ☐ Full Auto generates multiple hits (DoS ÷ 2)
- ☐ Ammunition tracking decreases correctly
- ☐ Reload action consumes reload items
- ☐ Aimed Shot applies +10 bonus
- ☐ Range modifiers apply correctly (Point Blank, Short, Long, Extreme)
- ☐ Righteous Fury triggers and auto-confirms vs xenos
- ☐ Blast weapons affect multiple targets
- ☐ Special ammunition applies correct properties

---

_Ranged combat protocols validated, Tech-Priest. The Machine Spirit's aim is true._ ⚙️
