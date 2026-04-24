# Coding Standards

## CSS Patterns

### Font Size Variables

Defined in `src/styles/variables.css`:

- `--dw-font-size-xs`: 11px
- `--dw-font-size-sm`: 12px
- `--dw-font-size-md`: 13px
- `--dw-font-size-lg`: 14px
- `--dw-font-size-xl`: 16px
- `--dw-font-size-xxl`: 20px

### Characteristic Boxes

Defined in `src/styles/components/characteristics.css`:

- Box dimensions: 135px width × 106px height
- Title font: `--dw-font-size-sm` (12px)
- Center value font: `--dw-font-size-xl` (16px)

---

## Error Handling

**Location**: `src/module/helpers/error-handler.mjs`, `validation.mjs`

**Pattern**: Wrap all event listeners with `ErrorHandler.wrap(handler, context)`. Validate all user inputs with `Validation.requireX()` methods before processing.

### Utilities

- `ErrorHandler.wrap(handler, context)` — Wraps async handlers, catches errors, shows notifications
- `ErrorHandler.safe(promise, fallback)` — Returns fallback if promise fails (for non-critical operations)
- `Validation.requireInt(value, fieldName)` — Parse and validate integer
- `Validation.requireActor(actorId, context)` — Validate actor exists
- `Validation.requireDocument(document, docType, context)` — Validate any document exists
- `Validation.parseBoolean(value)` — Parse boolean from string
- `Validation.parseJSON(jsonString, fieldName)` — Parse JSON with error handling

### When to Use Error Handling

- ✅ All sheet event listeners (click, change, drop handlers)
- ✅ All chat message button handlers
- ✅ All async operations that can fail (document updates, rolls, API calls)
- ✅ All user input parsing and validation
- ❌ Pure helper functions (errors caught at caller level)
- ❌ Synchronous getters/setters
- ❌ FoundryAdapter methods (they handle their own errors)

**Example pattern**: See `src/module/sheets/actor-sheet-v2.mjs` for comprehensive usage examples.

---

## HTML Sanitization (XSS Prevention)

**Location**: `src/module/helpers/sanitizer.mjs`

**Pattern**: Use `Sanitizer.escape(text)` or `Sanitizer.html` tagged template for all user-provided strings in HTML.

### Methods

- `Sanitizer.escape(text)` — Escapes HTML special characters
- `Sanitizer.html`\`template\` — Tagged template that auto-escapes all interpolated values

### When to Sanitize

- ✅ Actor names, item names, weapon names (any `name` field)
- ✅ Hit locations from user input
- ✅ Any string from `dataset` attributes
- ✅ Dialog titles and content with user data
- ❌ System-generated constants ("Impact", "Energy")
- ❌ Numeric values (damage, penetration)
- ❌ Foundry API calls (they handle their own escaping)

**Example pattern**: See `src/module/helpers/chat-message-builder.mjs` for usage examples.

**Testing**: Always test with XSS payloads like `<script>alert("XSS")</script>` and `<img src=x onerror="alert(1)">`.

---

## Logging System

**Location**: `src/module/helpers/logger.mjs`

**Pattern**: Use `Logger` for all logging instead of direct `console.*` calls. Integrates with Foundry's logging infrastructure and provides user-configurable log levels.

### Methods

- `Logger.debug(context, ...args)` — Debug messages (verbose, for developers)
- `Logger.info(context, ...args)` — Important events (system initialization, etc.)
- `Logger.warn(context, ...args)` — Warnings (recoverable errors, deprecated usage)
- `Logger.error(context, ...args)` — Errors (unrecoverable failures)
- `Logger.compatibility(message, { since, until })` — Deprecation warnings

### Log Levels

Configurable in Foundry settings:

- `CONSOLE` — Always output to browser console (for debugging, bypasses Foundry logger)
- `DEBUG` — Shows all messages (verbose)
- `INFO` — Shows info, warn, and error (default)
- `WARN` — Shows warnings and errors only
- `ERROR` — Shows errors only

### When to Use

- ✅ System initialization/shutdown events
- ✅ Error conditions (use `Logger.error()`)
- ✅ Deprecation warnings (use `Logger.compatibility()`)
- ✅ Debug information for developers (use `Logger.debug()`)
- ❌ User-facing notifications (use `ui.notifications` instead)
- ❌ Chat messages (use `ChatMessage.create()`)

### Example Usage

```javascript
import { Logger } from "../helpers/logger.mjs";

// System events
Logger.info("INIT", "System initialized");

// Debug information (only shown at DEBUG level)
Logger.debug("COMBAT", "Applying damage", { damage: 15, penetration: 4 });

// Warnings
Logger.warn("MODIFIERS", "Deprecated modifier type used");

// Errors
Logger.error("SKILLS", "Skills not loaded. Call SkillLoader.init() first.");

// Deprecation warnings
Logger.compatibility("rollItemMacro() is deprecated", {
  since: "2.1.0",
  until: "3.0.0"
});
```

**Migration note**: The old `debug()` function from `debug.mjs` is deprecated and now delegates to `Logger.debug()`. Update code to use `Logger` directly.

---

## Async/Await Consistency

### Rules

- All async functions must use `async`/`await` (no `.then()` or `.catch()` promise chains)
- Extract dialog callbacks >20 lines to named functions
- Each helper function should have single, clear responsibility
- No nested callback pyramids

**Error handling**: Async functions wrapped with `ErrorHandler.wrap()` automatically catch errors. Sheet class methods use try-catch blocks.

---

## JSDoc Documentation

**Required**: All public methods in helper classes, DataModels, sheets, and init modules must have JSDoc with `@param`, `@returns`, and brief description.

### Format

```javascript
/**
 * Brief one-line description (imperative: "Calculate", "Apply", "Get").
 *
 * Optional longer explanation of algorithm, edge cases, or behavior.
 *
 * @param {Type} paramName - Parameter description
 * @param {Type} [optionalParam] - Optional parameter
 * @returns {Type} Return value description
 */
```

### When Required

- ✅ All public static methods in helper classes
- ✅ All public instance methods in DataModel classes
- ✅ All sheet class methods (getData, activateListeners, etc.)
- ✅ All methods in initialization modules
- ❌ Private methods (prefixed with `_`)
- ❌ Trivial getters/setters with obvious behavior
- ❌ Test helper methods

**Example**: See `src/module/helpers/combat/combat.mjs` for comprehensive JSDoc examples.

---

_Code quality protocols sanctified. Praise the Omnissiah._ ⚙️
