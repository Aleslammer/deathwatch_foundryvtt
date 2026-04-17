---
name: testing_standards
description: Testing requirements and standards for this project - prefer Test-Driven Development (TDD) when possible
type: feedback
---

**Prefer Test-Driven Development (TDD) when implementing features or fixing bugs.**

**Why:** Writing tests first clarifies requirements, catches bugs early, and ensures testability. The project has 1948+ tests with comprehensive coverage - TDD maintains this quality.

**TDD Workflow:**
1. **Write failing test first** — Define expected behavior before implementation
2. **Run test to verify failure** — Confirm test fails for the right reason
3. **Implement minimal fix** — Write just enough code to pass the test
4. **Run tests to verify success** — Confirm all tests pass
5. **Refactor if needed** — Clean up while keeping tests green

**When to use TDD:**
- ✅ Helper functions and business logic (pure functions, easy to test)
- ✅ Bug fixes (write test that reproduces bug, then fix)
- ✅ Calculations (XP, modifiers, combat math)
- ✅ Data transformations (modifier collection, skill loading)
- ⚠️ UI-heavy work (integration tests harder; manual testing acceptable)
- ⚠️ Exploratory prototypes (write tests after validating approach)

**Always run tests after code changes.** When tests fail, investigate the root cause before changing test expectations.

**How to apply:**
1. Run `npm test` after any code change
2. If test fails, debug why actual differs from expected
3. Fix implementation bug if found
4. Only change test expectation if requirements genuinely changed

**Test Coverage Goals:**
- Calculation/logic methods: 90%+ coverage
- Helper utilities: 90%+ coverage
- Document classes: 70%+ coverage
- Overall project: 60%+ coverage

**Common Test Commands:**
```bash
npm test                                    # Run all tests
npm test -- tests/combat/combat.test.mjs    # Run specific test file
npm test -- --testPathPattern="weapon-qualities"  # Run pattern match
npm run test:coverage                       # Generate coverage report
```

**Test Structure:**
- Tests in `tests/` mirror `src/module/` structure
- Mock setup in `tests/setup.mjs` (loaded automatically)
- Jest with ES modules
- FoundryAdapter pattern for mocking Foundry API
