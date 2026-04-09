# Open Questions & Design Decisions

This document lists design questions that should be resolved before implementation begins.

---

## 1. Horde Cover Mechanics

**Question**: Should hordes benefit from cover? If so, how?

**Context**: 
- Hordes use single armor value (no hit locations)
- Cover system is location-based
- Hordes already have high armor for balance

**Options**:

**A) Hordes do NOT benefit from cover** (Recommended)
- ✅ Simplest implementation
- ✅ Justified by lore (swarm can't all hide)
- ✅ Balance (hordes already tanky)
- ❌ Less realistic for small hordes

**B) Hordes get highest location bonus**
- ✅ Simple calculation
- ✅ Full cover benefit
- ❌ May make hordes too strong

**C) Hordes get average bonus**
- ✅ More balanced (partial coverage = partial bonus)
- ❌ More complex calculation
- ❌ Low bonus may feel unsatisfying

**D) World setting (GM configurable)**
- ✅ Flexibility
- ✅ Can adjust per campaign
- ❌ Another setting to explain
- ❌ More code complexity

**Decision**: _To be decided_

**Recommendation**: Start with Option A (no horde cover). Add Option D (setting) in future version if requested.

---

## 2. Psychic Powers and Cover

**Question**: Do psychic attack powers ignore physical cover?

**Context**:
- Psychic powers are warp-based energy
- Physical barriers shouldn't stop warp energy
- But some powers (Force Barrier) create physical effects

**Options**:

**A) All psychic attacks ignore cover**
- ✅ Simple rule
- ✅ Matches lore (warp bypasses physical)
- ❌ Makes psychic attacks very strong

**B) Most psychic attacks ignore cover, except Force powers**
- ✅ Nuanced (matches power types)
- ✅ Force powers create physical manifestations
- ❌ Requires tagging powers individually

**C) Psychic attacks respect cover (default)**
- ✅ Simplest (no special handling)
- ❌ Less realistic for warp powers

**Decision**: _To be decided_

**Recommendation**: Option B. Tag psychic attack powers in compendium with `ignoresCover: true`, except Force powers.

---

## 3. Flame Weapons and Cover

**Question**: Do flame weapons ignore cover?

**Context**:
- Flames flow around obstacles
- Cone-based targeting (auto-hit in area)
- Deathwatch rules suggest flames bypass some cover

**Options**:

**A) Flame weapons ignore all cover**
- ✅ Simple rule
- ✅ Matches lore (fire flows)
- ❌ Even reinforced bunkers?

**B) Flame weapons ignore light/medium cover, not reinforced**
- ✅ Realistic (thick barriers block flames)
- ✅ Keeps heavy cover valuable
- ❌ More complex check

**C) Flame weapons respect cover (default)**
- ✅ Simplest (no special handling)
- ❌ Less realistic

**Decision**: _To be decided_

**Recommendation**: Option B. Flame weapons have `ignoresCover: true` but reinforced cover has `flameResistant: true`.

---

## 4. Righteous Fury and Cover

**Question**: Does Righteous Fury bypass cover?

**Context**:
- Righteous Fury represents Emperor's divine wrath
- Could represent finding weak spot in cover
- Or could be just extra damage (still reduced by armor)

**Options**:

**A) Righteous Fury does NOT bypass cover**
- ✅ Simpler (no special handling)
- ✅ Cover remains meaningful
- ✅ Fury still powerful (extra damage)
- ❌ Less "divine wrath" feeling

**B) Righteous Fury bypasses cover (but not base armor)**
- ✅ More dramatic
- ✅ Represents finding weak spot
- ❌ Reduces tactical value of cover
- ❌ More complex damage calculation

**C) Righteous Fury bypasses cover only for Deathwatch Marines**
- ✅ Special rule for player characters
- ✅ Emphasizes elite training
- ❌ Very complex
- ❌ Balance concerns

**Decision**: _To be decided_

**Recommendation**: Option A. Keep it simple. Fury is already powerful (extra damage + crit).

---

## 5. Shooting FROM Cover

**Question**: Do characters shooting from cover suffer attack penalties?

**Context**:
- Must expose to shoot
- Realistic penalties (can't aim as well)
- But discourages cover use

**Options**:

**A) No penalties for shooting from cover**
- ✅ Encourages cover use
- ✅ Simpler rules
- ❌ Less realistic

**B) Penalty only for Full Cover**
- ✅ Balanced (low/high cover = no penalty, full = penalty)
- ✅ Represents need to lean out
- ❌ More complex

**C) Penalty for all cover types**
- ✅ Realistic
- ❌ Discourages cover use heavily
- ❌ Slows combat (everyone has penalties)

**Decision**: _To be decided_

**Recommendation**: Option A for initial implementation. Option B as future enhancement (Phase 2: Attack Roll Penalties).

---

## 6. Multiple Overlapping Regions

**Question**: How should overlapping cover regions work?

**Context**:
- Corner positions (two walls meet)
- Could stack bonuses or use highest

**Options**:

**A) Stack all bonuses** (Current design)
- ✅ Simple (Active Effects stack automatically)
- ✅ Rewards good positioning
- ✅ Realistic (corner = better protection)
- ❌ Can get excessive (3+ regions)

**B) Use highest bonus only**
- ✅ Prevents excessive stacking
- ✅ More balanced
- ❌ Complex (need custom stacking logic)
- ❌ Less intuitive

**C) Stack up to limit (e.g., max 2 regions)**
- ✅ Balanced
- ✅ Allows corners but prevents abuse
- ❌ Most complex
- ❌ Requires tracking

**Decision**: _To be decided_

**Recommendation**: Option A (stack). Trust GMs not to place excessive overlapping regions. Add note in user guide about overlap best practices.

---

## 7. Cover Type Armor Values

**Question**: Are the proposed armor bonuses balanced?

**Proposed Values**:
- Low Wall: +2 AP (legs)
- High Wall: +4 AP (legs + body)
- Full Cover: +4 AP (all but head)
- Reinforced: +8 AP (all but head)

**Considerations**:
- Power Armor: 8-10 AP on average
- Reinforced cover (+8) nearly doubles armor
- Low wall (+2) adds ~20-25% protection

**Options**:

**A) Use proposed values**
- ✅ Based on Deathwatch Core rules
- ✅ Meaningful but not overwhelming

**B) Reduce all values by half**
- Low: +1, High: +2, Full: +2, Reinforced: +4
- ✅ More subtle
- ✅ Less impact on balance
- ❌ May feel too weak

**C) Increase all values**
- Low: +4, High: +6, Full: +6, Reinforced: +12
- ✅ Makes cover very valuable
- ✅ Encourages cover use
- ❌ May make combat too slow/defensive

**D) Make values GM-configurable per region**
- ✅ Maximum flexibility
- ❌ More complex UI
- ❌ Inconsistent across scenes

**Decision**: _To be decided_

**Recommendation**: Option A. Playtest and adjust if needed. Values match Deathwatch Core Rulebook guidance.

---

## 8. Region Visual Design

**Question**: Should cover regions have standard visual styling, or leave to GM preference?

**Options**:

**A) Recommend colors but don't enforce**
- ✅ Flexible (GMs choose)
- ✅ Works with any map aesthetic
- ❌ Inconsistent (players must learn each GM's system)

**B) Auto-apply colors based on cover type**
- ✅ Consistent (light = yellow, heavy = purple, etc.)
- ✅ Instant recognition
- ❌ May clash with map art style
- ❌ Removes GM control

**C) Provide templates but allow override**
- ✅ Best of both (default + customization)
- ✅ Good UX for new GMs
- ❌ More complex implementation

**Decision**: _To be decided_

**Recommendation**: Option A for initial implementation. Document recommended colors in user guide. Option C as future enhancement (region templates).

---

## 9. Cover Icons and Status Effects

**Question**: Should tokens in cover show visual indicator?

**Options**:

**A) No visual indicator** (Current design)
- ✅ Simplest
- ✅ Clean token appearance
- ❌ Hard to see who's in cover at glance

**B) Add status effect icon (shield)**
- ✅ Clear visual feedback
- ✅ Standard Foundry pattern
- ❌ Clutters token (many effects already)

**C) Token tint/highlight**
- ✅ Subtle but visible
- ✅ No clutter
- ❌ May conflict with other tints (marked target, etc.)

**D) Token border glow**
- ✅ Very visible
- ✅ No clutter
- ❌ May conflict with selection border

**Decision**: _To be decided_

**Recommendation**: Option A for initial implementation. Let players check character sheet for cover status. Add Option B as future setting: "Show Cover Icon on Tokens".

---

## 10. Cover and Called Shots

**Question**: Can called shots bypass cover?

**Context**:
- Called Shot maneuver (Core p. 245): Target specific hit location, -20 penalty
- If you call shot to head, does low wall cover (legs only) still matter?

**Options**:

**A) Cover only applies to targeted location**
- ✅ Logical (head shot doesn't care about leg cover)
- ✅ Tactical depth (call shots to exposed locations)
- ✅ Already works (system checks location-specific armor)

**B) Cover applies regardless**
- ✅ Simpler (no special logic)
- ❌ Illogical (leg cover protects head?)

**Decision**: _To be decided_

**Recommendation**: Option A. System already works this way (cover modifies specific locations). Document this interaction in user guide as tactical option.

---

## 11. Destructible Cover

**Question**: Should cover be destructible? (Phase 4 feature)

**Context**:
- Advanced feature, not initial implementation
- Adds dynamic battlefield changes
- High complexity

**Decision for Initial Implementation**: NO

**Future Decision Points**:
- Should all cover be destructible or only some?
- How much HP for each cover type?
- Can players intentionally target cover?
- Does destroyed cover leave debris (new low cover)?
- Auto-repair between combats or manual GM action?

**Defer until**: Phase 4 (if implemented at all)

---

## 12. Attack Roll Penalties

**Question**: Should targets in cover impose attack roll penalties? (Phase 2 feature)

**Context**:
- Deathwatch Core p. 246-247 specifies penalties
- More faithful to rules
- More complex implementation

**Decision for Initial Implementation**: NO (armor bonuses only)

**Future Decision Points**:
- Penalty values per cover type (-0, -10, -20)?
- Does shooter position matter (flanking, elevation)?
- Separate system from armor bonuses or combined?

**Defer until**: Phase 2 (after core system proven)

---

## 13. Directional Cover

**Question**: Should cover be directional? (Phase 3 feature)

**Context**:
- Very complex geometry calculations
- High realism but high cost
- Most cover works from multiple angles anyway

**Decision for Initial Implementation**: NO (omnidirectional)

**Future Decision Points**:
- 4 cardinal directions or 360° angle?
- How to indicate direction in UI?
- Line of sight integration?
- Performance impact?

**Defer until**: Phase 3 (if requested by users)

---

## 14. Settings and Configuration

**Question**: Which aspects should be GM-configurable via settings?

**Potential Settings**:
- ☑️ Enable/disable entire system (master toggle)
- ☑️ Hordes benefit from cover (yes/no)
- ☑️ Show cover icon on tokens (yes/no)
- ☐ Custom cover armor values (per world)
- ☐ Psychic attacks ignore cover (yes/no/by power)
- ☐ Flame weapons ignore cover (yes/no/by type)
- ☐ Righteous Fury bypasses cover (yes/no)
- ☐ Attack roll penalties enabled (Phase 2)
- ☐ Directional cover enabled (Phase 3)
- ☐ Destructible cover enabled (Phase 4)

**Question**: Which settings are essential for initial release?

**Options**:

**A) Minimal settings** (only master toggle)
- ✅ Simplest
- ✅ Fewer decisions for GMs
- ❌ Less flexible

**B) Core settings** (master toggle + horde cover + token icon)
- ✅ Covers common questions
- ✅ Not overwhelming
- ❌ More initial work

**C) All settings** (full configurability)
- ✅ Maximum flexibility
- ❌ Analysis paralysis for GMs
- ❌ Much more work

**Decision**: _To be decided_

**Recommendation**: Option B for initial release. Add more settings in future versions as features are added.

---

## 15. Localization

**Question**: Should cover types be localized (translated)?

**Context**:
- Cover type names shown in region config
- Shown in notifications
- Shown in active effect names

**Options**:

**A) English only initially**
- ✅ Simplest
- ✅ Faster development
- ❌ Non-English users see English terms

**B) Full localization from start**
- ✅ Better UX for international users
- ✅ Professional
- ❌ More work upfront
- ❌ Need translations

**C) Localization-ready but only English translation**
- ✅ Easy to add translations later
- ✅ Not much extra work
- ✅ Community can contribute translations

**Decision**: _To be decided_

**Recommendation**: Option C. Use localization keys (`DEATHWATCH.CoverTypeLowWall`) but only provide English translation initially. Community can add others.

---

## 16. Module Namespace

**Question**: What should the behavior be named in Foundry?

**Current**: `deathwatch.cover`

**Alternatives**:
- `deathwatch.coverBonus`
- `deathwatch.tacticalCover`
- `deathwatch.armorCover`
- `dw.cover` (shorter)

**Considerations**:
- Future: `deathwatch.concealment` (separate behavior)
- Namespace prevents conflicts with other modules
- Short but descriptive

**Decision**: _To be decided_

**Recommendation**: Keep `deathwatch.cover`. Short, clear, namespaced. Plan for `deathwatch.concealment` as future behavior.

---

## 17. Documentation Priority

**Question**: Which documentation is essential for initial release?

**Required**:
- ✅ User guide (GM usage)
- ✅ CLAUDE.md section (for future development)
- ✅ Code comments (for maintainability)

**Optional**:
- ☐ Video tutorial
- ☐ Example maps with cover regions
- ☐ Quick reference card (printable)
- ☐ Advanced tactics guide

**Decision**: _To be decided_

**Recommendation**: Required docs only for initial release. Optional docs as community requests them.

---

## 18. Testing Scope

**Question**: How much testing is needed before release?

**Required**:
- ✅ Unit tests (CoverHelper, constants)
- ✅ Manual integration tests (token movement, combat)
- ✅ Edge case tests (overlapping, deletion, etc.)

**Optional**:
- ☐ Performance benchmarks
- ☐ Module compatibility tests
- ☐ Playtesting in real campaigns
- ☐ Beta release for feedback

**Decision**: _To be decided_

**Recommendation**: Required tests for initial release. Performance benchmarks only if issues suspected. Public beta if major feature, otherwise release as experimental and iterate based on feedback.

---

## Summary of Decisions Needed

### Critical (Must decide before implementation):
1. ☐ Horde cover mechanics
2. ☐ Psychic powers and cover
3. ☐ Flame weapons and cover
4. ☐ Overlapping region stacking
5. ☐ Cover armor values

### Important (Affects initial design):
6. ☐ Righteous Fury and cover
7. ☐ Shooting from cover penalties
8. ☐ Visual indicators (icons/tints)
9. ☐ Initial settings to include
10. ☐ Localization approach

### Nice to Have (Can decide later):
11. ☐ Region visual defaults
12. ☐ Called shots interaction
13. ☐ Documentation priorities
14. ☐ Testing scope

### Future Phases (Defer):
- Directional cover (Phase 3)
- Destructible cover (Phase 4)
- Attack roll penalties (Phase 2)

---

## Decision Making Process

**Recommendation**: Schedule design review session to make these decisions.

**Participants**: System developer, GM(s), player(s)

**Format**:
1. Review each critical question
2. Discuss pros/cons of each option
3. Make decision and document reasoning
4. Update this document with decisions
5. Proceed to implementation

**Timeline**: 1-2 hours should cover all critical decisions.

---

## Decision Log Template

Once decisions are made, update each question with:

```
**Decision**: [Option X]

**Reasoning**: [Why this option was chosen]

**Implementation Notes**: [Any specific details for implementation]

**Decided By**: [Name/Date]
```

Example:

```
**Decision**: Option A - Hordes do NOT benefit from cover

**Reasoning**: Simplest implementation, justified by lore (swarm nature), hordes already have high armor for balance. Can add setting in future version if users request it.

**Implementation Notes**: Add early return in CoverHelper.applyCover() if actor.type === 'horde'. Log debug message explaining why cover wasn't applied.

**Decided By**: [Your name], 2026-04-08
```
