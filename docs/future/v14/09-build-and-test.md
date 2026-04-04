# Phase 8: Build Pipeline and Test Infrastructure

## Goal
Update the build pipeline, test mocks, and CI to support v14.

## 1. Test Mock Updates (`tests/setup.mjs`)

### Current Mocks
The test setup mocks Foundry globals:
- `foundry.abstract.TypeDataModel`
- `foundry.data.fields.*` (7 field types)
- `foundry.utils.mergeObject`, `deepClone`, `randomID`
- `game`, `ui`, `ChatMessage`, `Item`, `Actor`, `Roll`
- `Application` (for CohesionPanel import chain)
- `game.settings` (get/set)
- `game.socket`
- `createMockActor()`, `createMockWeapon()` factories

### New Mocks Needed for V2

#### ApplicationV2
```javascript
global.foundry.applications = {
  api: {
    ApplicationV2: class ApplicationV2 {
      static DEFAULT_OPTIONS = {};
      static PARTS = {};
      constructor() {}
      render() {}
      close() {}
      setPosition() {}
      get rendered() { return false; }
    },
    HandlebarsApplicationMixin: (Base) => class extends Base {
      async _prepareContext() { return {}; }
      _onRender() {}
    },
    DialogV2: {
      wait: jest.fn().mockResolvedValue(null),
      prompt: jest.fn().mockResolvedValue(null),
      confirm: jest.fn().mockResolvedValue(true)
    }
  },
  sheets: {
    ActorSheetV2: class ActorSheetV2 {
      static DEFAULT_OPTIONS = {};
      static PARTS = {};
      static mixin(...mixins) {
        let base = this;
        for (const mixin of mixins) base = mixin(base);
        return base;
      }
    },
    ItemSheetV2: class ItemSheetV2 {
      static DEFAULT_OPTIONS = {};
      static PARTS = {};
      static mixin(...mixins) {
        let base = this;
        for (const mixin of mixins) base = mixin(base);
        return base;
      }
    }
  },
  ux: {
    TextEditor: {
      implementation: {
        getDragEventData: jest.fn()
      }
    }
  }
};
```

#### DialogV2
```javascript
global.DialogV2 = {
  wait: jest.fn().mockResolvedValue(null),
  prompt: jest.fn().mockResolvedValue(null),
  confirm: jest.fn().mockResolvedValue(true)
};
```

### Mocks to Remove (After Full Migration)
- `Application` class mock (replaced by `ApplicationV2`)
- `Dialog` class mock (replaced by `DialogV2`)
- `ActorSheet` mock (replaced by `ActorSheetV2`)
- `ItemSheet` mock (replaced by `ItemSheetV2`)

### Transition Period
During migration, keep both V1 and V2 mocks so tests for both versions pass.

## 2. Build Pipeline

### compilePacks.mjs
- v14 may use a different LevelDB format version
- `classic-level` dependency may need a version bump
- Test: `npm run build:packs` on v14 installation

### validatePacks.mjs
- Validation logic is pure JavaScript — should work unchanged
- Test: `npm run build:validate`

### compactJson.mjs
- Pure JSON manipulation — no Foundry dependency
- No changes expected

### copyLocal.mjs
- May need path update if v14 changes the systems directory structure
- Typically `{FoundryData}/Data/systems/deathwatch/` — verify unchanged

## 3. Package Dependencies

### Current
```json
{
  "devDependencies": {
    "@jest/globals": "^29.7.0",
    "classic-level": "^1.4.1",
    "jest": "^29.7.0",
    "prettier": "^3.8.1"
  }
}
```

### Potential Updates
- `classic-level` — check if v14 requires a newer version for LevelDB compatibility
- `jest` — no change needed (independent of Foundry)
- `prettier` — no change needed

## 4. Jest Configuration

### Current (`jest.config.mjs`)
```javascript
export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['./tests/setup.mjs'],
  testMatch: ['**/tests/**/*.test.mjs'],
  collectCoverageFrom: ['src/module/**/*.mjs']
};
```

No changes expected — Jest configuration is independent of Foundry version.

## 5. CI/CD

If using GitHub Actions:
- Update any Foundry version references in CI config
- Ensure `npm test` passes in CI
- Ensure `npm run build:packs` passes in CI

## Migration Steps

1. Update `tests/setup.mjs` with V2 mocks (keep V1 mocks during transition)
2. Run `npm test` — fix any failures from mock changes
3. Test `npm run build:packs` against v14 Foundry installation
4. Verify `npm run build:copy` deploys correctly to v14
5. Update `classic-level` if needed
6. Remove V1 mocks after full migration complete

## Validation
- [ ] `npm test` — all 1458+ tests pass
- [ ] `npm run test:coverage` — coverage maintained
- [ ] `npm run build:packs` — compiles without errors
- [ ] `npm run build:copy` — deploys to v14 installation
- [ ] `npm run format:json` — JSON formatting works
- [ ] No test mock warnings or errors
