# Phase 3: ActorSheet → ActorSheetV2

## Goal
Migrate `DeathwatchActorSheet` from V1 `ActorSheet` to V2 `ActorSheetV2` with `HandlebarsApplicationMixin`.

## Scope
Largest migration task. 671 lines, 4 actor type templates, 25+ event handlers, drag-and-drop, scroll preservation, collapsible sections.

## Full Details
See `docs/future/applicationv2/migration-plan.md` → **Phase 3: ActorSheet → ActorSheetV2** for:
- Current vs target architecture diagrams
- Complete event handler mapping (25+ handlers across 7 categories)
- PARTS strategy (Option A single-template vs Option B multi-part)
- Data preparation migration (`getData` → `_prepareContext`)
- Drag-and-drop migration (jQuery → native DOM)
- Scroll position handling via PARTS `scrollable`

## Code Examples
See `docs/future/applicationv2/examples.md` → **ActorSheetV2 — Skeleton** for complete V2 class with all action handlers.

## Migration Steps
1. Create `actor-sheet-v2.mjs` alongside existing `actor-sheet.mjs`
2. Implement `DEFAULT_OPTIONS` and `PARTS`
3. Move `getData()` logic to `_prepareContext()`
4. Convert all event handlers to static action methods
5. Update templates to use `data-action` attributes
6. Add feature flag to toggle between V1/V2
7. Test all 4 actor types
8. Remove V1 sheet once V2 is validated

## v14-Specific Notes
- Sheet registration: `Actors.registerSheet("deathwatch", DeathwatchActorSheetV2, { makeDefault: true })`
- Verify `foundry.applications.ux.TextEditor.implementation.getDragEventData()` path unchanged in v14
- Feature flag allows parallel V1/V2 during transition (see applicationv2/migration-plan.md → Feature Flag Strategy)

## Test Impact
- `tests/sheets/actor-sheet.test.mjs` — update for V2 API
- `tests/sheets/actor-sheet-renown.test.mjs` — update for V2 API
- `tests/sheets/actor-sheet-talents-traits.test.mjs` — update for V2 API
- `tests/setup.mjs` — add `ActorSheetV2` mock

## Validation
- [ ] Character sheet renders all tabs
- [ ] NPC / Enemy / Horde sheets render
- [ ] All characteristic and skill rolls work
- [ ] Weapon attack/damage/unjam buttons work
- [ ] Item create/edit/delete work
- [ ] Drag-and-drop (chapter, specialty, ammo, upgrades, histories) works
- [ ] Modifier CRUD works
- [ ] Collapsible gear sections work
- [ ] Scroll position preserved on re-render
- [ ] Status effect toggles work
- [ ] Psychic power use button works
- [ ] Special ability activation works
- [ ] Tab navigation works
- [ ] No V1 deprecation warnings from sheet
