# Cohesion System — Implementation Plan

## Overview

Cohesion is a shared Kill-team resource representing the squad's combat morale and coordination. It is generated at Mission start based on the squad leader's Fellowship Bonus + modifiers, spent to activate Squad Mode abilities, and can be damaged or recovered during play.

This plan covers the Cohesion pool itself. Squad Mode and Solo Mode (which consume Cohesion) will be a separate follow-up implementation.

## Phases

| Phase | Document | Description | Scope |
|-------|----------|-------------|-------|
| 1 | [01-data-model.md](01-data-model.md) | Cohesion data on character DataModel + world setting | Schema, storage, derived calculation |
| 2 | [02-ui.md](02-ui.md) | Cohesion display on character sheet + GM controls | Template, CSS, sheet logic |
| 3 | [03-cohesion-damage.md](03-cohesion-damage.md) | Cohesion damage from combat + Fear + rally tests | Combat integration, chat buttons |
| 4 | [04-cohesion-recovery.md](04-cohesion-recovery.md) | Recovery triggers (objectives, Fate Points, GM award) | Chat buttons, hooks |
| 5 | [05-cohesion-challenge.md](05-cohesion-challenge.md) | Cohesion Challenge rolls (1d10 ≤ current Cohesion) | Roll mechanic, chat output |

## Key Design Decisions

### Kill-team Cohesion is a World-Level Setting
Cohesion is shared across the entire Kill-team, not per-actor. It will be stored as a **Foundry world setting** (`deathwatch.cohesion`) so all players see the same value. This avoids synchronization issues between multiple character sheets.

```javascript
// Registration
game.settings.register('deathwatch', 'cohesion', {
  name: 'Kill-team Cohesion',
  scope: 'world',
  config: false,  // Not in settings menu — managed via UI
  type: Object,
  default: { value: 0, max: 0 }
});
```

### Squad Leader Designation
The squad leader is a **world setting** pointing to an actor ID. The GM assigns the squad leader via a dropdown or drag-and-drop on a Cohesion panel. Cohesion max is derived from the designated leader's stats.

```javascript
game.settings.register('deathwatch', 'squadLeader', {
  name: 'Squad Leader',
  scope: 'world',
  config: false,
  type: String,
  default: ''
});
```

### Cohesion Calculation Formula
```
Cohesion Max = Fellowship Bonus + Rank Modifier + Command Modifier + GM Modifier
```

| Source | Condition | Bonus |
|--------|-----------|-------|
| Fellowship Bonus | Always | `floor(fs.value / 10)` |
| Rank 0–3 | `rank <= 3` | +0 |
| Rank 4–5 | `rank === 4 \|\| rank === 5` | +1 |
| Rank 6+ | `rank >= 6` | +2 |
| Command Trained | `command.trained` | +1 |
| Command +10 | `command.mastered` | +2 |
| Command +20 | `command.expert` | +3 |
| GM Modifier | Always | Any integer (world setting) |

Only the highest Command modifier applies (not cumulative).

### GM Modifier
A world-level setting (`deathwatch.cohesionModifier`) that the GM can set to any integer value. This is added to the Cohesion max formula and persists across recalculations. Use cases include rewarding good roleplay, bringing snacks, or penalising poor tactical decisions.

```javascript
game.settings.register('deathwatch', 'cohesionModifier', {
  name: 'Cohesion GM Modifier',
  scope: 'world',
  config: false,
  type: Number,
  default: 0
});
```

When the GM clicks Recalculate, a dialog shows the current modifier value and allows editing it before recalculating. The modifier is shown in the Cohesion box tooltip so players can see the breakdown.

### Cohesion Damage Rules (Summary)
- Only when Battle-Brother is in **Squad Mode**
- Only when receiving **10+ raw damage** (before armor/TB) from: Accurate weapon, Blast weapon, or Devastating weapon
- Squad leader can negate with Challenging (+0) Command or Fellowship test (Free Action)
- **Max 1 Cohesion damage per combat round** (additional ignored)
- Fear creatures also cause Cohesion damage (negated by leader WP test)

### Cohesion Recovery
+1 Cohesion when:
- Kill-team completes a Mission Objective
- Any member spends a Fate Point
- GM awards for monumental task / good roleplay

### Cohesion Challenge
Roll 1d10 ≤ current Cohesion to pass. Used for entering/maintaining Squad Mode under stress.

## Dependencies
- Character DataModel (`actor/character.mjs`) — read Fellowship, Rank, Command skill
- Combat system (`combat/combat.mjs`) — damage hooks for Cohesion damage triggers
- Fate Point spending — hook for recovery trigger
- Future: Squad Mode / Solo Mode system (consumes Cohesion)

## File Plan

| File | Type | Purpose |
|------|------|---------|
| `src/module/helpers/cohesion.mjs` | Helper | `CohesionHelper` — pure calculation functions |
| `src/module/helpers/constants.mjs` | Constants | Cohesion-related constants |
| `src/module/ui/cohesion-panel.mjs` | Application | `CohesionPanel` — floating HUD panel (singleton) |
| `src/templates/ui/cohesion-panel.html` | Template | Panel template |
| `src/styles/components/cohesion.css` | CSS | Panel styling |
| `tests/helpers/cohesion.test.mjs` | Tests | CohesionHelper unit tests |
| `deathwatch.mjs` | Entry point | Setting registration, panel render, chat button handlers |

## Test Plan
- `CohesionHelper.calculateCohesionMax(actor)` — all modifier combinations (including GM modifier)
- `CohesionHelper.getRankModifier(rank)` — boundary cases (3→4, 5→6)
- `CohesionHelper.getCommandModifier(skill)` — trained/mastered/expert/untrained
- `CohesionHelper.shouldTriggerCohesionDamage(damage, weaponQualities)` — threshold + quality checks
- `CohesionHelper.resolveCohesionChallenge(cohesion, roll)` — pass/fail
- Cohesion damage cap (1 per round)
- Recovery triggers

## Estimated Test Count
~45–55 tests across 5 phases
