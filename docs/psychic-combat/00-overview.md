# Psychic Combat System — Overview

## Purpose
Automate the Focus Power workflow for psykers (Librarians, Tyranid creatures with Psy Rating). This follows the same dialog → roll → chat message pattern used by ranged and melee combat.

## Core Workflow (Deathwatch Core Rulebook, p. 185–188)

1. **Choose the Power Level** — Fettered, Unfettered, or Push
2. **Make a Focus Power Test** — Willpower Test + (5 × Effective PR) + modifiers. Roll of 91+ always fails.
3. **Apply the Effects** — Power manifests based on effective Psy Rating and Degrees of Success
4. **Check for Psychic Phenomena** — Side effects from Warp exposure (Unfettered doubles, Push always)

## Power Levels

| Level | Effective PR | WP Bonus | Phenomena | On Doubles |
|-------|-------------|----------|-----------|------------|
| Fettered | PR ÷ 2 (round up) | 5 × ePR | Never | Nothing |
| Unfettered | Full PR | 5 × ePR | On doubles | Phenomena |
| Push | PR + 3 | 5 × ePR | Always | +1 Fatigue |

## Phenomena & Perils

- **Psychic Phenomena**: Roll on `rolltable00000003` (1d100, 26 results)
- **Perils of the Warp**: Roll on `rolltable00000004` (1d100, 18 results)
  - Only triggered by Phenomena table result 75–100 ("Perils of the Warp" entry)
  - NOT triggered directly by power level — only via the Phenomena cascade
- **Fatigue**: Push + doubles on Focus Power Test = +1 Fatigue
- Both tables already exist in `src/packs-source/tables/`

## Doubles Detection

A roll has "doubles" when both digits are the same:
- 11, 22, 33, 44, 55, 66, 77, 88, 99
- Special case: 100 counts as 00 (doubles)

**Doubles effects by power level:**
- Fettered: Nothing
- Unfettered: Triggers Psychic Phenomena
- Push: +1 Fatigue (Phenomena already automatic)

## Psychic Righteous Fury

Psychic powers that deal damage can trigger Righteous Fury (Core Rulebook p. 245):

- **Trigger**: Natural 10 on damage dice (same as weapon attacks)
- **Confirmation**: Re-roll the Focus Power Test using the **same target number** as the original test
  - Success (roll ≤ target number) = Righteous Fury confirmed
  - Uses same WP + (5 × ePR) + modifiers, NOT a raw WP test
  - 91+ auto-fail still applies
- **No Phenomena**: The confirmation roll does NOT generate Psychic Phenomena or Perils, regardless of power level or doubles
- **Opposed powers**: If the original test was Opposed, the defender also re-rolls WP with same modifiers (Phase 3)

This reuses the existing `RighteousFuryHelper` but passes the Focus Power target number instead of BS/WS.

## Psychic Powers vs Hordes

Psychic powers have special hit rules against Hordes (Core Rulebook p. 359):

- **Base hits** = Effective Psy Rating used in the power
- **Area powers** = +1d10 additional hits
- Non-damage powers still inflict "hits" (magnitude loss from morale/disruption)

This follows the existing polymorphic pattern — `DeathwatchHorde.calculateHitsReceived()` already handles blast, flame, melee, and ranged. Psychic is a new category:

```javascript
// In calculateHitsReceived:
if (options.isPsychic) {
  let hits = options.effectivePR || 0;
  if (options.isAreaEffect) hits += options.areaRoll || 0;  // 1d10 rolled by caller
  return hits;
}
```

The 1d10 for area effects is rolled before calling `calculateHitsReceived` and passed in, keeping the method pure/testable.

## Existing Data

### Psychic Power Schema (`psychic-power.mjs`)
```
key         — unique identifier (e.g., "smite")
action      — "Half", "Full", "Extended (10)"
opposed     — "Yes" or "No"
range       — "10m x PR", "Self", "Special"
sustained   — "Yes" or "No"
cost        — XP cost (number)
class       — "Codex", "Telepathy", "Divination", "Chapter", "Tyranid"
description — HTML with full power details
```

### Power Categories by Effect Type
- **Damage**: Smite, Warp Blast, Warp Lance, Fury of the Ancients, Psychic Scream
- **Buff/Self**: Iron Arm, Might of the Ancients, Force Dome, Veil of Time
- **Control**: Compel, Dominate, Hypnotic Gaze
- **Utility**: Augury, Divination, Reading, Mind Scan, Telepathy powers
- **Healing/Drain**: Leech Essence, Catalyst

### Actor Psy Rating
- Characters: `actor.system.psyRating.value` (base + modifiers)
- Enemies: `actor.system.psyRating.value` (set directly)

## Implementation Phases

| Phase | Scope | Document |
|-------|-------|----------|
| 1 | Focus Power Dialog & Roll | `01-focus-power-test.md` |
| 2 | Phenomena & Perils Integration | `02-phenomena-perils.md` |
| 3 | Opposed Tests | `03-opposed-tests.md` (future) |
| 4 | Power-Specific Effects | `04-power-effects.md` (future) |

## New Modifier Effect Types

Two new effect types integrated into the existing modifier system:

| Effect Type | Purpose | Pattern |
|-------------|---------|--------|
| `psychic-test` | Additive bonus/penalty to Focus Power Test target number | Like `initiative` — summed from all sources |
| `no-perils` | Boolean flag — suppresses Perils of the Warp | Like `ignores-natural-armour` — presence = active |

These use the existing `ModifierCollector.collectAllModifiers(actor)` pipeline. Any equipped item, talent, trait, chapter, or armor history can provide these modifiers.

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/module/helpers/psychic-combat.mjs` | PsychicCombatHelper — dialog, roll, phenomena |
| `tests/combat/psychic-combat.test.mjs` | Unit tests for all calculation logic |

### Modified Files
| File | Change |
|------|--------|
| `src/module/helpers/constants.mjs` | Add `POWER_LEVEL` constants |
| `src/templates/actor/parts/actor-psychic-powers.html` | Add "Use" button per power |
| `src/module/sheets/actor-sheet.mjs` | Wire up Use Power click handler |
| `src/module/helpers/combat.mjs` | Add routing for psychic power use (or keep separate) |

## Design Decisions

1. **Separate helper** (`psychic-combat.mjs`) rather than adding to `combat.mjs` — psychic powers are distinct from weapon attacks
2. **Extract testable functions** — all math (effective PR, doubles detection, modifier building) as static methods
3. **Reuse FoundryAdapter** — for rolls, chat messages, notifications (testability)
4. **Reuse roll tables** — draw from existing Phenomena/Perils tables via Foundry API
5. **No power-specific automation in Phase 1** — just the Focus Power Test and Phenomena check; power effects are narrative for now
6. **Push has no WP penalty** — all three power levels use a normal Willpower Test; Push's cost is automatic Phenomena + Fatigue on doubles, not a test penalty
