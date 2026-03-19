# Power Armor Effects — Implementation Plan

## Source Reference
- **Book**: Deathwatch Core Rulebook, p. 161
- **Armor**: Mark VII Aquila Power Armour (AP 10 Body, AP 8 elsewhere)
- **Full effects list**: `power-armor-effects.md`

---

## Summary

Two effects are automated via modifiers + new effectTypes. All remaining effects are displayed as a structured read-only table on the armor sheet for player/GM reference.

| Effect | Approach |
|---|---|
| Enhanced Strength (+20 STR) | Automated — new `characteristic-post-multiplier` effectType |
| Giant Among Men (+1 Movement) | Automated — new `movement` effectType |
| All other effects | Narrative — structured `armorEffects` table on armor sheet |

---

## 1. Enhanced Strength (+20 STR, applied after Unnatural Strength multiplier)

### Problem

Neither existing effectType handles this correctly:

| effectType | STR Value (for tests) | SB (after Unnatural x2) |
|---|---|---|
| `characteristic` +20 | 60 ✓ | floor(60/10) × 2 = **12** ✗ |
| `characteristic-bonus` +2 | 40 ✗ | floor(40/10) × 2 + 2 = **10** ✓ |
| **Correct result** | **60** | **10** |

### Solution: New effectType `characteristic-post-multiplier`

**Behavior**:
1. Adds full value (+20) to characteristic `value` → STR 60 for tests ✓
2. Calculates `baseMod` from value *excluding* post-multiplier contributions
3. Applies Unnatural multiplier to `baseMod` only
4. Adds `floor(postMultiplierValue / 10)` to `mod` after multiplier

**Example** (STR 40, Unnatural x2, Power Armor +20):
- `total` = 40 + 20 = 60 (characteristic value for tests)
- `baseMod` = floor((60 - 20) / 10) = 4 (excludes post-multiplier for bonus calc)
- Unnatural x2: `mod` = 4 × 2 = 8
- Post-multiplier bonus: `mod` += floor(20 / 10) = 2
- Final `mod` = **10** ✓

### Tooltip Display

Both the value and bonus tooltips are populated so the user understands the calculation:

- **Value tooltip** (via `characteristic.modifiers[]`): Shows "Enhanced Strength: +20"
- **Bonus tooltip** (via `characteristic.bonusModifiers[]`): Shows "Enhanced Strength: +2 (post-multiplier)"

Implementation:
- Add post-multiplier values to `appliedMods[]` (value tooltip shows +20)
- Add entry to `bonusModifiers[]` with `{ name, value: 2, source, display: "+2 (post-multiplier)" }` (bonus tooltip explains the +2)
- Existing tooltip rendering picks these up automatically

### Code Change: `modifier-collector.mjs` → `applyCharacteristicModifiers()`

In the existing method, add handling for `characteristic-post-multiplier`:
1. Collect these modifiers alongside regular `characteristic` modifiers
2. Add their values to `total` and `appliedMods[]`
3. Track their sum separately as `postMultiplierTotal`
4. Calculate `baseMod` as `floor((total - postMultiplierTotal) / 10)` instead of `floor(total / 10)`
5. After Unnatural multiplier step, add `floor(postMultiplierTotal / 10)` to `mod`
6. Add entry to `bonusModifiers[]` with descriptive display text

### CRITICAL: Ordering Constraint

**The `characteristic-post-multiplier` bonus MUST be applied AFTER the Unnatural multiplier step in `applyCharacteristicModifiers()`.** This is the entire purpose of this effectType.

If the post-multiplier bonus is accidentally moved before the Unnatural multiplier (e.g., during refactoring), the SB calculation will be wrong:

```
CORRECT ORDER:
  1. baseMod = floor((total - postMultiplierTotal) / 10)   → 4
  2. Apply Unnatural multiplier (x2)                        → 8
  3. Add post-multiplier bonus floor(20/10)                 → 10 ✓

WRONG ORDER (post-multiplier before Unnatural):
  1. baseMod = floor((total - postMultiplierTotal) / 10)   → 4
  2. Add post-multiplier bonus floor(20/10)                 → 6
  3. Apply Unnatural multiplier (x2)                        → 12 ✗
```

The code and tests must enforce this ordering. Comments in `modifier-collector.mjs` should clearly mark:
- Where `postMultiplierTotal` is excluded from `baseMod`
- Where the Unnatural multiplier is applied
- Where the post-multiplier bonus is added (and WHY it must be after the multiplier)

Test cases must include a scenario with both Unnatural multiplier and `characteristic-post-multiplier` to catch regressions.

### Modifier JSON
```json
{
  "name": "Enhanced Strength",
  "modifier": "20",
  "effectType": "characteristic-post-multiplier",
  "valueAffected": "str",
  "enabled": true
}
```

---

## 2. Giant Among Men (+1 Base Movement)

### Current State

Movement is derived from AG Bonus in `actor.mjs` with no modifier support:
```javascript
const agBonus = systemData.characteristics?.ag?.mod || 0;
systemData.movement.half = agBonus;
systemData.movement.full = agBonus * 2;
systemData.movement.charge = agBonus * 3;
systemData.movement.run = agBonus * 6;
```

### Solution: New `movement` effectType

**Code Changes**:
1. `modifier-collector.mjs`: Add `applyMovementModifiers(movement, agBonus, modifiers)`
   - Sums all `movement` effectType modifiers into `movementBonus`
   - Calculates: `half = agBonus + movementBonus`, `full = half * 2`, `charge = half * 3`, `run = half * 6`
   - Stores `movement.bonus` and `movement.modifiers[]` for tooltip display
2. `actor.mjs`: Replace inline movement calculation with `ModifierCollector.applyMovementModifiers()`

**Result** (AG Bonus 4, Power Armor +1):
- Half: 5, Full: 10, Charge: 15, Run: 30

### Modifier JSON
```json
{
  "name": "Giant Among Men",
  "modifier": "1",
  "effectType": "movement",
  "enabled": true
}
```

---

## 3. Narrative Effects Display

### Problem

The current armor sheet renders `system.effects` as a plain `<textarea>` — not useful for quick player reference of structured rules.

### Solution: Structured `armorEffects` array

**Schema Change** (`template.json`): Add `armorEffects: []` to the armor type. Each entry has `name` and `points` (array of strings).

**UI Change** (`item-armor-sheet.html`): Replace the `<textarea>` with a read-only HTML table where each description cell renders a bulleted list:

```html
<h3>Armor Effects</h3>
<table class="armor-effects-table">
  <thead>
    <tr>
      <th style="width: 180px;">Effect</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    {{#each system.armorEffects}}
    <tr>
      <td class="effect-name">{{this.name}}</td>
      <td class="effect-description">
        <ul>
          {{#each this.points}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>
```

**Styling**: Compact table, alternating row backgrounds, bold effect names. Bullet list with tight spacing (minimal margin/padding on `<ul>` and `<li>`). Consistent with existing sheet patterns.

**Editability**: Read-only display from compendium data. Future enhancement could add CRUD controls.

### Narrative Effects Data (for Mark VII Aquila)

**Auto-senses**:
- Dark Sight trait
- Heightened Senses: +10 to Sight and Sound-based Awareness tests
- Stacks with Lyman's Ear and Occulobe for +20 total
- Immunity to photon flash and stun grenades
- Called Shot becomes a Half Action

**Bio-monitor & Injectors**:
- +10 to tests resisting Toxic and poison effects
- 6 pain suppressor doses (each ignores Critical Effects for 1d10 rounds)
- Stun effects last maximum 1 round

**Osmotic Gill Life Sustainer**:
- Environmentally sealed with helmet
- Maintains oxygen supply while powered

**Vox Link**:
- Standard vox and data transmission
- Squad bio-monitor feed

**Magnetized Boot Soles**:
- Activate for Magboots equivalent

**Nutrient Recycling**:
- Sustains wearer for extended periods
- After 2 weeks without food, Toughness Test or 1 Fatigue
- Difficulty increases every 2 weeks without food

**Recoil Suppression**:
- Fire Basic weapons one-handed
- Non-Pistol ranged weapons still cannot be used in Close Combat

**Giant Among Men**:
- Hulking size
- Black Carapace negates enemy attack bonus from size
- Penalties to Concealment and Silent Move for heavy armour

**Poor Manual Dexterity**:
- -10 to delicate tasks without Astartes-designed equipment
- Cannot wield non-Astartes ranged weapons
- 20 min to don/remove (min 5 min with assistance)

### Why These Are Not Automated

| Effect | Reason |
|---|---|
| Auto-senses (Dark Sight) | No vision/darkness system |
| Auto-senses (Heightened Senses) | Awareness has no sight/sound subtypes |
| Auto-senses (grenade immunity) | No grenade effect system |
| Auto-senses (Called Shot Half Action) | System doesn't track action types |
| Bio-monitor (+10 vs Toxic) | No Toxic resistance skill; situational characteristic test |
| Bio-monitor (pain suppressors) | Would need consumable dose tracker — low ROI |
| Bio-monitor (stun max 1 round) | Would need stun duration in conditions system |
| Osmotic Gill | Purely narrative |
| Vox Link | Purely narrative |
| Magnetized Boot Soles | Purely narrative |
| Nutrient Recycling | Purely narrative |
| Recoil Suppression | Narrative rule |
| Giant Among Men (Hulking/Concealment) | Size system not implemented (movement bonus IS automated) |
| Poor Manual Dexterity | Situational, GM adjudicated |

---

## Armor JSON (Final)

```json
{
  "_id": "armor00000000001",
  "name": "Mark VII Aquila Power Armour",
  "type": "armor",
  "system": {
    "body": 10,
    "head": 8,
    "left_arm": 8,
    "right_arm": 8,
    "left_leg": 8,
    "right_leg": 8,
    "modifiers": [
      {
        "name": "Enhanced Strength",
        "modifier": "20",
        "effectType": "characteristic-post-multiplier",
        "valueAffected": "str",
        "enabled": true
      },
      {
        "name": "Giant Among Men",
        "modifier": "1",
        "effectType": "movement",
        "enabled": true
      }
    ],
    "armorEffects": [
      { "name": "Auto-senses", "points": [
        "Dark Sight trait",
        "Heightened Senses: +10 to Sight and Sound-based Awareness tests",
        "Stacks with Lyman's Ear and Occulobe for +20 total",
        "Immunity to photon flash and stun grenades",
        "Called Shot becomes a Half Action"
      ]},
      { "name": "Bio-monitor & Injectors", "points": [
        "+10 to tests resisting Toxic and poison effects",
        "6 pain suppressor doses (each ignores Critical Effects for 1d10 rounds)",
        "Stun effects last maximum 1 round"
      ]},
      { "name": "Osmotic Gill Life Sustainer", "points": [
        "Environmentally sealed with helmet",
        "Maintains oxygen supply while powered"
      ]},
      { "name": "Vox Link", "points": [
        "Standard vox and data transmission",
        "Squad bio-monitor feed"
      ]},
      { "name": "Magnetized Boot Soles", "points": [
        "Activate for Magboots equivalent"
      ]},
      { "name": "Nutrient Recycling", "points": [
        "Sustains wearer for extended periods",
        "After 2 weeks without food, Toughness Test or 1 Fatigue",
        "Difficulty increases every 2 weeks without food"
      ]},
      { "name": "Recoil Suppression", "points": [
        "Fire Basic weapons one-handed",
        "Non-Pistol ranged weapons still cannot be used in Close Combat"
      ]},
      { "name": "Giant Among Men", "points": [
        "Hulking size",
        "Black Carapace negates enemy attack bonus from size",
        "Penalties to Concealment and Silent Move for heavy armour"
      ]},
      { "name": "Poor Manual Dexterity", "points": [
        "-10 to delicate tasks without Astartes-designed equipment",
        "Cannot wield non-Astartes ranged weapons",
        "20 min to don/remove (min 5 min with assistance)"
      ]}
    ]
  }
}
```

---

## All Files Changed

| File | Change |
|---|---|
| `modifier-collector.mjs` | Handle `characteristic-post-multiplier` in `applyCharacteristicModifiers()`; add `applyMovementModifiers()` |
| `actor.mjs` | Replace inline movement calculation with `ModifierCollector.applyMovementModifiers()` |
| `template.json` | Add `armorEffects: []` to armor schema |
| `item-armor-sheet.html` | Replace effects `<textarea>` with `armorEffects` table |
| `styles/` | Add `.armor-effects-table` styling |
| `mark-vii-aquila.json` | Add `modifiers`, `armorEffects` arrays |
| Tests | New tests for `characteristic-post-multiplier` and `movement` modifier behavior |

### Memory Bank Updates

| File | Change |
|---|---|
| `modifiers.md` | Add `characteristic-post-multiplier` effectType documentation with ordering warning; add `movement` effectType documentation |
| `structure.md` | Update armor schema to include `armorEffects` array |
| `index.md` | Update test count and any relevant summaries |

---

## Open Questions

1. Should other armors (Artificer, Terminator, Scout) also get these effects, or are they unique per armor type?
