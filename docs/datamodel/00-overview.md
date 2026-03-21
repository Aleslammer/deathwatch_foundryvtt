# DataModel Migration Plan: Overview

## What Is This?

A plan to migrate our system from `template.json`-based data definitions to Foundry v13's programmatic `TypeDataModel` classes. This is the same approach used by the Starfinder system (`foundryvtt-starfinder`).

## Why Migrate?

### Current Pain Points with template.json
1. **No validation** — Any value can be stored in any field. A string in a number field silently corrupts data.
2. **No migration support** — If we rename or restructure a field, existing saved worlds break with no recovery path.
3. **Duplication** — `book`, `page`, `modifiers`, `equipped` are copy-pasted across 10+ item types.
4. **No computed fields on the model** — All derived data logic lives in `item.mjs` and `actor.mjs` document classes, mixing schema concerns with business logic.
5. **Growing complexity** — template.json is ~400 lines and every new item type adds more unvalidated static JSON.
6. **No field metadata** — No labels, hints, min/max, or choices. The UI must handle all validation manually.

### What DataModels Give Us
1. **Built-in validation** — `NumberField({ min: 0, integer: true })` rejects bad data at the framework level.
2. **Built-in migration** — Each model class has a `migrateData()` static method for transforming old data shapes.
3. **Composable templates** — Shared field groups become reusable static methods (e.g., `equippedTemplate()`, `requisitionTemplate()`).
4. **Field metadata** — Labels, hints, choices, nullable flags — all declared once, usable by sheets and forms.
5. **Derived data on the model** — `prepareDerivedData()` can live on the data model itself, not just the Document class.
6. **Type safety** — Fields enforce types at creation and update time.

## Scope

### What Changes
- **New directory**: `src/module/data/` with ~22 model class files
- **template.json**: Reduced to a minimal stub (just type lists) or removed entirely
- **item.mjs**: All type-specific `prepareData()` logic moves to data models (weapon, talent); becomes thin shell
- **actor.mjs**: All derived data logic moves to actor data models (`_prepareCharacterData()` → character model, `_prepareNpcData()` → NPC model); becomes thin shell
- **deathwatch.mjs**: Registers `CONFIG.Actor.dataModels` and `CONFIG.Item.dataModels`
- **Tests**: Mock setup needs minor updates for DataModel-aware construction

### What Does NOT Change
- **Compendium JSON files** — Existing `packs-source/` data works as-is (Foundry maps JSON to models)
- **Handlebars templates** — `{{system.fieldName}}` paths remain identical
- **Sheet classes** — `actor-sheet.mjs` and `item-sheet.mjs` continue working (they read `system.*`)
- **Helper classes** — `ModifierCollector`, `CombatHelper`, etc. are unchanged
- **Existing saved worlds** — Foundry handles the transition; `migrateData()` covers edge cases

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Existing world data breaks | Low | High | `migrateData()` on each model; incremental rollout |
| Compendium packs fail to load | Low | Medium | Verify each pack after converting its type |
| Test mocks need rework | Medium | Low | Update `tests/setup.mjs` incrementally |
| Sheet rendering breaks | Low | Medium | Field paths don't change; test each sheet |
| Performance regression | Very Low | Low | DataModels are native Foundry; no overhead |

## Effort Estimate

| Phase | Files | Estimated Effort |
|-------|-------|-----------------|
| Phase 1: Foundation + 1 proof-of-concept | 4 files | 2-3 hours |
| Phase 2: Simple item types (8 types) | 8 files | 3-4 hours |
| Phase 3a: Talent (with derived data) | 1 file | 1-2 hours |
| Phase 3b: Medium complexity (4 types) | 4 files | 2-3 hours |
| Phase 3c: Complex types (3 types) | 3 files | 2-3 hours |
| Phase 3d: Weapon (with derived data) | 1 file | 3-4 hours |
| Phase 4: Actor types + derived data (2 types) | 3 files | 3-4 hours |
| Phase 5: Cleanup + test updates | Various | 2-3 hours |
| **Total** | **~24 files** | **16-23 hours** |

## Document Index

1. **00-overview.md** — This file
2. **01-architecture.md** — Target file structure and class hierarchy
3. **02-shared-templates.md** — Reusable field templates (book, modifiers, equipped, etc.)
4. **03-item-models.md** — All 18 item type model definitions
5. **04-actor-models.md** — Character and NPC actor model definitions
6. **05-registration.md** — How to register models in deathwatch.mjs
7. **06-migration-phases.md** — Step-by-step implementation order
8. **07-test-impact.md** — Test mock changes and validation strategy
9. **08-derived-data.md** — Moving prepareData logic into models
10. **09-checklist.md** — Pre-flight checklist before each phase
