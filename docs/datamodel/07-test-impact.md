# Test Impact: Mock Changes and Validation Strategy

## Current Test Setup

Tests mock Foundry globals in `tests/setup.mjs` and create plain objects for `system` data:

```javascript
// Current pattern in tests
const mockWeapon = {
  type: 'weapon',
  system: {
    dmg: '1d10+5',
    penetration: 4,
    loadedAmmo: 'ammo123',
    attachedQualities: ['accurate', 'tearing'],
    attachedUpgrades: []
  }
};
```

## Impact Assessment

### What Stays the Same
- **All helper class tests** — `ModifierCollector`, `CombatHelper`, `CombatDialogHelper`, `WeaponQualityHelper`, `XPCalculator`, etc. These receive plain data objects and don't interact with DataModels.
- **All combat tests** — Work with `weapon.system.*` paths which don't change.
- **All modifier tests** — Work with modifier arrays which don't change.
- **Sheet tests** — Mock actors/items with plain objects; DataModel is transparent.

### What May Need Updates

#### 1. tests/setup.mjs — TypeDataModel Mock

DataModel classes reference `foundry.abstract.TypeDataModel` and `foundry.data.fields`. These need to be mocked:

```javascript
// Add to tests/setup.mjs

// Mock foundry.abstract.TypeDataModel
global.foundry = global.foundry || {};
global.foundry.abstract = global.foundry.abstract || {};
global.foundry.abstract.TypeDataModel = class TypeDataModel {
  static defineSchema() { return {}; }
  static migrateData(data) { return data; }
  prepareDerivedData() {}
};

// Mock foundry.data.fields
global.foundry.data = global.foundry.data || {};
global.foundry.data.fields = {
  StringField: class StringField { constructor(opts) { this.options = opts; } },
  NumberField: class NumberField { constructor(opts) { this.options = opts; } },
  BooleanField: class BooleanField { constructor(opts) { this.options = opts; } },
  ArrayField: class ArrayField { constructor(element, opts) { this.options = opts; } },
  ObjectField: class ObjectField { constructor(opts) { this.options = opts; } },
  SchemaField: class SchemaField { constructor(fields, opts) { this.fields = fields; } },
  HTMLField: class HTMLField { constructor(opts) { this.options = opts; } },
  FilePathField: class FilePathField { constructor(opts) { this.options = opts; } }
};
```

**Note:** These mocks only need to exist so that `import` statements don't fail. The actual field validation doesn't run in tests — tests create plain objects, not DataModel instances.

#### 2. Tests That Import Model Classes Directly

If you write tests that import and instantiate DataModel classes (e.g., to test `defineSchema()` or `prepareDerivedData()`), those tests need the field mocks above. But most existing tests won't import models directly.

#### 3. item.mjs Tests (Phase 3a + 3d)

When talent and weapon `prepareDerivedData()` logic moves from `item.mjs` to the DataModels, tests that call those methods need updating:

**Talent tests (Phase 3a):**
```javascript
// Before: talent logic in item.mjs prepareData()
const item = { type: 'talent', system: { cost: 500, compendiumId: '' }, _id: 'tal00000000001', actor: mockActor };
// Logic ran as part of item.prepareData()

// After: talent logic in DeathwatchTalent.prepareDerivedData()
// Tests that mock item.system as a plain object still work —
// the model IS item.system, so item.system.effectiveCost is set by the model.
```

**Weapon tests (Phase 3d):**
```javascript
// Before:
const item = { type: 'weapon', system: { ... }, actor: mockActor };
DeathwatchItem.prototype._applyAmmunitionModifiers.call(item);

// After: methods live on the model
// Option A: Test through item.prepareData() (delegates to model)
// Option B: Test model.prepareDerivedData() directly
```

**Recommendation:** Keep existing tests working through `item.mjs` where possible. The Document class delegates to the model, so most tests don't need to know about the model layer. Add new model-specific tests for the `prepareDerivedData()` logic.

#### 4. actor.mjs Tests (Phase 4)

When `_prepareCharacterData()` moves to `DeathwatchCharacter.prepareDerivedData()`, tests that mock actor data preparation need updating:

```javascript
// Before: logic in actor.mjs _prepareCharacterData()
const actor = { type: 'character', system: { ... }, items: mockItems };
DeathwatchActor.prototype._prepareCharacterData.call(actor, actor);

// After: logic in DeathwatchCharacter.prepareDerivedData()
// Tests that trigger actor.prepareData() still work — super.prepareData()
// calls the model's prepareDerivedData() automatically.
```

**Key change:** Tests that directly called `_prepareCharacterData()` need to either:
- Call `actor.system.prepareDerivedData()` instead (if testing the model directly)
- Call `actor.prepareData()` and verify the results (integration-style)

## New Tests to Add

### Per Phase

#### Phase 1 (gear)
```javascript
// tests/documents/gear-model.test.mjs
describe('DeathwatchGear DataModel', () => {
  it('defines expected schema fields', () => {
    const schema = DeathwatchGear.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.book).toBeDefined();
    expect(schema.page).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.equipped).toBeDefined();
    expect(schema.req).toBeDefined();
    expect(schema.renown).toBeDefined();
    expect(schema.shortDescription).toBeDefined();
    expect(schema.wt).toBeDefined();
  });
});
```

#### Phase 2 (simple types)
- One schema test per type (verify all expected fields exist)
- ~8 small test files or one combined file

#### Phase 3a (talent)
- Schema tests for talent
- `prepareDerivedData()` tests: compendiumId auto-population, effectiveCost with/without chapter

#### Phase 3b-c (medium + complex types)
- Schema tests for each type

#### Phase 3d (weapon)
- Schema tests for weapon
- `prepareDerivedData()` tests: upgrade modifiers, ammunition modifiers
- `applyForceWeaponModifiers()` tests: force weapon with/without psy rating

#### Phase 4 (actors)
- Schema tests for character and NPC
- Verify characteristic helper creates correct structure
- `prepareDerivedData()` tests: skill loading, XP, modifiers, movement, force weapon orchestration

### Test File Location
```
tests/
├── data/                          # NEW: DataModel tests
│   ├── base-document.test.mjs
│   ├── item-models.test.mjs       # Schema tests for all item types
│   └── actor-models.test.mjs      # Schema tests for actor types
```

## Validation Strategy

### Per-Phase Checklist

After each phase, run:

1. **`npm test`** — All 829+ tests must pass
2. **`npm run test:coverage`** — Coverage must not decrease
3. **Manual verification in Foundry:**
   - Open each affected compendium pack
   - Create a new item of each migrated type
   - Edit and save an existing item
   - Verify modifiers apply correctly
   - Check actor sheet renders with migrated item types

### Regression Indicators

Watch for these signs of problems:
- `TypeError: Cannot read properties of undefined` — Field path changed
- `null` values where numbers expected — Field type mismatch
- Missing fields on item sheets — Schema doesn't include a field
- Compendium items showing wrong data — Migration issue

### Rollback Plan

If a phase causes issues:
1. Remove the type from `CONFIG.*.dataModels`
2. That type falls back to template.json immediately
3. No data loss — existing data is unchanged
4. Fix the model and re-register

## Coverage Impact

DataModel files are mostly declarative (`defineSchema()` returns field definitions). They'll show low branch coverage because there's no branching logic. This is expected and acceptable.

**Target coverage for model files:** 80%+ line coverage (schema definition + any `prepareDerivedData()` logic)

**Overall project coverage:** Should not decrease from current 79%+
