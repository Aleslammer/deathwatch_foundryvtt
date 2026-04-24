# Fire Mechanics Test Plan

**Coverage:** Flame weapons, cone targeting, catch-fire tests, On Fire status, fire damage, extinguish tests

## Prerequisites
- Test Marine with Heavy Flamer equipped
- Test Enemy tokens on scene (multiple for cone tests)
- Active combat encounter

---

## Test Cases

### FM-01: Flame Weapon Attack (Single Target)
**Goal:** Verify flame weapon mechanics against single target

1. Equip Heavy Flamer (Flame quality)
2. Attack Test Enemy within range (20m)
3. Target must make Agility dodge test

**Expected:**
- **No BS roll** (flame auto-hits within cone)
- Chat prompts target to make Agility test
- If dodge fails: Apply damage + catch-fire test
- If dodge succeeds: No damage, no fire

**Pass/Fail:** ____

---

### FM-02: Catch Fire Test
**Goal:** Verify Agility test to avoid catching fire

1. Flame weapon hits target
2. Target makes catch-fire test (Agility, unmodified)

**Expected:**
- Roll 1d100 vs Agility
- If fail: Target gains "On Fire" status
- If succeed: Target takes damage but doesn't catch fire
- Chat shows catch-fire test result

**Pass/Fail:** ____

---

### FM-03: On Fire Status Applied
**Goal:** Verify On Fire status effect is applied to token

1. Target fails catch-fire test

**Expected:**
- Token gains "On Fire" status effect (visible icon)
- Status persists across rounds
- Status visible in combat tracker

**Pass/Fail:** ____

---

### FM-04: On Fire Effects (Start of Turn)
**Goal:** Verify fire effects applied each round

1. **Setup:** Target with On Fire status
2. On target's turn, apply fire effects

**Expected:**
- **1d10 Energy damage** (ignores armor)
- **+1 Fatigue**
- **WP test** to act normally:
  - If fail: Can only Half Action this turn
  - If succeed: Acts normally
- Chat shows all effects applied

**Pass/Fail:** ____

---

### FM-05: Power Armor Auto-Pass (WP Test)
**Goal:** Verify Power Armor wearers auto-pass WP test while On Fire

1. **Setup:** Test Marine (in Power Armor) catches fire
2. On Marine's turn, apply On Fire effects

**Expected:**
- 1d10 Energy damage applied
- +1 Fatigue applied
- **WP test auto-passed** (Power Armor)
- Chat shows "Power Armor: auto-pass WP test"

**Pass/Fail:** ____

---

### FM-06: Extinguish Test
**Goal:** Verify Agility test to extinguish flames

1. **Setup:** Target with On Fire status
2. Target attempts to extinguish (Free Action)
3. Roll Agility test (−20, Hard)

**Expected:**
- Roll 1d100 vs (Agility − 20)
- If succeed: On Fire status removed
- If fail: Status persists, try again next turn
- Chat shows test result

**Pass/Fail:** ____

---

### FM-07: Flame Weapon (Cone, Multiple Targets)
**Goal:** Verify cone targeting affects multiple targets

1. Place 3 Test Enemies in cone formation (within 20m, ~90° arc)
2. Attack with Heavy Flamer
3. Select all targets in cone

**Expected:**
- **All targets within cone affected** (no BS roll)
- Each target makes separate Agility dodge test
- Each target makes separate catch-fire test (if hit)
- Chat shows all targets' results

**Pass/Fail:** ____

---

### FM-08: Flame Weapon vs Horde
**Goal:** Verify flame weapons calculate horde damage correctly

1. **Setup:** Test Horde (magnitude 30)
2. Attack with Heavy Flamer

**Expected:**
- Hits = ceil(range / 4) + 1d5 (e.g., range 20m → 5 + 1d5)
- **Horde multiplier: ×1.5**
- Total hits × 1.5 applied to magnitude
- Chat shows calculation

**Pass/Fail:** ____

---

### FM-09: Flame Weapon (Close Range)
**Goal:** Verify flame weapons at close range

1. Position Test Marine adjacent to enemy (3m)
2. Attack with Hand Flamer or Heavy Flamer

**Expected:**
- Still uses cone/auto-hit (no BS roll)
- Damage and fire mechanics same as normal
- No Point-Blank bonus (flames don't benefit from range)

**Pass/Fail:** ____

---

### FM-10: Flame Weapon Ammo
**Goal:** Verify flame weapons consume ammo per shot

1. Check Heavy Flamer ammo (e.g., 10 shots)
2. Fire weapon
3. Check ammo after

**Expected:**
- Ammo: −1 per shot
- Reload resets to max
- Warning if ammo low

**Pass/Fail:** ____

---

### FM-11: Fire Damage Ignores Armor
**Goal:** Verify On Fire damage bypasses armor entirely

1. **Setup:** Target with 10 armor, On Fire status
2. Apply On Fire effects (1d10 Energy damage)

**Expected:**
- Damage: 1d10 (no reduction from armor)
- Toughness Bonus **still applies**
- Chat shows "Fire damage (ignores armor)"

**Pass/Fail:** ____

---

### FM-12: Multiple Rounds On Fire
**Goal:** Verify On Fire status persists across multiple rounds

1. **Setup:** Target catches fire (round 1)
2. Target fails extinguish test
3. Proceed to round 2, round 3

**Expected:**
- Each round: 1d10 damage, +1 Fatigue, WP test
- Status persists until extinguished
- Fatigue accumulates (e.g., round 3 → +3 Fatigue total)

**Pass/Fail:** ____

---

### FM-13: Flame Weapon (No Aim Bonus)
**Goal:** Verify flame weapons do not benefit from Aim action

1. Take Aim action (Full Action)
2. Next turn, attack with Heavy Flamer

**Expected:**
- Aim bonus **does not apply** (flames auto-hit, no BS roll)
- Chat shows no Aim modifier

**Pass/Fail:** ____

---

### FM-14: Flame Weapon (Range Limits)
**Goal:** Verify flame weapons respect max range

1. Position target beyond weapon range (e.g., 25m from 20m flamer)
2. Attempt to attack

**Expected:**
- Attack fails or warning shown
- Must be within weapon range to target

**Pass/Fail:** ____

---

### FM-15: Fire Macro (Flame Attack)
**Goal:** Verify "🔥 Flame Attack" macro from compendium

1. **Setup:** Open Macros compendium (Compendium Packs > Deathwatch: Macros)
2. Drag "🔥 Flame Attack" to hotbar
3. Target enemy token
4. Run macro, enter damage/pen values

**Expected:**
- Macro prompts for damage, penetration
- Applies flame mechanics (dodge, catch-fire)
- Chat shows full results

**Pass/Fail:** ____

---

### FM-16: Fire Macro (On Fire Round)
**Goal:** Verify "🔥 On Fire Round" macro from compendium

1. **Setup:** Target has On Fire status
2. Drag "🔥 On Fire Round" to hotbar
3. Target token
4. Run macro

**Expected:**
- Macro applies 1d10 Energy damage (ignores armor)
- Adds +1 Fatigue
- Prompts for WP test (or auto-passes if Power Armor)
- Chat shows all effects

**Pass/Fail:** ____

---

### FM-17: Extinguish (Drop and Roll)
**Goal:** Verify ally can assist with extinguish test

1. **Setup:** Test Marine On Fire, ally adjacent
2. Ally uses Full Action to help extinguish
3. Test Marine rolls Agility (−20)

**Expected:**
- Ally's help gives +10 to test (GM discretion)
- Test Marine rolls Agility − 20 + 10 = −10
- If succeed: Fire extinguished

**Pass/Fail:** ____

---

### FM-18: Promethium Tanks (Flame Fuel)
**Goal:** Verify promethium ammo type for flame weapons

1. **Setup:** Heavy Flamer with Promethium ammo item
2. Check ammo tracking

**Expected:**
- Ammo type: Promethium (not bolts/cells)
- Reload uses promethium tank item
- May have special effects (e.g., +damage, longer burn)

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- Flame weapons incorrectly requiring BS roll
- On Fire damage affected by armor
- WP test not triggered on target's turn
- Extinguish test using wrong difficulty (should be −20)
- Power Armor not auto-passing WP test

**Reference:** 
- [.claude/docs/combat-system.md](../../.claude/docs/combat-system.md) (Fire System section)
- `src/module/helpers/combat/flame-attack.mjs`
- `src/module/helpers/combat/on-fire-effects.mjs`

_Fire protocols sanctified. Cleanse the heretics with holy flame._ 🔥⚙️
