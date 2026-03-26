# Warhammer 40k: Deathwatch — Foundry VTT System

A complete game system implementation for [Foundry Virtual Tabletop](https://foundryvtt.com/) that brings the Warhammer 40,000: Deathwatch tabletop RPG to the digital table. Manage Space Marine Kill-Teams, automate complex combat mechanics, and run campaigns in the Jericho Reach and beyond.

![Foundry v13](https://img.shields.io/badge/Foundry-v13-informational)
![Version](https://img.shields.io/badge/Version-0.0.2-blue)
![Tests](https://img.shields.io/badge/Tests-1060%20passing-brightgreen)

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

### Combat System
- **Ranged Combat**: BS-based attacks with aim, rate of fire (Single/Semi-Auto/Full-Auto), range modifiers, jamming, and ammunition tracking
- **Melee Combat**: WS-based attacks with All Out Attack, Charge, Called Shot, and Degrees of Success
- **Hit Locations**: Automatic determination with multi-hit location patterns
- **Damage Application**: Armor, penetration, Toughness Bonus, critical damage, and Righteous Fury
- **24+ Weapon Qualities**: Accurate, Tearing, Melta, Primitive, Force, Power Field, Twin-Linked, Storm, and more — all automated
- **Weapon Upgrades**: Attachable modifications (Red-Dot Laser Sight, Telescopic Sight, etc.)
- **Ammunition Modifiers**: Special ammo types that modify weapon damage, rate of fire, blast radius, and more
- **Initiative**: 1d10 + Agility Bonus + Initiative Bonus

### Enemy & Horde System
- Enemy actor type with full characteristics, skills, psy rating, and movement
- Horde actor type with magnitude-based health and single armor value
- Horde-specific combat: blast hits, flame hits, melee DoS-based hits, explosive bonuses
- Batch damage application with collapsible hit-by-hit summary messages
- Pre-built Tyranid enemies (Hormagaunt, Termagant) each with enemy and horde variants

### Psychic Powers
- Psy Rating system with modifier support (visible for Librarian specialty)
- 68 psychic powers across Codex, Divination, Telepathy, Chapter, and Tyranid disciplines
- Force weapon integration: passive damage/penetration bonus + active channeling via opposed Willpower

### Compendium Packs
17 pre-built compendium packs with book references and page numbers:

| Pack | Entries | Description |
|------|---------|-------------|
| Weapons | 87 | Imperial, Tau, and Tyranid weapons |
| Armor | 16 | Power Armor variants with histories |
| Ammunition | 20 | Bolt, energy, exotic, and special rounds |
| Gear | 56 | Equipment, tools, consumables, drugs |
| Talents | 281 | Combat, social, and specialist talents |
| Traits | 55 | Creature and character traits |
| Chapters | 9 | Space Marine chapters with XP cost overrides |
| Specialties | 17 | 6 specialties with special abilities |
| Implants | 19 | Standard Space Marine biological implants |
| Cybernetics | 1 | Mechanical augmentations |
| Weapon Qualities | 36 | Accurate, Tearing, Melta, Force, etc. |
| Weapon Upgrades | 14 | Sights, stabilisers, attachments |
| Psychic Powers | 68 | Codex, Divination, Telepathy, Chapter, Tyranid |
| Demeanours | 19 | Personality traits |
| Critical Effects | 160 | By damage type (Energy, Explosive, Impact, Rending) |
| Enemies | 14 | Tyranid and Ork enemies with horde variants |
| Roll Tables | 2 | Scatter, Haywire Field Effects |

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
| `npm test` | Run all tests (1060 tests across 81 suites) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
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
│   ├── helpers/               # 25+ helper modules (combat, modifiers, XP, etc.)
│   ├── sheets/                # Actor and Item sheet UI
│   └── deathwatch.mjs         # System entry point
├── packs-source/              # Compendium JSON source files (version controlled)
├── packs/                     # Compiled LevelDB packs (generated)
├── styles/                    # Modular CSS (variables, components)
├── templates/                 # Handlebars HTML templates
├── icons/                     # Item, weapon, enemy artwork
├── system.json                # Foundry system manifest
└── template.json              # Actor/Item type lists
tests/                         # Jest test suites
builds/scripts/                # Build, validation, and deployment scripts
```

### Architecture

The system uses Foundry v13's **TypeDataModel** pattern:

- **DataModel classes** (`src/module/data/`) define programmatic schemas and derived data logic for all 4 actor types and 17 item types
- **Document classes** (`src/module/documents/`) are thin shells that delegate to DataModels
- **Helper classes** (`src/module/helpers/`) contain pure business logic (combat calculations, modifier collection, XP computation) for testability
- **FoundryAdapter** wraps all Foundry API calls, enabling unit testing without a running Foundry instance

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

Supported effect types: `characteristic`, `characteristic-post-multiplier`, `skill`, `initiative`, `wounds`, `armor`, `psy-rating`, `movement`, `movement-restriction`

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
