# Psychic Combat System

## Overview
Automates the Focus Power workflow for psykers (Librarians, Tyranid creatures with Psy Rating). Follows the same dialog → roll → chat message pattern as ranged and melee combat.

## Architecture

### Core File
- **combat/psychic-combat.mjs**: `PsychicCombatHelper` — static helper class with pure calculation functions + dialog + table integration

### Integration Points
- **sheets/actor-sheet.mjs**: `.psychic-power-use` click handler calls `PsychicCombatHelper.focusPowerDialog()`
- **templates/actor/parts/actor-psychic-powers.html**: ⚡ "Use Power" button per power (bolt icon)
- **helpers/constants.mjs**: `POWER_LEVELS`, `POWER_LEVEL_LABELS`, `PSYCHIC_TEST` and `NO_PERILS` effect types
- **helpers/character/modifier-collector.mjs**: Existing `collectAllModifiers()` collects `psychic-test` and `no-perils` modifiers

## Focus Power Test Rules (Core Rulebook p. 185–188)

### Target Number
```
Target = Willpower + WP Bonus (up to 5 × ePR) + psychic-test modifiers + misc modifier
```
- Capped at 90 (roll of 91+ always fails)
- WP Bonus is editable in dialog (default = max, player may choose less per "may add" rule)

### Power Levels

| Level | Effective PR | Phenomena | On Doubles |
|-------|-------------|-----------|------------|
| Fettered | ceil(PR ÷ 2) | Never | Nothing |
| Unfettered | Full PR | On doubles | Phenomena |
| Push | PR + 3 | Always | +1 Fatigue |

### Phenomena & Perils
- **Psychic Phenomena**: Auto-draws from `rolltable00000003` when triggered
- **Perils of the Warp**: Only via Phenomena cascade (result 75–100), draws from `rolltable00000004`
- Perils are NOT triggered directly by any power level
- Table lookup: world tables first, falls back to `deathwatch.tables` compendium

### Doubles Detection
Roll has doubles when both digits match: 11, 22, 33, ..., 99, 100 (treated as 00).

## New Modifier Effect Types

### psychic-test
Additive bonus/penalty to Focus Power Test target number.
```json
{ "effectType": "psychic-test", "modifier": 10, "name": "Psychic Hood" }
```
- Collected from all standard sources (actor, equipped items, chapters, traits, talents, armor histories)
- No `valueAffected` needed (like initiative/wounds)

### no-perils
Boolean flag — suppresses Perils of the Warp cascade.
```json
{ "effectType": "no-perils", "modifier": "1", "name": "Warp Stabiliser" }
```
- Presence = active (modifier value ignored, same pattern as `ignores-natural-armour`)
- Phenomena still trigger normally; only Perils cascade is suppressed
- Chat shows: "🛡 Perils of the Warp suppressed by [source name]"

## Pure Functions (Testable)

| Function | Purpose |
|----------|---------|
| `calculateEffectivePsyRating(basePR, powerLevel)` | Fettered ceil(÷2), Unfettered full, Push +3 |
| `isDoubles(roll)` | Doubles detection (100 = 00) |
| `checkPsychicEffects(roll, powerLevel)` | Returns `{ phenomena, fatigue }` |
| `collectPsychicModifiers(allModifiers)` | Filters for psychic-test and no-perils |
| `buildFocusPowerModifiers(wp, wpBonus, misc, psychicMods)` | Target number + modifier parts, capped at 90 |
| `buildFocusPowerLabel(...)` | Chat header (power name, target, ePR, success/fail) |
| `buildFocusPowerFlavor(label, parts, phenomenaLine)` | Collapsible `<details>` modifier breakdown |
| `buildPhenomenaLine(effects, powerLevel)` | ⚡/💀 status lines |

## Dialog Layout
- Power image centered at top (100×100px, matching ranged/melee pattern)
- Power info: Action, Range, Opposed, Sustained
- Power Level select (Fettered/Unfettered/Push) — dynamically updates ePR and WP Bonus max
- Effective PR display (read-only)
- WP Bonus input (editable, 0 to 5×ePR, defaults to max)
- Misc Modifier input

## Chat Message Format
Uses collapsible `<details>` modifier breakdown matching `buildAttackFlavor` pattern:
```
[Focus Power] Smite — Target: 80
Effective Psy Rating: 5 (Unfettered)
SUCCESS (5 Degrees of Success)
⚡ PSYCHIC PHENOMENA — Doubles rolled!
▸ Modifiers
  55 Base Willpower
  +25 Psy Rating Bonus
```

## Stored State
- `PsychicCombatHelper.lastFocusPowerTarget` — stored for Phase 4 Righteous Fury confirmation

## Test Coverage

### File: `tests/combat/psychic-combat.test.mjs` — 67 tests

| Describe Block | Tests |
|---------------|-------|
| calculateEffectivePsyRating | 10 |
| isDoubles | 14 |
| checkPsychicEffects | 8 |
| collectPsychicModifiers | 8 |
| buildFocusPowerModifiers | 12 |
| buildFocusPowerLabel | 6 |
| buildFocusPowerFlavor | 4 |
| buildPhenomenaLine | 5 |

## Future Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Complete | Focus Power dialog, WP roll, chat output |
| 2 | ✅ Complete | Phenomena/Perils table integration, fatigue |
| 3 | Planned | Opposed Willpower Tests (powers with `opposed: "Yes"`) |
| 4 | Planned | Power-specific effects (damage, buffs, horde hits, Righteous Fury) |

Planning docs: `docs/psychic-combat/` (00-overview through 04-power-effects)

## Key Rules for Future Phases
- **Psychic vs Hordes**: Hits = Effective PR (+1d10 for area powers)
- **Righteous Fury**: Confirmation uses stored Focus Power target number (not raw WP). Confirmation roll does NOT trigger Phenomena.
- **Opposed Tests**: Powers with `opposed: "Yes"` — psyker must succeed AND beat target's WP test
