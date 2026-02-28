# Project Structure

## Directory Organization

### Root Level
```
deathwatch_foundryvtt/
├── .amazonq/rules/memory-bank/    # AI assistant memory bank documentation
├── builds/scripts/                 # Build and deployment scripts
├── src/                            # Main source code directory
├── package.json                    # Node.js project configuration
└── README.md                       # Project documentation
```

### Source Directory (`src/`)
The main application code organized by functional areas:

```
src/
├── icons/                          # Visual assets for items
│   ├── ammo/                       # Ammunition icons
│   ├── armor/                      # Armor icons
│   ├── gear/                       # Equipment icons
│   └── weapons/                    # Weapon icons
├── module/                         # Core system logic
│   ├── documents/                  # Data model definitions
│   ├── helpers/                    # Utility functions
│   ├── modifiers/                  # Modifier system
│   ├── sheets/                     # UI sheet implementations
│   └── deathwatch.mjs              # Main entry point
├── packs/                          # Compiled compendium data
│   ├── ammunition/
│   ├── armor/
│   ├── gear/
│   └── weapons/
├── packs-source/                   # Source data for compendiums
│   ├── _templates/
│   ├── ammunition/
│   ├── armor/
│   ├── gear/
│   └── weapons/
├── styles/                         # CSS styling
│   └── deathwatch.css
├── templates/                      # Handlebars HTML templates
│   ├── actor/                      # Character/NPC sheets
│   └── item/                       # Item sheets
├── system.json                     # Foundry system manifest
└── template.json                   # Data schema definitions
```

## Core Components

### 1. System Entry Point
- **deathwatch.mjs**: Main initialization file that bootstraps the system
  - Registers document types
  - Loads helpers and utilities
  - Initializes sheets
  - Sets up Handlebars templates

### 2. Document Models (`module/documents/`)
- **actor.mjs**: Defines Actor document behavior (characters, NPCs)
  - Character data preparation
  - Derived value calculations (bonuses, totals)
  - Actor-specific methods
- **item.mjs**: Defines Item document behavior (weapons, armor, gear, etc.)
  - Item data preparation
  - Equipment state management
  - Item-specific methods

### 3. Helper Modules (`module/helpers/`)
- **xp-calculator.mjs**: XP and rank calculations (pure functions)
- **modifier-collector.mjs**: Modifier collection and application
- **roll-dialog-builder.mjs**: Roll dialog HTML generation and parsing
- **chat-message-builder.mjs**: Chat message formatting and creation
- **item-handlers.mjs**: Item categorization and processing
- **combat.mjs**: Combat system logic (weapon attacks, damage, hit locations)
- **combat-dialog.mjs**: Combat dialog utilities (pure functions)
- **config.mjs**: System configuration (DWConfig object)
- **constants.mjs**: Game constants (XP, characteristics, rolls)
- **critical-effects.mjs**: Critical damage effects
- **debug.mjs**: Debug logging with feature flags
- **effects.mjs**: Active effects and modifiers
- **foundry-adapter.mjs**: Foundry API wrapper for testability
- **handlebars.js**: Custom Handlebars helpers
- **initiative.mjs**: Initiative rolling
- **modifiers.mjs**: Modifier CRUD operations
- **templates.mjs**: Template preloading

### 4. Sheet Classes (`module/sheets/`)
- **actor-sheet.mjs**: Character and NPC sheet UI logic
  - Renders character sheets
  - Handles user interactions
  - Manages sheet data flow
- **item-sheet.mjs**: Item sheet UI logic
  - Renders item configuration sheets
  - Handles item editing

### 5. Data Schema (`template.json`)
Defines the data structure for:
- **Actor Types**: character, npc
  - Base template with wounds and fatigue
  - Character-specific data (characteristics, skills, modifiers)
- **Item Types**: weapon, armor, armor-history, gear, ammunition, characteristic
  - Base template with description
  - Type-specific properties

### 6. Compendium System
- **packs-source/**: Human-readable source data (JSON/YAML)
- **packs/**: Compiled LevelDB format for Foundry
- **builds/scripts/compilePacks.mjs**: Converts source to compiled format

### 7. UI Templates (`templates/`)
Handlebars templates for rendering:
- Actor sheets (character/NPC views)
- Item sheets (weapon/armor/gear configuration)

## Architectural Patterns

### Document-Oriented Architecture
- Extends Foundry's Document base classes (Actor, Item)
- Data-driven design with schema validation
- Separation of data model and presentation

### Helper/Utility Pattern
- Centralized helper functions in `module/helpers/`
- Reusable logic across documents and sheets
- Debug utilities with feature flags

### Template-Based UI
- Handlebars templates for all UI rendering
- Custom helpers for game-specific formatting
- Separation of logic and presentation

### Modifier System
- Centralized modifier management
- Applied to actors and items
- Supports temporary and permanent modifications

### Compendium Build Pipeline
- Source-controlled item data
- Build script for compilation
- Separation of source and distribution formats

### Foundry Adapter Pattern
- **FoundryAdapter**: Wraps all Foundry VTT API calls for testability
  - Roll evaluation and chat messages
  - UI notifications
  - Document updates
  - Chat speaker management
- **CanvasHelper**: Wraps canvas-specific operations
  - Token distance measurement
- Enables unit testing of business logic by mocking adapter
- Keeps platform-specific code isolated and maintainable

### Current Architecture (Post-Refactoring)
- Clean separation: documents, sheets, helpers
- Helper classes for business logic (XPCalculator, ModifierCollector, etc.)
- Modular CSS with variables and low specificity
- Handlebars partials for reusable templates
- Named constants instead of magic numbers

## Component Relationships

```
deathwatch.mjs (Entry Point)
    ↓
    ├─→ Documents (actor.mjs, item.mjs)
    │       ↓
    │       └─→ Helpers (modifiers, effects, combat)
    │
    ├─→ Sheets (actor-sheet.mjs, item-sheet.mjs)
    │       ↓
    │       └─→ Templates (Handlebars HTML)
    │               ↓
    │               └─→ Handlebars Helpers
    │
    └─→ Configuration (config.mjs, constants.mjs)
```

### Data Flow
1. **Initialization**: deathwatch.mjs loads all modules
2. **Document Creation**: Actors/Items instantiated from schema
3. **Data Preparation**: Documents calculate derived values using helpers
4. **Rendering**: Sheets render templates with prepared data
5. **User Interaction**: Sheets handle events, update documents
6. **Persistence**: Foundry saves document changes to database

## Key Design Decisions

### ES Modules
- Uses `.mjs` extension for ES module syntax
- Modern JavaScript import/export
- Better tree-shaking and dependency management

### Foundry VTT v13 Compatibility
- Targets Foundry VTT version 13
- Uses v13 API patterns and conventions
- Minimum, verified, and maximum version specified

### Characteristic-Based System
- Nine core characteristics (WS, BS, STR, TG, AG, INT, PER, WIL, FS)
- Bonus values calculated from characteristics
- Skills tied to specific characteristics

### Location-Based Armor
- Separate armor values for six body locations
- Supports realistic damage modeling
- Armor histories for customization

### Requisition System
- Items have requisition (req) and renown requirements
- Reflects Deathwatch RPG's resource management
- Book and page references for all items
