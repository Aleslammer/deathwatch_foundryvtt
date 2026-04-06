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
npm test                    # Run all tests (1633 tests across 98 suites)
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
- `cohesion.mjs` — Cohesion pool calculation, damage, rally tests
- `mode-helper.mjs` — Solo/Squad Mode activation, Squad Ability tracking
- `initiative.mjs` — Initiative dialog with modifier input
- `foundry-adapter.mjs` — Wraps all Foundry API calls for unit testing (mocked in `tests/setup.mjs`)

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

### Cohesion & Kill-Team System

Cohesion is a **world-level resource** stored in settings:

```javascript
game.settings.get('deathwatch', 'cohesion')        // { value: 7, max: 10 }
game.settings.get('deathwatch', 'squadLeader')      // Actor ID
game.settings.get('deathwatch', 'cohesionModifier') // GM modifier
game.settings.get('deathwatch', 'activeSquadAbilities') // Array of active Squad Mode abilities
```

**Key files**:
- `src/module/helpers/cohesion.mjs` — Cohesion calculation, damage, rally
- `src/module/ui/cohesion-panel.mjs` — Floating UI panel (toggle with shield icon in Token Controls)
- `src/module/helpers/mode-helper.mjs` — Solo/Squad Mode logic

**Cohesion calculation**: Squad Leader's FS Bonus + Rank + Command skill DoS + GM modifier

**Mode tracking**: Each character has `system.mode` (`solo` or `squad`). Cohesion panel shows all characters with colored indicators.

**Socket communication**: Non-GM players send `activateSquadAbility` / `deactivateSquadAbility` socket messages; GM processes them and updates world settings.

### Sheet Architecture

The system has **two sheet implementations** (toggled via user setting):

1. **v1 sheets** (default): `src/module/sheets/actor-sheet.mjs`, `src/module/sheets/item-sheet.mjs`
   - Uses Foundry Application v1 pattern
   - Handlebars templates in `src/templates/`

2. **v2 sheets** (experimental): `src/module/sheets/actor-sheet-v2.mjs`, `src/module/sheets/item-sheet-v2.mjs`
   - Uses ApplicationV2 pattern (Foundry v13+)
   - Gradually migrating to this architecture

Toggle in Foundry: **Game Settings → System Settings → Use ApplicationV2 Sheets**

---

## Error Handling

The system uses comprehensive error handling to prevent silent failures and provide user-friendly error messages.

### Error Handler Utility

**Location**: `src/module/helpers/error-handler.mjs`

The `ErrorHandler` class provides two key methods:

#### `ErrorHandler.wrap(handler, context)`

Wraps async event handlers with error boundaries. Catches errors, logs them to console, and shows user notifications.

**Usage in sheets** (actor-sheet.mjs, item-sheet.mjs):
```javascript
import { ErrorHandler } from '../helpers/error-handler.mjs';

// Wrap jQuery event handlers
html.find('.weapon-attack-btn').click(ErrorHandler.wrap(async (ev) => {
  const itemId = $(ev.currentTarget).data('itemId');
  const weapon = Validation.requireDocument(this.actor.items.get(itemId), 'Weapon', 'Attack');
  await CombatHelper.weaponAttackDialog(this.actor, weapon);
}, 'Weapon Attack'));

// Wrap native event listeners
button.addEventListener('click', ErrorHandler.wrap(async (event) => {
  // Your async logic here
}, 'Button Action'));
```

**Usage in main hooks** (deathwatch.mjs):
```javascript
Hooks.on('renderChatMessageHTML', (message, html) => {
  html.querySelectorAll('.apply-damage-btn').forEach(btn => {
    btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
      // Validate inputs
      const damage = Validation.requireInt(ev.currentTarget.dataset.damage, 'Damage');
      const targetActor = resolveActor(ev.currentTarget);
      Validation.requireDocument(targetActor, 'Target Actor', 'Apply Damage');
      
      // Execute logic
      await CombatHelper.applyDamage(targetActor, { damage, ... });
    }, 'Apply Damage'));
  });
});
```

#### `ErrorHandler.safe(promise, fallback)`

Wraps promises with fallback values for non-critical operations:

```javascript
// Returns fallback if promise fails
const config = await ErrorHandler.safe(fetchConfig(), { default: true });

// Returns null by default
const optionalData = await ErrorHandler.safe(loadOptionalData());
```

### Validation Utility

**Location**: `src/module/helpers/validation.mjs`

The `Validation` class provides input validation helpers that throw descriptive errors:

#### `Validation.requireInt(value, fieldName)`

Parses and validates integer values from dataset attributes or inputs:

```javascript
const damage = Validation.requireInt(button.dataset.damage, 'Damage');
// Throws: "Damage must be a valid integer (got: abc)" if invalid
```

#### `Validation.requireActor(actorId, context)`

Validates actor existence and returns the actor:

```javascript
const actor = Validation.requireActor(button.dataset.actorId, 'Apply Damage');
// Throws: "Actor not found for Apply Damage: abc123" if not found
```

#### `Validation.requireDocument(document, documentType, context)`

Validates any document (actor, item, etc.) exists:

```javascript
const item = Validation.requireDocument(actor.items.get(itemId), 'Weapon', 'Attack');
// Throws: "Weapon not found for Attack" if null/undefined
```

#### `Validation.parseBoolean(value)`

Parses boolean values from strings or booleans:

```javascript
const isShocking = Validation.parseBoolean(button.dataset.isShocking);
// "true" → true, "false" → false, other → false
```

#### `Validation.parseJSON(jsonString, fieldName)`

Parses JSON with error handling:

```javascript
const qualities = Validation.parseJSON(button.dataset.weaponQualities, 'Weapon Qualities');
// Throws: "Invalid JSON for Weapon Qualities: ..." if invalid
```

### Error Handling Patterns

#### Sheet Event Listeners

**ALWAYS wrap sheet event listeners** with `ErrorHandler.wrap()`:

```javascript
// ✅ CORRECT
html.find('.item-delete').click(ErrorHandler.wrap(async (ev) => {
  const itemId = $(ev.currentTarget).data('itemId');
  const item = Validation.requireDocument(this.actor.items.get(itemId), 'Item', 'Delete');
  await item.delete();
}, 'Delete Item'));

// ❌ WRONG - No error handling
html.find('.item-delete').click(async (ev) => {
  const item = this.actor.items.get($(ev.currentTarget).data('itemId'));
  await item.delete(); // Can throw unhandled error
});
```

#### Sheet Class Methods

For sheet class methods (not jQuery handlers), use try-catch blocks:

```javascript
async _onItemCreate(event) {
  try {
    event.preventDefault();
    const type = event.currentTarget.dataset.type;
    if (!type) throw new Error('Item type not provided');
    
    const itemData = { name: `New ${type}`, type, system: {} };
    await Item.create(itemData, { parent: this.actor });
  } catch (error) {
    console.error('[Deathwatch] Create Item failed:', error);
    ui.notifications.error(`Create Item failed: ${error.message}`);
  }
}
```

#### Input Validation

**ALWAYS validate user inputs** before processing:

```javascript
// ✅ CORRECT - Validate all inputs
const damage = Validation.requireInt(dataset.damage, 'Damage');
const penetration = Validation.requireInt(dataset.penetration, 'Penetration');
const targetActor = resolveActor(button);
Validation.requireDocument(targetActor, 'Target Actor', 'Apply Damage');

// ❌ WRONG - No validation
const damage = parseInt(dataset.damage); // Can be NaN
const targetActor = game.actors.get(dataset.actorId); // Can be null
await CombatHelper.applyDamage(targetActor, { damage }); // Will crash if null/NaN
```

#### Pure Helper Functions

Combat helpers and other pure functions **do not need try-catch blocks** because:
1. They are pure logic functions that don't interact with UI
2. Errors are caught at the caller level (event handlers)
3. They are thoroughly unit tested

```javascript
// ✅ CORRECT - No try-catch needed
export class CombatHelper {
  static calculateRangeModifier(distance, weaponRange) {
    // Pure calculation - errors caught by caller
    if (distance <= 2) return { modifier: 30, label: "Point Blank" };
    // ...
  }
}
```

### Testing Error Handling

Tests should verify error handling works correctly:

```javascript
describe('ErrorHandler', () => {
  it('should catch errors and show notification', async () => {
    const error = new Error('Test error');
    const handler = jest.fn(async () => { throw error; });
    const wrapped = ErrorHandler.wrap(handler, 'Test Operation');
    
    global.ui = { notifications: { error: jest.fn() } };
    jest.spyOn(console, 'error').mockImplementation();
    
    await wrapped();
    
    expect(console.error).toHaveBeenCalledWith('[Deathwatch] Test Operation failed:', error);
    expect(ui.notifications.error).toHaveBeenCalledWith('Test Operation failed: Test error');
  });
});

describe('Sheet tests', () => {
  it('shows error if weapon has no actor', async () => {
    const event = { preventDefault: jest.fn() };
    mockItem.actor = null;
    
    await mockSheet._onWeaponAttack(event);
    
    expect(ui.notifications.error).toHaveBeenCalledWith(
      'Weapon Attack failed: Actor not found for Weapon Attack'
    );
  });
});
```

### When to Use Error Handling

**ALWAYS use error handling for**:
- ✅ All sheet event listeners (click, change, drop handlers)
- ✅ All chat message button handlers
- ✅ All async operations that can fail (document updates, rolls, API calls)
- ✅ All user input parsing and validation

**NO error handling needed for**:
- ❌ Pure helper functions (handled by callers)
- ❌ Synchronous getters/setters
- ❌ Simple data transformations
- ❌ FoundryAdapter methods (they handle their own errors)

### Error Message Guidelines

- **Be specific**: "Weapon not found for Attack" not "Item not found"
- **Include context**: "Apply Damage failed: Actor not found" not just "Actor not found"
- **Use field names**: "Damage must be a valid integer (got: abc)" not "Invalid input"
- **Keep it user-friendly**: Avoid technical jargon in `ui.notifications.error()`
- **Log full details**: `console.error()` gets the full Error object with stack trace

---

## HTML Sanitization (XSS Prevention)

The system uses comprehensive HTML sanitization to prevent XSS attacks from malicious actor names, item names, and other user-provided strings.

### Sanitizer Utility

**Location**: `src/module/helpers/sanitizer.mjs`

The `Sanitizer` class provides two key methods for preventing XSS:

#### `Sanitizer.escape(text)`

Escapes HTML special characters using Foundry's built-in `escapeHTML` utility:

```javascript
import { Sanitizer } from '../helpers/sanitizer.mjs';

const actorName = '<script>alert("XSS")</script>';
const safe = Sanitizer.escape(actorName);
// Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
```

#### `Sanitizer.html` (Tagged Template Literal)

Automatically escapes all interpolated values in template strings:

```javascript
const actorName = '<img src=x onerror="alert(1)">';
const damage = 10;
const location = 'Head';

const html = Sanitizer.html`<strong>${actorName}</strong> takes ${damage} wounds to ${location}`;
// Returns: '<strong>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</strong> takes 10 wounds to Head'
```

### When to Sanitize

**ALWAYS sanitize user-provided strings before inserting into HTML**:
- ✅ Actor names (`actor.name`)
- ✅ Item/weapon names (`item.name`, `weapon.name`)
- ✅ Character names in chat messages
- ✅ Hit locations from user input
- ✅ Any string from `dataset` attributes
- ✅ Dialog titles and content with user data

**NO sanitization needed for**:
- ❌ System-generated constants (`"Impact"`, `"Energy"`)
- ❌ Numeric values (`damage`, `penetration`)
- ❌ Internal data structure names (for equality checks, not HTML output)
- ❌ Foundry API calls (they handle their own escaping)

### Sanitization Patterns

#### Chat Message Builders

**ALWAYS sanitize** user-provided strings in chat message helpers:

```javascript
// ✅ CORRECT
export class ChatMessageBuilder {
  static buildDamageMessage(actorName, damage, location) {
    const safeName = Sanitizer.escape(actorName);
    const safeLocation = Sanitizer.escape(location);
    return `<strong>${safeName}</strong> takes ${damage} wounds to ${safeLocation}`;
  }
}

// ❌ WRONG - No sanitization
static buildDamageMessage(actorName, damage, location) {
  return `<strong>${actorName}</strong> takes ${damage} wounds to ${location}`;
  // XSS vulnerability if actorName contains <script> tags!
}
```

#### Dialog Content

**ALWAYS sanitize** user data in dialog content:

```javascript
// ✅ CORRECT
const safeActorName = Sanitizer.escape(actor.name);
foundry.applications.api.DialogV2.wait({
  window: { title: `Attack: ${safeActorName}` },
  content: `<p><strong>${safeActorName}</strong> attacks!</p>`,
  buttons: [...]
});

// ❌ WRONG - No sanitization
foundry.applications.api.DialogV2.wait({
  window: { title: `Attack: ${actor.name}` }, // XSS in title!
  content: `<p><strong>${actor.name}</strong> attacks!</p>`, // XSS in content!
  buttons: [...]
});
```

#### Data Attributes

**ALWAYS sanitize** user strings going into data attributes:

```javascript
// ✅ CORRECT
const safeLocation = Sanitizer.escape(location);
const safeDamageType = Sanitizer.escape(damageType);
return `<button class="apply-damage-btn" data-location="${safeLocation}" data-damage-type="${safeDamageType}">Apply</button>`;

// ❌ WRONG - No sanitization
return `<button class="apply-damage-btn" data-location="${location}" data-damage-type="${damageType}">Apply</button>`;
// If location = '"><img src=x onerror="alert(1)">' this creates XSS!
```

#### Using Tagged Templates

For complex HTML with multiple user values, use `Sanitizer.html`:

```javascript
// ✅ CORRECT - Auto-escapes all interpolations
const html = Sanitizer.html`
  <div class="damage-message">
    <strong>${actorName}</strong> takes <span class="damage">${damage}</span> 
    wounds to ${location}
  </div>
`;

// ❌ WRONG - Manually escaping is error-prone
const safeName = Sanitizer.escape(actorName);
const safeLocation = Sanitizer.escape(location);
const html = `
  <div class="damage-message">
    <strong>${safeName}</strong> takes <span class="damage">${damage}</span>
    wounds to ${safeLocation}
  </div>
`;
// Easy to forget escaping one field!
```

### Testing Sanitization

Always test with XSS payloads to verify sanitization:

```javascript
describe('MyHelper', () => {
  it('should sanitize actor names to prevent XSS', () => {
    const maliciousName = '<script>alert("XSS")</script>';
    const html = MyHelper.buildMessage(maliciousName, 10, 'Head');
    
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
  
  it('should sanitize img onerror attacks', () => {
    const maliciousName = '<img src=x onerror="alert(1)">';
    const html = MyHelper.buildMessage(maliciousName, 10, 'Head');
    
    expect(html).toContain('&lt;img');
    expect(html).toContain('&gt;');
  });
});
```

### Common XSS Payloads to Test

Use these payloads when testing sanitization:

```javascript
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(1)">',
  '"><img src=x onerror="alert(1)">',
  '<svg onload=alert(1)>',
  '" onmouseover="alert(1)" x="',
  '<iframe src="evil.com"></iframe>',
  '<a href="javascript:alert(1)">Click</a>',
  '<style>body{background:url("javascript:alert(1)")}</style>'
];
```

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

**Fire macros**: Auto-created for GM on world load:
- 🔥 Flame Attack — GM targets token, enters damage/pen, applies flame mechanics
- 🔥 On Fire Round — GM targets token, applies On Fire effects for this round

### Hotbar Macros

**Drag & drop from character sheet**:
- **Weapons** → Attack/Damage choice dialog (or pre-load options in macro command)
- **Psychic powers** → Opens Focus Power Test directly
- **Other items** → Generic item roll (posts description to chat)

**Macro presets**: Edit the macro command to pre-load attack options:
```javascript
// Standard weapon macro (shows Attack/Damage choice)
game.deathwatch.rollItemMacro("Actor.abc123.Item.def456");

// Pre-loaded attack macro (skips choice, opens attack dialog with preset options)
game.deathwatch.rollItemMacro("Actor.abc123.Item.def456", {
  rateOfFire: "full",
  aim: 1,
  calledShot: "Head"
});

// Pre-loaded damage macro (skips choice, rolls damage immediately)
game.deathwatch.rollItemMacro("Actor.abc123.Item.def456", { action: "damage" });
```

See `docs/hotbar-macros.md` for full list of options.

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
