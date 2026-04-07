---
name: project_overview
description: High-level overview of the Deathwatch Foundry VTT system
type: project
---

This is a Foundry VTT v13 game system implementation for Warhammer 40,000: Deathwatch RPG.

**Key Components:**
- 4 actor types: Character, NPC, Enemy, Horde (magnitude-based)
- 17 item types: weapons, armor, talents, psychic powers, etc.
- 17 compendium packs with 800+ entries
- Complex combat system with 24+ automated weapon qualities
- Kill-team Cohesion & Solo/Squad Mode system
- Psychic powers with Psy Rating, Phenomena, and Perils

**Current Status (as of April 2025):**
- 1567 tests passing (68% coverage)
- ApplicationV2 migration complete (v1 and v2 sheets coexist)
- All core systems implemented and tested

**Architecture:**
- Foundry v13 TypeDataModel pattern for programmatic schemas
- Helper classes for pure business logic (testable without Foundry instance)
- FoundryAdapter pattern for mocking Foundry API in tests
- Polymorphic combat system (base methods overridden by Horde)
