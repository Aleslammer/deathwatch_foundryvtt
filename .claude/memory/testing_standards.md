---
name: testing_standards
description: Testing requirements and standards for this project
type: feedback
---

**Always run tests after code changes.** When tests fail, investigate the root cause before changing test expectations.

**Why:** Test failures often indicate bugs in new code, not bugs in tests. The project has 1567 tests with 68% coverage - maintaining test quality is critical.

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
