# Melee Combat Test Plan

**Coverage:** Melee attacks, parry/dodge reactions, Lightning Attack, melee weapon qualities, unarmed attacks

## Prerequisites
- Test Marine with Astartes Chainsword equipped
- Test Enemy token on combat scene (adjacent)
- Combat encounter active

---

## Test Cases

### MC-01: Basic Melee Attack
**Goal:** Verify basic melee attack roll

1. Click Astartes Chainsword on Test Marine sheet
2. Click "Attack" in dialog
3. Accept default modifiers
4. Click "Roll"

**Expected:**
- Chat message shows 1d100 vs WS
- Hit/Miss result
- If hit: DoS shown
- If hit: Hit location shown
- "Apply Damage" button present

**Pass/Fail:** ____

---

### MC-02: Melee Attack Modifiers
**Goal:** Verify modifier application

1. Attack with Chainsword
2. Set modifiers:
   - Superior Position: +10
   - Outnumbered: −10
3. Click "Roll"

**Expected:**
- Modified target: WS + 10 − 10 = WS
- DoS calculated correctly

**Pass/Fail:** ____

---

### MC-03: Lightning Attack (Multiple Hits)
**Goal:** Verify Lightning Attack talent (WS / 10 attacks)

1. **Setup:** Ensure Test Marine has Lightning Attack talent
2. Select Lightning Attack mode in attack dialog
3. Roll attack

**Expected:**
- Number of hits = WS / 10 (e.g., WS 40 = 4 attacks)
- Each hit has separate location
- All hits use same attack roll DoS

**Pass/Fail:** ____

---

### MC-04: All-Out Attack
**Goal:** Verify All-Out Attack (+20 to hit, −20 to dodge/parry)

1. Declare All-Out Attack (toggle in dialog)
2. Make attack

**Expected:**
- +20 bonus to WS shown
- Note for GM: Character takes −20 to reactions this round

**Pass/Fail:** ____

---

### MC-05: Called Shot (Melee)
**Goal:** Verify called shot to specific location

1. Attack with Chainsword
2. Set Called Shot to "Body"
3. Roll

**Expected:**
- −20 penalty applied
- If hit: Location forced to "Body"

**Pass/Fail:** ____

---

### MC-06: Parry Reaction
**Goal:** Verify parry against melee attack

1. **Setup:** Test Enemy attacks Test Marine (reverse roles)
2. When attack hits, click "Parry" button in chat (if available)
3. Roll WS test

**Expected:**
- Parry test rolled (1d100 vs WS)
- If parry succeeds: Attack negated
- If parry fails: Attack proceeds normally

**Pass/Fail:** ____

---

### MC-07: Dodge Reaction
**Goal:** Verify dodge against melee attack

1. Test Enemy attacks Test Marine
2. Click "Dodge" button in chat
3. Roll Agility test

**Expected:**
- Dodge test rolled (1d100 vs Agility)
- If dodge succeeds: Attack negated
- If dodge fails: Attack proceeds

**Pass/Fail:** ____

---

### MC-08: Unarmed Attack
**Goal:** Verify unarmed combat (1d5−3 + SB damage)

1. **Setup:** Remove all weapons from Test Marine
2. Perform melee attack (should default to unarmed)

**Expected:**
- Attack uses WS
- Damage: 1d5−3 + Strength Bonus
- Type: Impact
- Penetration: 0

**Pass/Fail:** ____

---

### MC-09: Weapon Quality - Balanced
**Goal:** Verify Balanced (+10 to parry)

1. **Setup:** Equip weapon with Balanced quality
2. When attacked, attempt parry

**Expected:**
- +10 bonus to parry test shown

**Pass/Fail:** ____

---

### MC-10: Weapon Quality - Power Field
**Goal:** Verify Power Field (ignores armor, +1d10 damage)

1. **Setup:** Equip Power Sword or Power Fist
2. Attack enemy with armor
3. Apply damage

**Expected:**
- Damage: Base + 1d10
- Penetration: Ignores all armor
- Chat shows "Power Field: +1d10 damage"

**Pass/Fail:** ____

---

### MC-11: Weapon Quality - Unwieldy
**Goal:** Verify Unwieldy (−10 to hit, Full Action)

1. **Setup:** Equip Thunder Hammer (Unwieldy)
2. Attack

**Expected:**
- −10 penalty to WS shown
- Attack consumes Full Action (not Half)

**Pass/Fail:** ____

---

### MC-12: Weapon Quality - Proven(X)
**Goal:** Verify Proven(3) — minimum damage result of 3

1. **Setup:** Equip weapon with Proven(3)
2. Attack and roll damage
3. If any die shows <3, verify it's raised to 3

**Expected:**
- Any damage die <3 becomes 3
- Chat shows "Proven(3): [1] → [3]"

**Pass/Fail:** ____

---

### MC-13: Weapon Quality - Felling(X)
**Goal:** Verify Felling reduces target's Unnatural Toughness

1. **Setup:** Equip weapon with Felling(2) (e.g., Force Sword)
2. Attack enemy with Unnatural Toughness (e.g., Daemon)
3. Apply damage

**Expected:**
- Target's Toughness Bonus reduced by 2 for this attack
- More damage bypasses armor than normal

**Pass/Fail:** ____

---

### MC-14: Righteous Fury (Melee)
**Goal:** Verify Righteous Fury on natural 10 or less

1. **Manual Setup:** Adjust Test Marine WS to ensure 10 or less succeeds
2. Attack until natural 1-10 rolled

**Expected:**
- "Righteous Fury!" message
- If vs xenos: Auto-confirms
- If confirmed: Roll damage + crit

**Pass/Fail:** ____

---

### MC-15: Swift Attack (Extra Attack)
**Goal:** Verify Swift Attack talent (+1 attack on success)

1. **Setup:** Ensure Test Marine has Swift Attack talent
2. Attack and succeed
3. If DoS ≥ 3: Gain second attack

**Expected:**
- If 3+ DoS: Second melee attack roll allowed (same target)
- Both attacks use same modifiers

**Pass/Fail:** ____

---

### MC-16: Charge Attack
**Goal:** Verify charge bonus (+10 WS, +1 damage)

1. **Setup:** Position Test Marine >4m away from target
2. Declare Charge action
3. Move and attack

**Expected:**
- +10 to WS
- +1 to damage
- Must move at least 4m in straight line

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- Parry/Dodge buttons not appearing in chat
- Lightning Attack not multiplying hits correctly
- Weapon qualities not applying to damage
- Unarmed damage incorrect (missing SB)

**Reference:** [.claude/docs/combat-system.md](../../.claude/docs/combat-system.md)

_Blessed melee protocols verified. The Emperor protects._ ⚙️
