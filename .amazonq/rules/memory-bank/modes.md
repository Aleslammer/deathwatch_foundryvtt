# Solo/Squad Mode System

## Overview
Battle-Brothers operate in one of two modes: Solo Mode (default) or Squad Mode. Mode determines which abilities are available. Solo Mode abilities are personal combat enhancements; Squad Mode abilities are coordinated Kill-team actions that cost Cohesion.

## Architecture

### Core Components
- **ModeHelper** (`helpers/mode-helper.mjs`): Pure functions for mode validation and chat messages
- **CohesionPanel** (`ui/cohesion-panel.mjs`): Displays character mode list, toggle controls, active abilities, Squad ability activation/deactivation
- **DeathwatchCharacter** (`data/actor/character.mjs`): `mode` field on character schema
- **DeathwatchSpecialAbility** (`data/item/special-ability.mjs`): Mode, activation, and Squad Mode fields
- **Constants** (`constants.mjs`): `MODES`, `MODE_LABELS`

### Data Model
```javascript
// DeathwatchCharacter schema
schema.mode = new fields.StringField({ initial: "solo" });
```
Values: `"solo"` (default) or `"squad"`.

### DeathwatchSpecialAbility Schema (Phase 2+3)
```javascript
// Phase 2: Mode fields
schema.modeRequirement = new fields.StringField({ initial: "", blank: true });
// Values: "" (none), "solo", "squad"
schema.requiredRank = new fields.NumberField({ initial: 0, min: 0, integer: true });
schema.chapter = new fields.StringField({ initial: "", blank: true });
schema.abilityCategory = new fields.StringField({ initial: "", blank: true });
// Values: "" (specialty ability), "codex", "chapter"
schema.effect = new fields.StringField({ initial: "", blank: true });
schema.improvements = new fields.ArrayField(new fields.ObjectField(), { initial: [] });

// Phase 3: Squad Mode activation fields
schema.abilityType = new fields.StringField({ initial: "", blank: true });
// Values: "", "attack-pattern", "defensive-stance"
schema.cohesionCost = new fields.NumberField({ initial: 0, min: 0, integer: true });
schema.sustained = new fields.BooleanField({ initial: false });
schema.action = new fields.StringField({ initial: "", blank: true });
// Values: "", "free", "half", "full", "reaction"
schema.chapterImg = new fields.StringField({ initial: "", blank: true });
```

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
| `canEnterSquadMode(cohesionValue)` | Returns true if Cohesion >= 1 |
| `getModeLabel(mode)` | Returns display label, defaults to "Solo Mode" |
| `buildModeChangeMessage(actorName, newMode)` | Chat HTML for mode transitions |
| `buildCohesionDepletedMessage()` | Chat HTML for forced Solo Mode drop |
| `isAbilityActiveForMode(modeRequirement, currentMode)` | True if no requirement or mode matches |
| `meetsRankRequirement(requiredRank, currentRank)` | True if rank >= required (0 = always) |
| `meetsChapterRequirement(abilityChapter, characterChapter)` | True if empty or chapters match |
| `getQualifyingImprovements(improvements, currentRank)` | Filters improvements by rank |
| `buildAbilityActivationMessage(...)` | Chat HTML with mode emoji, effect, qualifying improvements |
| `canActivateSquadAbility(mode, cohesionValue, cost)` | Validates Squad Mode + Cohesion cost |
| `buildSquadActivationMessage(...)` | Chat HTML with Cohesion deduction, effect, and improvements |
| `buildDeactivationMessage(abilityName)` | Chat HTML for sustained ability deactivation |
| `isSustainingAbility(activeAbilities, actorId)` | True if actor already sustaining |

## Socket Communication

Squad Mode activation and deactivation use Foundry's socket system for multiplayer support:
- `system.json` has `"socket": true` to enable the channel
- Players emit `{ type: 'activateSquadAbility', actorId, abilityId }` or `{ type: 'deactivateSquadAbility', index }`
- GM client listens on `game.socket.on('system.deathwatch', ...)` and executes world setting changes
- Validation (mode check, Cohesion check, sustaining check) runs client-side for immediate feedback
- GM re-validates on receipt before executing

## CohesionPanel Integration

### Scene Controls (Left Toolbar)
The CohesionPanel toggle is a button tool inside Foundry's **Token Controls** group in the left-side scene controls toolbar:
- Shield icon appears as a tool when Token Controls is active
- Clicking the shield opens/closes the floating CohesionPanel
- Panel starts closed on session load
- Registered via `getSceneControlButtons` hook in `deathwatch.mjs`

### Character Mode List
The CohesionPanel displays all character actors with their current mode:
- Green dot = Solo Mode
- Blue dot = Squad Mode
- Toggle button for GM or character owner

### Active Abilities Display
Below the character mode list, shows active sustained Squad Mode abilities:
- Diamond icon + ability name + initiator name
- Deactivate button visible to GM and ability initiator (`canDeactivate` flag)
- Stored in `activeSquadAbilities` world setting

### CohesionPanel Squad Ability Methods

| Method | Description |
|--------|-------------|
| `activateSquadAbility(actor, ability)` | Validates, deducts Cohesion, tracks sustained, posts chat. Routes through socket for non-GM. |
| `_onDeactivateAbility(ev)` | Deactivates by index. Routes through socket for non-GM. |
| `deactivateAbilitiesForActor(actorId)` | Auto-deactivates when actor leaves Squad Mode |
| `dropAllToSoloMode()` | Forces all to Solo Mode + clears all active abilities when Cohesion reaches 0 |

### Toggle Validation
Entering Squad Mode requires Cohesion >= 1. Exiting is always allowed. Leaving Squad Mode auto-deactivates sustained abilities.

### Auto-Drop on Zero Cohesion
When Cohesion reaches 0 (detected via `updateSetting` hook):
- All characters in Squad Mode are set to Solo Mode
- All active sustained abilities are cleared
- Single chat message posted

### Reactivity
- `updateSetting` hook re-renders panel on Cohesion, squadLeader, cohesionModifier, and activeSquadAbilities changes
- `updateActor` hook re-renders panel when a character's mode changes

## Character Sheet Integration

### Special Abilities Section
- Smart column: specialty name for specialty abilities, mode emoji + chapter/Codex for mode abilities
- Cost badge `[3]` and Sustained badge `[S]` for Squad Mode abilities with `abilityType` set
- Activate button (bolt icon) for Squad Mode abilities
- Row dimming when character is in wrong mode (`mode-inactive` CSS class)
- Click handler: mode abilities use `buildAbilityActivationMessage`, specialty abilities use `createItemCard`

## Item Sheet (Psychic Power Pattern)

Special ability item sheet uses the psychic power visual pattern:
- Background image header with semi-transparent field inputs
- Clean vertical field list with consistent label alignment (100px min-width)
- Chapter icon (60x60px) in bottom-left corner for chapter-specific abilities (`chapterImg` field)
- Sheet height: 624px (matches psychic powers)
- Tabs: Description, Source

## Compendium Structure

### ID Convention
- Solo Mode Codex: `smcd00000000###`
- Solo Mode Chapter: `smch00000000###`
- Squad Mode Codex: `sqcd00000000###`
- Squad Mode Chapter: `sqch00000000###`

### Directory Structure
```
src/packs-source/specialties/special-abilities/
├── solo-mode/
│   ├── codex/               (6 Codex Solo Mode abilities)
│   ├── black-templars/
│   ├── blood-angels/
│   ├── dark-angels/
│   ├── space-wolves/
│   ├── storm-wardens/
│   └── ultramarines/
└── squad-mode/
    ├── codex/               (12 Codex Squad Mode abilities)
    ├── black-templars/
    ├── blood-angels/
    ├── dark-angels/
    ├── space-wolves/
    ├── storm-wardens/
    └── ultramarines/
```

## Chat Messages
- "Blue **Brother Castiel** enters Squad Mode"
- "Green **Brother Castiel** returns to Solo Mode"
- "Swords **Cohesion depleted** -- all Battle-Brothers return to Solo Mode"
- "Blue **Brother Castiel** activates **Fire Support** -- Cohesion: -2 (now 3 / 5)" + effect + improvements
- "Blue **Fire Support** deactivated"

## Files
```
src/module/helpers/mode-helper.mjs       ModeHelper (pure functions)
src/module/helpers/constants.mjs         MODES, MODE_LABELS (added)
src/module/data/actor/character.mjs      mode field (added)
src/module/data/item/special-ability.mjs Phase 2+3 fields (modeRequirement, requiredRank, chapter, abilityCategory, effect, improvements, abilityType, cohesionCost, sustained, action, chapterImg)
src/module/ui/cohesion-panel.mjs         Character mode list, toggle, auto-drop, Squad ability activation/deactivation
src/templates/ui/cohesion-panel.html     Mode indicator rows, active abilities section with canDeactivate
src/templates/item/item-special-ability-sheet.html  Psychic power pattern with background image header
src/templates/actor/actor-character-sheet.html       Smart column, row dimming, activate button, cost/sustained badges
src/styles/components/cohesion.css       Mode indicator styles, active abilities styles
src/styles/components/items.css          Mode-inactive dimming, squad badges
src/module/sheets/actor-sheet.mjs        Mode ability click handler, activate button handler
src/module/sheets/item-sheet.mjs         Height override for special-ability (624px)
src/module/deathwatch.mjs                Scene control hook, auto-drop hook, updateActor hook, activeSquadAbilities setting, socket listener
src/system.json                          socket: true (required for multiplayer)
tests/helpers/mode-helper.test.mjs       42 unit tests
tests/helpers/squad-ability-activation.test.mjs  18 unit tests
```

## Test Coverage

### File: `tests/helpers/mode-helper.test.mjs` -- 42 tests

| Describe Block | Tests |
|---------------|-------|
| canEnterSquadMode | 4 |
| getModeLabel | 4 |
| buildModeChangeMessage | 3 |
| buildCohesionDepletedMessage | 2 |
| isAbilityActiveForMode | 6 |
| meetsRankRequirement | 5 |
| meetsChapterRequirement | 4 |
| getQualifyingImprovements | 6 |
| buildAbilityActivationMessage | 8 |

### File: `tests/helpers/squad-ability-activation.test.mjs` -- 18 tests

| Describe Block | Tests |
|---------------|-------|
| canActivateSquadAbility | 6 |
| buildSquadActivationMessage | 5 |
| buildDeactivationMessage | 2 |
| isSustainingAbility | 5 |

## What Is NOT Automated
- **Support Range**: GM adjudicates whether characters are close enough (visual/vocal distance)
- **Full Action vs Cohesion Challenge**: The system tracks the resulting mode state, not the action type used to enter it
- **Ability effects**: Solo/Squad Mode abilities remain descriptive -- GM applies effects manually
- **Chapter restrictions**: Chapter-specific abilities are not system-enforced (GM adjudicates)
- **Tactical Expertise sharing**: Tactical Marine ability to share chapter abilities is narrative

## Future Phases

| Phase | Doc | Status | Description |
|-------|-----|--------|-------------|
| 1 | `01-mode-tracking.md` | Complete | Mode field, CohesionPanel display, toggle, auto-drop |
| 2 | `02-special-ability-modes.md` | Complete | Mode fields on special-ability, ModeHelper functions, smart display, activation chat |
| 3 | `03-squad-mode-abilities.md` | Complete | Squad Mode ability activation, Cohesion cost, sustained tracking, socket |

Planning docs: `docs/improvements/modes/planning/`

## Notes
- Mode is per-character (not world-level like Cohesion)
- Only `character` actor type has the `mode` field -- enemies/NPCs/hordes don't use modes
- Special abilities have three categories: mode-agnostic (always available), Solo-only, Squad-required
- The `special-ability` item type is NOT exclusively for mode abilities -- it covers all specialty abilities
- `system.json` must have `"socket": true` for multiplayer Squad Mode activation
- Sustaining check blocks ALL activations (sustained or not) when already sustaining
- `chapterImg` stores the chapter icon path directly (same pattern as psychic power `chapterImg`)
- `buildSquadActivationMessage` includes effect text and qualifying improvements (not just cost)
- Deactivate button visible to GM and ability initiator (not GM-only)
