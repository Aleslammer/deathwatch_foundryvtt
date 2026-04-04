# Foundry VTT v14 Upgrade Plan — Overview

## Current State
- **System Version**: 0.0.2
- **Foundry Target**: v13 (minimum, verified, maximum all set to 13)
- **Architecture**: V1 Application/Sheet classes, TypeDataModel (v13), jQuery event handling
- **Tests**: 1458 passing across 90 suites

## Foundry VTT v14 Key Changes

Foundry VTT v14 (Build 359+) introduces significant breaking changes. The major areas affecting our system:

### 1. ApplicationV2 Becomes Default (CRITICAL)
- V1 `Application`, `ActorSheet`, `ItemSheet` are **deprecated** in v14 and will be **removed in v15**
- V2 `ApplicationV2`, `ActorSheetV2`, `ItemSheetV2` with `HandlebarsApplicationMixin` are the standard
- Our `DeathwatchActorSheet`, `DeathwatchItemSheet`, and `CohesionPanel` all use V1 classes
- **Impact**: HIGH — all 3 sheet/application classes must be migrated

### 2. Dialog API Changes
- `Dialog` class (V1) is deprecated in favor of `DialogV2`
- `DialogV2` uses `await DialogV2.prompt()`, `await DialogV2.confirm()`, `await DialogV2.wait()` patterns
- Our system uses `new Dialog({...}).render(true)` extensively (~30+ instances across combat, sheets, macros)
- **Impact**: HIGH — every dialog in the system needs updating

### 3. Drag & Drop API Changes
- `TextEditor.getDragEventData()` replaced with `foundry.applications.ux.TextEditor.implementation.getDragEventData()`
- We already use the v13 path in some places but need to verify consistency
- **Impact**: LOW — already partially migrated

### 4. Roll API Changes
- `Roll.evaluate()` is now always async (the sync path is removed)
- We already use `await roll.evaluate()` everywhere
- `Roll.toMessage()` signature may have minor changes
- **Impact**: LOW — already using async pattern

### 5. Scene Controls API
- `getSceneControlButtons` hook signature changed
- Controls are now objects with different structure
- Our CohesionPanel toggle uses this hook
- **Impact**: MEDIUM — need to update hook handler

### 6. Settings API
- `game.settings.register()` type field changes — `type: Object` → `type: foundry.data.fields.ObjectField` (or similar)
- World settings may need schema updates
- **Impact**: MEDIUM — 5 world settings to update

### 7. Compendium/Pack Changes
- Pack compilation may need updates for v14 LevelDB format
- `classic-level` dependency may need version bump
- **Impact**: LOW-MEDIUM — test build pipeline

### 8. CSS/Styling Changes
- Foundry v14 updates its base CSS variables and layout
- Our custom CSS may need adjustments for visual consistency
- **Impact**: MEDIUM — visual testing required

### 9. Hook Changes
- Some hooks renamed or have different signatures
- `renderChatMessage` may change to `renderChatMessageHTML` or similar
- `updateSetting` hook behavior may change
- **Impact**: MEDIUM — audit all hook registrations

### 10. Combat/Initiative Changes
- `Combat.prototype.rollInitiative` override pattern may change
- Initiative formula handling may be different
- **Impact**: LOW-MEDIUM — test initiative system

## Upgrade Strategy

### Approach: Incremental Migration with Feature Flags
1. Update `system.json` compatibility to allow v14
2. Fix breaking changes in priority order
3. Use feature flags where possible to support both v13 and v14 during transition
4. Run full test suite after each phase

### Phase Order (by priority/dependency)

| Phase | Document | Scope | Effort | Priority |
|-------|----------|-------|--------|----------|
| 0 | `01-compatibility.md` | system.json + basic compatibility | Small | CRITICAL |
| 1 | `02-dialogs.md` | Dialog → DialogV2 migration | Large | CRITICAL |
| 2 | `03-cohesion-panel.md` | CohesionPanel Application → ApplicationV2 | Medium | CRITICAL |
| 3 | `04-actor-sheet.md` | ActorSheet → ActorSheetV2 | Very Large | CRITICAL |
| 4 | `05-item-sheet.md` | ItemSheet → ItemSheetV2 | Large | CRITICAL |
| 5 | `06-hooks-and-apis.md` | Hook signatures, scene controls, settings | Medium | HIGH |
| 6 | `07-chat-and-macros.md` | Chat message handlers, hotbar macros | Medium | HIGH |
| 7 | `08-css-and-templates.md` | CSS updates, template adjustments | Medium | MEDIUM |
| 8 | `09-build-and-test.md` | Build pipeline, test mock updates | Medium | HIGH |
| 9 | `10-validation.md` | Full validation checklist | Small | CRITICAL |

## Files Affected (Summary)

### Must Change (Breaking)
- `src/system.json` — compatibility version
- `src/module/sheets/actor-sheet.mjs` — V1 → V2
- `src/module/sheets/item-sheet.mjs` — V1 → V2
- `src/module/ui/cohesion-panel.mjs` — Application → ApplicationV2
- `src/module/deathwatch.mjs` — Dialog instances, hooks, settings, scene controls
- `src/module/helpers/combat/combat.mjs` — Dialog instances
- `src/module/helpers/combat/ranged-combat.mjs` — Dialog instances
- `src/module/helpers/combat/melee-combat.mjs` — Dialog instances
- `src/module/helpers/combat/psychic-combat.mjs` — Dialog instances
- `src/module/helpers/character/modifiers.mjs` — Dialog instances
- `src/module/helpers/ui/roll-dialog-builder.mjs` — Dialog builder
- `tests/setup.mjs` — Mock updates for V2 classes

### May Need Changes (Verify)
- `src/module/helpers/combat/fire-helper.mjs`
- `src/module/helpers/initiative.mjs`
- `src/module/helpers/foundry-adapter.mjs`
- `src/module/helpers/effects.mjs`
- `src/module/helpers/status-effects.mjs`
- `src/styles/` — CSS adjustments
- `src/templates/` — Template updates for V2 PARTS
- `builds/scripts/compilePacks.mjs` — LevelDB format

### No Changes Expected
- `src/module/data/` — TypeDataModel classes (v13 pattern still valid in v14)
- `src/module/documents/actor.mjs` — Thin shell, no V1 dependencies
- `src/module/documents/item.mjs` — Thin shell, no V1 dependencies
- `src/module/helpers/combat/combat-dialog.mjs` — Pure functions
- `src/module/helpers/combat/horde-combat.mjs` — Pure functions
- `src/module/helpers/character/xp-calculator.mjs` — Pure functions
- `src/module/helpers/character/skill-loader.mjs` — Pure functions
- `src/module/helpers/cohesion.mjs` — Pure functions (except rollCohesionChallenge)
- `src/module/helpers/mode-helper.mjs` — Pure functions
- `src/module/helpers/constants.mjs` — Constants only

## Risk Assessment

### High Risk
- **ActorSheet migration** — largest, most complex file (671 lines), many event handlers
- **Dialog migration** — 30+ instances spread across many files
- **Test mock updates** — V2 classes need different mocks in setup.mjs

### Medium Risk
- **CohesionPanel** — simpler than sheets but uses Application V1 patterns
- **Chat message handlers** — many button handlers in deathwatch.mjs
- **CSS breakage** — Foundry base CSS changes may cascade

### Low Risk
- **TypeDataModel classes** — v13 pattern is still supported in v14
- **Pure helper functions** — no Foundry API dependencies
- **Compendium data** — JSON source files unchanged

## Success Criteria
- [ ] All 1458+ tests passing
- [ ] System loads without errors on Foundry v14.359
- [ ] All 4 actor sheets render correctly (character, NPC, enemy, horde)
- [ ] All 17 item sheets render correctly
- [ ] CohesionPanel opens, displays, and functions
- [ ] Combat (ranged, melee, psychic) works end-to-end
- [ ] Hotbar macros work
- [ ] Compendium packs load and display
- [ ] Socket communication works (Squad Mode)
- [ ] No V1 deprecation warnings in console

## Timeline Estimate
- **Phase 0**: 1 day
- **Phase 1 (Dialogs)**: 3-5 days
- **Phase 2 (CohesionPanel)**: 2-3 days
- **Phase 3 (ActorSheet)**: 5-8 days
- **Phase 4 (ItemSheet)**: 3-5 days
- **Phase 5 (Hooks/APIs)**: 2-3 days
- **Phase 6 (Chat/Macros)**: 2-3 days
- **Phase 7 (CSS/Templates)**: 2-3 days
- **Phase 8 (Build/Test)**: 2-3 days
- **Phase 9 (Validation)**: 1-2 days
- **Total**: ~23-36 days

## Decision: When to Start?
**Recommended**: Start Phase 0 immediately to test basic compatibility. Begin full migration once v14 API is stable (post-359 if further patches expected). The existing ApplicationV2 migration docs in `docs/future/` provide a head start on Phases 3-4.

## References
- [Foundry VTT v14 Release Notes](https://foundryvtt.com/releases/)
- [ApplicationV2 API Docs](https://foundryvtt.com/api/modules/foundry.applications.api.html)
- `docs/future/applicationv2/` — Self-contained ApplicationV2 migration docs (Phases 1–4 of this plan execute the work defined there)
  - `migration-plan.md` — Full handler inventories, dialog inventory, PARTS strategy, feature flags, validation checklists
  - `quickref.md` — V1 vs V2 comparison card, gotchas, debugging
  - `examples.md` — System-specific V2 code skeletons and DialogV2 examples
