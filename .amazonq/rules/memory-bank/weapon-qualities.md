# Weapon Qualities System

## Overview
The weapon qualities system implements special weapon properties from the Deathwatch Core Rulebook. Qualities modify weapon behavior during attacks and damage application.

## Architecture

### Core Components
- **WeaponQualityHelper** (`weapon-quality-helper.mjs`): Lookup and detection of weapon qualities
- **CombatDialogHelper** (`combat-dialog.mjs`): Quality effects in combat calculations
- **Weapon Data Schema** (`template.json`): `attachedQualities` array on weapons
- **Compendium Pack**: `weapon-qualities` pack with quality definitions

### Data Structure

#### Weapon Schema (Current)
```json
{
  "weapon": {
    "attachedQualities": ["accurate", "tearing", "stalker-pattern"]
  }
}
```

#### Quality Schema
```json
{
  "_id": "stalker-pattern",
  "name": "Stalker Pattern",
  "type": "weapon-quality",
  "system": {
    "key": "stalker-pattern",
    "value": "",
    "description": "...",
    "book": "Deathwatch Core Rulebook",
    "page": "160"
  }
}
```

## Weapon Qualities System

### Quality ID Structure
**IMPORTANT:** Weapon qualities use their `key` as the `_id` field for simplicity and synchronous access.

**Example:**
```json
{
  "_id": "stalker-pattern",
  "name": "Stalker Pattern",
  "type": "weapon-quality",
  "system": {
    "key": "stalker-pattern",
    "description": "..."
  }
}
```

**Benefits:**
- No async lookups needed
- Simple synchronous checks: `weapon.system.attachedQualities?.includes('stalker-pattern')`
- Human-readable data
- Portable across systems

### Weapon Schema
Weapons store quality keys directly in `attachedQualities` array:
```json
{
  "weapon": {
    "attachedQualities": ["accurate", "tearing", "stalker-pattern"]
  }
}
```

## Implemented Qualities

### 1. Accurate (p. 142)
Provides bonuses to precision weapons when aiming.

**Attack Bonus:**
- +10 to BS when using any Aim action (Half or Full)
- Applied in addition to normal aim bonus
- Only when `isAccurate: true`

**Damage Bonus:**
- Single shot + Aim + Accurate = +1d10 per 2 degrees of success
- Maximum +2d10 (capped at 4+ degrees)
- Only applies to first hit
- Does not apply to melee or multi-shot

**Implementation:**
```javascript
// Attack
const accurateBonus = (isAccurate && aim > 0) ? 10 : 0;

// Damage
if (hitIndex === 0 && !isMelee && isAccurate && isAiming && isSingleShot && degreesOfSuccess >= 2) {
  const extraDice = Math.min(Math.floor(degreesOfSuccess / 2), 2);
  formula += ` + ${extraDice}d10`;
}
```

### 2. Defensive (p. 143)
Provides defensive bonuses in melee combat.

**Effect:**
- Opponents suffer -10 to WS when attacking wielder in melee
- Applied in melee-combat.mjs

**Implementation:**
```javascript
// Applied as penalty to attacker's WS
const defensiveModifier = targetHasDefensiveWeapon ? -10 : 0;
```

### 3. Primitive (p. 145)
Represents crude or low-tech weapons.

**Effect:**
- Doubles armor value before penetration is applied
- Formula: `effectiveArmor = (armor * 2) - penetration`
- Significantly reduces damage against armored targets

**Implementation:**
```javascript
const effectiveArmor = isPrimitive 
  ? Math.max(0, (baseArmor * 2) - effectivePenetration) 
  : Math.max(0, baseArmor - effectivePenetration);
```

### 4. Proven (X) (p. 145)
Ensures minimum damage roll.

**Effect:**
- Damage dice cannot roll below X
- Example: Proven (4) means 1d10 rolls minimum 4
- Applied to all damage dice

**Implementation:**
```javascript
if (provenRating > 0) {
  formula = formula.replace(/(\\d+)(d\\d+)/g, (match, count, die) => {
    return `${count}${die}min${provenRating}`;
  });
}
```

### 5. Tearing (p. 146)
Weapon tears through flesh.

**Effect:**
- Roll one extra die for damage
- Drop the lowest die
- Example: 1d10 becomes 2d10dl1

**Implementation:**
```javascript
if (isTearing) {
  formula = formula.replace(/(\\d+)(d\\d+)/g, (match, count, die) => {
    const diceCount = parseInt(count);
    return `${diceCount + 1}${die}dl1`;
  });
}
```

### 6. Razor Sharp (p. 145)
Exceptionally sharp blades.

**Effect:**
- Doubles penetration with 2+ degrees of success
- Applied during damage calculation

**Implementation:**
```javascript
const effectivePenetration = (isRazorSharp && degreesOfSuccess >= 2) 
  ? penetration * 2 
  : penetration;
```

### 7. Twin-Linked (p. 146)
Two weapons firing as one.

**Attack Bonus:**
- +20 to BS
- Applied to attack roll

**Hit Bonus:**
- +1 hit with 2+ degrees of success
- Applied before rate of fire hits

**Implementation:**
```javascript
// Attack
const twinLinkedBonus = isTwinLinked ? 20 : 0;

// Hits
if (isTwinLinked && degreesOfSuccess >= 2) {
  calculatedHits += 1;
}
```

### 8. Gyro-Stabilised (p. 144)
Stabilized heavy weapons.

**Effect:**
- Range penalties cannot exceed -10
- Caps range modifier at -10

**Implementation:**
```javascript
const gyroRangeMod = isGyroStabilised 
  ? Math.max(rangeMod, -10) 
  : rangeMod;
```

### 9. Scatter (p. 145)
Area effect weapons.

**Effect:**
- +1 hit per 2 degrees at Point Blank range
- Doubles armor at Long/Extreme range

**Implementation:**
```javascript
// Hits
if (isScatter && isPointBlank) {
  calculatedHits += Math.floor(degreesOfSuccess / 2);
}

// Armor
if (isScatter && isLongOrExtremeRange) {
  baseArmor = armorValue * 2;
}
```

### 10. Storm (p. 146)
Rapid-fire weapons.

**Effect:**
- Doubles total hits
- Applied after all other hit calculations

**Implementation:**
```javascript
if (isStorm) {
  calculatedHits *= 2;
}
```

### 11. Shocking (p. 145)
Electrical weapons that stun.

**Effect:**
- Target must pass Toughness test or be stunned
- Stun duration: wounds taken / 2 rounds
- Button in damage message triggers test

**Implementation:**
```javascript
if (isShocking && woundsTaken > 0) {
  const stunRounds = Math.floor(woundsTaken / 2);
  message += `<button class="shocking-test-btn" data-stun-rounds="${stunRounds}">Shocking: Roll Toughness Test</button>`;
}
```

### 12. Toxic (p. 146)
Poisonous weapons.

**Effect:**
- Target must pass Toughness test or suffer additional effects
- Test penalty: wounds taken * 5
- Button in damage message triggers test

**Implementation:**
```javascript
if (isToxic && woundsTaken > 0) {
  const penalty = woundsTaken * 5;
  message += `<button class="toxic-test-btn" data-penalty="${penalty}">Toxic: Roll Toughness Test (-${penalty})</button>`;
}
```

### 13. Felling (X) (p. 143)
Reduces Unnatural Toughness.

**Effect:**
- Reduces Unnatural Toughness multiplier by X
- Minimum multiplier of 1

**Implementation:**
```javascript
const effectiveMultiplier = Math.max(1, unnaturalToughnessMultiplier - felling);
const effectiveTB = toughnessBonus * effectiveMultiplier;
```

### 14. Power Field (Melee)
Power weapons that can be activated.

**Effect:**
- Doubles Strength Bonus when active
- Toggled via weapon sheet

**Implementation:**
```javascript
if (isMelee && strBonus !== 0) {
  const effectiveStrBonus = isPowerField ? strBonus * 2 : strBonus;
  formula += ` + ${effectiveStrBonus}`;
}
```

### 15. Melta (p. 144)
Astartes melta weapons with enhanced close-range penetration.

**Effect:**
- Doubles penetration at Short Range or closer (< 50% weapon range)
- Point Blank (≤ 2m) also qualifies
- Does not stack with Razor Sharp (Razor Sharp takes precedence)

**Implementation:**
```javascript
let effectivePenetration = penetration;
if (isRazorSharp && degreesOfSuccess >= 2) {
  effectivePenetration = penetration * 2;
} else if (isMeltaRange) {
  effectivePenetration = penetration * 2;
}
```

**Range Detection:**
- Distance stored during attack in `CombatHelper.lastAttackDistance`
- Melta range check: `distance < (weaponRange * 0.5)`
- Flag passed through damage application

### 16. Lightning Claws (p. 153)
Paired melee weapons with bonus damage.

**Single Claw:**
- +1 damage per degree of success
- Applied to all hits from the attack

**Paired Claws:**
- +2 damage per degree of success (requires 2+ equipped lightning claws)
- Applied to all hits from the attack

**Implementation:**
```javascript
if (isLightningClaw && degreesOfSuccess > 0) {
  const bonusPerDegree = hasLightningClawPair ? 2 : 1;
  formula += ` + ${degreesOfSuccess * bonusPerDegree}`;
}
```

**Detection:**
```javascript
const isLightningClaw = await WeaponQualityHelper.isLightningClaw(weapon);
const hasLightningClawPair = await WeaponQualityHelper.hasLightningClawPair(actor);
```

### 17. Overheats
Weapon can overheat and damage the wielder.

**Effect:**
- On attack roll of 91+, weapon overheats
- Wielder takes energy damage
- Weapon may be disabled temporarily

**Implementation:**
```javascript
if (attackRoll >= 91) {
  // Trigger overheat damage
}
```

### 18. Reliable
Weapon is less likely to jam.

**Effect:**
- Increases jam threshold by +10
- Single Shot: Jams on 100 only (instead of 96+)
- Semi/Full Auto: Jams on 100 only (instead of 94+)

**Implementation:**
```javascript
const jamThreshold = isReliable ? 100 : (isSingleShot ? 96 : 94);
```

### 19. Power Fist
Massive powered melee weapon.

**Effect:**
- Doubles Strength Bonus
- Unwieldy penalty applied

**Implementation:**
```javascript
if (isPowerFist && strBonus !== 0) {
  const effectiveStrBonus = strBonus * 2;
  formula += ` + ${effectiveStrBonus}`;
}
```

### 20. Gyro-Stabilised (p. 144)
Stabilized heavy weapons.

**Effect:**
- Range penalties cannot exceed -10
- Caps range modifier at -10

**Implementation:**
```javascript
const gyroRangeMod = isGyroStabilised 
  ? Math.max(rangeMod, -10) 
  : rangeMod;
```

### 21. Drain Life
Weapon drains life force from target.

**Effect:**
- Heals wielder based on damage dealt
- Special psychic weapon property

### 22. Living Ammunition
Ammunition is alive and seeks targets.

**Effect:**
- Bonus to hit
- Special targeting behavior

### 23. Volatile
Unstable weapon that can explode.

**Effect:**
- Risk of catastrophic failure
- Extra damage on critical success

### 24. Force (p. 142)
Psychically-attuned melee weapons for psykers.

**Passive Bonus (Data Preparation):**
- +1 Damage and +1 Penetration per point of Psy Rating
- Applied during `item.mjs` `_applyForceWeaponModifiers()`
- Creates `effectiveDamage` and `effectivePenetration`
- Stacks with ammunition modifiers (applied after ammo)
- No effect if wielder has no Psy Rating

**Active Channeling (Post-Damage):**
- When target takes wounds, psyker may channel psychic force as Free Action
- Opposed Willpower test (attacker vs target, both roll 1d100)
- Each side calculates DoS: `floor((WP - roll) / 10) + 1` for successes, 0 for failures
- If attacker wins: deals Xd10 Energy Damage (X = net DoS)
- Damage ignores Armour and Toughness Bonus (applied directly as wounds)
- Button appears in damage message when wounds are taken

**Implementation (Passive):**
```javascript
// In item.mjs _applyForceWeaponModifiers()
if (!this.system.attachedQualities?.includes('force')) return;
const psyRating = this.actor.system?.psyRating?.value || 0;
if (psyRating <= 0) return;
const baseDmg = this.system.effectiveDamage || this.system.dmg;
const basePen = parseInt(this.system.effectivePenetration ?? this.system.penetration ?? 0);
this.system.effectiveDamage = `${baseDmg} +${psyRating}`;
this.system.effectivePenetration = basePen + psyRating;
```

**Implementation (Channeling):**
```javascript
// Button generated in combat-dialog.mjs buildDamageMessage()
if (forceWeaponData && woundsTaken > 0) {
  message += `<button class="force-channel-btn" ...>Force: Channel Psychic Energy</button>`;
}

// Handler in deathwatch.mjs
// Opposed Willpower: attacker rolls vs target rolls
// Net DoS = attacker DoS - target DoS
// On success: roll (netDoS)d10, apply directly as wounds
```

**Data Flow:**
1. `item.mjs`: Detects force quality + psy rating → sets effectiveDamage/effectivePenetration
2. `combat.mjs`: Detects force quality + psy rating → creates `forceWeaponData` object
3. `chat-message-builder.mjs`: Embeds force data in apply-damage button attributes
4. `combat-dialog.mjs`: Generates force-channel button in damage message
5. `deathwatch.mjs`: Handles button click → Opposed Willpower → applies force damage

**Compendium Weapons:**
- Astartes Force Staff (melee0000000012): 1d10+1 I, Pen 0, Balanced + Force
- Astartes Force Sword (melee0000000013): 1d10+2 R, Pen 2, Balanced + Force

**Example:**
- Force Sword (1d10+2, Pen 2) with Psy Rating 3
- Effective: 1d10+2 +3 damage, Pen 5
- On hit dealing wounds: Force channel button appears
- Attacker WP 55 rolls 22 (4 DoS), Target WP 40 rolls 35 (1 DoS)
- Net DoS: 3 → rolls 3d10 Energy damage, ignoring armor and TB

## Quality Detection

### Simple Synchronous Checks (Preferred)
Since quality `_id` values are their keys, checking for qualities is simple:

```javascript
// Check if weapon has a quality
const hasAccurate = weapon.system.attachedQualities?.includes('accurate');

// Check for quality exception in ammunition modifiers
if (mod.qualityException && weapon.system.attachedQualities?.includes(mod.qualityException)) {
  continue; // Skip modifier
}
```

### WeaponQualityHelper Methods (Legacy)
These async methods still exist for compendium lookups but are rarely needed:

```javascript
// Check if weapon has quality (async)
const hasAccurate = await WeaponQualityHelper.hasQuality(weapon, 'accurate');

// Get quality value (for Proven, Felling, etc.)
const provenRating = await WeaponQualityHelper.getProvenRating(weapon);
```

## Usage Patterns

### Adding Quality to Weapon
1. Open weapon item sheet
2. Add quality key to `attachedQualities` array (e.g., `"stalker-pattern"`)
3. Quality keys match the `_id` and `key` fields in the compendium

### Combat Flow
1. **Attack Dialog**: Qualities affect modifiers (Accurate, Twin-Linked, Gyro-Stabilised)
2. **Hit Calculation**: Qualities affect hit count (Twin-Linked, Scatter, Storm)
3. **Damage Roll**: Qualities affect damage formula (Tearing, Proven, Accurate)
4. **Damage Application**: Qualities affect armor/penetration (Primitive, Razor Sharp, Felling)
5. **Post-Damage**: Qualities trigger tests (Shocking, Toxic)

## Test Coverage

### Test File: `weapon-qualities.test.mjs`

**Accurate Quality:**
- ✅ Attack bonus with Half/Full Aim
- ✅ No bonus without Aim
- ✅ Damage bonus for 2/4/6 DoS
- ✅ Capped at 2d10
- ✅ No bonus for multi-shot/melee/subsequent hits

**Primitive Quality:**
- ✅ Doubles armor before penetration
- ✅ Normal calculation when not primitive
- ✅ Handles zero armor
- ✅ Handles high penetration
- ✅ Combines with toughness bonus

**Melta Quality:**
- ✅ Detection methods
- ✅ Penetration doubling at Short Range
- ✅ No doubling outside melta range
- ✅ Interaction with Razor Sharp
- ✅ Interaction with Primitive weapons

**Lightning Claws:**
- ✅ Single claw detection
- ✅ Pair detection
- ✅ Damage bonus calculations (single/paired)
- ✅ High degrees of success handling

**Additional Qualities:**
- ✅ Overheats: Overheat mechanics and damage
- ✅ Reliable: Jam threshold modification
- ✅ Power Fist: STR bonus doubling
- ✅ Gyro-Stabilised: Range penalty capping
- ✅ Drain Life: Life drain mechanics
- ✅ Living Ammunition: Seeking ammunition
- ✅ Volatile: Unstable weapon mechanics
- ✅ Proven: Minimum damage rolls
- ✅ Razor Sharp: Penetration doubling
- ✅ Scatter: Point blank hits and armor
- ✅ Shocking: Stun tests
- ✅ Storm: Hit doubling
- ✅ Tearing: Extra die, drop lowest
- ✅ Toxic: Toughness tests
- ✅ Twin-Linked: BS bonus and extra hits

**Force Quality:**
- ✅ Passive: Psy Rating bonus to damage and penetration
- ✅ Passive: No modification without force quality
- ✅ Passive: No modification with zero psy rating
- ✅ Passive: Stacking with ammunition modifiers
- ✅ Passive: Missing psyRating handling
- ✅ Channeling: Button appears when wounds taken
- ✅ Channeling: No button when zero wounds
- ✅ Channeling: No button when forceWeaponData null
- ✅ Channeling: Coexists with Shocking/Toxic buttons
- ✅ Apply button includes force data attributes

**Total: 65+ tests across 24+ weapon qualities, all passing**

## Future Enhancements

### Planned Qualities
- **Unreliable**: Modify jam threshold (-10)
- **Unwieldy**: Penalties for certain actions
- **Blast (X)**: Area damage radius
- **Flame**: Ignores cover, sets targets on fire
- **Recharge**: Requires recharge action

### Implementation Pattern
1. Add quality to compendium with unique `key`
2. Add detection logic to WeaponQualityHelper
3. Implement effect in CombatDialogHelper
4. Add tests to weapon-qualities.test.mjs
5. Update documentation

## Notes

- **Quality IDs are keys** - Weapon qualities use their key as the `_id` (e.g., `_id: "stalker-pattern"`)
- **Synchronous checks** - Use `attachedQualities.includes(key)` for simple, fast quality detection
- **No async needed** - Quality checks work in synchronous functions like `prepareData()`
- Quality effects are applied dynamically during combat
- Some qualities require UI buttons (Shocking, Toxic, Force)
- Quality values (Proven, Felling) stored in `value` field
- All quality logic centralized in combat helpers
- Force quality has both passive (data prep) and active (post-damage) effects
- Fully unit tested with 65+ tests
