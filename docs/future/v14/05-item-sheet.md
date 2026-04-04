# Phase 4: ItemSheet → ItemSheetV2

## Goal
Migrate `DeathwatchItemSheet` from V1 `ItemSheet` to V2 `ItemSheetV2` with `HandlebarsApplicationMixin`.

## Scope
17 item type templates, 9 event handlers, drop handlers for qualities and histories, type-specific height overrides.

## Full Details
See `docs/future/applicationv2/migration-plan.md` → **Phase 4: ItemSheet → ItemSheetV2** for:
- Complete event handler mapping (9 handlers)
- PARTS strategy (single template per type)
- Height override migration (`_renderOuter` → `_onFirstRender`)
- Drop handler migration (quality → weapon, history → armor)
- List of all 17 templates to update

## Migration Steps
1. Create `item-sheet-v2.mjs` alongside existing `item-sheet.mjs`
2. Implement `DEFAULT_OPTIONS` and `PARTS`
3. Move `getData()` logic to `_prepareContext()`
4. Convert event handlers to static action methods
5. Update all 17 item templates with `data-action` attributes
6. Handle type-specific template routing
7. Test all 17 item types
8. Remove V1 sheet once validated

## v14-Specific Notes
- Sheet registration: `Items.registerSheet("deathwatch", DeathwatchItemSheetV2, { makeDefault: true })`
- Feature flag shared with ActorSheet (see applicationv2/migration-plan.md → Feature Flag Strategy)
- Specialty sheet with rank cost lookups — verify compendium index access unchanged

## Test Impact
- `tests/sheets/item-sheet.test.mjs` — update for V2 API
- `tests/setup.mjs` — add `ItemSheetV2` mock

## Validation
- [ ] All 17 item type sheets render correctly
- [ ] Modifier CRUD works on all applicable types
- [ ] Weapon quality add/remove/value-change works
- [ ] Armor history add/remove works
- [ ] Weapon attack/damage rolls work from sheet
- [ ] Drop handlers work (quality → weapon, history → armor)
- [ ] Specialty sheet displays rank costs correctly
- [ ] Psychic power and special ability sheets have correct height
- [ ] Tab navigation works on all sheets
- [ ] No V1 deprecation warnings
