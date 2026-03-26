# Development Guidelines

## Testing Standards

### Test Framework
- Use Jest with ES modules for all unit tests
- Test files located in `tests/` directory with `.test.mjs` extension
- Run tests: `npm test`
- Run with coverage: `npm run test:coverage`
- Coverage reports generated in `coverage/lcov-report/index.html`

### Test Requirements
- **Always write tests** when adding new functionality
- **Always update tests** when modifying existing code
- Aim for high coverage on testable code (calculation logic, data manipulation)
- Mock Foundry VTT globals in `tests/setup.mjs`
- Use `jest.clearAllMocks()` in tests to avoid mock pollution between tests

### Test Modification Warning
**CRITICAL**: When tests fail, investigate the root cause before modifying test expectations.

- **DO NOT** simply change test expectations to make tests pass
- **DO** verify that the expected value is correct based on requirements
- **DO** check if the implementation has a bug rather than the test

**Example Scenario:**
```javascript
// Test expects 12800 but gets 13200
expect(spent).toBe(12800); // FAILS

// WRONG: Change test to match buggy behavior
expect(spent).toBe(13200); // Now passes, but hides bug

// RIGHT: Fix the implementation bug, keep correct expectation
expect(spent).toBe(12800); // Now passes with correct code
```

**Red Flags:**
- Test was passing, now fails after code change
- Changing expectation makes test pass without understanding why
- Multiple related tests need expectation changes
- Expected value doesn't match documented requirements

**Proper Process:**
1. Understand what the test is validating
2. Verify the expected value is correct per requirements
3. Debug why actual value differs from expected
4. Fix implementation bug if found
5. Only change test if requirements changed or test was wrong

### Test Structure
```javascript
import { jest } from '@jest/globals';
import { YourClass } from '../src/module/path/to/file.mjs';

describe('YourClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('describes expected behavior', () => {
      expect(YourClass.method()).toBe(expected);
    });
  });
});
```

**Note:** `setup.mjs` runs automatically via `setupFiles` in `jest.config.mjs` — no need to import it in test files. Global mock factories `createMockActor(overrides)` and `createMockWeapon(overrides)` are available in all tests.

### What to Test
- **Calculation methods**: Range modifiers, hit calculations, damage calculations
- **Data manipulation**: Modifier application, data preparation, roll data
- **Conditional logic**: Branching paths, edge cases, boundary conditions
- **Helper utilities**: Pure functions, data transformations

### What Not to Test (or test minimally)
- **Dialog/UI methods**: Complex jQuery and Foundry Dialog interactions
- **Sheet rendering**: Handlebars template rendering
- **Foundry lifecycle hooks**: init, ready hooks
- Extract testable logic from UI methods into helper classes

### Test Coverage Goals
- Calculation/logic methods: 90%+ coverage
- Helper utilities: 90%+ coverage
- Document classes: 70%+ coverage (lifecycle methods are hard to test)
- Overall project: 60%+ coverage

### Mocking Patterns
```javascript
// setup.mjs runs automatically via jest.config.mjs setupFiles
// Global mock factories available in all tests:
const actor = createMockActor({ system: { wounds: { value: 10, max: 20 } } });
const weapon = createMockWeapon({ system: { dmg: '2d10+5', class: 'Melee' } });

// Mock Foundry globals (defined in setup.mjs)
global.game = { packs: new Map(), settings: { get: jest.fn() } };
global.ui = { notifications: { warn: jest.fn(), info: jest.fn() } };
global.ChatMessage = { getSpeaker: jest.fn(), create: jest.fn() };
```

### Edge Cases to Test
- Zero/null/undefined values
- Boundary conditions (min/max values)
- Empty arrays/objects
- Missing optional parameters
- Invalid input handling

## Code Quality Standards

### Current State (Post-Refactoring)
- **Total Lines**: ~2,618 lines across core modules
- **Test Coverage**: 68%
- **Test Count**: 1060 tests across 81 suites
- **Key Files**:
  - actor.mjs: ~60 lines (thin shell, delegates to DataModels)
  - actor-sheet.mjs: 671 lines (uses RollDialogBuilder, ChatMessageBuilder, ItemHandlers)
  - combat.mjs: 395 lines (uses ChatMessageBuilder)
  - CSS: 10 modular files (~900 lines total)

### Architecture Patterns Established
1. **Helper Classes**: Extract business logic into focused static classes
2. **TypeDataModel Classes**: Programmatic data schemas per item/actor type (v13 pattern)
3. **CSS Modularity**: Component-based CSS with variables and low specificity
4. **Template Partials**: Reusable Handlebars components
5. **Constants**: Named constants instead of magic numbers

### File Extensions and Module System
- Use `.mjs` extension for all ES module JavaScript files (100% of core modules)
- Use `.js` extension only for legacy compatibility files (e.g., handlebars.js)
- Always use ES module import/export syntax, never CommonJS require()

### Naming Conventions
- **Classes**: PascalCase with descriptive prefixes
  - `DeathwatchActor`, `DeathwatchItem`, `DeathwatchActorSheet`, `DeathwatchItemSheet`
  - Helper classes: `ModifierHelper`, `CombatHelper`
- **Constants**: SCREAMING_SNAKE_CASE for exported constants
  - `DEBUG_FLAGS`, `CHARACTERISTICS`, `MODIFIER_TYPES`, `EFFECT_TYPES`
- **Configuration Objects**: PascalCase
  - `DWConfig` (Deathwatch Config)
- **Functions**: camelCase with descriptive verbs
  - `prepareData()`, `getRollData()`, `calculateSkillTotal()`
  - Private methods prefixed with underscore: `_prepareCharacterData()`, `_onRoll()`
- **Variables**: camelCase
  - `actorData`, `systemData`, `rollData`, `itemModifiers`
- **File Names**: kebab-case matching class names
  - `actor-sheet.mjs`, `item-sheet.mjs`, `debug.mjs`

### Code Formatting
- **Indentation**: 2 spaces (no tabs)
- **Line Length**: Pragmatic approach, break long lines for readability
- **Semicolons**: Consistently used at end of statements
- **String Quotes**: Double quotes for strings, template literals for interpolation
- **Blank Lines**: Single blank line between methods, two lines between major sections
- **Trailing Commas**: Not used in object/array literals
- **JSON Formatting**: Automated via `compactJson.mjs` + Prettier in build pipeline
  - Short objects inlined when they fit within 80 chars at their indent level
  - Keys ordered logically per item type (not alphabetically)
  - Prettier handles spacing on format-on-save

### Documentation Standards
- **JSDoc Comments**: Used for all public methods and classes
  - Include `@extends`, `@override`, `@param`, `@return`, `@private` tags
  - Example:
    ```javascript
    /**
     * Extend the base Actor document by defining a custom roll data structure.
     * @extends {Actor}
     */
    export class DeathwatchActor extends Actor {
      /**
       * Prepare Character type specific data
       * @param {Object} actorData The actor data to prepare
       */
      _prepareCharacterData(actorData) { }
    }
    ```
- **Inline Comments**: Used sparingly to explain complex logic
  - Prefer self-documenting code over excessive comments
  - Use comments for "why" not "what"

### Error Handling
- Use `ui.notifications` for user-facing messages:
  - `ui.notifications.warn()` for validation failures
  - `ui.notifications.info()` for success messages
  - `ui.notifications.error()` for critical errors
- Validate data before operations:
  ```javascript
  if (!item || !item.parent) {
    return ui.notifications.warn(`Could not find item ${itemName}.`);
  }
  ```

## Architectural Patterns

### Foundry VTT Document Extension Pattern
All custom documents extend Foundry base classes:
```javascript
export class DeathwatchActor extends Actor {
  prepareData() {
    super.prepareData(); // Always call super first
  }
}
```

### Data Preparation Lifecycle
Follow Foundry's data preparation order:
1. `prepareData()` - Entry point, calls super
2. `prepareBaseData()` - Before embedded documents
3. `prepareDerivedData()` - After embedded documents, calculate derived values
4. DataModel `prepareDerivedData()` - Called automatically by Foundry for registered TypeDataModels
5. Document classes are thin shells — all business logic lives in DataModel classes

### TypeDataModel Pattern
Programmatic data schemas using Foundry v13's TypeDataModel API:
```javascript
// Base class with shared templates
export default class DeathwatchDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() { return {}; }
  static equippedTemplate() {
    return { equipped: new fields.BooleanField({ initial: false }) };
  }
}

// Item base with universal fields
export default class DeathwatchItemBase extends DeathwatchDataModel {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.description = new fields.HTMLField({ initial: "" });
    schema.modifiers = new fields.ArrayField(new fields.ObjectField(), { initial: [] });
    return schema;
  }
}

// Concrete type composing shared templates + type-specific fields
export default class DeathwatchGear extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });
    schema.wt = new fields.NumberField({ initial: 0, min: 0 });
    return schema;
  }
}
```

**Key patterns:**
- Extend parent → call `super.defineSchema()` → merge shared templates → add type-specific fields → return schema
- Shared templates are static methods returning field objects (composition via spread)
- `foundry.utils.mergeObject(schema, {...spread})` mutates schema in place
- All types have registered DataModels; template.json contains only type lists
- Register via `CONFIG.Item.dataModels = { gear: DeathwatchGear }` in init hook

### Sheet Pattern
Sheets extend Foundry sheet classes and follow this structure:
```javascript
export class DeathwatchActorSheet extends ActorSheet {
  static get defaultOptions() { /* ... */ }
  get template() { /* ... */ }
  getData() { /* ... */ }
  activateListeners(html) { /* ... */ }
  // Event handlers prefixed with _on
  async _onRoll(event) { /* ... */ }
}
```

### Helper/Utility Pattern
- Static helper classes for reusable logic
- Pure functions preferred (no side effects)
- No instantiation required
- Examples:
  ```javascript
  // Business logic helper
  export class XPCalculator {
    static calculateRank(totalXP) { /* ... */ }
    static calculateSpentXP(actor) { /* ... */ }
  }
  
  // UI helper
  export class RollDialogBuilder {
    static buildModifierDialog() { /* ... */ }
    static parseModifiers(html) { /* ... */ }
  }
  
  // CRUD helper
  export class ModifierHelper {
    static async createModifier(actor) { /* ... */ }
    static async deleteModifier(actor, modifierId) { /* ... */ }
  }
  ```

### Configuration Pattern
- Export configuration objects from dedicated files
- Access via global game object: `game.deathwatch.config`
- Structure:
  ```javascript
  export const DWConfig = {};
  DWConfig.CharacteristicWords = { /* ... */ };
  DWConfig.TestDifficulties = { /* ... */ };
  ```

## Refactoring Patterns

### When to Extract Helper Classes
Extract when:
- Method exceeds 50 lines
- Logic is reused 2+ times
- Complex calculations need testing
- Business logic mixed with UI code

### Helper Class Structure
```javascript
import { debug } from "./debug.mjs";
import { CONSTANTS } from "./constants.mjs";

export class HelperName {
  // Pure functions preferred
  static calculate(input) {
    debug('CONTEXT', 'Calculating:', input);
    return result;
  }
  
  // Private helpers prefixed with _
  static _privateHelper(data) {
    return processed;
  }
}
```

### CSS Organization Pattern
```css
/* Use CSS variables */
:root {
  --dw-color-primary: #007bff;
  --dw-spacing-md: 8px;
}

/* Low specificity, BEM-like naming */
.dw-component { }
.dw-component__element { }
.dw-component__element--modifier { }

/* Split into component files */
/* styles/components/dialogs.css */
/* styles/components/items.css */
```

### Template Partial Pattern
```handlebars
{{!-- Create partial for repeated HTML --}}
{{!-- templates/actor/parts/item-controls.html --}}
<div class="item-controls">
  <a class="item-control item-edit"><i class="fas fa-edit"></i></a>
  <a class="item-control item-delete"><i class="fas fa-trash"></i></a>
</div>

{{!-- Use in templates --}}
{{> "systems/deathwatch/templates/actor/parts/item-controls.html"}}
```

## Common Implementation Patterns

### Modifier System Pattern
Modifiers are collected from multiple sources and applied during data preparation:
```javascript
// Collect from actor
const modifiers = systemData.modifiers || [];

// Collect from equipped items
const itemModifiers = [];
for (const item of this.items) {
  if (item.system.equipped && item.system.modifiers) {
    for (const mod of item.system.modifiers) {
      if (mod.enabled !== false) {
        itemModifiers.push({ ...mod, source: item.name });
      }
    }
  }
}

// Combine and apply
const allModifiers = [...modifiers, ...itemModifiers];
for (const mod of allModifiers) {
  if (mod.effectType === 'characteristic' && mod.valueAffected === key) {
    total += parseInt(mod.modifier) || 0;
  }
}
```

### Dialog Pattern
Use Foundry's Dialog class for user input:
```javascript
new Dialog({
  title: "Dialog Title",
  content: `<div>HTML content with form fields</div>`,
  render: (html) => {
    // Setup event listeners after render
  },
  buttons: {
    confirm: {
      label: "Confirm",
      callback: async (html) => {
        const value = html.find('#field').val();
        // Process input
      }
    },
    cancel: { label: "Cancel" }
  },
  default: "confirm"
}).render(true);
```

### Roll Pattern
Create and display rolls using Foundry's Roll class:
```javascript
const roll = new Roll(formula, rollData);
await roll.evaluate(); // For async evaluation
roll.toMessage({
  speaker: ChatMessage.getSpeaker({ actor: this.actor }),
  flavor: label,
  rollMode: game.settings.get('core', 'rollMode')
});
```

### jQuery Event Handling Pattern
Use jQuery for DOM manipulation in sheets:
```javascript
activateListeners(html) {
  super.activateListeners(html);
  
  // Select text on focus
  html.find('input[type="text"]').focus(function() {
    $(this).select();
  });
  
  // Click handlers
  html.find('.item-edit').click(ev => {
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    item.sheet.render(true);
  });
}
```

### Data Attribute Pattern
Store IDs and metadata in HTML data attributes:
```html
<li class="item" data-item-id="${item._id}">
```
```javascript
const itemId = $(ev.currentTarget).data('itemId');
const item = this.actor.items.get(itemId);
```

### Async/Await Pattern
Use async/await for asynchronous operations:
```javascript
async _onItemCreate(event) {
  event.preventDefault();
  const itemData = { /* ... */ };
  return await Item.create(itemData, { parent: this.actor });
}
```

### Deep Clone Pattern
Use Foundry's utility for safe data cloning:
```javascript
const actorData = this.actor.toObject(false);
rollData.item = foundry.utils.deepClone(this.system);
```

## Foundry VTT API Usage

### Document Operations
```javascript
// Create
await Item.create(itemData, { parent: this.actor });

// Update
await item.update({ "system.equipped": true });

// Delete
await item.delete();

// Get from collection
const item = this.actor.items.get(itemId);

// Filter collection
const weapons = this.actor.items.filter(i => i.type === 'weapon');
```

### Hook Registration
```javascript
Hooks.once('init', async function() {
  // Initialization code
});

Hooks.once('ready', async function() {
  // Ready code
});

Hooks.on('hotbarDrop', (bar, data, slot) => {
  // Repeating hook
});
```

### Global Game Object Pattern
Register system utilities on game object:
```javascript
game.deathwatch = {
  DeathwatchActor,
  DeathwatchItem,
  rollItemMacro,
  config: DWConfig
};
```

### CONFIG Object Pattern
Register custom document classes:
```javascript
CONFIG.Actor.documentClass = DeathwatchActor;
CONFIG.Item.documentClass = DeathwatchItem;
CONFIG.Combat.initiative = {
  formula: "1d10 + @agBonus + @initiativeBonus",
  decimals: 2
};
```

### Sheet Registration Pattern
```javascript
Actors.unregisterSheet("core", ActorSheet);
Actors.registerSheet("deathwatch", DeathwatchActorSheet, { 
  makeDefault: true 
});
```

### Handlebars Helper Registration
```javascript
Handlebars.registerHelper("config", function(key) {
  return game.deathwatch.config[key];
});

Handlebars.registerHelper("enrich", function(string) {
  return TextEditor.enrichHTML(string, { async: false });
});

Handlebars.registerHelper("qualityList", function(qualities) {
  // Formats attachedQualities array for tooltip display
  // Handles strings ("tearing") and objects ({id: "proven", value: "3"})
  // Returns: "Tearing, Proven (3)"
});
```

## Debug and Logging Patterns

### Debug Flag System
```javascript
export const DEBUG_FLAGS = {
  COMBAT: false,
  MODIFIERS: false,
  SHEETS: false
};

export function debug(context, ...args) {
  if (DEBUG_FLAGS[context]) {
    console.log(`[Deathwatch:${context}]`, ...args);
  }
}

// Usage
import { debug } from "../helpers/debug.mjs";
debug('MODIFIERS', `Checking item: ${item.name}`);
debug('COMBAT', 'Deducting ammo:', { loadedAmmo, roundsFired });
```

### Conditional Logging
- Use debug flags to control verbose logging
- Prefix all logs with system identifier: `[Deathwatch:CONTEXT]`
- Include relevant context in log messages
- Enable/disable flags in `debug.mjs` for development
- **Always use debug() instead of console.log()** for system logging

## Compendium Pack Management

### Adding a New Compendium Pack

1. **Add item type to template.json types array**:
```json
"Item": {
  "types": ["weapon", "armor", "gear", "new-type"]
}
```

2. **Create DataModel class** in `src/module/data/item/new-type.mjs`

3. **Register DataModel** in `deathwatch.mjs`:
```javascript
CONFIG.Item.dataModels['new-type'] = models.DeathwatchNewType;
```

4. **Register pack in system.json**:
```json
"packs": [
  {
    "name": "pack-name",
    "label": "Pack Label",
    "path": "packs/pack-name",
    "type": "Item",
    "system": "deathwatch"
  }
]
```

3. **Create source directory**: `src/packs-source/pack-name/`

4. **Create compiled directory**: `src/packs/pack-name/`

5. **Create template file**: `src/packs-source/_templates/type-template.json`

6. **Add source JSON files** in `src/packs-source/pack-name/`:
```json
{
  "name": "Item Name",
  "type": "new-type",
  "img": "icons/svg/book.svg",
  "system": {
    "field1": "value",
    "field2": 10,
    "description": "<p>HTML description</p>",
    "modifiers": []
  }
}
```

7. **Compile packs**: `npm run build:packs`

### Compendium Build Process
- Source files: `src/packs-source/` (JSON, version controlled)
- Compiled packs: `src/packs/` (LevelDB, generated)
- Build pipeline: `compactJson → prettier → validatePacks → compilePacks`
- **compactJson.mjs**: Smart key ordering per item type + inline compaction (≤80 chars)
- **prettier**: Adds spacing to inlined JSON, preserves compact form on subsequent saves
- **validatePacks.mjs**: Unique IDs, talent compendiumIds, quality keys, embedded item sync
- **compilePacks.mjs**: Processes all directories in packs-source into LevelDB
- Creates folders from subdirectories
- Supports Item, Actor, and RollTable types

### JSON Key Ordering (compactJson.mjs)
Keys are ordered logically per item type, not alphabetically:
- **weapon**: book/page → class/dmg/dmgType/pen → range/rof/clip/reload → equipped/wt → req/renown → qualities/upgrades → description → modifiers
- **armor**: book/page → head/body/left_arm/right_arm/left_leg/right_leg → req/renown → histories → description → modifiers
- **ammunition**: book/page → capacity → quantity → req/renown → description → modifiers
- **talent**: book/page → prerequisite/benefit → description → cost/stackable → compendiumId → modifiers
- **enemy/horde**: characteristics → wounds/fatigue → skills → psyRating → armor → modifiers → description
- **modifier objects**: _id → name → modifier → type → effectType → valueAffected → enabled
- **top-level**: _id → name → type → img → system → items → prototypeToken

### Compendium ID Requirements
- **CRITICAL**: All `_id` fields must be unique across ALL compendium packs
- Duplicate IDs will cause data corruption and unpredictable behavior
- Use consistent ID prefixes per pack type:
  - Ammunition: `clip00000000###`
  - Weapons: `weap00000000###`
  - Armor: `armr00000000###`
  - Talents: `tal000000000###`
  - Traits: `trt000000000###`
  - Enemies: `enmy{faction}{pad}{num}` (e.g., `enmytyranid00001`, `enmyork000000001`)
  - Hordes: `hord{faction}{pad}{num}` (e.g., `hordtyranid00001`)
  - Enemy items: `ei{faction}{num}{pad}0{seq}` (e.g., `eityranid0100001`)
  - Horde items: `hi{faction}{num}{pad}0{seq}` (e.g., `hityranid0100001`)
  - See `enemies.md` for full faction-based ID convention details
- **Talents MUST have compendiumId**: All talent items must have `system.compendiumId` set to match their `_id`
  - Used by XPCalculator and chapter/specialty cost overrides
  - Run `node builds/scripts/sortTalentJsons.mjs` to ensure compendiumId is set
  - Run `node builds/scripts/validateTalentIds.mjs` to verify all talents have matching IDs
- Validate IDs before committing:
  ```powershell
  # Check for duplicates in a folder
  powershell -Command "$ids = @{}; Get-ChildItem -Filter *.json | ForEach-Object { $content = Get-Content $_.FullName | ConvertFrom-Json; $id = $content._id; if ($ids.ContainsKey($id)) { Write-Output \"Duplicate: $id\" } else { $ids[$id] = $_.Name } }"
  ```

## Data Schema Patterns

### Data Schema

`template.json` contains only type lists. All field definitions live in DataModel classes (`src/module/data/`).

### Nested Data Structures
- Use dot notation for updates: `"system.equipped": true`
- Access nested data: `actorData.system.characteristics.ws.value`
- Store arrays for collections: `modifiers: []`, `attachedHistories: []`

## UI/UX Patterns

### Tab Navigation
```javascript
static get defaultOptions() {
  return foundry.utils.mergeObject(super.defaultOptions, {
    tabs: [{ 
      navSelector: ".sheet-tabs", 
      contentSelector: ".sheet-body", 
      initial: "characteristics" 
    }]
  });
}
```

### Checkbox Cascade Logic
Implement dependent checkboxes:
```javascript
html.find('input[name*=".trained"]').change(ev => {
  if (!ev.target.checked) {
    html.find(`input[name*=".mastered"]`).prop('checked', false);
    html.find(`input[name*=".advanced"]`).prop('checked', false);
  }
});
```

### Drag and Drop Pattern
```javascript
// Enable dragging
if (this.actor.isOwner) {
  let handler = ev => this._onDragStart(ev);
  html.find('li.item').each((i, li) => {
    li.setAttribute("draggable", true);
    li.addEventListener("dragstart", handler, false);
  });
}

// Handle drops
async _onDropItemOnItem(event) {
  const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
  const droppedItem = await Item.implementation.fromDropData(data);
  // Process drop
}
```

## Calculation Patterns

### Characteristic Bonus Calculation
```javascript
characteristic.mod = Math.floor(total / 10);
```

### Skill Total Calculation
```javascript
static calculateSkillTotal(skill, characteristics) {
  const characteristic = characteristics[skill.characteristic];
  const baseCharValue = characteristic ? characteristic.value : 0;
  const charMod = skill.trained 
    ? Math.floor(baseCharValue / 10) 
    : Math.floor((baseCharValue / 2) / 10);
  const skillBonus = skill.advanced ? 20 : (skill.mastered ? 10 : 0);
  return charMod + skillBonus + skill.modifier;
}
```

### Roll Formula Building
```javascript
let rollFormula = 'd100';
if (modifier !== 0) {
  rollFormula += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
}
```

## Best Practices

### Code Organization Principles
1. **Single Responsibility**: Each class/function should have one clear purpose
2. **Separation of Concerns**: Keep business logic separate from UI code
3. **DRY (Don't Repeat Yourself)**: Extract common patterns into reusable functions
4. **Testability**: Write code that can be easily unit tested
5. **Modularity**: Keep files focused and under 300 lines when possible

### When to Extract Code
- Method exceeds 50 lines → Extract helper functions
- Class exceeds 300 lines → Split into multiple classes
- Duplicate code appears 2+ times → Create shared utility
- Complex logic in UI code → Move to helper class
- HTML strings exceed 20 lines → Move to template or builder

### Always Check Existence
```javascript
if (!item || !item.parent) return;
if (actorData.type !== 'character') return;
```

### Use Optional Chaining
```javascript
const bsValue = bsChar?.value || 0;
const skillModTotal = liveSkill?.modifierTotal || 0;
```

### Array Safety
```javascript
const modifiers = Array.isArray(actor.system.modifiers) 
  ? [...actor.system.modifiers] 
  : [];
```

### Spread for Immutability
```javascript
const allModifiers = [...modifiers, ...itemModifiers];
itemModifiers.push({ ...mod, source: item.name });
```

### Early Returns
```javascript
if (actorData.type !== 'character') return;
if (!this.isEditable) return;
```

### Ternary for Simple Conditionals
```javascript
const selected = key === 'challenging' ? 'selected' : '';
const label = v.label ?? k;
```

### Template Literals for HTML
```javascript
const content = `
  <div class="form-group">
    <label>${label}:</label>
    <input type="text" value="${value}" />
  </div>
`;
```

### Consistent Method Ordering in Classes
1. Static properties (defaultOptions)
2. Getters (template)
3. Lifecycle methods (prepareData, getData)
4. Public methods
5. Private methods (prefixed with _)
6. Event handlers (_onRoll, _onItemCreate)

### ID Generation
```javascript
_id: foundry.utils.randomID()
```

### Localization Pattern
```javascript
v.label = game.i18n.localize(game.deathwatch.config.Skills[k]) ?? k;
```

## Common Code Idioms

### Item Filtering and Categorization
```javascript
const weapons = [];
const armor = [];
for (let i of context.items) {
  if (i.type === 'weapon') weapons.push(i);
  else if (i.type === 'armor') armor.push(i);
}
```

### Object Iteration
```javascript
for (let [key, value] of Object.entries(object)) {
  // Process key-value pairs
}
```

### Array Methods
```javascript
// Filter
const equipped = items.filter(i => i.system.equipped);

// Find
const existing = items.find(i => i.name === name);

// Map
const names = items.map(i => i.name);

// ForEach
items.forEach(item => { /* ... */ });
```

### Null Coalescing
```javascript
const value = characteristic.base ?? characteristic.value ?? 0;
```

### String Capitalization
```javascript
const name = `New ${type.capitalize()}`;
```

### Duplicate for Deep Copy (Legacy)
```javascript
const data = duplicate(header.dataset);
```

### Merge Objects
```javascript
return foundry.utils.mergeObject(super.defaultOptions, {
  classes: ["deathwatch", "sheet", "actor"]
});
```
