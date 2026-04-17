# Talent Modifiers Tab Design

**Date:** 2026-04-16  
**Status:** Approved  
**Approach:** Direct Template Copy

---

## Overview

Add a "Modifiers" tab to the Talent item sheet that displays and manages modifiers attached to talents. The tab will be identical to the existing Trait modifiers tab, providing full CRUD operations (Create, Read, Update, Delete) and enable/disable toggling.

---

## Context

Talents in the Deathwatch system can have modifiers that affect character statistics (wounds, psy rating, characteristics, etc.). Examples include:
- **Sound Constitution**: +1 wounds modifier
- **Psy Rating 3**: +3 psy-rating modifier
- **Hyperactive Nymune Organ**: characteristic modifiers

The modifier data is already stored in the schema (`DeathwatchItemBase.modifiers` array), and action handlers already exist in `item-sheet-v2.mjs`. However, the Talent edit sheet lacks a UI to display and edit these modifiers, making them invisible to users.

The Trait item type has an existing, fully-functional Modifiers tab that can be replicated for Talents.

---

## Requirements

1. Add a "Modifiers" tab to the Talent item sheet
2. Position it between "Description" and "Attributes" tabs
3. Use the same layout and functionality as the Trait modifiers tab
4. Support all modifier operations:
   - Create new modifier
   - Edit existing modifier
   - Delete modifier
   - Toggle modifier enabled/disabled
5. Display modifier name, value, and effect type

---

## Architecture

### Component Changes

**Single file modification:**
- `src/templates/item/item-talent-sheet.html`

**No other changes needed:**
- ✅ Schema already supports modifiers (`DeathwatchItemBase.modifiers`)
- ✅ Action handlers already exist (`DeathwatchItemSheetV2` lines 202-243)
  - `createModifier`
  - `editModifier`
  - `deleteModifier`
  - `toggleModifier`
- ✅ Modifier edit dialog already exists (`ModifierHelper._showEditDialog`)
- ✅ CSS styling already exists (shared from Trait sheet)

### Design Pattern

This follows the existing codebase pattern where each item type has its own standalone template. While this creates minor HTML duplication (25 lines), it maintains consistency with the current architecture where all 21 item sheets are self-contained templates.

---

## Implementation Details

### File: `src/templates/item/item-talent-sheet.html`

#### Change 1: Update Tab Navigation (Line ~10)

**Before:**
```html
<nav class="sheet-tabs tabs" data-group="primary">
  <a class="item" data-tab="description">Description</a>
  <a class="item" data-tab="attributes">Attributes</a>
  <a class="item" data-tab="source">Source</a>
</nav>
```

**After:**
```html
<nav class="sheet-tabs tabs" data-group="primary">
  <a class="item" data-tab="description">Description</a>
  <a class="item" data-tab="modifiers">Modifiers</a>
  <a class="item" data-tab="attributes">Attributes</a>
  <a class="item" data-tab="source">Source</a>
</nav>
```

#### Change 2: Add Modifiers Tab Content (After Description Tab, Line ~28)

Insert between the Description tab closing `</div>` and the Attributes tab opening `<div>`:

```html
<div class="tab" data-group="primary" data-tab="modifiers">
  <h3 class="section-header">Modifiers</h3>
  <ol class="items-list modifiers-list">
    <li class="item flexrow items-header">
      <div class="item-name">Name</div>
      <div class="item-modifier">Modifier</div>
      <div class="item-effect-type">Effect Type</div>
      <div class="item-controls">
        <a class="item-control modifier-create" data-action="createModifier" title="Create Modifier"><i class="fas fa-plus"></i></a>
      </div>
    </li>
    {{#each system.modifiers as |modifier id|}}
    <li class="item flexrow modifier" data-modifier-id="{{modifier._id}}">
      <div class="item-name">{{modifier.name}}</div>
      <div class="item-modifier">{{modifier.modifier}}</div>
      <div class="item-effect-type">{{modifier.effectType}}</div>
      <div class="item-controls">
        <a class="item-control modifier-toggle" data-action="toggleModifier" title="{{#if modifier.enabled}}Disable{{else}}Enable{{/if}}"><i class="fas {{#if modifier.enabled}}fa-check{{else}}fa-times{{/if}}"></i></a>
        <a class="item-control modifier-edit" data-action="editModifier" title="Edit Modifier"><i class="fas fa-edit"></i></a>
        <a class="item-control modifier-delete" data-action="deleteModifier" title="Delete Modifier"><i class="fas fa-trash"></i></a>
      </div>
    </li>
    {{/each}}
  </ol>
</div>
```

**Source:** Copied directly from `src/templates/item/item-trait-sheet.html` lines 29-53.

---

## Testing Approach

### Manual Verification

1. **Open existing talent with modifiers:**
   - Sound Constitution (`tal00000000244`)
   - Psy Rating 3 (`tal00000000275`)
   - Verify Modifiers tab appears in navigation
   - Verify existing modifiers display correctly

2. **Test CRUD operations:**
   - Click "+ Create Modifier" — verify dialog opens
   - Edit existing modifier — verify dialog shows current values
   - Delete modifier — verify confirmation and removal
   - Toggle modifier enabled/disabled — verify icon updates

3. **Test empty state:**
   - Open talent without modifiers
   - Verify empty list displays (just header row)

4. **Tab navigation:**
   - Click through all tabs (Description → Modifiers → Attributes → Source)
   - Verify tab switching works correctly
   - Verify active tab highlighting

### Edge Cases

- Talent with empty `modifiers` array → should show header only
- Talent with `undefined` modifiers → should show header only (Handlebars `{{#each}}` handles this)
- Modifier with `enabled: false` → should show `fa-times` icon instead of `fa-check`
- Very long modifier names → verify truncation/wrapping

### Regression Testing

- **Trait sheet:** Verify Trait modifiers tab still works (unchanged)
- **Other Talent tabs:** Verify Description, Attributes, Source tabs unaffected
- **Other item sheets:** Quick check that other item types render correctly

### No Automated Tests Needed

This is pure template HTML that reuses existing, tested action handlers. The handlers are already covered by the item sheet test suite. No new business logic is introduced.

---

## Success Criteria

1. ✅ Modifiers tab appears in Talent sheet navigation
2. ✅ Modifiers tab positioned between Description and Attributes
3. ✅ Existing modifiers display in table format
4. ✅ Create, Edit, Delete, Toggle operations work
5. ✅ Empty state displays correctly (no modifiers)
6. ✅ Visual consistency with Trait modifiers tab
7. ✅ No regressions in other item sheets

---

## Future Considerations

### Potential Shared Partial (Not Included in This Design)

If more item types need modifier tabs in the future, consider extracting the modifiers tab HTML into a reusable Handlebars partial:

```
src/templates/item/partials/modifiers-tab.html
```

This would require:
1. Registering the partial in `src/module/helpers/ui/templates.mjs`
2. Replacing inline HTML with `{{> modifiers-tab}}`
3. Testing all item types that use the partial

**Decision:** Not implementing now because:
- Only 2 item types use it (Trait, Talent)
- 25 lines of HTML duplication is acceptable
- Codebase pattern favors standalone templates
- Can refactor later if more types need it

---

## Implementation Estimate

**Effort:** 5 minutes  
**Files Changed:** 1  
**Lines Changed:** ~30 (additions only, no deletions)  
**Risk:** Very low (proven pattern, no logic changes)
