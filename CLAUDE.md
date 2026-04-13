# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## System Overview

This is a **Foundry VTT v13 game system** for Warhammer 40,000: Deathwatch RPG. It implements:

- 4 actor types (Character, NPC, Enemy, Horde) with full combat mechanics
- 17 item types covering weapons, armor, talents, psychic powers, etc.
- 17 pre-built compendium packs with 800+ items and actors
- Complex combat system with 24+ weapon qualities, Righteous Fury, critical damage
- Cohesion & Kill-team system with Solo/Squad Mode abilities
- Psychic powers with Phenomena/Perils and Tyranid Hive Mind backlash
- Fire mechanics (On Fire status, flame weapons, extinguish tests)

---

## Development Commands

### Testing

```bash
npm test                    # Run all tests (1752 tests across 105 suites)
npm run test:watch          # Watch mode
npm run test:coverage       # Generate coverage report at coverage/lcov-report/index.html

# Run specific test file
npm test -- tests/combat/combat.test.mjs

# Run tests matching a pattern
npm test -- --testPathPattern="weapon-qualities"
```

### Build & Deploy

```bash
npm run format:json         # Compact and format all compendium JSON files
npm run build:packs         # Validate + compile packs to LevelDB
npm run build:copy          # Copy src/ to local Foundry installation (see .env)
npm run build:all           # Run build:packs + build:copy
```

**Local deployment**: Set `LOCAL_DIR` in `.env` to your Foundry systems directory (e.g., `\\thebrewery\Foundry\Data\systems\deathwatch`). Running `npm run build:copy` deploys the `src/` folder contents there.

---

## Architecture

### Foundry v13 TypeDataModel Pattern

The system uses Foundry v13's programmatic schema approach:

- **DataModel classes** (`src/module/data/`) define schemas and derived data computation for all actor/item types
- **Document classes** (`src/module/documents/`) are thin shells that delegate to DataModels
- Actor document: `src/module/documents/actor.mjs` (delegates to `DeathwatchActorBase` → `DeathwatchCharacter/Enemy/Horde/NPC`)
- Item document: `src/module/documents/item.mjs` (delegates to `DeathwatchItemBase` → 17 item DataModels)

### Polymorphic Combat System

Combat methods are defined in `DeathwatchActorBase` (`src/module/data/actor/base-actor.mjs`) and overridden as needed:

- `getArmorValue(location)` — Character looks up armor item by location; Horde uses single `system.armor` value
- `getDefenses()` — Returns armor map, natural armor, toughness bonus
- `receiveDamage(damageData)` — Main entry point for damage application (overridden by Horde for magnitude-based health)
- `receiveBatchDamage(damageArray)` — For hordes (multi-hit from Full Auto/Blast/Flame)

**Horde-specific combat** (`src/module/data/actor/horde.mjs`):

- Health = magnitude × 10 (e.g., magnitude 30 → 300 wounds)
- Single armor value (no hit locations)
- Blast/flame hits multiply by 1.5×, explosive weapons add +1d10 per hit
- Melee DoS-based hits (1 DoS = 1 hit, 3 DoS = 1d5 hits, 5 DoS = 1d10 hits)

### Helper Organization

Helpers contain pure business logic (testable without Foundry globals):

**Combat Helpers** (`src/module/helpers/combat/`):

- `combat.mjs` — Main combat logic (hit location, armor, damage application)
- `ranged-combat.mjs` — BS tests, range modifiers, rate of fire, jamming
- `melee-combat.mjs` — WS tests, charge, All Out Attack, Called Shot
- `horde-combat.mjs` — Magnitude damage, blast/flame/explosive hit multipliers
- `psychic-combat.mjs` — Focus Power tests, Psy Rating, Phenomena/Perils
- `weapon-quality-helper.mjs` — 24+ weapon qualities (Tearing, Accurate, Melta, Force, etc.)
- `weapon-upgrade-helper.mjs` — Weapon attachment modifiers
- `fire-helper.mjs` — Flame weapon targeting, catch fire tests, On Fire processing
- `critical-effects.mjs` — Critical damage tables (Energy/Explosive/Impact/Rending)
- `righteous-fury-helper.mjs` — Righteous Fury auto-confirm for xenos

**Character Helpers** (`src/module/helpers/character/`):

- `modifier-collector.mjs` — Collects all modifiers from items/talents/chapters/traits
- `modifiers.mjs` — Applies modifiers to characteristics/skills/armor/wounds/etc.
- `xp-calculator.mjs` — XP computation, rank determination
- `rank-helper.mjs` — Rank definitions (Initiate → Battle-Brother → Veteran → etc.)
- `wound-helper.mjs` — Max wounds calculation (SB + 2×TB + advances)
- `skill-loader.mjs` — Loads skill definitions from JSON

**UI Helpers** (`src/module/helpers/ui/`):

- `templates.mjs` — Preloads Handlebars templates
- `handlebars.js` — Custom Handlebars helpers

**Other Helpers**:

- `cohesion.mjs` — Cohesion pool calculation, damage, rally tests (migrated to FoundryAdapter ✅)
- `mode-helper.mjs` — Solo/Squad Mode activation, Squad Ability tracking
- `initiative.mjs` — Initiative dialog with modifier input
- `foundry-adapter.mjs` — Wraps Foundry API calls for testability (see below)
- `constants/` — System-wide constants organized by domain (combat, character, psychic, modifiers, squad)

### Modular Initialization Architecture

The system uses a clean modular initialization pattern (refactored 2026-04-05):

**Main entry point** (`src/module/deathwatch.mjs`): 100 lines

- Imports all modules and delegates initialization
- Hooks.once('init'): Register settings, configure CONFIG, register hooks, register sheets
- Hooks.once('ready'): Initialize socket, register chat handlers, create system macros

**Initialization modules** (`src/module/init/`):

- `settings.mjs` — `SettingsRegistrar.register()` — All world/client settings
- `config.mjs` — `ConfigRegistrar.configure()` — CONFIG.Combat, CONFIG.Actor/Item dataModels
- `hooks.mjs` — `InitHooks.register()` — Initiative override, actor/effect/combat/scene hooks
- `socket.mjs` — `SocketHandler.initialize()` — Socket listener, cohesion panel updates
- `ready-hook.mjs` — `ReadyHook.initialize()` — Hotbar drop, combat tracker defaults, system macros

**Chat handlers** (`src/module/chat/`):

- `button-handlers.mjs` — `ChatButtonHandlers.register()` — 10 chat button handlers (apply damage, shocking test, etc.)

**Pattern**: Each module exports a single class with a static `register()` or `initialize()` method. The main entry point calls these in order. This keeps the main file under 100 lines and makes initialization logic easy to test and maintain.

### Modifier System

Items, talents, chapters, and traits can modify character attributes via the `modifier` field:

```json
{
  "modifier": 5,
  "effectType": "characteristic",
  "valueAffected": "str",
  "enabled": true
}
```

**Effect types**:

- `characteristic` — +5 STR, +10 BS, etc. (applied pre-multiplier)
- `characteristic-post-multiplier` — Applied after Unnatural Characteristic multiplier
- `skill` — +10 to Awareness, +20 to Command, etc.
- `initiative` — Initiative bonus
- `wounds` — Max wounds adjustment
- `armor` — Armor bonus (all locations or specific location)
- `psy-rating` — Psy Rating modifier
- `movement` — Half/Full/Charge/Run movement modifier
- `movement-restriction` — Sets max movement type (e.g., "half" restricts to Half Action moves)
- `psychic-test` — Modifier to Focus Power tests
- `no-perils` — Suppresses Perils of the Warp (e.g., Psychic Hood)

Modifiers are collected by `modifier-collector.mjs` and applied by `modifiers.mjs` when computing derived data.

**Performance optimization**: Actor data models convert `actor.items` Map to Array once at the start of `prepareDerivedData()` and pass the array to all modifier methods. This eliminates redundant Map→Array conversions (previously 3+ per update, now only 1), providing ~3x performance improvement. The modifier collector methods accept both Map and Array for backward compatibility.

### Cybernetics System

**Location**: `src/module/helpers/cybernetic-helper.mjs`, `src/module/data/item/cybernetic.mjs`

Cybernetics can provide characteristic replacements (e.g., servo-arm replaces natural Strength). This is different from characteristic modifiers — the cybernetic provides a fixed value that completely replaces the natural characteristic.

**Cybernetic item fields**:

- `replacesCharacteristic` — "str", "ag", etc. (which characteristic is replaced)
- `replacementValue` — Fixed characteristic value (e.g., 75 for standard servo-arm)
- `unnaturalMultiplier` — Unnatural characteristic multiplier (e.g., 2 for Unnatural Strength x2)
- `replacementLabel` — Display name for UI (e.g., "Servo-Arm")
- `canBeModified` — Whether the replacement value can be affected by other modifiers (usually false)

**Weapon-cybernetic linking**:
Weapons can reference a cybernetic item via `weapon.system.cyberneticSource` (item ID). When set:

- Weapon damage rolls automatically use the cybernetic's strength bonus instead of character's natural strength
- Example: Servo-arm weapon has `dmg: "2d10+SBx2"` and `cyberneticSource: "cyb000000001"`
- When attacking with the weapon, system uses servo-arm's Str 75 (SB 14) instead of character's natural strength

**Characteristic test flow**:

1. Player clicks characteristic to roll a test (e.g., Strength test)
2. System checks for equipped cybernetics with `replacesCharacteristic: "str"`
3. If found, dialog shows source selector:
   - "Natural Strength (40) - Bonus: 4"
   - "Servo-Arm (75, Unnatural x2) - Bonus: 14"
4. Player selects source, roll proceeds with chosen value

**Example: Astartes Servo-Arm**

```json
{
  "type": "cybernetic",
  "system": {
    "equipped": true,
    "replacesCharacteristic": "str",
    "replacementValue": 75,
    "unnaturalMultiplier": 2,
    "replacementLabel": "Servo-Arm",
    "canBeModified": false
  }
}
```

Exceptional craftsmanship is handled by creating a separate compendium entry with different values (e.g., Str 85 instead of 75).

### Cohesion & Kill-Team System

Cohesion is a **world-level resource** stored in settings:

```javascript
game.settings.get("deathwatch", "cohesion"); // { value: 7, max: 10 }
game.settings.get("deathwatch", "squadLeader"); // Actor ID
game.settings.get("deathwatch", "cohesionModifier"); // GM modifier
game.settings.get("deathwatch", "activeSquadAbilities"); // Array of active Squad Mode abilities
```

**Key files**:

- `src/module/helpers/cohesion.mjs` — Cohesion calculation, damage, rally
- `src/module/ui/cohesion-panel.mjs` — Floating UI panel (toggle with shield icon in Token Controls)
- `src/module/helpers/mode-helper.mjs` — Solo/Squad Mode logic

**Cohesion calculation**: Squad Leader's FS Bonus + Rank + Command skill DoS + GM modifier

**Mode tracking**: Each character has `system.mode` (`solo` or `squad`). Cohesion panel shows all characters with colored indicators.

**Socket communication**: Non-GM players send `activateSquadAbility` / `deactivateSquadAbility` socket messages; GM processes them and updates world settings.

### Sheet Architecture

The system uses **Foundry ApplicationV2** sheets exclusively (as of 2026-04-08):

- **Actor sheet**: `src/module/sheets/actor-sheet-v2.mjs`
- **Item sheet**: `src/module/sheets/item-sheet-v2.mjs`
- Handlebars templates in `src/templates/`

**Action handler pattern**: Sheet event handlers are defined as static methods in the sheet class and registered in the `DEFAULT_OPTIONS.actions` object. Each action is referenced by name in the template using `data-action` attributes.

**Example**:

```javascript
// In actor-sheet-v2.mjs
static DEFAULT_OPTIONS = {
  actions: {
    rollSkill: DeathwatchActorSheetV2._onRollSkill,
    weaponAttack: DeathwatchActorSheetV2._onWeaponAttack,
    purchaseInsanityReduction: DeathwatchActorSheetV2._onPurchaseInsanityReduction,
    // ...
  }
};

// In template
<button data-action="rollSkill" data-skill="awareness">Roll Awareness</button>
```

**Shared handler modules**: Some handler classes in `src/module/sheets/shared/handlers/` are retained for backward compatibility and potential custom sheet implementations, but the v2 sheets use inline action handlers.

---

## Constants and Magic Numbers

**Location**: `src/module/helpers/constants/` (organized by domain)

All system-wide numeric constants are organized into domain-specific files with JSDoc comments referencing the source rulebook page. Use these constants instead of hardcoded "magic numbers".

**Constant files**:

- `combat-constants.mjs` — Combat modifiers, hit locations, ranges, enemy classifications
- `characteristic-constants.mjs` — Character stats, rolls, XP, wounds, initiative
- `psychic-constants.mjs` — Psychic power levels
- `modifier-constants.mjs` — Modifier and effect type system
- `squad-constants.mjs` — Squad mode, cohesion, hordes
- `index.mjs` — Re-exports all constants for convenience

**Key constants**:

- `CHARACTERISTIC_CONSTANTS.BONUS_DIVISOR` — Characteristic bonus = value / 10 (Core p. 31)
- `ROLL_CONSTANTS.DEGREES_DIVISOR` — Degrees of Success/Failure = difference / 10 (Core p. 27)
- `HIT_LOCATION_RANGES` — Hit location determination ranges (Core p. 243)
- `INITIATIVE_CONSTANTS` — Initiative formula and decimal precision
- `WOUNDS_CONSTANTS` — Wounds calculation multipliers (SB + 2×TB, Core p. 214)
- `HORDE_CONSTANTS` — Horde damage bonus calculation (magnitude / 10, Core p. 358)
- `RANGE_MODIFIERS` — Point Blank (+30), Short (+10), Normal (0), Long (-10), Extreme (-30)
- `COMBAT_PENALTIES` — Called Shot (-20), Running Target (-20)
- `COHESION` — Cohesion rank thresholds, command skill bonuses, damage thresholds

**Usage examples**:

```javascript
// Import from index.mjs (re-exports all)
import {
  CHARACTERISTIC_CONSTANTS,
  ROLL_CONSTANTS
} from "../helpers/constants/index.mjs";

// Or import from specific domain files
import {
  RANGE_MODIFIERS,
  HIT_LOCATIONS
} from "../helpers/constants/combat-constants.mjs";
import { CHARACTERISTICS } from "../helpers/constants/characteristic-constants.mjs";

// ✅ Good: Uses constant with documented source
const bonus = Math.floor(
  characteristic / CHARACTERISTIC_CONSTANTS.BONUS_DIVISOR
);
const dos = Math.floor((target - roll) / ROLL_CONSTANTS.DEGREES_DIVISOR);

// ❌ Bad: Magic number without explanation
const bonus = Math.floor(characteristic / 10);
const dos = Math.floor((target - roll) / 10);
```

---

## FoundryAdapter Pattern

**Location**: `src/module/helpers/foundry-adapter.mjs`

All Foundry VTT API calls should be routed through `FoundryAdapter` to enable:

1. **Testability** - Mock entire Foundry API in one place (see `tests/setup.mjs`)
2. **Version Migration** - Update Foundry API calls in one place when upgrading
3. **Error Handling** - Centralized error handling and logging
4. **Type Safety** - Consistent JSDoc documentation

**Adapter Coverage** (26 methods):

- **Rolls**: `evaluateRoll()`, `sendRollToChat()`
- **Chat**: `createChatMessage()`, `getChatSpeaker()`
- **Notifications**: `showNotification()`
- **Documents**: `updateDocument()`, `createEmbeddedDocuments()`, `deleteEmbeddedDocuments()`, `deleteDocument()`
- **Settings**: `getSetting()`, `setSetting()`, `registerSetting()` ⭐
- **Dialogs**: `showDialog()`, `showConfirmDialog()`, `showPromptDialog()` ⭐
- **Actors/Items**: `getActor()`, `getItem()`, `createActor()`, `createItem()`
- **User**: `isGM()`, `getUser()`
- **Socket**: `onSocketMessage()`, `emitSocketMessage()`

**Migration Status** (⏳ Gradual):

✅ **Fully migrated files**:

- `helpers/cohesion.mjs` - All 9 API calls migrated

⏳ **Partially migrated** (73+ settings calls, 21+ dialog calls across 20+ files):

- Pattern established, migration ongoing
- Priority: Settings API (most common), Dialog API (UI-heavy)

**Pattern Example**:

```javascript
// ❌ Before: Direct Foundry API call
const cohesion = game.settings.get("deathwatch", "cohesion");
await game.settings.set("deathwatch", "cohesion", newValue);
const actor = game.actors.get(actorId);

// ✅ After: Use FoundryAdapter
import { FoundryAdapter } from "./helpers/foundry-adapter.mjs";

const cohesion = FoundryAdapter.getSetting("deathwatch", "cohesion");
await FoundryAdapter.setSetting("deathwatch", "cohesion", newValue);
const actor = FoundryAdapter.getActor(actorId);
```

**When Migrating**:

1. Import `FoundryAdapter` at the top of the file
2. Replace direct API calls with adapter methods
3. Run tests to verify functionality
4. Document JSDoc comments clearly marking "Non-pure — uses Foundry API via FoundryAdapter"

**Note**: This is a gradual migration. New code should use the adapter. Existing code can be migrated opportunistically.

---

## Coding Standards

### Error Handling

**Location**: `src/module/helpers/error-handler.mjs`, `validation.mjs`

**Pattern**: Wrap all event listeners with `ErrorHandler.wrap(handler, context)`. Validate all user inputs with `Validation.requireX()` methods before processing.

**Utilities**:

- `ErrorHandler.wrap(handler, context)` — Wraps async handlers, catches errors, shows notifications
- `ErrorHandler.safe(promise, fallback)` — Returns fallback if promise fails (for non-critical operations)
- `Validation.requireInt(value, fieldName)` — Parse and validate integer
- `Validation.requireActor(actorId, context)` — Validate actor exists
- `Validation.requireDocument(document, docType, context)` — Validate any document exists
- `Validation.parseBoolean(value)` — Parse boolean from string
- `Validation.parseJSON(jsonString, fieldName)` — Parse JSON with error handling

**When to use error handling**:

- ✅ All sheet event listeners (click, change, drop handlers)
- ✅ All chat message button handlers
- ✅ All async operations that can fail (document updates, rolls, API calls)
- ✅ All user input parsing and validation
- ❌ Pure helper functions (errors caught at caller level)
- ❌ Synchronous getters/setters
- ❌ FoundryAdapter methods (they handle their own errors)

**Example pattern**: See `src/module/sheets/actor-sheet-v2.mjs` for comprehensive usage examples.

---

### Item Identification Pattern

**Rule**: Never match items by ID or name. IDs change when Foundry copies items, and names can be changed by users.

**Pattern**: Use a `key` field for stable identification across item copies.

**Implementation**:

- Add `...DeathwatchItemBase.keyTemplate()` to item schema (provides `key` field)
- Assign unique, stable keys in compendium source files (e.g., `"key": "servo-arm"`, `"key": "motion-predictor"`)
- Match items by comparing `item.system.key` values

**Examples**:

```javascript
// ✅ Good: Match by key
static async hasUpgrade(weapon, upgradeKey) {
  const upgrades = await this.getUpgrades(weapon);
  return upgrades.some(u => u.system.key === upgradeKey);
}

// ❌ Bad: Match by ID (changes when copied)
const upgrade = actor.items.get(upgradeId);

// ❌ Bad: Match by name (user can rename)
const upgrade = actor.items.find(i => i.name === "Motion Predictor");
```

**When to use**:

- ✅ Linking items (e.g., weapon → upgrade, weapon → cybernetic)
- ✅ Checking for specific items in code (e.g., "does actor have X talent?")
- ✅ Any cross-reference between items
- ❌ UI display (use name for display)
- ❌ User selection (user sees names, code converts to keys)

**Reference examples**: `src/module/helpers/combat/weapon-upgrade-helper.mjs`, `src/module/data/item/weapon-upgrade.mjs`

---

### HTML Sanitization (XSS Prevention)

**Location**: `src/module/helpers/sanitizer.mjs`

**Pattern**: Use `Sanitizer.escape(text)` or `Sanitizer.html` tagged template for all user-provided strings in HTML.

**Methods**:

- `Sanitizer.escape(text)` — Escapes HTML special characters
- `Sanitizer.html`\`template\` — Tagged template that auto-escapes all interpolated values

**When to sanitize**:

- ✅ Actor names, item names, weapon names (any `name` field)
- ✅ Hit locations from user input
- ✅ Any string from `dataset` attributes
- ✅ Dialog titles and content with user data
- ❌ System-generated constants ("Impact", "Energy")
- ❌ Numeric values (damage, penetration)
- ❌ Foundry API calls (they handle their own escaping)

**Example pattern**: See `src/module/helpers/chat-message-builder.mjs` for usage examples.

**Testing**: Always test with XSS payloads like `<script>alert("XSS")</script>` and `<img src=x onerror="alert(1)">`.

---

### Logging System

**Location**: `src/module/helpers/logger.mjs`

**Pattern**: Use `Logger` for all logging instead of direct `console.*` calls. Integrates with Foundry's logging infrastructure and provides user-configurable log levels.

**Methods**:

- `Logger.debug(context, ...args)` — Debug messages (verbose, for developers)
- `Logger.info(context, ...args)` — Important events (system initialization, etc.)
- `Logger.warn(context, ...args)` — Warnings (recoverable errors, deprecated usage)
- `Logger.error(context, ...args)` — Errors (unrecoverable failures)
- `Logger.compatibility(message, { since, until })` — Deprecation warnings

**Log levels** (configurable in Foundry settings):

- `CONSOLE` — Always output to browser console (for debugging, bypasses Foundry logger)
- `DEBUG` — Shows all messages (verbose)
- `INFO` — Shows info, warn, and error (default)
- `WARN` — Shows warnings and errors only
- `ERROR` — Shows errors only

**When to use**:

- ✅ System initialization/shutdown events
- ✅ Error conditions (use `Logger.error()`)
- ✅ Deprecation warnings (use `Logger.compatibility()`)
- ✅ Debug information for developers (use `Logger.debug()`)
- ❌ User-facing notifications (use `ui.notifications` instead)
- ❌ Chat messages (use `ChatMessage.create()`)

**Example usage**:

```javascript
import { Logger } from "../helpers/logger.mjs";

// System events
Logger.info("INIT", "System initialized");

// Debug information (only shown at DEBUG level)
Logger.debug("COMBAT", "Applying damage", { damage: 15, penetration: 4 });

// Warnings
Logger.warn("MODIFIERS", "Deprecated modifier type used");

// Errors
Logger.error("SKILLS", "Skills not loaded. Call SkillLoader.init() first.");

// Deprecation warnings
Logger.compatibility("rollItemMacro() is deprecated", {
  since: "2.1.0",
  until: "3.0.0"
});
```

**Migration note**: The old `debug()` function from `debug.mjs` is deprecated and now delegates to `Logger.debug()`. Update code to use `Logger` directly.

---

### Async/Await Consistency

**Rules**:

- All async functions must use `async`/`await` (no `.then()` or `.catch()` promise chains)
- Extract dialog callbacks >20 lines to named functions
- Each helper function should have single, clear responsibility
- No nested callback pyramids

**Error handling**: Async functions wrapped with `ErrorHandler.wrap()` automatically catch errors. Sheet class methods use try-catch blocks.

---

### JSDoc Documentation

**Required**: All public methods in helper classes, DataModels, sheets, and init modules must have JSDoc with `@param`, `@returns`, and brief description.

**Format**:

```javascript
/**
 * Brief one-line description (imperative: "Calculate", "Apply", "Get").
 *
 * Optional longer explanation of algorithm, edge cases, or behavior.
 *
 * @param {Type} paramName - Parameter description
 * @param {Type} [optionalParam] - Optional parameter
 * @returns {Type} Return value description
 */
```

**When required**:

- ✅ All public static methods in helper classes
- ✅ All public instance methods in DataModel classes
- ✅ All sheet class methods (getData, activateListeners, etc.)
- ✅ All methods in initialization modules
- ❌ Private methods (prefixed with `_`)
- ❌ Trivial getters/setters with obvious behavior
- ❌ Test helper methods

**Example**: See `src/module/helpers/combat/combat.mjs` for comprehensive JSDoc examples.

---

## Testing Approach

Tests use **Jest** with ES modules. Foundry VTT globals are mocked in `tests/setup.mjs`.

**Test structure**:

- `tests/` mirrors `src/module/` structure
- Each helper module has a corresponding `.test.mjs` file
- DataModel classes are tested directly (no Foundry instance needed)

**Key test files**:

- `tests/combat/combat.test.mjs` — Core combat mechanics
- `tests/combat/ranged-combat.test.mjs` — Ranged attacks, rate of fire, jamming
- `tests/combat/weapon-qualities.test.mjs` — All 24+ weapon qualities
- `tests/character/modifier-collector.test.mjs` — Modifier collection
- `tests/character/xp-calculator.test.mjs` — XP and rank computation
- `tests/helpers/error-handler.test.mjs` — Error handling utilities
- `tests/helpers/validation.test.mjs` — Input validation utilities

**FoundryAdapter pattern**: All Foundry API calls (e.g., `game.settings.get`, `ChatMessage.create`) are routed through `foundry-adapter.mjs`, which is mocked in tests. This allows 100% unit testing without a running Foundry instance.

---

## Compendium Pack System

**Source files**: `src/packs-source/` (JSON, version controlled)  
**Compiled packs**: `src/packs/` (LevelDB, generated, not version controlled)

### Adding Compendium Content

1. Create a JSON file in the appropriate `src/packs-source/` subdirectory
2. Assign a unique `_id` following the pack's ID convention (see `src/packs-source/_templates/` for examples)
3. Run `npm run build:packs` to validate and compile
4. The build will fail if any duplicate IDs are detected across all packs

### Pack ID Conventions

Each pack has a prefix pattern for IDs:

- Weapons: `weapon-xxx`
- Armor: `armor-xxx`
- Talents: `talent-xxx`
- Psychic Powers: `power-xxx`
- Enemies: `enemy-xxx` (individual), `horde-xxx` (hordes)

**Book references**: All compendium items include `book` and `page` fields (e.g., `"book": "Deathwatch Core Rulebook"`, `"page": "143"`).

---

## Key Conventions

### Combat Flow

1. **Attack roll** → `ranged-combat.mjs` or `melee-combat.mjs`
   - Opens dialog with modifiers (aim, range, rate of fire, etc.)
   - Rolls 1d100 vs modified characteristic
   - Computes DoS (Degrees of Success)
   - Determines hit locations (single/multi-hit)
   - Posts chat message with "Apply Damage" buttons

2. **Damage application** → `combat.mjs` → `applyDamage()`
   - Rolls damage (if not pre-rolled)
   - Applies weapon qualities (Tearing, Melta, Force, etc.)
   - Looks up armor by hit location
   - Computes damage reduction (armor + TB + penetration)
   - Applies wounds
   - Checks for critical damage (wounds > max)
   - Posts damage summary to chat

3. **Weapon qualities** → `weapon-quality-helper.mjs`
   - Each quality is a pure function: `applyQualityName(damageRoll, weaponData, attackData)`
   - Called during damage roll or damage application phase
   - Examples: Tearing (reroll 1s on damage dice), Accurate (+DoS to damage), Melta (2d10 at half range)

### Righteous Fury

**Ranged/Melee**: Roll 1d100 to confirm (target 95+). If confirmed, roll damage and crit.

**Deathwatch Training**: Auto-confirms Righteous Fury against xenos (no confirmation roll needed). Implemented in `righteous-fury-helper.mjs`.

### Psychic Powers

**Focus Power Test** (`psychic-combat.mjs`):

1. Select power level (Fettered/Unfettered/Push)
2. Roll 1d100 vs WP + modifiers
3. Compute effective Psy Rating (PR): base PR + power level modifier (−1/0/+1)
4. On success: resolve power effect, roll damage if applicable
5. On failure: roll on Psychic Phenomena (d100) → may cascade to Perils of the Warp (d100)

**Tyranid psykers**: Use Hive Mind backlash (1d10 Energy damage) instead of Phenomena/Perils.

**Opposed tests**: Powers like Compel, Dominate, Mind Probe trigger opposed WP tests. Chat message includes "Oppose Test" button for target.

### Fire System

**Flame weapons** (weapon quality: `flame`):

- Cone-based targeting (auto-hit within range)
- Individual targets: Agility dodge test → if failed, apply damage + catch fire test (AG)
- Hordes: ceil(range/4) + 1d5 hits, 1.5× multiplier

**On Fire status**:

- Applied to token via `actor.setCondition('on-fire', true)`
- Each round on actor's turn: GM prompted to apply fire effects
- Fire effects (`applyOnFireEffects`): 1d10 Energy damage (ignores armor), +1 Fatigue, WP test to act normally
- Power Armor: Auto-passes WP test
- Extinguish test: AG − 20 (Hard), removes On Fire status on success

**Fire macros**: Available in the Macros compendium (Compendium Packs > Deathwatch: Macros):

- 🔥 Flame Attack — GM targets token, enters damage/pen, applies flame mechanics
- 🔥 On Fire Round — GM targets token, applies On Fire effects for this round

### Hotbar Macros

**Drag & drop from character sheet**:

- **Weapons** → Attack/Damage choice dialog (or pre-load options in macro command)
- **Psychic powers** → Opens Focus Power Test directly
- **Other items** → Generic item roll (posts description to chat)

**Macro presets**: Edit the macro command to pre-load attack options. See `docs/hotbar-macros.md` for full list of options.

---

## Git Branch Strategy

**Main branch**: `main`  
**Development branch**: `claude` (current branch)

When creating PRs, target the `main` branch.

---

## Notes

- **Foundry version**: System is locked to Foundry v13 (compatibility minimum/verified/maximum all set to "13")
- **Grid**: 3 meters per square (metric)
- **Token bars**: Primary = Wounds, Secondary = Fatigue
- **Initiative formula**: `1d10 + @agBonus + @initiativeBonus`
- **Status effects**: Custom status effect list in `src/module/helpers/status-effects.mjs` (includes On Fire, Stunned, Prone, etc.)
- **Enemy auto-folder**: Newly created Enemy/Horde actors are automatically moved to an "Enemies" folder
- **Skip Defeated**: Combat tracker defaults to skipping defeated combatants
