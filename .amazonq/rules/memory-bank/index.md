# Memory Bank Index

## Overview
Documentation for the Deathwatch Foundry VTT system, including architecture, guidelines, and development patterns.

## Quick Access

### New to the Project?
Start with **QUICK-REFERENCE.md** for essential commands, patterns, and troubleshooting.

### Core Documents

### Foundation
1. **product.md** - System overview, features, and use cases
2. **structure.md** - Codebase organization and architecture
3. **tech.md** - Technology stack and tooling
4. **guidelines.md** - Coding standards and best practices

### Game Systems
5. **modifiers.md** - Modifier system (characteristics, skills, wounds, armor, psy-rating)
6. **combat-systems.md** - Combat mechanics (ranged/melee, damage, hit locations)
7. **weapon-qualities.md** - Weapon qualities (Accurate, Tearing, Melta, Lightning Claws, etc.)
8. **weapon-upgrades.md** - Weapon upgrade system (attachments, modifiers)
9. **ammunition-modifiers.md** - Ammunition effects (damage, RoF, blast, characteristic damage)
10. **specialty-chapter-costs.md** - XP cost overrides (chapter/specialty bonuses, talentCosts)

## Quick Reference

### File Locations
```
Memory Bank:
  .amazonq/rules/memory-bank/
    ├── QUICK-REFERENCE.md (start here!)
    ├── index.md
    ├── Foundation: product.md, structure.md, tech.md, guidelines.md
    ├── Game Systems: modifiers.md, combat-systems.md, weapon-qualities.md,
    │   weapon-upgrades.md, ammunition-modifiers.md, specialty-chapter-costs.md
    └── Archive: ARCHIVE-NOTE.md, OPTIMIZATION-SUMMARY.md, refactoring-summary.md

Source Code:
  src/module/
    ├── documents/ (actor.mjs, item.mjs, actor-conditions.mjs)
    ├── sheets/ (actor-sheet.mjs, item-sheet.mjs)
    ├── helpers/ (24 helper modules)
    └── data/ (skills.json)

Tests:
  tests/
    ├── setup.mjs
    └── *.test.mjs (781 tests passing)
```

### Common Commands
```bash
npm test                                                    # Run all tests
npm run test:watch                                          # Watch mode
npm run test:coverage                                       # Coverage report
npm run build:packs                                         # Compile compendium packs
cls;npm run build:packs;.\builds\scripts\CopyLocal.ps1     # Full build + deploy
```

## Current State

### Metrics
- **Test Coverage**: 79.31%
- **Tests**: 781 passing
- **Helper Classes**: 24 helpers (XPCalculator, ModifierCollector, RollDialogBuilder, ChatMessageBuilder, ItemHandlers, WeaponQualityHelper, WeaponUpgradeHelper, CombatHelper, RangedCombatHelper, MeleeCombatHelper, RighteousFuryHelper, WoundHelper, RankHelper, SkillLoader, StatusEffects, CriticalEffects, FoundryAdapter, and more)
- **CSS**: Modular component-based architecture
- **Compendium Packs**: 15 packs (Ammunition, Weapons, Armor, Gear, Talents, Traits, Chapters, Specialties, Implants, Cybernetics, Weapon Qualities, Weapon Upgrades, Demeanours, Critical Effects, Tables)

### Architecture
- Clean separation of concerns
- Helper classes for business logic
- Modular CSS with variables
- Reusable template partials
- Named constants

## Development Patterns

### Helper Classes
Extract complex logic into focused static classes with pure functions.

### CSS Organization
- Use CSS variables (`:root { --dw-* }`)
- Low specificity (`.dw-block__element`)
- Component-based files

### Templates
Create partials for repeated HTML patterns.

### Testing
- Write tests for all helpers (target 90%+)
- Mock Foundry globals in `tests/setup.mjs`
- Use pure functions for testability

## Resources

### Internal
- Memory bank documents (this folder)
- Source code (`src/`)
- Tests (`tests/`)
- README.md

### External
- [Foundry VTT Documentation](https://foundryvtt.com/api/)
- [Jest Documentation](https://jestjs.io/)

## Document Status

### Complete
- Foundation documents (product, structure, tech, guidelines)
- Core systems (modifiers, combat, weapon qualities/upgrades)
- Ammunition and specialty systems

### Maintenance Notes
- weapon-quality-accurate.md and weapon-quality-melta.md are legacy - content merged into weapon-qualities.md
- lightning-claws.md is legacy - content merged into weapon-qualities.md
- refactoring-summary.md is historical reference only

---

**Last Updated**: January 2025  
**Status**: Active Development
