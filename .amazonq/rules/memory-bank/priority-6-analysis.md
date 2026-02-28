# Priority 6 Analysis: HTML Template Improvements

**Status**: ANALYSIS  
**Date**: 2024

## Current State

### Template Organization
```
templates/
├── actor/
│   ├── parts/
│   │   ├── actor-armor.html
│   │   ├── actor-effects.html
│   │   ├── actor-items.html ✅ (already a partial)
│   │   ├── actor-skills.html ✅ (already a partial)
│   │   └── actor-spells.html ✅ (already a partial)
│   ├── actor-character-sheet.html
│   └── actor-npc-sheet.html
└── item/
    ├── parts/ (empty)
    ├── item-ammunition-sheet.html
    ├── item-armor-history-sheet.html
    ├── item-armor-sheet.html
    └── ... (11 more item sheets)
```

**Good News**: The system already uses Handlebars partials for major sections!
- ✅ Skills are in a partial
- ✅ Items/Gear are in a partial
- ✅ Spells are in a partial
- ✅ Effects are in a partial

## Identified Patterns

### 1. Item List Headers (Repeated Pattern)
**Found in**: actor-character-sheet.html, actor-items.html

```handlebars
{{!-- Pattern appears 7+ times --}}
<li class=\"item flexrow items-header\">
  <div class=\"item-name\">Name</div>
  <div class=\"item-{field}\">{Field}</div>
  <div class=\"item-controls\">
    <a class=\"item-control item-create\" title=\"Create {type}\" data-type=\"{type}\">
      <i class=\"fas fa-plus\"></i>
    </a>
  </div>
</li>
```

**Locations**:
- Talents list header
- Traits list header
- Characteristic advances header
- Weapons header
- Armor header
- Gear header
- Ammunition header

### 2. Item Controls (Repeated Pattern)
**Found in**: All item lists

```handlebars
{{!-- Pattern appears 20+ times --}}
<div class=\"item-controls\">
  <a class=\"item-control item-edit\" title=\"Edit Item\"><i class=\"fas fa-edit\"></i></a>
  <a class=\"item-control item-delete\" title=\"Delete Item\"><i class=\"fas fa-trash\"></i></a>
</div>
```

### 3. Equipped Checkbox (Repeated Pattern)
**Found in**: Weapons, Armor, Gear lists

```handlebars
{{!-- Pattern appears 3 times --}}
<div class=\"item-equipped\">
  {{#if item.system.equipped}}
    <a class=\"item-control item-equip\" title=\"Unequip\"><i class=\"fas fa-check\"></i></a>
  {{else}}
    <a class=\"item-control item-equip\" title=\"Equip\"><i class=\"far fa-square\"></i></a>
  {{/if}}
</div>
```

### 4. Item Image (Repeated Pattern)
**Found in**: All item lists

```handlebars
{{!-- Pattern appears 15+ times --}}
<div class=\"item-image\">
  <img src=\"{{item.img}}\" title=\"{{item.name}}\" width=\"24\" height=\"24\"/>
</div>
```

## Proposed Improvements

### Option 1: Create Handlebars Partials (RECOMMENDED)

Create reusable partials for common patterns:

```handlebars
{{!-- templates/actor/parts/item-controls.html --}}
<div class=\"item-controls\">
  <a class=\"item-control item-edit\" title=\"Edit Item\"><i class=\"fas fa-edit\"></i></a>
  <a class=\"item-control item-delete\" title=\"Delete Item\"><i class=\"fas fa-trash\"></i></a>
</div>

{{!-- Usage --}}
{{> \"systems/deathwatch/templates/actor/parts/item-controls.html\"}}
```

**Estimated Impact**:
- Reduce ~60 lines of duplicate HTML
- Easier to maintain (change once, apply everywhere)
- Consistent styling across all lists

### Option 2: Create Handlebars Helpers (ALTERNATIVE)

Register custom helpers for common patterns:

```javascript
// In handlebars.js
Handlebars.registerHelper('itemControls', function(options) {
  return new Handlebars.SafeString(`
    <div class="item-controls">
      <a class="item-control item-edit" title="Edit Item"><i class="fas fa-edit"></i></a>
      <a class="item-control item-delete" title="Delete Item"><i class="fas fa-trash"></i></a>
    </div>
  `);
});

// Usage
{{itemControls}}
```

**Estimated Impact**:
- Reduce ~60 lines of duplicate HTML
- More flexible (can pass parameters)
- Requires JavaScript changes

## Impact Analysis

### Option 1: Handlebars Partials

| Metric | Current | With Partials | Change |
|--------|---------|---------------|--------|
| Duplicate HTML | ~60 lines | 0 | -60 lines |
| New partial files | 0 | 3-4 | +4 files |
| Maintainability | Medium | High | Better |
| Complexity | Low | Low | Same |

**Benefits**:
✅ Reduce duplication  
✅ Easier to maintain  
✅ Consistent styling  
✅ No JavaScript changes needed  
✅ Standard Handlebars approach  

**Drawbacks**:
❌ Slightly more files  
❌ Need to update existing templates  

### Option 2: Handlebars Helpers

| Metric | Current | With Helpers | Change |
|--------|---------|--------------|--------|
| Duplicate HTML | ~60 lines | 0 | -60 lines |
| New helper code | 0 | ~50 lines | +50 lines |
| Maintainability | Medium | High | Better |
| Complexity | Low | Medium | Slightly worse |

**Benefits**:
✅ Reduce duplication  
✅ More flexible (parameters)  
✅ Can include logic  

**Drawbacks**:
❌ Requires JavaScript changes  
❌ HTML in JavaScript (less ideal)  
❌ Harder to test  

## Recommendation

**IMPLEMENT Option 1 (Handlebars Partials)** - But only for high-value patterns.

### High-Value Partials to Create

1. **item-controls.html** (Edit + Delete buttons)
   - Used 20+ times
   - High duplication
   - Easy to extract

2. **item-equipped-checkbox.html** (Equip/Unequip toggle)
   - Used 3 times
   - Moderate duplication
   - Easy to extract

3. **item-image.html** (Item image display)
   - Used 15+ times
   - High duplication
   - Easy to extract

### Low-Value Patterns (Skip)

1. **Item list headers** - Too variable (different columns per list)
2. **Section headers** - Too simple (1 line each)
3. **Form groups** - Already well-organized

## Implementation Plan

### Step 1: Create Partials (15 minutes)

```handlebars
{{!-- templates/actor/parts/item-controls.html --}}
<div class="item-controls">
  <a class="item-control item-edit" title="Edit Item"><i class="fas fa-edit"></i></a>
  <a class="item-control item-delete" title="Delete Item"><i class="fas fa-trash"></i></a>
</div>

{{!-- templates/actor/parts/item-equipped.html --}}
<div class="item-equipped">
  {{#if item.system.equipped}}
    <a class="item-control item-equip" title="Unequip"><i class="fas fa-check"></i></a>
  {{else}}
    <a class="item-control item-equip" title="Equip"><i class="far fa-square"></i></a>
  {{/if}}
</div>

{{!-- templates/actor/parts/item-image.html --}}
<div class="item-image">
  <img src="{{item.img}}" title="{{item.name}}" width="24" height="24"/>
</div>
```

### Step 2: Update Templates (30 minutes)

Replace duplicate HTML with partial includes:

```handlebars
{{!-- Before --}}
<div class="item-controls">
  <a class="item-control item-edit" title="Edit Item"><i class="fas fa-edit"></i></a>
  <a class="item-control item-delete" title="Delete Item"><i class="fas fa-trash"></i></a>
</div>

{{!-- After --}}
{{> "systems/deathwatch/templates/actor/parts/item-controls.html"}}
```

### Step 3: Test (15 minutes)

- Verify all item lists render correctly
- Check edit/delete buttons work
- Verify equip toggles work
- Test in Foundry VTT

**Total Time**: ~60 minutes

## Expected Results

### Code Reduction
- Remove ~60 lines of duplicate HTML
- Add ~15 lines in 3 partial files
- **Net reduction**: ~45 lines

### Maintainability
- Change item controls once, applies everywhere
- Easier to update styling
- Consistent behavior across all lists

### Risk
- **LOW**: Partials are standard Handlebars feature
- **LOW**: Easy to test visually
- **LOW**: Easy to rollback if needed

## Alternative: Do Nothing

**Current state is acceptable**:
- Templates are already well-organized
- Major sections already use partials
- Duplication is manageable (~60 lines total)
- No critical issues

**When to implement**:
- If you need to change item controls styling
- If you're adding many new item types
- If duplication becomes a maintenance burden

## Conclusion

Priority 6 has **MODERATE VALUE**:
- ✅ Would reduce ~45 lines of duplicate HTML
- ✅ Would improve maintainability
- ✅ Low risk, standard approach
- ⚠️ Not critical (current state is acceptable)
- ⚠️ Requires ~60 minutes of work

**Recommendation**: 
- **OPTIONAL** - Implement if you have time
- **SKIP** - If you're satisfied with current state
- **DEFER** - Until you need to modify item controls

---

**Status**: Analysis Complete  
**Decision**: Optional (Low-Medium Value)  
**Estimated Time**: 60 minutes  
**Impact**: Moderate (reduces duplication, improves maintainability)  
**Risk**: Low (standard Handlebars partials)
