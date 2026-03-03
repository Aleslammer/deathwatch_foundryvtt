# ApplicationV2 Code Examples

## Minimal ActorSheetV2 Implementation

```javascript
import { HandlebarsApplicationMixin } from "foundry.applications.api";

export class DeathwatchActorSheetV2 extends foundry.applications.sheets.ActorSheetV2.mixin(
  HandlebarsApplicationMixin
) {
  
  static DEFAULT_OPTIONS = {
    classes: ["deathwatch", "sheet", "actor"],
    position: { width: 1000, height: 800 },
    actions: {
      rollCharacteristic: this._onRollCharacteristic,
      rollSkill: this._onRollSkill,
      editItem: this._onEditItem
    }
  };

  static PARTS = {
    header: {
      template: "systems/deathwatch/templates/actor/parts/header.hbs"
    },
    characteristics: {
      template: "systems/deathwatch/templates/actor/parts/characteristics.hbs",
      scrollable: [""]
    }
  };

  tabGroups = {
    primary: "characteristics"
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    // Add system data
    context.system = this.actor.system;
    
    // Prepare characteristics
    for (let [k, v] of Object.entries(context.system.characteristics)) {
      v.label = game.i18n.localize(game.deathwatch.config.CharacteristicWords[k]) ?? k;
    }
    
    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    // Additional rendering logic if needed
  }

  static async _onRollCharacteristic(event, target) {
    const characteristic = target.dataset.characteristic;
    const actor = this.actor;
    // Roll logic here
  }

  static async _onRollSkill(event, target) {
    const skill = target.dataset.skill;
    const actor = this.actor;
    // Roll logic here
  }

  static async _onEditItem(event, target) {
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);
    item?.sheet.render(true);
  }
}
```

## Template Example (V2)

```handlebars
{{!-- header.hbs --}}
<header class="sheet-header">
  <img class="profile-img" src="{{actor.img}}" data-action="showImage" />
  <div class="header-fields">
    <h1 class="charname">
      <input name="name" type="text" value="{{actor.name}}" placeholder="Character Name"/>
    </h1>
  </div>
</header>

{{!-- characteristics.hbs --}}
<div class="characteristics">
  {{#each system.characteristics as |char key|}}
  <div class="characteristic">
    <label>{{char.label}}</label>
    <input type="number" name="system.characteristics.{{key}}.value" value="{{char.value}}" />
    <button type="button" 
            data-action="rollCharacteristic" 
            data-characteristic="{{key}}"
            data-label="{{char.label}}">
      <i class="fas fa-dice-d20"></i>
    </button>
  </div>
  {{/each}}
</div>
```

## Action Handler Pattern

```javascript
// Simple action
static async _onToggleEquip(event, target) {
  const itemId = target.dataset.itemId;
  const item = this.actor.items.get(itemId);
  await item.update({ "system.equipped": !item.system.equipped });
}

// Action with dialog
static async _onRollCharacteristic(event, target) {
  const characteristic = target.dataset.characteristic;
  const label = target.dataset.label;
  
  const content = await renderTemplate(
    "systems/deathwatch/templates/dialogs/roll-modifier.hbs",
    { label }
  );
  
  return Dialog.prompt({
    title: `Roll ${label}`,
    content,
    callback: async (html) => {
      const modifier = parseInt(html.find('[name="modifier"]').val()) || 0;
      // Perform roll
    }
  });
}

// Action with confirmation
static async _onDeleteItem(event, target) {
  const itemId = target.dataset.itemId;
  const item = this.actor.items.get(itemId);
  
  const confirmed = await Dialog.confirm({
    title: "Delete Item",
    content: `<p>Delete ${item.name}?</p>`
  });
  
  if (confirmed) await item.delete();
}
```

## Context Preparation Pattern

```javascript
async _prepareContext(options) {
  const context = await super._prepareContext(options);
  
  // Basic data
  context.system = this.actor.system;
  context.flags = this.actor.flags;
  
  // Prepare characteristics
  for (let [k, v] of Object.entries(context.system.characteristics)) {
    v.label = game.i18n.localize(game.deathwatch.config.CharacteristicWords[k]) ?? k;
  }
  
  // Categorize items
  context.weapons = [];
  context.armor = [];
  context.gear = [];
  
  for (let item of this.actor.items) {
    if (item.type === 'weapon') context.weapons.push(item);
    else if (item.type === 'armor') context.armor.push(item);
    else if (item.type === 'gear') context.gear.push(item);
  }
  
  // Add config
  context.config = game.deathwatch.config;
  
  return context;
}
```

## Partial Rendering

```javascript
// Re-render only the equipment section
async refreshEquipment() {
  await this.render({ parts: ["equipment"] });
}

// Re-render multiple parts
async refreshCombatStats() {
  await this.render({ parts: ["combat", "characteristics"] });
}
```

## Form Handling

```javascript
// V2 handles form submission automatically
// Override _onSubmit if custom logic needed
async _onSubmit(formData, event) {
  // Custom validation
  if (formData.system.wounds.value > formData.system.wounds.max) {
    ui.notifications.warn("Wounds cannot exceed maximum");
    return;
  }
  
  return super._onSubmit(formData, event);
}
```

## Drag and Drop

```javascript
async _onDrop(event) {
  const data = TextEditor.getDragEventData(event);
  
  if (data.type === "Item") {
    const item = await Item.implementation.fromDropData(data);
    
    // Custom drop logic
    if (item.type === "chapter") {
      return this._onDropChapter(item);
    }
  }
  
  return super._onDrop(event);
}

async _onDropChapter(item) {
  // Remove existing chapter
  if (this.actor.system.chapterId) {
    const existing = this.actor.items.get(this.actor.system.chapterId);
    await existing?.delete();
  }
  
  // Add new chapter
  const created = await Item.create(item.toObject(), { parent: this.actor });
  await this.actor.update({ "system.chapterId": created.id });
}
```

## Feature Flag Pattern

```javascript
// In deathwatch.mjs
Hooks.once('init', () => {
  game.settings.register('deathwatch', 'useV2Sheets', {
    name: 'Use ApplicationV2 Sheets (Experimental)',
    hint: 'Enable the new sheet architecture. Requires reload.',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: () => window.location.reload()
  });
});

// Register appropriate sheet
Hooks.once('init', () => {
  const useV2 = game.settings.get('deathwatch', 'useV2Sheets');
  
  if (useV2) {
    Actors.registerSheet('deathwatch', DeathwatchActorSheetV2, {
      makeDefault: true
    });
  } else {
    Actors.registerSheet('deathwatch', DeathwatchActorSheet, {
      makeDefault: true
    });
  }
});
```

## Testing Pattern

```javascript
// tests/actor-sheet-v2.test.mjs
import { DeathwatchActorSheetV2 } from '../src/module/sheets/actor-sheet-v2.mjs';

describe('DeathwatchActorSheetV2', () => {
  let actor, sheet;
  
  beforeEach(() => {
    actor = new Actor({ name: 'Test', type: 'character' });
    sheet = new DeathwatchActorSheetV2({ document: actor });
  });
  
  describe('_prepareContext', () => {
    it('should prepare characteristics with labels', async () => {
      const context = await sheet._prepareContext({});
      expect(context.system.characteristics.ws.label).toBeDefined();
    });
  });
  
  describe('_onRollCharacteristic', () => {
    it('should roll characteristic', async () => {
      const event = new Event('click');
      const target = { dataset: { characteristic: 'ws', label: 'Weapon Skill' } };
      
      await DeathwatchActorSheetV2._onRollCharacteristic.call(
        { actor }, 
        event, 
        target
      );
      
      // Assert roll was made
    });
  });
});
```
