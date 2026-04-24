# Damage System Test Plan

**Coverage:** Damage application, armor reduction, penetration, Toughness Bonus, critical damage, wounds tracking

## Prerequisites
- Test Marine with Power Armor (all locations, 8 armor)
- Test Enemy with varying armor values
- Weapons with different damage/pen values
- Active combat encounter

---

## Test Cases

### DM-01: Basic Damage Application
**Goal:** Verify damage calculation and wound reduction

1. Attack Test Enemy with Astartes Bolter (1d10+5 X, Pen 4)
2. Hit Body location (assume 4 armor)
3. Click "Apply Damage" button

**Expected:**
- Damage rolled: 1d10+5
- Armor lookup: Body = 4
- Effective armor: max(0, 4 − 4 pen) = 0
- Damage reduction: TB + effective armor
- Wounds reduced by (damage − reduction)
- Chat shows full breakdown

**Pass/Fail:** ____

---

### DM-02: Armor Penetration
**Goal:** Verify penetration reduces armor

1. **Setup:** Target has 8 armor on Body
2. Attack with weapon Pen 4
3. Apply damage

**Expected:**
- Effective armor: 8 − 4 = 4
- Damage reduction: TB + 4

**Pass/Fail:** ____

---

### DM-03: Penetration Exceeds Armor
**Goal:** Verify armor cannot go below 0

1. **Setup:** Target has 4 armor on Arm
2. Attack with Meltagun (Pen 12)
3. Apply damage

**Expected:**
- Effective armor: max(0, 4 − 12) = 0
- Damage reduction: TB + 0 = TB only

**Pass/Fail:** ____

---

### DM-04: Critical Damage (Wounds Exceeded)
**Goal:** Verify critical damage when wounds drop to 0 or below

1. **Setup:** Reduce Test Enemy to 5 current wounds
2. Deal 10+ damage in single attack
3. Observe result

**Expected:**
- Wounds reduced to 0
- Critical damage roll (1d5 or 1d10, depending on how far below 0)
- Critical effect applied (e.g., stunned, unconscious)
- Chat shows critical result

**Pass/Fail:** ____

---

### DM-05: Multiple Hits (Same Attack)
**Goal:** Verify damage applied separately for each hit location

1. Fire Semi-Auto Burst, achieve 3 hits
2. Locations: Body, Arm, Head
3. Click "Apply Damage" for each hit

**Expected:**
- Each hit rolls damage separately
- Each hit uses armor from its location
- Total wounds reduced = sum of all hits

**Pass/Fail:** ____

---

### DM-06: Righteous Fury Damage
**Goal:** Verify Righteous Fury adds extra damage + crit

1. Trigger Righteous Fury (natural 10 or less on hit)
2. Confirm fury (auto for xenos, or roll 95+)
3. Apply damage

**Expected:**
- Normal damage rolled
- Extra damage die rolled (e.g., +1d10 for bolter)
- If target wounds reach 0: Critical damage applied
- Chat shows "Righteous Fury confirmed!"

**Pass/Fail:** ____

---

### DM-07: Toughness Bonus Calculation
**Goal:** Verify TB correctly calculated from Toughness characteristic

1. **Setup:** Check Test Enemy's Toughness (e.g., T 40)
2. Apply damage
3. Verify TB used in reduction

**Expected:**
- TB = Toughness / 10 (T 40 → TB 4)
- Damage reduction includes TB

**Pass/Fail:** ____

---

### DM-08: Unnatural Toughness
**Goal:** Verify Unnatural Toughness multiplies TB

1. **Setup:** Create enemy with Unnatural Toughness (×2)
2. Toughness: 40 (TB 4), Unnatural: ×2 → Effective TB 8
3. Apply damage

**Expected:**
- Damage reduction uses TB 8 (not TB 4)
- Chat shows "Unnatural Toughness (×2)"

**Pass/Fail:** ____

---

### DM-09: Felling Quality vs Unnatural Toughness
**Goal:** Verify Felling(X) reduces Unnatural Toughness

1. **Setup:** Enemy with Unnatural Toughness ×2 (TB 8)
2. Attack with Force Sword (Felling 2)
3. Apply damage

**Expected:**
- Effective TB: 8 − 2 = 6
- Damage reduction uses TB 6
- Chat shows "Felling(2) applied"

**Pass/Fail:** ____

---

### DM-10: Primitive Weapons
**Goal:** Verify Primitive halves damage vs armor

1. **Setup:** Equip Primitive weapon (e.g., club)
2. Attack armored target
3. Apply damage

**Expected:**
- Damage rolled normally
- Against armor: Damage halved (round up)
- Chat shows "Primitive: damage halved"

**Pass/Fail:** ____

---

### DM-11: Force Damage (Psychic)
**Goal:** Verify Force quality adds Psy Rating to damage

1. **Setup:** Psyker with Force Sword, Psy Rating 4
2. Attack and hit
3. Apply damage

**Expected:**
- Base damage: 1d10+5
- Force bonus: +PR (e.g., +4)
- Final damage: 1d10+5+4
- Chat shows "Force: +4 (Psy Rating)"

**Pass/Fail:** ____

---

### DM-12: Energy Damage Type
**Goal:** Verify Energy damage is clearly marked

1. **Setup:** Use Las weapon (Energy type)
2. Apply damage

**Expected:**
- Damage type shown as "Energy" in chat
- (No mechanical difference in basic rules, but tracked)

**Pass/Fail:** ____

---

### DM-13: Impact Damage Type
**Goal:** Verify Impact damage is marked

1. **Setup:** Use bolt weapon (Impact type)
2. Apply damage

**Expected:**
- Damage type shown as "Impact" in chat

**Pass/Fail:** ____

---

### DM-14: Rending Damage Type
**Goal:** Verify Rending damage is marked

1. **Setup:** Use melee weapon with Rending type
2. Apply damage

**Expected:**
- Damage type shown as "Rending" in chat

**Pass/Fail:** ____

---

### DM-15: Healing Wounds
**Goal:** Verify manual wound adjustment

1. **Setup:** Test Marine at 15/22 wounds
2. Open character sheet
3. Increase wounds to 18 manually
4. Save

**Expected:**
- Wounds update to 18/22
- Token bar updates (if shown)
- Change persists after refresh

**Pass/Fail:** ____

---

### DM-16: Overheal Prevention
**Goal:** Verify wounds cannot exceed maximum

1. **Setup:** Test Marine at 20/22 wounds
2. Heal by 10 (e.g., via macro or manual)

**Expected:**
- Wounds cap at 22/22 (not 30/22)
- Warning shown if attempted overheal

**Pass/Fail:** ____

---

### DM-17: Damage to Horde
**Goal:** Verify horde magnitude reduction

1. **Setup:** Test Horde (magnitude 30)
2. Attack with bolter, deal 15 damage
3. Apply damage

**Expected:**
- Magnitude reduced (damage / 10, round down)
- 15 damage → −1 magnitude (30 → 29)
- If damage ≥ 10 × magnitude: Horde destroyed

**Pass/Fail:** ____

---

### DM-18: Horde Damage Multiplier
**Goal:** Verify attacks vs hordes use multiplier

1. **Setup:** Test Horde
2. Fire weapon with "vs Horde" stat (e.g., Blast, Full-Auto)
3. Apply damage

**Expected:**
- Base hits × multiplier (e.g., 3 hits × 1.5 = 4.5 → 5)
- Magnitude reduced accordingly

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- Armor not looked up by hit location
- TB not added to damage reduction
- Penetration not subtracting from armor
- Critical damage not triggered at 0 wounds
- Unnatural Toughness not multiplying correctly

**Reference:** 
- [.claude/docs/combat-system.md](../../.claude/docs/combat-system.md)
- `src/module/helpers/combat/combat.mjs` (applyDamage function)

_Damage protocols sanctified. The Machine Spirit calculates true._ ⚙️
