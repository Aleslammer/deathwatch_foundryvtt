# Code Refactoring Recommendations

## Executive Summary
The codebase is well-structured with good separation of concerns. Key improvements focus on:
1. Extracting business logic from actor.mjs into specialized helpers
2. Reducing code duplication in actor-sheet.mjs
3. Improving CSS organization and reducing specificity
4. Better separation of UI and business logic

## Priority 1: Critical Refactoring

### 1.1 Extract XP Calculation Logic from Actor
**File**: `src/module/documents/actor.mjs`
**Issue**: _prepareCharacterData() is 250+ lines with complex XP calculation logic
**Solution**: Create `src/module/helpers/xp-calculator.mjs`

```javascript
// New file: src/module/helpers/xp-calculator.mjs
export class XPCalculator {
  static calculateRank(totalXP) { /* ... */ }
  static calculateSpentXP(actor, chapterSkillCosts, chapterTalentCosts) { /* ... */ }
  static getTalentCost(item, chapterTalentCosts) { /* ... */ }
  static getSkillCosts(skill, chapterSkillCosts) { /* ... */ }
}
```

**Benefits**:
- Testable in isolation
- Reusable across system
- Reduces actor.mjs complexity
- Easier to maintain

### 1.2 Extract Modifier Collection Logic
**File**: `src/module/documents/actor.mjs`
**Issue**: Modifier collection scattered across _prepareCharacterData()
**Solution**: Create `src/module/helpers/modifier-collector.mjs`

```javascript
// New file: src/module/helpers/modifier-collector.mjs
export class ModifierCollector {
  static collectAllModifiers(actor) { /* ... */ }
  static collectItemModifiers(items) { /* ... */ }
  static collectArmorHistoryModifiers(armor, items) { /* ... */ }
  static applyCharacteristicModifiers(characteristics, modifiers) { /* ... */ }
  static applySkillModifiers(skills, modifiers) { /* ... */ }
  static applyInitiativeModifiers(modifiers) { /* ... */ }
}
```

**Benefits**:
- Single responsibility
- Easier to test
- Clearer data flow
- Reduces actor.mjs from 300+ to ~100 lines

### 1.3 Extract Dialog HTML Generation
**File**: `src/module/sheets/actor-sheet.mjs`
**Issue**: Large HTML strings embedded in methods (200+ lines in _onCharacteristicRoll, _onSkillRoll)
**Solution**: Create `src/module/helpers/dialog-templates.mjs`

```javascript
// New file: src/module/helpers/dialog-templates.mjs
export class DialogTemplates {
  static buildCharacteristicRollDialog(characteristic, label) { /* ... */ }
  static buildSkillRollDialog(skill, label) { /* ... */ }
  static buildModifierSelect(difficulties, selected = 'challenging') { /* ... */ }
}
```

**Benefits**:
- Separation of concerns
- Easier to maintain HTML
- Reusable templates
- Reduces sheet complexity

## Priority 2: Code Duplication

### 2.1 Consolidate Roll Dialog Logic
**Files**: `src/module/sheets/actor-sheet.mjs`
**Issue**: _onCharacteristicRoll() and _onSkillRoll() have 90% identical code
**Solution**: Create unified roll handler

```javascript
// In actor-sheet.mjs
async _onRollWithModifiers(rollType, rollData, label) {
  const content = DialogTemplates.buildRollDialog(rollType, rollData, label);
  // Unified dialog logic
}

async _onCharacteristicRoll(dataset) {
  const rollData = this._prepareCharacteristicRollData(dataset);
  return this._onRollWithModifiers('characteristic', rollData, dataset.label);
}

async _onSkillRoll(dataset) {
  const rollData = this._prepareSkillRollData(dataset);
  return this._onRollWithModifiers('skill', rollData, dataset.label);
}
```

**Benefits**:
- DRY principle
- Single source of truth
- Easier to add new roll types
- Reduces code by ~150 lines

### 2.2 Consolidate Chat Message Creation
**Files**: Multiple files create similar chat messages
**Issue**: Repeated patterns for chat message creation
**Solution**: Create `src/module/helpers/chat-message-builder.mjs`

```javascript
// New file: src/module/helpers/chat-message-builder.mjs
export class ChatMessageBuilder {
  static createItemCard(item, actor) { /* ... */ }
  static createRollResult(roll, flavor, speaker) { /* ... */ }
  static createDamageCard(damage, location, target) { /* ... */ }
}
```

## Priority 3: CSS Optimization

### 3.1 Reduce CSS Specificity
**File**: `src/styles/deathwatch.css`
**Issue**: Overly specific selectors (e.g., `.deathwatch .items-list .item .item-name`)
**Solution**: Use BEM methodology or reduce nesting

```css
/* Instead of: .deathwatch .items-list .item .item-name */
.dw-item__name { /* ... */ }

/* Instead of: .deathwatch .modifier-dialog .form-group */
.dw-dialog__form-group { /* ... */ }
```

**Benefits**:
- Faster CSS parsing
- Easier to override
- More maintainable
- Smaller file size

### 3.2 Extract Modifier Dialog Styles
**File**: `src/styles/deathwatch.css`
**Issue**: 100+ lines of modifier dialog styles mixed with other styles
**Solution**: Create `src/styles/components/dialogs.css`

```css
/* New file: src/styles/components/dialogs.css */
.dw-modifier-dialog { /* ... */ }
.dw-modifier-dialog__form-group { /* ... */ }
.dw-modifier-dialog__button { /* ... */ }
```

### 3.3 Use CSS Custom Properties
**Issue**: Repeated color values and magic numbers
**Solution**: Define CSS variables

```css
:root {
  --dw-color-primary: #007bff;
  --dw-color-border: #c9c7b8;
  --dw-color-background: #f8f9fa;
  --dw-spacing-sm: 4px;
  --dw-spacing-md: 8px;
  --dw-spacing-lg: 16px;
}
```

## Priority 4: JavaScript Best Practices

### 4.1 Use Constants for Magic Numbers
**Files**: Multiple files
**Issue**: Magic numbers scattered throughout (e.g., 10, 100, 13000)
**Solution**: Define constants

```javascript
// In constants.mjs
export const XP_CONSTANTS = {
  STARTING_XP: 13000,
  RANK_THRESHOLDS: [13000, 17000, 21000, 25000, 30000, 35000, 40000, 45000]
};

export const CHARACTERISTIC_CONSTANTS = {
  BONUS_DIVISOR: 10,
  MAX_VALUE: 100
};
```

### 4.2 Improve Error Handling
**Files**: Multiple files
**Issue**: Inconsistent error handling and validation
**Solution**: Create validation helper

```javascript
// New file: src/module/helpers/validation.mjs
export class Validation {
  static validateActor(actor, context = 'operation') {
    if (!actor) throw new Error(`Actor required for ${context}`);
    return true;
  }
  
  static validateItem(item, expectedType = null) {
    if (!item) throw new Error('Item required');
    if (expectedType && item.type !== expectedType) {
      throw new Error(`Expected ${expectedType}, got ${item.type}`);
    }
    return true;
  }
}
```

### 4.3 Use Async/Await Consistently
**Files**: Multiple files mix .then() and async/await
**Issue**: Inconsistent promise handling
**Solution**: Standardize on async/await

```javascript
// Instead of:
Item.fromDropData(data).then(item => { /* ... */ });

// Use:
async function handleDrop(data) {
  const item = await Item.fromDropData(data);
  // ...
}
```

## Priority 5: Modularity Improvements

### 5.1 Create Item Type Handlers
**File**: `src/module/sheets/actor-sheet.mjs`
**Issue**: _prepareItems() has large switch/if-else for item types
**Solution**: Create item type handlers

```javascript
// New file: src/module/helpers/item-handlers.mjs
export class ItemHandlers {
  static weapon(item, context) { /* ... */ }
  static armor(item, context) { /* ... */ }
  static talent(item, context) { /* ... */ }
  
  static handle(item, context) {
    const handler = this[item.type];
    return handler ? handler(item, context) : item;
  }
}
```

### 5.2 Extract Event Handlers
**File**: `src/module/sheets/actor-sheet.mjs`
**Issue**: activateListeners() is 200+ lines
**Solution**: Create event handler classes

```javascript
// New file: src/module/sheets/event-handlers.mjs
export class ItemEventHandlers {
  static onItemEdit(event, sheet) { /* ... */ }
  static onItemDelete(event, sheet) { /* ... */ }
  static onItemEquip(event, sheet) { /* ... */ }
}

export class ModifierEventHandlers {
  static onCreate(event, sheet) { /* ... */ }
  static onEdit(event, sheet) { /* ... */ }
  static onDelete(event, sheet) { /* ... */ }
}
```

### 5.3 Create Data Preparation Pipeline
**File**: `src/module/documents/actor.mjs`
**Issue**: prepareDerivedData() calls multiple methods in sequence
**Solution**: Create pipeline pattern

```javascript
// New file: src/module/helpers/data-pipeline.mjs
export class DataPreparationPipeline {
  constructor(actor) {
    this.actor = actor;
    this.steps = [];
  }
  
  addStep(step) {
    this.steps.push(step);
    return this;
  }
  
  async execute() {
    for (const step of this.steps) {
      await step(this.actor);
    }
  }
}

// Usage in actor.mjs
prepareDerivedData() {
  const pipeline = new DataPreparationPipeline(this)
    .addStep(XPCalculator.calculate)
    .addStep(ModifierCollector.collect)
    .addStep(CharacteristicCalculator.calculate);
  
  pipeline.execute();
}
```

## Priority 6: HTML Template Improvements

### 6.1 Extract Repeated Template Patterns
**Files**: Template files
**Issue**: Repeated patterns for item lists, form groups
**Solution**: Create Handlebars partials

```handlebars
{{!-- templates/partials/item-header.hbs --}}
<div class="items-header">
  <div class="item-name">Name</div>
  <div class="item-controls">Controls</div>
</div>

{{!-- Usage --}}
{{> item-header}}
```

### 6.2 Use Data Attributes Consistently
**Files**: Template files
**Issue**: Mix of data-item-id, data-itemId, dataset.itemId
**Solution**: Standardize on kebab-case

```html
<!-- Consistent: -->
<li class="item" data-item-id="{{item._id}}" data-item-type="{{item.type}}">
```

## Implementation Priority

### Phase 1 (Week 1): Critical Refactoring - **IN PROGRESS**
1. ✅ Extract XPCalculator - **COMPLETE** (30 min actual)
2. ⏳ Extract ModifierCollector - **NEXT** (45 min estimated)
3. ⏳ Add tests for new helpers

**Status**: 1/3 complete, ~100 lines reduced, all tests passing

### Phase 2 (Week 2): Code Duplication
1. Consolidate roll dialogs
2. Create ChatMessageBuilder
3. Update tests

### Phase 3 (Week 3): CSS & Templates
1. Reorganize CSS
2. Add CSS variables
3. Create Handlebars partials

### Phase 4 (Week 4): Modularity
1. Create item handlers
2. Extract event handlers
3. Implement data pipeline

## Testing Strategy

### New Test Files Needed
- `tests/xp-calculator.test.mjs`
- `tests/modifier-collector.test.mjs`
- `tests/dialog-templates.test.mjs`
- `tests/chat-message-builder.test.mjs`
- `tests/validation.test.mjs`

### Coverage Goals
- XPCalculator: 95%+
- ModifierCollector: 95%+
- DialogTemplates: 80%+
- ChatMessageBuilder: 90%+

## Metrics

### Current State
- actor.mjs: ~300 lines
- actor-sheet.mjs: ~800 lines
- deathwatch.css: ~1000 lines
- Test coverage: ~60%

### Target State
- actor.mjs: ~100 lines
- actor-sheet.mjs: ~400 lines
- deathwatch.css: ~600 lines (split into modules)
- Test coverage: 75%+

## Breaking Changes
None of these refactorings should introduce breaking changes if done carefully:
- All public APIs remain the same
- Internal refactoring only
- Backward compatible

## Benefits Summary

### Code Quality
- Reduced complexity (actor.mjs: 300 → 100 lines)
- Better separation of concerns
- Improved testability
- Easier maintenance

### Performance
- Faster CSS parsing (reduced specificity)
- Better code splitting potential
- Reduced memory footprint

### Developer Experience
- Clearer code organization
- Easier to find relevant code
- Better IDE support
- Faster onboarding

## Next Steps
1. Review recommendations with team
2. Prioritize based on impact/effort
3. Create GitHub issues for each task
4. Implement in phases
5. Update documentation
