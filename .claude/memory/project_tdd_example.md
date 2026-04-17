---
name: project_tdd_example
description: Reference example of TDD workflow from XP calculator lowest-cost implementation
type: project
---

## TDD Example: XP Calculator Lowest-Cost Logic

**Context:** Iron Hands Techmarine characters had conflicting skill cost overrides (Iron Hands chapter: 300 XP, Techmarine specialty: 400 XP). The old logic used precedence (specialty always won), but the requirement was "lowest cost wins".

**Problem identified:** 2026-04-17

**TDD Workflow Applied:**

### Step 1: Write Failing Test

Added test case to `tests/helpers/xp-calculator.test.mjs`:

```javascript
it('uses chapter cost when chapter is cheaper than specialty rank', () => {
  const mockChapter = {
    system: {
      skillCosts: { lore_forbidden_adeptus_mechanicus: { costTrain: 300 } }
    }
  };
  const mockSpecialty = {
    system: {
      rankCosts: {
        '1': {
          skills: { lore_forbidden_adeptus_mechanicus: { costTrain: 400 } }
        }
      }
    }
  };
  // ... setup actor with both chapter and specialty
  expect(XPCalculator.calculateSpentXP(mockActor)).toBe(12300); // 12000 + 300
});
```

### Step 2: Verify Test Fails

```bash
npm test -- --testPathPattern="xp-calculator" --testNamePattern="chapter is cheaper"
# ❌ FAIL: Expected 12300, Received 12400 (specialty cost incorrectly used)
```

### Step 3: Implement Fix

**Implementation changes in `xp-calculator.mjs`:**

1. Added helper method `_getLowestCost(candidates)` to filter out `-1` values and find minimum
2. Updated `_calculateSkillCosts()` to collect all cost candidates (base, chapter, specialty base, specialty rank) and pick lowest
3. Updated `_calculateTalentCosts()` with same pattern
4. Updated breakdown methods (`_getSkillsBreakdown`, `_getTalentsBreakdown`)

**Key insight:** `-1` in overrides means "not available" and must be filtered out before finding minimum.

### Step 4: Verify All Tests Pass

```bash
npm test -- --testPathPattern="xp-calculator"
# ✅ PASS: 39 tests passing

npm test
# ✅ PASS: 1948 tests passing (including 4 updated integration tests)
```

### Step 5: Update Integration Tests

Updated test expectations in:
- `tests/documents/chapter-skill-costs.test.mjs` (3 tests updated for lowest-cost behavior)
- `tests/sheets/actor-sheet-talents-traits.test.mjs` (1 test updated for alphabetical sort)

**Total time:** ~30 minutes (including analysis, test writing, implementation, and full test suite run)

**Outcome:** 
- ✅ Bug fixed (Iron Hands Techmarines now correctly pay 300 XP instead of 400 XP)
- ✅ All 1948 tests passing
- ✅ Implementation validated against comprehensive test suite
- ✅ New tests document expected behavior for future developers

---

**Why this worked:**

1. **Pure helper functions** — XP calculator has no Foundry dependencies, easy to test
2. **FoundryAdapter pattern** — All Foundry API calls mocked in `tests/setup.mjs`
3. **Fast test execution** — 1.3s for 1948 tests, enabling rapid TDD cycles
4. **Comprehensive existing tests** — 39 XP calculator tests caught edge cases

**Lessons learned:**

- Write failing test BEFORE touching implementation code
- Test expectations should match requirements, not current (buggy) behavior
- `-1` cost overrides need special handling (filtered out from lowest-cost evaluation)
- Integration tests may need updating when business logic changes (3 tests expected old precedence behavior)
