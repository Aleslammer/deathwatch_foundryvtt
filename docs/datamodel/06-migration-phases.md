# Migration Phases: Step-by-Step Implementation Order

## Phase 1: Foundation + Proof of Concept

**Goal:** Establish the base classes and prove the pattern works with one simple type.

**Target type:** `gear` (simple, uses multiple shared templates, easy to verify)

### Steps

1. **Create directory structure**
   ```
   src/module/data/
   ├── _module.mjs
   ├── base-document.mjs
   └── item/
       ├── base-item.mjs
       └── gear.mjs
   ```

2. **Implement base-document.mjs**
   - `DeathwatchDataModel` extending `foundry.abstract.TypeDataModel`
   - All shared template methods: `equippedTemplate()`, `requisitionTemplate()`, `capacityTemplate()`, `keyTemplate()`

3. **Implement base-item.mjs**
   - `DeathwatchItemBase` extending `DeathwatchDataModel`
   - Universal fields: `description`, `book`, `page`, `modifiers`

4. **Implement gear.mjs**
   - `DeathwatchGear` extending `DeathwatchItemBase`
   - Compose: equipped + requisition templates
   - Add: `shortDescription`, `wt`
   - No `prepareDerivedData()` needed (gear has no derived data)

5. **Create _module.mjs barrel export**
   - Export only `DeathwatchGear` for now

6. **Register in deathwatch.mjs**
   ```javascript
   CONFIG.Item.dataModels = {
     gear: models.DeathwatchGear
   };
   ```

7. **Verify**
   - [ ] Existing gear items in compendium load correctly
   - [ ] Gear item sheet renders and edits work
   - [ ] Gear modifiers still apply to actors
   - [ ] Creating new gear items works
   - [ ] All existing tests pass
   - [ ] Write 1-2 new tests for the gear model

8. **Update memory bank**
   - `structure.md`: Add `src/module/data/` directory tree with base-document.mjs, item/base-item.mjs, item/gear.mjs, _module.mjs
   - `tech.md`: Add TypeDataModel to framework section, document `foundry.data.fields` usage
   - `guidelines.md`: Add DataModel coding patterns (defineSchema, shared templates, composition via spread)
   - New `datamodel.md`: Initial version — class hierarchy, shared templates, registration pattern, field types used

### Deliverables
- 4 new files
- 1 modified file (deathwatch.mjs)
- Updated memory bank (4 files)
- Proof that the pattern works end-to-end

---

## Phase 2: Simple Item Types

**Goal:** Migrate all item types that have minimal fields and no derived data logic.

**Target types (8):** characteristic, demeanour, trait, armor-history, weapon-quality, critical-effect, implant, cybernetic

### Steps

1. **Create model files** (one per type)
   - Each follows the pattern established in Phase 1
   - Most are 10-20 lines of code
   - None have `prepareDerivedData()` — they're pure data containers

2. **Update _module.mjs** with new exports

3. **Register all new types in deathwatch.mjs**

4. **Verify each type**
   - [ ] Compendium items load
   - [ ] Item sheets render
   - [ ] Modifiers apply (for types that have them)
   - [ ] Create/edit/delete works
   - [ ] All existing tests pass

5. **Update memory bank**
   - `structure.md`: Update `src/module/data/item/` tree with 8 new files
   - `datamodel.md`: Add all 8 simple types to class hierarchy and type mapping table

### Deliverables
- 8 new model files
- Updated _module.mjs and deathwatch.mjs
- Updated memory bank (2 files)
- All 8 types verified

---

## Phase 3: Complex Item Types + Derived Data

**Goal:** Migrate item types with more fields and move derived data logic from `item.mjs` into the models that own it.

### Sub-phase 3a: Talent (derived data)
- **talent** — Has `prepareDerivedData()` for compendiumId auto-population and effectiveCost calculation
- Move talent-specific logic from `item.mjs prepareData()` into `DeathwatchTalent.prepareDerivedData()`
- Remove the two `if (this.type === 'talent')` blocks from `item.mjs`
- Update talent-related tests for new access patterns

### Sub-phase 3b: Medium complexity (4 types)
- ammunition, weapon-upgrade, psychic-power, special-ability
- These have more fields but no `prepareDerivedData()` logic

### Sub-phase 3c: Complex types (3 types)
- **armor** — Location-based fields, attached histories, armor effects
- **chapter** — Dynamic skillCosts/talentCosts objects
- **specialty** — Nested characteristicCosts, rankCosts with 8 ranks

### Sub-phase 3d: Weapon (most complex, derived data)
- **weapon** — Most fields, most derived data
- Move from `item.mjs` into `DeathwatchWeapon`:
  - `_applyWeaponUpgradeModifiers()` → `prepareDerivedData()` + private method
  - `_applyAmmunitionModifiers()` → `prepareDerivedData()` + private method
  - `_applyForceWeaponModifiers()` → public `applyForceWeaponModifiers()` (called from character model)
- Remove all three private methods and the `if (this.type === 'weapon')` blocks from `item.mjs`
- Update all weapon-related tests for new access patterns
- `item.mjs` becomes a thin shell after this step

### Steps

1. **Implement each model file**

2. **For talent model (3a):**
   - Define schema in `defineSchema()`
   - Move compendiumId and effectiveCost logic to `prepareDerivedData()`
   - Remove talent blocks from `item.mjs prepareData()`
   - Update tests

3. **For weapon model (3d):**
   - Define all fields in `defineSchema()`
   - Move `_applyWeaponUpgradeModifiers()` to model as private method
   - Move `_applyAmmunitionModifiers()` to model as private method
   - Move `_applyForceWeaponModifiers()` to model as public `applyForceWeaponModifiers()`
   - Wire `prepareDerivedData()` to call upgrade + ammo methods
   - Remove all three methods and weapon blocks from `item.mjs`
   - Update all weapon-related tests

4. **Update _module.mjs and deathwatch.mjs**

5. **Verify each type thoroughly**
   - [ ] All compendium packs load (weapons, armor, ammunition, talents, chapters, specialties)
   - [ ] Weapon effective values calculate correctly
   - [ ] Ammunition modifiers apply
   - [ ] Force weapon modifiers apply after psy rating
   - [ ] Talent effectiveCost calculates correctly
   - [ ] Chapter/specialty cost overrides work
   - [ ] All 829+ tests pass

6. **Update memory bank** (after all sub-phases complete)
   - `structure.md`: Update `src/module/data/item/` tree with all 9 new files, update item.mjs description to "thin shell"
   - `datamodel.md`: Add all 9 types to class hierarchy, document weapon `prepareDerivedData()` and talent `prepareDerivedData()`
   - `ammunition-modifiers.md`: Note `_applyAmmunitionModifiers()` now lives on `DeathwatchWeapon` model
   - `weapon-qualities.md`: Note `attachedQualities` field defined in `DeathwatchWeapon` model
   - `weapon-upgrades.md`: Note `attachedUpgrades` and `_applyWeaponUpgradeModifiers()` on `DeathwatchWeapon` model
   - `modifiers.md`: Note modifiers array defined on `DeathwatchItemBase` (all items inherit)

### Deliverables
- 9 new model files (including weapon and talent with derived data)
- Modified item.mjs (reduced to thin shell)
- Updated memory bank (6 files)
- All types verified

### Resulting item.mjs after Phase 3
```javascript
export class DeathwatchItem extends Item {
  prepareData() {
    super.prepareData();
    // All type-specific logic now lives in DataModel.prepareDerivedData()
  }

  getRollData() {
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);
    return rollData;
  }

  async roll() { /* unchanged */ }
}
```

---

## Phase 4: Actor Types + Derived Data

**Goal:** Migrate character and NPC actor types, moving all derived data from `actor.mjs` into the models.

**Target types (2):** character, npc

### Steps

1. **Create actor model files**
   ```
   src/module/data/actor/
   ├── base-actor.mjs
   ├── character.mjs
   └── npc.mjs
   ```

2. **Implement base-actor.mjs**
   - Wounds and fatigue schemas

3. **Implement character.mjs**
   - All 9 characteristics with advances (using `_characteristicFields()` helper)
   - Biography fields, XP, rank, fate points, renown
   - Psy rating, skills, modifiers, conditions
   - **`prepareDerivedData()`** — move entire `_prepareCharacterData()` here:
     - Skill loading via SkillLoader
     - Rank/XP calculation via XPCalculator
     - Modifier collection and application via ModifierCollector
     - Force weapon modifier loop (calls `item.system.applyForceWeaponModifiers()`)
     - Movement calculation

4. **Implement npc.mjs**
   - Inherits base
   - **`prepareDerivedData()`** — move `_prepareNpcData()` here

5. **Register in deathwatch.mjs**
   ```javascript
   CONFIG.Actor.dataModels = {
     character: models.DeathwatchCharacter,
     npc: models.DeathwatchNPC
   };
   ```

6. **Remove from actor.mjs:**
   - `_prepareCharacterData()` method
   - `_prepareNpcData()` method
   - `prepareDerivedData()` override (no longer needed)
   - Imports for ModifierCollector, XPCalculator, SkillLoader (move to character model)

7. **Verify**
   - [ ] Existing characters load correctly
   - [ ] Character sheet renders all tabs
   - [ ] Characteristic advances work
   - [ ] Modifier system works (all 9 effectTypes)
   - [ ] XP calculation works
   - [ ] Skill system works
   - [ ] Force weapon modifiers apply after psy rating
   - [ ] Movement calculation works
   - [ ] Combat system works
   - [ ] All 829+ tests pass

8. **Update memory bank**
   - `structure.md`: Add `src/module/data/actor/` tree, update actor.mjs description to "thin shell"
   - `datamodel.md`: Add character and NPC models, document character `prepareDerivedData()` with full modifier/XP/skill/movement logic
   - `combat-systems.md`: Note force weapon modifier called via `item.system.applyForceWeaponModifiers()` from character model
   - `index.md`: Add DataModel system to Core Systems Summary, update File Locations with `src/module/data/`

### Deliverables
- 3 new model files
- Modified deathwatch.mjs
- Modified actor.mjs (reduced to thin shell)
- Updated memory bank (4 files)
- All actor functionality verified

### Resulting actor.mjs after Phase 4
```javascript
export class DeathwatchActor extends ActorConditionsMixin(Actor) {
  prepareData() {
    super.prepareData();
    // DataModel.prepareDerivedData() called automatically by super
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (data.type === 'character') {
      this.updateSource({ 'prototypeToken.actorLink': true });
    }
  }

  getRollData() {
    const data = super.getRollData();
    this._getCharacterRollData(data);
    this._getNpcRollData(data);
    return data;
  }

  _getCharacterRollData(data) { /* unchanged */ }
  _getNpcRollData(data) { /* unchanged */ }
}
```

---

## Phase 5: Cleanup

**Goal:** Remove template.json duplication, update tests, update documentation.

### Steps

1. **Reduce template.json**
   - Remove all field definitions
   - Keep only type lists (or remove entirely if v13 supports it)
   - Test that everything still works

2. **Update test mocks**
   - Update `tests/setup.mjs` if needed
   - Ensure all mocks align with DataModel field types
   - Add model-specific tests where valuable

3. **Final memory bank review**
   - Review all memory bank files updated during Phases 1-4 for consistency
   - Verify `datamodel.md` is complete with final class hierarchy, all types, all `prepareDerivedData()` methods
   - Verify `structure.md` reflects final directory tree and thin-shell descriptions for item.mjs/actor.mjs
   - Remove any remaining references to template.json field definitions in memory bank files

4. **Remove dead code**
   - Any template.json references in comments
   - Any workarounds that DataModels make unnecessary

5. **Final verification**
   - [ ] Full test suite passes
   - [ ] All compendium packs load
   - [ ] All sheets render
   - [ ] All combat mechanics work
   - [ ] Coverage report shows no regression

### Deliverables
- Minimal template.json
- Updated tests
- Updated documentation
- Clean codebase

---

## Phase Summary

| Phase | Types | New Files | Derived Data Moved | Risk | Can Ship Independently |
|-------|-------|-----------|-------------------|------|----------------------|
| 1 | gear | 4 | — | Low | Yes |
| 2 | 8 simple types | 8 | — | Low | Yes |
| 3a | talent | 1 | compendiumId, effectiveCost | Low | Yes |
| 3b | 4 medium types | 4 | — | Low | Yes |
| 3c | 3 complex types | 3 | — | Medium | Yes |
| 3d | weapon | 1 | upgrade/ammo/force modifiers | Medium | Yes (test thoroughly) |
| 4 | 2 actor types | 3 | skills, XP, modifiers, movement | Medium | Yes (test thoroughly) |
| 5 | cleanup | 0 | — | Low | Yes |

Each phase is independently shippable. If any phase causes issues, remove the type from `CONFIG.*.dataModels` to fall back to template.json instantly.

### Data Prep Migration Summary

After all phases complete:
- `item.mjs`: No type-specific logic, no private methods — thin shell
- `actor.mjs`: No `_prepareCharacterData()` or `_prepareNpcData()` — thin shell with `getRollData()` helpers
- `DeathwatchWeapon`: Owns upgrade, ammunition, and force weapon modifier logic
- `DeathwatchTalent`: Owns compendiumId and effectiveCost logic
- `DeathwatchCharacter`: Owns skill loading, XP, modifiers, movement, force weapon orchestration
- `DeathwatchNPC`: Owns NPC XP calculation
