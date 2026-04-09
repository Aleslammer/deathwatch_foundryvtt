# Insanity and Corruption - UI Requirements

## Character Sheet Additions

### Mental State Tab (New)

Add a new dedicated tab to the character sheet navigation, positioned after the existing tabs (Attributes, Abilities, Description, Gear, etc.):

**Tab Navigation**: `[Attributes] [Abilities] [Gear] [Description] [Mental State]`

**Tab Visibility**: 
- Always visible for Character actors (hidden for NPCs, Enemies, Hordes)

This tab contains all insanity and corruption tracking, displays, and management tools:

```
┌───────────────────────────────────────────────────────────┐
│ [Attributes] [Abilities] [Gear] [Description] [MENTAL STATE] │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐   ┌─────────────────────┐      │
│ │ CORRUPTION          │   │ INSANITY            │      │
│ │                     │   │                     │      │
│ │   47 / 100 CP       │   │   42 / 100 IP       │      │
│ │   [████████·····]   │   │   [████████·····]   │      │
│ │                     │   │                     │      │
│ │   ⚠ Purity at Risk  │   │   Track Level: 2    │      │
│ │   (53 to threshold) │   │   Modifier: -20     │      │
│ │                     │   │   Curse Level: 2    │      │
│ │                     │   │                     │      │
│ │   [View History]    │   │   [View History]    │      │
│ │   [Adjust] (GM)     │   │   [Adjust] (GM)     │      │
│ └─────────────────────┘   └─────────────────────┘      │
│                                                           │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ⚔ BATTLE TRAUMAS                                     │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │ • Battle Rage                       [View] [i]      │ │
│ │   └─ Triggers on Righteous Fury                     │ │
│ │                                                      │ │
│ │ • Ear of the Emperor                [View] [i]      │ │
│ │   └─ Always Active                                   │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                           │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ⚡ PRIMARCH'S CURSE                                   │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │ Burn the Witch (Black Templars)     Level: 2/3     │ │
│ │                                                      │ │
│ │ Level 2: Hate the Witch                              │ │
│ │ The Battle-Brother can scarcely stand the presence   │ │
│ │ of psykers. Cohesion -1 if psyker in squad.         │ │
│ │                                                      │ │
│ │ [View Full Curse]                                    │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Tab Layout Overview

The Mental State tab is organized into three main sections:

1. **Corruption & Insanity Tracking** (top) - Side-by-side displays
2. **Battle Traumas** (middle) - List of acquired mental wounds
3. **Primarch's Curse** (bottom) - Chapter-specific curse progression

---

### Section 1: Corruption & Insanity Tracking

Two side-by-side panels at the top of the tab showing current status and quick actions.

#### Corruption Display

**Elements**:
- Large number: Current CP / Threshold (100)
- Progress bar: Visual representation (red, warning colors at 70+)
- Warning text: Changes based on thresholds
  - 0-49 CP: "Purity Maintained"
  - 50-69 CP: "Minor Taint Detected"
  - 70-89 CP: "Significant Corruption"
  - 90-99 CP: "⚠ Critical - Purity at Risk"
  - 100+ CP: "☠ FALLEN - Character Removed"
- "View History" button: Opens history log dialog
- "Adjust" button (GM only): Opens manual adjustment dialog

**Color Coding**:
- 0-49 CP: Gray/neutral
- 50-69 CP: Yellow warning
- 70-89 CP: Orange alert
- 90+ CP: Red critical

#### Insanity Display

**Elements**:
- Large number: Current IP / Threshold (100)
- Progress bar: Visual representation (purple/dark colors)
- Track Level indicator: "Track Level: X"
- Trauma Modifier: "-X to trauma tests"
- Curse Level indicator: "Curse Level: X" (if chapter has curse)
- Warning text: Changes based on thresholds
  - 0-30 IP: "Mind Stable"
  - 31-60 IP: "Level 1 - Minor Stress"
  - 61-90 IP: "Level 2 - Significant Trauma"
  - 91-99 IP: "Level 3 - Critical State"
  - 100+ IP: "☠ INSANE - Character Removed"
- Test indicator: "⚠ INSANITY TEST DUE" if crossed 10-point boundary
- "View History" button: Opens history log dialog
- "Adjust" button (GM only): Opens manual adjustment dialog

**Color Coding**:
- 0-30 IP: Gray/neutral
- 31-60 IP: Light purple
- 61-90 IP: Deep purple
- 91+ IP: Dark red/purple critical

---

### Section 2: Battle Traumas

List of all acquired battle traumas with their trigger conditions and effects.

**Elements**:
- Trauma name (clickable to open item sheet)
- Trigger condition summary (one line)
- [View] button: Show full description in chat
- [i] info icon: Tooltip with effect summary

**Empty State**:
If no traumas: "No Battle Traumas (The Emperor Protects)"

**Layout**:
- Compact list view with collapsible details
- Visual indicator for trigger type (icon: always-on vs conditional)
- Highlight active/triggered traumas in combat

---

### Section 3: Primarch's Curse

Display of the chapter's curse and its current manifestation level.

**Elements**:
- Curse name and chapter
- Current level indicator (e.g., "2/3")
- Active level name and description
- "View Full Curse" button: Opens item sheet with all 3 levels
- Visual progress bar showing level progression

**Not Active State** (0-30 IP):
"Primarch's Curse dormant (Insanity < 31)"

**Layout**:
- Full-width panel with prominent display
- Level indicators show progression: [1]━[2]━[3]
- Current level highlighted with border/glow
- Description box with current level effects

---

## Dialogs

### History Log Dialog

**Title**: "Corruption History" or "Insanity History"

**Size**: 600px wide × 400px tall, scrollable

**Content**:
```
┌──────────────────────────────────────────────────────────┐
│ CORRUPTION HISTORY - Brother Alaric                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Date/Time       | Points | Source              | Total  │
│ ────────────────┼────────┼─────────────────────┼─────── │
│ 2026-04-07 14:32│  +5 CP │ Perils of the Warp  │  47 CP │
│ 2026-04-05 11:15│  +3 CP │ Daemon weapon use   │  42 CP │
│ 2026-04-01 09:45│ +10 CP │ Warp exposure       │  39 CP │
│ 2026-03-28 16:20│  +2 CP │ Psychic backlash    │  29 CP │
│ ...                                                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Total Corruption: 47 CP                   [Export Log]  │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- Sortable columns (click to sort by date, points, source)
- Color coding for high-point gains (5+ CP = orange, 10+ CP = red)
- Mission ID links (if tracked)
- Export button: Copy to clipboard or save as CSV
- Search/filter field

### Insanity History Dialog

Similar to corruption history, but with additional columns:

```
Date/Time       | Points | Source         | Total | Test? | Result
────────────────┼────────┼────────────────┼───────┼───────┼────────
2026-04-07 14:32│  +8 IP │ Daemon sight   │ 42 IP │  Yes  │ Failed
2026-04-05 11:15│  +3 IP │ Betrayal       │ 34 IP │  Yes  │ Success
2026-04-01 09:45│  +2 IP │ Warp exposure  │ 31 IP │  No   │ N/A
...
```

**Additional Features**:
- "Test?" column shows if insanity test was triggered
- "Result" column shows test outcome (and trauma gained if failed)
- Click result to see full test details
- Highlight rows where tests are pending

### Manual Adjustment Dialog

**Title**: "Adjust Corruption/Insanity"

**Size**: 400px wide × 300px tall

**Content**:
```
┌──────────────────────────────────────────────────────────┐
│ ADJUST MENTAL STATE - Brother Alaric                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Current Corruption: 47 CP                                │
│ Current Insanity: 42 IP                                  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Corruption Adjustment:                             │  │
│ │ [ +5  ] (positive to add, negative to remove)      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Insanity Adjustment:                               │  │
│ │ [ +3  ] (positive to add, negative to remove)      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Reason:                                            │  │
│ │ [GM adjustment - cleansing ritual                 ]│  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ⚠ Warning: Adjusting insanity may trigger tests         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                           [Cancel]        [Apply]        │
└──────────────────────────────────────────────────────────┘
```

**Validation**:
- Cannot reduce below 0
- Warning if adjustment would trigger character removal
- Confirmation prompt if adjustment crosses major threshold

### Insanity Test Dialog

**Title**: "Insanity Test Required"

**Size**: 500px wide × 400px tall

**Content**:
```
┌──────────────────────────────────────────────────────────┐
│ INSANITY TEST REQUIRED                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Brother Alaric has gained significant mental trauma.     │
│                                                          │
│ Current Insanity: 42 IP (Track Level 2)                 │
│ If you fail, you will gain a Battle Trauma.             │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Base Willpower:         [  54  ] (readonly)        │  │
│ │                                                    │  │
│ │ Track Modifier (Lvl 2): [ -20  ] (readonly)       │  │
│ │                                                    │  │
│ │ Situational Modifier:   [  +0  ] (editable)       │  │
│ │ └─ Enter any bonuses or penalties                  │  │
│ │                                                    │  │
│ │ ──────────────────────────────────────────────    │  │
│ │ Target Number:          [  34  ] (auto-updates)   │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Examples of situational modifiers:                       │
│ • Recent meditation/prayer: +10                          │
│ • Under extreme stress: -10 to -20                       │
│ • Squad support present: +10                             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                  [Roll Later]     [Roll Insanity Test]   │
└──────────────────────────────────────────────────────────┘
```

**Interactive Features**:
- Situational modifier field auto-focuses when dialog opens
- Target number updates in real-time as situational modifier changes
- "Roll Later" button warns player that test is still required
- "Roll Insanity Test" button proceeds with roll using final target

**After Roll**:
- Show roll result in chat with full modifier breakdown
- If failed, automatically trigger Battle Trauma RollTable draw
- Record test details in insanity history (including all modifiers)

### Battle Trauma Rolling Dialog

**Title**: "Battle Trauma Acquisition"

**Size**: 500px wide × 400px tall

**Content**:
```
┌──────────────────────────────────────────────────────────┐
│ BATTLE TRAUMA                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Brother Alaric's mind has fractured. Rolling for        │
│ Battle Trauma...                                         │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ d10 Roll: 7                                        │  │
│ │                                                    │  │
│ │ Result: Righteous Contempt                         │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Righteous Contempt                                 │  │
│ │ ──────────────────────────────────────────────────│  │
│ │                                                    │  │
│ │ The Battle-Brother sees the taint of the enemy    │  │
│ │ everywhere and becomes paranoid about corruption.  │  │
│ │ He questions the purity of allies and suspects     │  │
│ │ heresy at every turn.                              │  │
│ │                                                    │  │
│ │ Effect: -10 Fellowship when interacting with      │  │
│ │ Imperial citizens or non-Astartes allies.          │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ This trauma has been added to Brother Alaric's           │
│ character sheet.                                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                        [Close]           │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- Animated dice roll (if foundry-vtt supports)
- Automatic duplicate detection and reroll
- Trauma description and effects displayed
- Trauma automatically added to character
- Posted to chat for all players to see

### Character Removal Dialog

**Title**: "Character Fallen"

**Size**: 600px wide × 450px tall

**Content**:
```
┌──────────────────────────────────────────────────────────┐
│ CHARACTER FALLEN                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ⚠ Brother Alaric has reached 100 Corruption Points       │
│                                                          │
│ His taint is too great to continue serving the Emperor.  │
│ The character must be removed from play.                 │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Final Statistics:                                  │  │
│ │                                                    │  │
│ │ Corruption:    103 CP                              │  │
│ │ Insanity:      67 IP                               │  │
│ │ Missions:      23                                  │  │
│ │ Total XP:      47,500                              │  │
│ │                                                    │  │
│ │ Primary Corruption Sources:                        │  │
│ │ • Perils of the Warp: 45 CP                        │  │
│ │ • Daemon weapon use: 28 CP                         │  │
│ │ • Warp exposure: 30 CP                             │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ What would you like to do?                               │
│                                                          │
│ • Archive Character: Move to compendium, marked fallen   │
│ • Keep in World: Apply "Fallen" status, lock sheet       │
│ • Delay (1 Session): Allow final mission/heroic death    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│        [Delay]         [Keep]          [Archive]         │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- Summary of character's corruption/insanity history
- Highlight major sources of corruption
- Options for how to handle the fallen character
- Optional: Create journal entry with character's fall story
- Optional: Notify all players in chat

---

## Item Sheets

### Battle Trauma Item Sheet

**Layout**: Single-tab sheet, 400px wide × 500px tall

**Sections**:
1. **Header**: Trauma name, icon
2. **Description**: Rich text editor with full trauma description
3. **Trigger Conditions**:
   - Dropdown: Trigger type (always, combat, righteous fury, etc.)
   - Checkbox: Can resist with Willpower test
   - Dropdown: Resist difficulty
4. **Mechanical Effects**:
   - Dropdown: Effect type (modifier, behavior, cohesion, custom)
   - Number: Modifier value (if modifier type)
   - Text: Modifier target (e.g., "fellowship", "ws")
   - Number: Cohesion penalty (if cohesion type)
5. **Metadata**:
   - Text: Source book
   - Number: Page number

**Note**: Roll range is defined in the Battle Trauma RollTable, not in the item itself

### Primarch's Curse Item Sheet

**Layout**: Multi-tab sheet, 600px wide × 650px tall

**Tabs**:

1. **Overview**
   - Curse name and icon
   - Associated chapter (dropdown or text)
   - General description of the curse

2. **Level 1** (31-60 IP)
   - Level name (e.g., "Fear the Witch")
   - Rich text description
   - Effect type dropdown
   - Modifier value/target fields
   - Activation conditions

3. **Level 2** (61-90 IP)
   - Same fields as Level 1
   - Additional: Cohesion penalty field

4. **Level 3** (91-99 IP)
   - Same fields as Level 1-2
   - Additional: Behavioral requirement field

5. **Metadata**
   - Source book
   - Page number
   - Chapter key (for linking)

---

## Chat Messages

### Corruption Gain Message

**Template**:
```
┌────────────────────────────────────────────┐
│ 🔴 CORRUPTION                              │
├────────────────────────────────────────────┤
│ Brother Alaric gains 5 Corruption Points   │
│                                            │
│ Source: Perils of the Warp                 │
│ Total: 47 / 100 CP                         │
│                                            │
│ [View History]                             │
└────────────────────────────────────────────┘
```

**Color**: Red border, dark red background

**Visibility**: GM + character owner only (unless GM sets public)

### Insanity Gain Message

**Template**:
```
┌────────────────────────────────────────────┐
│ 🟣 INSANITY                                │
├────────────────────────────────────────────┤
│ Brother Alaric gains 8 Insanity Points     │
│                                            │
│ Source: Daemon manifestation               │
│ Total: 42 / 100 IP (Track Level 2)         │
│                                            │
│ ⚠ INSANITY TEST REQUIRED                   │
│                                            │
│ [Roll Insanity Test]                       │
│ [View History]                             │
└────────────────────────────────────────────┘
```

**Color**: Purple border, dark purple background

**Visibility**: GM + character owner only

**Interaction**: "Roll Insanity Test" button triggers test dialog

### Insanity Test Result Message

**Template** (Success with modifiers):
```
┌────────────────────────────────────────────┐
│ INSANITY TEST                              │
├────────────────────────────────────────────┤
│ Brother Alaric tests Willpower to resist   │
│ mental trauma.                             │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ Base WP: 54                          │  │
│ │ Track Modifier: -20                  │  │
│ │ Situational: +10                     │  │
│ │ ──────────────────────               │  │
│ │ Target: 44                           │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Roll: 38 | Success (0 DoS)                │
│                                            │
│ ✓ The Battle-Brother resists the trauma.   │
└────────────────────────────────────────────┘
```

**Template** (Failure with modifiers):
```
┌────────────────────────────────────────────┐
│ INSANITY TEST                              │
├────────────────────────────────────────────┤
│ Brother Alaric tests Willpower to resist   │
│ mental trauma.                             │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ Base WP: 54                          │  │
│ │ Track Modifier: -20                  │  │
│ │ Situational: -10                     │  │
│ │ ──────────────────────               │  │
│ │ Target: 24                           │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Roll: 58 | Failure (3 DoF)                │
│                                            │
│ ✗ The Battle-Brother's mind fractures...   │
│                                            │
│ Rolling for Battle Trauma...               │
└────────────────────────────────────────────┘
```

**Visibility**: Public (all players see)

**Features**:
- Shows complete modifier breakdown in collapsible section
- Only shows non-zero modifiers in breakdown
- Color coding: Success = green, Failure = red

### Battle Trauma Gained Message

**Template**:
```
┌────────────────────────────────────────────┐
│ ⚔ BATTLE TRAUMA GAINED                     │
├────────────────────────────────────────────┤
│ Brother Alaric has suffered a mental wound │
│                                            │
│ Trauma: Battle Rage                        │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ The Battle-Brother singles out       │   │
│ │ particular enemies for the Emperor's  │   │
│ │ fury. When triggering Righteous Fury, │   │
│ │ must fixate on target's destruction.  │   │
│ │                                      │   │
│ │ Test WP (+0) to resist fixation.      │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ [View Full Trauma]                         │
└────────────────────────────────────────────┘
```

**Color**: Dark gray border, subtle red glow

**Visibility**: Public (all players see)

### Primarch's Curse Activation Message

**Template**:
```
┌────────────────────────────────────────────┐
│ ⚡ PRIMARCH'S CURSE - LEVEL 2              │
├────────────────────────────────────────────┤
│ Brother Alaric's insanity has awakened his │
│ chapter's curse...                         │
│                                            │
│ Burn the Witch (Black Templars)            │
│                                            │
│ Level 2: Hate the Witch                    │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ The Battle-Brother can scarcely stand│   │
│ │ the presence of psykers. Squad       │   │
│ │ Cohesion -1 if psyker in Kill-team.  │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ [View Full Curse]                          │
└────────────────────────────────────────────┘
```

**Visibility**: Public (all players see)

**Trigger**: Automatically posted when insanity crosses threshold

---

## Token HUD Integration

Add visual indicators to tokens:

### Status Effects

**New Status Effects**:
- 🔴 "High Corruption" (70+ CP) — Red skull icon
- 🟣 "Fractured Mind" (60+ IP) — Purple cracked icon
- ⚠ "Insanity Test Due" — Yellow warning icon
- ☠ "Fallen" (100+ CP or IP) — Black skull icon

**Token Ring**:
- Optional setting: Show corruption/insanity as colored ring around token
- Red ring intensity = corruption level
- Purple ring intensity = insanity level

### Context Menu

Right-click token → "Mental State" submenu:
- View Corruption/Insanity
- Adjust CP/IP (GM only)
- View History
- View Battle Traumas
- View Primarch's Curse

---

## Settings

**System Settings**:

```
Insanity & Corruption Settings

[ ] Show to Players
    └─ Players see their own CP/IP (default: true)

[ ] Public Chat Messages
    └─ CP/IP gains visible to all players (default: false, GM only)

[ ] Automatic Character Removal
    └─ Prompt for removal at 100 CP/IP (default: true)

[ ] Enable Token Indicators
    └─ Show status effects on tokens (default: true)

[ ] Narrative Corruption Effects
    └─ Apply Fellowship penalties for high CP (default: false, GM discretion)
```

---

## Responsive Design

All UI elements must support:
- **Desktop**: Full layout as shown above
- **Tablet**: Stacked layout (corruption/insanity side-by-side → vertical)
- **Mobile**: Single column layout with collapsible sections

---

## Accessibility

- **Color Blind Mode**: Alternative icons/patterns for colorblind users
- **Screen Reader**: All labels and ARIA attributes
- **Keyboard Navigation**: Full keyboard support for all dialogs
- **High Contrast**: High contrast theme option

---

## Performance

- **Lazy Loading**: History logs load on-demand (not with sheet)
- **Debouncing**: Manual adjustment inputs debounced (500ms)
- **Caching**: Derived data (track level, curse level) cached in prepareDerivedData()
- **Efficient Rendering**: Only re-render changed sections, not entire sheet

---

## Implementation Notes

### Adding the Mental State Tab

**Sheet Class Modification** (`src/module/sheets/actor-sheet.mjs` or `actor-sheet-v2.mjs`):

1. **Add tab definition** to `_getTabs()` or tab configuration:
   ```javascript
   {
     navSelector: ".tabs",
     contentSelector: ".sheet-body",
     initial: "attributes",
     tabs: [
       { label: "Attributes", icon: "fas fa-user", id: "attributes" },
       { label: "Abilities", icon: "fas fa-fist-raised", id: "abilities" },
       { label: "Gear", icon: "fas fa-shield-alt", id: "gear" },
       { label: "Description", icon: "fas fa-book", id: "description" },
       { label: "Mental State", icon: "fas fa-brain", id: "mental-state" } // New tab
     ]
   }
   ```

2. **Add template path** for the new tab:
   ```javascript
   // In _getSheetTemplates() or similar
   "systems/deathwatch/templates/actor/partials/mental-state-tab.hbs"
   ```

3. **Add data preparation** in `getData()`:
   ```javascript
   async getData() {
     const context = await super.getData();
     
     // Mental state data
     context.corruption = this.actor.system.corruption;
     context.corruptionLevel = CorruptionHelper.getCorruptionLevel(context.corruption);
     context.insanity = this.actor.system.insanity;
     context.insanityTrackLevel = this.actor.system.insanityTrackLevel;
     context.traumaModifier = this.actor.system.traumaModifier;
     context.primarchsCurseLevel = this.actor.system.primarchsCurseLevel;
     
     // Battle traumas
     context.battleTraumas = this.actor.items.filter(i => i.type === "battle-trauma");
     
     // Primarch's curse (from chapter)
     context.chapter = this.actor.items.find(i => i.type === "chapter");
     if (context.chapter && context.chapter.system.hasCurse()) {
       context.activeCurse = context.chapter.system.getActiveCurseLevel(context.insanity);
       context.curseName = context.chapter.system.curseName;
     } else {
       context.activeCurse = null;
     }
     
     return context;
   }
   ```

4. **Add event handlers** in `activateListeners()`:
   ```javascript
   activateListeners(html) {
     super.activateListeners(html);
     
     // Mental state tab handlers
     html.find('[data-action="view-corruption-history"]').click(this._onViewCorruptionHistory.bind(this));
     html.find('[data-action="view-insanity-history"]').click(this._onViewInsanityHistory.bind(this));
     html.find('[data-action="adjust-mental-state"]').click(this._onAdjustMentalState.bind(this));
     html.find('[data-action="view-trauma"]').click(this._onViewTrauma.bind(this));
     html.find('[data-action="view-curse"]').click(this._onViewCurse.bind(this));
   }
   ```

### Template Structure

Create `src/templates/actor/partials/mental-state-tab.hbs`:

```handlebars
<div class="tab mental-state" data-group="primary" data-tab="mental-state">
  {{!-- Corruption & Insanity Section --}}
  <div class="mental-state-tracking flexrow">
    {{> "systems/deathwatch/templates/actor/partials/corruption-display.hbs"}}
    {{> "systems/deathwatch/templates/actor/partials/insanity-display.hbs"}}
  </div>
  
  {{!-- Battle Traumas Section --}}
  {{> "systems/deathwatch/templates/actor/partials/battle-traumas.hbs"}}
  
  {{!-- Primarch's Curse Section --}}
  {{> "systems/deathwatch/templates/actor/partials/primarchs-curse.hbs"}}
</div>
```

### CSS Styling

Add styles to `src/styles/actor-sheet.css`:

```css
/* Mental State Tab */
.mental-state-tracking {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.corruption-panel,
.insanity-panel {
  flex: 1;
  border: 1px solid var(--color-border-dark);
  border-radius: 4px;
  padding: 1rem;
}

.corruption-panel {
  border-color: var(--color-corruption, #8B0000);
}

.insanity-panel {
  border-color: var(--color-insanity, #4B0082);
}

/* Progress bars */
.mental-state-progress {
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.mental-state-progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.corruption-bar { background: var(--color-corruption, #DC143C); }
.insanity-bar { background: var(--color-insanity, #8B00FF); }

/* Battle Traumas */
.battle-traumas {
  margin-top: 1rem;
  border: 1px solid var(--color-border-dark);
  border-radius: 4px;
  padding: 1rem;
}

.trauma-item {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.trauma-item:last-child {
  border-bottom: none;
}

/* Primarch's Curse */
.primarchs-curse {
  margin-top: 1rem;
  border: 2px solid var(--color-curse, #FFD700);
  border-radius: 4px;
  padding: 1rem;
  background: rgba(255, 215, 0, 0.1);
}

.curse-level-indicator {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
}

.curse-level {
  flex: 1;
  text-align: center;
  padding: 0.25rem;
  border: 1px solid var(--color-border-dark);
  background: rgba(0, 0, 0, 0.2);
}

.curse-level.active {
  background: var(--color-curse, #FFD700);
  color: black;
  font-weight: bold;
}
```

### Tab Visibility Logic

In the sheet's `getData()` or template logic:

```javascript
// Only show Mental State tab for characters
context.showMentalStateTab = this.actor.type === "character";
```

In the main sheet template:

```handlebars
{{#if showMentalStateTab}}
  <nav class="sheet-tabs tabs" data-group="primary">
    <a class="item" data-tab="attributes">Attributes</a>
    <a class="item" data-tab="abilities">Abilities</a>
    <a class="item" data-tab="gear">Gear</a>
    <a class="item" data-tab="description">Description</a>
    <a class="item" data-tab="mental-state">Mental State</a>
  </nav>
{{/if}}
```
