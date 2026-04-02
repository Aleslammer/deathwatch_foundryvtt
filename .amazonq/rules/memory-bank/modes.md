# Solo/Squad Mode System

## Overview
Battle-Brothers operate in one of two modes: Solo Mode (default) or Squad Mode. Mode determines which abilities are available. Solo Mode abilities are personal combat enhancements; Squad Mode abilities are coordinated Kill-team actions that cost Cohesion.

## Architecture

### Core Components
- **ModeHelper** (`helpers/mode-helper.mjs`): Pure functions for mode validation and chat messages
- **CohesionPanel** (`ui/cohesion-panel.mjs`): Displays character mode list with toggle controls
- **DeathwatchCharacter** (`data/actor/character.mjs`): `mode` field on character schema
- **Constants** (`constants.mjs`): `MODES`, `MODE_LABELS`

### Data Model
```javascript
// DeathwatchCharacter schema
schema.mode = new fields.StringField({ initial: "solo" });
```
Values: `"solo"` (default) or `"squad"`.

## Constants (`constants.mjs`)
```javascript
export const MODES = {
  SOLO: 'solo',
  SQUAD: 'squad'
};

export const MODE_LABELS = {
  [MODES.SOLO]: 'Solo Mode',
  [MODES.SQUAD]: 'Squad Mode'
};
```

## ModeHelper (`helpers/mode-helper.mjs`)

Static helper class. All pure functions.

| Function | Description |
|----------|-------------|
| `canEnterSquadMode(cohesionValue)` | Returns true if Cohesion ≥ 1 |
| `getModeLabel(mode)` | Returns display label, defaults to "Solo Mode" |
| `buildModeChangeMessage(actorName, newMode)` | Chat HTML for mode transitions |
| `buildCohesionDepletedMessage()` | Chat HTML for forced Solo Mode drop |

## CohesionPanel Integration

### Scene Controls (Left Toolbar)
The CohesionPanel toggle is a button tool inside Foundry's **Token Controls** group in the left-side scene controls toolbar:
- 🛡 Shield icon appears as a tool when Token Controls is active
- Clicking the shield opens/closes the floating CohesionPanel
- Panel starts closed on session load — user opens it when needed
- Registered via `getSceneControlButtons` hook in `deathwatch.mjs`, added to `controls.tokens.tools`

### Character Mode List
The CohesionPanel displays all character actors with their current mode:
- 🟢 Green dot = Solo Mode
- 🔵 Blue dot = Squad Mode
- Toggle button (⇄) for GM or character owner

### Toggle Validation
Entering Squad Mode requires Cohesion ≥ 1. Exiting is always allowed.

### Auto-Drop on Zero Cohesion
When Cohesion reaches 0 (detected via `updateSetting` hook):
- All characters in Squad Mode are set to Solo Mode
- Single chat message: "⚔ Cohesion depleted — all Battle-Brothers return to Solo Mode"
- `CohesionPanel.dropAllToSoloMode()` handles the batch update

### Reactivity
- `updateSetting` hook re-renders panel on Cohesion changes + triggers auto-drop check
- `updateActor` hook re-renders panel when a character's mode changes

## Chat Messages
- "🔵 **Brother Castiel** enters Squad Mode"
- "🟢 **Brother Castiel** returns to Solo Mode"
- "⚔ **Cohesion depleted** — all Battle-Brothers return to Solo Mode"

## Files
```
src/module/helpers/mode-helper.mjs       ModeHelper (pure functions)
src/module/helpers/constants.mjs         MODES, MODE_LABELS (added)
src/module/data/actor/character.mjs      mode field (added)
src/module/ui/cohesion-panel.mjs         Character mode list, toggle, auto-drop
src/templates/ui/cohesion-panel.html     Mode indicator rows
src/styles/components/cohesion.css       Mode indicator styles
src/module/deathwatch.mjs                Scene control hook, auto-drop hook, updateActor hook
tests/helpers/mode-helper.test.mjs       13 unit tests
```

## Test Coverage

### File: `tests/helpers/mode-helper.test.mjs` — 13 tests

| Describe Block | Tests |
|---------------|-------|
| canEnterSquadMode | 4 |
| getModeLabel | 4 |
| buildModeChangeMessage | 3 |
| buildCohesionDepletedMessage | 2 |

## What Is NOT Automated
- **Support Range**: GM adjudicates whether characters are close enough (visual/vocal distance)
- **Full Action vs Cohesion Challenge**: The system tracks the resulting mode state, not the action type used to enter it
- **Ability effects**: Solo/Squad Mode abilities remain descriptive — GM applies effects manually

## Future Phases

| Phase | Doc | Status | Description |
|-------|-----|--------|-------------|
| 1 | `01-mode-tracking.md` | ✅ Complete | Mode field, CohesionPanel display, toggle, auto-drop |
| 2 | `02-special-ability-modes.md` | Planned | `modeRequirement` field on special-ability items, visual filtering |
| 3 | `03-squad-mode-abilities.md` | Planned | Squad Mode ability activation, Cohesion cost, sustained tracking |

Planning docs: `docs/improvements/modes/planning/`

## Notes
- Mode is per-character (not world-level like Cohesion)
- Only `character` actor type has the `mode` field — enemies/NPCs/hordes don't use modes
- Special abilities have three categories: mode-agnostic (always available), Solo-only, Squad-required
- The `special-ability` item type is NOT exclusively for mode abilities — it covers all specialty abilities
