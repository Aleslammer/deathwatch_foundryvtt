# Foundry VTT v13 API Reference

**Official API Documentation**: https://foundryvtt.com/api/v13/

---

## Key Classes for Development

### TextEditor

**API Docs**: https://foundryvtt.com/api/v13/classes/foundry.applications.ux.TextEditor.html

- Use `TextEditor.create({ engine: 'prosemirror', ... }, target)` for rich text editors
- **TinyMCE is DEPRECATED** (will be removed in future versions)
- **ProseMirror is the recommended editor engine**

### ProseMirrorEditor

**API Docs**: https://foundryvtt.com/api/v13/classes/foundry.applications.ux.ProseMirrorEditor.html

- Use `ProseMirrorEditor.create(target, content, options)` for direct ProseMirror instantiation
- Supports collaboration, plugins, and custom configuration

### ApplicationV2

**API Docs**: https://foundryvtt.com/api/v13/classes/foundry.applications.api.ApplicationV2.html

- New sheet architecture (v13+)
- Action handler pattern via `DEFAULT_OPTIONS.actions`
- See [Sheet Architecture](#sheet-architecture) below

### DocumentSheetV2

**API Docs**: https://foundryvtt.com/api/v13/classes/foundry.applications.sheets.DocumentSheetV2.html

- Base class for actor/item sheets in v13
- Replaces FormApplication (v12 and earlier)

---

## Rich Text Editor Usage in V2 Sheets

### ❌ DO NOT Use (ApplicationV1 Only)

```handlebars
{{!-- This is for ApplicationV1 and does NOT work in ApplicationV2 --}}
{{editor content target="system.description" button=true owner=owner editable=editable}}
```

### ✅ USE `<prose-mirror>` Custom Elements

**Pattern**: Native ApplicationV2 web component that self-initializes

```handlebars
<prose-mirror name="system.fieldName"
              value="{{source.fieldName}}"
              document-uuid="{{actor.uuid}}">
</prose-mirror>
```

**Key Requirements:**
- `value` attribute must use `{{source.fieldName}}` (raw source data), NOT `{{system.fieldName}}`
- Add `document-uuid` attribute for proper document binding
- NO manual activation needed - element auto-initializes when rendered
- For non-editable views, provide enriched HTML via `context.enriched` in `_prepareContext()`

---

## Working Example: Biography Editor in Character Sheet

### Template (`src/templates/actor/actor-character-sheet.html`)

```handlebars
<div class="biography-section">
  <h3 class="section-header">Description</h3>
  {{#if editable}}
  <prose-mirror name="system.description"
                value="{{source.description}}"
                document-uuid="{{actor.uuid}}"
                style="min-height: 225px;">
  </prose-mirror>
  {{else}}
  <div class="editor" style="min-height: 225px; border: 1px solid #ccc; border-radius: 3px; padding: 8px;">
    <div class="editor-content">{{{enriched.description}}}</div>
  </div>
  {{/if}}
</div>
```

### Sheet JavaScript (`src/module/sheets/actor-sheet-v2.mjs` in `_prepareContext()`)

```javascript
// Provide source data for prose-mirror value attribute
context.source = this.actor._source.system;

// Enrich HTML for non-editable views
if (!this.isEditable) {
  const enrichmentOptions = {
    secrets: this.actor.isOwner,
    relativeTo: this.actor,
    rollData: context.rollData
  };
  context.enriched = {
    description: await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.description || '',
      enrichmentOptions
    )
  };
}
```

---

## Sheet Architecture

The system uses **Foundry ApplicationV2** sheets exclusively (as of 2026-04-08):

- **Actor sheet**: `src/module/sheets/actor-sheet-v2.mjs`
- **Item sheet**: `src/module/sheets/item-sheet-v2.mjs`
- Handlebars templates in `src/templates/`

### Action Handler Pattern

Sheet event handlers are defined as static methods in the sheet class and registered in the `DEFAULT_OPTIONS.actions` object. Each action is referenced by name in the template using `data-action` attributes.

**Example:**

```javascript
// In actor-sheet-v2.mjs
static DEFAULT_OPTIONS = {
  actions: {
    rollSkill: DeathwatchActorSheetV2._onRollSkill,
    weaponAttack: DeathwatchActorSheetV2._onWeaponAttack,
    purchaseInsanityReduction: DeathwatchActorSheetV2._onPurchaseInsanityReduction,
    // ...
  }
};

// In template
<button data-action="rollSkill" data-skill="awareness">Roll Awareness</button>
```

**Shared handler modules**: Some handler classes in `src/module/sheets/shared/handlers/` are retained for backward compatibility and potential custom sheet implementations, but the v2 sheets use inline action handlers.

---

## Reference Systems for ApplicationV2 Patterns

When encountering implementation challenges or stuck in a loop pattern:

- **DND5e system** (`C:\Source\dnd5e`) - Official Foundry system using ApplicationV2
  - Character biography: `templates/actors/tabs/character-biography.hbs`
  - NPC biography: `templates/actors/tabs/npc-biography.hbs` (dialog pattern)
  - Sheet implementations: `module/applications/actor/`
- **Starfinder system** (`C:\Source\foundryvtt-starfinder`) - Uses ApplicationV1 with `{{editor}}` helper (different pattern)

**Use DND5e as the canonical reference for ApplicationV2 patterns, NOT Starfinder.**

---

## Common Pitfalls

### 1. Using `{{editor}}` Helper in V2 Sheets

**Problem**: `{{editor}}` is ApplicationV1 only and will fail silently in ApplicationV2.

**Solution**: Use `<prose-mirror>` custom element instead.

### 2. Using `{{system.fieldName}}` in `value` Attribute

**Problem**: ProseMirror expects raw source data, not derived data.

**Solution**: Use `{{source.fieldName}}` where `context.source = actor._source.system`.

### 3. Manual Editor Activation

**Problem**: Trying to manually call `ProseMirrorEditor.create()` in `activateListeners()`.

**Solution**: The `<prose-mirror>` element auto-initializes. No manual activation needed.

### 4. Missing `document-uuid` Attribute

**Problem**: Editor doesn't save changes, or saves to wrong document.

**Solution**: Always provide `document-uuid="{{actor.uuid}}"` (or `{{item.uuid}}`).

---

## Migration from V1 to V2

If converting an ApplicationV1 sheet to ApplicationV2:

1. Replace `{{editor}}` helpers with `<prose-mirror>` elements
2. Update `_prepareContext()` to provide `context.source = document._source.system`
3. Add enriched HTML support for non-editable views
4. Remove manual editor activation code from `activateListeners()`
5. Test saving and loading of rich text content

---

_The Machine Spirit's knowledge of the sacred Foundry APIs is now recorded._ ⚙️
