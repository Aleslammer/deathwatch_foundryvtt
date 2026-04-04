# Phase 7: CSS and Template Updates

## Goal
Update CSS and Handlebars templates for v14 visual compatibility and V2 sheet patterns.

## 1. CSS Changes

### Foundry Base CSS Variables
v14 may update or rename CSS custom properties. Audit our usage of Foundry variables:

**Our CSS files** (10 component files + 2 base files):
```
src/styles/
├── variables.css          — Our custom variables
├── base.css               — Base styles
├── deathwatch.css         — Entry point (imports all)
└── components/
    ├── characteristics.css
    ├── cohesion.css
    ├── dialogs.css
    ├── items.css
    ├── modifiers.css
    ├── sheets.css
    ├── skills.css
    ├── tooltips.css
    └── wounds.css
```

### Potential Issues
1. **Window chrome** — V2 ApplicationV2 windows have different HTML structure than V1. Our `.cohesion-panel` styles may need adjustment.
2. **Sheet layout** — V2 sheets may have different wrapper elements. Our `.deathwatch.sheet.actor` selectors may not match.
3. **Form elements** — v14 may restyle form inputs, selects, checkboxes.
4. **Dialog styling** — DialogV2 has different HTML structure than Dialog.
5. **Chat messages** — Chat card styling may change.

### Migration Strategy
1. Load on v14, screenshot all sheets and compare to v13
2. Fix any broken layouts
3. Update selectors for V2 wrapper elements
4. Test all component styles

### V2 Sheet CSS Considerations
V2 sheets use different wrapper classes:
```css
/* V1 */
.deathwatch.sheet.actor { ... }
.deathwatch.sheet.item { ... }

/* V2 — verify actual class structure */
.deathwatch.sheet.actor { ... }  /* May still work if classes are preserved */
```

Ensure `DEFAULT_OPTIONS.classes` includes the same classes:
```javascript
static DEFAULT_OPTIONS = {
  classes: ["deathwatch", "sheet", "actor"],
  // ...
};
```

## 2. Template Updates

### Template File Extension
V2 conventionally uses `.hbs` extension instead of `.html` for Handlebars templates. This is optional but recommended for clarity.

**Decision**: Keep `.html` extension during migration to minimize changes. Rename to `.hbs` in a separate cleanup pass.

### data-action Attributes
All interactive elements need `data-action` attributes for V2 event handling. This is the biggest template change.

**Pattern**:
```handlebars
{{!-- V1: class-based --}}
<a class="item-edit" data-item-id="{{item._id}}">
  <i class="fas fa-edit"></i>
</a>

{{!-- V2: action-based --}}
<button type="button" data-action="editItem" data-item-id="{{item._id}}">
  <i class="fas fa-edit"></i>
</button>
```

### Templates to Update

#### Actor Templates (4 main + 17 partials)
- `actor-character-sheet.html`
- `actor-npc-sheet.html`
- `actor-enemy-sheet.html`
- `actor-horde-sheet.html`
- All 17 partials in `templates/actor/parts/`

#### Item Templates (17 type-specific)
- All `item-*-sheet.html` files

#### UI Templates
- `templates/ui/cohesion-panel.html`

### Semantic HTML
V2 prefers `<button>` over `<a>` for actions:
```handlebars
{{!-- V1 --}}
<a class="item-control item-edit"><i class="fas fa-edit"></i></a>

{{!-- V2 --}}
<button type="button" data-action="editItem"><i class="fas fa-edit"></i></button>
```

This may require CSS adjustments since `<button>` has different default styling than `<a>`.

### Form Handling
V2 sheets handle form submission automatically. Ensure all form inputs have proper `name` attributes:
```handlebars
<input type="number" name="system.characteristics.ws.base" value="{{system.characteristics.ws.base}}" />
```
This pattern is already used throughout our templates.

## 3. Handlebars Helpers

### Current Custom Helpers
Registered in `helpers/ui/handlebars.js`:
- `config` — access game config
- `enrich` — TextEditor.enrichHTML
- `qualityList` — format weapon qualities for tooltip
- Various comparison helpers

### v14 Changes
- `TextEditor.enrichHTML()` may have API changes (async handling)
- Verify all helper functions still work
- Handlebars itself is unlikely to change

## 4. Template Preloading

### Current
```javascript
export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([
    "systems/deathwatch/templates/actor/parts/actor-characteristics.html",
    // ... all partials
  ]);
};
```

### v14 Changes
`loadTemplates()` should still work. If template paths change (e.g., `.hbs` extension), update the preload list.

## Migration Steps

1. Load on v14, identify visual breakage
2. Update CSS selectors for V2 wrapper elements
3. Add `data-action` attributes to all interactive elements
4. Convert `<a>` action elements to `<button>`
5. Add CSS for button styling to match current appearance
6. Test all templates render correctly
7. Verify Handlebars helpers work
8. Verify template preloading works

## Validation
- [ ] All actor sheets visually match v13 appearance
- [ ] All item sheets visually match v13 appearance
- [ ] CohesionPanel visually correct
- [ ] Dialog styling correct
- [ ] Chat message styling correct
- [ ] Tooltips display correctly
- [ ] Characteristic boxes styled correctly
- [ ] Skill table styled correctly
- [ ] Wound/fatigue boxes styled correctly
- [ ] Modifier list styled correctly
- [ ] Collapsible sections animate correctly
- [ ] No CSS console warnings
