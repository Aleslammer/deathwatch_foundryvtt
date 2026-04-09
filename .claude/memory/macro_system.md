---
name: macro_system
description: Three-tier macro architecture for player and GM automation
type: project
---

## Three-Tier Macro System

The system provides three ways to use macros, documented in `docs/macro-guide.md`:

### 1. Drag-and-Drop Item Macros

Drag items from character sheets to hotbar:
- **Weapons** → Opens attack dialog with combat options (aim, rate of fire, called shots)
- **Psychic Powers** → Opens Focus Power Test dialog
- **Other Items** → Posts description to chat

Weapon macros can be edited to pre-load options (see `docs/hotbar-macros.md`).

### 2. Compendium Macros (Ready-to-Use)

**Macros** compendium pack contains 7 pre-built macros:
- Combat reactions: Quick Dodge, Quick Parry, Dodge or Parry, Defensive Stance, Combat Reactions (advanced)
- GM tools: Flame Attack, On Fire Round

Located in `src/packs-source/macros/*.json`, compiled to `src/packs/macros/`.

See `docs/macros-compendium.md` for user guide.

### 3. Custom Scripting API

Public API for custom macro scripts:
- `game.deathwatch.rollSkill(actorId, skillName, options)`
- `game.deathwatch.rollCharacteristic(actorId, charKey, options)`
- `game.deathwatch.getDifficulties()` - Returns difficulty presets
- `game.deathwatch.getCharacteristics()` - Returns characteristic keys

**Implementation:**
- `src/module/api/skill-roller.mjs` - Skill test API (19 tests)
- `src/module/api/characteristic-roller.mjs` - Characteristic test API (18 tests)
- `src/module/helpers/roll-executor.mjs` - Shared roll logic

See `docs/macro-api.md` for complete API reference.

## RollExecutor Pattern

Roll execution logic centralized in `roll-executor.mjs` (eliminates 360 lines of duplication):

**Methods:**
- `executeSkillRoll(actor, skill, label, skillTotal, modifiers)` - Execute skill roll
- `executeCharacteristicRoll(actor, charValue, label, modifiers)` - Execute characteristic roll
- `showSkillDialog(...)` - Show dialog then execute
- `showCharacteristicDialog(...)` - Show dialog then execute (with cybernetic support)

**Used by:**
- Actor sheet roll handlers
- Macro API (skill-roller.mjs, characteristic-roller.mjs)
- Legacy characteristic handlers

This ensures all rolls behave identically regardless of source.

## Documentation Structure

All macro documentation lives in `docs/`:
- `macro-guide.md` - Main entry point (overview of all three types)
- `macros-compendium.md` - Guide to pre-built compendium macros
- `hotbar-macros.md` - Drag-and-drop item macros and weapon presets
- `macro-api.md` - Complete API reference for custom scripts
- `combat-reactions-guide.md` - Dodge/Parry mechanics reference
- `example-macros/` - 9 learning examples (not ready-to-use)

**File Naming Convention:** Use lowercase with hyphens (e.g., `macro-guide.md`, not `MACRO-GUIDE.md`).
