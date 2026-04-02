# Phase 3: Squad Mode Ability Activation & Cohesion Costs

## Goal
Allow Squad Mode abilities (Attack Patterns and Defensive Stances) to be activated from the UI, deducting Cohesion cost and tracking sustained abilities.

## Context: Squad Mode Ability Types

### Attack Patterns
Coordinated offensive actions. Examples from the Core Rulebook:
- **Fire Support** (Codex): Cohesion cost 2. Sustained. Kill-team members in Support Range may make a ranged attack as a Free Action when the initiator fires.
- **Tactical Advance** (Codex): Cohesion cost 1. Sustained. Kill-team members may move as a Free Action when the initiator moves.

### Defensive Stances
Coordinated defensive actions. Examples:
- **Rally** (Codex): Cohesion cost 2. Not sustained. Kill-team members recover from Pinning and gain +10 WP vs Fear.
- **Dig In** (Codex): Cohesion cost 1. Sustained. Kill-team members in cover gain additional AP.

### Chapter-Specific Abilities
Only usable by and benefiting members of the same chapter. Same activation rules but restricted audience.

## Data Changes

### DeathwatchSpecialAbility DataModel (`item/special-ability.mjs`)
Add fields for Squad Mode ability activation:
```javascript
schema.abilityType = new fields.StringField({ initial: "", blank: true });
// Values: "", "attack-pattern", "defensive-stance"
// Empty = not a Squad Mode tactical ability (existing specialty abilities)

schema.cohesionCost = new fields.NumberField({ initial: 0, min: 0, integer: true });
// Cohesion points spent to activate

schema.sustained = new fields.BooleanField({ initial: false });
// Whether the ability persists after activation

schema.action = new fields.StringField({ initial: "", blank: true });
// Action type required: "free", "half", "full", "reaction", ""
```

These fields are only relevant when `modeRequirement === "squad"` and `abilityType` is set. For existing specialty abilities (Enhance Healing, Bolter Mastery, etc.), these remain at defaults and are ignored.

### Item Sheet (`item-special-ability-sheet.html`)
Show Squad Mode fields conditionally when `abilityType` is set:
- Ability Type dropdown (None / Attack Pattern / Defensive Stance)
- Cohesion Cost input
- Sustained checkbox
- Action Type dropdown

## World Setting: Active Squad Abilities

### New Setting
```javascript
game.settings.register('deathwatch', 'activeSquadAbilities', {
  scope: 'world',
  type: Array,
  default: [],
  config: false
});
```

Each entry:
```javascript
{
  abilityId: "sabi00000000XXX",  // Item ID
  abilityName: "Fire Support",
  initiatorId: "actorId",        // Who activated it
  initiatorName: "Brother Castiel",
  sustained: true                // Whether it's being sustained
}
```

### CohesionPanel Display
Show active sustained abilities below the character mode list:
```
Active Squad Abilities:
  🔷 Fire Support (Brother Castiel) [Deactivate]
  🔷 Dig In (Brother Theron) [Deactivate]
```

GM can deactivate. Deactivation is a Free Action (no Cohesion refund).

## Activation Flow

### From Actor Sheet
1. Player clicks "Activate" button on a Squad Mode ability
2. System validates:
   - Character is in Squad Mode (`actor.system.mode === "squad"`)
   - Cohesion ≥ ability's `cohesionCost`
   - If sustained: character is not already sustaining another ability
3. Deducts Cohesion cost from shared pool
4. If sustained: adds to `activeSquadAbilities` world setting
5. Posts chat message: "🔵 **Brother Castiel** activates **Fire Support** (Cohesion: -2)"

### Deactivation
- Sustained abilities can be deactivated as Free Action from CohesionPanel
- Removes from `activeSquadAbilities`
- Chat message: "🔵 **Fire Support** deactivated by Brother Castiel"

### Auto-Deactivation
When a character leaves Squad Mode (Phase 1 auto-drop or manual toggle):
- Any sustained abilities they initiated are deactivated
- Removed from `activeSquadAbilities`
- Chat message included in the mode change message

## Actor Sheet Changes

### Special Abilities Section
For abilities with `abilityType` set (Attack Patterns / Defensive Stances):
- Show Cohesion cost badge: `[Cost: 2]`
- Show Sustained badge if applicable: `[Sustained]`
- "Activate" button (only when in Squad Mode and Cohesion sufficient)
- Active sustained abilities show "Active" indicator instead of Activate button

## Chat Messages
- Activation: "🔵 **Brother Castiel** activates **Fire Support** — Cohesion: 4 → 2"
- Deactivation: "🔵 **Fire Support** deactivated"
- Auto-deactivation: "⚔ Cohesion depleted — **Fire Support** deactivated"

## Tests

### ModeHelper additions
- `canActivateSquadAbility(mode, cohesionValue, cohesionCost)` — validates mode + cost
- `buildActivationMessage(actorName, abilityName, cost, newCohesion)` — chat HTML

### Test File: `tests/helpers/squad-ability-activation.test.mjs`
- Validates Squad Mode requirement
- Validates Cohesion cost
- Rejects when Cohesion insufficient
- Rejects when not in Squad Mode
- Sustained ability tracking

## Files Changed/Created
```
CHANGED:
  src/module/data/item/special-ability.mjs     — Add abilityType, cohesionCost, sustained, action
  src/module/ui/cohesion-panel.mjs             — Active abilities display, deactivate button
  src/module/helpers/mode-helper.mjs           — Activation validation functions
  src/templates/ui/cohesion-panel.html         — Active abilities section
  src/templates/item/item-special-ability-sheet.html — Squad Mode fields
  src/module/deathwatch.mjs                    — Register activeSquadAbilities setting

CREATED:
  tests/helpers/squad-ability-activation.test.mjs — Activation tests
```

## Compendium: Future Work
Phase 3 builds the activation infrastructure. Populating the compendium with all Codex and Chapter Attack Patterns / Defensive Stances is a separate data entry task. Each would be a `special-ability` item with:
- `modeRequirement: "squad"`
- `abilityType: "attack-pattern"` or `"defensive-stance"`
- `cohesionCost`, `sustained`, `action` set per the rulebook
- `specialty` field for chapter-specific abilities (or empty for Codex)

## Notes
- Ability effects remain narrative — the system tracks activation state and Cohesion cost, the GM adjudicates the mechanical effects
- "Only one sustained ability at a time per character" is enforced at activation
- Chapter-specific restrictions (only same-chapter members benefit) are GM-adjudicated, not system-enforced
- Tactical Expertise (Tactical Marine) allows sharing chapter abilities — this is a narrative override the GM handles
