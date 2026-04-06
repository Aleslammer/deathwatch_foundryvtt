# Low Priority Issues (Priority 🔵)

**Status**: Planning  
**Estimated Effort**: 1-2 weeks  
**Risk Level**: Medium (optimization changes require careful testing)

These improvements are polish/optimization items that can be deferred until after critical and high-priority work is complete.

---

## Issue 13: Caching for Derived Data

### Problem
`prepareDerivedData()` recalculates everything on every actor update, even when relevant data hasn't changed.

### Current Flow
```javascript
// character.mjs - prepareDerivedData()
prepareDerivedData() {
  // ALWAYS recalculates, even if items didn't change:
  const allModifiers = ModifierCollector.collectAllModifiers(actor);
  ModifierCollector.applyCharacteristicModifiers(this.characteristics, allModifiers);
  ModifierCollector.applySkillModifiers(this.skills, allModifiers);
  // ... etc
}
```

**Trigger Points** (when prepareDerivedData runs):
- Actor.update() - any field change
- Item created/updated/deleted on actor
- Active Effect created/updated/deleted
- Sheet render (getData calls this.actor.system, which has derived data)

### Performance Impact

**Benchmark**: Character with 50 items
```javascript
console.time('prepareDerivedData');
actor.system.prepareDerivedData();
console.timeEnd('prepareDerivedData');
// Result: ~15-20ms per call

// Sheet rendering triggers this 2-3 times
// Total: 40-60ms per sheet render
```

### Solution: Selective Caching

#### Strategy 1: Cache Modifier Collection
```javascript
// character.mjs
export default class DeathwatchCharacter extends DeathwatchActorBase {
  _modifierCache = null;
  _modifierCacheDirty = true;
  
  prepareDerivedData() {
    const actor = this.parent;
    
    // Only recollect modifiers if items/effects changed
    if (this._modifierCacheDirty) {
      this._modifierCache = ModifierCollector.collectAllModifiers(actor);
      this._modifierCacheDirty = false;
    }
    
    // Always apply (characteristics/skills may have changed)
    ModifierCollector.applyCharacteristicModifiers(
      this.characteristics, 
      this._modifierCache
    );
    // ... etc
  }
  
  /**
   * Invalidate cache when items change
   */
  static _onCreateEmbeddedDocuments(documents, result, options, userId) {
    for (const doc of documents) {
      if (doc.parent) {
        doc.parent.system._modifierCacheDirty = true;
      }
    }
  }
  
  static _onUpdateEmbeddedDocuments(documents, changes, options, userId) {
    for (const doc of documents) {
      if (doc.parent) {
        doc.parent.system._modifierCacheDirty = true;
      }
    }
  }
  
  static _onDeleteEmbeddedDocuments(documents, result, options, userId) {
    for (const doc of documents) {
      if (doc.parent) {
        doc.parent.system._modifierCacheDirty = true;
      }
    }
  }
}
```

#### Strategy 2: Compute Diffs
```javascript
// Only recompute if relevant fields changed
prepareDerivedData() {
  const actor = this.parent;
  const updates = this._lastUpdate || {};
  
  // If only wounds.value changed, skip modifier collection
  const onlyWoundsChanged = Object.keys(updates).length === 1 && 
                            updates['system.wounds.value'] !== undefined;
  
  if (onlyWoundsChanged) {
    // Skip expensive recalculations
    return;
  }
  
  // Full recalculation
  const allModifiers = ModifierCollector.collectAllModifiers(actor);
  // ... etc
}
```

#### Strategy 3: Lazy Evaluation (Advanced)
```javascript
// Only compute when accessed
class DeathwatchCharacter extends DeathwatchActorBase {
  get totalModifiers() {
    if (!this._modifierCache || this._modifierCacheDirty) {
      this._modifierCache = ModifierCollector.collectAllModifiers(this.parent);
      this._modifierCacheDirty = false;
    }
    return this._modifierCache;
  }
  
  prepareDerivedData() {
    // Use getter instead of direct collection
    const allModifiers = this.totalModifiers;
    ModifierCollector.applyCharacteristicModifiers(this.characteristics, allModifiers);
  }
}
```

### Benefits
- 30-50% faster sheet rendering
- Reduced CPU usage during combat (many updates)
- Better user experience (less lag)

### Risks
- Cache invalidation bugs (stale data)
- Increased code complexity
- Harder to debug (data not always recalculated)

### Implementation Plan
1. **Add performance benchmarks** (2 hours)
   - Measure current prepareDerivedData time
   - Measure with various actor sizes (10, 50, 100 items)
   - Document baseline

2. **Implement Strategy 1 (caching)** (4 hours)
   - Add cache fields to character.mjs
   - Hook into embedded document lifecycle
   - Test cache invalidation

3. **Performance testing** (2 hours)
   - Verify 30-50% improvement
   - Test with concurrent updates
   - Test cache invalidation works

4. **Add cache debugging** (1 hour)
   - Add debug mode to show cache hits/misses
   - Log cache size and invalidation events

5. **Documentation** (1 hour)
   - Document caching strategy in CLAUDE.md
   - Add troubleshooting guide for cache issues

**Total**: ~10 hours

**When to Implement**: After all critical/high-priority work is done. Only if sheet performance is actually a problem.

---

## Issue 14: Constants Organization

### Problem
`constants.mjs` (210 lines) mixes different domains into one file.

### Current Structure
```javascript
// constants.mjs (210 lines)

// Range modifiers (combat)
export const RANGE_MODIFIERS = { ... };

// Rate of fire (combat)
export const RATE_OF_FIRE_MODIFIERS = { ... };

// Hit locations (combat)
export const HIT_LOCATIONS = { ... };

// Aim modifiers (combat)
export const AIM_MODIFIERS = { ... };

// Movement action types (character)
export const MOVEMENT_TYPES = { ... };

// Characteristic constants (character)
export const CHARACTERISTIC_CONSTANTS = { ... };

// Psy rating modifiers (psychic)
export const PSY_RATING_MODIFIERS = { ... };

// Phenomena tables (psychic)
export const PSYCHIC_PHENOMENA_TABLE = { ... };

// Combat penalties (UI)
export const COMBAT_PENALTIES = { ... };
```

### Solution: Split by Domain

```
constants/
├── combat-constants.mjs
│   ├── RANGE_MODIFIERS
│   ├── RATE_OF_FIRE_MODIFIERS
│   ├── HIT_LOCATIONS
│   ├── AIM_MODIFIERS
│   └── COMBAT_PENALTIES
├── characteristic-constants.mjs
│   ├── CHARACTERISTIC_CONSTANTS
│   └── MOVEMENT_TYPES
├── psychic-constants.mjs
│   ├── PSY_RATING_MODIFIERS
│   ├── PSYCHIC_PHENOMENA_TABLE
│   └── PERILS_OF_THE_WARP_TABLE
└── index.mjs (re-exports all)
```

#### index.mjs (Convenience)
```javascript
// constants/index.mjs
export * from './combat-constants.mjs';
export * from './characteristic-constants.mjs';
export * from './psychic-constants.mjs';

// Backward compatibility - consumers can still:
// import { RANGE_MODIFIERS } from '../constants/index.mjs';
```

### Benefits
- Easier to find relevant constants
- Smaller files, easier to read
- Clear domain boundaries
- Can import only what's needed

### Drawbacks
- More files to manage
- Need to update all imports (or use index.mjs)

### Implementation Plan
1. Create constants/ directory
2. Split constants.mjs into domain files
3. Create index.mjs for re-exports
4. Update imports (or use index.mjs for backward compat)
5. Delete old constants.mjs
6. Update CLAUDE.md

**Effort**: ~4 hours

**When to Implement**: Low priority, cosmetic change. Do if touching constants for other reasons.

---

## Issue 15: Debug Console Logs

### Problem
Direct use of `console.log/error` instead of Foundry's logging infrastructure.

### Current Usage
```javascript
// helpers/debug.mjs:9
export function debug(context, ...args) {
  if (isDebugEnabled(context)) {
    console.log(`[Deathwatch:${context}]`, ...args);
  }
}

// skill-loader.mjs:23
console.error('[Deathwatch] Skills not loaded. Call SkillLoader.init() first.');
```

### Problem
- No integration with Foundry's log levels
- Can't control verbosity from Foundry settings
- No structured logging

### Solution: Foundry Logger

```javascript
// helpers/logger.mjs
export class Logger {
  static _logger = null;
  
  /**
   * Initialize Foundry logger
   */
  static init() {
    this._logger = new foundry.utils.logging.Logger({
      name: 'Deathwatch',
      level: game.settings.get('deathwatch', 'logLevel') || 'INFO'
    });
  }
  
  /**
   * Log debug message (verbose, for developers)
   * @param {string} context - Component name (COMBAT, MODIFIERS, etc.)
   * @param  {...any} args 
   */
  static debug(context, ...args) {
    this._logger?.debug(`[${context}]`, ...args);
  }
  
  /**
   * Log info message (important events)
   */
  static info(context, ...args) {
    this._logger?.info(`[${context}]`, ...args);
  }
  
  /**
   * Log warning (recoverable errors, deprecated usage)
   */
  static warn(context, ...args) {
    this._logger?.warn(`[${context}]`, ...args);
  }
  
  /**
   * Log error (unrecoverable errors)
   */
  static error(context, ...args) {
    this._logger?.error(`[${context}]`, ...args);
  }
  
  /**
   * Compatibility warning (for deprecated APIs)
   */
  static compatibility(message, { since, until }) {
    foundry.utils.logCompatibilityWarning(message, {
      since,
      until,
      details: 'See docs/improvements/ for migration guide'
    });
  }
}
```

Usage:
```javascript
// Instead of: debug('COMBAT', 'Applying damage', damage);
Logger.debug('COMBAT', 'Applying damage', damage);

// Instead of: console.error('[Deathwatch] Skills not loaded');
Logger.error('SKILLS', 'Skills not loaded. Call SkillLoader.init() first.');

// For deprecations:
Logger.compatibility('rollItemMacro() is deprecated', { 
  since: '2.0.0', 
  until: '3.0.0' 
});
```

### Add Log Level Setting
```javascript
// init/settings.mjs
game.settings.register('deathwatch', 'logLevel', {
  name: 'Log Level',
  hint: 'Control console verbosity: DEBUG (verbose), INFO (normal), WARN (errors only)',
  scope: 'client',
  config: true,
  type: String,
  choices: {
    'DEBUG': 'Debug (Verbose)',
    'INFO': 'Info (Normal)',
    'WARN': 'Warnings Only',
    'ERROR': 'Errors Only'
  },
  default: 'INFO',
  onChange: () => Logger.init()
});
```

### Implementation Plan
1. Create logger.mjs with Foundry integration
2. Add logLevel setting
3. Replace debug.mjs usage
4. Replace console.log/error calls
5. Test log levels work correctly

**Effort**: ~3 hours

**When to Implement**: Nice-to-have, do alongside other improvements.

---

## Issue 16: Static-Only Helper Classes

### Problem
All helper classes use static methods only, with no instance state.

### Current Pattern
```javascript
export class CombatHelper {
  static calculateRangeModifier(distance, weaponRange) { ... }
  static determineHitLocation(attackRoll) { ... }
  static applyDamage(actor, options) { ... }
  // ... 30+ static methods
}
```

### Considerations

#### Pros of Static Methods
- ✅ Simple to use: `CombatHelper.applyDamage(...)`
- ✅ No instantiation needed
- ✅ Clear that methods are pure functions (no hidden state)
- ✅ Easy to test (no mocking constructors)

#### Cons of Static Methods
- ❌ Can't hold context (e.g., current combat, active weapon)
- ❌ Hard to extend/override (no polymorphism)
- ❌ Can't inject dependencies (tight coupling)
- ❌ No lifecycle management

### When Instances Make Sense

#### Example: Combat Context
```javascript
// Instead of passing actor/weapon to every method:
CombatHelper.calculateRangeModifier(distance, weapon.system.range);
CombatHelper.determineHitLocation(roll);
CombatHelper.applyDamage(actor, weapon, options);

// Could have:
const combat = new CombatContext(actor, weapon);
combat.calculateRangeModifier(distance);
combat.determineHitLocation(roll);
combat.applyDamage(options);
```

#### Example: Attack Builder
```javascript
// Fluent API for attack configuration
const attack = new RangedAttack(actor, weapon)
  .withTarget(targetActor)
  .withAim(AIM_MODIFIERS.FULL)
  .withRateOfFire('full')
  .atRange(distance);

const result = await attack.resolve();
```

### Recommendation

**Keep static methods for now** because:
1. Current pattern works well
2. No compelling use case for instances yet
3. Refactoring would be significant effort
4. Can introduce instances gradually if needed

**Future consideration**: If helper classes grow >50 methods, consider splitting into specialized contexts.

### Implementation Plan

**None** - document the pattern, but don't change it.

**Effort**: 0 hours (documentation only)

---

## Summary

| Issue | Effort | Risk | Priority |
|-------|--------|------|----------|
| Caching for Derived Data | 10 hours | Medium | Nice to Have |
| Constants Organization | 4 hours | Low | Nice to Have |
| Debug Console Logs | 3 hours | Low | Nice to Have |
| Static Helper Classes | 0 hours | N/A | Document Only |

**Total**: ~17 hours (~1 week)

**Recommendation**: Only implement if time permits after all critical/high/medium work is done. These are polish items that improve developer experience but don't affect functionality or user experience significantly.

**Priority Order**:
1. Issue #15 (Logger) - Useful for debugging, low effort
2. Issue #14 (Constants) - Do if refactoring constants anyway
3. Issue #13 (Caching) - Only if performance is actually a problem
4. Issue #16 (Static Classes) - Document only, no changes needed
