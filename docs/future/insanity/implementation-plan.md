# Insanity and Corruption System - Implementation Plan

## Overview

This document outlines the implementation plan for the Insanity and Corruption mechanics in the Deathwatch system. These systems track the mental and spiritual degradation of Space Marines exposed to Chaos and warp-related horrors.

## Core Systems

### 1. Corruption System
- **Corruption Points**: Accumulating counter that represents spiritual taint
- **Purity Threshold**: 100 CP threshold before character removal
- **Social Effects**: Influence Fellowship tests, psyker detection, daemon interaction
- **No mechanical penalties** until threshold reached

### 2. Insanity System
- **Insanity Points**: Accumulating counter for mental trauma
- **Insanity Track**: Thresholds at 30/60/90/100+ with escalating effects
- **Battle Traumas**: Permanent mental wounds gained from failed WP tests
- **Primarch's Curse**: Chapter-specific madness that escalates with insanity levels

## Implementation Phases

### Phase 1: Data Model (Week 1)
**Files to create/modify:**
- `src/module/data/actor/character.mjs` - Add corruption/insanity tracking
- `src/module/data/item/battle-trauma.mjs` - New item type for traumas
- `src/module/data/item/chapter.mjs` - Add Primarch's Curse fields to existing Chapter item

**Tasks:**
- Add `corruption`, `insanity`, `corruptionHistory`, `insanityHistory` to character schema
- Create Battle Trauma item DataModel with trigger conditions and effects
- Add Primarch's Curse fields to Chapter item schema (3-level progression)
- Add `getActiveCurseLevel()` helper method to Chapter DataModel
- Add helper methods for threshold detection and removal checks

### Phase 2: Core Mechanics (Week 1-2)
**Files to create:**
- `src/module/helpers/insanity-helper.mjs` - Insanity test logic, trauma rolling
- `src/module/helpers/corruption-helper.mjs` - Corruption tracking and threshold checks
- `src/module/helpers/constants/insanity-constants.mjs` - Insanity track thresholds
- `src/module/helpers/constants/corruption-constants.mjs` - Purity threshold constant

**Tasks:**
- Implement insanity test with track modifiers
- Implement trauma rolling with duplicate prevention
- Implement corruption threshold detection
- Implement Primarch's Curse level calculation
- Add character removal logic at 100+ CP/IP

### Phase 3: UI Implementation (Week 2)
**Files to modify:**
- `src/module/sheets/actor-sheet.mjs` - Add Mental State tab
- `src/templates/actor/partials/mental-state-tab.hbs` - New tab template
- `src/module/sheets/item-sheet.mjs` - Battle Trauma sheet
- `src/module/sheets/item-sheet.mjs` - Extend Chapter sheet with curse section

**Tasks:**
- Add Mental State tab to character sheet
- Add Corruption Points display and history log
- Add Insanity Points display with track visualization
- Add Battle Trauma list section
- Add Primarch's Curse display (reads from chapter)
- Add manual point adjustment controls (GM only)
- Create item sheet for Battle Trauma
- Add curse section to Chapter item sheet

### Phase 4: Integration with Existing Systems (Week 2-3)
**Files to modify:**
- `src/module/helpers/combat/psychic-combat.mjs` - Add insanity/corruption from psychic phenomena
- `src/module/helpers/modifier-collector.mjs` - Collect modifiers from active traumas
- `src/module/sheets/shared/handlers/characteristic-handlers.mjs` - Apply trauma penalties to WP tests
- `src/module/data/item/chapter.mjs` - Link Primarch's Curse to chapters

**Tasks:**
- Trigger corruption/insanity from Perils of the Warp
- Apply Battle Trauma modifiers to relevant rolls
- Trigger Primarch's Curse effects at each level
- Add insanity test prompts when gaining 10+ IP
- Integrate with Fellowship tests for high corruption

### Phase 5: Compendium Content (Week 3)
**Files to create/modify:**
- `src/packs-source/battle-traumas/*.json` - 5 battle traumas from rules
- `src/packs-source/roll-tables/battle-trauma-table.json` - RollTable for trauma rolling
- `src/packs-source/chapters/*.json` - Update existing chapter entries with curse data

**Tasks:**
- Create Battle Rage trauma with Righteous Fury trigger
- Create remaining 4 battle traumas (Ear of Emperor, Ancestral Spirits, etc.)
- Create Battle Trauma RollTable (d10) with references to trauma items
- Update Black Templars chapter with "Burn the Witch" curse data
- Research and add curses to other 8+ chapter compendium entries
- Build compendium pack for battle traumas
- Build compendium pack for roll tables
- Rebuild chapters compendium pack with curse data included

### Phase 6: Testing (Week 3-4)
**Files to create:**
- `tests/helpers/insanity-helper.test.mjs`
- `tests/helpers/corruption-helper.test.mjs`
- `tests/data/battle-trauma.test.mjs`

**Tasks:**
- Unit tests for insanity track calculations
- Unit tests for trauma rolling and duplicate prevention
- Unit tests for corruption threshold detection
- Integration tests for Primarch's Curse progression
- E2E tests for character removal at thresholds
- Test trauma effects integration with existing mechanics

### Phase 7: Documentation (Week 4)
**Tasks:**
- Update CLAUDE.md with insanity/corruption system overview
- Document helper APIs with JSDoc
- Create user guide for GM insanity/corruption management
- Document Battle Trauma effects for players
- Document Primarch's Curse progression per chapter

## Architecture Decisions

### Why Battle Trauma as item type but Primarch's Curse as chapter data?
- **Battle Traumas**: Acquired individually, multiple per character, random from table → Item type makes sense
- **Primarch's Curse**: One per chapter, intrinsic to chapter membership, not "acquired" → Chapter data makes sense
- This approach eliminates need for linking/key matching between curse items and chapters
- Automatically available when character has chapter (no separate item to add)
- Simpler to maintain: edit chapter compendium entry includes curse definition

### Why store history logs?
- Transparency for players (when/why did I gain these points?)
- Audit trail for GMs (track corruption/insanity sources)
- Potential future feature: retroactive point removal (e.g., cleansing rituals)

### Why use FoundryAdapter pattern?
- Consistent with existing codebase patterns
- Testable without running Foundry
- Easier to mock for unit tests

### How to handle automatic character removal?
- At 100+ CP or IP: trigger dialog with GM confirmation
- Dialog includes character summary and point history
- Dialog offers "Archive Actor" vs "Keep for Reference" options
- System applies "Corrupted" or "Insane" status effect for visual indicator
- Actor becomes unplayable (locked sheet?) but remains in world

## Dependencies

### External Systems
- Existing modifier system (apply trauma effects)
- Existing item system (Battle Trauma, Primarch's Curse types)
- Existing psychic power system (trigger corruption/insanity)
- Existing Fellowship test system (corruption penalties)

### New Constants Required
```javascript
// insanity-constants.mjs
export const INSANITY_TRACK = {
  THRESHOLD_1: 30,
  THRESHOLD_2: 60,
  THRESHOLD_3: 90,
  REMOVAL: 100,
  TEST_INTERVAL: 10,
  MODIFIERS: {
    LEVEL_0: 0,    // 0-30 IP
    LEVEL_1: -10,  // 31-60 IP
    LEVEL_2: -20,  // 61-90 IP
    LEVEL_3: -30   // 91-99 IP
  }
};

// corruption-constants.mjs
export const CORRUPTION = {
  PURITY_THRESHOLD: 100
};
```

## Open Questions

1. **Should corruption/insanity be visible to players or GM-only?**
   - Recommendation: Players see their own points, GM can hide specific sources

2. **How to implement "Ear of the Emperor" and other missing traumas?**
   - Need to research full trauma list from rulebook
   - May need to scan full Deathwatch core book

3. **Which chapters need Primarch's Curses?**
   - All 9 founding chapters minimum
   - Successor chapters may inherit founding chapter curse

4. **Should Battle Trauma effects be toggle-able (active/inactive)?**
   - Recommendation: Always active once gained (matches lore)
   - Possible future feature: "suppress trauma" temporary effects

5. **How to integrate with Fear system (when implemented)?**
   - Current: Space Marines immune to Fear-based insanity
   - Future: May need to separate Fear insanity from warp insanity

## Migration Strategy

### Existing Worlds
- Add corruption/insanity fields to all character actors (default: 0)
- No retroactive point assignment (fresh start)
- Provide GM tool to manually assign points if desired

### Backwards Compatibility
- New fields are optional, system works without them
- Old character sheets display new sections (just empty)
- No breaking changes to existing mechanics

## Performance Considerations

- Insanity tests only trigger on point gain (not every roll)
- Primarch's Curse level computed in `prepareDerivedData()` (cached)
- Trauma effects collected via existing modifier system (no new overhead)
- History logs capped at 100 entries (prevent bloat)

## Timeline Estimate

- **Total**: 4 weeks
- **Critical path**: Data model → Core mechanics → UI → Integration
- **Can parallelize**: Compendium content creation with testing
- **Buffer**: 1 week for unexpected issues and polish

## Success Metrics

- [ ] 1752+ tests still passing (no regressions)
- [ ] 50+ new tests covering insanity/corruption mechanics
- [ ] All 5 battle traumas functional
- [ ] All 9+ primarch's curses functional
- [ ] Character removal at thresholds works correctly
- [ ] UI displays points and effects clearly
- [ ] Performance: < 50ms overhead on character sheet render
- [ ] Documentation complete in CLAUDE.md
