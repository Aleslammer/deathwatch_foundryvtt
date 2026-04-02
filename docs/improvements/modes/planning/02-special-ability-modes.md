# Phase 2: Special Ability Mode Requirements

## Goal
Add a `modeRequirement` field to the `special-ability` item type so abilities can declare whether they require Solo Mode, Squad Mode, or neither. Filter/highlight abilities on the actor sheet based on the character's current mode.

## Key Design Decision: Three-State Field
Special abilities fall into three categories — the field must support all three:

| `modeRequirement` | Meaning | Examples |
|-------------------|---------|----------|
| `""` (empty/none) | Always available regardless of mode | Enhance Healing, Guardian of Purity, Improve Cover |
| `"solo"` | Only functions in Solo Mode | Bolter Mastery, Wings of Angels, Immovable Warrior |
| `"squad"` | Requires Squad Mode | Create Toxins |

## Data Changes

### DeathwatchSpecialAbility DataModel (`item/special-ability.mjs`)
Add one field:
```javascript
schema.modeRequirement = new fields.StringField({ initial: "", blank: true });
```

Empty string = no mode restriction. This preserves backward compatibility — all existing abilities default to "always available" until explicitly tagged.

### Item Sheet (`item-special-ability-sheet.html`)
Add a Mode Requirement dropdown to the header:
```handlebars
<div class="form-group">
  <label>Mode Requirement:</label>
  <select name="system.modeRequirement">
    <option value="" {{#unless system.modeRequirement}}selected{{/unless}}>None</option>
    <option value="solo" {{#if (eq system.modeRequirement "solo")}}selected{{/if}}>Solo Mode</option>
    <option value="squad" {{#if (eq system.modeRequirement "squad")}}selected{{/if}}>Squad Mode</option>
  </select>
</div>
```

## Compendium Updates

Tag existing special abilities with their mode requirements:

| Ability | Specialty | modeRequirement |
|---------|-----------|----------------|
| Guardian of Purity | Apothecary | `""` (none) |
| Create Toxins | Apothecary | `"squad"` |
| Enhance Healing | Apothecary | `""` (none) |
| Wings of Angels | Assault Marine | `"solo"` |
| Wrathful Descent | Assault Marine | (check description) |
| Immovable Warrior | Devastator Marine | `"solo"` |
| Unrelenting Devastation | Devastator Marine | (check description) |
| Bolter Mastery | Tactical Marine | `"solo"` |
| Tactical Expertise | Tactical Marine | `""` (none — it's about sharing Squad Mode abilities) |
| Blessed by the Omnissiah | Techmarine | (check description) |
| Improve Cover | Techmarine | `""` (none) |

**Note:** Verify each ability's description text for "only functions in Solo Mode" or "must be in Squad Mode" before tagging.

## Actor Sheet Display

### Current Behavior
Special abilities are listed on the character sheet with name, specialty, and description.

### New Behavior
When a character has a `mode` field (Phase 1):
- Abilities matching the current mode (or with no mode requirement) display normally
- Abilities NOT matching the current mode display **dimmed/grayed out** with a mode badge
- Example: Character in Squad Mode → "Bolter Mastery" shows grayed with a "Solo" badge

This is purely visual — the GM still decides when abilities apply. No abilities are hidden, just visually distinguished.

### Mode Badge
Small inline label next to ability name:
- `[Solo]` — yellow/gold badge
- `[Squad]` — blue badge
- No badge for mode-agnostic abilities

## CSS Changes
```css
.special-ability-row.mode-inactive {
  opacity: 0.5;
}
.mode-badge {
  font-size: 0.75em;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 4px;
}
.mode-badge.solo { background: #c9a227; color: white; }
.mode-badge.squad { background: #2277c9; color: white; }
```

## Tests

### DataModel Tests
- `DeathwatchSpecialAbility` schema includes `modeRequirement` field
- Default value is empty string
- Accepts "solo", "squad", and ""

### Display Logic Tests (if helper extracted)
- `isAbilityActiveForMode("solo", "solo")` → true
- `isAbilityActiveForMode("squad", "solo")` → false
- `isAbilityActiveForMode("", "solo")` → true (no requirement = always active)
- `isAbilityActiveForMode("", "squad")` → true

## Files Changed/Created
```
CHANGED:
  src/module/data/item/special-ability.mjs     — Add modeRequirement field
  src/templates/item/item-special-ability-sheet.html — Mode dropdown
  src/packs-source/specialties/special-abilities/**  — Tag each ability
  src/styles/components/items.css              — Mode badge and inactive styles

CREATED:
  tests/data/special-ability-mode.test.mjs     — Schema and display logic tests
```

## Notes
- This phase does NOT add new Solo/Squad Mode abilities (Codex abilities, Attack Patterns, etc.) — it only tags existing specialty abilities
- Future Codex Solo Mode abilities and Squad Mode Attack Patterns/Defensive Stances would be added as new `special-ability` compendium items with appropriate `modeRequirement` values
- The `modeRequirement` field is on the item, not the actor — abilities carry their own mode restriction
- Tactical Expertise is intentionally `""` (none) because it modifies how Squad Mode abilities are shared, but the ability itself isn't restricted to a mode
