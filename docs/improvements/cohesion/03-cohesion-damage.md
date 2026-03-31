# Phase 3 — Cohesion Damage

## Goal
Automatically detect when combat damage should trigger Cohesion loss and provide the squad leader with a rally test to negate it.

## Cohesion Damage Rules

### Trigger Conditions (ALL must be true)
1. Target Battle-Brother is in **Squad Mode** (future — for now, always eligible)
2. Raw damage (before armor/TB) is **≥ 10**
3. Weapon has one of: **Accurate**, **Blast**, or **Devastating** quality
4. Cohesion damage has **not already occurred this round**
5. Current Cohesion is **> 0**

### Rally Test
Squad leader may attempt a **Challenging (+0) Command or Fellowship Test** (Free Action) to negate the damage:
- Roll d100 ≤ leader's Command skill total OR Fellowship value
- Success: Cohesion damage negated
- Failure: Kill-team loses 1 Cohesion

### Fear-Based Cohesion Damage
Creatures with the **Fear** trait can cause Cohesion damage. Negated if squad leader passes a **Willpower Test**. Same 1-per-round cap applies.

## Implementation

### CohesionHelper Additions

#### `shouldTriggerCohesionDamage(rawDamage, weaponQualities)`
Pure function — checks if damage + qualities meet the threshold.
```javascript
static shouldTriggerCohesionDamage(rawDamage, weaponQualities = []) {
  if (rawDamage < COHESION.DAMAGE_THRESHOLD) return false;
  const qualityIds = weaponQualities.map(q => typeof q === 'string' ? q : q.id);
  return qualityIds.some(id => ['accurate', 'blast', 'devastating'].includes(id));
}
```

#### `shouldTriggerFearCohesionDamage(fearLevel)`
```javascript
static shouldTriggerFearCohesionDamage(fearLevel) {
  return fearLevel > 0;
}
```

### Combat Integration (`combat.mjs` / `base-actor.mjs`)

After `receiveDamage()` applies wounds, check for Cohesion damage trigger. This happens in the damage application flow, after the damage message is posted.

**Insertion point:** After the damage chat message in `receiveDamage()`, add:
```javascript
// Check Cohesion damage trigger
if (CohesionHelper.shouldTriggerCohesionDamage(damage, weaponQualities)) {
  await CohesionHelper.handleCohesionDamage(actor);
}
```

### `handleCohesionDamage()` (Non-Pure — Foundry API)

This function reads world settings, checks the round cap, and posts a rally test prompt to chat.

```javascript
static async handleCohesionDamage(targetActor) {
  const cohesion = game.settings.get('deathwatch', 'cohesion');
  if (cohesion.value <= 0) return;

  const alreadyDamaged = game.settings.get('deathwatch', 'cohesionDamageThisRound');
  if (alreadyDamaged) return;

  // Post rally test prompt to chat
  const leaderId = game.settings.get('deathwatch', 'squadLeader');
  const leader = leaderId ? game.actors.get(leaderId) : null;
  const leaderName = leader?.name || 'Squad Leader';

  const message = `
    <div class="cohesion-damage-prompt">
      <h3>⚠ Cohesion Damage!</h3>
      <p>A devastating attack threatens Kill-team cohesion.</p>
      <p><strong>${leaderName}</strong> may attempt a Command or Fellowship Test to rally.</p>
      <button class="cohesion-rally-btn" data-leader-id="${leaderId}">
        🛡 Rally Test (Command/Fellowship)
      </button>
      <button class="cohesion-damage-accept-btn">
        ✗ Accept Cohesion Damage
      </button>
    </div>
  `;
  await ChatMessage.create({ content: message, speaker: ChatMessage.getSpeaker() });
}
```

### Chat Button Handlers (`deathwatch.mjs`)

#### Rally Test Button
```javascript
html.find('.cohesion-rally-btn').click(async (ev) => {
  const leaderId = ev.currentTarget.dataset.leaderId;
  const leader = game.actors.get(leaderId);
  if (!leader) return;

  // Get leader's Command skill total and Fellowship value
  const commandTotal = leader.system.skills?.command?.total || 0;
  const fsValue = leader.system.characteristics?.fs?.value || 0;
  const targetNumber = Math.max(commandTotal, fsValue);

  const roll = await new Roll('1d100').evaluate();
  const success = roll.total <= targetNumber;

  if (success) {
    // Rally succeeded — no Cohesion loss
    await ChatMessage.create({
      content: `<div class="cohesion-rally-result">
        <h3>🛡 Rally Successful!</h3>
        <p>${leader.name} rallies the Kill-team! (Rolled ${roll.total} vs ${targetNumber})</p>
        <p>Cohesion damage negated.</p>
      </div>`
    });
  } else {
    // Rally failed — apply Cohesion damage
    await CohesionHelper.applyCohesionDamage(1);
    await ChatMessage.create({
      content: `<div class="cohesion-rally-result">
        <h3>⚠ Rally Failed!</h3>
        <p>${leader.name} fails to rally! (Rolled ${roll.total} vs ${targetNumber})</p>
        <p>Kill-team loses 1 Cohesion.</p>
      </div>`
    });
  }
});
```

#### Accept Damage Button
```javascript
html.find('.cohesion-damage-accept-btn').click(async () => {
  await CohesionHelper.applyCohesionDamage(1);
  await ChatMessage.create({
    content: `<div class="cohesion-rally-result">
      <h3>⚠ Cohesion Lost</h3>
      <p>Kill-team loses 1 Cohesion.</p>
    </div>`
  });
});
```

### `applyCohesionDamage(amount)` (Non-Pure)
```javascript
static async applyCohesionDamage(amount) {
  const cohesion = game.settings.get('deathwatch', 'cohesion');
  const newValue = Math.max(0, cohesion.value - amount);
  await game.settings.set('deathwatch', 'cohesion', { ...cohesion, value: newValue });
  await game.settings.set('deathwatch', 'cohesionDamageThisRound', true);
}
```

### Round Reset Hook

Reset the per-round damage cap when combat round advances:
```javascript
// In deathwatch.mjs
Hooks.on('updateCombat', (combat, change) => {
  if (change.round !== undefined) {
    game.settings.set('deathwatch', 'cohesionDamageThisRound', false);
  }
});
```

### Passing Weapon Qualities to receiveDamage

The `receiveDamage()` options object needs the weapon's `attachedQualities` passed through. This is already available in the damage application flow — the weapon object is accessible in `weaponDamageRoll()`. Add `weaponQualities` to the options passed to `receiveDamage()`.

```javascript
// In combat.mjs weaponDamageRoll(), when building apply-damage button data:
data-weapon-qualities='${JSON.stringify(weapon.system.attachedQualities || [])}'
```

Then in the apply-damage handler, parse and pass to `receiveDamage()`.

## Fear Integration

Fear-based Cohesion damage follows the same pattern but uses a **Willpower Test** instead of Command/Fellowship. The trigger point is when a Fear test is failed (existing Fear handling code). This can be added as a follow-up or integrated here if Fear tests are already implemented.

For now, add the pure function and defer the hook integration:
```javascript
static resolveRallyTest(targetNumber, roll) {
  return roll <= targetNumber;
}
```

## Tests (`tests/helpers/cohesion.test.mjs` additions)

### shouldTriggerCohesionDamage
| Raw Damage | Qualities | Expected | Description |
|-----------|-----------|----------|-------------|
| 10 | `[{id: "blast"}]` | true | Exactly 10 + Blast |
| 9 | `[{id: "blast"}]` | false | Below threshold |
| 15 | `[{id: "accurate"}]` | true | Accurate + above threshold |
| 12 | `[{id: "devastating"}]` | true | Devastating |
| 10 | `[{id: "tearing"}]` | false | Non-qualifying quality |
| 10 | `[]` | false | No qualities |
| 20 | `[{id: "blast"}, {id: "tearing"}]` | true | Mixed qualities |

### resolveRallyTest
| Target | Roll | Expected |
|--------|------|----------|
| 50 | 30 | true |
| 50 | 50 | true |
| 50 | 51 | false |
| 0 | 1 | false |

**Estimated: ~12 tests**

## Deliverables
1. `CohesionHelper.shouldTriggerCohesionDamage()` — pure function
2. `CohesionHelper.handleCohesionDamage()` — chat prompt
3. `CohesionHelper.applyCohesionDamage()` — setting update
4. `CohesionHelper.resolveRallyTest()` — pure function
5. Chat button handlers for rally/accept
6. Combat round reset hook
7. Weapon qualities passed through damage flow
8. Tests
