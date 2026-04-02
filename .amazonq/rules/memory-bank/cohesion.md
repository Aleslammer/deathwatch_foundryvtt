# Cohesion System

## Overview
Cohesion is a shared Kill-team resource representing the squad's combat morale and coordination. Generated at Mission start based on the squad leader's Fellowship Bonus + modifiers. Stored as world-level settings so all players see the same values. Displayed via a floating `CohesionPanel` Application window visible to all users.

## Architecture

### Core Components
- **CohesionHelper** (`helpers/cohesion.mjs`): Pure calculation functions + Cohesion Challenge roll
- **CohesionPanel** (`ui/cohesion-panel.mjs`): Floating Application window (singleton, `popOut: true`)
- **Constants** (`constants.mjs`): `COHESION` constants for thresholds and bonuses
- **World Settings**: 4 settings registered in `deathwatch.mjs`

### World Settings
| Setting | Scope | Type | Default | Purpose |
|---------|-------|------|---------|---------|
| `deathwatch.cohesion` | world | Object | `{ value: 0, max: 0 }` | Shared Cohesion pool |
| `deathwatch.squadLeader` | world | String | `''` | Actor ID of squad leader |
| `deathwatch.cohesionModifier` | world | Number | `0` | GM modifier to Cohesion max |
| `deathwatch.cohesionDamageThisRound` | world | Boolean | `false` | 1-per-round damage cap |

## Cohesion Calculation Formula
```
Cohesion Max = Fellowship Bonus + Rank Modifier + Command Modifier + GM Modifier
```

| Source | Condition | Bonus |
|--------|-----------|-------|
| Fellowship Bonus | Always | `floor(fs.value / 10)` |
| Rank 0–3 | `rank <= 3` | +0 |
| Rank 4–5 | `rank >= 4 && rank <= 5` | +1 |
| Rank 6+ | `rank >= 6` | +2 |
| Command Trained | `command.trained` | +1 |
| Command +10 | `command.mastered` | +2 |
| Command +20 | `command.expert` | +3 |
| GM Modifier | Always | Any integer (world setting) |

Only the highest Command modifier applies (not cumulative).

## CohesionHelper (`helpers/cohesion.mjs`)

Static helper class. Pure functions except `rollCohesionChallenge()`.

| Function | Pure | Description |
|----------|------|-------------|
| `calculateCohesionMax(fs, rank, commandSkill, gmMod)` | Yes | Full Cohesion max calculation |
| `getRankModifier(rank)` | Yes | Rank 0–3: 0, 4–5: 1, 6+: 2 |
| `getCommandModifier(commandSkill)` | Yes | Highest of trained/mastered/expert |
| `calculateCohesionMaxFromActor(actor, gmMod)` | Yes | Extracts values from live actor |
| `buildCohesionBreakdown(leader, gmMod)` | Yes | Tooltip string with formula breakdown |
| `resolveCohesionChallenge(cohesion, roll)` | Yes | 1d10 ≤ cohesion = pass |
| `rollCohesionChallenge(actor)` | No | Rolls 1d10, posts result to chat |

## CohesionPanel (`ui/cohesion-panel.mjs`)

Singleton `Application` with `popOut: true`. Renders as a Foundry floating window.

### Key Behaviors
- **Singleton**: `CohesionPanel.getInstance()` returns the single instance
- **Toggled via Scene Controls**: Kill-team tool group in left toolbar, panel starts closed
- **Toggle**: `CohesionPanel.toggle()` opens if closed, closes if open
- **Position**: Top center on first render. Users can drag during session but position resets on reopen.
- **Reactivity**: Re-renders when `cohesion`, `squadLeader`, or `cohesionModifier` settings change (via `updateSetting` hook)
- **Non-minimizable, non-resizable**: Compact HUD-like window

### Buttons
| Button | Icon | Who | Action |
|--------|------|-----|--------|
| +1 | `fa-plus` | GM | `_adjustCohesion(1)` + chat message |
| −1 | `fa-minus` | GM | `_adjustCohesion(-1)` + chat message |
| ⟳ Recalculate | `fa-sync` | GM | Dialog: formula breakdown + editable GM modifier |
| ✎ Edit | `fa-edit` | GM | Dialog: manual value/max override |
| ♛ Set Leader | `fa-crown` | GM | Dialog: dropdown of character actors |
| 🎲 Challenge | `fa-dice` | All | Auto-selects owned character or prompts, rolls 1d10 vs Cohesion |

### Recalculate Dialog
Shows formula breakdown (FS Bonus, Rank, Command) with an editable GM Modifier field. On confirm:
1. Saves GM modifier to `cohesionModifier` setting
2. Recalculates max from leader's stats + GM modifier
3. Caps current value at new max

### Set Leader Dialog
Dropdown of all character-type actors. On confirm:
1. Sets `squadLeader` setting
2. Recalculates max from new leader
3. Sets current Cohesion to new max (fresh Mission start)

## Constants (`constants.mjs`)
```javascript
export const COHESION = {
  RANK_THRESHOLD_MID: 4,
  RANK_THRESHOLD_HIGH: 6,
  RANK_BONUS_MID: 1,
  RANK_BONUS_HIGH: 2,
  COMMAND_TRAINED: 1,
  COMMAND_MASTERED: 2,
  COMMAND_EXPERT: 3,
  DAMAGE_THRESHOLD: 10,
  MAX_DAMAGE_PER_ROUND: 1
};
```

## Cohesion Challenge
Roll 1d10 ≤ current Cohesion to pass. Used for entering/maintaining Squad Mode under stress.
- If player owns exactly one character, rolls immediately
- If multiple owned characters, prompts for selection
- Result posted to chat with pass/fail

## Registration & Lifecycle

### Init Hook (`deathwatch.mjs`)
- Registers 4 world settings
- Exposes `CohesionHelper` and `CohesionPanel` on `game.deathwatch`

### Ready Hook (`deathwatch.mjs`)
- Renders `CohesionPanel.getInstance().render(true)`
- Registers `updateSetting` hook for reactivity

## Files
```
src/module/helpers/cohesion.mjs      CohesionHelper (pure functions)
src/module/helpers/constants.mjs     COHESION constants (added)
src/module/ui/cohesion-panel.mjs     CohesionPanel Application
src/module/deathwatch.mjs            Settings registration, panel render, reactivity
src/templates/ui/cohesion-panel.html Panel Handlebars template
src/styles/components/cohesion.css   Panel styling
tests/helpers/cohesion.test.mjs      42 unit tests
tests/setup.mjs                      Added Application mock, game.settings mock
```

## Test Coverage

### File: `tests/helpers/cohesion.test.mjs` — 42 tests

| Describe Block | Tests |
|---------------|-------|
| getRankModifier | 7 |
| getCommandModifier | 7 |
| calculateCohesionMax | 9 |
| calculateCohesionMaxFromActor | 5 |
| buildCohesionBreakdown | 5 |
| resolveCohesionChallenge | 9 |

## Future Phases (Not Yet Implemented)

| Phase | Doc | Description |
|-------|-----|-------------|
| 3 | `docs/improvements/cohesion/03-cohesion-damage.md` | Cohesion damage from combat (Accurate/Blast/Devastating + 10+ damage), rally tests, Fear |
| 4 | `docs/improvements/cohesion/04-cohesion-recovery.md` | Recovery triggers (objectives, Fate Points, GM award) |
| 5 | `docs/improvements/cohesion/05-cohesion-challenge.md` | Full Cohesion Challenge integration (Phase 5 pure function already implemented) |

### Cohesion Damage Rules (Phase 3)
- Only in Squad Mode, 10+ raw damage from Accurate/Blast/Devastating weapon
- Squad leader can rally (Command or Fellowship test) to negate
- Max 1 Cohesion damage per combat round
- Fear creatures also cause Cohesion damage (negated by leader WP test)

### Cohesion Recovery (Phase 4)
- +1 when Kill-team completes Mission Objective (GM button)
- +1 when any member spends a Fate Point (updateActor hook)
- +1 GM award for monumental task / good roleplay (GM button)

## Notes
- Cohesion is world-level (shared), not per-actor
- GM modifier persists across recalculations (good snacks bonus)
- Panel position resets to top-center on reload (no persistence — kept simple)
- `close()` override prevents accidental panel dismissal
- `Application` mock added to `tests/setup.mjs` for CohesionPanel import chain
- `game.settings` mock added to both `tests/setup.mjs` and `tests/deathwatch.test.mjs`
