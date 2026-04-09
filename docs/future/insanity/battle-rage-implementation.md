# Battle Rage Trauma - Implementation Details

## Overview

Battle Rage is a Battle Trauma that causes a Battle-Brother to fixate on enemies after scoring Righteous Fury. This document details the complete implementation.

---

## Trigger Condition

**From Core Rulebook p. 217**:
> "Whenever the Battle-Brother scores Righteous Fury on a foe, he becomes fixated on its destruction and must kill it. The Space Marine must then direct his attacks against this target to the exclusion of all else until it is slain. When Battle Rage is triggered, the Battle-Brother may make a Challenging (+0) Willpower Test to avoid its effects."

---

## Implementation Flow

```
Righteous Fury Scored
    ↓
Check for Battle Rage Trauma
    ↓
If present → Prompt WP Resist Test
    ↓
  Success: No effect, maintains control
    ↓
  Failure: Apply Battle Rage Fixation
    ↓
Active Effect created on actor
    ↓
Token visual indicator added
    ↓
Chat notification posted
    ↓
All attacks restricted to fixated target
    ↓
Fixation removed when target dies
```

---

## Data Structures

### Active Effect Structure

When Battle Rage fixation is applied, an Active Effect is created:

```javascript
{
  name: "Battle Rage: Fixated",
  icon: "systems/deathwatch/assets/icons/battle-rage-active.svg",
  origin: actor.uuid,
  duration: {
    // Indefinite until target dies
  },
  flags: {
    deathwatch: {
      battleRage: {
        targetId: "token_id_here",
        targetUuid: "Scene.xyz.Token.abc",
        targetName: "Chaos Sorcerer"
      }
    }
  },
  changes: [] // No stat changes, behavioral only
}
```

### Battle Rage Trauma Item

```json
{
  "_id": "BattleRage001",
  "name": "Battle Rage",
  "type": "battle-trauma",
  "system": {
    "key": "battle-rage",
    "description": "<p>The Battle-Brother singles out particular enemies for the Emperor's fury and becomes fixated on killing them...</p>",
    "triggerType": "righteousFury",
    "effectType": "behavior",
    "canResist": true,
    "resistDifficulty": "challenging",
    "book": "Deathwatch Core Rulebook",
    "page": 217
  }
}
```

---

## Key Functions

### 1. Detection (righteous-fury-helper.mjs)

```javascript
/**
 * Check for Battle Rage trauma after Righteous Fury.
 * Called immediately after fury is confirmed.
 * 
 * @param {DeathwatchActor} actor - The attacker
 * @param {Token} target - The target that triggered fury
 * @param {Object} weaponData - Weapon used
 */
async function checkBattleRageTrigger(actor, target, weaponData) {
  const battleRage = actor.items.find(i => 
    i.type === "battle-trauma" && 
    i.system.key === "battle-rage"
  );
  
  if (battleRage) {
    await promptBattleRageResistTest(actor, target, battleRage);
  }
}
```

### 2. Resist Test Dialog

```javascript
/**
 * Show dialog for Battle-Brother to resist fixation.
 * 
 * @param {DeathwatchActor} actor - Character with Battle Rage
 * @param {Token} target - Target that triggered fury
 * @param {Item} battleRage - The trauma item
 */
async function promptBattleRageResistTest(actor, target, battleRage) {
  const wp = actor.system.characteristics.wp.total;
  const modifier = 0; // Challenging (+0)
  const targetNumber = wp + modifier;
  
  const dialog = new Dialog({
    title: "Battle Rage - Resist Test",
    content: `
      <div class="battle-rage-test">
        <h3>⚔ Battle Rage Triggered!</h3>
        <p>${actor.name} has scored Righteous Fury against ${target.name}.</p>
        <p>Test Willpower (${wp}) vs ${targetNumber} to resist fixation.</p>
        <p class="warning">If you fail, you must focus on ${target.name} until slain.</p>
      </div>
    `,
    buttons: {
      roll: {
        label: "Roll to Resist",
        callback: async () => {
          const roll = await new Roll("1d100").evaluate();
          const success = roll.total <= targetNumber;
          
          await postBattleRageTestResult(actor, target, roll, success, targetNumber);
          
          if (!success) {
            await applyBattleRageFixation(actor, target);
          }
        }
      },
      accept: {
        label: "Accept Fixation",
        callback: async () => {
          await applyBattleRageFixation(actor, target);
        }
      }
    },
    default: "roll"
  });
  
  dialog.render(true);
}
```

### 3. Apply Fixation

```javascript
/**
 * Apply Battle Rage fixation to actor.
 * Creates Active Effect and visual indicators.
 * 
 * @param {DeathwatchActor} actor - Character to fixate
 * @param {Token} target - Target to fixate on
 */
async function applyBattleRageFixation(actor, target) {
  // Create Active Effect
  const effectData = {
    name: "Battle Rage: Fixated",
    icon: "systems/deathwatch/assets/icons/battle-rage-active.svg",
    origin: actor.uuid,
    flags: {
      deathwatch: {
        battleRage: {
          targetId: target.id,
          targetUuid: target.document.uuid,
          targetName: target.name
        }
      }
    }
  };
  
  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  
  // Visual indicator
  if (actor.token) {
    await actor.token.toggleEffect(effectData.icon, { active: true });
  }
  
  // Chat notification
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="battle-rage-fixation">
        <h3>⚔ Battle Rage Fixation</h3>
        <p><strong>${actor.name}</strong> is fixated on <strong>${target.name}</strong>!</p>
        <p>All attacks must target ${target.name} until slain.</p>
      </div>
    `,
    whisper: game.users.filter(u => u.isGM).map(u => u.id)
  });
  
  ui.notifications.warn(`${actor.name} is fixated on ${target.name}!`);
}
```

### 4. Enforce Fixation

```javascript
/**
 * Check if attack is allowed given Battle Rage fixation.
 * Called before every attack to enforce targeting restriction.
 * 
 * @param {DeathwatchActor} actor - The attacker
 * @param {Token} intendedTarget - Target being attacked
 * @returns {boolean} True if attack allowed, false if blocked
 */
function checkBattleRageFixation(actor, intendedTarget) {
  const fixationEffect = actor.effects.find(e => 
    e.name === "Battle Rage: Fixated"
  );
  
  if (!fixationEffect) return true; // No fixation
  
  const fixatedTargetId = fixationEffect.flags.deathwatch?.battleRage?.targetId;
  
  // Attacking fixated target? Allowed
  if (intendedTarget.id === fixatedTargetId) {
    return true;
  }
  
  // Check if fixated target still alive
  const fixatedTarget = canvas.tokens.get(fixatedTargetId);
  
  if (!fixatedTarget || fixatedTarget.actor.system.wounds.value <= 0) {
    // Target dead - remove fixation
    fixationEffect.delete();
    ui.notifications.info(`${actor.name} is no longer fixated (target eliminated).`);
    return true;
  }
  
  // Fixated target alive, cannot attack others
  const fixatedName = fixationEffect.flags.deathwatch?.battleRage?.targetName;
  ui.notifications.error(
    `${actor.name} is fixated on ${fixatedName} and cannot attack other targets!`
  );
  
  return false;
}
```

### 5. Remove Fixation

```javascript
/**
 * Remove Battle Rage fixation when target dies.
 * Hook into combat damage application.
 */
Hooks.on("updateActor", (actor, changes, options, userId) => {
  // Check if actor was reduced to 0 wounds
  if (changes.system?.wounds?.value === 0) {
    // Find any actors fixated on this one
    const fixatedActors = game.actors.filter(a => 
      a.effects.some(e => 
        e.name === "Battle Rage: Fixated" &&
        e.flags.deathwatch?.battleRage?.targetId === actor.token?.id
      )
    );
    
    // Remove fixation effects
    for (const fixatedActor of fixatedActors) {
      const effect = fixatedActor.effects.find(e => 
        e.flags.deathwatch?.battleRage?.targetId === actor.token?.id
      );
      
      if (effect) {
        effect.delete();
        ui.notifications.info(
          `${fixatedActor.name} is no longer fixated (target eliminated).`
        );
      }
    }
  }
});
```

---

## Integration Points

### Righteous Fury System

In `righteous-fury-helper.mjs`, after confirming fury:

```javascript
export async function confirmRighteousFury(actor, target, weapon) {
  // ... existing fury logic (extra damage, crit, etc.)
  
  // Check for Battle Rage trauma
  await checkBattleRageTrigger(actor, target, weapon);
}
```

### Weapon Attack System

In `weapon-handlers.mjs` or attack functions:

```javascript
export async function performAttack(actor, weapon, targetToken) {
  // Check Battle Rage fixation before allowing attack
  if (!checkBattleRageFixation(actor, targetToken)) {
    return; // Attack blocked by fixation
  }
  
  // ... proceed with attack
}
```

### Combat Tracker

Show fixation status in combat tracker:

```javascript
// In combat tracker render hook
Hooks.on("renderCombatTracker", (app, html, data) => {
  for (const combatant of data.combat.combatants) {
    const actor = combatant.actor;
    const fixation = actor.effects.find(e => e.name === "Battle Rage: Fixated");
    
    if (fixation) {
      const targetName = fixation.flags.deathwatch?.battleRage?.targetName;
      const li = html.find(`[data-combatant-id="${combatant.id}"]`);
      li.append(`<span class="fixation-indicator" title="Fixated on ${targetName}">⚔</span>`);
    }
  }
});
```

---

## UI Elements

### Token Status Effect

**Icon**: `systems/deathwatch/assets/icons/battle-rage-active.svg`
- Red crossed swords or rage icon
- Shows on token when fixated
- Tooltip: "Fixated on [Target Name]"

### Character Sheet Indicator

In the Battle Traumas section:

```
⚔ BATTLE TRAUMAS
├─ Battle Rage                     [View] [i]
   └─ Triggers on Righteous Fury
   └─ ⚠ ACTIVE: Fixated on Chaos Sorcerer  [Clear]
```

### Combat Tracker

```
[Initiative] Character Name        ⚔
             └─ Fixated: Chaos Sorcerer
```

### Chat Message Templates

**Fixation Applied**:
```
┌────────────────────────────────────────┐
│ ⚔ BATTLE RAGE FIXATION                │
├────────────────────────────────────────┤
│ Brother Alaric is consumed with rage!  │
│                                        │
│ Fixated on: Chaos Sorcerer             │
│                                        │
│ Effect: All attacks must target       │
│ Chaos Sorcerer until slain.           │
└────────────────────────────────────────┘
```

**Fixation Removed**:
```
┌────────────────────────────────────────┐
│ ⚔ BATTLE RAGE ENDED                   │
├────────────────────────────────────────┤
│ Brother Alaric's fixation ends.        │
│                                        │
│ Target eliminated: Chaos Sorcerer      │
└────────────────────────────────────────┘
```

---

## Edge Cases

### 1. Target Flees Scene

If fixated target leaves the scene (not dead):

```javascript
Hooks.on("deleteToken", (token, options, userId) => {
  // Find actors fixated on this token
  const fixatedActors = game.actors.filter(a => 
    a.effects.some(e => 
      e.flags.deathwatch?.battleRage?.targetId === token.id
    )
  );
  
  // Prompt GM: maintain fixation or release?
  if (fixatedActors.length > 0) {
    Dialog.confirm({
      title: "Battle Rage - Target Fled",
      content: `<p>${fixatedActors.map(a => a.name).join(", ")} fixated on ${token.name}.</p>
                <p>Target has left the scene. Release fixation?</p>`,
      yes: () => {
        // Release fixation
        fixatedActors.forEach(a => {
          const effect = a.effects.find(e => 
            e.flags.deathwatch?.battleRage?.targetId === token.id
          );
          effect?.delete();
        });
      },
      no: () => {
        // Maintain fixation (will block attacks)
        ui.notifications.info("Fixation maintained. Character cannot act until target returns.");
      }
    });
  }
});
```

### 2. Multiple Targets Trigger Fury

If Righteous Fury on multiple targets in same turn:

```javascript
// Only fixate on the first target
// Or: prompt player to choose which target to fixate on
```

### 3. GM Override

GM can manually remove fixation if situation warrants:

**UI**: Right-click actor → "Remove Battle Rage Fixation"

```javascript
async function removeFixationOverride(actor) {
  const effect = actor.effects.find(e => e.name === "Battle Rage: Fixated");
  
  if (!effect) {
    ui.notifications.warn("No Battle Rage fixation to remove.");
    return;
  }
  
  Dialog.confirm({
    title: "Remove Battle Rage Fixation",
    content: `<p>Remove Battle Rage fixation from ${actor.name}?</p>
              <p>This overrides the trauma effect.</p>`,
    yes: async () => {
      await effect.delete();
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<p>GM removed Battle Rage fixation from ${actor.name}.</p>`,
        whisper: game.users.filter(u => u.isGM).map(u => u.id)
      });
    }
  });
}
```

### 4. Greater Danger

Per rules, GM can allow WP test if greater danger present:

```javascript
/**
 * GM can prompt emergency WP test to break fixation.
 * 
 * @param {DeathwatchActor} actor - Fixated character
 * @param {string} reason - Why breaking fixation (e.g., "Daemon Prince attacking")
 */
async function promptEmergencyFixationBreak(actor, reason) {
  const wp = actor.system.characteristics.wp.total;
  
  Dialog.confirm({
    title: "Break Battle Rage Fixation",
    content: `
      <p><strong>${actor.name}</strong> is fixated but faces greater danger: ${reason}</p>
      <p>Allow Willpower test to break fixation?</p>
      <p>Target: ${wp} (Challenging +0)</p>
    `,
    yes: async () => {
      const roll = await new Roll("1d100").evaluate();
      const success = roll.total <= wp;
      
      if (success) {
        const effect = actor.effects.find(e => e.name === "Battle Rage: Fixated");
        await effect?.delete();
        ui.notifications.info(`${actor.name} breaks free of Battle Rage fixation!`);
      } else {
        ui.notifications.warn(`${actor.name} cannot break fixation!`);
      }
      
      // Post result to chat
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
          <p><strong>${actor.name}</strong> attempts to break Battle Rage fixation.</p>
          <p>Reason: ${reason}</p>
          <p>Roll: ${roll.total} vs ${wp} - ${success ? 'Success' : 'Failure'}</p>
        `,
        roll: roll,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL
      });
    }
  });
}
```

---

## Testing

### Unit Tests

```javascript
describe('Battle Rage', () => {
  test('detects Battle Rage trauma', () => {
    const actor = createTestActor({
      items: [{ type: 'battle-trauma', system: { key: 'battle-rage' } }]
    });
    
    const hasBattleRage = actor.items.some(i => 
      i.type === 'battle-trauma' && i.system.key === 'battle-rage'
    );
    
    expect(hasBattleRage).toBe(true);
  });
  
  test('blocks attacks to non-fixated targets', () => {
    const actor = createTestActor();
    const fixatedTarget = createTestToken({ id: 'target1' });
    const otherTarget = createTestToken({ id: 'target2' });
    
    // Apply fixation
    actor.createEmbeddedDocuments("ActiveEffect", [{
      name: "Battle Rage: Fixated",
      flags: { deathwatch: { battleRage: { targetId: 'target1' } } }
    }]);
    
    expect(checkBattleRageFixation(actor, fixatedTarget)).toBe(true);
    expect(checkBattleRageFixation(actor, otherTarget)).toBe(false);
  });
  
  test('removes fixation when target dies', async () => {
    const actor = createTestActor();
    const target = createTestToken({ id: 'target1' });
    
    await applyBattleRageFixation(actor, target);
    
    expect(actor.effects.find(e => e.name === "Battle Rage: Fixated")).toBeDefined();
    
    // Simulate target death
    target.actor.update({ "system.wounds.value": 0 });
    
    // Fixation should be removed
    expect(actor.effects.find(e => e.name === "Battle Rage: Fixated")).toBeUndefined();
  });
});
```

---

## Performance Considerations

- **Active Effect lookup**: Fast, uses native Foundry indexing
- **Token lookup**: Use `canvas.tokens.get()` (fast) not `game.actors` iteration
- **Hook frequency**: Only check on attack/death, not every render
- **Cleanup**: Automatically remove stale fixations (target no longer exists)
