# Memory Bank Index

## Core Documents

### Foundation
1. **product.md** - System overview, features, and use cases
2. **structure.md** - Codebase organization and architecture
3. **tech.md** - Technology stack and tooling
4. **guidelines.md** - Coding standards, testing, and best practices

### Game Systems
5. **modifiers.md** - Modifier system (characteristics, skills, wounds, armor, psy-rating)
6. **combat-systems.md** - Combat mechanics (ranged/melee, damage, hit locations)
7. **weapon-qualities.md** - 24+ weapon qualities (Accurate, Tearing, Melta, Force, etc.)
8. **weapon-upgrades.md** - Weapon upgrade system (attachments, modifiers)
9. **ammunition-modifiers.md** - Ammunition effects (damage, RoF, blast, characteristic damage)
10. **specialty-chapter-costs.md** - XP cost overrides (chapter/specialty bonuses)

## Key Metrics
- **Tests**: 829 passing, 73 suites
- **Helper Classes**: 24+ modules
- **Compendium Packs**: 15

## Commands
```bash
npm test                                                    # Run all tests
npm run test:coverage                                       # Coverage report
npm run build:packs                                         # Compile compendium packs
npm run build:all                                          # Validate + build packs + deploy
```

## Core Systems Summary

### Modifiers
- **Types**: characteristic, characteristic-post-multiplier, skill, initiative, wounds, armor, psy-rating, movement, movement-restriction
- **Sources**: Actor, equipped items, chapters, armor histories, ammunition
- **Pattern**: `ModifierCollector.collectAllModifiers(actor)` → apply methods

### Combat
- **Ranged**: BS-based, RoF (Single/Semi/Full), aim, range modifiers, jamming
- **Melee**: WS-based, all-out attack, charge
- **Shared**: Hit locations, damage application, Righteous Fury

### Weapon Qualities
- **Detection**: `weapon.system.attachedQualities?.includes('key')`
- **Storage**: Strings for simple qualities, objects `{id, value}` for parameterized
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
2. Update template.json if needed
3. Write tests
4. Update UI and document in modifiers.md

### Add Compendium Pack
1. Add item type to template.json
2. Register in system.json
3. Create source directory in packs-source/
4. Add JSON files with unique `_id` fields
5. Run `npm run build:packs`

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
src/module/documents/    Actor, Item, ActorConditions
src/module/helpers/      24+ helper modules
src/module/sheets/       ActorSheet, ItemSheet
src/template.json        Data schema
src/packs-source/        Compendium JSON source
tests/                   804 tests across 71 suites
```

---
**Last Updated**: January 2025
