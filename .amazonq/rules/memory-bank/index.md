# Memory Bank Index

## Core Documents

### Foundation
1. **product.md** - System overview, features, and use cases
2. **structure.md** - Codebase organization and architecture
3. **tech.md** - Technology stack and tooling
4. **guidelines.md** - Coding standards, testing, and best practices
5. **datamodel.md** - TypeDataModel migration (class hierarchy, shared templates, registration)

### Game Systems
6. **modifiers.md** - Modifier system (characteristics, skills, wounds, armor, psy-rating)
7. **combat-systems.md** - Combat mechanics (ranged/melee, damage, hit locations)
8. **weapon-qualities.md** - 24+ weapon qualities (Accurate, Tearing, Melta, Force, etc.)
9. **weapon-upgrades.md** - Weapon upgrade system (attachments, modifiers)
10. **ammunition-modifiers.md** - Ammunition effects (damage, RoF, blast, characteristic damage)
11. **specialty-chapter-costs.md** - XP cost overrides (chapter/specialty bonuses)
12. **enemies.md** - Enemy & horde compendium entries, faction-based ID conventions
13. **psychic-combat.md** - Psychic power Focus Power Tests, Phenomena, Perils

## Key Metrics
- **Tests**: 1184 passing, 82 suites
- **Helper Classes**: 26+ modules
- **Compendium Packs**: 17 (including enemies)
- **DataModel Types**: All 17 item types + 4 actor types registered

## Commands
```bash
npm test                                                    # Run all tests
npm run test:coverage                                       # Coverage report
npm run format:json                                         # Compact + Prettier JSON formatting
npm run build:packs                                         # Compact + format + validate + compile
npm run build:all                                           # build:packs + deploy
```

## Core Systems Summary

### DataModel System
- **Actor Models**: `DeathwatchCharacter` (full derived data), `DeathwatchNPC` (minimal), `DeathwatchEnemy` (full characteristics + psy rating), `DeathwatchHorde` (magnitude-based, extends Enemy)
- **Item Models**: 17 types, all registered via `CONFIG.Item.dataModels`
- **Document Shells**: `actor.mjs` and `item.mjs` are thin shells; business logic in DataModels
- **Actor Sheet Integration**: `getData()` uses `{ ...this.actor.system }` for live derived data; `_prepareItems()` uses live item data
- **Critical**: Characteristic `base` field MUST be in schema (template binds to it for user input)
- **Polymorphic Combat**: `DeathwatchActorBase` defines combat methods (`getArmorValue`, `getDefenses`, `calculateHitsReceived`, `receiveDamage`, `canRighteousFury`) overridden by Horde and Character

### Modifiers
- **Types**: characteristic, characteristic-post-multiplier, skill, initiative, wounds, armor, psy-rating, movement, movement-restriction, psychic-test, no-perils
- **Sources**: Actor, equipped items, chapters, armor histories, ammunition
- **Pattern**: `ModifierCollector.collectAllModifiers(actor)` → apply methods

### Combat
- **Ranged**: BS-based (uses computed `bs.value`), RoF (Single/Semi/Full), aim, range modifiers, jamming
- **Melee**: WS-based (uses computed `ws.value`), all-out attack, charge, DoS displayed in chat
- **Shared**: Hit locations, damage application (polymorphic), Righteous Fury
- **Horde**: Magnitude-based damage, batch damage application, special hit rules (blast/flame/melee DoS)

### Psychic Combat
- **Focus Power Test**: WP + (up to 5 × ePR) + psychic-test modifiers + misc, capped at 90. Roll 91+ always fails.
- **Power Levels**: Fettered (ePR = ceil(PR/2), no Phenomena), Unfettered (full PR, Phenomena on doubles), Push (PR+3, auto Phenomena, Fatigue on doubles)
- **Phenomena/Perils**: Auto-draws from roll tables. Perils only via Phenomena cascade (result 75+).
- **Modifier Support**: `psychic-test` (additive WP bonus) and `no-perils` (suppresses Perils cascade)
- **Helper**: `PsychicCombatHelper` in `psychic-combat.mjs` — 7 pure functions + dialog + table integration
- **Planning**: `docs/psychic-combat/` (4 phase docs, Phases 1-2 complete)

### Weapon Qualities
- **Detection**: `.some(q => (typeof q === 'string' ? q : q.id) === key)`
- **Storage**: Objects `{id}` or `{id, value}` (standardized from mixed string/object format)
- **Key**: Accurate, Tearing, Primitive, Melta, Lightning Claws, Power Field, Force

### Ammunition Modifiers
- **Types**: weapon-damage, weapon-rof, weapon-blast, righteous-fury-threshold, characteristic-damage
- **Special**: weaponClass restrictions, qualityException field

## Common Tasks

### Add New Weapon Quality
1. Implement detection in WeaponQualityHelper
2. Add effect logic in CombatDialogHelper
3. Write tests
4. Add to compendium pack
5. Document in weapon-qualities.md

### Add New Modifier Type
1. Add to ModifierCollector apply methods
2. Add DataModel field if needed
3. Write tests
4. Update UI and document in modifiers.md

### Add Compendium Pack
1. Add item type to template.json types array
2. Create DataModel class in `src/module/data/item/`
3. Register in `deathwatch.mjs` CONFIG.Item.dataModels
4. Register in system.json
5. Create source directory in packs-source/
6. Add JSON files with unique `_id` fields
7. Run `npm run build:packs`

## Troubleshooting

### Tests Failing
1. Check `jest.clearAllMocks()` in beforeEach
2. Verify mock setup in tests/setup.mjs
3. Run single test: `npm test -- path/to/test.mjs`

### Modifier Not Applying
1. Check `enabled` field (must not be false)
2. Verify `effectType` matches expected value
3. Check item is equipped (except chapters)
4. Enable debug: `DEBUG_FLAGS.MODIFIERS = true`

## File Locations
```
src/module/data/         TypeDataModel classes (base-document, actor/*.mjs, item/*.mjs)
src/module/documents/    Actor, Item (thin shells), ActorConditions
src/module/helpers/      Core infrastructure (constants, config, debug, foundry-adapter)
src/module/helpers/combat/    Combat logic (10 files: combat, ranged, melee, psychic, horde, etc.)
src/module/helpers/character/ Character data (6 files: modifiers, XP, skills, wounds, rank)
src/module/helpers/ui/        UI helpers (5 files: chat, dialogs, items, templates, handlebars)
src/module/sheets/       ActorSheet, ItemSheet
src/template.json        Type lists only (4 actor types, 17 item types)
src/packs-source/        Compendium JSON source
builds/scripts/          Build, validation, formatting, and deployment scripts
tests/                   1184 tests across 82 suites
docs/datamodel/          Full DataModel migration plan (10 files)
docs/psychic-combat/     Psychic combat planning (4 phase docs)
```

---
**Last Updated**: January 2025 (Psychic combat Phase 1-3 complete, Phase 4a status effects, Phase 4b damage powers, helpers reorganized, 1184 tests)
