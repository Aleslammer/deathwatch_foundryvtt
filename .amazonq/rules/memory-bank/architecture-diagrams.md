# Architecture Diagrams

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Foundry VTT Core                        │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    deathwatch.mjs                           │
│                  (System Entry Point)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Documents  │    │    Sheets    │    │   Helpers    │
├──────────────┤    ├──────────────┤    ├──────────────┤
│              │    │              │    │              │
│ actor.mjs    │◄───┤actor-sheet   │◄───┤ config.mjs   │
│ (300 lines)  │    │  .mjs        │    │              │
│              │    │ (800 lines)  │    │ combat.mjs   │
│ ┌──────────┐ │    │              │    │              │
│ │XP Calc   │ │    │ ┌──────────┐ │    │ modifiers    │
│ │Modifiers │ │    │ │Roll Dlg  │ │    │  .mjs        │
│ │Char Calc │ │    │ │Roll Dlg  │ │    │              │
│ └──────────┘ │    │ │(duplicate)│    │ effects.mjs  │
│              │    │ └──────────┘ │    │              │
│ item.mjs     │◄───┤              │    │ debug.mjs    │
│              │    │ item-sheet   │    │              │
│              │    │  .mjs        │    │ templates    │
│              │    │              │    │  .mjs        │
└──────────────┘    └──────────────┘    └──────────────┘

Issues:
❌ actor.mjs too complex (300 lines)
❌ actor-sheet.mjs too large (800 lines)
❌ Duplicate roll dialog code
❌ Business logic mixed with UI
❌ Hard to test in isolation
```

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Foundry VTT Core                        │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    deathwatch.mjs                           │
│                  (System Entry Point)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬─────────────┐
        │                   │                   │             │
        ▼                   ▼                   ▼             ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐ ┌──────────┐
│   Documents  │    │    Sheets    │    │   Helpers    │ │  Utils   │
├──────────────┤    ├──────────────┤    ├──────────────┤ ├──────────┤
│              │    │              │    │              │ │          │
│ actor.mjs    │◄───┤actor-sheet   │◄───┤ config.mjs   │ │xp-calc   │
│ (100 lines)  │    │  .mjs        │    │              │ │ .mjs     │
│              │    │ (400 lines)  │    │ combat.mjs   │ │          │
│              │    │              │    │              │ │modifier- │
│              │    │              │    │ modifiers    │ │collector │
│              │    │              │    │  .mjs        │ │ .mjs     │
│              │    │              │    │              │ │          │
│              │    │              │    │ effects.mjs  │ │roll-     │
│              │    │              │    │              │ │dialog-   │
│ item.mjs     │◄───┤              │    │ debug.mjs    │ │builder   │
│              │    │ item-sheet   │    │              │ │ .mjs     │
│              │    │  .mjs        │    │ templates    │ │          │
│              │    │              │    │  .mjs        │ │dialog-   │
│              │    │              │    │              │ │templates │
│              │    │              │    │ foundry-     │ │ .mjs     │
│              │    │              │    │ adapter.mjs  │ │          │
└──────────────┘    └──────────────┘    └──────────────┘ └──────────┘

Benefits:
✅ actor.mjs simplified (100 lines)
✅ actor-sheet.mjs reduced (400 lines)
✅ No duplicate code
✅ Clear separation of concerns
✅ Easy to test
✅ Reusable utilities
```

## Data Flow: Current vs Proposed

### Current: Character Data Preparation

```
Actor.prepareDerivedData()
        │
        ▼
_prepareCharacterData()
        │
        ├─► Calculate Rank (inline, 10 lines)
        │
        ├─► Calculate XP (inline, 100+ lines)
        │   ├─► Get chapter costs
        │   ├─► Loop through items
        │   ├─► Calculate talent costs
        │   └─► Calculate skill costs
        │
        ├─► Collect Modifiers (inline, 80+ lines)
        │   ├─► Get actor modifiers
        │   ├─► Loop through items
        │   ├─► Get item modifiers
        │   └─► Get armor history modifiers
        │
        └─► Apply Modifiers (inline, 60+ lines)
            ├─► Apply to characteristics
            ├─► Apply to skills
            └─► Apply to initiative

Total: 250+ lines in one method ❌
```

### Proposed: Character Data Preparation

```
Actor.prepareDerivedData()
        │
        ▼
_prepareCharacterData()
        │
        ├─► XPCalculator.calculateRank()
        │   └─► Pure function, testable ✅
        │
        ├─► XPCalculator.calculateSpentXP()
        │   └─► Pure function, testable ✅
        │
        ├─► ModifierCollector.collectAllModifiers()
        │   ├─► collectItemModifiers()
        │   └─► collectArmorHistoryModifiers()
        │   └─► Pure functions, testable ✅
        │
        └─► ModifierCollector.applyModifiers()
            ├─► applyCharacteristicModifiers()
            ├─► applySkillModifiers()
            └─► applyInitiativeModifiers()
            └─► Pure functions, testable ✅

Total: 30 lines in main method ✅
Each helper: 50-100 lines, focused ✅
```

## Roll Dialog Flow: Current vs Proposed

### Current: Duplicate Code

```
_onCharacteristicRoll()                _onSkillRoll()
        │                                      │
        ├─► Build HTML (50 lines)              ├─► Build HTML (50 lines)
        │   └─► Difficulty select              │   └─► Difficulty select
        │   └─► Misc modifier input            │   └─► Misc modifier input
        │                                      │
        ├─► Attach handlers (10 lines)         ├─► Attach handlers (10 lines)
        │   └─► Input validation               │   └─► Input validation
        │                                      │
        └─► Roll callback (40 lines)           └─► Roll callback (40 lines)
            ├─► Parse modifiers                    ├─► Parse modifiers
            ├─► Calculate target                   ├─► Calculate target
            ├─► Roll dice                          ├─► Roll dice
            ├─► Calculate result                   ├─► Calculate result
            └─► Build flavor                       └─► Build flavor

Total: 200 lines (100 per method) ❌
90% duplicate code ❌
```

### Proposed: Shared Code

```
_onCharacteristicRoll()                _onSkillRoll()
        │                                      │
        ├─► Prepare roll data                  ├─► Prepare roll data
        │                                      │
        └─► _onRollWithModifiers()             └─► _onRollWithModifiers()
                    │
                    ├─► RollDialogBuilder.buildModifierDialog()
                    │   └─► Reusable HTML generation ✅
                    │
                    ├─► RollDialogBuilder.attachModifierInputHandler()
                    │   └─► Reusable event handling ✅
                    │
                    └─► Roll callback
                        ├─► RollDialogBuilder.parseModifiers()
                        ├─► RollDialogBuilder.buildModifierParts()
                        └─► RollDialogBuilder.buildResultFlavor()
                        └─► All reusable ✅

Total: 50 lines (25 per method) ✅
0% duplicate code ✅
Shared utilities: 100 lines ✅
```

## CSS Organization: Current vs Proposed

### Current: Single File

```
deathwatch.css (1000+ lines)
├─► Global styles
├─► Grid system
├─► Flex utilities
├─► Sheet styles
├─► Item list styles
├─► Modifier dialog styles (100+ lines)
├─► Skills styles
├─► Characteristics styles
└─► Misc styles

Issues:
❌ Hard to navigate
❌ High specificity (.deathwatch .items-list .item .item-name)
❌ No variables
❌ Difficult to override
```

### Proposed: Modular CSS

```
styles/
├─► deathwatch.css (main, 100 lines)
│   ├─► @import variables.css
│   ├─► @import base.css
│   ├─► @import components/...
│   └─► @import utilities.css
│
├─► variables.css (50 lines)
│   ├─► :root { --dw-color-primary: ... }
│   └─► CSS custom properties ✅
│
├─► base.css (100 lines)
│   ├─► .dw-sheet
│   └─► .dw-header
│
├─► components/
│   ├─► dialogs.css (150 lines)
│   │   ├─► .dw-dialog
│   │   └─► .dw-modifier-dialog
│   │
│   ├─► items.css (200 lines)
│   │   ├─► .dw-items-list
│   │   └─► .dw-item
│   │
│   ├─► skills.css (150 lines)
│   │   ├─► .dw-skills-list
│   │   └─► .dw-skill
│   │
│   └─► characteristics.css (150 lines)
│       ├─► .dw-characteristics
│       └─► .dw-characteristic
│
└─► utilities.css (100 lines)
    ├─► .dw-grid
    └─► .dw-flex

Benefits:
✅ Easy to navigate
✅ Lower specificity
✅ CSS variables
✅ Modular and maintainable
```

## Testing Architecture

### Current

```
tests/
├─► setup.mjs (Foundry mocks)
├─► combat.test.mjs
├─► combat-dialog.test.mjs
├─► constants.test.mjs
├─► critical-effects.test.mjs
├─► debug.test.mjs
├─► effects.test.mjs
├─► item.test.mjs
├─► modifiers.test.mjs
└─► templates.test.mjs

Coverage: ~60%
Missing tests for:
❌ actor.mjs (complex, hard to test)
❌ actor-sheet.mjs (UI code, hard to test)
```

### Proposed

```
tests/
├─► setup.mjs (Foundry mocks)
│
├─► documents/
│   ├─► actor.test.mjs ✅
│   └─► item.test.mjs
│
├─► helpers/
│   ├─► combat.test.mjs
│   ├─► combat-dialog.test.mjs
│   ├─► constants.test.mjs
│   ├─► critical-effects.test.mjs
│   ├─► debug.test.mjs
│   ├─► effects.test.mjs
│   ├─► modifiers.test.mjs
│   └─► templates.test.mjs
│
└─► utils/
    ├─► xp-calculator.test.mjs ✅
    ├─► modifier-collector.test.mjs ✅
    ├─► roll-dialog-builder.test.mjs ✅
    └─► dialog-templates.test.mjs ✅

Coverage: ~75%
All business logic tested ✅
Pure functions easy to test ✅
```

## Module Dependencies

### Current

```
actor.mjs
  └─► debug.mjs

actor-sheet.mjs
  ├─► effects.mjs
  ├─► config.mjs
  ├─► combat.mjs
  └─► modifiers.mjs

combat.mjs
  ├─► constants.mjs
  ├─► combat-dialog.mjs
  ├─► foundry-adapter.mjs
  └─► debug.mjs

Issues:
❌ actor.mjs has no helper dependencies (all inline)
❌ actor-sheet.mjs has complex dependencies
```

### Proposed

```
actor.mjs
  ├─► xp-calculator.mjs ✅
  ├─► modifier-collector.mjs ✅
  └─► debug.mjs

actor-sheet.mjs
  ├─► effects.mjs
  ├─► config.mjs
  ├─► combat.mjs
  ├─► modifiers.mjs
  ├─► roll-dialog-builder.mjs ✅
  └─► dialog-templates.mjs ✅

combat.mjs
  ├─► constants.mjs
  ├─► combat-dialog.mjs
  ├─► foundry-adapter.mjs
  └─► debug.mjs

xp-calculator.mjs (new)
  └─► No dependencies ✅

modifier-collector.mjs (new)
  └─► debug.mjs

roll-dialog-builder.mjs (new)
  └─► config.mjs

Benefits:
✅ Clear dependency tree
✅ Reusable utilities
✅ Easy to test in isolation
```

## Summary

### Metrics Comparison

| Metric | Current | Proposed | Improvement |
|--------|---------|----------|-------------|
| actor.mjs lines | 300 | 100 | 67% reduction |
| actor-sheet.mjs lines | 800 | 400 | 50% reduction |
| Duplicate code | ~200 lines | 0 | 100% reduction |
| CSS files | 1 | 6 | Better organization |
| Test coverage | 60% | 75% | 25% increase |
| Testable helpers | 8 | 12 | 50% increase |
| Max file size | 800 | 400 | 50% reduction |

### Key Improvements

1. **Modularity**: Extract business logic into focused helpers
2. **Testability**: Pure functions easy to test in isolation
3. **Maintainability**: Smaller files, clearer responsibilities
4. **Reusability**: Shared utilities reduce duplication
5. **Organization**: Better file structure and naming
6. **Performance**: Optimized CSS, faster parsing
7. **Developer Experience**: Easier to navigate and understand

### Implementation Path

```
Phase 1: Quick Wins (2.5 hours)
  └─► Extract XPCalculator
  └─► Extract ModifierCollector
  └─► Add CSS Variables
  └─► Consolidate Roll Dialogs

Phase 2: Structural (1 week)
  └─► Extract Event Handlers
  └─► Create Item Handlers
  └─► Split CSS Files
  └─► Create Dialog Templates

Phase 3: Polish (1 week)
  └─► Add More Tests
  └─► Create Handlebars Partials
  └─► Optimize CSS
  └─► Update Documentation
```
