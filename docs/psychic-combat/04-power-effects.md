# Phase 4 — Power-Specific Effects

## Goal
Automate individual psychic power effects based on the power's description and the effective Psy Rating. This is the most complex phase and would be implemented incrementally per power.

## Phase 4a: Psychic Status Effects (Control Powers)

### Overview
Add 5 new status effects for psychic control powers. These integrate with the existing `DW_STATUS_EFFECTS` array and `setCondition()` system, appearing as checkboxes on the Effects tab alongside Stunned, Prone, etc.

### New Status Effects

| Status | Icon | Modifiers | Source Power |
|--------|------|-----------|-------------|
| Dominated | `icons/svg/mystery-man.svg` | -10 to all 9 characteristics | Dominate |
| Compelled | `icons/svg/daze.svg` | None (narrative) | Compel |
| Terrified | `icons/svg/terror.svg` | None (narrative — fleeing) | The Horror |
| Immobilized | `icons/svg/paralysis.svg` | None (narrative — like Stunned) | Hypnotic Gaze |
| Paroxysm | `icons/svg/downgrade.svg` | Dynamic: WS/BS → 10, -10 INT/PER/WIL/FEL | Paroxysm |

### Standard Status Effects (Dominated, Compelled, Terrified, Immobilized)

These follow the existing pattern — static modifiers defined in `DW_STATUS_EFFECTS`:

```javascript
{
  id: "dominated",
  name: "Dominated",
  img: "icons/svg/mystery-man.svg",
  description: "Mind controlled by psyker. -10 to all Characteristics due to crude control.",
  modifiers: [
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "ws" },
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "bs" },
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "str" },
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "tg" },
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "ag" },
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "int" },
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "per" },
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "wil" },
    { name: "Dominated", modifier: -10, effectType: "characteristic", valueAffected: "fs" }
  ]
},
{
  id: "compelled",
  name: "Compelled",
  img: "icons/svg/daze.svg",
  description: "Following a psychic command. Must obey a simple order this round."
},
{
  id: "terrified",
  name: "Terrified",
  img: "icons/svg/terror.svg",
  description: "Fleeing in psychic terror. Must move away from psyker."
},
{
  id: "immobilized",
  name: "Immobilized",
  img: "icons/svg/paralysis.svg",
  description: "Held by psychic power. Cannot move or take actions."
}
```

### Paroxysm (Dynamic Modifiers)

Paroxysm is special because it has two effects:
1. **WS and BS reduced to 10** — requires computing `-(currentValue - 10)` at application time
2. **-10 to INT, PER, WIL, FEL** — static penalty

#### Problem
The existing `setCondition()` uses static modifiers defined in `DW_STATUS_EFFECTS`. Paroxysm needs dynamic modifiers that depend on the target's current characteristic values.

#### Solution
Add a `dynamicModifiers` flag to the Paroxysm status effect. When `setCondition()` encounters this flag, it computes the actual modifier values from the actor's current characteristics before storing them.

```javascript
// In DW_STATUS_EFFECTS:
{
  id: "paroxysm",
  name: "Paroxysm",
  img: "icons/svg/downgrade.svg",
  description: "WS and BS reduced to 10. -10 to INT, PER, WIL, FEL tests.",
  dynamicModifiers: true,
  staticModifiers: [
    { name: "Paroxysm", modifier: -10, effectType: "characteristic", valueAffected: "int" },
    { name: "Paroxysm", modifier: -10, effectType: "characteristic", valueAffected: "per" },
    { name: "Paroxysm", modifier: -10, effectType: "characteristic", valueAffected: "wil" },
    { name: "Paroxysm", modifier: -10, effectType: "characteristic", valueAffected: "fs" }
  ]
}
```

#### setCondition() Changes
```javascript
async setCondition(conditionId, enabled) {
  // ... existing logic ...

  if (enabled && !existing) {
    // Create ActiveEffect as before
    await this.createEmbeddedDocuments('ActiveEffect', [{ ... }]);

    let modifiersToApply = [];

    if (effect.dynamicModifiers) {
      // Compute dynamic WS/BS reduction to 10
      const ws = this.system.characteristics?.ws?.value || 0;
      const bs = this.system.characteristics?.bs?.value || 0;
      modifiersToApply.push(
        { name: "Paroxysm (WS)", modifier: -(ws - 10), effectType: "characteristic", valueAffected: "ws", _statusId: conditionId, source: effect.name, enabled: true },
        { name: "Paroxysm (BS)", modifier: -(bs - 10), effectType: "characteristic", valueAffected: "bs", _statusId: conditionId, source: effect.name, enabled: true }
      );
      // Add static modifiers too
      if (effect.staticModifiers) {
        modifiersToApply.push(...effect.staticModifiers.map(m => ({
          ...m, _statusId: conditionId, source: effect.name, enabled: true
        })));
      }
    } else if (effect.modifiers?.length > 0) {
      // Existing static modifier path
      modifiersToApply = effect.modifiers.map(m => ({
        ...m, _statusId: conditionId, source: effect.name, enabled: true
      }));
    }

    if (modifiersToApply.length > 0) {
      const currentModifiers = this.system.modifiers || [];
      await this.update({ 'system.modifiers': [...currentModifiers, ...modifiersToApply] });
    }
  }
  // ... removal logic unchanged (filters by _statusId) ...
}
```

#### Example: Paroxysm on Ork Warboss (WS 45, BS 30)
When toggled on:
- WS modifier: `-(45 - 10)` = -35 → WS becomes 10
- BS modifier: `-(30 - 10)` = -20 → BS becomes 10
- INT modifier: -10 (static)
- PER modifier: -10 (static)
- WIL modifier: -10 (static)
- FEL modifier: -10 (static)

When toggled off: all 6 modifiers removed (filtered by `_statusId: "paroxysm"`).

#### Edge Cases
- **WS/BS already ≤ 10**: Modifier would be 0 or positive. Clamp to `Math.min(0, -(value - 10))` to never buff.
- **Modifiers already applied**: The `_statusId` filter on removal handles this cleanly.
- **Multiple Paroxysm applications**: Shouldn't stack — check `existing` before applying.

### Test Plan (~20 tests)

**Static status effects** (~8 tests)
- Dominated adds -10 to all 9 characteristics
- Compelled has no modifiers
- Terrified has no modifiers
- Immobilized has no modifiers
- Toggling off removes modifiers
- Modifiers have correct `_statusId` for cleanup
- Status appears in actor effects list
- Duplicate application prevented

**Paroxysm dynamic modifiers** (~12 tests)
- WS reduced to 10 (e.g., WS 45 → modifier -35)
- BS reduced to 10 (e.g., BS 30 → modifier -20)
- INT/PER/WIL/FEL get static -10
- WS already at 10 → modifier is 0
- WS below 10 → modifier clamped to 0 (no buff)
- Toggling off removes all 6 modifiers
- High WS/BS values (e.g., WS 75 → modifier -65)
- Modifiers stored with `_statusId: "paroxysm"`
- Dynamic + static modifiers combined correctly
- Actor sheet reflects reduced values after application
- Removal restores original values
- Cannot stack multiple Paroxysm applications

### Files to Modify
| File | Change |
|------|--------|
| `helpers/status-effects.mjs` | Add 5 new status effects |
| `documents/actor-conditions.mjs` | Add `dynamicModifiers` handling in `setCondition()` |
| `tests/documents/actor-conditions.test.mjs` | Tests for new conditions |
| `tests/helpers/status-effects.test.mjs` | Tests for new status effect definitions |

---

## Phase 4b: Damage Powers (Future)

### Effect Categories

#### Damage Powers
Powers that deal damage to targets. Most automatable.

| Power | Damage | Penetration | Area | Notes |
|-------|--------|-------------|------|-------|
| Smite | 1d10 × PR Energy | PR | 1m × PR radius | No BS test needed |
| Warp Blast | 1d10 × PR Energy | 2 × PR | 1m × PR radius | Tyranid |
| Warp Lance | 2d10 × PR Energy | 5 × PR | Single target | Tyranid |
| Psychic Scream | 1d10+8 Impact | 0 | Head hit | Shocking |
| Fury of the Ancients | 1d5 × PR Energy | 0 | Line | Pinning test |
| Blood Lance | 2d10 Energy | PR | Line | Blood Angels |
| Hellfire | 1d10 × PR Energy | PR | 1m × PR | Dark Angels |
| Living Lightning | 1d10 × PR Energy | 0 | Chain | Space Wolves |

**Automation approach**: After successful Focus Power, generate damage roll with effective PR substituted. Create apply-damage buttons like weapon damage.

#### Buff/Self Powers
Powers that enhance the psyker or allies.

| Power | Effect | Duration |
|-------|--------|----------|
| Iron Arm | +PR to TB, Unarmed damage | Sustained |
| Might of the Ancients | +PR to melee Damage and Pen | Sustained |
| Force Dome | 2 AP × PR vs ranged | Sustained |
| Veil of Time | Re-roll failed Dodge/Parry | Sustained |
| Might of Heroes | +10 to STR, TG, AG | Sustained |

**No automation needed.** Players/GMs can manually add modifiers via the Effects tab using the existing modifier system. The effective PR is shown in the Focus Power chat message, so the player knows what values to enter (e.g., PR 5 Iron Arm = add a +5 Toughness characteristic modifier). This avoids the complexity of sustained power tracking and automatic modifier cleanup.

#### Utility Powers
Powers with narrative or information effects.

| Power | Effect |
|-------|--------|
| Augury | Read Emperor's Tarot |
| Divination | Glimpse the future |
| Reading | Read psychic impressions |
| Telepathy powers | Mental communication |

**Automation approach**: Minimal — these are GM-narrated. Focus Power Test is sufficient.

### Damage Power Implementation Sketch

#### Schema Addition
Add optional fields to psychic-power DataModel:
```javascript
schema.damageFormula = new fields.StringField({ initial: "", blank: true });
schema.penetrationFormula = new fields.StringField({ initial: "", blank: true });
schema.damageType = new fields.StringField({ initial: "", blank: true });
schema.areaFormula = new fields.StringField({ initial: "", blank: true });
```

#### PR Substitution
```javascript
static substitutePR(formula, effectivePR) {
  return formula.replace(/PR/g, effectivePR);
}
// "1d10 * PR" with PR=5 → "1d10 * 5"
```

#### Damage Roll Flow
1. Focus Power succeeds (Phase 1)
2. System detects `damageFormula` is not empty
3. Substitutes `PR` with effective Psy Rating
4. Rolls damage formula
5. Creates apply-damage button (reuse existing `ChatMessageBuilder.createDamageApplyButton`)
6. Target takes damage through existing `CombatHelper.applyDamage()`

---

## Psychic Righteous Fury

Psychic damage powers can trigger Righteous Fury (Core Rulebook p. 245):

- **Trigger**: Natural 10 on damage dice (same as weapon attacks)
- **Confirmation**: Re-roll the Focus Power Test using the **same target number** as the original
  - Target = WP + (5 × ePR) + psychic-test modifiers + misc (stored from Phase 1)
  - Roll 1d100 ≤ target number = confirmed
  - 91+ auto-fail still applies
- **No Phenomena**: Confirmation roll does NOT generate Phenomena or Perils regardless of power level or doubles
- **Opposed powers**: Defender also re-rolls WP with same modifiers (Phase 3)

### Implementation
Reuse `RighteousFuryHelper.rollConfirmation()` but pass the stored Focus Power target number:
```javascript
const targetNumber = PsychicCombatHelper.lastFocusPowerTarget;
await RighteousFuryHelper.rollConfirmation(actor, targetNumber, hitLocation);
```

### Test Cases (~5 tests)
- Confirmation uses stored Focus Power target number
- Confirmation roll does not trigger Phenomena
- 91+ auto-fail on confirmation
- Natural 10 detection on psychic damage dice
- Fury chain (multiple natural 10s)

---

## Psychic Powers vs Hordes

Psychic powers have special hit rules against Hordes (Core Rulebook p. 359):

| Rule | Hits |
|------|------|
| Base | Effective Psy Rating |
| Area power | +1d10 additional hits |
| Non-damage powers | Still inflict "hits" (magnitude loss) |

### Implementation
Extend `DeathwatchHorde.calculateHitsReceived()` with a `isPsychic` option:
```javascript
if (options.isPsychic) {
  let hits = options.effectivePR || 0;
  if (options.isAreaEffect) hits += options.areaRoll || 0;
  return hits;
}
```

### Test Cases (~6 tests)
- Base hits = effective PR
- Area power adds 1d10
- Non-area power = PR only
- PR 0 = 0 hits
- High PR values
- Integration with existing horde damage flow

---

## Sustained Power Tracking (Future)

Sustained powers remain active until the psyker stops concentrating. This would require:
- Tracking which powers are currently sustained on the actor
- Applying/removing modifiers when sustained/dropped
- Half Action cost each round to maintain
- UI indicator on the psychic powers tab

This is a significant feature and should be its own planning document when the time comes.

---

## Priority Order

1. **Phase 4a: Psychic Status Effects** ← Next implementation
   - 5 new status effects (Dominated, Compelled, Terrified, Immobilized, Paroxysm)
   - Dynamic modifier support for Paroxysm
   - ~20 tests
2. **Phase 4b: Damage powers** (highest gameplay value, needs schema changes)
3. **Buff/self powers** — handled manually via Effects tab modifiers (no automation needed)
4. **Utility powers** — narrative only (no automation needed)

## Scope Notes
- Phase 4 is incremental — each sub-phase can be implemented independently
- Status effects (4a) are the simplest and most immediately useful
- Damage powers (4b) provide the most gameplay value but need schema changes
- All powers still work narratively with just the Phase 1-3 Focus Power Test
