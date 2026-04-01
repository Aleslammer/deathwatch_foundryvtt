# Technology Stack

## Testing Infrastructure

### Jest Test Framework
- **Version**: 29.7.0
- **Configuration**: `jest.config.mjs`
- **Test Environment**: Node.js with ES modules
- **Test Pattern**: `**/tests/**/*.test.mjs`
- **Coverage**: Collected from `src/module/**/*.mjs`

### Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Setup
- **Setup File**: `tests/setup.mjs`
- **Purpose**: Mock Foundry VTT globals (game, ui, ChatMessage, Item, Actor, Application, foundry.utils, foundry.abstract.TypeDataModel, foundry.data.fields, game.settings) and provide mock factories (`createMockActor`, `createMockWeapon`)
- **Loaded**: Automatically via `setupFiles` in `jest.config.mjs`

### Coverage Reports
- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Data**: `coverage/coverage-final.json`
- **LCOV Format**: `coverage/lcov.info`
- **Clover XML**: `coverage/clover.xml`

### Test Files Structure
```
tests/
├── setup.mjs                           # Foundry VTT mocks
├── combat/                            # Combat system tests
│   ├── combat.test.mjs
│   ├── combat-dialog.test.mjs
│   ├── ranged-combat.test.mjs
│   ├── melee-combat.test.mjs
│   ├── horde-combat.test.mjs
│   ├── critical-effects.test.mjs
│   ├── force-weapon-channeling.test.mjs
│   ├── psychic-combat.test.mjs
│   ├── fire-helper.test.mjs
│   ├── gyro-stabilised.test.mjs
│   ├── lightning-claws.test.mjs
│   ├── melta.test.mjs
│   ├── overheats.test.mjs
│   ├── power-fist.test.mjs
│   ├── reliable.test.mjs
│   ├── resolve-ranged-attack.test.mjs
│   ├── resolve-melee-attack.test.mjs
│   ├── called-shot.test.mjs
│   └── deathwatch-training.test.mjs
├── documents/                         # Document tests
│   ├── actor.test.mjs
│   ├── actor-conditions.test.mjs
│   ├── horde.test.mjs
│   ├── item.test.mjs
│   ├── item-ammunition-modifiers.test.mjs
│   ├── item-force-weapon.test.mjs
│   ├── item-effective-range.test.mjs
│   ├── item-effective-weight.test.mjs
│   ├── item-weapon-upgrade-damage.test.mjs
│   ├── chapter-skill-costs.test.mjs
│   ├── chapter-talent-costs.test.mjs
│   ├── stackable-talents.test.mjs
│   ├── talent-xp.test.mjs
│   └── fatigue.test.mjs
├── helpers/                           # Helper tests
│   ├── xp-calculator.test.mjs
│   ├── chat-message-builder.test.mjs
│   ├── roll-dialog-builder.test.mjs
│   ├── righteous-fury-helper.test.mjs
│   ├── righteous-fury-threshold.test.mjs
│   ├── weapon-upgrade-helper.test.mjs
│   ├── wound-helper.test.mjs
│   ├── skill-loader.test.mjs
│   ├── cohesion.test.mjs
│   ├── constants.test.mjs
│   ├── debug.test.mjs
│   ├── foundry-adapter.test.mjs
│   ├── initiative.test.mjs
│   ├── item-handlers.test.mjs
│   ├── status-effects.test.mjs
│   └── templates.test.mjs
├── modifiers/                         # Modifier system tests
│   ├── modifier-collector.test.mjs
│   ├── modifier-collector-wounds.test.mjs
│   ├── modifier-collector-armor.test.mjs
│   ├── modifier-collector-damage.test.mjs
│   ├── modifier-collector-psy-rating.test.mjs
│   ├── modifiers.test.mjs
│   └── effects.test.mjs
├── weapon-qualities/                  # Weapon quality tests
│   ├── weapon-qualities.test.mjs
│   ├── weapon-quality-lookup.test.mjs
│   ├── weapon-quality-proven.test.mjs
│   ├── weapon-quality-razor-sharp.test.mjs
│   ├── weapon-quality-scatter.test.mjs
│   ├── weapon-quality-shocking.test.mjs
│   ├── weapon-quality-storm.test.mjs
│   ├── weapon-quality-tearing.test.mjs
│   ├── weapon-quality-toxic.test.mjs
│   ├── weapon-quality-twin-linked.test.mjs
│   ├── weapon-quality-drain-life.test.mjs
│   ├── weapon-quality-living-ammunition.test.mjs
│   └── weapon-quality-volatile.test.mjs
├── sheets/                            # Sheet tests
│   ├── actor-sheet.test.mjs
│   ├── actor-sheet-renown.test.mjs
│   ├── actor-sheet-talents-traits.test.mjs
│   ├── item-sheet.test.mjs
│   └── talents-traits-chat.test.mjs
├── data/                              # DataModel schema tests
│   └── item-models.test.mjs
├── integration/                       # Integration tests
│   └── characteristic-damage-integration.test.mjs
├── ammunition/                        # Ammunition round tests
│   └── ammunition-rounds.test.mjs
├── deathwatch.test.mjs                # Main entry point test
└── README.md                          # Testing documentation
```

## Programming Languages

### JavaScript (ES Modules)
- **Version**: ES2020+ features
- **Module System**: ES Modules (`.mjs` extension)
- **Usage**: All core system logic, documents, helpers, and sheets
- **Key Features Used**:
  - Import/export syntax
  - Async/await
  - Template literals
  - Destructuring
  - Spread operators
  - Optional chaining

### JSON
- **Usage**: Configuration and data schema files
- **Files**:
  - `system.json`: Foundry system manifest
  - `template.json`: Actor and Item data schemas
  - `package.json`: Node.js project configuration
  - Compendium source data

### CSS
- **Usage**: System styling
- **Files**: `src/styles/deathwatch.css`
- **Purpose**: Custom styling for character sheets and UI elements

### Handlebars
- **Usage**: HTML templating engine
- **Location**: `src/templates/`
- **Purpose**: Dynamic UI rendering for actor and item sheets

## Framework & Platform

### Foundry Virtual Tabletop (VTT)
- **Target Version**: 13
- **Compatibility**:
  - Minimum: v13
  - Verified: v13
  - Maximum: v13
- **API Usage**:
  - Document classes (Actor, Item)
  - TypeDataModel classes for programmatic data schemas (v13 pattern)
  - `foundry.data.fields` field types (StringField, NumberField, BooleanField, ArrayField, ObjectField, SchemaField, HTMLField)
  - Sheet classes (ActorSheet, ItemSheet)
  - Handlebars integration
  - Compendium packs (LevelDB)
  - Token attribute binding
  - Initiative system
  - Grid system (3m units)

## Build System

### Node.js
- **Version**: Specified in package.json (type: "module")
- **Purpose**: Build scripts and tooling
- **Package Manager**: npm (package-lock.json present)

### Build Scripts
- **Location**: `builds/scripts/`
- **compactJson.mjs**: Smart JSON formatter (key ordering + inline compaction)
- **compilePacks.mjs**: Converts source compendium data to LevelDB format
- **copyLocal.mjs**: Node.js script for local deployment
- **validatePacks.mjs**: Validates unique IDs, talent compendiumIds, weapon quality keys, embedded item sync
- **sortTalentJsons.mjs**: Sorts talent JSON properties and ensures compendiumId is set
- **validateTalentIds.mjs**: Verifies all talents have matching _id and compendiumId

### NPM Scripts
```json
{
  "format:json": "node builds/scripts/compactJson.mjs && prettier --write \"src/packs-source/**/*.json\"",
  "build:packs": "compactJson + prettier + validatePacks + compilePacks",
  "build:copy": "node builds/scripts/copyLocal.mjs",
  "build:all": "npm run build:packs && npm run build:copy"
}
```

## Dependencies

### Development Dependencies
- **classic-level**: ^1.4.1
  - LevelDB implementation for Node.js
  - Used for compendium pack compilation
  - Converts JSON source data to Foundry's database format
- **jest**: ^29.7.0 — Test framework
- **@jest/globals**: ^29.7.0 — Jest ES module support
- **prettier**: ^3.8.1 — Code formatter (JSON formatting in build pipeline)

### Runtime Dependencies
- None (relies on Foundry VTT platform)

## Data Storage

### LevelDB
- **Purpose**: Compendium pack storage
- **Location**: `src/packs/`
- **Format**: Binary database files
- **Source**: `src/packs-source/` (JSON/YAML)

### Foundry Database
- **Format**: NeDB (embedded database)
- **Managed By**: Foundry VTT platform
- **Stores**: Actors, Items, Scenes, etc.

## Development Commands

### Build Compendium Packs
```bash
npm run build:packs
```
Compiles source data from `src/packs-source/` into LevelDB format in `src/packs/`

### Local Deployment
```bash
npm run build:copy
```
Copies system files to local Foundry installation

## File Formats

### System Manifest (`system.json`)
- Defines system metadata
- Lists ES module entry points
- Declares compendium packs
- Specifies compatibility versions
- Configures initiative formula
- Sets grid defaults
- Defines token attributes

### Data Schema (`template.json`)
- Defines Actor types and templates
- Defines Item types and templates (fallback for types without DataModels)
- Specifies default values
- Establishes data structure
- Being incrementally replaced by TypeDataModel classes in `src/module/data/`

### Compendium Source
- **Format**: JSON
- **Structure**: Array of item/actor definitions
- **Location**: `src/packs-source/`
- **Categories**:
  - Ammunition
  - Armor
  - Gear
  - Weapons
  - Templates

## Development Environment

### Editor Configuration
- **File**: `.editorconfig`
- **Purpose**: Consistent code formatting across editors
- **Settings**: 2-space indent, LF line endings, UTF-8 charset

### Prettier Configuration
- **File**: `.prettierrc`
- **Settings**: 2-space indent, LF, double quotes, no trailing commas
- **Integration**: Runs in build pipeline after compactJson, format-on-save in VS Code
- **VS Code**: `.vscode/settings.json` enables format-on-save with Prettier as default formatter

### VS Code Workspace Settings
- **File**: `.vscode/settings.json`
- **Settings**: `editor.formatOnSave: true`, `editor.defaultFormatter: esbenp.prettier-vscode`

### Version Control
- **System**: Git
- **Ignore File**: `.gitignore`
- **Excludes**: node_modules, build artifacts, local configs

## System Configuration

### Initiative System
```javascript
"initiative": "1d10 + @agBonus + @initiativeBonus"
```
- Uses d10 dice
- Adds Agility Bonus
- Adds Initiative Bonus modifier

### Grid System
```javascript
"grid": {
  "distance": 3,
  "units": "m"
}
```
- 3 meters per grid square
- Metric units

### Token Attributes
- **Primary**: wounds (health tracking)
- **Secondary**: fatigue (exhaustion tracking)

## Module System

### Entry Point
- **File**: `src/module/deathwatch.mjs`
- **Loaded By**: Foundry via system.json esmodules array
- **Purpose**: Initialize system, register hooks, load components

### Module Organization
- **data/**: TypeDataModel classes (programmatic schemas per type)
- **documents/**: Document class extensions (Actor, Item)
- **helpers/**: Utility functions and calculations
- **modifiers/**: Modifier system logic
- **sheets/**: UI sheet classes

## Debug System

### Debug Flags
```javascript
DEBUG_FLAGS = {
  COMBAT: false,
  MODIFIERS: false,
  SHEETS: false
}
```
- Feature-specific debug logging
- Controlled via `debug.mjs`
- Console output with context labels

## Asset Management

### Icons
- **Location**: `src/icons/`
- **Categories**: ammo, armor, gear, weapons
- **Format**: Image files (PNG/SVG/WebP)
- **Purpose**: Visual representation in UI

### Styles
- **Location**: `src/styles/deathwatch.css`
- **Loaded By**: system.json styles array
- **Scope**: System-wide styling

## Deployment

### Distribution Format
- Compiled system folder
- Includes:
  - Compiled JavaScript modules
  - Compiled compendium packs (LevelDB)
  - Templates
  - Styles
  - Icons
  - Manifest files

### Installation
- Copy to Foundry `Data/systems/` directory
- Or install via Foundry's system installer (if published)
