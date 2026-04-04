# ApplicationV2 Quick Reference

## V1 vs V2 Comparison

| Aspect | V1 (Legacy) | V2 (Modern) |
|--------|-------------|-------------|
| **Actor Sheet** | `ActorSheet` | `HandlebarsApplicationMixin(ActorSheetV2)` |
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
export class DeathwatchActorSheetV2 extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
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

### 4. NEVER Mutate Static PARTS Template
```javascript
// ❌ BROKEN — shared across all instances, causes wrong templates
this.constructor.PARTS.sheet.template = `item-${this.document.type}-sheet.html`;

// ✅ CORRECT — override _renderHTML to compile per-instance
async _renderHTML(context, options) {
  const template = `systems/deathwatch/templates/item/item-${this.document.type}-sheet.html`;
  const compiled = await foundry.applications.handlebars.getTemplate(template);
  const htmlString = compiled(context, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });
  const temp = document.createElement("div");
  temp.innerHTML = htmlString;
  return { sheet: temp.firstElementChild };
}
```

### 5. Use Namespaced Globals (v13)
```javascript
// ❌ Deprecated globals
ActorSheet, ItemSheet, Actors, Items, loadTemplates, Tabs

// ✅ Namespaced
foundry.appv1.sheets.ActorSheet
foundry.appv1.sheets.ItemSheet
foundry.documents.collections.Actors
foundry.documents.collections.Items
foundry.applications.handlebars.loadTemplates
foundry.applications.ux.Tabs
```

### 6. Mixin Pattern (v13)
```javascript
// ❌ Wrong — .mixin() doesn't exist on sheet classes
class MySheet extends ActorSheetV2.mixin(HandlebarsApplicationMixin) {}

// ✅ Correct — same pattern as CohesionPanel
class MySheet extends HandlebarsApplicationMixin(ActorSheetV2) {}
```

### 7. Template Wrapper Must Be `<div>` Not `<form>`
V2 provides its own outer `<form>`. Nested `<form>` tags are silently stripped by browsers, losing all flex layout classes.

### 8. Don't Use `<header>` Element in Templates
V2 intercepts `<header>` elements for window chrome. Use `<div class="sheet-header">` instead.

### 9. Re-render After Data Mutations
V2 doesn't auto-re-render when action handlers update documents:
```javascript
static async _onDeleteItem(event, target) {
  const item = this.actor.items.get(target.dataset.itemId);
  await item?.delete();
  this.render();  // ← Required!
}
```

### 10. Add V1 Context Variables
V2's `_prepareContext()` doesn't provide `actor`, `cssClass`, `editable`, `owner`:
```javascript
async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.actor = this.actor;
  context.cssClass = this.isEditable ? "editable" : "locked";
  context.editable = this.isEditable;
  context.owner = this.actor.isOwner;
  // ...
}
```

### 11. Override Window Title
```javascript
get title() {
  return this.document.name;  // Instead of "TYPES.Actor.character: Bob"
}
```

### 12. V1-Style Tabs in _onRender
```javascript
_onRender(context, options) {
  const html = this.element;
  const tabNav = html.querySelector('.sheet-tabs');
  if (tabNav) {
    const tabs = new foundry.applications.ux.Tabs({ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' });
    tabs.bind(html);
    tabs.activate(this._activeTab || 'description');
  }
}
```

### 13. Dark Theme CSS
V2 has dark background. Override `.form-group` to `flex-direction: row`, add light text colors, replace inline `background: #f0f0f0` with CSS classes.

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
