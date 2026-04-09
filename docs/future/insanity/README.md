# Insanity and Corruption System - Documentation Index

This directory contains comprehensive documentation for implementing the Insanity and Corruption mechanics in the Deathwatch system.

## Overview

The Insanity and Corruption system tracks the mental and spiritual degradation of Space Marines exposed to Chaos and warp-related horrors. Unlike normal humans, Space Marines resist corruption and insanity far longer, but once they reach their limits (100 points), they are removed from play as fallen.

## Documentation Files

### 1. [rules.md](./rules.md)
**Source material** from the Deathwatch Core Rulebook describing how Insanity and Corruption work mechanically.

**Contents**:
- Corruption rules for Space Marines
- Purity Threshold (100 CP)
- Insanity Points and Insanity Track
- Battle Trauma acquisition
- Primarch's Curse progression
- Example traumas and curses

**Use for**: Understanding the core rules as written in the book.

---

### 2. [implementation-plan.md](./implementation-plan.md)
**High-level roadmap** for implementing the system in phases over 4 weeks.

**Contents**:
- 7 implementation phases (data model → mechanics → UI → integration → compendium → testing → docs)
- Architecture decisions and rationale
- Dependencies on existing systems
- Open questions and edge cases
- Migration strategy for existing worlds
- Timeline and success metrics

**Use for**: Project planning, task breakdown, and understanding the big picture.

---

### 3. [data-model.md](./data-model.md)
**Detailed schema** for all data structures related to insanity and corruption.

**Contents**:
- Character actor schema extensions (corruption, insanity, history logs)
- Battle Trauma item DataModel with full schema
- Primarch's Curse item DataModel with 3-level progression
- Item type registration
- Template.json updates
- Migration script for existing characters
- Constants definitions
- Data flow diagrams

**Use for**: Implementing data structures, schemas, and DataModel classes.

---

### 4. [mechanics.md](./mechanics.md)
**Detailed mechanical implementation** of all game rules.

**Contents**:
- Gaining corruption points (sources, API)
- Gaining insanity points (sources, API)
- Insanity track calculations
- Insanity test triggering and resolution
- Battle Trauma rolling with duplicate prevention
- Primarch's Curse level progression
- Character removal at thresholds
- Integration with psychic powers, cohesion, combat, etc.
- GM tools (manual adjustments, history logs)
- Chat message templates

**Use for**: Implementing helper modules and game logic.

---

### 5. [ui-requirements.md](./ui-requirements.md)
**UI/UX specifications** for all visual elements.

**Contents**:
- Character sheet additions (mental state section)
- Corruption and insanity displays
- Battle Traumas section
- Primarch's Curse display
- Dialog specifications (history, adjustment, tests, trauma rolling, character removal)
- Item sheets (Battle Trauma, Primarch's Curse)
- Chat message templates
- Token HUD integration
- Settings panel
- Responsive design and accessibility

**Use for**: Implementing UI components, dialogs, and templates.

---

### 6. [testing-plan.md](./testing-plan.md)
**Comprehensive test coverage** requirements and test plans.

**Contents**:
- Unit tests for all helper modules
- Integration tests for system interactions
- E2E tests for user workflows
- Performance tests (sheet render times)
- Regression tests (no breaking changes)
- Test data fixtures
- CI/CD integration
- Manual testing checklist

**Use for**: Writing tests and ensuring quality.

---

### 7. [roll-table.md](./roll-table.md)
**Battle Trauma RollTable implementation** using Foundry's native RollTable system.

**Contents**:
- RollTable structure and configuration
- Integration with battle-traumas compendium
- Programmatic usage (`RollTable.draw()`)
- GM customization guide
- Duplicate prevention strategy
- Testing approach
- Benefits over code-based lookup

**Use for**: Implementing the Battle Trauma RollTable and understanding RollTable integration.

---

### 8. [battle-rage-implementation.md](./battle-rage-implementation.md)
**Complete Battle Rage trauma implementation** with Active Effects and targeting restrictions.

**Contents**:
- Full implementation flow (trigger → resist test → fixation → enforcement)
- Active Effect data structure for fixation tracking
- WP resist test dialog and mechanics
- Attack targeting enforcement
- Automatic fixation removal when target dies
- Edge cases (target flees, GM override, greater danger)
- UI elements (token effects, chat messages, combat tracker)
- Integration with Righteous Fury system
- Testing approach

**Use for**: Implementing Battle Rage and understanding behavioral trauma effects.

---

## Quick Start

1. **Understand the rules**: Read [rules.md](./rules.md) to understand the core mechanics
2. **Review the plan**: Read [implementation-plan.md](./implementation-plan.md) to see the phased approach
3. **Design data structures**: Use [data-model.md](./data-model.md) to implement schemas
4. **Implement mechanics**: Use [mechanics.md](./mechanics.md) to build helper modules
5. **Set up RollTable**: Use [roll-table.md](./roll-table.md) to create the Battle Trauma table
6. **Build UI**: Use [ui-requirements.md](./ui-requirements.md) to create sheets and dialogs
7. **Write tests**: Use [testing-plan.md](./testing-plan.md) to ensure quality

## Key Concepts

### Corruption System
- **Corruption Points (CP)**: Accumulating counter of spiritual taint
- **Purity Threshold**: 100 CP = character removed from play
- **No mechanical effects** until threshold (narrative only)
- **Social penalties**: Fellowship tests, psyker detection, daemon attraction

### Insanity System
- **Insanity Points (IP)**: Accumulating counter of mental trauma
- **Insanity Track**: 4 levels (0-30, 31-60, 61-90, 91-99) with escalating effects
- **Battle Traumas**: Permanent mental wounds from failed Willpower tests (rolled on RollTable)
- **Primarch's Curse**: Chapter-specific madness with 3 escalating levels (integrated into Chapter items)
- **Character removal**: 100+ IP = removed from play

### Integration Points
- **Psychic Powers**: Perils of the Warp grants CP/IP
- **Combat**: Battle Trauma triggers during combat actions
- **Cohesion**: Primarch's Curse reduces squad cohesion
- **Fellowship**: High corruption penalizes social tests
- **Modifiers**: Battle Traumas and Primarch's Curse apply stat/skill modifiers

## Architecture Patterns

This implementation follows established Deathwatch system patterns:

- **DataModel Pattern**: Use Foundry v13 DataModel classes for schemas
- **Helper Pattern**: Pure functions in helper modules (testable)
- **FoundryAdapter Pattern**: Route all Foundry API calls through adapter (mockable)
- **Modifier System**: Use existing modifier collector/applicator
- **Constants**: Define all magic numbers in constants files with JSDoc
- **Error Handling**: Wrap all event handlers with ErrorHandler.wrap()
- **Logging**: Use Logger for all logging (not console.log)
- **Sanitization**: Escape all user input with Sanitizer

## Timeline

**Total**: 4 weeks (see [implementation-plan.md](./implementation-plan.md) for details)

- **Week 1**: Data model + core mechanics
- **Week 2**: UI implementation + integration with existing systems
- **Week 3**: Compendium content + testing
- **Week 4**: Documentation + polish

## Success Metrics

- [ ] 1752+ tests still passing (no regressions)
- [ ] 50+ new tests covering insanity/corruption
- [ ] All 5 battle traumas functional
- [ ] All 9+ primarch's curses functional
- [ ] Character removal at thresholds works correctly
- [ ] UI displays points and effects clearly
- [ ] Performance: < 50ms overhead on sheet render
- [ ] Documentation complete in CLAUDE.md

## Questions or Issues?

If you have questions or encounter issues while implementing:

1. Check the relevant documentation file above
2. Review the existing codebase for similar patterns
3. Consult CLAUDE.md for overall system architecture
4. Ask in the appropriate channel (development, design, testing)

## Contributing

When adding new documentation:

1. Follow the existing structure and format
2. Include code examples where appropriate
3. Reference source rulebook pages for all mechanics
4. Update this README.md with links to new files
