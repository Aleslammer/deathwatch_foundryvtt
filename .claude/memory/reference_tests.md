---
name: reference_tests
description: Test file organization and structure
type: reference
---

Test files are located in `tests/` directory, mirroring `src/module/` structure:

**Directory Structure:**
- `tests/combat/` - Combat system tests (ranged, melee, weapon qualities, psychic)
- `tests/character/` - Character data computation (modifiers, XP, skills, wounds)
- `tests/hotbar/` - Hotbar macro tests (preset options)
- `tests/setup.mjs` - Global mocks (loaded automatically via jest.config.mjs)

**Test Files:**
- `*.test.mjs` - ES module test files
- Use Jest with ES modules
- Import from `@jest/globals`

**Running Tests:**
```bash
npm test                                      # All tests
npm test -- tests/combat/combat.test.mjs      # Specific file
npm test -- --testPathPattern="weapon-qualities"  # Pattern match
npm run test:watch                            # Watch mode
npm run test:coverage                         # Coverage report
```

**Mock Factories (available in all tests):**
```javascript
const actor = createMockActor({ system: { wounds: { value: 10, max: 20 } } });
const weapon = createMockWeapon({ system: { dmg: '2d10+5', class: 'Melee' } });
```

**Global Mocks (setup.mjs):**
```javascript
global.game = { packs: new Map(), settings: { get: jest.fn() } };
global.ui = { notifications: { warn: jest.fn(), info: jest.fn() } };
global.ChatMessage = { getSpeaker: jest.fn(), create: jest.fn() };
```

**Test Structure Pattern:**
```javascript
import { jest } from '@jest/globals';
import { YourClass } from '../src/module/path/to/file.mjs';

describe('YourClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('describes expected behavior', () => {
      expect(YourClass.method()).toBe(expected);
    });
  });
});
```

**Coverage:**
- Current: 68% overall
- Goal: 90%+ on calculation/logic methods, 70%+ on document classes
- Reports generated at `coverage/lcov-report/index.html`
