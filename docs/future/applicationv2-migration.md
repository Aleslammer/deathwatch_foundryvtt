# ApplicationV2 Migration Plan

## Overview
This document outlines the plan to migrate from Foundry VTT's legacy V1 sheet architecture to the new ApplicationV2 architecture introduced in v13. The V1 sheets will be removed in v15, making this migration necessary.

## Current State
- Using `foundry.applications.sheets.ActorSheet` (V1 legacy)
- Using `foundry.applications.sheets.ItemSheet` (V1 legacy)
- Traditional lifecycle: `defaultOptions`, `getData()`, `activateListeners()`
- jQuery-based event handling
- Handlebars templates with manual rendering

## Target State
- Use `foundry.applications.sheets.ActorSheetV2` with `HandlebarsApplicationMixin`
- Use `foundry.applications.sheets.ItemSheetV2` with `HandlebarsApplicationMixin`
- New lifecycle: `_prepareContext()`, `_onRender()`, `_onClickAction()`
- Native event handling with `data-action` attributes
- Reactive rendering with automatic updates

## Key Architectural Changes

### 1. Class Structure
**Before (V1):**
```javascript
export class DeathwatchActorSheet extends foundry.applications.sheets.ActorSheet {
  static get defaultOptions() { }
  get template() { }
  getData() { }
  activateListeners(html) { }
}
```

**After (V2):**
```javascript
export class DeathwatchActorSheet extends foundry.applications.sheets.ActorSheetV2.mixin(
  foundry.applications.api.HandlebarsApplicationMixin
) {
  static DEFAULT_OPTIONS = { }
  static PARTS = { }
  async _prepareContext(options) { }
  _onRender(context, options) { }
  static _onClickAction(event, target) { }
}
```

### 2. Configuration
**Before:** `defaultOptions()` method returns merged object
**After:** `DEFAULT_OPTIONS` static property with declarative structure

### 3. Data Preparation
**Before:** `getData()` returns context object
**After:** `_prepareContext()` returns context object (async by default)

### 4. Event Handling
**Before:** jQuery selectors in `activateListeners()`
**After:** `data-action` attributes with `_onClickAction()` handler

### 5. Template System
**Before:** Single template path via `get template()`
**After:** Multiple template parts via `PARTS` static property

## Migration Steps

### Phase 1: Preparation (No Breaking Changes)
1. Extract all event handler logic into separate methods
2. Convert jQuery event handlers to named methods
3. Create action handler mapping document
4. Ensure all helpers are pure functions
5. Add comprehensive tests for all sheet functionality

### Phase 2: Template Refactoring
1. Split monolithic templates into logical parts:
   - `header`: Character name, rank, chapter
   - `tabs`: Navigation tabs
   - `characteristics`: Characteristics section
   - `skills`: Skills section
   - `combat`: Combat stats
   - `equipment`: Items and gear
   - `biography`: Character background
2. Update templates to use `data-action` attributes instead of classes
3. Remove jQuery-specific markup

### Phase 3: ActorSheet Migration
1. Create new `DeathwatchActorSheetV2` class
2. Implement `DEFAULT_OPTIONS` configuration
3. Implement `PARTS` template structure
4. Migrate `getData()` → `_prepareContext()`
5. Migrate `activateListeners()` → `_onClickAction()` + `_onRender()`
6. Test all functionality
7. Add feature flag to toggle between V1/V2
8. Deprecate V1 sheet

### Phase 4: ItemSheet Migration
1. Create new `DeathwatchItemSheetV2` class
2. Follow same pattern as ActorSheet
3. Handle type-specific templates in PARTS
4. Test all item types
5. Add feature flag
6. Deprecate V1 sheet

### Phase 5: Cleanup
1. Remove V1 sheet classes
2. Remove jQuery dependencies
3. Update documentation
4. Update tests

## Detailed Component Mapping

### ActorSheet Components

#### DEFAULT_OPTIONS
```javascript
static DEFAULT_OPTIONS = {
  classes: ["deathwatch", "sheet", "actor"],
  position: { width: 1000, height: 800 },
  actions: {
    rollCharacteristic: DeathwatchActorSheetV2._onRollCharacteristic,
    rollSkill: DeathwatchActorSheetV2._onRollSkill,
    weaponAttack: DeathwatchActorSheetV2._onWeaponAttack,
    weaponDamage: DeathwatchActorSheetV2._onWeaponDamage,
    toggleEquip: DeathwatchActorSheetV2._onToggleEquip,
    createItem: DeathwatchActorSheetV2._onCreateItem,
    editItem: DeathwatchActorSheetV2._onEditItem,
    deleteItem: DeathwatchActorSheetV2._onDeleteItem,
    createModifier: DeathwatchActorSheetV2._onCreateModifier,
    editModifier: DeathwatchActorSheetV2._onEditModifier,
    deleteModifier: DeathwatchActorSheetV2._onDeleteModifier,
    toggleModifier: DeathwatchActorSheetV2._onToggleModifier
  },
  window: { title: "ACTOR.TypeCharacter" }
}
```

#### PARTS Structure
```javascript
static PARTS = {
  header: {
    template: "systems/deathwatch/templates/actor/parts/header.hbs"
  },
  tabs: {
    template: "systems/deathwatch/templates/actor/parts/tabs.hbs"
  },
  characteristics: {
    template: "systems/deathwatch/templates/actor/parts/characteristics.hbs",
    scrollable: [""]
  },
  skills: {
    template: "systems/deathwatch/templates/actor/parts/skills.hbs",
    scrollable: [""]
  },
  combat: {
    template: "systems/deathwatch/templates/actor/parts/combat.hbs"
  },
  equipment: {
    template: "systems/deathwatch/templates/actor/parts/equipment.hbs",
    scrollable: [""]
  },
  modifiers: {
    template: "systems/deathwatch/templates/actor/parts/modifiers.hbs",
    scrollable: [""]
  },
  biography: {
    template: "systems/deathwatch/templates/actor/parts/biography.hbs",
    scrollable: [""]
  }
}
```

#### Event Handler Migration Map

| V1 Handler | V2 Action | Method |
|------------|-----------|--------|
| `.rollable[data-roll-type="characteristic"]` | `data-action="rollCharacteristic"` | `_onRollCharacteristic()` |
| `.rollable[data-roll-type="skill"]` | `data-action="rollSkill"` | `_onRollSkill()` |
| `.item-equip` | `data-action="toggleEquip"` | `_onToggleEquip()` |
| `.item-create` | `data-action="createItem"` | `_onCreateItem()` |
| `.item-edit` | `data-action="editItem"` | `_onEditItem()` |
| `.item-delete` | `data-action="deleteItem"` | `_onDeleteItem()` |
| `.weapon-attack-btn` | `data-action="weaponAttack"` | `_onWeaponAttack()` |
| `.weapon-damage-btn` | `data-action="weaponDamage"` | `_onWeaponDamage()` |
| `.weapon-unjam-btn` | `data-action="weaponUnjam"` | `_onWeaponUnjam()` |
| `.modifier-create` | `data-action="createModifier"` | `_onCreateModifier()` |
| `.modifier-edit` | `data-action="editModifier"` | `_onEditModifier()` |
| `.modifier-delete` | `data-action="deleteModifier"` | `_onDeleteModifier()` |
| `.modifier-toggle` | `data-action="toggleModifier"` | `_onToggleModifier()` |
| `.history-show` | `data-action="showHistory"` | `_onShowHistory()` |
| `.history-remove` | `data-action="removeHistory"` | `_onRemoveHistory()` |
| `.chapter-remove` | `data-action="removeChapter"` | `_onRemoveChapter()` |
| `.specialty-remove` | `data-action="removeSpecialty"` | `_onRemoveSpecialty()` |

### ItemSheet Components

#### DEFAULT_OPTIONS
```javascript
static DEFAULT_OPTIONS = {
  classes: ["deathwatch", "sheet", "item"],
  position: { width: 520, height: 480 },
  actions: {
    createModifier: DeathwatchItemSheetV2._onCreateModifier,
    editModifier: DeathwatchItemSheetV2._onEditModifier,
    deleteModifier: DeathwatchItemSheetV2._onDeleteModifier,
    toggleModifier: DeathwatchItemSheetV2._onToggleModifier,
    weaponAttack: DeathwatchItemSheetV2._onWeaponAttack,
    weaponDamage: DeathwatchItemSheetV2._onWeaponDamage,
    removeHistory: DeathwatchItemSheetV2._onRemoveHistory
  },
  window: { title: "ITEM.TypeItem" }
}
```

#### PARTS Structure
```javascript
static PARTS = {
  header: {
    template: "systems/deathwatch/templates/item/parts/header.hbs"
  },
  tabs: {
    template: "systems/deathwatch/templates/item/parts/tabs.hbs"
  },
  description: {
    template: "systems/deathwatch/templates/item/parts/description.hbs"
  },
  details: {
    template: "systems/deathwatch/templates/item/parts/details-{{type}}.hbs"
  },
  modifiers: {
    template: "systems/deathwatch/templates/item/parts/modifiers.hbs"
  }
}
```

## Template Changes

### Before (V1):
```handlebars
<a class="item-edit" data-item-id="{{item._id}}">
  <i class="fas fa-edit"></i>
</a>
```

### After (V2):
```handlebars
<button type="button" data-action="editItem" data-item-id="{{item._id}}">
  <i class="fas fa-edit"></i>
</button>
```

## Benefits of Migration

1. **Performance**: Reactive rendering only updates changed parts
2. **Maintainability**: Declarative configuration vs imperative code
3. **Type Safety**: Better TypeScript support
4. **Modularity**: Template parts enable better code organization
5. **Future-Proof**: V1 will be removed in Foundry v15
6. **Native Events**: No jQuery dependency
7. **Accessibility**: Better semantic HTML with buttons vs anchors

## Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation**: Implement feature flag to run V1 and V2 in parallel during transition

### Risk 2: Template Complexity
**Mitigation**: Start with simple templates, iterate based on testing

### Risk 3: Event Handler Bugs
**Mitigation**: Comprehensive test coverage before migration

### Risk 4: User Disruption
**Mitigation**: Thorough testing, beta release, clear migration notes

## Testing Strategy

1. **Unit Tests**: Test all action handlers independently
2. **Integration Tests**: Test sheet rendering and interactions
3. **Regression Tests**: Ensure V2 matches V1 functionality
4. **User Acceptance Testing**: Beta testers validate real-world usage

## Timeline Estimate

- **Phase 1 (Preparation)**: 1-2 weeks
- **Phase 2 (Templates)**: 2-3 weeks
- **Phase 3 (ActorSheet)**: 3-4 weeks
- **Phase 4 (ItemSheet)**: 2-3 weeks
- **Phase 5 (Cleanup)**: 1 week
- **Total**: 9-13 weeks

## Resources

- [Foundry VTT ApplicationV2 Documentation](https://foundryvtt.com/api/modules/foundry.applications.api.html)
- [HandlebarsApplicationMixin](https://foundryvtt.com/api/classes/foundry.applications.api.HandlebarsApplicationMixin.html)
- [ActorSheetV2](https://foundryvtt.com/api/classes/foundry.applications.sheets.ActorSheetV2.html)
- [ItemSheetV2](https://foundryvtt.com/api/classes/foundry.applications.sheets.ItemSheetV2.html)

## Decision Points

### When to Start?
- **Now**: Begin preparation phase immediately
- **After v14 Release**: Wait for ecosystem maturity
- **Before v15**: Must complete before V1 removal

### Recommended**: Start Phase 1 now, begin full migration after Foundry v14 stabilizes

### Migration Strategy?
- **Big Bang**: Replace everything at once
- **Incremental**: Run V1 and V2 in parallel with feature flag
- **Recommended**: Incremental with feature flag for safety

## Success Criteria

- [ ] All V1 functionality replicated in V2
- [ ] All tests passing
- [ ] No jQuery dependencies in sheet code
- [ ] Performance equal or better than V1
- [ ] User feedback positive
- [ ] Documentation updated
- [ ] Zero regression bugs in production

## Next Steps

1. Review and approve this plan
2. Create GitHub issues for each phase
3. Set up feature flag system
4. Begin Phase 1 preparation work
5. Schedule regular progress reviews
