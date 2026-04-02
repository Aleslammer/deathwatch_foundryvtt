# Phase 1: Mode Tracking

## Goal
Track each character's current mode (Solo/Squad) and display it in the CohesionPanel. Provide toggle controls with Cohesion validation.

## Data Changes

### DeathwatchCharacter DataModel (`actor/character.mjs`)
Add one field:
```javascript
schema.mode = new fields.StringField({ initial: "solo", choices: ["solo", "squad"] });
```

No other actor types need this field — only player characters switch modes.

## CohesionPanel Changes (`ui/cohesion-panel.mjs`)

### Display
Add a character mode list below the existing Cohesion value display:
```
⚔ Kill-team Cohesion: 4 / 6
Leader: Brother Castiel

🟢 Brother Castiel — Solo
🔵 Brother Theron — Squad
🟢 Brother Kael — Solo
```

- 🟢 = Solo Mode, 🔵 = Squad Mode (or use colored badges/icons)
- List all character-type actors in the world
- Show current mode for each

### Toggle Controls
- Each character row has a toggle button (GM can toggle any, players can toggle their own)
- **Entering Squad Mode** validates:
  - Kill-team Cohesion ≥ 1 (from `game.settings.get('deathwatch', 'cohesion').value`)
  - If validation fails, show notification: "Cannot enter Squad Mode — Cohesion is 0"
- **Exiting Squad Mode** is always allowed (Free Action, no cost)
- Mode change posts a chat message: "Brother Castiel enters Squad Mode" / "Brother Castiel returns to Solo Mode"

### Auto-Drop on Zero Cohesion
When Cohesion reaches 0 (via `_adjustCohesion` or any setting change):
- All characters currently in Squad Mode are automatically set to Solo Mode
- Single chat message: "⚔ Cohesion depleted — all Battle-Brothers return to Solo Mode"
- Triggered in the `updateSetting` hook that already handles CohesionPanel reactivity

## Template Changes (`templates/ui/cohesion-panel.html`)
Add character mode list section:
```handlebars
{{#if characters.length}}
<div class="cohesion-characters">
  {{#each characters}}
  <div class="cohesion-character-row">
    <span class="mode-indicator {{this.mode}}"></span>
    <span class="character-name">{{this.name}}</span>
    {{#if ../canToggle}}
    <a class="mode-toggle" data-actor-id="{{this.id}}" title="Toggle Mode">
      <i class="fas fa-exchange-alt"></i>
    </a>
    {{/if}}
  </div>
  {{/each}}
</div>
{{/if}}
```

## CSS Changes (`styles/components/cohesion.css`)
- `.mode-indicator.solo` — green dot
- `.mode-indicator.squad` — blue dot
- `.cohesion-character-row` — flex row with name and toggle button

## Actor Sheet Integration
Optional: Show current mode as a small badge/indicator on the character sheet header. Not critical for Phase 1 — the CohesionPanel is the primary UI.

## Chat Messages
Mode changes produce chat messages for table visibility:
- "🟢 **Brother Castiel** returns to Solo Mode"
- "🔵 **Brother Castiel** enters Squad Mode"
- "⚔ Cohesion depleted — all Battle-Brothers return to Solo Mode"

## Constants (`constants.mjs`)
```javascript
export const MODES = {
  SOLO: 'solo',
  SQUAD: 'squad'
};

export const MODE_LABELS = {
  [MODES.SOLO]: 'Solo Mode',
  [MODES.SQUAD]: 'Squad Mode'
};
```

## Tests

### ModeHelper (new: `helpers/mode-helper.mjs`)
Pure functions:
- `canEnterSquadMode(cohesionValue)` — returns true if Cohesion ≥ 1
- `getModeLabel(mode)` — returns display label
- `buildModeChangeMessage(actorName, newMode)` — returns chat HTML

### Test File: `tests/helpers/mode-helper.test.mjs`
- canEnterSquadMode: true when Cohesion ≥ 1, false when 0
- getModeLabel: returns correct labels
- buildModeChangeMessage: correct HTML for solo/squad transitions

## Files Changed/Created
```
CHANGED:
  src/module/data/actor/character.mjs          — Add mode field
  src/module/ui/cohesion-panel.mjs             — Character list, toggle, auto-drop
  src/module/helpers/constants.mjs             — MODES, MODE_LABELS constants
  src/templates/ui/cohesion-panel.html         — Character mode rows
  src/styles/components/cohesion.css           — Mode indicator styles

CREATED:
  src/module/helpers/mode-helper.mjs           — Pure mode functions
  tests/helpers/mode-helper.test.mjs           — Mode helper tests
```

## Notes
- Support Range is NOT validated programmatically — GM adjudicates whether characters are close enough
- The "Full Action to enter Squad Mode" vs "Free Action via Cohesion Challenge" distinction is narrative — the system just tracks the resulting mode state
- No Cohesion is spent to enter Squad Mode (only Squad Mode abilities cost Cohesion)
