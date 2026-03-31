# Phase 1 — Data Model & Settings

## Goal
Store Cohesion as a world-level setting, designate a squad leader, and provide pure calculation functions for Cohesion max.

## World Settings

### `deathwatch.cohesion`
```javascript
game.settings.register('deathwatch', 'cohesion', {
  name: 'Kill-team Cohesion',
  scope: 'world',
  config: false,
  type: Object,
  default: { value: 0, max: 0 }
});
```

### `deathwatch.squadLeader`
```javascript
game.settings.register('deathwatch', 'squadLeader', {
  name: 'Squad Leader Actor ID',
  scope: 'world',
  config: false,
  type: String,
  default: ''
});
```

### `deathwatch.cohesionModifier`
GM-controlled modifier added to Cohesion max. Persists across recalculations.
```javascript
game.settings.register('deathwatch', 'cohesionModifier', {
  name: 'Cohesion GM Modifier',
  scope: 'world',
  config: false,
  type: Number,
  default: 0
});
```

### `deathwatch.cohesionDamageThisRound`
Tracks whether Cohesion damage has already been applied this combat round (max 1 per round rule).
```javascript
game.settings.register('deathwatch', 'cohesionDamageThisRound', {
  name: 'Cohesion Damage This Round',
  scope: 'world',
  config: false,
  type: Boolean,
  default: false
});
```
Reset to `false` on combat round advance (hook: `updateCombat`).

## CohesionHelper (`src/module/helpers/cohesion.mjs`)

Static helper class with pure functions. No Foundry API calls — all inputs passed as parameters.

### Functions

#### `calculateCohesionMax(fellowshipValue, rank, commandSkill, gmModifier = 0)`
Returns the Cohesion pool maximum.

```javascript
static calculateCohesionMax(fellowshipValue, rank, commandSkill, gmModifier = 0) {
  const fsBonus = Math.floor(fellowshipValue / 10);
  const rankMod = CohesionHelper.getRankModifier(rank);
  const commandMod = CohesionHelper.getCommandModifier(commandSkill);
  return Math.max(0, fsBonus + rankMod + commandMod + gmModifier);
}
```

**Parameters:**
- `fellowshipValue` (number): The squad leader's computed `fs.value`
- `rank` (number): The squad leader's current rank (1–8)
- `commandSkill` (object): `{ trained, mastered, expert }` booleans from the leader's skills
- `gmModifier` (number): GM-set modifier from world setting (default 0)

#### `getRankModifier(rank)`
```javascript
static getRankModifier(rank) {
  if (rank >= 6) return 2;
  if (rank >= 4) return 1;
  return 0;
}
```

#### `getCommandModifier(commandSkill)`
Only the highest tier applies.
```javascript
static getCommandModifier(commandSkill) {
  if (!commandSkill) return 0;
  if (commandSkill.expert) return 3;
  if (commandSkill.mastered) return 2;
  if (commandSkill.trained) return 1;
  return 0;
}
```

#### `calculateCohesionMaxFromActor(actor, gmModifier = 0)`
Convenience wrapper that extracts values from a live actor.
```javascript
static calculateCohesionMaxFromActor(actor, gmModifier = 0) {
  if (!actor || actor.type !== 'character') return 0;
  const fs = actor.system.characteristics?.fs?.value || 0;
  const rank = actor.system.rank || 1;
  const commandSkill = actor.system.skills?.command || {};
  return CohesionHelper.calculateCohesionMax(fs, rank, commandSkill, gmModifier);
}
```

## Constants (`constants.mjs` additions)

```javascript
// Cohesion
export const COHESION = {
  RANK_THRESHOLD_MID: 4,    // Rank 4-5 = +1
  RANK_THRESHOLD_HIGH: 6,   // Rank 6+ = +2
  RANK_BONUS_MID: 1,
  RANK_BONUS_HIGH: 2,
  COMMAND_TRAINED: 1,
  COMMAND_MASTERED: 2,
  COMMAND_EXPERT: 3,
  DAMAGE_THRESHOLD: 10,     // 10+ raw damage triggers Cohesion damage
  MAX_DAMAGE_PER_ROUND: 1
};
```

## Registration (`deathwatch.mjs`)

In the `init` hook, register the three world settings. No UI changes in this phase.

## Tests (`tests/helpers/cohesion.test.mjs`)

### getRankModifier
| Input | Expected | Description |
|-------|----------|-------------|
| 1 | 0 | Rank 1 (low) |
| 3 | 0 | Rank 3 (boundary) |
| 4 | 1 | Rank 4 (mid start) |
| 5 | 1 | Rank 5 (mid end) |
| 6 | 2 | Rank 6 (high start) |
| 8 | 2 | Rank 8 (max) |
| 0 | 0 | Edge: rank 0 |

### getCommandModifier
| Input | Expected | Description |
|-------|----------|-------------|
| `null` | 0 | No skill |
| `{}` | 0 | Untrained |
| `{ trained: true }` | 1 | Trained only |
| `{ trained: true, mastered: true }` | 2 | Mastered (highest applies) |
| `{ trained: true, mastered: true, expert: true }` | 3 | Expert (highest applies) |
| `{ expert: true }` | 3 | Expert without lower tiers |

### calculateCohesionMax
| FS Value | Rank | Command | GM Mod | Expected | Description |
|----------|------|---------|--------|----------|-------------|
| 40 | 1 | untrained | 0 | 4 | Base case: FS bonus only |
| 55 | 4 | trained | 0 | 7 | 5 + 1 + 1 |
| 60 | 6 | expert | 0 | 11 | 6 + 2 + 3 |
| 0 | 1 | untrained | 0 | 0 | Zero fellowship |
| 35 | 5 | mastered | 0 | 6 | 3 + 1 + 2 |
| 40 | 1 | untrained | 2 | 6 | GM modifier adds +2 |
| 40 | 4 | trained | -1 | 5 | Negative GM modifier |
| 10 | 1 | untrained | -5 | 0 | GM modifier can't go below 0 |

### calculateCohesionMaxFromActor
- Returns 0 for null actor
- Returns 0 for non-character actor
- Extracts correct values from mock actor

**Estimated: ~21 tests**

## Deliverables
1. `src/module/helpers/cohesion.mjs` — CohesionHelper class
2. Constants added to `constants.mjs`
3. Settings registered in `deathwatch.mjs` (including `cohesionModifier`)
4. `tests/helpers/cohesion.test.mjs` — unit tests
