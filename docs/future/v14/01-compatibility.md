# Phase 0: Compatibility Update

## Goal
Get the system loading on Foundry v14.359 with minimal changes. Accept deprecation warnings initially.

## Changes Required

### 1. system.json — Update Compatibility
```json
"compatibility": {
    "minimum": "13",
    "verified": "14",
    "maximum": "14"
}
```
Keep `minimum: "13"` during transition so the system still works on v13 for existing users.

### 2. Verify TypeDataModel Still Works
v14 retains `foundry.abstract.TypeDataModel` — our DataModel classes should work unchanged. Verify:
- All 4 actor types load (character, NPC, enemy, horde)
- All 17 item types load
- `prepareDerivedData()` fires correctly
- `defineSchema()` field types are recognized

### 3. Verify Document Classes
- `Actor` and `Item` base classes should still work
- `CONFIG.Actor.documentClass` and `CONFIG.Item.documentClass` registration unchanged
- `CONFIG.Actor.dataModels` and `CONFIG.Item.dataModels` registration unchanged

### 4. Check Console for Errors vs Warnings
On first load with v14:
- **Errors** (red) = must fix immediately
- **Deprecation warnings** (yellow) = fix in subsequent phases
- Document all warnings for triage

### 5. Run Test Suite
```bash
npm test
```
If tests pass, the pure logic layer is unaffected. Test failures indicate mock or API changes.

## Validation Checklist
- [ ] System appears in Foundry v14 system list
- [ ] World loads without fatal errors
- [ ] Character sheet opens (even with deprecation warnings)
- [ ] Enemy sheet opens
- [ ] Item sheets open
- [ ] Console errors documented
- [ ] Console deprecation warnings documented
- [ ] Test suite results documented

## Expected Deprecation Warnings
- `Application` class deprecated (CohesionPanel)
- `ActorSheet` class deprecated (DeathwatchActorSheet)
- `ItemSheet` class deprecated (DeathwatchItemSheet)
- `Dialog` class deprecated (all dialog instances)
- Possibly `getSceneControlButtons` hook signature

## Output
A list of all errors and warnings, categorized by phase for resolution.
