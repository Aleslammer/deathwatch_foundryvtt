# Phase 1 — Focus Power Test

## Goal
Implement the Focus Power dialog, Willpower roll, and chat output. This is the core psychic action — equivalent to the ranged/melee attack dialog.

## Rules Reference (Core Rulebook p. 185–188)

The Focus Power Test is a **Willpower Test** with a bonus equal to **5 × Effective Psy Rating**. A roll of 91–00 always fails regardless of target number.

| Level | Effective PR | WP Bonus | Phenomena | On Doubles |
|-------|-------------|----------|-----------|------------|
| Fettered | ceil(PR ÷ 2) | 5 × ePR | Never | Nothing |
| Unfettered | Full PR | 5 × ePR | On doubles | Phenomena |
| Push | PR + 3 | 5 × ePR | Always | +1 Fatigue |

**Target Number** = Willpower + (5 × Effective PR) + psychic-test modifiers + misc modifier

**Automatic Failure**: A roll of 91–00 always fails, even if the target number is higher.

**Perils of the Warp** are NOT triggered directly by any power level. They only occur when the Psychic Phenomena table result is 75–100 (the "Perils of the Warp" entry), which cascades into a Perils roll.

**Example**: Librarian with WP 55, Psy Rating 5, Unfettered:
- Effective PR: 5
- WP Bonus: 5 × 5 = 25
- Target Number: 55 + 25 = 80
- Roll 80 or less = success (but 91+ always fails)

## User Flow

1. Player clicks "Use" button on a psychic power in the Psychic Powers tab
2. Dialog opens showing power image, name, action type, and options
3. Player selects power level (Fettered / Unfettered / Push)
4. Player optionally adds misc modifier
5. Player clicks "Focus Power"
6. System rolls 1d100 vs Willpower + modifiers
7. Chat message shows result with full breakdown
8. If Phenomena triggered, auto-roll on Psychic Phenomena table
9. If Push + doubles, apply +1 Fatigue to actor

## Dialog Layout

```
┌─────────────────────────────────────────┐
│ Focus Power: [Power Name]               │
│                                         │
│            ┌──────────┐                 │
│            │  [Power   │                 │
│            │   Image]  │                 │
│            └──────────┘                 │
│                                         │
│ Action: Half    Range: 10m x PR         │
│ Opposed: No     Sustained: No           │
│                                         │
│ Power Level:                            │
│ ○ Fettered  (PR ÷ 2, no Phenomena)     │
│ ● Unfettered (Full PR, doubles risk)    │
│ ○ Push (+3 PR, auto Phenomena,          │
│         Fatigue on doubles)             │
│                                         │
│ Effective Psy Rating: [5]               │
│ WP Bonus: +25 (5 × PR)                 │
│                                         │
│ Misc Modifier: [____]                   │
│                                         │
│ [Focus Power]              [Cancel]     │
└─────────────────────────────────────────┘
```

The power image is displayed centered at the top of the dialog, matching the pattern used by ranged and melee combat dialogs (100×100px max, no border). Uses `power.img` which is the class-specific icon (e.g., `codex.webp`, `telepathy.webp`, `tyranid.webp`, or chapter-specific like `ultramarines.webp`).

The effective Psy Rating display updates dynamically when the power level radio button changes.

## New Effect Types

Two new modifier effect types collected from the existing modifier system (`ModifierCollector.collectAllModifiers`):

### psychic-test
Modifies the Focus Power Test target number (additive bonus/penalty to Willpower).

```json
{
  "name": "Psychic Hood",
  "modifier": 10,
  "effectType": "psychic-test",
  "enabled": true
}
```

- Collected from all standard sources (actor, equipped items, chapters, traits, talents, armor histories)
- Summed and added to the Focus Power target number alongside the misc modifier
- Displayed as a dedicated line in the chat modifier breakdown (e.g., "+10 Psychic Hood")
- No `valueAffected` needed (like initiative/wounds)

### no-perils
Boolean flag — prevents Perils of the Warp from triggering when Phenomena table rolls 75+.

```json
{
  "name": "Warp Stabiliser",
  "modifier": "1",
  "effectType": "no-perils",
  "enabled": true
}
```

- Presence of any enabled `no-perils` modifier = Perils cascade suppressed
- Modifier value is ignored (presence = active, same pattern as `ignores-natural-armour`)
- Phenomena still trigger normally (Fettered/Unfettered/Push rules unchanged)
- When Phenomena table result is 75+, Perils roll is skipped
- Displayed in chat: "🛡 Perils of the Warp suppressed by [source name]"

### Modifier Collection

Uses the existing `ModifierCollector.collectAllModifiers(actor)` — no new collection logic needed. The psychic combat helper just filters for the new effect types:

```javascript
static collectPsychicModifiers(allModifiers) {
  let testBonus = 0;
  let noPerils = false;
  const parts = [];
  let noPerilsSource = '';

  for (const mod of allModifiers) {
    if (mod.enabled === false) continue;
    if (mod.effectType === 'psychic-test') {
      const value = parseInt(mod.modifier) || 0;
      testBonus += value;
      parts.push({ name: mod.name || mod.source, value });
    }
    if (mod.effectType === 'no-perils') {
      noPerils = true;
      noPerilsSource = mod.source || mod.name;
    }
  }

  return { testBonus, noPerils, noPerilsSource, parts };
}
```

### Constants Addition

```javascript
// In EFFECT_TYPES
PSYCHIC_TEST: 'psychic-test',
NO_PERILS: 'no-perils',

// In EFFECT_TYPE_LABELS
[EFFECT_TYPES.PSYCHIC_TEST]: 'Psychic Test',
[EFFECT_TYPES.NO_PERILS]: 'No Perils of the Warp',
```

## Testable Functions

### calculateEffectivePsyRating(basePR, powerLevel)
```
Fettered:    ceil(basePR / 2)
Unfettered:  basePR
Push:        basePR + 3
```

| basePR | Fettered | Unfettered | Push |
|--------|----------|------------|------|
| 1 | 1 | 1 | 4 |
| 3 | 2 | 3 | 6 |
| 5 | 3 | 5 | 8 |
| 8 | 4 | 8 | 11 |

### isDoubles(roll)
Returns true if both digits of a d100 roll are the same.
```
11 → true, 22 → true, ..., 99 → true
100 → true (treated as 00)
01 → false, 12 → false, 50 → false
```

### checkPsychicEffects(roll, powerLevel)
Determines what side effects occur based on the roll and power level.
```
Fettered:    { phenomena: false, fatigue: false }
Unfettered:  { phenomena: isDoubles(roll), fatigue: false }
Push:        { phenomena: true, fatigue: isDoubles(roll) }
```

Returns: `{ phenomena: boolean, fatigue: boolean }`

Note: Perils are NOT determined here — they come from the Phenomena table cascade (result 75+), handled in Phase 2.

### collectPsychicModifiers(allModifiers)
Filters collected modifiers for `psychic-test` and `no-perils` effect types.
```
Returns: { testBonus: number, noPerils: boolean, noPerilsSource: string, parts: [] }
```

### buildFocusPowerModifiers(wp, effectivePR, miscModifier, psychicModifiers)
Builds the target number and modifier breakdown for chat display.

Target number = WP + (5 × effectivePR) + psychicTestBonus + miscModifier, but capped so that 91+ always fails.
```
Returns: { targetNumber, modifierParts[] }
```

Example (WP 55, Unfettered PR 5, Psychic Hood +10):
```
55 Base Willpower
+25 Psy Rating (5 × 5)
+10 Psychic Hood
= Target: 90
```

Example (WP 55, Fettered PR 3 → ePR 2):
```
55 Base Willpower
+10 Psy Rating (5 × 2)
= Target: 65
```

Example (WP 55, Push PR 5 → ePR 8):
```
55 Base Willpower
+40 Psy Rating (5 × 8)
= Target: 95 → capped at 90 (91+ always fails)
```

### calculateDegreesOfSuccess(roll, targetNumber)
Reuse existing `CombatDialogHelper.calculateDegreesOfSuccess()`.

## Chat Message Format

Chat messages use the same collapsible `<details>` modifier breakdown as ranged and melee combat. Built via a `buildFocusPowerLabel` and `buildFocusPowerFlavor` pair, following the existing `buildAttackLabel` / `buildAttackFlavor` pattern in `combat-dialog.mjs`.

### buildFocusPowerLabel(powerName, targetNumber, effectivePR, powerLevel, success, dos, roll)
Builds the header line:
```html
[Focus Power] Smite — Target: 80
Effective Psy Rating: 5 (Unfettered)
<strong>SUCCESS</strong> (5 Degrees of Success)
```

### buildFocusPowerFlavor(label, modifierParts, phenomenaLine, fatigueLine)
Wraps the label with a collapsible modifier breakdown, same `<details>` HTML as `buildAttackFlavor`:
```html
[Focus Power] Smite — Target: 80
Effective Psy Rating: 5 (Unfettered)
<strong>SUCCESS</strong> (5 Degrees of Success)
<details style="margin-top:4px;">
  <summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary>
  <div style="font-size:0.85em;margin-top:4px;">
    55 Base Willpower<br>
    +25 Psy Rating (5 × 5)
  </div>
</details>
```

### Examples

#### Successful Focus Power
```
[Focus Power] Smite — Target: 80
Effective Psy Rating: 5 (Unfettered)
Roll: 23 — SUCCESS (5 Degrees of Success)

▸ Modifiers
  55 Base Willpower
  +25 Psy Rating (5 × 5)
```

#### Failed Focus Power
```
[Focus Power] Smite — Target: 80
Effective Psy Rating: 5 (Unfettered)
Roll: 85 — FAILED (0 Degrees of Failure)

▸ Modifiers
  55 Base Willpower
  +25 Psy Rating (5 × 5)
```

#### Automatic Failure (91+)
```
[Focus Power] Smite — Target: 90
Effective Psy Rating: 8 (Push)
Roll: 93 — FAILED (Automatic failure: 91+)
⚡ PSYCHIC PHENOMENA — Push!

▸ Modifiers
  55 Base Willpower
  +40 Psy Rating (5 × 8)
  (capped at 90)
```
Note: Push still triggers Phenomena even on failure.

#### With Psychic Test Modifier
```
[Focus Power] Smite — Target: 90
Effective Psy Rating: 5 (Unfettered)
Roll: 42 — SUCCESS (4 Degrees of Success)

▸ Modifiers
  55 Base Willpower
  +25 Psy Rating (5 × 5)
  +10 Psychic Hood
```

#### Unfettered with Phenomena (Doubles)
```
[Focus Power] Smite — Target: 80
Effective Psy Rating: 5 (Unfettered)
Roll: 33 — SUCCESS (4 Degrees of Success)
⚡ PSYCHIC PHENOMENA — Doubles rolled!

▸ Modifiers
  55 Base Willpower
  +25 Psy Rating (5 × 5)
```
Followed by automatic Psychic Phenomena table draw (separate chat message from Foundry's roll table system).

#### Push with Phenomena (No Doubles)
```
[Focus Power] Smite — Target: 90
Effective Psy Rating: 8 (Push)
Roll: 23 — SUCCESS (6 Degrees of Success)
⚡ PSYCHIC PHENOMENA — Push!

▸ Modifiers
  55 Base Willpower
  +40 Psy Rating (5 × 8)
  (capped at 90)
```
Followed by automatic Psychic Phenomena table draw.

#### Push with Phenomena + Fatigue (Doubles)
```
[Focus Power] Smite — Target: 90
Effective Psy Rating: 8 (Push)
Roll: 44 — SUCCESS (4 Degrees of Success)
⚡ PSYCHIC PHENOMENA — Push!
💀 FATIGUE — Doubles on Push! (+1 Fatigue)

▸ Modifiers
  55 Base Willpower
  +40 Psy Rating (5 × 8)
  (capped at 90)
```
Followed by automatic Psychic Phenomena table draw. Actor's fatigue.value incremented by 1.

## Implementation

### PsychicCombatHelper (psychic-combat.mjs)

```javascript
export class PsychicCombatHelper {
  // Pure calculation functions (testable)
  static calculateEffectivePsyRating(basePR, powerLevel) { }
  static isDoubles(roll) { }
  static checkPsychicEffects(roll, powerLevel) { }
  static collectPsychicModifiers(allModifiers) { }
  static buildFocusPowerModifiers(wp, effectivePR, miscModifier, psychicModifiers) { }
  static buildFocusPowerLabel(powerName, targetNumber, effectivePR, powerLevel, success, dos, roll) { }
  static buildFocusPowerFlavor(label, modifierParts, phenomenaLine, fatigueLine) { }

  // Stored state for Righteous Fury confirmation (Phase 4)
  static lastFocusPowerTarget = null;

  // Dialog (UI, istanbul ignore)
  static async focusPowerDialog(actor, power) { }

  // Roll table integration (Phase 2)
  static async rollPhenomena() { }
  static async rollPerils() { }
}
```

### Constants (constants.mjs)

```javascript
export const POWER_LEVELS = {
  FETTERED: 'fettered',
  UNFETTERED: 'unfettered',
  PUSH: 'push'
};

export const POWER_LEVEL_LABELS = {
  [POWER_LEVELS.FETTERED]: 'Fettered',
  [POWER_LEVELS.UNFETTERED]: 'Unfettered',
  [POWER_LEVELS.PUSH]: 'Push'
};

// In EFFECT_TYPES:
PSYCHIC_TEST: 'psychic-test',
NO_PERILS: 'no-perils',

// In EFFECT_TYPE_LABELS:
[EFFECT_TYPES.PSYCHIC_TEST]: 'Psychic Test',
[EFFECT_TYPES.NO_PERILS]: 'No Perils of the Warp',
```

### Dialog Modifier Collection

The dialog collects modifiers from the actor using the existing system:
```javascript
// In focusPowerDialog:
const allModifiers = ModifierCollector.collectAllModifiers(actor);
const psychicMods = PsychicCombatHelper.collectPsychicModifiers(allModifiers);
```

This means any equipped item, talent, trait, chapter, or armor history with a `psychic-test` or `no-perils` modifier will automatically apply.

### Dialog Content HTML

```javascript
const content = `
  <div style="text-align: center; margin-bottom: 10px;">
    <img src="${power.img}" alt="${power.name}" style="max-width: 100px; max-height: 100px; border: none;" />
  </div>
  <div style="display: flex; gap: 20px; margin-bottom: 8px; font-size: 0.9em;">
    <span><strong>Action:</strong> ${power.system.action}</span>
    <span><strong>Range:</strong> ${power.system.range}</span>
  </div>
  <div style="display: flex; gap: 20px; margin-bottom: 8px; font-size: 0.9em;">
    <span><strong>Opposed:</strong> ${power.system.opposed}</span>
    <span><strong>Sustained:</strong> ${power.system.sustained}</span>
  </div>
  ...
`;
```

This matches the existing pattern in `ranged-combat.mjs` and `melee-combat.mjs` where `weapon.img` is shown centered at the top.

### Fatigue Application (Push + Doubles)

When Push + doubles detected, increment actor fatigue:
```javascript
if (effects.fatigue) {
  const currentFatigue = actor.system.fatigue?.value || 0;
  await FoundryAdapter.updateDocument(actor, {
    "system.fatigue.value": currentFatigue + 1
  });
}
```

### Actor Sheet Wiring

In `actor-psychic-powers.html`, add a "Use" button:
```html
<a class="item-control psychic-power-use" title="Use Power"><i class="fas fa-bolt"></i></a>
```

In `actor-sheet.mjs`, wire the click:
```javascript
html.find('.psychic-power-use').click(ev => {
  const li = $(ev.currentTarget).parents('.item');
  const item = this.actor.items.get(li.data('itemId'));
  PsychicCombatHelper.focusPowerDialog(this.actor, item);
});
```

## Roll Table Integration

Use Foundry's built-in roll table API to draw from existing tables:
```javascript
static async rollPhenomena() {
  const table = game.tables.getName("Psychic Phenomena")
    || await game.packs.get("deathwatch.tables")?.getDocuments()
      .then(docs => docs.find(d => d.name === "Psychic Phenomena"));
  if (table) await table.draw();
}
```

This automatically creates a chat message with the table result, including the icon styling we already have.

## Test Plan

### File: `tests/combat/psychic-combat.test.mjs`

**calculateEffectivePsyRating** (~8 tests)
- Fettered halves and rounds up (odd/even PR values)
- Unfettered returns full PR
- Push adds 3
- Edge cases: PR 0, PR 1

**isDoubles** (~8 tests)
- True for 11, 22, 33, 44, 55, 66, 77, 88, 99
- True for 100 (treated as 00)
- False for 12, 01, 50, 95

**checkPsychicEffects** (~8 tests)
- Fettered: never phenomena, never fatigue
- Fettered + doubles: still no phenomena, no fatigue
- Unfettered + doubles: phenomena, no fatigue
- Unfettered + no doubles: no phenomena, no fatigue
- Push + no doubles: phenomena, no fatigue
- Push + doubles: phenomena AND fatigue
- Push + 100: phenomena AND fatigue (100 = doubles)

**collectPsychicModifiers** (~8 tests)
- Empty modifiers returns zero bonus, noPerils false
- Single psychic-test modifier returns correct bonus
- Multiple psychic-test modifiers stack
- Disabled modifiers ignored
- no-perils modifier sets flag true
- no-perils + psychic-test combined
- Non-psychic modifiers ignored
- Source name captured for no-perils

**buildFocusPowerLabel** (~6 tests)
- Success with DoS
- Failure with DoF
- Automatic failure (91+) shows special message
- Includes power name, target number, ePR, power level
- Phenomena line appended when triggered
- Fatigue line appended when Push + doubles

**buildFocusPowerFlavor** (~4 tests)
- Wraps label with collapsible `<details>` modifier breakdown
- Empty modifier parts still produces valid HTML
- Phenomena/fatigue lines appear before the `<details>` block
- Matches `buildAttackFlavor` HTML structure

**buildFocusPowerModifiers** (~12 tests)
- Base WP + PR bonus only
- With misc modifier
- With psychic-test bonus
- With negative psychic-test penalty
- Combined: PR bonus + psychic-test + misc
- Fettered PR halved → smaller bonus (WP 55, PR 5 → ePR 3 → +15)
- Push PR +3 → larger bonus (WP 55, PR 5 → ePR 8 → +40)
- Target number capped at 90 (91+ always fails)
- High WP + high PR still capped at 90
- Modifier parts include PR bonus line
- Modifier parts show "(capped at 90)" when capped
- Zero modifiers omitted from parts

**Estimated total: ~54 tests**

## Edge Cases

- **PR 0**: Effective PR is 0 for Fettered/Unfettered (Push gives 3). WP bonus is 0 (or 15 for Push). Focus test still possible.
- **91+ always fails**: Even with WP 70 + PR 8 (target 110), a roll of 91 is a failure. Target number capped at 90 for display and DoS calculation.
- **No Psy Rating**: Button should not appear if actor has no psyRating or psyRating.value is 0. Validate in dialog.
- **Tyranid psykers**: Same workflow — they have psyRating on actor system.
- **Sustained powers**: Phase 1 does not track sustained state. Just note "Sustained: Yes" in chat.
- **Extended actions**: Phase 1 does not track multi-round actions. Just note "Action: Extended (10)" in chat.
- **Fatigue overflow**: If fatigue exceeds TB, actor falls unconscious. Existing fatigue system handles this via `applyFatigueModifiers()`.
- **Roll of 100**: Treated as 00 for doubles detection (both digits are 0).
- **Psychic vs Hordes**: Hits = Effective PR (+1d10 for area powers). This uses the existing `calculateHitsReceived()` polymorphic pattern on `DeathwatchHorde`. Area detection is based on power description (future Phase 4 schema field). For Phase 1, the chat message notes the effective PR for GM reference.
- **Righteous Fury**: Psychic damage powers can trigger Righteous Fury. The confirmation roll reuses the Focus Power target number (not raw WP). The confirmation roll does NOT trigger Phenomena. Phase 1 stores `lastFocusPowerTarget` so Phase 4 damage rolls can reference it for Fury confirmation.
