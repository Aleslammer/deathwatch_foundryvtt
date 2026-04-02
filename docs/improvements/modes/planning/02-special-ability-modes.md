# Phase 2: Special Ability Mode Requirements & New Mode Abilities

## Goal
Add mode-related fields to the `special-ability` item type and populate the compendium with Solo Mode and Squad Mode abilities from the Deathwatch Core Rulebook. Existing specialty abilities remain unchanged.

## Key Design Decision: Existing Abilities Are NOT Mode Abilities
The current special abilities (Bolter Mastery, Enhance Healing, Wings of Angels, etc.) are **specialty abilities** — they are granted by a character's specialty and some happen to mention a mode restriction in their description text. These remain as-is with `modeRequirement: ""`.

Solo Mode abilities and Squad Mode abilities are **separate game mechanics** from the source material:
- **Solo Mode abilities**: Codex abilities (available to all) + Chapter abilities (chapter-specific). Rank-gated, no XP cost.
- **Squad Mode abilities**: Attack Patterns + Defensive Stances. Codex + Chapter-specific. Determined by squad leader. Cost Cohesion.

These will be added as **new** `special-ability` compendium items with the appropriate mode fields set.

## Data Changes

### DeathwatchSpecialAbility DataModel (`item/special-ability.mjs`)
Add fields:
```javascript
schema.modeRequirement = new fields.StringField({ initial: "", blank: true });
// Values: "" (none), "solo", "squad"

schema.requiredRank = new fields.NumberField({ initial: 0, min: 0, integer: true });
// Minimum rank to use the ability. 0 = no rank requirement (or N/A).

schema.chapter = new fields.StringField({ initial: "", blank: true });
// Chapter name for chapter-specific abilities. Empty = Codex (available to all).

schema.abilityCategory = new fields.StringField({ initial: "", blank: true });
// Values: "" (specialty ability), "codex", "chapter"
// Distinguishes specialty abilities from mode abilities.
```

### Item Sheet (`item-special-ability-sheet.html`)
Add fields to the header area:
- Mode Requirement dropdown: None / Solo Mode / Squad Mode
- Required Rank input (number)
- Chapter input (text, for chapter-specific abilities)
- Ability Category dropdown: Specialty / Codex / Chapter

## Compendium Changes

### Existing Abilities — NO CHANGES
All 11 existing special abilities keep their current data. The new fields default to empty/zero, which means "specialty ability with no mode restriction":

| Ability | modeRequirement | abilityCategory |
|---------|----------------|-----------------|
| Guardian of Purity | `""` | `""` |
| Create Toxins | `""` | `""` |
| Enhance Healing | `""` | `""` |
| Wings of Angels | `""` | `""` |
| Wrathful Descent | `""` | `""` |
| Immovable Warrior | `""` | `""` |
| Unrelenting Devastation | `""` | `""` |
| Bolter Mastery | `""` | `""` |
| Tactical Expertise | `""` | `""` |
| Blessed by the Omnissiah | `""` | `""` |
| Improve Cover | `""` | `""` |

### New Solo Mode Abilities — Codex (Core Rulebook p. 218–220)
These are available to ALL Battle-Brothers regardless of chapter.

| Ability | Rank | Source |
|---------|------|--------|
| Burst of Speed | 1 | p. 218 |
| Feat of Strength | 1 | p. 218 |
| Mental Fortress | 1 | p. 219 |
| Renewed Vigour | 1 | p. 219 |
| Stoic Defence | 1 | p. 219 |
| Battle Rage | 4 | p. 218 |
| Duty Unto Death | 4 | p. 218 |
| Heroic Stand | 4 | p. 219 |

Each will be a `special-ability` item with:
- `modeRequirement: "solo"`
- `abilityCategory: "codex"`
- `requiredRank`: as listed
- `chapter: ""` (available to all)

### New Solo Mode Abilities — Chapter-Specific (Core Rulebook p. 220–227)
Each chapter has unique Solo Mode abilities. These require the character to be a member of that chapter.

**Note:** The user will provide the specific chapter abilities from the source material. The structure for each:
- `modeRequirement: "solo"`
- `abilityCategory: "chapter"`
- `requiredRank`: as listed per ability
- `chapter`: chapter name (e.g., "Ultramarines", "Blood Angels")

### New Squad Mode Abilities — Codex Attack Patterns (Core Rulebook p. 228–231)
Available to all Kill-teams regardless of squad leader's chapter.

| Ability | Type | Source |
|---------|------|--------|
| Bolter Assault | Attack Pattern | p. 229 |
| Fire Support | Attack Pattern | p. 229 |
| Tactical Advance | Attack Pattern | p. 230 |

### New Squad Mode Abilities — Codex Defensive Stances (Core Rulebook p. 231–233)
| Ability | Type | Source |
|---------|------|--------|
| Dig In | Defensive Stance | p. 231 |
| Rally | Defensive Stance | p. 232 |
| Regroup | Defensive Stance | p. 232 |

Each Squad Mode ability will have:
- `modeRequirement: "squad"`
- `abilityCategory: "codex"` or `"chapter"`
- `chapter: ""` for Codex abilities, chapter name for chapter-specific

**Note:** Squad Mode abilities also need `cohesionCost`, `sustained`, and `action` fields — these are defined in Phase 3. For Phase 2, we add the items with descriptions only. Phase 3 adds the activation mechanics.

## Compendium File Structure

Folders use **kebab-case** (matching existing convention). The build script auto-title-cases folder names for Foundry display (e.g., `solo-mode` → `Solo Mode`, `blood-angels` → `Blood Angels`).

Chapter folders sit directly under `solo-mode/` and `squad-mode/` — no intermediate `chapter/` folder. The chapter name itself distinguishes from `codex/`, keeping the hierarchy flat and the compendium browser clean.

```
src/packs-source/specialties/special-abilities/
├── apothecary/              (existing specialty abilities)
├── assault-marine/          (existing specialty abilities)
├── devastator-marine/       (existing specialty abilities)
├── tactical-marine/         (existing specialty abilities)
├── techmarine/              (existing specialty abilities)
├── solo-mode/
│   ├── codex/               (Codex Solo Mode abilities — available to all)
│   │   ├── burst-of-speed.json
│   │   ├── feat-of-strength.json
│   │   └── ...
│   ├── ultramarines/        (Chapter Solo Mode abilities)
│   ├── blood-angels/
│   ├── space-wolves/
│   ├── dark-angels/
│   ├── black-templars/
│   ├── storm-wardens/
│   ├── iron-hands/
│   ├── novamarines/
│   └── raptors/
└── squad-mode/
    ├── codex/               (Codex Attack Patterns & Defensive Stances)
    │   ├── bolter-assault.json
    │   ├── fire-support.json
    │   └── ...
    ├── ultramarines/        (Chapter Squad Mode abilities)
    ├── blood-angels/
    ├── space-wolves/
    ├── dark-angels/
    ├── black-templars/
    ├── storm-wardens/
    ├── iron-hands/
    ├── novamarines/
    └── raptors/
```

**Foundry compendium browser display:**
```
📁 Solo Mode
  📁 Codex
  📁 Ultramarines
  📁 Blood Angels
  📁 Space Wolves
  📁 Dark Angels
  📁 Black Templars
  📁 Storm Wardens
  📁 Iron Hands
  📁 Novamarines
  📁 Raptors
📁 Squad Mode
  📁 Codex
  📁 Ultramarines
  📁 Blood Angels
  ...
```

### ID Convention
- Solo Mode Codex: `smcd00000000###` (solo-mode-codex)
- Solo Mode Chapter: `smch00000000###` (solo-mode-chapter)
- Squad Mode Codex: `sqcd00000000###` (squad-mode-codex)
- Squad Mode Chapter: `sqch00000000###` (squad-mode-chapter)

## Example Compendium JSONs

All fields below map directly to the DataModel schema chain:
- `DeathwatchDataModel` → (no fields)
- `DeathwatchItemBase` → `description`, `book`, `page`, `modifiers`
- `DeathwatchSpecialAbility` → `key` (keyTemplate), `specialty`, `modeRequirement`, `requiredRank`, `chapter`, `abilityCategory`, `effect`, `improvements`

### Example 1: Solo Mode Codex Ability (with improvements)
**File:** `src/packs-source/specialties/special-abilities/solo-mode/codex/burst-of-speed.json`
```json
{
  "_id": "smcd00000000001",
  "name": "Burst of Speed",
  "type": "special-ability",
  "img": "systems/deathwatch/icons/generic/special-ability.webp",
  "system": {
    "book": "Deathwatch Core Rulebook",
    "page": "218",
    "key": "burst-of-speed",
    "description": "<p>A Battle-Brother can call on reserves of speed when needed, crossing great distances to close with the foe. Once per game session, a Battle-Brother can perform a Burst of Speed. This ability increases the character's Agility Bonus by 2 with all the usual associated benefits for a number of Rounds equal to his Rank.</p><table><tr><th>Rank</th><th>Improvement</th></tr><tr><td>3</td><td>Also adds +10 to all Agility tests based on movement</td></tr><tr><td>5</td><td>AG Bonus increase becomes +4</td></tr><tr><td>7</td><td>Ignore Agility Tests when running or charging in difficult terrain</td></tr></table>",
    "modifiers": [],
    "specialty": "",
    "modeRequirement": "solo",
    "requiredRank": 1,
    "chapter": "",
    "abilityCategory": "codex",
    "effect": "Increases Agility Bonus by 2 for a number of Rounds equal to Rank",
    "improvements": [
      { "rank": 3, "effect": "Also adds +10 to all Agility tests based on movement" },
      { "rank": 5, "effect": "AG Bonus increase becomes +4" },
      { "rank": 7, "effect": "Ignore Agility Tests when running or charging in difficult terrain" }
    ]
  }
}
```

**Field mapping:**
| JSON Field | Source | Notes |
|------------|--------|-------|
| `description` | DeathwatchItemBase | Full HTML with improvement table for item sheet |
| `book`, `page` | DeathwatchItemBase | Source reference |
| `modifiers` | DeathwatchItemBase | Empty — mode abilities don't use modifier system |
| `key` | keyTemplate | Kebab-case identifier |
| `specialty` | DeathwatchSpecialAbility | Empty — not a specialty ability |
| `modeRequirement` | Phase 2 | `"solo"` |
| `requiredRank` | Phase 2 | Minimum rank to use |
| `chapter` | Phase 2 | Empty = Codex (available to all) |
| `abilityCategory` | Phase 2 | `"codex"` |
| `effect` | Phase 2 | Concise summary for chat message |
| `improvements` | Phase 2 | Structured rank/effect pairs for chat filtering |

### Example 2: Solo Mode Chapter Ability
**File:** `src/packs-source/specialties/special-abilities/solo-mode/ultramarines/favoured-son.json`
```json
{
  "_id": "smch00000000001",
  "name": "Favoured Son",
  "type": "special-ability",
  "img": "systems/deathwatch/icons/generic/special-ability.webp",
  "system": {
    "book": "Deathwatch Core Rulebook",
    "page": "220",
    "key": "favoured-son",
    "description": "<p>Example chapter ability description.</p>",
    "modifiers": [],
    "specialty": "",
    "modeRequirement": "solo",
    "requiredRank": 1,
    "chapter": "Ultramarines",
    "abilityCategory": "chapter",
    "effect": "Example chapter ability effect summary",
    "improvements": []
  }
}
```

**Key differences from Codex:**
- `chapter`: `"Ultramarines"` — only available to Ultramarines characters
- `abilityCategory`: `"chapter"` — chapter-specific ability
- `improvements`: Empty — not all abilities have rank improvements

### Example 3: Squad Mode Codex Ability
**File:** `src/packs-source/specialties/special-abilities/squad-mode/codex/bolter-assault.json`
```json
{
  "_id": "sqcd00000000001",
  "name": "Bolter Assault",
  "type": "special-ability",
  "img": "systems/deathwatch/icons/generic/special-ability.webp",
  "system": {
    "book": "Deathwatch Core Rulebook",
    "page": "229",
    "key": "bolter-assault",
    "description": "<p>Example squad mode attack pattern description.</p>",
    "modifiers": [],
    "specialty": "",
    "modeRequirement": "squad",
    "requiredRank": 0,
    "chapter": "",
    "abilityCategory": "codex",
    "effect": "Example squad mode effect summary",
    "improvements": []
  }
}
```

**Key differences:**
- `modeRequirement`: `"squad"` — only usable in Squad Mode
- `requiredRank`: `0` — Squad Mode abilities are not rank-gated (determined by squad leader)
- Phase 3 will add `cohesionCost`, `sustained`, and `action` fields

### Example 4: Existing Specialty Ability (NO CHANGES)
**File:** `src/packs-source/specialties/special-abilities/tactical-marine/bolter-mastery.json`
```json
{
  "_id": "sabi00000000008",
  "name": "Bolter Mastery",
  "type": "special-ability",
  "img": "systems/deathwatch/icons/generic/special-ability.webp",
  "system": {
    "book": "Deathwatch Core Rulebook",
    "page": "85",
    "key": "bolter-mastery",
    "description": "<p>The Tactical Marine gains a +10 bonus to all Ballistic Skill Tests and +2 to Damage when firing a Bolt weapon. This ability only functions in Solo Mode.</p>",
    "specialty": "Tactical Marine"
  }
}
```

**Note:** Existing files are NOT modified. The new fields (`modeRequirement`, `requiredRank`, `chapter`, `abilityCategory`, `effect`, `improvements`) default to empty/zero via the DataModel schema. This means:
- `modeRequirement` → `""` (no mode restriction)
- `requiredRank` → `0` (no rank gate)
- `chapter` → `""` (not chapter-specific)
- `abilityCategory` → `""` (specialty ability)
- `effect` → `""` (triggers fallback to raw description in chat)
- `improvements` → `[]` (no structured improvements)

## Description & Improvements Data

Mode abilities have rank-gated improvements that enhance the base effect at higher ranks. The data is split across two concerns:

1. **`description`** (HTMLField): Rich HTML for the item sheet — base effect paragraph + improvement table for visual reference
2. **`effect`** (StringField): Short base effect summary for chat messages
3. **`improvements`** (ArrayField of ObjectField): Structured rank/effect pairs for chat message filtering

### Additional Schema Fields
```javascript
schema.effect = new fields.StringField({ initial: "", blank: true });
// Short base effect summary used in activation chat messages.
// Example: "Increases Agility Bonus by 2 for a number of Rounds equal to Rank"

schema.improvements = new fields.ArrayField(
  new fields.ObjectField(),
  { initial: [] }
);
// Structured rank-gated improvements.
// Each entry: { rank: 3, effect: "Also adds +10 to all Agility tests based on movement" }
```

### Description HTML Format (Item Sheet)
The `description` field uses a **base effect paragraph + improvement table** format for the item sheet display. Foundry's HTMLField renders standard HTML including tables out of the box.

```html
<p>A Battle-Brother can call on reserves of speed when needed, crossing great
distances to close with the foe. Once per game session, a Battle-Brother can
perform a Burst of Speed. This ability increases the character's Agility Bonus
by 2 with all the usual associated benefits for a number of Rounds equal to
his Rank.</p>
<table>
  <tr><th>Rank</th><th>Improvement</th></tr>
  <tr><td>3</td><td>Also adds +10 to all Agility tests based on movement</td></tr>
  <tr><td>5</td><td>AG Bonus increase becomes +4</td></tr>
  <tr><td>7</td><td>Ignore Agility Tests when running or charging in difficult terrain</td></tr>
</table>
```

### Structured Data (Chat Messages)
The `effect` and `improvements` fields drive the contextual activation chat message:

```json
{
  "effect": "Increases Agility Bonus by 2 for a number of Rounds equal to Rank",
  "improvements": [
    { "rank": 3, "effect": "Also adds +10 to all Agility tests based on movement" },
    { "rank": 5, "effect": "AG Bonus increase becomes +4" },
    { "rank": 7, "effect": "Ignore Agility Tests when running or charging in difficult terrain" }
  ]
}
```

### Rules
- `requiredRank` captures the minimum rank to **use the ability at all**
- `effect` is a concise summary — not the full description paragraph
- `improvements` array is filtered by character rank at activation time
- Abilities without rank improvements have an empty `improvements` array
- Existing specialty abilities leave `effect` and `improvements` empty (they use the existing click-to-chat behavior)
- `description` and `effect`/`improvements` are intentionally duplicated — description is the full reference for the item sheet, effect+improvements are the structured data for contextual chat messages
- `specialty` is empty for mode abilities (they are not granted by a specialty)
- `chapter` value must match the chapter item's `name` field exactly (e.g., `"Ultramarines"`, not `"ultramarines"`)

## Activation Chat Message

When a mode ability is clicked on the character sheet, a **contextual chat message** is posted that combines the base effect with all qualifying rank improvements for the activating character.

### Chat Builder
`ModeHelper.buildAbilityActivationMessage(actorName, abilityName, modeRequirement, effect, improvements, currentRank)`

Pure function. Filters `improvements` to entries where `rank <= currentRank`, then builds the chat HTML.

### Chat Format
```html
<div class="cohesion-chat">
  <p>🟢 <strong>Brother Taco</strong> activates <strong>Burst of Speed</strong></p>
  <p>Increases Agility Bonus by 2 for a number of Rounds equal to Rank</p>
  <ul>
    <li>Also adds +10 to all Agility tests based on movement</li>
  </ul>
</div>
```

- Mode emoji: 🟢 for Solo, 🔵 for Squad, none for specialty abilities
- Base `effect` shown as paragraph
- Qualifying improvements shown as bullet list (only those where `rank <= currentRank`)
- If no improvements qualify, the bullet list is omitted

### Examples

**Rank 1 character activates Burst of Speed:**
> 🟢 **Brother Taco** activates **Burst of Speed**
>
> Increases Agility Bonus by 2 for a number of Rounds equal to Rank

**Rank 4 character activates Burst of Speed:**
> 🟢 **Brother Taco** activates **Burst of Speed**
>
> Increases Agility Bonus by 2 for a number of Rounds equal to Rank
> - Also adds +10 to all Agility tests based on movement

**Rank 6 character activates Burst of Speed:**
> 🟢 **Brother Taco** activates **Burst of Speed**
>
> Increases Agility Bonus by 2 for a number of Rounds equal to Rank
> - Also adds +10 to all Agility tests based on movement
> - AG Bonus increase becomes +4

**Rank 8 character activates Burst of Speed:**
> 🟢 **Brother Taco** activates **Burst of Speed**
>
> Increases Agility Bonus by 2 for a number of Rounds equal to Rank
> - Also adds +10 to all Agility tests based on movement
> - AG Bonus increase becomes +4
> - Ignore Agility Tests when running or charging in difficult terrain

### Fallback
If `effect` is empty (existing specialty abilities), falls back to the current behavior — posts the raw `description` HTML to chat.

## Actor Sheet Display

### Current Behavior
Special abilities are listed on the Abilities tab in a table with columns: Name, Specialty (e.g., "Tactical Marine"), Controls.

The current template (lines 121–136 of `actor-character-sheet.html`):
```html
<div class="item-name">{{item.name}}</div>
<div class="item-specialty">{{item.system.specialty}}</div>
<div class="item-controls">...</div>
```

### New Behavior
The `item-specialty` column becomes a **smart column** that shows different content based on ability type:

| Ability Type | Column Display | Example |
|-------------|---------------|----------|
| Specialty ability | `specialty` field | `Tactical Marine` |
| Solo Mode Codex | 🟢 + `"Codex"` | `🟢 Codex` |
| Solo Mode Chapter | 🟢 + `chapter` field | `🟢 Ultramarines` |
| Squad Mode Codex | 🔵 + `"Codex"` | `🔵 Codex` |
| Squad Mode Chapter | 🔵 + `chapter` field | `🔵 Blood Angels` |

### Template Change
```handlebars
<div class="item-specialty">
  {{#if item.system.specialty}}
    {{item.system.specialty}}
  {{else if item.system.modeRequirement}}
    {{#if (eq item.system.modeRequirement "solo")}}🟢{{else}}🔵{{/if}}
    {{#if item.system.chapter}}{{item.system.chapter}}{{else}}Codex{{/if}}
  {{/if}}
</div>
```

### Row Dimming
Mode abilities are dimmed when the character is in the wrong mode:

**Specialty Abilities** (existing, always shown):
- Displayed as today — no dimming

**Solo Mode Abilities** (new):
- Dimmed when character is in Squad Mode
- Only show abilities the character qualifies for (rank check + chapter match)

**Squad Mode Abilities** (new):
- Dimmed when character is in Solo Mode
- Phase 3 adds activation buttons

### Mode Inactive CSS
```css
.special-ability-row.mode-inactive { opacity: 0.5; }
```

## ModeHelper Additions

### Pure Functions
```javascript
static isAbilityActiveForMode(modeRequirement, currentMode) {
  if (!modeRequirement) return true;  // No requirement = always active
  return modeRequirement === currentMode;
}

static meetsRankRequirement(requiredRank, currentRank) {
  if (!requiredRank || requiredRank <= 0) return true;
  return currentRank >= requiredRank;
}

static meetsChapterRequirement(abilityChapter, characterChapter) {
  if (!abilityChapter) return true;  // Codex = available to all
  return abilityChapter === characterChapter;
}

static getQualifyingImprovements(improvements, currentRank) {
  if (!Array.isArray(improvements)) return [];
  return improvements.filter(imp => imp.rank <= currentRank);
}

static buildAbilityActivationMessage(actorName, abilityName, modeRequirement, effect, improvements, currentRank) {
  // Returns chat HTML with mode emoji, base effect, and qualifying improvements as bullet list
  // Falls back to null if effect is empty (caller uses existing description-to-chat behavior)
}
```

## Tests

### DataModel Tests
- `DeathwatchSpecialAbility` schema includes `modeRequirement`, `requiredRank`, `chapter`, `abilityCategory`, `effect`, `improvements`
- Default values are empty/zero/empty-array
- Accepts valid values

### ModeHelper Tests
- `isAbilityActiveForMode("", "solo")` → true
- `isAbilityActiveForMode("solo", "solo")` → true
- `isAbilityActiveForMode("squad", "solo")` → false
- `isAbilityActiveForMode("", "squad")` → true
- `meetsRankRequirement(0, 1)` → true
- `meetsRankRequirement(4, 3)` → false
- `meetsRankRequirement(4, 4)` → true
- `meetsChapterRequirement("", "Ultramarines")` → true
- `meetsChapterRequirement("Ultramarines", "Ultramarines")` → true
- `meetsChapterRequirement("Ultramarines", "Blood Angels")` → false
- `getQualifyingImprovements([{rank:3,...},{rank:5,...}], 4)` → [{rank:3,...}]
- `getQualifyingImprovements([], 4)` → []
- `getQualifyingImprovements(null, 4)` → []
- `buildAbilityActivationMessage(...)` → correct HTML with solo emoji, base effect, qualifying improvements
- `buildAbilityActivationMessage(...)` → correct HTML with squad emoji
- `buildAbilityActivationMessage(...)` → omits bullet list when no improvements qualify
- `buildAbilityActivationMessage(...)` → returns null when effect is empty

## Files Changed/Created
```
CHANGED:
  src/module/data/item/special-ability.mjs     — Add modeRequirement, requiredRank, chapter, abilityCategory, effect, improvements
  src/module/helpers/mode-helper.mjs           — Add isAbilityActiveForMode, meetsRankRequirement, meetsChapterRequirement, getQualifyingImprovements, buildAbilityActivationMessage
  src/templates/item/item-special-ability-sheet.html — New fields in header
  src/styles/components/items.css              — Mode badge and inactive styles
  src/module/sheets/actor-sheet.mjs            — Mode ability click handler uses buildAbilityActivationMessage

CREATED:
  src/packs-source/specialties/special-abilities/solo-mode/codex/*.json
  src/packs-source/specialties/special-abilities/squad-mode/codex/*.json
  tests/data/special-ability-mode.test.mjs     — Schema tests
  tests/helpers/mode-helper.test.mjs           — Additional tests for new functions
```

## Notes
- Existing specialty abilities are NEVER tagged with mode requirements — they remain as-is
- Existing specialty abilities leave `effect` and `improvements` empty — they use the existing click-to-chat behavior (raw description)
- Solo Mode abilities are rank-gated and free (no XP cost) — the system shows/hides based on rank
- Chapter abilities require matching chapter — the system filters based on character's assigned chapter
- Squad Mode ability activation (Cohesion cost, sustained tracking) is Phase 3 — Phase 2 only adds the items and display logic
- The user will provide specific ability data from the source material for compendium population
- `description` (HTML) and `effect`/`improvements` (structured) serve different purposes — description is the full item sheet reference, effect+improvements drive the contextual chat message
- Chat message uses Option A (simple concatenation) — base effect + qualifying improvements as bullet list, no per-ability merge logic
