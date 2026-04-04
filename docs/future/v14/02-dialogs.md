# Phase 1: Dialog → DialogV2 Migration

## Goal
Replace all `new Dialog({...}).render(true)` instances with `DialogV2` equivalents.

## Why First?
Dialogs are used everywhere — combat, sheets, macros, cohesion (~30 instances). Migrating them first unblocks all other phases and removes the most widespread deprecation source.

## Full Details
See `docs/future/applicationv2/migration-plan.md` → **Phase 1: Dialog → DialogV2** for:
- Complete DialogV2 API reference (wait/confirm/prompt)
- V1 → V2 key differences table
- Full inventory of all ~30 dialog instances by file
- Migration order by file
- jQuery → native DOM callback patterns

## Quick Reference
See `docs/future/applicationv2/quickref.md` → **Dialog Migration** section for side-by-side V1/V2 code.

## v14-Specific Notes
- DialogV2 is available in v13 but Dialog is only deprecated starting v14
- During v13→v14 transition, both APIs work — migrate incrementally
- Test on v14 to confirm `DialogV2` import path: `foundry.applications.api.DialogV2`

## Test Impact
- `tests/setup.mjs` — add `DialogV2` mock (`wait`, `prompt`, `confirm`)
- `tests/helpers/roll-dialog-builder.test.mjs` — update mock expectations
- Combat tests use pure functions (not dialogs) — minimal impact

## Validation
- [ ] All dialogs open and function
- [ ] No `Dialog` deprecation warnings in console
- [ ] Form values correctly read from V2 callbacks
- [ ] Cancel buttons work (return null/undefined)
- [ ] Tests pass
