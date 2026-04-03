# Warhammer 40k: Deathwatch — Foundry VTT System

A complete game system implementation for [Foundry Virtual Tabletop](https://foundryvtt.com/) that brings the Warhammer 40,000: Deathwatch tabletop RPG to the digital table. Manage Space Marine Kill-Teams, automate complex combat mechanics, and run campaigns in the Jericho Reach and beyond.

![Foundry v13](https://img.shields.io/badge/Foundry-v13-informational)
![Version](https://img.shields.io/badge/Version-0.0.2-blue)
![Tests](https://img.shields.io/badge/Tests-1458%20passing-brightgreen)

---

## Features

### Character Management
- Full character sheet with all nine Deathwatch characteristics (WS, BS, STR, TG, AG, INT, PER, WIL, FS)
- Comprehensive skill system with 100+ basic and advanced skills
- Characteristic advances (Simple → Intermediate → Trained → Expert, +5 each)
- Wounds and fatigue tracking with token bar integration
- Biography, chapter assignment, specialty selection, and rank progression
- XP tracking with automatic rank calculation and spent XP computation
- Modifier system supporting temporary and permanent adjustments from multiple sources
- Movement calculation with modifier and restriction support

### Combat System
- **Ranged Combat**: BS-based attacks with aim, rate of fire (Single/Semi-Auto/Full-Auto), range modifiers, jamming, and ammunition tracking
- **Melee Combat**: WS-based attacks with All Out Attack, Charge, Called Shot, and Degrees of Success
- **Hit Locations**: Automatic determination with multi-hit location patterns and Called Shot location selection
- **Damage Application**: Armor, penetration, Toughness Bonus, critical damage, and Righteous Fury
- **Target Size Modifiers**: Automatic hit modifiers based on target Size trait (Miniscule to Massive)
- **24+ Weapon Qualities**: Accurate, Tearing, Melta, Primitive, Force, Power Field, Twin-Linked, Storm, and more — all automated
- **Weapon Upgrades**: Attachable modifications (Red-Dot Laser Sight, Telescopic Sight, etc.)
- **Ammunition Modifiers**: Special ammo types that modify weapon damage, rate of fire, blast radius, and more
- **Flame Weapons**: Automatic routing for flame-quality weapons with cone-based targeting and On Fire status
- **Fire System**: On Fire round processing with damage, fatigue, Willpower tests, Power Armour auto-pass, and extinguish tests
- **Deathwatch Training**: Auto-confirms Righteous Fury against xenos targets
- **Initiative**: 1d10 + Agility Bonus + Initiative Bonus

### Psychic Powers
- Psy Rating system with modifier support (visible for Librarian specialty)
- 68 psychic powers across Codex, Divination, Telepathy, Chapter, and Tyranid disciplines
- **Focus Power Tests**: WP-based with power levels (Fettered/Unfettered/Push) and effective Psy Rating
- **Psychic Phenomena & Perils**: Auto-draws from roll tables with cascade mechanics
- **Opposed Willpower Tests**: For powers like Compel, Dominate, Mind Probe, and Tyranid psychic powers
- **Tyranid Psyker Backlash**: Hive Mind backlash (1d10 Energy) instead of Phenomena/Perils tables
- **Psychic Damage Powers**: PR substitution in damage formulas, auto-roll, horde hits
- Force weapon integration: passive damage/penetration bonus + active channeling via opposed Willpower

### Cohesion & Kill-Team
- **Cohesion Pool**: Shared Kill-team resource based on squad leader's Fellowship Bonus + rank + Command skill + GM modifier
- **Cohesion Panel**: Floating UI window with +1/−1, Recalculate, Edit, Set Leader, and Cohesion Challenge buttons
- **Cohesion Challenge**: 1d10 ≤ current Cohesion to pass (for entering/maintaining Squad Mode)
- **Solo/Squad Mode**: Per-character mode tracking with colored indicators in Cohesion Panel
- **Solo Mode Abilities**: Personal combat enhancements (Codex and Chapter-specific), rank-gated
- **Squad Mode Abilities**: Coordinated Kill-team actions (Attack Patterns, Defensive Stances) that cost Cohesion
- **Sustained Tracking**: Active sustained abilities displayed in Cohesion Panel with deactivation controls
- **Auto-Drop**: All characters forced to Solo Mode when Cohesion reaches 0
- **Multiplayer Support**: Socket-based Squad Mode activation for non-GM players

### Enemy & Horde System
- Enemy actor type with full characteristics, skills, psy rating, and movement
- Horde actor type with magnitude-based health and single armor value
- Horde-specific combat: blast hits, flame hits, melee DoS-based hits, explosive bonuses
- Batch damage application with collapsible hit-by-hit summary messages
- Natural Armour system with ignores-natural-armour ammunition support
- Enemy classification (human/xenos/chaos) for Deathwatch Training integration
- Pre-built Tyranid and Ork enemies with horde variants

### Hotbar Macros
- Drag weapons from Gear tab to hotbar → click for Attack/Damage choice dialog
- Drag psychic powers from Psychic Powers tab to hotbar → click opens Focus Power Test directly
- Other items fall through to generic item roll (posts description to chat)
- **Macro Presets**: Right-click a weapon macro and edit the command to pre-load combat options (rate of fire, aim, called shot, etc.) — see [Hotbar Macros Guide](docs/hotbar-macros.md)

### Compendium Packs
17 pre-built compendium packs with book references and page numbers:

| Pack | Entries | Description |
|------|---------|-------------|
| Weapons | 93 | Imperial, Tau, Ork, and Tyranid weapons |
| Armor | 16 | Power Armor variants with histories |
| Ammunition | 21 | Bolt, energy, exotic, and special rounds |
| Gear | 56 | Equipment, tools, consumables, drugs |
| Talents | 281 | Combat, social, and specialist talents |
| Traits | 65 | Creature and character traits |
| Chapters | 9 | Space Marine chapters with XP cost overrides |
| Specialties | 53 | 6 specialties + 47 Solo/Squad Mode special abilities |
| Implants | 19 | Standard Space Marine biological implants |
| Cybernetics | 1 | Mechanical augmentations |
| Weapon Qualities | 38 | Accurate, Tearing, Melta, Force, etc. |
| Weapon Upgrades | 14 | Sights, stabilisers, attachments |
| Psychic Powers | 68 | Codex, Divination, Telepathy, Chapter, Tyranid |
| Demeanours | 19 | Personality traits |
| Critical Effects | 160 | By damage type (Energy, Explosive, Impact, Rending) |
| Enemies | 35 | Tyranid and Ork enemies with horde variants |
| Roll Tables | 4 | Scatter, Haywire, Psychic Phenomena, Perils of the Warp |

---

## Installation

### From Foundry VTT
> **TBD** — Manifest URL installation is not yet available. Use manual installation below.

### Manual Installation
1. Clone or download this repository
2. Copy the `src/` folder contents to `{FoundryData}/Data/systems/deathwatch/`
3. Restart Foundry VTT

---

## Development

### Prerequisites
- [Node.js](https://nodejs.org/) (ES modules support)
- [Foundry VTT v13](https://foundryvtt.com/)

### Setup
```bash
git clone https://github.com/Aleslammer/deathwatch_foundryvtt.git
cd deathwatch_foundryvtt
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (1458 tests across 90 suites) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run format:json` | Compact + Prettier JSON formatting |
| `npm run build:packs` | Validate and compile compendium packs |
| `npm run build:copy` | Deploy to local Foundry installation |
| `npm run build:all` | Validate + build packs + deploy |

### Project Structure
```
src/
├── module/
│   ├── data/                  # TypeDataModel classes (v13 programmatic schemas)
│   │   ├── actor/             # Character, NPC, Enemy, Horde DataModels
│   │   └── item/              # 17 item type DataModels
│   ├── documents/             # Actor & Item document shells
│   ├── helpers/               # 30+ helper modules
│   │   ├── combat/            # Combat logic (11 files)
│   │   ├── character/         # Character data computation (6 files)
│   │   └── ui/                # UI/presentation helpers (5 files)
│   ├── ui/                    # UI Application classes (CohesionPanel)
│   ├── sheets/                # Actor and Item sheet UI
│   └── deathwatch.mjs         # System entry point
├── packs-source/              # Compendium JSON source files (version controlled)
├── packs/                     # Compiled LevelDB packs (generated)
├── styles/                    # Modular CSS (variables, 10 component files)
├── templates/                 # Handlebars HTML templates
├── icons/                     # Item, weapon, enemy artwork
├── system.json                # Foundry system manifest
└── template.json              # Actor/Item type lists
tests/                         # Jest test suites (90 files)
builds/scripts/                # Build, validation, and deployment scripts
```

### Architecture

The system uses Foundry v13's **TypeDataModel** pattern:

- **DataModel classes** (`src/module/data/`) define programmatic schemas and derived data logic for all 4 actor types and 17 item types
- **Document classes** (`src/module/documents/`) are thin shells that delegate to DataModels
- **Helper classes** (`src/module/helpers/`) contain pure business logic (combat calculations, modifier collection, XP computation) for testability
- **Polymorphic combat** — `DeathwatchActorBase` defines combat methods (`getArmorValue`, `getDefenses`, `receiveDamage`, etc.) overridden by Horde for magnitude-based mechanics
- **FoundryAdapter** wraps all Foundry API calls, enabling unit testing without a running Foundry instance
- **Socket communication** for multiplayer Squad Mode activation

### Testing

Tests use **Jest** with ES modules. Foundry VTT globals are mocked in `tests/setup.mjs`.

```bash
# Run a single test file
npm test -- tests/combat/combat.test.mjs

# Run tests matching a pattern
npm test -- --testPathPattern="weapon-qualities"
```

Coverage reports are generated at `coverage/lcov-report/index.html`.

### Adding Compendium Content

1. Create a JSON file in the appropriate `src/packs-source/` subdirectory
2. Assign a unique `_id` following the pack's ID convention (see `_templates/` for examples)
3. Run `npm run build:packs` to validate and compile
4. The build will fail if any duplicate IDs are detected across all packs

### Modifier System

Items, talents, chapters, and traits can modify character attributes via the modifier system:

```json
{
  "name": "Chapter Strength Bonus",
  "modifier": 5,
  "effectType": "characteristic",
  "valueAffected": "str",
  "enabled": true
}
```

Supported effect types: `characteristic`, `characteristic-post-multiplier`, `skill`, `initiative`, `wounds`, `armor`, `psy-rating`, `movement`, `movement-restriction`, `psychic-test`, `no-perils`

---

## Configuration

### Grid
- 3 meters per grid square (metric)

### Token Attributes
- **Primary bar**: Wounds
- **Secondary bar**: Fatigue

### Initiative Formula
```
1d10 + Agility Bonus + Initiative Bonus
```

---

## Credits

- **Author**: Aleslammer
- **Game**: Warhammer 40,000: Deathwatch RPG by Fantasy Flight Games
- **Platform**: [Foundry Virtual Tabletop](https://foundryvtt.com/)

---

## License

This is a fan-made, non-commercial project. Warhammer 40,000: Deathwatch is © Games Workshop Limited and Fantasy Flight Games. This system is not affiliated with or endorsed by Games Workshop or Fantasy Flight Games.
