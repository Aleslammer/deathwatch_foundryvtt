# FoundryAdapter Pattern

**Location**: `src/module/helpers/foundry-adapter.mjs`

All Foundry VTT API calls should be routed through `FoundryAdapter` to enable:

1. **Testability** - Mock entire Foundry API in one place (see `tests/setup.mjs`)
2. **Version Migration** - Update Foundry API calls in one place when upgrading
3. **Error Handling** - Centralized error handling and logging
4. **Type Safety** - Consistent JSDoc documentation

---

## Adapter Coverage (26 methods)

### Rolls
- `evaluateRoll()`
- `sendRollToChat()`

### Chat
- `createChatMessage()`
- `getChatSpeaker()`

### Notifications
- `showNotification()`

### Documents
- `updateDocument()`
- `createEmbeddedDocuments()`
- `deleteEmbeddedDocuments()`
- `deleteDocument()`

### Settings ⭐
- `getSetting()`
- `setSetting()`
- `registerSetting()`

### Dialogs ⭐
- `showDialog()`
- `showConfirmDialog()`
- `showPromptDialog()`

### Actors/Items
- `getActor()`
- `getItem()`
- `createActor()`
- `createItem()`

### User
- `isGM()`
- `getUser()`

### Socket
- `onSocketMessage()`
- `emitSocketMessage()`

---

## Migration Status

### ✅ Fully Migrated Files

- `helpers/cohesion.mjs` - All 9 API calls migrated

### ⏳ Partially Migrated

- 73+ settings calls across 20+ files
- 21+ dialog calls across multiple files
- Pattern established, migration ongoing
- Priority: Settings API (most common), Dialog API (UI-heavy)

---

## Pattern Example

```javascript
// ❌ Before: Direct Foundry API call
const cohesion = game.settings.get("deathwatch", "cohesion");
await game.settings.set("deathwatch", "cohesion", newValue);
const actor = game.actors.get(actorId);

// ✅ After: Use FoundryAdapter
import { FoundryAdapter } from "./helpers/foundry-adapter.mjs";

const cohesion = FoundryAdapter.getSetting("deathwatch", "cohesion");
await FoundryAdapter.setSetting("deathwatch", "cohesion", newValue);
const actor = FoundryAdapter.getActor(actorId);
```

---

## When Migrating

1. Import `FoundryAdapter` at the top of the file
2. Replace direct API calls with adapter methods
3. Run tests to verify functionality
4. Document JSDoc comments clearly marking "Non-pure — uses Foundry API via FoundryAdapter"

---

## Testing with FoundryAdapter

**Mock setup** (`tests/setup.mjs`):

```javascript
// Mock the entire adapter
jest.mock('../src/module/helpers/foundry-adapter.mjs', () => ({
  FoundryAdapter: {
    getSetting: jest.fn(),
    setSetting: jest.fn(),
    getActor: jest.fn(),
    // ... all other methods
  }
}));
```

**Test example**:

```javascript
import { FoundryAdapter } from '../src/module/helpers/foundry-adapter.mjs';

describe('Cohesion System', () => {
  beforeEach(() => {
    FoundryAdapter.getSetting.mockReturnValue({ value: 7, max: 10 });
  });

  it('calculates cohesion correctly', () => {
    const cohesion = CohesionHelper.getCurrentCohesion();
    expect(cohesion.value).toBe(7);
    expect(FoundryAdapter.getSetting).toHaveBeenCalledWith('deathwatch', 'cohesion');
  });
});
```

---

## Note

This is a **gradual migration**. New code should use the adapter. Existing code can be migrated opportunistically when touched for other reasons.

**Do not do a mass find-replace migration** - migrate file-by-file with test verification.

---

_The adapter protocols sanctify our testing rituals._ ⚙️
