# Macro Scripting API

This document describes the public API for creating custom macros in the Deathwatch system.

## Table of Contents

- [Skill Tests](#skill-tests)
- [Characteristic Tests](#characteristic-tests)
- [Difficulty Presets](#difficulty-presets)
- [Finding Actor IDs](#finding-actor-ids)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Skill Tests

### `game.deathwatch.rollSkill(actorId, skillName, options)`

Roll a skill test programmatically from a macro.

**Parameters:**
- `actorId` (string): Actor ID (use `actor.id` or `actor._id`)
- `skillName` (string): Skill key or label (case-insensitive)
  - Examples: `'dodge'`, `'awareness'`, `'command'`, `'forbidden-lore'`
  - Can use either the skill key or the displayed label
- `options` (object, optional): Roll options
  - `modifier` (number): Additional modifier to apply (default: 0)
  - `difficulty` (string|number): Difficulty preset or numeric modifier (default: 'Challenging')
  - `skipDialog` (boolean): If true, roll immediately without dialog (default: false)

**Returns:** `Promise<Roll|null>` - The rolled result, or null if canceled/failed

---

## Characteristic Tests

### `game.deathwatch.rollCharacteristic(actorId, characteristicKey, options)`

Roll a characteristic test programmatically from a macro.

**Parameters:**
- `actorId` (string): Actor ID (use `actor.id` or `actor._id`)
- `characteristicKey` (string): Characteristic key (case-insensitive)
  - Valid keys: `'ws'`, `'bs'`, `'str'`, `'tg'`, `'ag'`, `'int'`, `'per'`, `'wil'`, `'fs'`
  - Full names: Weapon Skill, Ballistic Skill, Strength, Toughness, Agility, Intelligence, Perception, Willpower, Fellowship
- `options` (object, optional): Roll options
  - `modifier` (number): Additional modifier to apply (default: 0)
  - `difficulty` (string|number): Difficulty preset or numeric modifier (default: 'Challenging')
  - `skipDialog` (boolean): If true, roll immediately without dialog (default: false)
  - `useCybernetic` (boolean): If true and cybernetic available, use cybernetic value (default: false)
  - `useNatural` (boolean): If true, force use of natural characteristic (default: false)

**Returns:** `Promise<Roll|null>` - The rolled result, or null if canceled/failed

**Cybernetic Support:**
If a character has an equipped cybernetic that replaces a characteristic (e.g., servo-arm replaces Strength), the API will:
- Show a source selector in the dialog (natural vs cybernetic)
- Use cybernetic automatically if `useCybernetic: true` is set
- Use natural characteristic if `useNatural: true` is set
- Default to natural characteristic unless explicitly specified

---

## Usage Examples

### Characteristic Tests

```javascript
// Basic characteristic roll with dialog
await game.deathwatch.rollCharacteristic(token.actor.id, 'str');

// Direct roll with modifiers
await game.deathwatch.rollCharacteristic(token.actor.id, 'ag', {
  modifier: 10,
  difficulty: 'Easy',
  skipDialog: true
});

// Force use of servo-arm strength (if equipped)
await game.deathwatch.rollCharacteristic(token.actor.id, 'str', {
  useCybernetic: true,
  skipDialog: true
});

// Force use of natural strength (ignore servo-arm)
await game.deathwatch.rollCharacteristic(token.actor.id, 'str', {
  useNatural: true,
  skipDialog: true
});

// Case-insensitive characteristic keys
await game.deathwatch.rollCharacteristic(token.actor.id, 'STR', { skipDialog: true });
await game.deathwatch.rollCharacteristic(token.actor.id, 'Ag', { skipDialog: true });
```

### Combat Reactions (Dodge & Parry)

```javascript
// Quick Dodge (Agility, Challenging)
await game.deathwatch.rollCharacteristic(token.actor.id, 'ag', {
  difficulty: 'Challenging',
  skipDialog: true
});

// Quick Parry (Weapon Skill, Challenging)
await game.deathwatch.rollCharacteristic(token.actor.id, 'ws', {
  difficulty: 'Challenging',
  skipDialog: true
});

// Defensive Stance (+20 bonus)
await game.deathwatch.rollCharacteristic(token.actor.id, 'ag', {
  modifier: 20,  // Defensive Stance bonus
  difficulty: 'Challenging',
  skipDialog: true
});

// Parry with talent bonus (e.g., Blademaster +10)
const hasBlademaster = token.actor.items.find(i => i.name === 'Blademaster');
await game.deathwatch.rollCharacteristic(token.actor.id, 'ws', {
  modifier: hasBlademaster ? 10 : 0,
  difficulty: 'Challenging',
  skipDialog: true
});
```

### Skill Tests

### Basic Examples

```javascript
// Roll with dialog (user can adjust modifiers)
await game.deathwatch.rollSkill('actor123', 'dodge');

// Roll a selected token's skill
const token = canvas.tokens.controlled[0];
if (token) {
  await game.deathwatch.rollSkill(token.actor.id, 'awareness');
}

// Roll with pre-filled modifiers (dialog still shows)
await game.deathwatch.rollSkill('actor123', 'command', {
  modifier: 10,
  difficulty: 'Easy'
});
```

### Direct Rolls (Skip Dialog)

```javascript
// Roll directly with +10 modifier
await game.deathwatch.rollSkill('actor123', 'dodge', {
  modifier: 10,
  skipDialog: true
});

// Roll with difficulty preset
await game.deathwatch.rollSkill('actor123', 'awareness', {
  difficulty: 'Hard',  // -20 modifier
  skipDialog: true
});

// Roll with numeric difficulty
await game.deathwatch.rollSkill('actor123', 'command', {
  difficulty: -30,  // Very Hard
  skipDialog: true
});

// Combine modifiers
await game.deathwatch.rollSkill('actor123', 'stealth', {
  modifier: 20,
  difficulty: 'Routine',  // +20
  skipDialog: true
  // Total modifier: +40
});
```

### Practical Macro Examples

#### Selected Token Quick Skill Roll

```javascript
// Create a macro that rolls a specific skill for the selected token
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

await game.deathwatch.rollSkill(token.actor.id, 'dodge', {
  skipDialog: true
});
```

#### Contextual Skill Test with Dialog

```javascript
// Roll awareness with situational modifiers pre-filled
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// Pre-fill modifiers based on scene conditions
const isDark = true;  // Scene is dark
const hasAuspex = token.actor.items.find(i => i.name === 'Auspex');

const modifier = hasAuspex ? 10 : 0;
const difficulty = isDark ? 'Hard' : 'Challenging';

await game.deathwatch.rollSkill(token.actor.id, 'awareness', {
  modifier,
  difficulty
});
```

#### Contextual Characteristic Test

```javascript
// Roll Toughness test for selected token with conditional modifiers
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// Check if character has specific talents/traits
const hasIronJaw = token.actor.items.find(i => i.name === 'Iron Jaw');
const isWounded = token.actor.system.wounds.value < token.actor.system.wounds.max / 2;

const modifier = hasIronJaw ? 10 : 0;
const difficulty = isWounded ? 'Hard' : 'Challenging';

await game.deathwatch.rollCharacteristic(token.actor.id, 'tg', {
  modifier,
  difficulty
});
```

#### Servo-Arm Strength Test

```javascript
// Automatically use servo-arm if equipped, otherwise natural strength
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// Check if actor has servo-arm
const hasServoArm = token.actor.items.find(i => 
  i.type === 'cybernetic' && 
  i.system.replacesCharacteristic === 'str' && 
  i.system.equipped
);

await game.deathwatch.rollCharacteristic(token.actor.id, 'str', {
  useCybernetic: hasServoArm ? true : false,
  skipDialog: true
});
```

#### Dialog: "Which Skill?"

```javascript
// Let user choose which skill to roll
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

const skills = Object.entries(token.actor.system.skills)
  .map(([key, skill]) => ({ key, label: skill.label || key }))
  .sort((a, b) => a.label.localeCompare(b.label));

const skillOptions = skills
  .map(s => `<option value="${s.key}">${s.label}</option>`)
  .join('');

const content = `
  <div class="form-group">
    <label>Skill:</label>
    <select id="skill-select" name="skill">${skillOptions}</select>
  </div>
  <div class="form-group">
    <label>Modifier:</label>
    <input type="number" id="modifier" name="modifier" value="0" />
  </div>
`;

const result = await foundry.applications.api.DialogV2.wait({
  window: { title: 'Roll Skill' },
  content,
  buttons: [
    {
      label: 'Roll',
      action: 'roll',
      callback: (event, button, dialog) => {
        const skillKey = dialog.querySelector('#skill-select').value;
        const modifier = parseInt(dialog.querySelector('#modifier').value) || 0;
        return { skillKey, modifier };
      }
    },
    { label: 'Cancel', action: 'cancel' }
  ]
});

if (result && result !== 'cancel') {
  await game.deathwatch.rollSkill(token.actor.id, result.skillKey, {
    modifier: result.modifier
  });
}
```

#### GM: Roll for All Party Members

```javascript
// Roll the same skill for all player characters (GM only)
if (!game.user.isGM) {
  ui.notifications.error('Only the GM can use this macro');
  return;
}

const skillName = 'awareness';  // Change this to desired skill
const difficulty = 'Challenging';

const playerActors = game.actors.filter(a => 
  a.type === 'character' && a.hasPlayerOwner
);

for (const actor of playerActors) {
  await game.deathwatch.rollSkill(actor.id, skillName, {
    difficulty,
    skipDialog: true
  });
}

ui.notifications.info(`Rolled ${skillName} for ${playerActors.length} characters`);
```

#### Opposed Test Helper

```javascript
// Roll opposed test for two tokens
const tokens = canvas.tokens.controlled;
if (tokens.length !== 2) {
  ui.notifications.warn('Please select exactly 2 tokens');
  return;
}

const skillName = 'command';  // Change as needed

ui.notifications.info(`Rolling ${skillName} for both actors...`);

await game.deathwatch.rollSkill(tokens[0].actor.id, skillName, {
  skipDialog: true
});

await game.deathwatch.rollSkill(tokens[1].actor.id, skillName, {
  skipDialog: true
});

ui.notifications.info('Compare Degrees of Success in chat');
```

#### Dodge or Parry Selector

```javascript
// Let user choose between Dodge (AG) or Parry (WS)
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

const ws = token.actor.system.characteristics.ws.value;
const ag = token.actor.system.characteristics.ag.value;

const content = `
  <div class="form-group">
    <label>Reaction Type:</label>
    <select id="reaction-type" name="reactionType" style="width: 100%;">
      <option value="dodge">Dodge (Agility ${ag})</option>
      <option value="parry">Parry (Weapon Skill ${ws})</option>
    </select>
  </div>
  <div class="form-group">
    <label>Additional Modifier:</label>
    <input type="number" id="modifier" name="modifier" value="0" style="width: 100%;" />
  </div>
`;

const result = await foundry.applications.api.DialogV2.wait({
  window: { title: `Reaction - ${token.actor.name}` },
  content,
  buttons: [
    {
      label: 'Roll',
      action: 'roll',
      callback: (event, button, dialog) => {
        const reactionType = dialog.querySelector('#reaction-type').value;
        const modifier = parseInt(dialog.querySelector('#modifier').value) || 0;
        return { reactionType, modifier };
      }
    },
    { label: 'Cancel', action: 'cancel' }
  ]
});

if (result && result !== 'cancel') {
  const charKey = result.reactionType === 'dodge' ? 'ag' : 'ws';
  await game.deathwatch.rollCharacteristic(token.actor.id, charKey, {
    modifier: result.modifier,
    difficulty: 'Challenging'
  });
}
```

#### Advanced Combat Reactions

```javascript
// Comprehensive reaction macro with automatic modifiers
const token = canvas.tokens.controlled[0];
if (!token) return;

// Check for talents
const hasLightningReflexes = token.actor.items.find(i => i.name === 'Lightning Reflexes');
const hasBlademaster = token.actor.items.find(i => i.name === 'Blademaster');

// Calculate modifiers
let modifier = 0;
const isDefensiveStance = true;  // Set based on situation
const numAttackers = 2;          // Number of attackers this round

if (isDefensiveStance) modifier += 20;  // Defensive Stance bonus
if (numAttackers > 1) modifier += (numAttackers - 1) * -20;  // Multiple attacker penalty

// Roll Dodge with Lightning Reflexes
if (hasLightningReflexes) modifier += 10;
await game.deathwatch.rollCharacteristic(token.actor.id, 'ag', {
  modifier,
  difficulty: 'Challenging',
  skipDialog: true
});
```

#### Quick Characteristic Selector

```javascript
// Let user choose which characteristic to roll
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

const chars = game.deathwatch.getCharacteristics();
const charOptions = Object.entries(chars)
  .map(([key, name]) => {
    const value = token.actor.system.characteristics[key].value;
    return `<option value="${key}">${name} (${value})</option>`;
  })
  .join('');

const content = `
  <div class="form-group">
    <label>Characteristic:</label>
    <select id="char-select" name="characteristic" style="width: 100%;">${charOptions}</select>
  </div>
  <div class="form-group">
    <label>Additional Modifier:</label>
    <input type="number" id="modifier" name="modifier" value="0" style="width: 100%;" />
  </div>
`;

const result = await foundry.applications.api.DialogV2.wait({
  window: { title: `Roll Characteristic - ${token.actor.name}` },
  content,
  buttons: [
    {
      label: 'Roll',
      action: 'roll',
      callback: (event, button, dialog) => {
        const charKey = dialog.querySelector('#char-select').value;
        const modifier = parseInt(dialog.querySelector('#modifier').value) || 0;
        return { charKey, modifier };
      }
    },
    { label: 'Cancel', action: 'cancel' }
  ]
});

if (result && result !== 'cancel') {
  await game.deathwatch.rollCharacteristic(token.actor.id, result.charKey, {
    modifier: result.modifier
  });
}
```

---

## Difficulty Presets

Use `game.deathwatch.getDifficulties()` to get all available difficulty presets:

```javascript
const difficulties = game.deathwatch.getDifficulties();
console.log(difficulties);
// {
//   'Trivial': 60,
//   'Easy': 30,
//   'Routine': 20,
//   'Ordinary': 10,
//   'Challenging': 0,
//   'Difficult': -10,
//   'Hard': -20,
//   'Very Hard': -30,
//   'Arduous': -40,
//   'Punishing': -50,
//   'Hellish': -60
// }
```

You can use either the preset name (string) or the numeric value:

```javascript
// These are equivalent:
await game.deathwatch.rollSkill(actorId, 'dodge', { difficulty: 'Hard' });
await game.deathwatch.rollSkill(actorId, 'dodge', { difficulty: -20 });

// Works for characteristics too:
await game.deathwatch.rollCharacteristic(actorId, 'str', { difficulty: 'Hard' });
await game.deathwatch.rollCharacteristic(actorId, 'str', { difficulty: -20 });
```

## Available Characteristics

Use `game.deathwatch.getCharacteristics()` to get all valid characteristic keys and names:

```javascript
const chars = game.deathwatch.getCharacteristics();
console.log(chars);
// {
//   'ws': 'Weapon Skill',
//   'bs': 'Ballistic Skill',
//   'str': 'Strength',
//   'tg': 'Toughness',
//   'ag': 'Agility',
//   'int': 'Intelligence',
//   'per': 'Perception',
//   'wil': 'Willpower',
//   'fs': 'Fellowship'
// }
```

Characteristic keys are **case-insensitive**, so these all work:
```javascript
await game.deathwatch.rollCharacteristic(actorId, 'str');
await game.deathwatch.rollCharacteristic(actorId, 'STR');
await game.deathwatch.rollCharacteristic(actorId, 'Str');
```

---

## Finding Actor IDs

### Selected Token
```javascript
const token = canvas.tokens.controlled[0];
const actorId = token?.actor.id;
```

### By Name
```javascript
const actor = game.actors.getName("Brother Corvus");
const actorId = actor?.id;
```

### Current User's Character
```javascript
const actor = game.user.character;
const actorId = actor?.id;
```

### All Player Characters
```javascript
const playerActors = game.actors.filter(a => 
  a.type === 'character' && a.hasPlayerOwner
);
```

---

## Error Handling

The API validates inputs and shows notifications for common errors:

- **Actor not found**: Shows error notification with actor ID
- **Skill not found**: Shows error notification with skill name and actor name
- **Untrained advanced skill**: Shows warning that skill must be trained
- **Invalid inputs**: Returns null and shows appropriate error

All errors are also logged to the console (F12) for debugging.

---

## Best Practices

1. **Always check for selected token** before accessing `canvas.tokens.controlled[0]`
2. **Use `skipDialog: true`** for automated rolls, but show dialog for manual rolls
3. **Pre-fill modifiers** when you have contextual information (lighting, equipment, etc.)
4. **Use descriptive variable names** in macros so they're easy to customize later
5. **Add error handling** for null actors/tokens
6. **Test macros** with both trained and untrained skills
7. **Use `await`** when calling `rollSkill` to ensure roll completes before continuing

---

## Future API Extensions

The following APIs may be added in future updates:

- ✅ `game.deathwatch.rollCharacteristic(actorId, charKey, options)` - **IMPLEMENTED** ✅
- `game.deathwatch.weaponAttack(actorId, weaponId, options)` - Roll weapon attacks
- `game.deathwatch.applyDamage(actorId, damageData)` - Apply damage programmatically
- `game.deathwatch.focusPower(actorId, powerId, options)` - Roll psychic power tests

If you need additional APIs, please file an issue on GitHub!
