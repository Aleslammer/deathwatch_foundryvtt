# Testing Approach

Tests use **Jest** with ES modules. Foundry VTT globals are mocked in `tests/setup.mjs`.

**Expected test results:** 110 test suites, 1822 passing tests (as of 2026-04-14)

---

## Test Structure

- `tests/` mirrors `src/module/` structure
- Each helper module has a corresponding `.test.mjs` file
- DataModel classes are tested directly (no Foundry instance needed)

**Key test files:**

- `tests/combat/combat.test.mjs` — Core combat mechanics
- `tests/combat/ranged-combat.test.mjs` — Ranged attacks, rate of fire, jamming
- `tests/combat/weapon-qualities.test.mjs` — All 24+ weapon qualities
- `tests/character/modifier-collector.test.mjs` — Modifier collection
- `tests/character/xp-calculator.test.mjs` — XP and rank computation
- `tests/helpers/error-handler.test.mjs` — Error handling utilities
- `tests/helpers/validation.test.mjs` — Input validation utilities

**FoundryAdapter pattern**: All Foundry API calls (e.g., `game.settings.get`, `ChatMessage.create`) are routed through `foundry-adapter.mjs`, which is mocked in tests. This allows 100% unit testing without a running Foundry instance.

---

## Test-Driven Development (TDD)

**Preferred workflow** when implementing new features or fixing bugs:

1. **Write failing test first** — Define expected behavior in test form before touching implementation
2. **Run tests to verify failure** — Confirm test fails for the right reason
3. **Implement minimal fix** — Write just enough code to make the test pass
4. **Run tests to verify success** — All tests pass (including the new one)
5. **Refactor if needed** — Clean up implementation while keeping tests green

### When to Use TDD

- ✅ New feature development (especially in helpers, calculators, modifiers)
- ✅ Bug fixes (write test that reproduces bug, then fix)
- ✅ Refactoring existing logic (tests ensure behavior unchanged)
- ✅ API contract changes (update tests first to define new contract)
- ⚠️ UI-heavy work (integration tests harder; manual testing acceptable)
- ⚠️ Exploratory prototypes (write tests after validating approach)

### Example TDD Workflow

From XP calculator lowest-cost fix:

```bash
# 1. Write failing test
# Add test case: "uses chapter cost when chapter is cheaper than specialty rank"
npm test -- --testPathPattern="xp-calculator" --testNamePattern="chapter is cheaper"
# ❌ FAIL: Expected 12300, Received 12400

# 2. Implement fix in xp-calculator.mjs
# Add _getLowestCost() helper and update cost calculation logic

# 3. Verify all tests pass
npm test -- --testPathPattern="xp-calculator"
# ✅ PASS: 39 tests passing

# 4. Run full test suite
npm test
# ✅ PASS: 1948 tests passing
```

---

## Benefits in This Project

- Helpers are pure functions → easy to test in isolation
- FoundryAdapter pattern → no Foundry instance needed
- Fast test execution (~1.3s for 1948 tests) → rapid feedback
- Jest watch mode → auto-rerun on file changes

---

## Test Organization

- **Helper tests** → `tests/helpers/` (e.g., `xp-calculator.test.mjs`)
- **Combat tests** → `tests/combat/` (e.g., `weapon-qualities.test.mjs`)
- **Integration tests** → `tests/documents/` (e.g., `chapter-skill-costs.test.mjs`)
- **Sheet tests** → `tests/sheets/` (e.g., `actor-sheet-talents-traits.test.mjs`)

---

## Common Test Commands

```bash
npm test                                    # Run all tests
npm test -- tests/combat/combat.test.mjs    # Run specific test file
npm test -- --testPathPattern="weapon-qualities"  # Run pattern match
npm run test:coverage                       # Generate coverage report
npm run test:watch                          # Watch mode
```

---

## Test Coverage Goals

- **Calculation/logic methods**: 90%+ coverage
- **Helper utilities**: 90%+ coverage
- **Document classes**: 70%+ coverage
- **Overall project**: 60%+ coverage

---

## Mock Setup

**Location**: `tests/setup.mjs` (automatically loaded by Jest)

Provides mocks for:
- Foundry globals (`game`, `CONFIG`, `ui`, etc.)
- FoundryAdapter methods
- Roll class
- Document classes (Actor, Item)

**When adding new Foundry API calls:**
1. Add method to FoundryAdapter
2. Mock the method in `tests/setup.mjs`
3. Write tests using the mocked method

---

## Writing Tests

### Basic Test Structure

```javascript
import { CombatHelper } from '../../src/module/helpers/combat/combat.mjs';

describe('Combat Helper', () => {
  describe('calculateDamage', () => {
    it('applies damage correctly with armor', () => {
      const damage = 15;
      const armor = 5;
      const toughness = 4;
      const penetration = 0;
      
      const result = CombatHelper.calculateDamage(damage, armor, toughness, penetration);
      
      expect(result.woundsDealt).toBe(6); // 15 - 5 - 4 = 6
    });
  });
});
```

### Testing with Mocks

```javascript
import { FoundryAdapter } from '../../src/module/helpers/foundry-adapter.mjs';
import { CohesionHelper } from '../../src/module/helpers/cohesion.mjs';

describe('Cohesion Helper', () => {
  beforeEach(() => {
    FoundryAdapter.getSetting.mockReturnValue({ value: 7, max: 10 });
  });

  it('gets current cohesion from settings', () => {
    const cohesion = CohesionHelper.getCurrentCohesion();
    
    expect(cohesion.value).toBe(7);
    expect(FoundryAdapter.getSetting).toHaveBeenCalledWith('deathwatch', 'cohesion');
  });
});
```

---

## Debugging Tests

```bash
# Run single test file with verbose output
npm test -- tests/combat/combat.test.mjs --verbose

# Run test with specific name pattern
npm test -- --testNamePattern="applies Tearing"

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report and open in browser
npm run test:coverage
# Open coverage/lcov-report/index.html
```

---

_Testing protocols sanctified. May all tests pass green._ ⚙️
