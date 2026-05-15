# Melee Combat Scenario

**Purpose:** Validate melee attack mechanics, charge actions, reactions (parry/dodge), and special melee attacks

**Duration:** 20-25 minutes

**Prerequisites:** Test world setup complete

**Actors Required:**
- Marine C "Assault" (chainsword, bolt pistol)
- Ork Boy (choppa, melee enemy)
- Tyranid Warrior (bonesword, tough melee enemy)

**Role Assignments:**
- **GM:** Scene setup, enemy reactions, damage verification
- **Player:** Execute melee attacks, declare reactions

---

## Setup

### Step 1: Prepare Melee Combat

**GM Actions:**
1. Open "Test Combat Arena" scene
2. Place Marine C at "Marine Start S1"
3. Place Ork Boy adjacent to Marine C (1 square away)
4. Place Tyranid Warrior 10m away (for charge test)
5. Begin combat, roll initiative

**Expected Results:**
- Tokens positioned for melee engagement
- Combat tracker active with initiative order

---

## Test 1: Standard Melee Attack

**Objective:** Verify basic melee mechanics

### Step 2: Marine C Attacks Ork Boy

**Player Actions:**
1. Select Marine C token
2. Click "Astartes Chainsword" from character sheet
3. In attack dialog:
   - Attack Type: Standard Attack
   - Target: Ork Boy (adjacent)
4. Roll attack (1d100 vs WS)

**Expected Results:**
- Attack rolls 1d100 vs WS 45
- DoS calculated
- Hit location determined
- Chat message shows attack result
- "Roll Damage" button appears if hit

### Step 3: Apply Melee Damage

**Player Actions:**
1. Click "Roll Damage"
2. Click "Apply Damage"

**Expected Results:**
- Damage rolled: 1d10 + SB + Chainsword bonus (Tearing quality applies)
- No penetration calculation (melee attacks don't have pen typically)
- Armor reduces damage: Ork leather (2 AP) + TB (4) = 6 reduction
- Final damage applied to Ork Boy wounds
- Token bar updates

---

## Test 2: Charge Action

**Objective:** Verify charge movement and damage bonus

### Step 4: Marine C Charges Tyranid Warrior

**GM Actions:**
1. Move Marine C back to 10m from Tyranid Warrior

**Player Actions:**
1. On Marine C's turn, declare "Charge" action
2. Move Marine C to adjacent square to Tyranid Warrior
3. Make melee attack immediately after charge

**Expected Results:**
- Charge movement: Can move up to Full Move distance (12m for AG 42)
- Must end adjacent to target
- Charge attack receives +10 to WS
- Attack dialog shows: WS 45 + 10 (Charge)
- If hit, damage receives bonus from momentum

---

## Test 3: Parry Reaction

**Objective:** Verify parry mechanics (opposed WS test)

### Step 5: Ork Boy Attacks, Marine C Parries

**GM Actions:**
1. On Ork Boy's turn, attack Marine C with choppa

**Player Actions:**
1. When prompted (or declared before attack), choose "Parry" reaction
2. Roll opposed WS test (Marine C WS vs Ork WS)

**Expected Results:**
- Marine C rolls WS test (1d100 vs WS 45)
- Ork Boy rolls WS test (1d100 vs WS 35)
- Compare DoS:
  - If Marine C has more DoS: Attack parried, no damage
  - If Ork Boy has more DoS: Attack succeeds, roll damage
  - If tied: Attack succeeds but at reduced effect
- Chat message shows parry result and opposed test breakdown

---

## Test 4: Dodge Reaction

**Objective:** Verify dodge mechanics (Agility test)

### Step 6: Tyranid Warrior Attacks, Marine C Dodges

**GM Actions:**
1. On Tyranid Warrior's turn, attack Marine C with bonesword

**Player Actions:**
1. Declare "Dodge" reaction
2. Roll Agility test (1d100 vs AG)

**Expected Results:**
- Marine C rolls AG test (1d100 vs 42)
- DoS from AG test subtracts from attacker's DoS
- If dodge DoS ≥ attacker DoS: Attack misses
- If partial success: Attack hits but reduced effect
- Chat message shows dodge result

**GM Note:** Dodge is typically harder than parry but works against ranged attacks too

---

## Test 5: Lightning Attack

**Objective:** Verify multiple melee attacks in one action

### Step 7: Marine C Uses Lightning Attack

**Player Actions:**
1. On Marine C's turn, declare "Lightning Attack" (requires talent)
2. Make first attack against Ork Boy
3. For each DoS, make additional attack (up to WS Bonus additional attacks)

**Expected Results:**
- First attack rolls normally
- If 3 DoS achieved on WS 45 (Bonus 4): Can make up to 3 additional attacks
- Each additional attack rolls separately
- Each hit location determined independently
- Each hit rolls and applies damage separately
- All attacks are part of same Full Action

---

## Test 6: All-Out Attack

**Objective:** Verify damage bonus with no reactions allowed

### Step 8: Marine C All-Out Attack

**Player Actions:**
1. Declare "All-Out Attack" on Ork Boy
2. Roll melee attack

**Expected Results:**
- Attack receives +20 to WS
- Attack dialog shows: WS 45 + 20 (All-Out)
- If hit, damage receives +DoS bonus
- **Restriction:** Marine C cannot make reactions (parry/dodge) until next turn
- Chat message warns "No reactions available until next turn"

### Step 9: Test No Reactions During All-Out

**GM Actions:**
1. Have Tyranid Warrior attack Marine C

**Player Actions:**
1. Attempt to parry or dodge

**Expected Results:**
- Reaction options are grayed out or show "Cannot react (All-Out Attack used)"
- Attack proceeds without Marine C's reaction
- Damage applies directly if hit

---

## Test 7: Power Weapon Special Rules

**Objective:** Verify power weapon ignores armor

**Setup:**
If test world includes a power weapon (e.g., Power Sword), swap Marine C's chainsword for it. Otherwise, skip this test.

### Step 10: Attack with Power Weapon

**Player Actions:**
1. Equip Power Sword
2. Attack Tyranid Warrior (6 AP carapace)
3. Apply damage

**Expected Results:**
- Damage calculation ignores armor AP
- Only TB (Toughness Bonus) reduces damage
- Chat breakdown shows: Damage - TB = Wounds Lost (no armor reduction)

---

## Test 8: Melee vs. Ranged (Defensive Stance)

**Objective:** Verify melee in ranged engagement

### Step 11: Ork Boy Attacks Marine C in Melee While Marine Has Ranged Weapon

**GM Actions:**
1. Have Marine C hold bolt pistol (ranged weapon)
2. Ork Boy attacks Marine C in melee

**Expected Results:**
- Marine C at disadvantage in melee with ranged weapon
- Cannot parry with ranged weapon (or significant penalty)
- Dodge is only defensive option
- Chat message may warn "Ranged weapon in melee combat"

---

## Cleanup

**GM Actions:**
1. End combat
2. Reset test world using reset instructions

---

## Validation Checklist

After completing this scenario, verify:

- ☐ Standard melee attacks work (WS roll, damage with SB)
- ☐ Charge action grants movement + attack bonus
- ☐ Parry reaction (opposed WS test) blocks attacks
- ☐ Dodge reaction (AG test) reduces attacker DoS
- ☐ Lightning Attack generates multiple attacks from DoS
- ☐ All-Out Attack gives bonus but prevents reactions
- ☐ Power weapons ignore armor AP
- ☐ Melee with ranged weapon equipped has disadvantages

---

_Melee combat protocols validated, Tech-Priest. The Machine Spirit's blade is sharp._ ⚙️
