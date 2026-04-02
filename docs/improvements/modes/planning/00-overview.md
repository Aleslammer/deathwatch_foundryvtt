# Solo Mode / Squad Mode — Implementation Plan

## Overview
Battle-Brothers operate in one of two modes: **Solo Mode** (default) or **Squad Mode**. Mode determines which abilities are available. Solo Mode abilities are personal combat enhancements; Squad Mode abilities are coordinated Kill-team actions that cost Cohesion.

## Key Rules
- All characters start in Solo Mode
- Entering Squad Mode: Full Action (automatic) or Free Action/Reaction (Cohesion Challenge)
- Squad Mode requires: ≥1 Cohesion AND in Support Range of a teammate
- Dropping to Solo Mode: Free Action (voluntary), or forced by 0 Cohesion / unconscious / out of range
- Support Range: Rank-based, GM-adjudicated (visual or vocal distance)

## Scope Clarification: Special Abilities vs Mode Abilities
The existing `special-ability` item type covers **all** specialty abilities, not just mode-related ones. There are three categories:

| Category | Example | Mode Restriction |
|----------|---------|-----------------|
| Mode-agnostic | Enhance Healing, Guardian of Purity, Improve Cover | None — always available |
| Solo Mode only | Bolter Mastery, Wings of Angels, Immovable Warrior | Solo Mode required |
| Squad Mode required | Create Toxins | Squad Mode required |

Additionally, Solo Mode and Squad Mode each have their own dedicated ability types:
- **Solo Mode Abilities**: Codex abilities (all chapters) + Chapter-specific abilities. Rank-gated, no XP cost.
- **Squad Mode Abilities**: Attack Patterns + Defensive Stances. Codex + Chapter-specific. Determined by squad leader's specialty/chapter. Cost Cohesion to activate. Can be Sustained.

The `special-ability` item type needs a `modeRequirement` field to distinguish these, but must NOT assume all special abilities are mode-locked.

## Phases

| Phase | Doc | Description |
|-------|-----|-------------|
| 1 | `01-mode-tracking.md` | Mode field on characters, CohesionPanel mode display, toggle with validation |
| 2 | `02-special-ability-modes.md` | Add `modeRequirement` field to special-ability, filter display by current mode |
| 3 | `03-squad-mode-abilities.md` | Squad Mode ability activation, Cohesion cost deduction, sustained ability tracking |

## What We're NOT Automating (GM Adjudicated)
- **Support Range checks**: Rank-based distance is narrative (visual/vocal). GM decides if characters are in range. No automated token distance measurement.
- **Ability effects**: Most Solo/Squad abilities have complex narrative effects (e.g., "add Toxic quality for INT Bonus rounds"). These remain descriptive — the GM applies effects manually.
- **Chapter-specific Squad Mode restrictions**: The rule that only same-chapter members benefit from chapter Squad Mode abilities is tracked narratively.

## Dependencies
- Cohesion system (Phase 1-2 complete — CohesionPanel, CohesionHelper, world settings)
- Cohesion Challenge (already implemented — `CohesionHelper.rollCohesionChallenge()`)
- Special Ability item type (exists — `DeathwatchSpecialAbility` DataModel)
