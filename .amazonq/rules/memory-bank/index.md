# Memory Bank Index

## Overview
Documentation for the Deathwatch Foundry VTT system, including architecture, guidelines, and development patterns.

## Core Documents

### 1. product.md
**Purpose**: System overview and features  
**Contents**: Purpose, key features, target users, use cases

### 2. structure.md
**Purpose**: Codebase organization  
**Contents**: Directory structure, core components, architectural patterns, component relationships

### 3. tech.md
**Purpose**: Technology stack  
**Contents**: Testing (Jest), languages (JavaScript ES modules), framework (Foundry VTT v13), build system

### 4. guidelines.md
**Purpose**: Coding standards and best practices  
**Contents**: Testing standards, code quality, architectural patterns, common implementations, refactoring patterns

### 5. refactoring-summary.md
**Purpose**: Summary of 2024 refactoring improvements  
**Contents**: Key achievements, new helper classes, patterns established

### 6. modifiers.md
**Purpose**: Modifier system documentation  
**Contents**: Modifier architecture, effect types, sources, implementation details, examples

### 7. combat-systems.md
**Purpose**: Combat system architecture and implementation  
**Contents**: Ranged/melee combat separation, attack dialogs, damage application, hit locations, constants

### 8. weapon-qualities.md
**Purpose**: Weapon qualities system documentation  
**Contents**: Quality implementations (Accurate, Primitive, Tearing, etc.), detection methods, combat integration, test coverage

### 9. ammunition-modifiers.md
**Purpose**: Ammunition modifier system documentation  
**Contents**: Modifier types (weapon-damage, weapon-rof, weapon-blast, righteous-fury-threshold, characteristic-damage), weaponClass restrictions, characteristic damage system, UI integration

### 10. specialty-chapter-costs.md
**Purpose**: Specialty and chapter cost override system  
**Contents**: Skill cost overrides (implemented), talent cost overrides (data only), characteristic advance costs (data only), chapter/specialty assignment, XP cost calculation

## Quick Reference

### File Locations
```
Memory Bank:
  .amazonq/rules/memory-bank/
    ├── product.md
    ├── structure.md
    ├── tech.md
    ├── guidelines.md
    ├── refactoring-summary.md
    └── index.md

Source Code:
  src/module/
    ├── documents/
    ├── sheets/
    └── helpers/
        ├── xp-calculator.mjs
        ├── modifier-collector.mjs
        ├── roll-dialog-builder.mjs
        ├── chat-message-builder.mjs
        ├── item-handlers.mjs
        └── constants.mjs

Tests:
  tests/
    ├── setup.mjs
    └── *.test.mjs (372 tests, 68% coverage)
```

### Common Commands
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run build:packs       # Compile compendium packs
```

## Current State

### Metrics
- **Total Lines**: ~2,618
- **Test Coverage**: 68%
- **Tests**: 719 passing
- **Helper Classes**: 5 (XPCalculator, ModifierCollector, RollDialogBuilder, ChatMessageBuilder, ItemHandlers)
- **CSS Files**: 9 modular files
- **CSS Variables**: 60
- **Handlebars Partials**: 3

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

---

**Last Updated**: January 2025  
**Status**: Active Development
