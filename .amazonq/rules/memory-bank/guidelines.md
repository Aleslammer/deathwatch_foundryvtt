# Development Guidelines

## Code Quality Standards

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
4. Type-specific methods: `_prepareCharacterData()`, `_prepareNpcData()`

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
- No instantiation required
- Example:
  ```javascript
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

## Data Schema Patterns

### Template Inheritance
```json
{
  "Actor": {
    "types": ["character", "npc"],
    "templates": {
      "base": { "wounds": { "value": 0, "max": 0 } }
    },
    "character": {
      "templates": ["base"],
      "characteristics": { /* ... */ }
    }
  }
}
```

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
