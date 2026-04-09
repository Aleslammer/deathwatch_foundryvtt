# Advanced Features & Future Enhancements

This document outlines potential enhancements beyond the core cover system. These features add complexity and should be evaluated carefully before implementation.

---

## 1. Directional Cover

### Problem

Current system: Cover provides protection regardless of attack direction. A character behind a wall gets cover even if shot from behind.

### Solution

Add direction awareness to cover regions. Cover only applies if the character is between the cover and the attacker.

### Implementation Approach

**Region Configuration**:
```javascript
// Add to cover behavior schema
direction: new fields.NumberField({
  label: 'Wall Facing',
  hint: 'Direction wall faces (0=north, 90=east, 180=south, 270=west)',
  initial: 0,
  min: 0,
  max: 359
})
```

**Geometry Calculation**:
```javascript
/**
 * Check if cover applies based on attacker position.
 * Returns true if defender is between attacker and wall.
 */
function isCoverEffective(defender, attacker, wallDirection) {
  // Calculate angle from attacker to defender
  const angle = Math.atan2(
    defender.y - attacker.y,
    defender.x - attacker.x
  ) * (180 / Math.PI);
  
  // Normalize to 0-360
  const normalizedAngle = (angle + 360) % 360;
  
  // Cover effective if attack comes from wall's facing direction ±90°
  const minAngle = (wallDirection - 90 + 360) % 360;
  const maxAngle = (wallDirection + 90) % 360;
  
  return isAngleInRange(normalizedAngle, minAngle, maxAngle);
}
```

**Integration Point**:
- Check during damage application in `combat.mjs`
- If cover is not effective, temporarily disable effect for this attack
- Re-enable after damage applied

**Complexity**: High
- Requires geometry calculations
- Need to track attacker during damage application (not currently stored)
- Edge cases: Area weapons, multiple attackers

**Benefits**:
- More realistic cover mechanics
- Encourages flanking tactics
- Adds tactical depth

---

## 2. Attack Roll Penalties

### Problem

Deathwatch rules (Core p. 246-247) specify that shooting at targets in cover imposes BS test penalties, not just armor bonuses.

Current system: Only applies armor bonuses.

### Solution

Add attack roll modifiers in addition to armor bonuses.

### Implementation Approach

**Cover Type Definition** (update):
```javascript
HIGH_WALL: {
  key: 'high-wall',
  name: 'High Wall',
  armorBonus: 4,
  attackPenalty: -10,  // NEW
  locations: ['rightLeg', 'leftLeg', 'body'],
  description: 'Protects legs and body (-10 to hit)'
}
```

**Suggested Penalties** (based on Deathwatch Core):
- Low Wall: -0 (minimal obstruction)
- High Wall: -10 (partial obstruction)
- Full Cover: -20 (must expose to shoot)
- Reinforced: -20 (heavy obstruction)

**Integration Point**:
- Modify `ranged-combat.mjs` → `performRangedAttack()`
- Check if target has cover effects
- Add penalty modifiers to attack dialog
- Display in modifier list: "Target in Cover: -10"

**Complexity**: Medium
- Requires modifying attack roll dialog
- Need to query target's active effects during attacker's roll
- Must handle multiple cover sources (use highest penalty)

**Benefits**:
- More faithful to Deathwatch rules
- Makes cover more impactful (harder to hit AND harder to damage)
- Balances risk/reward (shooting from cover = easier to be hit back?)

**Design Question**: Does shooting FROM cover also impose penalty on the shooter?
- Option A: Yes (realistic, but discourages cover use)
- Option B: No (encourages cover use, simpler)
- Option C: Shooting from Full Cover = penalty, others = no penalty

---

## 3. Cover Penetration

### Problem

Some weapons should ignore or reduce cover effectiveness:
- Plasma weapons (melt through obstacles)
- Power weapons (cleave through barriers)
- Indirect fire (arc over cover)
- Flamers (fill area, bypass physical barriers)

### Solution

Add weapon properties that reduce or negate cover bonuses.

### Implementation Approach

**Weapon Fields** (add to weapon data model):
```javascript
ignoresCover: new fields.BooleanField({
  label: 'Ignores Cover',
  hint: 'This weapon completely ignores cover armor bonuses',
  initial: false
}),

coverPenetration: new fields.NumberField({
  label: 'Cover Penetration',
  hint: 'Reduces cover armor bonus by this amount',
  initial: 0,
  min: 0
})
```

**Example Weapon Values**:
- Plasma Weapons: `coverPenetration: 4` (reduces light/medium cover significantly)
- Power Weapons: `coverPenetration: 2` (cleaves through some materials)
- Flamers: `ignoresCover: true` (fills area regardless of barriers)
- Missiles (indirect): `ignoresCover: true` (arcs over cover)

**Integration Point**:
- Modify `combat.mjs` → `applyDamage()`
- Check weapon's cover penetration properties
- Reduce or ignore cover armor bonus before damage calculation

```javascript
function calculateEffectiveCover(coverBonus, weapon) {
  if (weapon.system.ignoresCover) {
    return 0;
  }
  
  const penetration = weapon.system.coverPenetration || 0;
  return Math.max(0, coverBonus - penetration);
}
```

**Complexity**: Low
- Simple numeric properties
- Straightforward integration into damage calculation
- No UI changes needed (properties set in compendium)

**Benefits**:
- Weapon variety (different weapons for different situations)
- Tactical decisions (bring plasma vs. cover-heavy enemies)
- Faithful to lore (plasma melts through walls)

---

## 4. Cover Destruction

### Problem

In Deathwatch, heavy weapons can destroy cover. A lascannon can blow through a wall, removing its protective value.

Current system: Cover is permanent until GM manually disables region.

### Solution

Add hit points to cover regions. Track damage dealt to cover. When destroyed, disable region.

### Implementation Approach

**Region Flags** (add to cover behavior):
```javascript
static defineSchema() {
  return {
    coverType: new fields.StringField({ ... }),
    
    // NEW: Cover durability
    maxHitPoints: new fields.NumberField({
      label: 'Cover Hit Points',
      hint: 'How much damage before cover is destroyed (0 = indestructible)',
      initial: 0,
      min: 0
    }),
    
    currentHitPoints: new fields.NumberField({
      label: 'Current HP',
      initial: 0
    }),
    
    destroyed: new fields.BooleanField({
      label: 'Destroyed',
      initial: false
    })
  };
}
```

**Suggested HP Values**:
- Low Wall (sandbags, wood): 20 HP
- High Wall (stone, ferrocrete): 50 HP
- Full Cover (rockcrete): 80 HP
- Reinforced (bunker, vehicle): 150 HP
- 0 HP = indestructible (default)

**Damage Routing**:
When attack misses character but hits region area:
1. Check if shot intersects region boundaries
2. Apply damage to region's HP
3. If HP depleted, mark region as destroyed
4. Disable cover behavior
5. Change region appearance (gray out, add destruction marker)
6. Chat message: "Cover destroyed! [Region name] is no longer effective"

**GM Controls**:
- Button in region config: "Repair Cover" (restores HP)
- Setting: Auto-repair after combat ends
- Macro: "Repair All Cover" (resets scene cover)

**Complexity**: Very High
- Requires damage interception system
- Miss calculations (where did shot go?)
- HP tracking across sessions (stored in region flags)
- UI for showing cover damage state
- Particle effects for destruction (optional)

**Benefits**:
- Dynamic battlefields (cover changes during combat)
- Heavy weapons feel more impactful
- Tactical decisions (destroy cover vs. shoot enemies)
- Emergent scenarios (enemies lose cover, must move)

**Challenges**:
- How to target cover intentionally? (New attack action: "Shoot Cover")
- How to determine which region was hit on a miss?
- Performance (region checks on every attack)

---

## 5. Degrading Cover

### Extension of Cover Destruction

Instead of binary (intact/destroyed), cover degrades gradually.

### Implementation Approach

**Cover States**:
- 100-75% HP: Full armor bonus
- 74-50% HP: 75% armor bonus (rounded down)
- 49-25% HP: 50% armor bonus
- 24-1% HP: 25% armor bonus
- 0% HP: Destroyed

**Visual Feedback**:
- Change region opacity/color based on HP
- Add crack overlays as damage accumulates

**Complexity**: Medium (if cover destruction already implemented)

**Benefits**:
- More granular battlefield changes
- Less binary (cover doesn't instantly disappear)
- Visual feedback of damage

---

## 6. Deployable Cover

### Problem

Space Marines can deploy portable cover (shield generators, deployable barriers).

### Solution

Allow items to create temporary cover regions.

### Implementation Approach

**Item Type**: "Deployable"
```javascript
// New item type: Deployable
{
  type: 'deployable',
  name: 'Portable Shield Generator',
  system: {
    coverType: 'high-wall',
    duration: 10, // rounds
    range: 5, // meters
    deployed: false
  }
}
```

**Deployment Flow**:
1. Character uses item (from hotbar or sheet)
2. Dialog: "Place shield generator" (GM clicks location)
3. System creates temporary region at location
4. Region has duration (auto-deletes after X rounds)
5. Appears in combat tracker: "Shield Generator (8 rounds remaining)"

**Integration**:
- Use existing cover behavior system
- Add `temporary: true` flag to region
- Hook into combat turn to decrement duration
- Auto-delete region when duration expires

**Complexity**: High
- Requires item-to-region creation logic
- Combat tracking integration
- UI for placement
- Duration management

**Benefits**:
- Tactical tool for players
- Encourages proactive planning
- Matches Deathwatch lore (Tech-Marines, equipment)

**Examples**:
- Portable Shield Generator (High Wall, 10 rounds, AP 4)
- Deployable Barricade (Low Wall, permanent until destroyed)
- Smoke Grenade (concealment, not armor) - See Enhancement #7

---

## 7. Concealment vs. Cover

### Problem

Deathwatch distinguishes between:
- **Cover**: Physical protection (armor bonus)
- **Concealment**: Visual obstruction (penalty to hit, no armor)

Examples: Smoke, fog, darkness, tall grass

### Solution

Add "Concealment" region type separate from cover.

### Implementation Approach

**New Region Behavior**: `ConcealmentRegionBehavior`
- Provides attack penalty but NO armor bonus
- Applies to ranged attacks only (melee unaffected)
- Stacks with cover (can have both cover + concealment)

**Concealment Types**:
- Light Concealment: -10 to hit (smoke, fog)
- Heavy Concealment: -20 to hit (thick smoke, darkness)
- Total Concealment: -30 to hit (pitch black, dense fog)

**Active Effect Structure**:
```javascript
{
  name: 'Concealment: Smoke',
  flags: {
    deathwatch: {
      concealment: true,
      attackPenalty: -20
    }
  }
}
```

**Integration**:
- Check concealment during attack roll (not damage)
- Add penalty to BS test
- Display in attack dialog: "Target Concealed: -20"

**Complexity**: Medium (similar to cover system)

**Benefits**:
- Distinguishes smoke from walls (different tactical uses)
- Smoke grenades become valuable
- More tactical options (concealment + cover = very hard to hit)

**Interaction with Cover**:
- Cover provides armor, concealment provides attack penalty
- Can have both simultaneously
- Example: Behind wall (cover) in smoke (concealment) = hard to hit AND hard to damage

---

## 8. Line of Sight Integration

### Problem

Current system: Cover applies even if attacker has clear line of sight from advantageous angle.

### Solution

Only apply cover if cover object is between attacker and defender.

### Implementation Approach

**LOS Check**:
```javascript
function isCoverBetweenTokens(attacker, defender, coverRegion) {
  // Cast ray from attacker to defender
  const ray = new Ray(attacker.center, defender.center);
  
  // Check if ray intersects cover region
  return coverRegion.shape.intersects(ray);
}
```

**Integration**:
- Check during damage application
- Iterate through defender's cover effects
- For each effect, find corresponding region
- If region not between attacker and defender, ignore that effect
- Apply only applicable cover bonuses

**Complexity**: Very High
- Requires 2D geometry calculations
- Region shape intersection detection
- Performance concerns (calculate on every attack)
- Edge cases: Partial cover, multiple attackers, area weapons

**Benefits**:
- Most realistic cover system
- Encourages flanking (cover useless from behind)
- Rewards positioning and tactics

**Performance Optimization**:
- Cache LOS calculations per round
- Only recalculate when tokens move
- Use Foundry's built-in wall detection if possible

---

## 9. Cover Macros & Automation

### Macro: Highlight Cover Regions

Shows all cover regions on current scene with overlay labels.

```javascript
// Macro: Show All Cover
const regions = canvas.regions.placeables.filter(r => 
  r.document.behaviors.some(b => b.type === 'deathwatch.cover')
);

for (const region of regions) {
  const behavior = region.document.behaviors.find(b => b.type === 'deathwatch.cover');
  const coverType = behavior.coverType;
  
  // Highlight region and add floating label
  region.control({ releaseOthers: false });
  
  // TODO: Add label overlay showing cover type
}

ui.notifications.info(`Found ${regions.length} cover regions`);
```

### Macro: Cover Report

Lists all characters currently in cover.

```javascript
// Macro: Cover Report
const tokens = canvas.tokens.placeables;
const report = [];

for (const token of tokens) {
  const coverEffects = token.actor.effects.filter(e => 
    e.flags?.deathwatch?.coverRegionId
  );
  
  if (coverEffects.length > 0) {
    const coverTypes = coverEffects.map(e => e.name).join(', ');
    report.push(`${token.name}: ${coverTypes}`);
  }
}

if (report.length === 0) {
  ui.notifications.info('No tokens currently in cover');
} else {
  ChatMessage.create({
    content: `<h3>Cover Report</h3><ul><li>${report.join('</li><li>')}</li></ul>`
  });
}
```

### Macro: Quick Cover Toggle

Manually toggle cover on selected token (for edge cases).

```javascript
// Macro: Toggle Cover (Manual)
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Select a token first');
  return;
}

const hasCover = token.actor.effects.some(e => e.flags?.deathwatch?.coverRegionId);

if (hasCover) {
  // Remove all cover effects
  const coverEffects = token.actor.effects.filter(e => 
    e.flags?.deathwatch?.coverRegionId
  );
  await token.actor.deleteEmbeddedDocuments('ActiveEffect', coverEffects.map(e => e.id));
  ui.notifications.info('Cover removed');
} else {
  // Apply low wall cover manually
  await token.actor.createEmbeddedDocuments('ActiveEffect', [{
    name: 'Manual Cover: Low Wall',
    icon: 'icons/svg/shield.svg',
    changes: [
      { key: 'system.armor.rightLeg', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2 },
      { key: 'system.armor.leftLeg', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2 }
    ],
    flags: {
      deathwatch: { coverRegionId: 'manual' }
    }
  }]);
  ui.notifications.info('Cover applied');
}
```

---

## 10. Custom Cover Types

### Extension Mechanism

Allow module developers or GMs to define custom cover types.

### Implementation Approach

**World Settings**:
```javascript
game.settings.register('deathwatch', 'customCoverTypes', {
  name: 'Custom Cover Types',
  hint: 'JSON array of custom cover type definitions',
  scope: 'world',
  config: true,
  type: String,
  default: '[]'
});
```

**Merge with Default Types**:
```javascript
function getAllCoverTypes() {
  const defaults = COVER_TYPES;
  const customJSON = game.settings.get('deathwatch', 'customCoverTypes');
  const custom = JSON.parse(customJSON);
  
  return { ...defaults, ...custom };
}
```

**Example Custom Type**:
```json
{
  "ENERGY_BARRIER": {
    "key": "energy-barrier",
    "name": "Energy Barrier",
    "armorBonus": 6,
    "locations": ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"],
    "description": "Force field provides full protection"
  }
}
```

**Complexity**: Low

**Benefits**:
- Extensibility without code changes
- Campaign-specific cover types
- Module developers can add themed cover

---

## Implementation Priority

**Phase 1** (Core System):
- ✅ Basic omnidirectional cover
- ✅ Active Effect integration
- ✅ Four cover types

**Phase 2** (Polish):
- Attack roll penalties (#2) - Medium complexity, high impact
- Cover penetration (#3) - Low complexity, good variety

**Phase 3** (Advanced Tactics):
- Directional cover (#1) - High complexity, realistic
- Concealment system (#7) - Medium complexity, tactical depth

**Phase 4** (Dynamic Battlefield):
- Cover destruction (#4) - Very high complexity, dramatic
- Degrading cover (#5) - Extension of #4

**Phase 5** (Player Tools):
- Deployable cover (#6) - High complexity, player-facing
- Cover macros (#9) - Low complexity, QOL

**Optional**:
- LOS integration (#8) - Very high complexity, diminishing returns
- Custom cover types (#10) - Low complexity, extensibility

---

## Design Principles for Enhancements

1. **Simplicity First**: Core system should work without enhancements
2. **Optional Complexity**: Each enhancement should be toggleable via setting
3. **Performance Aware**: No enhancement should cause lag during normal play
4. **Testable**: Each enhancement needs unit tests
5. **Documented**: Each enhancement needs user guide section
6. **GM Control**: GM should be able to enable/disable features per-scene or per-world
