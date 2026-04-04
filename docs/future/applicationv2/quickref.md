# ApplicationV2 Quick Reference

## V1 vs V2 Comparison

| Aspect | V1 (Legacy) | V2 (Modern) |
|--------|-------------|-------------|
| **Actor Sheet** | `ActorSheet` | `ActorSheetV2.mixin(HandlebarsApplicationMixin)` |
| **Item Sheet** | `ItemSheet` | `ItemSheetV2.mixin(HandlebarsApplicationMixin)` |
| **Application** | `Application` | `HandlebarsApplicationMixin(ApplicationV2)` |
| **Dialog** | `new Dialog({}).render(true)` | `await DialogV2.wait({})` |
| **Options** | `static get defaultOptions()` | `static DEFAULT_OPTIONS = {}` |
| **Template** | `get template()` | `static PARTS = {}` |
| **Data Prep** | `getData()` | `async _prepareContext(options)` |
| **Events** | `activateListeners(html)` + jQuery | `data-action` + static handlers |
| **Rendering** | Full re-render | Partial re-render per PART |
| **jQuery** | Required | Not needed |
| **Form Submit** | Manual handling | Automatic |
| **First Render** | `_render()` override | `_onFirstRender()` |
| **Scroll** | Manual tracking | `scrollable` in PARTS |

## Class Declaration

```javascript
// V1
export class DeathwatchActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["deathwatch", "sheet", "actor"],
      width: 1000, height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "characteristics" }]
    });
  }
}

// V2
export class DeathwatchActorSheetV2 extends foundry.applications.sheets.ActorSheetV2.mixin(
  foundry.applications.api.HandlebarsApplicationMixin
) {
  static DEFAULT_OPTIONS = {
    classes: ["deathwatch", "sheet", "actor"],
    position: { width: 1000, height: 800 },
    window: { title: "ACTOR.TypeCharacter" },
    actions: {
      editItem: this._onEditItem,
      deleteItem: this._onDeleteItem,
      rollCharacteristic: this._onRollCharacteristic
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/deathwatch/templates/actor/actor-character-sheet.hbs",
      scrollable: [".skills-container", ".items-list"]
    }
  };

  tabGroups = { primary: "characteristics" };
}
```

## Data Preparation

```javascript
// V1
getData() {
  const context = super.getData();
  context.system = { ...this.actor.system };
  // ... prepare data
  return context;
}

// V2
async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.system = { ...this.actor.system };
  // ... prepare data (same logic)
  return context;  // MUST return!
}
```

## Event Handlers

```javascript
// V1 — jQuery in activateListeners
activateListeners(html) {
  super.activateListeners(html);
  html.find('.item-edit').click(ev => {
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    item.sheet.render(true);
  });
}

// V2 — static action handler
static async _onEditItem(event, target) {
  const item = this.actor.items.get(target.dataset.itemId);
  item?.sheet.render(true);
}
```

## Template Conversion

```handlebars
{{!-- V1: class-based --}}
<a class="item-edit" data-item-id="{{item._id}}"><i class="fas fa-edit"></i></a>
<a class="item-delete" data-item-id="{{item._id}}"><i class="fas fa-trash"></i></a>
<a class="rollable" data-roll-type="skill" data-skill="{{key}}">{{skill.label}}</a>

{{!-- V2: action-based --}}
<button type="button" data-action="editItem" data-item-id="{{item._id}}"><i class="fas fa-edit"></i></button>
<button type="button" data-action="deleteItem" data-item-id="{{item._id}}"><i class="fas fa-trash"></i></button>
<button type="button" data-action="rollSkill" data-skill="{{key}}" data-label="{{skill.label}}">{{skill.label}}</button>
```

## Dialog Migration

```javascript
// V1 — Multi-button dialog
new Dialog({
  title: "Roll Weapon Skill",
  content: `<div>...</div>`,
  buttons: {
    roll: { label: "Roll", callback: (html) => {
      const value = html.find('#modifier').val();
    }},
    cancel: { label: "Cancel" }
  },
  default: "roll"
}).render(true);

// V2 — DialogV2.wait()
const result = await foundry.applications.api.DialogV2.wait({
  window: { title: "Roll Weapon Skill" },
  content: `<div>...</div>`,
  buttons: [
    { label: "Roll", action: "roll", callback: (event, button, dialog) => {
      return dialog.querySelector('#modifier').value;
    }},
    { label: "Cancel", action: "cancel" }
  ]
});

// V2 — Simple confirm
const confirmed = await foundry.applications.api.DialogV2.confirm({
  window: { title: "Delete Item" },
  content: `<p>Delete ${item.name}?</p>`
});

// V2 — Single-action prompt
const value = await foundry.applications.api.DialogV2.prompt({
  window: { title: "Enter Value" },
  content: `<input type="number" name="value" value="0" />`,
  ok: { label: "Confirm", callback: (event, button, dialog) => {
    return button.form.elements.value.value;
  }}
});
```

## jQuery → Native DOM

```javascript
// V1 (jQuery)
const button = $(ev.currentTarget);
const damage = parseInt(button.data('damage'));
const isPrimitive = button.data('isPrimitive') === 'true';
const li = $(ev.currentTarget).parents(".item");
const itemId = li.data("itemId");

// V2 (Native DOM)
const button = ev.currentTarget;
const damage = parseInt(button.dataset.damage);
const isPrimitive = button.dataset.isPrimitive === 'true';
const li = button.closest(".item");
const itemId = li.dataset.itemId;
```

## Gotchas & Tips

### 1. Action Handlers Are Static But `this` Is the Sheet
```javascript
static async _onRollSkill(event, target) {
  // 'this' is bound to the sheet instance by Foundry
  const actor = this.actor;
  const skill = target.dataset.skill;
}
```

### 2. PARTS Template Paths Must Be Absolute
```javascript
// ❌ Wrong
template: "templates/actor/header.hbs"
// ✅ Correct
template: "systems/deathwatch/templates/actor/parts/header.hbs"
```

### 3. Context Must Be Returned
```javascript
async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.foo = "bar";
  return context;  // ← Don't forget!
}
```

### 4. Partial Rendering
```javascript
await this.render({ parts: ["equipment"] });  // Re-render one part
await this.render({ force: true });            // Force full re-render
```

### 5. First Render Position (CohesionPanel)
```javascript
// V1
async _render(...args) {
  const firstRender = !this._element?.length;
  await super._render(...args);
  if (firstRender) super.setPosition({ left, top: 10 });
}

// V2
_onFirstRender(context, options) {
  this.setPosition({ left: Math.round((window.innerWidth - 220) / 2), top: 10 });
}
```

### 6. Dialog Callback Differences
```javascript
// V1: html is jQuery, use .find().val()
callback: (html) => { const v = html.find('#field').val(); }

// V2: dialog is native Element, use querySelector
callback: (event, button, dialog) => { const v = dialog.querySelector('#field').value; }
// OR use form elements
callback: (event, button, dialog) => { const v = button.form.elements.field.value; }
```

## Debugging

```javascript
CONFIG.debug.applications = true;  // Enable V2 debug logging
console.log(sheet.parts);          // Inspect rendered parts
```

## Related Files
- `migration-plan.md` — Full migration plan with handler inventories, PARTS strategy, validation checklists
- `examples.md` — System-specific V2 code skeletons and DialogV2 examples

## External Resources
- [ApplicationV2 API](https://foundryvtt.com/api/modules/foundry.applications.api.html)
- [HandlebarsApplicationMixin](https://foundryvtt.com/api/classes/foundry.applications.api.HandlebarsApplicationMixin.html)
- [ActorSheetV2](https://foundryvtt.com/api/classes/foundry.applications.sheets.ActorSheetV2.html)
- [ItemSheetV2](https://foundryvtt.com/api/classes/foundry.applications.sheets.ItemSheetV2.html)
