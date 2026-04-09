# Insanity and Corruption - Detailed Mechanics

## Corruption System

### Gaining Corruption Points

**Sources** (GM discretion):
- Perils of the Warp (1-10 CP depending on severity)
- Daemonic possession attempts (5-20 CP)
- Prolonged warp travel without Gellar Field (1-5 CP per day)
- Wielding daemon weapons (1-10 CP per use)
- Pacts with warp entities (10-50 CP)
- Exposure to corrupted artifacts (1-10 CP)

**API**:
```javascript
/**
 * Add corruption points to a character.
 * 
 * @param {DeathwatchActor} actor - The character gaining corruption
 * @param {number} points - Number of corruption points to add
 * @param {string} source - Description of corruption source
 * @param {string} [missionId] - Optional mission ID for tracking
 */
async function addCorruption(actor, points, source, missionId = null) {
  const newTotal = actor.system.corruption + points;
  const entry = {
    points,
    source,
    timestamp: Date.now(),
    missionId
  };
  
  const history = [...actor.system.corruptionHistory, entry];
  
  await actor.update({
    "system.corruption": newTotal,
    "system.corruptionHistory": history
  });
  
  // Check for threshold breach
  if (newTotal >= CORRUPTION.PURITY_THRESHOLD) {
    await CorruptionHelper.handleCharacterRemoval(actor, "corruption");
  }
  
  // Notify in chat
  await CorruptionHelper.postCorruptionMessage(actor, points, source, newTotal);
}
```

### Corruption Effects (Non-Mechanical)

While corruption has no direct mechanical penalties until the Purity Threshold (100 CP), the GM may apply narrative effects:

**Social Interaction**:
- High corruption (70+ CP): Fellow Space Marines may sense wrongness
- Fellowship penalty suggestion: -10 per 25 CP over 50
- Psykers automatically detect corruption 80+ CP
- Daemons attracted to corruption 90+ CP

**Roleplaying Hooks**:
- Nightmares and visions
- Subtle personality changes
- Physical signs (eyes darken, skin pallor)
- Reluctance to pray or enter holy sites

### Character Removal at 100 CP

When a character reaches 100+ Corruption Points:

1. **Immediate notification** to GM and player
2. **Dialog prompt** with options:
   - "Archive Character" — Move to compendium, mark as fallen
   - "Keep in World" — Apply "Corrupted" status, lock sheet
   - "Delay (1 session)" — Allow final mission/scene
3. **Final scene opportunity** (GM discretion)
4. **Character fate** recorded in world journal

**Implementation**:
```javascript
async function handleCharacterRemoval(actor, reason) {
  const dialog = await Dialog.confirm({
    title: `${actor.name} Has Fallen`,
    content: `
      <p><strong>${actor.name}</strong> has reached ${actor.system.corruption} Corruption Points.</p>
      <p>Their taint is too great to continue serving the Emperor.</p>
      <p>What would you like to do?</p>
    `,
    yes: () => archiveCharacter(actor, reason),
    no: () => markCharacterFallen(actor, reason),
    defaultYes: false
  });
}
```

---

## Insanity System

### Gaining Insanity Points

**Sources** (Core p. 216):
- Perils of the Warp (1-10 IP depending on severity)
- Witnessing daemon manifestation (1-5 IP)
- Betrayal by trusted ally (1-10 IP)
- Alien mind-affecting attacks (1-5 IP)
- Exposure to alien artifacts (1-5 IP)
- Witnessing entire squad wiped out (5-10 IP)
- Forced to kill loyal Imperial citizen (1-5 IP)

**API**:
```javascript
/**
 * Add insanity points to a character and trigger tests if needed.
 * 
 * @param {DeathwatchActor} actor - The character gaining insanity
 * @param {number} points - Number of insanity points to add
 * @param {string} source - Description of insanity source
 * @param {string} [missionId] - Optional mission ID for tracking
 */
async function addInsanity(actor, points, source, missionId = null) {
  const oldTotal = actor.system.insanity;
  const newTotal = oldTotal + points;
  const entry = {
    points,
    source,
    timestamp: Date.now(),
    missionId,
    testRolled: false,
    testResult: null
  };
  
  const history = [...actor.system.insanityHistory, entry];
  
  await actor.update({
    "system.insanity": newTotal,
    "system.insanityHistory": history
  });
  
  // Check if we crossed a 10-point boundary
  const oldThreshold = Math.floor(oldTotal / INSANITY_TRACK.TEST_INTERVAL);
  const newThreshold = Math.floor(newTotal / INSANITY_TRACK.TEST_INTERVAL);
  
  if (newThreshold > oldThreshold && newThreshold > actor.system.lastInsanityTestAt) {
    // Trigger insanity test
    await InsanityHelper.promptInsanityTest(actor, newThreshold);
  }
  
  // Check for removal
  if (newTotal >= INSANITY_TRACK.REMOVAL) {
    await InsanityHelper.handleCharacterRemoval(actor, "insanity");
  }
  
  // Notify in chat
  await InsanityHelper.postInsanityMessage(actor, points, source, newTotal);
}
```

### Insanity Track Levels

The insanity track determines trauma test modifiers and Primarch's Curse level:

| Insanity Points | Track Level | Trauma Modifier | Primarch's Curse |
|-----------------|-------------|-----------------|------------------|
| 0-30            | 0           | +0              | None             |
| 31-60           | 1           | -10             | Level 1          |
| 61-90           | 2           | -20             | Level 2          |
| 91-99           | 3           | -30             | Level 3          |
| 100+            | Removed     | N/A             | N/A              |

**Computation**:
```javascript
/**
 * Get insanity track level for a given insanity point value.
 * 
 * @param {number} insanityPoints - Current insanity points
 * @returns {number} Track level (0-3)
 */
function getTrackLevel(insanityPoints) {
  if (insanityPoints < INSANITY_TRACK.THRESHOLD_1) return 0;
  if (insanityPoints < INSANITY_TRACK.THRESHOLD_2) return 1;
  if (insanityPoints < INSANITY_TRACK.THRESHOLD_3) return 2;
  return 3;
}

/**
 * Get trauma test modifier for current track level.
 * 
 * @param {number} insanityPoints - Current insanity points
 * @returns {number} Modifier to apply to trauma tests
 */
function getTraumaModifier(insanityPoints) {
  const level = getTrackLevel(insanityPoints);
  return INSANITY_TRACK.MODIFIERS[`LEVEL_${level}`];
}
```

### Insanity Tests

**Trigger**: Every time a character gains enough Insanity Points to cross a 10-point boundary (10, 20, 30, etc.).

**Test**: Willpower + Trauma Modifier (based on current track level) + Situational Modifiers

**Success**: No effect, character resists mental trauma

**Failure**: Roll on Battle Trauma table (d10), gain corresponding trauma

**Situational Modifiers** (examples):
- Recent meditation/prayer: +10
- Witnessed horrific event: -10
- Squad support present: +10
- Alone and isolated: -10
- Under extreme stress: -20

**Implementation**:
```javascript
/**
 * Prompt player to roll an insanity test with modifier dialog.
 * 
 * @param {DeathwatchActor} actor - The character testing
 * @param {number} threshold - The 10-point threshold crossed
 */
async function promptInsanityTest(actor, threshold) {
  const trackLevel = getTrackLevel(actor.system.insanity);
  const trackModifier = INSANITY_TRACK.MODIFIERS[`LEVEL_${trackLevel}`];
  const wp = actor.system.characteristics.wp.total;
  
  // Create dialog with modifier input
  const content = `
    <form class="insanity-test-dialog">
      <div class="form-group">
        <label><strong>${actor.name}</strong> has gained significant mental trauma.</label>
        <p>Current Insanity: <strong>${actor.system.insanity}</strong> (Track Level ${trackLevel})</p>
        <p>If you fail, you will gain a Battle Trauma.</p>
      </div>
      
      <div class="form-group">
        <label>Base Willpower:</label>
        <input type="number" name="base-wp" value="${wp}" readonly />
      </div>
      
      <div class="form-group">
        <label>Track Modifier (Level ${trackLevel}):</label>
        <input type="number" name="track-modifier" value="${trackModifier}" readonly />
      </div>
      
      <div class="form-group">
        <label>Situational Modifier:</label>
        <input type="number" name="situational-modifier" value="0" autofocus />
        <p class="hint">Enter any situational bonuses or penalties</p>
      </div>
      
      <div class="form-group">
        <label>Target Number:</label>
        <input type="number" name="target" value="${wp + trackModifier}" readonly class="target-display" />
      </div>
    </form>
  `;
  
  const dialog = new Dialog({
    title: "Insanity Test Required",
    content,
    buttons: {
      roll: {
        label: "Roll Insanity Test",
        callback: async (html) => {
          const situationalMod = parseInt(html.find('[name="situational-modifier"]').val()) || 0;
          const finalTarget = wp + trackModifier + situationalMod;
          
          await rollInsanityTest(actor, {
            wp,
            trackModifier,
            situationalMod,
            finalTarget,
            threshold
          });
        }
      },
      later: {
        label: "Roll Later",
        callback: () => {
          ui.notifications.warn(`${actor.name} must roll an insanity test before next session.`);
        }
      }
    },
    default: "roll",
    render: (html) => {
      // Update target number dynamically as modifier changes
      html.find('[name="situational-modifier"]').on('input', (event) => {
        const situationalMod = parseInt(event.target.value) || 0;
        const target = wp + trackModifier + situationalMod;
        html.find('.target-display').val(target);
      });
    }
  });
  
  dialog.render(true);
}

/**
 * Execute insanity test and handle result.
 * 
 * @param {DeathwatchActor} actor - The character testing
 * @param {Object} testData - Test parameters
 * @param {number} testData.wp - Base willpower
 * @param {number} testData.trackModifier - Track level modifier
 * @param {number} testData.situationalMod - Situational modifier
 * @param {number} testData.finalTarget - Final target number
 * @param {number} testData.threshold - Threshold crossed
 */
async function rollInsanityTest(actor, testData) {
  const { wp, trackModifier, situationalMod, finalTarget, threshold } = testData;
  
  const roll = await new Roll("1d100").evaluate();
  const success = roll.total <= finalTarget;
  const dos = Math.floor((finalTarget - roll.total) / ROLL_CONSTANTS.DEGREES_DIVISOR);
  
  // Update test record in history
  const history = actor.system.insanityHistory;
  const lastEntry = history[history.length - 1];
  lastEntry.testRolled = true;
  lastEntry.testResult = success ? `Success (${dos} DoS)` : `Failure (${Math.abs(dos)} DoF)`;
  lastEntry.testModifiers = {
    base: wp,
    track: trackModifier,
    situational: situationalMod,
    total: finalTarget
  };
  
  await actor.update({
    "system.insanityHistory": history,
    "system.lastInsanityTestAt": threshold
  });
  
  // Build modifier breakdown for chat
  const modifierBreakdown = [];
  modifierBreakdown.push(`Base WP: ${wp}`);
  if (trackModifier !== 0) {
    modifierBreakdown.push(`Track Modifier: ${trackModifier > 0 ? '+' : ''}${trackModifier}`);
  }
  if (situationalMod !== 0) {
    modifierBreakdown.push(`Situational: ${situationalMod > 0 ? '+' : ''}${situationalMod}`);
  }
  
  // Post result to chat
  const content = `
    <div class="insanity-test-result">
      <h3>Insanity Test</h3>
      <p><strong>${actor.name}</strong> tests Willpower to resist mental trauma.</p>
      <div class="test-breakdown">
        ${modifierBreakdown.map(m => `<div>${m}</div>`).join('')}
        <div class="test-total"><strong>Target: ${finalTarget}</strong></div>
      </div>
      <p class="roll-result">Roll: <strong>${roll.total}</strong> | ${success ? 'Success' : 'Failure'} (${Math.abs(dos)} ${dos >= 0 ? 'DoS' : 'DoF'})</p>
      ${success 
        ? '<p class="success">✓ The Battle-Brother resists the trauma.</p>'
        : '<p class="failure">✗ The Battle-Brother\'s mind fractures...</p>'}
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    roll: roll,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  });
  
  // If failed, roll for trauma
  if (!success) {
    await rollBattleTrauma(actor);
  }
}
```

### Battle Trauma Acquisition

**Trigger**: Failed insanity test

**Process**:
1. Roll on Battle Trauma RollTable (d10)
2. RollTable.draw() returns a trauma item reference
3. Check if character already has that trauma
4. If duplicate, reroll (max 20 attempts to prevent infinite loop)
5. Add trauma item to character
6. Post trauma acquisition to chat (RollTable handles this)

**Implementation** (using Foundry RollTable):
```javascript
/**
 * Roll for a battle trauma and add it to the character.
 * Uses Foundry's RollTable system for natural integration.
 * 
 * @param {DeathwatchActor} actor - The character gaining trauma
 */
async function rollBattleTrauma(actor) {
  const existingTraumas = actor.items.filter(i => i.type === "battle-trauma");
  const existingKeys = new Set(existingTraumas.map(t => t.system.key));
  
  // Get Battle Trauma RollTable
  const tablePack = game.packs.get("deathwatch.roll-tables");
  const table = tablePack 
    ? await tablePack.getDocument(tablePack.index.find(t => t.name === "Battle Trauma Table")?._id)
    : game.tables.getName("Battle Trauma Table");
  
  if (!table) {
    ui.notifications.error("Battle Trauma Table not found!");
    return;
  }
  
  let attempts = 0;
  let selectedTrauma = null;
  
  // Roll until we get a non-duplicate (with safety limit)
  while (!selectedTrauma && attempts < BATTLE_TRAUMA.MAX_REROLL_ATTEMPTS) {
    // Draw from table (rolls d10 and looks up result)
    const draw = await table.draw({ displayChat: false });
    const result = draw.results[0];
    
    // Get the trauma item from the table result
    // RollTable results can reference compendium items directly
    let traumaItem;
    if (result.documentCollection && result.documentId) {
      const pack = game.packs.get(result.documentCollection);
      traumaItem = await pack.getDocument(result.documentId);
    }
    
    if (!traumaItem) {
      ui.notifications.error(`Could not find trauma item for result: ${result.text}`);
      return;
    }
    
    // Check for duplicate
    if (!existingKeys.has(traumaItem.system.key)) {
      selectedTrauma = traumaItem;
      
      // Post the roll result to chat (with trauma details)
      await draw.toMessage({
        flavor: `<h3>Battle Trauma - ${actor.name}</h3>`,
        speaker: ChatMessage.getSpeaker({ actor })
      });
    } else {
      attempts++;
      ui.notifications.info(`${actor.name} already has ${traumaItem.name}, rerolling...`);
    }
  }
  
  if (!selectedTrauma) {
    ui.notifications.warn(`${actor.name} has all possible battle traumas!`);
    return;
  }
  
  // Add trauma to character
  await actor.createEmbeddedDocuments("Item", [selectedTrauma.toObject()]);
  
  // Optional: Post additional details to chat
  const content = `
    <div class="battle-trauma-gained">
      <h3>Battle Trauma Gained</h3>
      <p><strong>${actor.name}</strong> has gained a Battle Trauma:</p>
      <h4>${selectedTrauma.name}</h4>
      <div class="trauma-description">${selectedTrauma.system.description}</div>
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}
```

### Primarch's Curse Progression

**Activation**: Automatic when insanity reaches threshold

**Levels**:
- **Level 1**: 31-60 IP — Minor manifestation
- **Level 2**: 61-90 IP — Moderate manifestation
- **Level 3**: 91-99 IP — Severe manifestation

**Implementation**:
The Primarch's Curse item is attached to the character's chapter item (or directly to character). The active level is computed in `prepareDerivedData()` and effects are collected by the modifier system.

```javascript
/**
 * Get Primarch's Curse level for a given insanity value.
 * 
 * @param {number} insanityPoints - Current insanity points
 * @returns {number} Curse level (0-3)
 */
function getCurseLevel(insanityPoints) {
  if (insanityPoints < INSANITY_TRACK.THRESHOLD_1) return 0;
  if (insanityPoints < INSANITY_TRACK.THRESHOLD_2) return 1;
  if (insanityPoints < INSANITY_TRACK.THRESHOLD_3) return 2;
  if (insanityPoints < INSANITY_TRACK.REMOVAL) return 3;
  return 0; // Removed from play, curse no longer relevant
}
```

**Curse Effects Collection** (in `modifier-collector.mjs`):
```javascript
/**
 * Collect modifiers from active Primarch's Curse level.
 * 
 * @param {DeathwatchActor} actor - The character
 * @returns {Array} Array of modifier objects
 */
function collectPrimarchsCurseModifiers(actor) {
  const modifiers = [];
  const curseLevel = actor.system.primarchsCurseLevel;
  
  if (curseLevel === 0) return modifiers;
  
  // Find character's chapter
  const chapter = actor.items.find(i => i.type === "chapter");
  if (!chapter || !chapter.system.hasCurse()) return modifiers;
  
  // Get active level data from chapter
  const levelData = chapter.system.getActiveCurseLevel(actor.system.insanity);
  
  if (!levelData) return modifiers;
  
  // Apply level effects
  switch (levelData.effectType) {
    case "modifier":
      modifiers.push({
        value: levelData.modifier,
        target: levelData.target,
        source: `${chapter.system.curseName} (Level ${curseLevel})`,
        type: "primarchs-curse"
      });
      break;
      
    case "cohesionPenalty":
      // Handled separately in cohesion calculation
      break;
      
    case "fellowshipPenalty":
      // Conditional modifier applied during Fellowship tests
      modifiers.push({
        value: levelData.modifier,
        target: "fellowship",
        source: `${chapter.system.curseName} (Level ${curseLevel})`,
        type: "primarchs-curse",
        conditional: true,
        condition: levelData.description
      });
      break;
  }
  
  return modifiers;
}
```

---

## Integration with Existing Systems

### Psychic Powers and Perils of the Warp

When a psyker suffers Perils of the Warp, the result may include corruption or insanity:

**Perils Table Entries** (examples):
- Minor Perils (01-10): 1d5 Insanity Points
- Moderate Perils (11-50): 1d5 Insanity + 1d5 Corruption
- Major Perils (51-75): 1d10 Insanity + 1d10 Corruption
- Catastrophic Perils (76-100): 2d10 Insanity + 2d10 Corruption + daemon manifestation

**Implementation** (modify `psychic-combat.mjs`):
```javascript
async function resolvePerilsOfTheWarp(actor, roll) {
  const result = PERILS_TABLE[roll];
  
  // Apply insanity if specified
  if (result.insanity) {
    const insanityRoll = await new Roll(result.insanity).evaluate();
    await InsanityHelper.addInsanity(
      actor, 
      insanityRoll.total,
      `Perils of the Warp (${result.name})`
    );
  }
  
  // Apply corruption if specified
  if (result.corruption) {
    const corruptionRoll = await new Roll(result.corruption).evaluate();
    await CorruptionHelper.addCorruption(
      actor,
      corruptionRoll.total,
      `Perils of the Warp (${result.name})`
    );
  }
  
  // ... rest of perils resolution
}
```

### Cohesion System

Primarch's Curse Level 2+ may reduce squad cohesion:

**Implementation** (modify `cohesion.mjs`):
```javascript
function calculateMaxCohesion() {
  // ... existing calculation
  
  // Apply Primarch's Curse cohesion penalties
  const squadMembers = getSquadMembers();
  for (const member of squadMembers) {
    const chapter = member.items.find(i => i.type === "chapter");
    if (chapter && chapter.system.hasCurse()) {
      const levelData = chapter.system.getActiveCurseLevel(member.system.insanity);
      if (levelData?.cohesionPenalty) {
        maxCohesion -= levelData.cohesionPenalty;
      }
    }
  }
  
  return Math.max(0, maxCohesion);
}
```

### Fellowship Tests

High corruption or Primarch's Curse effects may penalize Fellowship:

**Implementation** (in characteristic test dialog):
```javascript
async function rollCharacteristicTest(actor, characteristic) {
  let modifiers = [];
  
  // Apply corruption penalties (narrative, optional)
  if (characteristic === "fel" && actor.system.corruption >= 50) {
    const penalty = Math.floor((actor.system.corruption - 50) / 25) * -10;
    modifiers.push({
      name: "High Corruption",
      value: penalty
    });
  }
  
  // Apply Primarch's Curse penalties
  const chapter = actor.items.find(i => i.type === "chapter");
  if (chapter && chapter.system.hasCurse()) {
    const levelData = chapter.system.getActiveCurseLevel(actor.system.insanity);
    if (levelData?.effectType === "fellowshipPenalty") {
      modifiers.push({
        name: `${chapter.system.curseName} (Level ${actor.system.primarchsCurseLevel})`,
        value: levelData.modifier
      });
    }
  }
  
  // ... proceed with test
}
```

### Battle Trauma Triggers

Some traumas trigger during specific actions:

**Battle Rage** (triggers on Righteous Fury):

From Core Rulebook p. 217:
> "Whenever the Battle-Brother scores Righteous Fury on a foe, he becomes fixated on its destruction and must kill it. The Space Marine must then direct his attacks against this target to the exclusion of all else until it is slain. When Battle Rage is triggered, the Battle-Brother may make a Challenging (+0) Willpower Test to avoid its effects."

```javascript
// In righteous-fury-helper.mjs
async function confirmRighteousFury(actor, target, weaponData) {
  // ... existing fury confirmation logic
  
  // Check for Battle Rage trauma
  const battleRage = actor.items.find(i => 
    i.type === "battle-trauma" && 
    i.system.key === "battle-rage"
  );
  
  if (battleRage) {
    // Prompt WP test to resist fixation
    await promptBattleRageResistTest(actor, target, battleRage);
  }
}

/**
 * Prompt Battle-Brother to resist Battle Rage fixation.
 * 
 * @param {DeathwatchActor} actor - The character with Battle Rage
 * @param {Token} target - The target that triggered Righteous Fury
 * @param {Item} battleRage - The Battle Rage trauma item
 */
async function promptBattleRageResistTest(actor, target, battleRage) {
  const wp = actor.system.characteristics.wp.total;
  const difficulty = battleRage.system.resistDifficulty || "challenging"; // +0
  const modifier = RESIST_DIFFICULTY_MODIFIERS[difficulty];
  const targetNumber = wp + modifier;
  
  const content = `
    <div class="battle-rage-test">
      <h3>Battle Rage Triggered!</h3>
      <p><strong>${actor.name}</strong> has scored Righteous Fury against <strong>${target.name}</strong>.</p>
      <p>The Battle-Brother's rage threatens to consume him.</p>
      
      <div class="test-info">
        <p>Willpower: ${wp}</p>
        <p>Difficulty: ${difficulty} (${modifier > 0 ? '+' : ''}${modifier})</p>
        <p><strong>Target: ${targetNumber}</strong></p>
      </div>
      
      <p class="warning">If you fail, you must focus all attacks on ${target.name} until it is slain.</p>
    </div>
  `;
  
  const dialog = new Dialog({
    title: "Battle Rage - Resist Test",
    content,
    buttons: {
      roll: {
        label: "Roll to Resist",
        callback: async () => {
          const roll = await new Roll("1d100").evaluate();
          const success = roll.total <= targetNumber;
          
          await postBattleRageTestResult(actor, target, roll, success, targetNumber);
          
          if (!success) {
            // Failed - apply fixation
            await applyBattleRageFixation(actor, target);
          }
        }
      },
      accept: {
        label: "Accept Fixation",
        callback: async () => {
          // Player chooses to embrace the rage
          await applyBattleRageFixation(actor, target);
        }
      }
    },
    default: "roll"
  });
  
  dialog.render(true);
}

/**
 * Apply Battle Rage fixation effect to actor.
 * Marks the actor as fixated on a specific target.
 * 
 * @param {DeathwatchActor} actor - The character with Battle Rage
 * @param {Token} target - The target to fixate on
 */
async function applyBattleRageFixation(actor, target) {
  // Apply Active Effect to track fixation
  const effectData = {
    name: "Battle Rage: Fixated",
    icon: "systems/deathwatch/assets/icons/battle-rage-active.svg",
    origin: actor.uuid,
    duration: {
      // Lasts until manually removed (when target dies)
    },
    flags: {
      deathwatch: {
        battleRage: {
          targetId: target.id,
          targetUuid: target.document.uuid,
          targetName: target.name
        }
      }
    },
    changes: [] // No stat changes, purely behavioral
  };
  
  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  
  // Post notification to chat
  const content = `
    <div class="battle-rage-fixation">
      <h3>⚔ Battle Rage Fixation</h3>
      <p><strong>${actor.name}</strong> becomes consumed with rage!</p>
      <p>The Battle-Brother is fixated on destroying <strong>${target.name}</strong>.</p>
      <p class="effect">All attacks must be directed at ${target.name} until it is slain.</p>
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    whisper: game.users.filter(u => u.isGM).map(u => u.id) // GM only
  });
  
  // Visual indicator on token
  if (actor.token) {
    await actor.token.toggleEffect("systems/deathwatch/assets/icons/battle-rage-active.svg", { 
      active: true, 
      overlay: false 
    });
  }
  
  ui.notifications.warn(`${actor.name} is fixated on ${target.name}!`);
}

/**
 * Check if actor is fixated due to Battle Rage.
 * Called during attack targeting to enforce fixation.
 * 
 * @param {DeathwatchActor} actor - The attacking character
 * @param {Token} intendedTarget - The target being attacked
 * @returns {boolean} True if attack is allowed, false if fixation prevents it
 */
function checkBattleRageFixation(actor, intendedTarget) {
  const fixationEffect = actor.effects.find(e => 
    e.name === "Battle Rage: Fixated"
  );
  
  if (!fixationEffect) return true; // No fixation, attack allowed
  
  const fixatedTargetId = fixationEffect.flags.deathwatch?.battleRage?.targetId;
  
  if (intendedTarget.id === fixatedTargetId) {
    return true; // Attacking fixated target, allowed
  }
  
  // Attacking different target - check if fixated target still alive
  const fixatedTarget = canvas.tokens.get(fixatedTargetId);
  
  if (!fixatedTarget || fixatedTarget.actor.system.wounds.value <= 0) {
    // Fixated target is dead/gone, remove effect
    fixationEffect.delete();
    ui.notifications.info(`${actor.name} is no longer fixated (target eliminated).`);
    return true;
  }
  
  // Fixated target still alive, must attack it
  ui.notifications.error(
    `${actor.name} is fixated on ${fixatedTarget.name} and cannot attack other targets!`
  );
  return false;
}

/**
 * Post Battle Rage resist test result to chat.
 */
async function postBattleRageTestResult(actor, target, roll, success, targetNumber) {
  const dos = Math.floor((targetNumber - roll.total) / ROLL_CONSTANTS.DEGREES_DIVISOR);
  
  const content = `
    <div class="battle-rage-test-result">
      <h3>Battle Rage - Resist Test</h3>
      <p><strong>${actor.name}</strong> attempts to resist fixation on ${target.name}.</p>
      <p>Target: ${targetNumber} | Roll: ${roll.total} | ${success ? 'Success' : 'Failure'} (${Math.abs(dos)} ${dos >= 0 ? 'DoS' : 'DoF'})</p>
      ${success 
        ? `<p class="success">✓ ${actor.name} resists the rage and maintains control.</p>`
        : `<p class="failure">✗ ${actor.name} succumbs to Battle Rage and fixates on ${target.name}!</p>`}
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    roll: roll,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  });
}

/**
 * Helper to get resist difficulty modifier.
 */
const RESIST_DIFFICULTY_MODIFIERS = {
  easy: 30,
  routine: 20,
  ordinary: 10,
  challenging: 0,
  difficult: -10,
  hard: -20,
  veryHard: -30
};
```

**Integration with Combat System**:

In weapon attack handlers, check for Battle Rage fixation:

```javascript
// In weapon-handlers.mjs or ranged-combat.mjs
async function performWeaponAttack(actor, weapon, target) {
  // Check Battle Rage fixation
  if (!checkBattleRageFixation(actor, target)) {
    ui.notifications.error("Cannot attack - Battle Rage fixation active!");
    return;
  }
  
  // ... proceed with attack
}
```

---

## GM Tools

### Manual Point Adjustment

GMs can manually add/remove corruption or insanity points:

**UI**: Right-click actor portrait → "Adjust Corruption/Insanity"

**Dialog**:
```javascript
async function adjustInsanityCorruption(actor) {
  const content = `
    <form>
      <div class="form-group">
        <label>Corruption Points:</label>
        <input type="number" name="corruption" value="0" />
        <p class="hint">Positive to add, negative to remove</p>
      </div>
      <div class="form-group">
        <label>Insanity Points:</label>
        <input type="number" name="insanity" value="0" />
      </div>
      <div class="form-group">
        <label>Reason:</label>
        <input type="text" name="reason" placeholder="GM adjustment" />
      </div>
    </form>
  `;
  
  new Dialog({
    title: `Adjust ${actor.name}'s Corruption/Insanity`,
    content,
    buttons: {
      apply: {
        label: "Apply",
        callback: async (html) => {
          const corruption = parseInt(html.find('[name="corruption"]').val());
          const insanity = parseInt(html.find('[name="insanity"]').val());
          const reason = html.find('[name="reason"]').val() || "GM adjustment";
          
          if (corruption !== 0) {
            await CorruptionHelper.addCorruption(actor, corruption, reason);
          }
          
          if (insanity !== 0) {
            await InsanityHelper.addInsanity(actor, insanity, reason);
          }
        }
      }
    }
  }).render(true);
}
```

### History Log Viewing

GMs and players can view detailed history:

**UI**: Click "View History" button on character sheet

**Dialog**: Shows table of all corruption/insanity gains with timestamps, sources, and mission links

### Reset/Cleansing

For narrative cleansing rituals, GMs can reset points:

**Corruption Cleansing**: Reduce corruption by X points, add history entry
**Trauma Removal**: Remove specific trauma item, add note to history
**Full Reset**: Nuclear option for special circumstances (extremely rare)

---

## Chat Integration

All corruption/insanity gains post to chat:

**Corruption Message**:
```
╔═══════════════════════════════════╗
║ CORRUPTION                        ║
╠═══════════════════════════════════╣
║ Brother Alaric gains 5 CP         ║
║ Source: Perils of the Warp        ║
║ Total: 47 CP                      ║
╚═══════════════════════════════════╝
```

**Insanity Message** (with test trigger):
```
╔═══════════════════════════════════╗
║ INSANITY                          ║
╠═══════════════════════════════════╣
║ Brother Alaric gains 8 IP         ║
║ Source: Daemon manifestation      ║
║ Total: 42 IP (Track Level 2)      ║
║ ⚠ INSANITY TEST REQUIRED          ║
╚═══════════════════════════════════╝
[Roll Insanity Test]
```
