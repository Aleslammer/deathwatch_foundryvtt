# ApplicationV2 Quick Reference

## Key Differences: V1 vs V2

| Aspect | V1 (Legacy) | V2 (Modern) |
|--------|-------------|-------------|
| **Base Class** | `ActorSheet` | `ActorSheetV2.mixin(HandlebarsApplicationMixin)` |
| **Options** | `static get defaultOptions()` | `static DEFAULT_OPTIONS = {}` |
| **Template** | `get template()` | `static PARTS = {}` |
| **Data Prep** | `getData()` | `async _prepareContext()` |
| **Events** | `activateListeners(html)` | `data-action` + `_onClickAction()` |
| **Rendering** | Full re-render | Partial re-render |
| **jQuery** | Required | Not needed |
| **Form Submit** | Manual handling | Automatic |

## Migration Checklist

### Class Definition
- [ ] Change extends to `ActorSheetV2.mixin(HandlebarsApplicationMixin)`
- [ ] Convert `defaultOptions()` to `DEFAULT_OPTIONS`
- [ ] Define `PARTS` for template structure
- [ ] Add `tabGroups` if using tabs

### Data Preparation
- [ ] Rename `getData()` to `_prepareContext()`
- [ ] Make method async
- [ ] Call `await super._prepareContext(options)`
- [ ] Return context object

### Event Handlers
- [ ] List all jQuery selectors from `activateListeners()`
- [ ] Create action handler for each
- [ ] Register in `DEFAULT_OPTIONS.actions`
- [ ] Update templates with `data-action` attributes
- [ ] Make handlers static methods

### Templates
- [ ] Split monolithic template into parts
- [ ] Replace class-based selectors with `data-action`
- [ ] Change `<a>` to `<button>` for actions
- [ ] Add `data-*` attributes for handler parameters
- [ ] Remove jQuery-specific markup

### Testing
- [ ] Test all action handlers
- [ ] Test context preparation
- [ ] Test partial rendering
- [ ] Test form submission
- [ ] Test drag and drop

## Common Patterns

### Roll Action
```javascript
// V1
html.find('.rollable').click(this._onRoll.bind(this));

// V2
static DEFAULT_OPTIONS = {
  actions: { roll: this._onRoll }
}
static async _onRoll(event, target) {
  const type = target.dataset.rollType;
  // Roll logic
}
```

### Item Edit
```javascript
// V1
html.find('.item-edit').click(ev => {
  const itemId = $(ev.currentTarget).parents(".item").data("itemId");
  const item = this.actor.items.get(itemId);
  item.sheet.render(true);
});

// V2
static async _onEditItem(event, target) {
  const item = this.actor.items.get(target.dataset.itemId);
  item?.sheet.render(true);
}
```

### Toggle Equipped
```javascript
// V1
html.find('.item-equip').click(async ev => {
  const li = $(ev.currentTarget).closest(".item");
  const item = this.actor.items.get(li.data("itemId"));
  await item.update({ "system.equipped": !item.system.equipped });
});

// V2
static async _onToggleEquip(event, target) {
  const item = this.actor.items.get(target.dataset.itemId);
  await item?.update({ "system.equipped": !item.system.equipped });
}
```

### Create Item
```javascript
// V1
html.find('.item-create').click(this._onItemCreate.bind(this));
async _onItemCreate(event) {
  const type = event.currentTarget.dataset.type;
  const itemData = { name: `New ${type}`, type };
  return await Item.create(itemData, { parent: this.actor });
}

// V2
static async _onCreateItem(event, target) {
  const type = target.dataset.type;
  const itemData = { name: `New ${type}`, type };
  return await Item.create(itemData, { parent: this.actor });
}
```

## Template Conversion

### Before (V1)
```handlebars
<a class="item-edit" data-item-id="{{item._id}}">
  <i class="fas fa-edit"></i>
</a>
<a class="item-delete" data-item-id="{{item._id}}">
  <i class="fas fa-trash"></i>
</a>
<a class="rollable" data-roll-type="skill" data-skill="{{key}}">
  {{skill.label}}
</a>
```

### After (V2)
```handlebars
<button type="button" data-action="editItem" data-item-id="{{item._id}}">
  <i class="fas fa-edit"></i>
</button>
<button type="button" data-action="deleteItem" data-item-id="{{item._id}}">
  <i class="fas fa-trash"></i>
</button>
<button type="button" data-action="rollSkill" data-skill="{{key}}" data-label="{{skill.label}}">
  {{skill.label}}
</button>
```

## Gotchas & Tips

### 1. Action Handlers Must Be Static
```javascript
// ❌ Wrong
actions: { roll: this._onRoll }

// ✅ Correct
actions: { roll: DeathwatchActorSheetV2._onRoll }
```

### 2. Access Sheet Instance in Static Handler
```javascript
static async _onRoll(event, target) {
  // 'this' is the sheet instance
  const actor = this.actor;
  const system = this.document.system;
}
```

### 3. PARTS Template Paths
```javascript
// ❌ Wrong - relative path
template: "templates/actor/header.hbs"

// ✅ Correct - full system path
template: "systems/deathwatch/templates/actor/parts/header.hbs"
```

### 4. Context Must Be Returned
```javascript
// ❌ Wrong
async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.foo = "bar";
  // Missing return!
}

// ✅ Correct
async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.foo = "bar";
  return context;
}
```

### 5. Partial Rendering
```javascript
// Re-render specific parts only
await this.render({ parts: ["equipment", "combat"] });

// Force full re-render
await this.render({ force: true });
```

### 6. Form Data Handling
```javascript
// V2 automatically handles form submission
// Access in _onSubmit or _updateObject
async _updateObject(event, formData) {
  // formData is already processed
  return super._updateObject(event, formData);
}
```

## Performance Tips

1. **Use Partial Rendering**: Only re-render changed parts
2. **Avoid Heavy Computation in _prepareContext**: Cache when possible
3. **Use Scrollable Regions**: Define in PARTS for better UX
4. **Lazy Load Data**: Don't prepare data for hidden tabs

## Debugging

### Enable V2 Debug Logging
```javascript
CONFIG.debug.applications = true;
```

### Check Rendered Parts
```javascript
console.log(sheet.parts);
```

### Inspect Context
```javascript
const context = await sheet._prepareContext({});
console.log(context);
```

## Resources

- [Official V2 Documentation](https://foundryvtt.com/api/modules/foundry.applications.api.html)
- [Migration Guide](https://foundryvtt.com/article/v11-application-migration/)
- [Community Examples](https://github.com/search?q=ActorSheetV2)

## Decision Matrix

| Factor | Use V1 | Use V2 |
|--------|--------|--------|
| Timeline | < 6 months | > 6 months |
| Foundry Version | v12-v13 | v13+ |
| Team Size | Small | Any |
| Complexity | Simple | Complex |
| Performance Needs | Low | High |
| Future-Proofing | No | Yes |

**Recommendation**: Start V2 migration now for any system targeting Foundry v14+
