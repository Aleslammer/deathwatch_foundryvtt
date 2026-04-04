# Phase 2: CohesionPanel → ApplicationV2

## Goal
Migrate `CohesionPanel` from V1 `Application` to V2 `ApplicationV2` with `HandlebarsApplicationMixin`.

## Why Before Sheets?
CohesionPanel is the simplest Application class — a floating HUD with 8 buttons. Good practice target before tackling the complex ActorSheet/ItemSheet.

## Full Details
See `docs/future/applicationv2/migration-plan.md` → **Phase 2: CohesionPanel → ApplicationV2** for:
- Current vs target class structure
- All 8 event handler mappings (V1 jQuery → V2 data-action)
- Position override migration (`_render` → `_onFirstRender`)
- Template changes
- What transfers unchanged (singleton, business logic, reactivity)

## Code Examples
See `docs/future/applicationv2/examples.md` → **CohesionPanel V2 — Skeleton** for complete V2 class skeleton.

## v14-Specific Notes
- The 4 dialogs inside CohesionPanel (recalculate, edit, set leader, challenge) should be migrated to DialogV2 in Phase 1 first
- `updateSetting` hook for reactivity — verify hook signature unchanged in v14 (see `docs/future/v14/06-hooks-and-apis.md`)
- Scene control button registration may need v14 hook signature update

## Test Impact
- `tests/setup.mjs` — update `Application` mock to `ApplicationV2` mock
- `tests/helpers/cohesion.test.mjs` — no changes (tests pure functions)
- `tests/helpers/mode-helper.test.mjs` — no changes (tests pure functions)
- `tests/helpers/squad-ability-activation.test.mjs` — no changes (tests pure functions)

## Validation
- [ ] Panel opens via scene control button
- [ ] Panel displays Cohesion value/max
- [ ] +1 / -1 buttons work
- [ ] Recalculate / Edit / Set Leader / Challenge dialogs work
- [ ] Mode toggle works for all characters
- [ ] Active abilities display and deactivate
- [ ] Panel re-renders on setting changes
- [ ] Auto-drop on zero Cohesion works
- [ ] Socket communication works (player Squad Mode activation)
- [ ] No V1 deprecation warnings from panel
