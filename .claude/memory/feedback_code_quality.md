---
name: feedback_code_quality
description: Code quality standards and common mistakes to avoid
type: feedback
---

## Always Use Logger Instead of console.log

Never leave debug `console.log()` statements in production code. Use the Logger system instead.

**Why:** Console statements pollute production output and can't be disabled. The Logger system provides user-configurable log levels (DEBUG, INFO, WARN, ERROR) and integrates with Foundry's logging infrastructure.

**How to apply:**
```javascript
// ❌ Bad: Debug console statement
console.log("Adding insanity", { actor, points });

// ✅ Good: Use Logger
import { Logger } from '../helpers/logger.mjs';
Logger.debug('INSANITY', 'Adding insanity', { actor: actor.name, points });
```

**When cleaning up:**
- Search for `console.log`, `console.warn`, `console.error`, `console.debug`
- Convert to appropriate Logger method
- Use context strings to group related logs (e.g., 'INSANITY', 'COMBAT', 'MODIFIERS')

**Example from insanity-helper.mjs cleanup:**
- Replaced 7 `console.log()` calls with `Logger.debug()`
- Replaced 1 `console.error()` call with `Logger.error()`
- All debug output now respects user's log level setting

## Always Add Missing Imports

When using a class or function, ensure it's imported at the top of the file.

**Why:** Missing imports cause `ReferenceError` at runtime and break functionality.

**How to apply:**
1. Check imports when adding new code that references external classes
2. Run tests to catch missing imports early
3. Add imports in alphabetical order for consistency

**Recent example (actor-sheet-v2.mjs):**
- Used `ChatMessageBuilder.createItemCard()` on lines 180 and 203
- Missing: `import { ChatMessageBuilder } from "../helpers/ui/chat-message-builder.mjs";`
- Caused 3 test failures until import was added

**How to check:**
```bash
# Run tests to catch missing imports
npm test

# Search for class usage
grep -r "ChatMessageBuilder" src/module/sheets/
```

## Run Tests After Every Change

Always run `npm test` after making code changes, especially when:
- Adding new features
- Refactoring code
- Fixing bugs
- Cleaning up console statements

**Why:** Tests catch breaking changes, missing imports, and regressions immediately. The project has 1813 tests - use them!

**How to apply:**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/sheets/actor-sheet-v2.test.mjs

# Run all tests and check status
npm test && echo "✅ All tests passed"
```

If tests fail, investigate WHY before proceeding. Test failures are usually legitimate bugs.
