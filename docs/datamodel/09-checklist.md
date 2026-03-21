# Pre-Flight Checklist: Before Each Phase

## Before Starting Any Phase

- [ ] All tests pass: `npm test`
- [ ] Git working tree is clean (commit or stash current work)
- [ ] Create a branch: `git checkout -b datamodel/phase-N`

## Phase 1: Foundation + Gear

### Implementation
- [ ] Create `src/module/data/base-document.mjs`
  - [ ] `DeathwatchDataModel` extends `foundry.abstract.TypeDataModel`
  - [ ] Shared template methods: `equippedTemplate()`, `requisitionTemplate()`, `capacityTemplate()`, `keyTemplate()`
- [ ] Create `src/module/data/item/base-item.mjs`
  - [ ] `DeathwatchItemBase` extends `DeathwatchDataModel`
  - [ ] Universal fields: `description`, `book`, `page`, `modifiers`
- [ ] Create `src/module/data/item/gear.mjs`
  - [ ] Composes: `equippedTemplate()` + `requisitionTemplate()`
  - [ ] Type-specific: `shortDescription`, `wt`
- [ ] Create `src/module/data/_module.mjs`
- [ ] Add `import * as models from './data/_module.mjs'` to `deathwatch.mjs`
- [ ] Add `CONFIG.Item.dataModels = { gear: models.DeathwatchGear }` to init hook
- [ ] Add field mocks to `tests/setup.mjs` (TypeDataModel, foundry.data.fields)

### Verification
- [ ] `npm test` — all tests pass
- [ ] In Foundry: open Gear compendium, verify items load
- [ ] In Foundry: create a new gear item, verify all fields work
- [ ] In Foundry: edit an existing gear item on a character, save, verify
- [ ] In Foundry: equip gear with modifiers, verify modifiers apply to actor
- [ ] In Foundry: check actor sheet Gear tab renders correctly

### Memory Bank
- [ ] `structure.md`: Add `src/module/data/` directory tree (base-document.mjs, item/base-item.mjs, item/gear.mjs, _module.mjs)
- [ ] `tech.md`: Add TypeDataModel to framework section, document `foundry.data.fields` usage
- [ ] `guidelines.md`: Add DataModel coding patterns (defineSchema, shared templates, composition via spread)
- [ ] New `datamodel.md`: Initial version — class hierarchy, shared templates (equippedTemplate, requisitionTemplate, capacityTemplate, keyTemplate), registration pattern, field types

### Commit
- [ ] Commit with message: `feat: add DataModel foundation and gear model`

---

## Phase 2: Simple Item Types

### Implementation
- [ ] Create model file for each type:
  - [ ] `item/characteristic.mjs` — type-specific: `chapter`
  - [ ] `item/demeanour.mjs` — type-specific: `chapter`
  - [ ] `item/trait.mjs` — no extra fields (base class covers all)
  - [ ] `item/armor-history.mjs` — no extra fields (base class covers all)
  - [ ] `item/weapon-quality.mjs` — composes: `keyTemplate()`, type-specific: `value`
  - [ ] `item/critical-effect.mjs` — type-specific: `location`, `damageType`, `effects`
  - [ ] `item/implant.mjs` — composes: `equippedTemplate()` + `requisitionTemplate()`, type-specific: `summary`
  - [ ] `item/cybernetic.mjs` — composes: `equippedTemplate()` + `requisitionTemplate()`
- [ ] Update `_module.mjs` with all 8 exports
- [ ] Register all 8 types in `deathwatch.mjs` CONFIG.Item.dataModels

### Verification
- [ ] `npm test` — all tests pass
- [ ] For each type, in Foundry:
  - [ ] Open relevant compendium pack
  - [ ] Create new item of that type
  - [ ] Edit and save existing item
  - [ ] Verify item sheet renders correctly
- [ ] Specifically verify:
  - [ ] Trait modifiers apply (traits are always active, no equipped check)
  - [ ] Armor histories apply when attached to equipped armor
  - [ ] Implant modifiers apply when equipped
  - [ ] Cybernetic modifiers apply when equipped
  - [ ] Weapon qualities display in weapon tooltip (qualityList helper)

### Memory Bank
- [ ] `structure.md`: Update `src/module/data/item/` tree with 8 new model files
- [ ] `datamodel.md`: Add all 8 simple types to class hierarchy and type mapping table

### Commit
- [ ] Commit with message: `feat: add DataModels for simple item types`

---

## Phase 3a: Talent (with derived data)

### Implementation
- [ ] Create `item/talent.mjs`
  - [ ] Schema: `prerequisite`, `benefit`, `cost`, `stackable`, `subsequentCost`, `compendiumId`
  - [ ] `prepareDerivedData()`: compendiumId auto-population + effectiveCost calculation
- [ ] Move talent logic from `item.mjs prepareData()` to model:
  - [ ] Remove `if (this.type === 'talent' && !this.system.compendiumId ...)` block
  - [ ] Remove `if (this.type === 'talent' && this.actor)` block (effectiveCost)
- [ ] Update `_module.mjs` and `deathwatch.mjs`
- [ ] Update talent-related tests for new access patterns

### Verification
- [ ] `npm test` — all tests pass
- [ ] Talents: load from compendium, verify all fields
- [ ] Talents: compendiumId auto-populates for `tal*` IDs
- [ ] Talents: effectiveCost calculates correctly without chapter
- [ ] Talents: effectiveCost reflects chapter cost overrides
- [ ] Talents: effectiveCost reflects specialty base talentCosts overrides
- [ ] Talents: effectiveCost reflects specialty rank-based overrides
- [ ] Talents: XP calculation includes correct talent costs
- [ ] Talents: stackable talents with subsequentCost work

### Memory Bank
- [ ] `datamodel.md`: Add talent model, document `prepareDerivedData()` (compendiumId, effectiveCost)

### Commit
- [ ] Commit with message: `feat: add DataModel for talent with derived data`

---

## Phase 3b: Medium Complexity Types

### Implementation
- [ ] Create model files:
  - [ ] `item/ammunition.mjs` — composes: `capacityTemplate()` + `requisitionTemplate()`, type-specific: `quantity`
  - [ ] `item/weapon-upgrade.mjs` — composes: `keyTemplate()` + `requisitionTemplate()`, type-specific: `singleShotOnly`
  - [ ] `item/psychic-power.mjs` — composes: `keyTemplate()`, type-specific: `action`, `opposed`, `range`, `sustained`, `cost`, `class`, `chapterImg`
  - [ ] `item/special-ability.mjs` — composes: `keyTemplate()`, type-specific: `specialty`
- [ ] Update `_module.mjs` and `deathwatch.mjs`

### Verification
- [ ] `npm test` — all tests pass
- [ ] Ammunition: load from compendium, verify capacity/quantity/req/renown fields
- [ ] Ammunition: modifiers array loads (weapon-damage, weapon-rof, etc.)
- [ ] Weapon upgrades: load from compendium, verify singleShotOnly/req/renown fields
- [ ] Weapon upgrades: modifiers array loads (characteristic, weapon-range, etc.)
- [ ] Psychic powers: verify all fields render on sheet
- [ ] Special abilities: verify key and specialty fields

### Memory Bank
- [ ] `datamodel.md`: Add ammunition, weapon-upgrade, psychic-power, special-ability to type mapping

### Commit
- [ ] Commit with message: `feat: add DataModels for ammunition, weapon-upgrade, psychic-power, special-ability`

---

## Phase 3c: Complex Types

### Implementation
- [ ] Create model files:
  - [ ] `item/armor.mjs` — composes: `equippedTemplate()` + `requisitionTemplate()`, type-specific: 6 location fields, `effects`, `armorEffects`, `attachedHistories`
  - [ ] `item/chapter.mjs` — type-specific: `skillCosts`, `talentCosts`
  - [ ] `item/specialty.mjs` — type-specific: `hasPsyRating`, `talentCosts`, `skillCosts`, `characteristicCosts` (nested), `rankCosts` (8 ranks)
- [ ] Update `_module.mjs` and `deathwatch.mjs`

### Verification
- [ ] `npm test` — all tests pass
- [ ] Armor: all 6 location values work, equipped toggle, req/renown fields
- [ ] Armor: attached histories load and apply modifiers
- [ ] Armor: armorEffects array loads
- [ ] Armor: armor modifier system applies bonuses to all locations
- [ ] Chapter: skillCosts and talentCosts load correctly
- [ ] Chapter: skill cost overrides apply on actor sheet
- [ ] Chapter: talent cost overrides apply
- [ ] Specialty: characteristicCosts nested structure loads (9 chars × 4 levels)
- [ ] Specialty: rankCosts with 8 ranks loads correctly
- [ ] Specialty: hasPsyRating flag controls Psy Rating visibility
- [ ] Specialty: talentCosts base overrides work (e.g., Librarian Psy Rating 3 = 0)
- [ ] Specialty: rank-based skill/talent cost overrides work

### Memory Bank
- [ ] `datamodel.md`: Add armor, chapter, specialty to type mapping

### Commit
- [ ] Commit with message: `feat: add DataModels for armor, chapter, specialty`

---

## Phase 3d: Weapon (with derived data)

### Implementation
- [ ] Create `item/weapon.mjs`
  - [ ] Composes: `equippedTemplate()` + `capacityTemplate()` + `requisitionTemplate()`
  - [ ] Schema: all weapon fields (damage, damageType, weaponType, range, rof, dmg, penetration, class, jammed, loadedAmmo, attachedQualities, attachedUpgrades, doublesStrengthBonus)
  - [ ] `prepareDerivedData()`: calls `_applyWeaponUpgradeModifiers()` + `_applyAmmunitionModifiers()`
  - [ ] `applyForceWeaponModifiers()`: public method called from character model
  - [ ] `_applyWeaponUpgradeModifiers(actor)`: private, moved from `item.mjs`
  - [ ] `_applyAmmunitionModifiers(actor)`: private, moved from `item.mjs`
- [ ] Remove from `item.mjs`:
  - [ ] `_applyWeaponUpgradeModifiers()` method
  - [ ] `_applyAmmunitionModifiers()` method
  - [ ] `_applyForceWeaponModifiers()` method
  - [ ] `if (this.type === 'weapon' && ... attachedUpgrades)` block
  - [ ] `if (this.type === 'weapon' && ... loadedAmmo)` block
- [ ] Verify `item.mjs` is now a thin shell (only `prepareData()` calling super, `getRollData()`, `roll()`)
- [ ] Update `_module.mjs` and `deathwatch.mjs`
- [ ] Update weapon-related tests for new access patterns

### Verification
- [ ] `npm test` — all tests pass (critical: weapon, ammo, combat, force weapon tests)
- [ ] Weapon: all fields load from compendium
- [ ] Weapon: equipped toggle, jammed state, req/renown fields work
- [ ] Weapon: loaded ammo reference works
- [ ] Weapon: attached qualities display correctly (qualityList tooltip)
- [ ] Weapon: attached upgrades apply modifiers (effective range, damage, weight)
- [ ] Weapon: effective damage/range/RoF/penetration calculate correctly
- [ ] Weapon: ammunition modifiers apply (weapon-damage, weapon-rof, weapon-blast, weapon-penetration, weapon-range, weapon-felling)
- [ ] Weapon: quality exception (stalker rounds + stalker-pattern quality) works
- [ ] Weapon: force weapon modifiers apply with psy rating (after character model computes it)
- [ ] Combat: ranged attack dialog works (BS, aim, RoF, range modifiers)
- [ ] Combat: melee attack dialog works (WS, all-out, charge)
- [ ] Combat: damage rolls work (all weapon qualities: Accurate, Tearing, Proven, etc.)
- [ ] Combat: apply damage works (Primitive, Razor Sharp, Melta, Felling)
- [ ] Combat: Righteous Fury works
- [ ] Combat: ammunition tracking (deduction, depletion warning)
- [ ] Verify `item.mjs` has no type-specific logic remaining

### Memory Bank
- [ ] `structure.md`: Update `src/module/data/item/` tree with weapon.mjs, update item.mjs description to "thin shell"
- [ ] `datamodel.md`: Add weapon model, document `prepareDerivedData()` and public `applyForceWeaponModifiers()`
- [ ] `ammunition-modifiers.md`: Note `_applyAmmunitionModifiers()` now lives on `DeathwatchWeapon` model
- [ ] `weapon-qualities.md`: Note `attachedQualities` field defined in `DeathwatchWeapon` model
- [ ] `weapon-upgrades.md`: Note `attachedUpgrades` and `_applyWeaponUpgradeModifiers()` on `DeathwatchWeapon` model
- [ ] `modifiers.md`: Note modifiers array defined on `DeathwatchItemBase` (all items inherit)

### Commit
- [ ] Commit with message: `feat: add DataModel for weapon with derived data`

---

## Phase 4: Actor Types (with derived data)

### Implementation
- [ ] Create `src/module/data/actor/base-actor.mjs`
  - [ ] `DeathwatchActorBase` extends `DeathwatchDataModel`
  - [ ] Schema: `wounds` (value, base, max), `fatigue` (value, max)
- [ ] Create `src/module/data/actor/character.mjs`
  - [ ] `DeathwatchCharacter` extends `DeathwatchActorBase`
  - [ ] `_characteristicFields()` helper (value, bonus, damage, advances inline)
  - [ ] Schema: 9 characteristics, biography fields, xp, rank, fatePoints, renown, modifiers, conditions, psyRating, skills, legacy fields
  - [ ] `prepareDerivedData()` — move entire `_prepareCharacterData()` here:
    - [ ] Skill loading via SkillLoader
    - [ ] Rank calculation via XPCalculator
    - [ ] XP spent/available calculation
    - [ ] Modifier collection via ModifierCollector.collectAllModifiers()
    - [ ] Characteristic modifier application
    - [ ] Skill modifier application
    - [ ] Initiative modifier application
    - [ ] Wound modifier application
    - [ ] Fatigue modifier application
    - [ ] Armor modifier application
    - [ ] Psy Rating modifier application
    - [ ] Force weapon modifier loop (`item.system.applyForceWeaponModifiers()`)
    - [ ] Movement calculation
- [ ] Create `src/module/data/actor/npc.mjs`
  - [ ] `DeathwatchNPC` extends `DeathwatchActorBase`
  - [ ] `prepareDerivedData()` — move `_prepareNpcData()` here
- [ ] Update `_module.mjs` with actor model exports
- [ ] Register in `deathwatch.mjs`: `CONFIG.Actor.dataModels = { character: ..., npc: ... }`
- [ ] Remove from `actor.mjs`:
  - [ ] `_prepareCharacterData()` method
  - [ ] `_prepareNpcData()` method
  - [ ] `prepareDerivedData()` override
  - [ ] `prepareBaseData()` override (empty)
  - [ ] Imports: `ModifierCollector`, `XPCalculator`, `SkillLoader`, `CHARACTERISTIC_CONSTANTS`
- [ ] Move imports to `character.mjs`: `ModifierCollector`, `XPCalculator`, `SkillLoader`
- [ ] Verify `actor.mjs` is now a thin shell (only `prepareData()`, `_preCreate()`, `getRollData()` + helpers)
- [ ] Update actor-related tests for new access patterns

### Verification
- [ ] `npm test` — all tests pass
- [ ] Character: all 9 characteristics load, display, and calculate bonuses
- [ ] Character: characteristic advances (4 checkboxes per char) work, each adds +5
- [ ] Character: characteristic damage tracking works (subtracts from value)
- [ ] Character: skills load from skills.json via SkillLoader
- [ ] Character: skill modifiers apply (effectType: skill)
- [ ] Character: XP total/spent/available calculate correctly
- [ ] Character: rank calculates correctly from total XP
- [ ] Character: fate points work
- [ ] Character: renown displays
- [ ] Character: psy rating computes (base + modifiers), visible for Librarian only
- [ ] Character: modifiers from all sources apply:
  - [ ] Actor modifiers (system.modifiers)
  - [ ] Equipped item modifiers
  - [ ] Chapter modifiers (always active)
  - [ ] Trait modifiers (always active)
  - [ ] Talent modifiers (always active)
  - [ ] Armor history modifiers (on equipped armor)
  - [ ] Active effect modifiers
- [ ] Character: all modifier effectTypes work:
  - [ ] characteristic
  - [ ] characteristic-post-multiplier (Power Armor Enhanced Strength)
  - [ ] characteristic-bonus (Unnatural characteristics)
  - [ ] skill
  - [ ] initiative
  - [ ] wounds
  - [ ] armor (all 6 locations)
  - [ ] psy-rating
  - [ ] movement
  - [ ] movement-restriction
- [ ] Character: movement calculates correctly (half/full/charge/run from AG bonus)
- [ ] Character: movement restrictions work (e.g., Terminator cannot Run)
- [ ] Character: force weapon modifiers apply AFTER psy rating is computed
- [ ] Character: biography fields save (gender, age, complexion, hair, description, pastEvents)
- [ ] Character: chapter assignment works (chapterId, skill/talent cost overrides)
- [ ] Character: specialty assignment works (specialtyId, rank costs, hasPsyRating)
- [ ] Character: all tabs render (Characteristics, Gear, Biography, Augmentations, Psychic Powers)
- [ ] NPC: basic sheet renders
- [ ] NPC: wounds/fatigue work
- [ ] Combat: initiative rolls work (1d10 + AG bonus + initiative bonus)
- [ ] Combat: full attack → damage → apply flow works
- [ ] Verify `actor.mjs` has no type-specific derived data logic remaining

### Memory Bank
- [ ] `structure.md`: Add `src/module/data/actor/` tree, update actor.mjs description to "thin shell"
- [ ] `datamodel.md`: Add character and NPC models, document character `prepareDerivedData()` (skills, XP, modifiers, movement, force weapon orchestration)
- [ ] `combat-systems.md`: Note force weapon modifier called via `item.system.applyForceWeaponModifiers()` from character model
- [ ] `index.md`: Add DataModel system to Core Systems Summary, update File Locations with `src/module/data/`

### Commit
- [ ] Commit with message: `feat: add DataModels for actor types with derived data`

---

## Phase 5: Cleanup

### Implementation
- [ ] Reduce template.json to type lists only
- [ ] Remove any dead code from `item.mjs` / `actor.mjs`
- [ ] Remove any template.json references in comments
- [ ] Add DataModel schema tests if not already done
- [ ] Final memory bank review:
  - [ ] Review all memory bank files updated during Phases 1-4 for consistency
  - [ ] Verify `datamodel.md` is complete (final class hierarchy, all 20 types, all `prepareDerivedData()` methods)
  - [ ] Verify `structure.md` reflects final directory tree and thin-shell descriptions
  - [ ] Remove any remaining references to template.json field definitions in memory bank files

### Verification
- [ ] `npm test` — all tests pass
- [ ] `npm run test:coverage` — coverage not decreased from pre-migration baseline
- [ ] `npm run build:packs` — compendium packs build successfully
- [ ] Full manual playthrough in Foundry:
  - [ ] Create new character
  - [ ] Assign chapter and specialty
  - [ ] Set characteristic values and advances
  - [ ] Add weapons, armor, gear from compendium
  - [ ] Load ammunition into weapon
  - [ ] Equip armor with attached histories
  - [ ] Add talents and traits
  - [ ] Make ranged attack (verify aim, RoF, range modifiers)
  - [ ] Make melee attack (verify all-out, charge)
  - [ ] Roll damage (verify weapon qualities)
  - [ ] Apply damage to target (verify armor, penetration, Felling)
  - [ ] Check XP spending matches expected values
  - [ ] Verify all modifier sources show in tooltips
  - [ ] Test force weapon with Librarian (psy rating + channeling)
  - [ ] Test movement with restrictions (Terminator armor)

### Commit
- [ ] Commit with message: `chore: cleanup template.json and finalize DataModel migration`

---

## Emergency Rollback

If any phase causes unfixable issues:

1. Remove the problematic type(s) from `CONFIG.*.dataModels` in `deathwatch.mjs`
2. For phases that moved derived data (3a, 3d, 4): restore the methods to `item.mjs` / `actor.mjs` from git
3. The type immediately falls back to template.json
4. No data migration needed — existing data is unchanged
5. Commit the rollback
6. Investigate and fix the model before re-registering
