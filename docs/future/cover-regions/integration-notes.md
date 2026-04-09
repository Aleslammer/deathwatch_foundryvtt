# Integration Notes

This document details how the cover regions system integrates with existing Deathwatch system components.

---

## Armor System Integration

### Current Armor Architecture

**Character/NPC Actors**:
- Armor stored by hit location: `system.armor.{location}`
- Locations: `head`, `body`, `rightArm`, `leftArm`, `rightLeg`, `leftLeg`
- Each location has separate armor value
- Armor items equipped modify these values

**Horde Actors**:
- Single armor value: `system.armor` (number, not object)
- No hit locations (swarm nature)

### How Cover Integrates

**Active Effect Path**:
```javascript
// Cover Active Effect
changes: [
  { key: 'system.armor.rightLeg', mode: ADD, value: 2 }
]
```

**Data Flow**:
1. Active Effect applied to actor
2. Foundry core recalculates derived data
3. Actor data model's `prepareBaseData()` runs
4. Armor values updated with effect bonuses
5. Character sheet displays updated values
6. Combat system uses updated values automatically

**Key Point**: No changes needed to combat.mjs or damage calculation. Active Effects integrate automatically.

### Horde Compatibility

**Problem**: Hordes have single armor value, cover system targets specific locations.

**Solution Options**:

**Option 1 - No Horde Cover (Recommended)**:
```javascript
// In CoverHelper.applyCover()
if (actor.type === 'horde') {
  Logger.debug('COVER', 'Hordes do not benefit from cover');
  return;
}
```
- Simplest implementation
- Justified by lore (swarm can't all hide)
- Hordes already have high armor values for balance

**Option 2 - Highest Location Bonus**:
```javascript
// Apply highest bonus from any protected location
const bonus = Math.max(...coverType.locations.map(loc => coverType.armorBonus));
changes: [{ key: 'system.armor', mode: ADD, value: bonus }]
```
- Horde gets single armor increase
- Uses highest applicable bonus

**Option 3 - Average Location Bonus**:
```javascript
// Average bonus across all locations
const avgBonus = Math.floor(coverType.armorBonus * coverType.locations.length / 6);
changes: [{ key: 'system.armor', mode: ADD, value: avgBonus }]
```
- More balanced (partial coverage = partial bonus)
- More complex calculation

**Recommendation**: Option 1 for initial implementation. Add setting later if needed:
```javascript
game.settings.register('deathwatch', 'hordeCover', {
  name: 'Hordes Benefit from Cover',
  scope: 'world',
  config: true,
  type: Boolean,
  default: false
});
```

---

## Hit Location System Integration

### Current Hit Location Architecture

**File**: `src/module/helpers/combat/combat.mjs`

**Hit Location Determination**:
```javascript
// Roll 1d100, compare to ranges
const roll = Math.floor(Math.random() * 100) + 1;

if (roll <= 10) return 'head';
else if (roll <= 20) return 'rightArm';
// ... etc
```

**Armor Lookup**:
```javascript
// Get armor for specific location
getArmorValue(location) {
  return this.system.armor[location] || 0;
}
```

### How Cover Integrates

**No Code Changes Required**:
- Active Effects modify `system.armor.{location}` directly
- `getArmorValue(location)` automatically returns modified value
- Hit location rolls work exactly as before
- Damage calculation unchanged

**Example Flow**:
1. Attack hits, rolls hit location: "rightLeg"
2. `getArmorValue('rightLeg')` called
3. Actor data model returns: base armor (10) + cover effect (+2) = 12
4. Damage reduced by 12 (plus toughness, minus penetration)
5. No special cover logic needed!

**Benefits**:
- Zero changes to existing combat code
- Testable (armor system already tested)
- Future-proof (any armor calculation improvements apply to cover)

---

## Combat System Integration

### Current Damage Flow

**File**: `src/module/helpers/combat/combat.mjs`

1. `performRangedAttack()` or `performMeleeAttack()`
2. Roll attack, determine hit location(s)
3. Post chat message with "Apply Damage" button
4. `applyDamage(attackData)` called when button clicked
5. `getArmorValue(location)` retrieves armor
6. Calculate damage reduction: `armor + toughnessBonus - penetration`
7. Apply wounds, check for critical damage

### How Cover Integrates

**At armor lookup step**:
```javascript
const armor = actor.getArmorValue(location); // Already includes cover!
```

**No other changes needed.**

### Future Enhancement: Cover-Aware Damage Messages

Currently: Chat shows base armor in damage summary.

Potential: Show armor breakdown:
```
Armor: 12 (Base: 10, Cover: +2)
```

**Implementation**:
```javascript
function getArmorBreakdown(actor, location) {
  const baseArmor = actor.system.armor[location];
  const coverEffects = actor.effects.filter(e => 
    e.flags?.deathwatch?.coverRegionId &&
    e.changes.some(c => c.key === `system.armor.${location}`)
  );
  const coverBonus = coverEffects.reduce((sum, e) => {
    const change = e.changes.find(c => c.key === `system.armor.${location}`);
    return sum + (change?.value || 0);
  }, 0);
  
  return { baseArmor, coverBonus, total: baseArmor + coverBonus };
}
```

---

## Weapon Qualities Integration

### Current Weapon Quality System

**File**: `src/module/helpers/combat/weapon-quality-helper.mjs`

**Pattern**: Each quality is a pure function
```javascript
export function applyTearing(damageRoll, weaponData, attackData) {
  // Reroll 1s on damage dice
  // Return modified roll
}
```

**Called**: During damage roll phase, before armor application

### How Cover Integrates

**No Integration Needed** (mostly):
- Weapon qualities modify damage dice
- Cover modifies armor
- Two separate systems, no overlap

**Exception**: Future "Cover Penetration" quality
```javascript
export function applyCoverPenetration(armorValue, weaponData, attackData) {
  const penetration = weaponData.system.coverPenetration || 0;
  
  // Reduce cover bonus (but not base armor)
  const coverBonus = getCoverBonus(attackData.defender, attackData.location);
  const reducedCover = Math.max(0, coverBonus - penetration);
  
  return armorValue - coverBonus + reducedCover;
}
```

This would require minor integration in `combat.mjs` damage calculation.

---

## Modifier System Integration

### Current Modifier System

**Files**:
- `src/module/helpers/character/modifier-collector.mjs` - Collects modifiers from items
- `src/module/helpers/character/modifiers.mjs` - Applies modifiers to characteristics

**Pattern**: Items have `modifier` field → collected → applied to actor data

**Types**:
- `characteristic` - +10 BS, +5 STR, etc.
- `skill` - +10 Awareness
- `armor` - +2 all armor, +4 body armor
- `wounds`, `initiative`, `psy-rating`, etc.

### How Cover Integrates

**Cover Does NOT Use Modifier System**:
- Modifiers are for persistent effects (talents, items, traits)
- Cover is temporary and position-based
- Active Effects are the correct mechanism

**Comparison**:

| Feature | Modifier System | Active Effects (Cover) |
|---------|----------------|----------------------|
| Source | Items, Talents, Traits | Regions, Temporary Buffs |
| Duration | Permanent (while item equipped) | Temporary (while in position) |
| Visibility | Item details | Effects tab |
| Application | Actor.prepareBaseData() | Foundry core applies |
| Use Case | Character build | Tactical positioning |

**No Integration Needed**: Two separate systems, different purposes.

---

## Cohesion System Integration

### Current Cohesion System

**File**: `src/module/helpers/cohesion.mjs`

- World-level resource stored in settings
- Squad Leader provides cohesion bonus
- Cohesion damage occurs on failed tests
- Rally actions restore cohesion

### How Cover Integrates

**No Direct Integration**:
- Cover is individual (per actor)
- Cohesion is team-wide (shared pool)
- Independent systems

**Potential Future Integration**:
- Squad Mode ability: "Coordinated Cover" - All squad members in cover get +1 AP bonus
- Cohesion cost: Spend 1 cohesion to grant temporary cover (deployable barrier)

**Not Planned for Initial Implementation**

---

## Psychic Powers Integration

### Current Psychic System

**File**: `src/module/helpers/combat/psychic-combat.mjs`

- Focus Power Test (WP-based roll)
- Psychic Phenomena / Perils of the Warp
- Opposed tests for mind-affecting powers

### How Cover Integrates

**Psychic Attack Powers**:
- Most psychic attacks ignore physical cover (energy-based)
- Recommendation: Psychic damage ignores cover bonuses

**Implementation**:
```javascript
// In damage application, check attack source
if (attackData.psychic) {
  // Ignore cover bonuses, use only base armor
  const baseArmor = actor.system.armor[location];
  // Don't add cover Active Effects
}
```

**Alternative**: Some psychic powers respect cover (Force Barrier projects physical barrier).

**Decision**: Tag psychic powers with `ignoresCover: true` flag in compendium. Default to ignoring.

---

## Fire System Integration

### Current Fire Mechanics

**Files**:
- `src/module/helpers/combat/fire-helper.mjs`
- On Fire status effect
- Flame weapons (cone targeting, auto-hit)

**Flow**:
1. Flame weapon attack (cone-based)
2. Targets make Agility dodge test
3. If failed: apply damage + catch fire test
4. On Fire status: 1d10 damage per round, ignore armor

### How Cover Integrates

**Question**: Does cover protect from flame weapons?

**Deathwatch Rules**: Flame weapons fill area, bypass some cover.

**Recommendation**:
- Flame weapons ignore cover AP bonus (fire flows around obstacles)
- Character still must make dodge test (cover provides concealment)
- Implementation: Flame weapons have `ignoresCover: true` flag

**Exception**: Reinforced cover (bunkers) should protect from flames.

**Implementation**:
```javascript
// In damage application
if (weaponData.quality === 'flame' && coverType !== 'reinforced') {
  // Ignore cover armor bonus
  armorValue -= coverBonus;
}
```

---

## Righteous Fury Integration

### Current Righteous Fury System

**File**: `src/module/helpers/combat/righteous-fury-helper.mjs`

- Triggered on attack roll of 95+
- Confirmation roll (auto-confirm vs xenos)
- Extra damage + critical effect

### How Cover Integrates

**Question**: Does Righteous Fury bypass cover?

**Deathwatch Rules**: Righteous Fury represents Emperor's wrath, supernatural effect.

**Recommendation**: Righteous Fury does NOT bypass cover.
- Cover is physical protection, not luck/skill-based
- Fury increases damage, but damage still reduced by armor
- Keeps cover meaningful even against powerful attacks

**No Code Changes Needed**: Armor calculation already handles this correctly.

**Alternative Opinion**: Fury could bypass cover (represents finding weak spot).
- Would require special handling in damage calculation
- Makes Fury even more powerful (balance concern)

---

## Critical Damage Integration

### Current Critical System

**File**: `src/module/helpers/combat/critical-effects.mjs`

- Triggered when damage exceeds remaining wounds
- Roll on critical table (Energy/Explosive/Impact/Rending)
- Effects vary by damage type and severity

### How Cover Integrates

**Question**: Does cover prevent critical hits?

**Answer**: Indirectly, yes.
- Cover reduces damage
- Less damage = less likely to exceed wounds
- But if damage DOES exceed wounds, critical happens normally

**No Special Integration Needed**: Current system works as-is.

**Result**: Cover makes criticals less likely but doesn't prevent them entirely. Good balance.

---

## Sheet Integration

### Current Sheet Architecture

**File**: `src/module/sheets/actor-sheet-v2.mjs`

- ApplicationV2 pattern
- Action handlers for buttons
- Effects tab shows Active Effects

### How Cover Integrates

**Effects Tab**:
- Cover effects appear automatically (Foundry feature)
- Shows name: "Cover: Low Wall"
- Shows icon: Shield
- Hover shows details (armor bonuses per location)

**No Changes Needed**: Active Effects automatically appear in effects list.

**Potential Enhancement**: Add cover icon to token
```javascript
// In CoverHelper.applyCover()
await token.document.update({
  'texture.tint': '#0088ff' // Blue tint for cover
});
```

**Or**: Add custom status effect
```javascript
await token.toggleEffect('icons/svg/shield.svg', { active: true, overlay: false });
```

---

## Performance Considerations

### Token Movement Frequency

**Concern**: Region behavior triggers on every token move.

**Analysis**:
- Foundry already does expensive work on token move (vision, lighting, collisions)
- Our code only adds:
  - Region boundary check (Foundry core, optimized)
  - Active Effect create/delete (~5-10ms)
- Only triggers on enter/exit (not continuous movement)

**Conclusion**: Negligible performance impact.

**Benchmark Test** (manual):
1. Create scene with 20 cover regions
2. Move token across scene rapidly
3. Monitor FPS and frame time
4. Compare with/without cover regions

**Expected**: <5% performance difference.

### Large Numbers of Regions

**Concern**: Scene with 50+ regions could slow region detection.

**Analysis**:
- Foundry uses spatial indexing for region collision detection
- Only checks nearby regions (not all 50)
- Our code only runs AFTER Foundry determines which region was entered

**Conclusion**: Foundry handles this. No special optimization needed.

**Best Practice**: GMs should combine adjacent regions where possible (e.g., one long wall = one region, not 5 small regions).

### Active Effect Recalculation

**Concern**: Creating/deleting effects triggers actor data recalculation.

**Analysis**:
- Foundry batches effect changes (doesn't recalculate for each change)
- Actor data model recalculation is fast (~1-2ms)
- Happens asynchronously (doesn't block UI)

**Conclusion**: No performance concerns.

**Future Optimization** (if needed):
- Batch multiple effects (entering multiple overlapping regions simultaneously)
- Cache calculated armor values per round

---

## Testing Strategy

### Unit Tests

**Files**:
- `tests/combat/cover-helper.test.mjs` - Business logic
- `tests/combat/cover-constants.test.mjs` - Constant validation

**Mocking**:
- Mock Foundry API via `tests/setup.mjs`
- Mock actors with effects array
- Mock region documents

**Test Coverage**:
- ✅ Cover type validation
- ✅ Active Effect creation with correct values
- ✅ Duplicate prevention
- ✅ Effect removal by region ID
- ✅ Error handling

### Integration Tests (Manual)

**Test Scenarios**:

1. **Basic Cover**:
   - Create low wall region
   - Move token in → verify effect applied
   - Check character sheet → armor increased
   - Move token out → verify effect removed

2. **Combat Integration**:
   - Token in cover
   - Attack with ranged weapon
   - Apply damage
   - Verify armor calculation includes cover bonus
   - Compare damage with/without cover

3. **Overlapping Regions**:
   - Create two regions (both high wall)
   - Move token into overlap
   - Verify both effects applied (stacking)
   - Verify both removed when exiting overlap

4. **Edge Cases**:
   - Teleport token into region (not movement) → effect applies?
   - Delete region while token inside → effect persists?
   - Delete actor while in region → no errors?
   - Save/load world → effects persist correctly?

### Regression Tests

**Areas to Watch**:
- Armor calculation (ensure base armor still works)
- Hit location determination (unchanged)
- Damage application (verify cover counted)
- Character sheet (effects tab shows cover)
- Performance (token movement still smooth)

---

## Migration & Versioning

### Initial Release

**Version**: 2.2.0 (hypothetical)

**Breaking Changes**: None (new feature, backward compatible)

**Migration**: Not needed (no data format changes)

### Future Updates

If cover system changes (e.g., add directional cover):

**Migration Script**:
```javascript
// Update existing cover regions to include direction field
async function migrateCoverRegions() {
  const regions = game.scenes.map(s => 
    s.regions.filter(r => r.behaviors.some(b => b.type === 'deathwatch.cover'))
  ).flat();
  
  for (const region of regions) {
    const behavior = region.behaviors.find(b => b.type === 'deathwatch.cover');
    if (!behavior.direction) {
      await region.update({
        'behaviors': [{
          ...behavior,
          direction: 0 // Default to north
        }]
      });
    }
  }
}
```

**Version**: 2.3.0 (hypothetical)

---

## Module Compatibility

### Potential Conflicts

**Other modules using regions**:
- Namespace prevents conflicts (`deathwatch.cover`)
- Multiple behaviors can coexist on same region
- No expected issues

**Combat enhancement modules**:
- Most work at different levels (UI, automation)
- As long as they don't override armor calculations, should be compatible

**Map modules** (Levels, Wall Height, etc.):
- Regions are 2D (X/Y only), no Z-axis awareness
- Multilevel maps: Create separate regions per level
- Wall Height: No interaction (different systems)

### Recommended Compatibility Testing

Test with popular modules:
- [ ] Foundry Arms Reach
- [ ] Drag Ruler
- [ ] Token Magic FX
- [ ] Levels (multilevel maps)
- [ ] Monarch (monster manager)

**Expected**: All compatible (different systems, no overlap).

---

## Summary of Integration Points

| System | Integration Required | Complexity | Notes |
|--------|---------------------|------------|-------|
| Armor | ✅ None | Low | Active Effects handle automatically |
| Hit Locations | ✅ None | Low | Unchanged |
| Combat/Damage | ✅ None | Low | Armor lookup already includes effects |
| Weapon Qualities | ⚠️ Future | Medium | Cover penetration quality (future) |
| Modifiers | ✅ None | Low | Separate systems |
| Cohesion | ⚠️ Future | Low | Potential squad abilities (future) |
| Psychic | ⚠️ Minor | Low | Psychic attacks ignore cover (add flag) |
| Fire | ⚠️ Minor | Low | Flame weapons ignore cover (add flag) |
| Righteous Fury | ✅ None | Low | Fury doesn't bypass cover |
| Criticals | ✅ None | Low | Cover reduces damage → fewer crits |
| Sheets | ✅ None | Low | Effects tab auto-displays |
| Performance | ✅ None | Low | No concerns |
| Hordes | ⚠️ Decision | Low | Hordes don't use cover (design choice) |

**Legend**:
- ✅ None: No integration code needed
- ⚠️ Minor: Small integration (flag check, setting)
- ⚠️ Future: Planned enhancement, not initial release
