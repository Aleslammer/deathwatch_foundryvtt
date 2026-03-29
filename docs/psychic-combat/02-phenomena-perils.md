# Phase 2 — Phenomena & Perils Integration

## Goal
Wire the Focus Power Test result into the existing Psychic Phenomena and Perils of the Warp roll tables, producing automatic follow-up chat messages when triggered.

## Trigger Rules (Summary)

| Power Level | Phenomena | On Doubles |
|-------------|-----------|------------|
| Fettered | Never | Nothing |
| Unfettered | On doubles | Phenomena |
| Push | Always | +1 Fatigue |

### Perils of the Warp
Perils are **never** triggered directly by a power level. They only occur via the Phenomena table cascade:
1. Phenomena is triggered (by Unfettered doubles or Push)
2. Roll on Psychic Phenomena table (1d100)
3. If result is 75–100 → the entry says "Perils of the Warp" → roll on Perils table

### no-perils Modifier
When an actor has an enabled `no-perils` modifier (from any source):
- Phenomena still trigger normally per power level rules
- When Phenomena table result is 75+ (Perils cascade), the Perils roll is **skipped**
- Chat shows: "🛡 Perils of the Warp suppressed by [source name]"

## Existing Roll Tables

### Psychic Phenomena (`rolltable00000003`)
- Formula: 1d100
- 26 results covering ranges 1–100
- Result 75–100: "Perils of the Warp" (triggers cascade)
- Located in `src/packs-source/tables/psychic-phenomena.json`

### Perils of the Warp (`rolltable00000004`)
- Formula: 1d100
- 18 results covering ranges 1–100
- Severity escalates: minor effects (1–30) → major (31–78) → catastrophic (79–100)
- Located in `src/packs-source/tables/perils-of-the-warp.json`

## Implementation

### Table Lookup
```javascript
static async _getTable(tableName) {
  // 1. Check world tables
  let table = game.tables?.getName(tableName);
  if (table) return table;

  // 2. Check compendium
  const pack = game.packs?.get("deathwatch.tables");
  if (pack) {
    const index = await pack.getIndex();
    const entry = index.find(e => e.name === tableName);
    if (entry) return pack.getDocument(entry._id);
  }
  return null;
}
```

### Drawing from Tables
Use Foundry's `RollTable.draw()` which:
- Rolls the formula (1d100)
- Selects the matching result
- Creates a formatted chat message with icon
- Returns the draw result for inspection

```javascript
static async rollPhenomena() {
  const table = await this._getTable("Psychic Phenomena");
  if (!table) {
    FoundryAdapter.showNotification('warn', 'Psychic Phenomena table not found.');
    return null;
  }
  const draw = await table.draw();
  return draw;
}
```

### Perils Cascade Detection
After drawing from Phenomena, check if the result falls in the 75–100 range:
```javascript
static async handlePhenomena(roll, powerLevel, noPerils, noPerilsSource) {
  const { phenomena, fatigue } = this.checkPsychicEffects(roll, powerLevel);
  if (!phenomena) return { phenomena: false, fatigue: false };

  const draw = await this.rollPhenomena();

  // Check for Perils cascade (result 75-100 on Phenomena table)
  if (draw?.results?.[0]) {
    const result = draw.results[0];
    const range = result.range;
    if (range && range[0] >= 75) {
      if (noPerils) {
        // Post suppression message
        await ChatMessage.create({
          content: `🛡 <strong>Perils of the Warp suppressed</strong> by ${noPerilsSource}`
        });
      } else {
        await this.rollPerils();
      }
    }
  }

  return { phenomena: true, fatigue };
}
```

### Chat Message Flow

**Unfettered, roll 33 (doubles, Phenomena result 82):**
```
Chat Message 1: Focus Power result
  [Focus Power] Smite — Target: 55
  Effective Psy Rating: 5 (Unfettered)
  Roll: 33 — SUCCESS (2 DoS)
  ⚡ PSYCHIC PHENOMENA — Doubles rolled!

Chat Message 2: Psychic Phenomena table draw
  [Psychic Phenomena: 82 — "Perils of the Warp"]

Chat Message 3: Perils of the Warp table draw
  [Perils result with icon]
```

**Push, roll 44 (doubles = Fatigue, Phenomena result 15):**
```
Chat Message 1: Focus Power result
  [Focus Power] Smite — Target: 55
  Effective Psy Rating: 8 (Push)
  Roll: 44 — SUCCESS (1 DoS)
  ⚡ PSYCHIC PHENOMENA — Push!
  💀 FATIGUE — Doubles on Push! (+1 Fatigue)

Chat Message 2: Psychic Phenomena table draw
  [Psychic Phenomena: 15 — "Aura of Taint"]
```
No Perils because Phenomena result was 15 (not 75+).

**Push, roll 23 (no doubles, Phenomena result 90, with no-perils modifier):**
```
Chat Message 1: Focus Power result
  [Focus Power] Smite — Target: 55
  Effective Psy Rating: 8 (Push)
  Roll: 23 — SUCCESS (3 DoS)
  ⚡ PSYCHIC PHENOMENA — Push!

Chat Message 2: Psychic Phenomena table draw
  [Psychic Phenomena: 90 — "Perils of the Warp"]

Chat Message 3: Suppression notice
  🛡 Perils of the Warp suppressed by Warp Stabiliser
```

## Test Considerations

The table draw methods (`rollPhenomena`, `rollPerils`, `handlePhenomena`) interact with Foundry's `game.tables` API. These are best tested by:
- Mocking `game.tables.getName()` to return a mock table with `draw()` method
- Verifying `draw()` is called when phenomena triggers
- Verifying cascade logic (Phenomena 75+ → Perils)
- Verifying `no-perils` suppression

### Testable Logic (Pure Functions)
Already covered in Phase 1:
- `checkPsychicEffects(roll, powerLevel)` — returns `{ phenomena, fatigue }`
- `isDoubles(roll)` — doubles detection

### Integration Tests (~9 tests)
- Unfettered + doubles → `rollPhenomena()` called
- Unfettered + no doubles → nothing called
- Push + no doubles → `rollPhenomena()` called
- Push + doubles → `rollPhenomena()` called + fatigue applied
- Fettered → nothing called
- Phenomena cascade (75+ result) → `rollPerils()` called
- Phenomena cascade (75+ result) + noPerils → `rollPerils()` NOT called
- Phenomena result < 75 → `rollPerils()` NOT called
- noPerils suppression message includes source name

## CSS Considerations

Roll table result icons already have dark background styling from `base.css`:
```css
.table-draw .table-results img {
  background: #333;
  border-radius: 4px;
  padding: 2px;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}
```

No additional CSS needed for Phenomena/Perils chat messages.

## Edge Cases

- **Table not found**: Show warning notification, don't crash
- **Compendium not imported**: Fall back to compendium pack lookup
- **Multiple Phenomena in one round**: Each Focus Power test is independent
- **Phenomena result exactly 75**: Triggers Perils cascade
- **Fatigue overflow**: Handled by existing fatigue system (unconscious when fatigue > TB)
