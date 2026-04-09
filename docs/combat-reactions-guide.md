# Combat Reactions Guide

Quick reference for Dodge and Parry rolls using the macro API.

## Basic Mechanics

### Dodge
- **Test:** SKILL (Agility-based)
- **Difficulty:** Challenging (+0)
- **Action:** Half Action Reaction
- **Use:** Avoid any attack
- **Training:** Can be trained/expert/mastered for bonuses
- **API:** Use `rollSkill('dodge')`

### Parry
- **Test:** CHARACTERISTIC (Weapon Skill)
- **Difficulty:** Challenging (+0)
- **Action:** Half Action Reaction
- **Use:** Block melee attacks (requires melee weapon)
- **Training:** Uses raw WS value, no skill advances
- **API:** Use `rollCharacteristic('ws')`

## Quick Macros

### Fast Dodge (SKILL)
```javascript
const token = canvas.tokens.controlled[0];
await game.deathwatch.rollSkill(token.actor.id, 'dodge', {
  difficulty: 'Challenging',
  skipDialog: true
});
```

### Fast Parry (CHARACTERISTIC)
```javascript
const token = canvas.tokens.controlled[0];
await game.deathwatch.rollCharacteristic(token.actor.id, 'ws', {
  difficulty: 'Challenging',
  skipDialog: true
});
```

## IMPORTANT: Dodge vs Parry

**Dodge is a SKILL:**
- Uses `game.deathwatch.rollSkill(actorId, 'dodge', options)`
- Benefits from training (trained/expert/mastered)
- Total value includes AG + training bonuses + modifiers

**Parry is a CHARACTERISTIC:**
- Uses `game.deathwatch.rollCharacteristic(actorId, 'ws', options)`
- Raw WS value only
- No skill training bonuses

## Common Modifiers

| Situation | Modifier | Notes |
|-----------|----------|-------|
| **Defensive Stance** | +20 | Full Action, applies to all Dodge/Parry until next turn |
| **Lightning Reflexes** | +10 | Talent, applies to Dodge only |
| **Blademaster** | +10 | Talent, applies to Parry with melee weapons |
| **Step Aside** | Special | Talent, Dodge as Free Action |
| **Called Shot attack** | -20 | Harder to dodge/parry precise attacks |
| **2nd attacker** | -20 | Each additional reaction this round |
| **3rd attacker** | -40 | Cumulative penalty |
| **4th+ attacker** | -60+ | Usually impossible without talents |

## Example: Defensive Stance Dodge (SKILL)

```javascript
const token = canvas.tokens.controlled[0];
await game.deathwatch.rollSkill(token.actor.id, 'dodge', {
  modifier: 20,  // Defensive Stance bonus
  difficulty: 'Challenging',
  skipDialog: true
});
```

## Example: Multiple Attackers (SKILL)

```javascript
const token = canvas.tokens.controlled[0];
const attackerNumber = 2;  // This is the 2nd attack this round

const penalty = (attackerNumber - 1) * -20;  // -20 for 2nd reaction

await game.deathwatch.rollSkill(token.actor.id, 'dodge', {
  modifier: penalty,
  difficulty: 'Challenging',
  skipDialog: true
});
```

## Example: Parry with Blademaster (CHARACTERISTIC)

```javascript
const token = canvas.tokens.controlled[0];
const hasBlademaster = token.actor.items.find(i => i.name === 'Blademaster');

// Parry is a CHARACTERISTIC test
await game.deathwatch.rollCharacteristic(token.actor.id, 'ws', {
  modifier: hasBlademaster ? 10 : 0,
  difficulty: 'Challenging',
  skipDialog: true
});
```

## Comprehensive Reaction Macro

For the most feature-complete solution, use the **`combat-reactions.js`** macro from `docs/example-macros/`.

It automatically handles:
- ✅ Talent detection (Lightning Reflexes, Blademaster, Step Aside)
- ✅ Defensive Stance bonus (+20)
- ✅ Multiple attacker penalties (cumulative -20 per additional attacker)
- ✅ Called Shot penalties (-20)
- ✅ Choice between Dodge or Parry
- ✅ Custom modifiers
- ✅ Modifier summary in chat

## Rule References

### Core Rules
- **Dodge:** Deathwatch Core Rulebook, p. 245
- **Parry:** Deathwatch Core Rulebook, p. 246
- **Defensive Stance:** Deathwatch Core Rulebook, p. 247
- **Reaction Actions:** Deathwatch Core Rulebook, p. 238

### Relevant Talents
- **Lightning Reflexes:** +10 to Dodge tests
- **Step Aside:** Dodge as Free Action (requires Lightning Reflexes)
- **Blademaster:** +10 to Parry with melee weapons
- **Wall of Steel:** Parry as Free Action (requires Blademaster)

## Tips for GMs

### Tracking Multiple Reactions
Keep track of how many times a character has reacted this round:
- 1st reaction: +0
- 2nd reaction: -20
- 3rd reaction: -40
- 4th reaction: -60

Reset count at the start of the character's next turn.

### Defensive Stance
Character must spend a **Full Action** to assume Defensive Stance. Mark the character with a status effect and remember to remove it at the start of their next turn.

Benefits:
- +20 to all Dodge tests
- +20 to all Parry tests
- Lasts until the start of their next turn

### Called Shots
When an attacker makes a Called Shot (-20 to hit), the defender suffers -20 to Dodge/Parry.

### One-on-One vs Many-on-One
- **One-on-one:** Standard reactions, no penalties
- **Two-on-one:** Second reaction at -20
- **Three-on-one:** Third reaction at -40
- **Four-on-one:** Usually can't react unless character has Step Aside/Wall of Steel

## Common Scenarios

### Scenario 1: Brother Corvus vs 3 Orks

Brother Corvus is attacked by 3 Orks in the same round:

1. **First Ork attacks:** Dodge at +0 (Dodge skill 50)
2. **Second Ork attacks:** Dodge at -20 (Dodge skill 30)
3. **Third Ork attacks:** Dodge at -40 (Dodge skill 10)

```javascript
// First reaction (Dodge is a SKILL)
await game.deathwatch.rollSkill(actor.id, 'dodge', {
  modifier: 0,
  difficulty: 'Challenging',
  skipDialog: true
});

// Second reaction
await game.deathwatch.rollSkill(actor.id, 'dodge', {
  modifier: -20,
  difficulty: 'Challenging',
  skipDialog: true
});

// Third reaction
await game.deathwatch.rollSkill(actor.id, 'dodge', {
  modifier: -40,
  difficulty: 'Challenging',
  skipDialog: true
});
```

### Scenario 2: Defensive Stance Against Called Shot

Brother Titus assumes Defensive Stance, then is attacked with a Called Shot:

- Defensive Stance: +20
- Called Shot: -20
- **Net modifier:** +0

```javascript
// Dodge is a SKILL test
await game.deathwatch.rollSkill(actor.id, 'dodge', {
  modifier: 0,  // +20 from Defensive Stance, -20 from Called Shot
  difficulty: 'Challenging',
  skipDialog: true
});
```

### Scenario 3: Parry with Blademaster and Multiple Attackers

Brother Demetrius (Blademaster) parries multiple attackers:

- 1st attacker: WS 50 + 10 (Blademaster) = 60
- 2nd attacker: WS 50 + 10 (Blademaster) - 20 (multiple) = 40
- 3rd attacker: WS 50 + 10 (Blademaster) - 40 (multiple) = 20

```javascript
// First parry (Parry is a CHARACTERISTIC test)
await game.deathwatch.rollCharacteristic(actor.id, 'ws', {
  modifier: 10,  // Blademaster
  difficulty: 'Challenging',
  skipDialog: true
});

// Second parry
await game.deathwatch.rollCharacteristic(actor.id, 'ws', {
  modifier: -10,  // +10 Blademaster, -20 multiple attackers
  difficulty: 'Challenging',
  skipDialog: true
});

// Third parry
await game.deathwatch.rollCharacteristic(actor.id, 'ws', {
  modifier: -30,  // +10 Blademaster, -40 multiple attackers
  difficulty: 'Challenging',
  skipDialog: true
});
```

## See Also

- **Main API Documentation:** `docs/macro-api.md`
- **Example Macros:** `docs/example-macros/`
- **Installation Guide:** `docs/example-macros/README.md`
