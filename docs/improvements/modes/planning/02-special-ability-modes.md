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
```
src/packs-source/specialties/special-abilities/
├── apothecary/              (existing specialty abilities)
├── assault-marine/          (existing specialty abilities)
├── devastator-marine/       (existing specialty abilities)
├── tactical-marine/         (existing specialty abilities)
├── techmarine/              (existing specialty abilities)
├── solo-mode/
│   ├── codex/               (Codex Solo Mode abilities)
│   │   ├── burst-of-speed.json
│   │   ├── feat-of-strength.json
│   │   └── ...
│   └── chapter/             (Chapter Solo Mode abilities)
│       ├── ultramarines/
│       ├── blood-angels/
│       └── ...
└── squad-mode/
    ├── codex/               (Codex Attack Patterns & Defensive Stances)
    │   ├── bolter-assault.json
    │   ├── fire-support.json
    │   └── ...
    └── chapter/             (Chapter-specific Squad Mode abilities)
        ├── ultramarines/
        └── ...
```

### ID Convention
- Solo Mode Codex: `smcd00000000###` (solo-mode-codex)
- Solo Mode Chapter: `smch00000000###` (solo-mode-chapter)
- Squad Mode Codex: `sqcd00000000###` (squad-mode-codex)
- Squad Mode Chapter: `sqch00000000###` (squad-mode-chapter)

## Actor Sheet Display

### Current Behavior
Special abilities are listed on the character sheet with name, specialty, and description.

### New Behavior
Group abilities by category with visual distinction:

**Specialty Abilities** (existing, always shown):
- Displayed as today — no mode badge, no dimming

**Solo Mode Abilities** (new):
- Shown with 🟢 Solo badge
- Dimmed when character is in Squad Mode
- Only show abilities the character qualifies for (rank check + chapter match)

**Squad Mode Abilities** (new):
- Shown with 🔵 Squad badge
- Dimmed when character is in Solo Mode
- Phase 3 adds activation buttons

### Mode Badge CSS
```css
.mode-badge {
  font-size: 0.75em;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 4px;
}
.mode-badge.solo { background: #c9a227; color: white; }
.mode-badge.squad { background: #2277c9; color: white; }
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
```

## Tests

### DataModel Tests
- `DeathwatchSpecialAbility` schema includes `modeRequirement`, `requiredRank`, `chapter`, `abilityCategory`
- Default values are empty/zero
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

## Files Changed/Created
```
CHANGED:
  src/module/data/item/special-ability.mjs     — Add modeRequirement, requiredRank, chapter, abilityCategory
  src/module/helpers/mode-helper.mjs           — Add isAbilityActiveForMode, meetsRankRequirement, meetsChapterRequirement
  src/templates/item/item-special-ability-sheet.html — New fields in header
  src/styles/components/items.css              — Mode badge and inactive styles

CREATED:
  src/packs-source/specialties/special-abilities/solo-mode/codex/*.json
  src/packs-source/specialties/special-abilities/squad-mode/codex/*.json
  tests/data/special-ability-mode.test.mjs     — Schema tests
  tests/helpers/mode-helper.test.mjs           — Additional tests for new functions
```

## Notes
- Existing specialty abilities are NEVER tagged with mode requirements — they remain as-is
- Solo Mode abilities are rank-gated and free (no XP cost) — the system shows/hides based on rank
- Chapter abilities require matching chapter — the system filters based on character's assigned chapter
- Squad Mode ability activation (Cohesion cost, sustained tracking) is Phase 3 — Phase 2 only adds the items and display logic
- The user will provide specific ability data from the source material for compendium population
