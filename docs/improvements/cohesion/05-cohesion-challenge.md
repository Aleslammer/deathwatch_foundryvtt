# Phase 5 — Cohesion Challenge

## Goal
Implement the Cohesion Challenge mechanic: roll 1d10 ≤ current Cohesion to pass.

## Rules
- Roll 1d10
- Success: roll ≤ current Cohesion
- Failure: roll > current Cohesion
- Used for: entering Squad Mode quickly, maintaining Squad Mode under stress, testing Kill-team trust
- Triggered by GM (narrative) or by specific game effects

## CohesionHelper Additions

#### `resolveCohesionChallenge(currentCohesion, roll)`
Pure function.
```javascript
static resolveCohesionChallenge(currentCohesion, roll) {
  return {
    success: roll <= currentCohesion,
    roll,
    target: currentCohesion
  };
}
```

#### `rollCohesionChallenge(actor)`
Non-pure — rolls dice and posts to chat.
```javascript
static async rollCohesionChallenge(actor) {
  const cohesion = game.settings.get('deathwatch', 'cohesion');
  const roll = await new Roll('1d10').evaluate();
  const result = CohesionHelper.resolveCohesionChallenge(cohesion.value, roll.total);

  const message = `
    <div class="cohesion-challenge">
      <h3>Cohesion Challenge — ${actor.name}</h3>
      <p>Rolled <strong>${result.roll}</strong> vs Cohesion <strong>${result.target}</strong></p>
      <p class="${result.success ? 'success' : 'failure'}">
        ${result.success ? '✓ PASSED' : '✗ FAILED'}
      </p>
    </div>
  `;

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: message
  });

  return result;
}
```

## UI Trigger

### Cohesion Panel Button
The 🎲 button is already defined on the Cohesion panel (Phase 2). It is available to **all players** (not GM-only) since any Battle-Brother can be asked to make the challenge.

Since the panel is not tied to a specific actor, clicking the button opens a dialog prompting the user to select which Battle-Brother is making the challenge:

```javascript
// In CohesionPanel._onCohesionChallenge()
async _onCohesionChallenge() {
  // If user owns exactly one character, use it directly
  const owned = game.actors.filter(a => a.type === 'character' && a.isOwner);
  if (owned.length === 1) {
    return CohesionHelper.rollCohesionChallenge(owned[0]);
  }
  // Otherwise prompt for selection
  const options = owned.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  new Dialog({
    title: 'Cohesion Challenge',
    content: `<div class="form-group"><label>Battle-Brother:</label><select id="challenge-actor">${options}</select></div>`,
    buttons: {
      roll: {
        label: 'Roll',
        callback: async (html) => {
          const actor = game.actors.get(html.find('#challenge-actor').val());
          if (actor) await CohesionHelper.rollCohesionChallenge(actor);
        }
      },
      cancel: { label: 'Cancel' }
    },
    default: 'roll'
  }).render(true);
}
```

## Tests

### resolveCohesionChallenge
| Cohesion | Roll | Expected | Description |
|----------|------|----------|-------------|
| 6 | 3 | success | Well under |
| 6 | 6 | success | Exactly equal |
| 6 | 7 | failure | Just over |
| 6 | 10 | failure | Max roll |
| 6 | 1 | success | Min roll |
| 0 | 1 | failure | Zero cohesion — always fails |
| 10 | 10 | success | Max cohesion, max roll |
| 1 | 1 | success | Minimum viable |
| 1 | 2 | failure | Just over minimum |

**Estimated: ~9 tests**

## Deliverables
1. `CohesionHelper.resolveCohesionChallenge()` — pure function
2. `CohesionHelper.rollCohesionChallenge()` — roll + chat
3. `CohesionPanel._onCohesionChallenge()` — actor selection + roll (button already in Phase 2 template)
4. Tests
