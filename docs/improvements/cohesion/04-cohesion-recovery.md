# Phase 4 — Cohesion Recovery

## Goal
Implement the three ways Cohesion can be recovered during play.

## Recovery Triggers

### 1. Mission Objective Completed / GM Award
**Trigger:** GM clicks the `+1` button on the Cohesion panel (defined in Phase 2).

No automatic detection — objectives are narrative. The `+1` button is already wired in Phase 2's `CohesionPanel.activateListeners()` to call `CohesionHelper.recoverCohesion(1)`. Phase 4 implements that function and adds the chat message.

### 2. Fate Point Spent
**Trigger:** When any character spends a Fate Point (reduces `fatePoints.value`).

Hook into the Fate Point update. When `fatePoints.value` decreases, recover 1 Cohesion.

```javascript
// In deathwatch.mjs
Hooks.on('updateActor', (actor, change) => {
  if (actor.type !== 'character') return;
  const newFP = foundry.utils.getProperty(change, 'system.fatePoints.value');
  if (newFP === undefined) return;
  const oldFP = actor.system.fatePoints?.value;
  if (oldFP !== undefined && newFP < oldFP) {
    CohesionHelper.recoverCohesion(1);
    ChatMessage.create({
      content: `<div class="cohesion-recovery">
        <h3>🔷 Cohesion Recovered</h3>
        <p>${actor.name} spent a Fate Point. Kill-team recovers 1 Cohesion.</p>
      </div>`
    });
  }
});
```

**Edge case:** The `updateActor` hook fires with the *new* value in `change` and the *old* value still on `actor` (pre-update). This is the standard Foundry pattern — `actor.system.fatePoints.value` is the old value at hook time.

### 3. GM Award
**Trigger:** Same `+1` button as Mission Objective on the Cohesion panel. Both use cases are covered by the single button defined in Phase 2.

## CohesionHelper Additions

#### `recoverCohesion(amount)`
```javascript
static async recoverCohesion(amount) {
  const cohesion = game.settings.get('deathwatch', 'cohesion');
  const newValue = Math.min(cohesion.max, cohesion.value + amount);
  if (newValue === cohesion.value) {
    ui.notifications.info('Cohesion is already at maximum.');
    return;
  }
  await game.settings.set('deathwatch', 'cohesion', { ...cohesion, value: newValue });
}
```

#### `canRecoverCohesion()`
Pure check — is current < max?
```javascript
static canRecoverCohesion(currentValue, maxValue) {
  return currentValue < maxValue;
}
```

## Chat Messages

All recovery events post a chat message so the table knows Cohesion changed:
- Fate Point: automatic message with actor name
- GM award: message with optional reason text
- Objective: message stating objective completed

## Tests

### recoverCohesion (via canRecoverCohesion pure function)
| Current | Max | Amount | Expected New | Description |
|---------|-----|--------|-------------|-------------|
| 3 | 7 | 1 | 4 | Normal recovery |
| 7 | 7 | 1 | 7 | Already at max (capped) |
| 0 | 7 | 1 | 1 | From zero |
| 6 | 7 | 3 | 7 | Capped at max |

### canRecoverCohesion
| Current | Max | Expected |
|---------|-----|----------|
| 3 | 7 | true |
| 7 | 7 | false |
| 0 | 0 | false |

**Estimated: ~8 tests**

## Deliverables
1. `CohesionHelper.recoverCohesion()` — setting update with cap + chat message
2. `CohesionHelper.canRecoverCohesion()` — pure function
3. Fate Point `updateActor` hook
4. Chat messages for all recovery events
5. Tests

## Note
The `+1` and `−1` buttons live on the floating Cohesion panel (defined in Phase 2, `02-ui.md`). This phase implements the `recoverCohesion()` and `applyCohesionDamage()` functions they call.
