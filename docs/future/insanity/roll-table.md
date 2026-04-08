# Battle Trauma RollTable

## Overview

The Battle Trauma table uses Foundry VTT's native RollTable system instead of code-based lookups. This provides:

- **Visual table UI** for GMs to view and edit
- **Direct item references** to battle-trauma compendium items
- **Native roll integration** with `RollTable.draw()`
- **Easy customization** - GMs can add house-rule traumas
- **Chat integration** - Rolls post to chat automatically

---

## RollTable Structure

### Location
`src/packs-source/roll-tables/battle-trauma-table.json`

### Table Configuration

```json
{
  "_id": "BattleTraumaTable001",
  "name": "Battle Trauma Table",
  "description": "Roll on this table when a Battle-Brother fails an Insanity Test. Each result grants a permanent Battle Trauma.",
  "formula": "1d10",
  "replacement": true,
  "displayRoll": true,
  "folder": null,
  "sort": 0,
  "flags": {},
  "results": [
    {
      "_id": "result001",
      "type": 2,
      "text": "Battle Rage",
      "img": "systems/deathwatch/assets/icons/battle-trauma.svg",
      "documentCollection": "deathwatch.battle-traumas",
      "documentId": "BattleRage001",
      "weight": 2,
      "range": [1, 2],
      "drawn": false,
      "flags": {}
    },
    {
      "_id": "result002",
      "type": 2,
      "text": "Ear of the Emperor",
      "img": "systems/deathwatch/assets/icons/battle-trauma.svg",
      "documentCollection": "deathwatch.battle-traumas",
      "documentId": "EarOfEmperor001",
      "weight": 2,
      "range": [3, 4],
      "drawn": false,
      "flags": {}
    },
    {
      "_id": "result003",
      "type": 2,
      "text": "Ancestral Spirits",
      "img": "systems/deathwatch/assets/icons/battle-trauma.svg",
      "documentCollection": "deathwatch.battle-traumas",
      "documentId": "AncestralSpirits001",
      "weight": 2,
      "range": [5, 6],
      "drawn": false,
      "flags": {}
    },
    {
      "_id": "result004",
      "type": 2,
      "text": "Righteous Contempt",
      "img": "systems/deathwatch/assets/icons/battle-trauma.svg",
      "documentCollection": "deathwatch.battle-traumas",
      "documentId": "RighteousContempt001",
      "weight": 2,
      "range": [7, 8],
      "drawn": false,
      "flags": {}
    },
    {
      "_id": "result005",
      "type": 2,
      "text": "Endless Redemption",
      "img": "systems/deathwatch/assets/icons/battle-trauma.svg",
      "documentCollection": "deathwatch.battle-traumas",
      "documentId": "EndlessRedemption001",
      "weight": 2,
      "range": [9, 10],
      "drawn": false,
      "flags": {}
    }
  ]
}
```

### Field Explanations

- **`formula`**: `"1d10"` - The dice formula to roll
- **`replacement`**: `true` - Allow duplicate rolls (we handle duplicates in code)
- **`displayRoll`**: `true` - Show the dice roll in chat
- **`type`**: `2` - Document type (2 = link to compendium item)
- **`documentCollection`**: Compendium pack ID (e.g., `"deathwatch.battle-traumas"`)
- **`documentId`**: ID of the item in the compendium
- **`weight`**: Number of results (2 = 2 entries on d10)
- **`range`**: `[min, max]` - The dice range for this result

---

## Using the RollTable

### Manual Roll (GM)

1. Open RollTables sidebar
2. Find "Battle Trauma Table"
3. Click "Roll" button
4. Result posts to chat with trauma details

### Programmatic Use

```javascript
import { FoundryAdapter } from './foundry-adapter.mjs';

/**
 * Roll for a battle trauma using the RollTable.
 * 
 * @param {DeathwatchActor} actor - The character gaining trauma
 * @returns {Promise<Item|null>} The trauma item or null if failed
 */
async function rollBattleTrauma(actor) {
  // Get the table
  const tablePack = game.packs.get("deathwatch.roll-tables");
  const table = tablePack 
    ? await tablePack.getDocument(tablePack.index.find(t => t.name === "Battle Trauma Table")?._id)
    : game.tables.getName("Battle Trauma Table");
  
  if (!table) {
    ui.notifications.error("Battle Trauma Table not found!");
    return null;
  }
  
  // Roll on table
  const draw = await table.draw({ 
    displayChat: false  // We'll handle chat message ourselves
  });
  
  const result = draw.results[0];
  
  // Get the trauma item from compendium
  const pack = game.packs.get(result.documentCollection);
  const traumaItem = await pack.getDocument(result.documentId);
  
  return traumaItem;
}
```

### Duplicate Prevention

```javascript
async function rollBattleTraumaWithDuplicateCheck(actor) {
  const existingTraumas = actor.items.filter(i => i.type === "battle-trauma");
  const existingKeys = new Set(existingTraumas.map(t => t.system.key));
  
  let attempts = 0;
  const MAX_ATTEMPTS = 20;
  
  while (attempts < MAX_ATTEMPTS) {
    const trauma = await rollBattleTrauma(actor);
    
    if (!trauma) return null;
    
    // Check if already have this trauma
    if (!existingKeys.has(trauma.system.key)) {
      return trauma;  // Found a new one!
    }
    
    // Duplicate - notify and reroll
    ui.notifications.info(`${actor.name} already has ${trauma.name}, rerolling...`);
    attempts++;
  }
  
  ui.notifications.warn(`${actor.name} has all possible battle traumas!`);
  return null;
}
```

---

## GM Customization

### Adding Custom Traumas

1. **Create trauma item** in battle-traumas compendium
2. **Open Battle Trauma Table** from RollTables sidebar
3. **Add new result**:
   - Set text to trauma name
   - Link to new trauma item
   - Assign weight/range
4. **Adjust existing ranges** if needed

### Adjusting Probabilities

Change the `weight` field to adjust how often a trauma appears:

```json
{
  "text": "Battle Rage",
  "weight": 3,        // Now appears on 1-3 (instead of 1-2)
  "range": [1, 3]
}
```

### House Rules

Example: Add a 6th trauma "Warp Sight":

```json
{
  "_id": "result006",
  "type": 2,
  "text": "Warp Sight",
  "documentCollection": "deathwatch.battle-traumas",
  "documentId": "WarpSight001",
  "weight": 1,
  "range": [11, 11],  // Requires rolling 1d10+1 or changing formula
  "drawn": false
}
```

Then change table formula to `"1d10+1"` or rebalance existing weights.

---

## Compendium Pack Configuration

### Location
`src/system.json`

Add roll-tables pack:

```json
{
  "packs": [
    {
      "name": "battle-traumas",
      "label": "Battle Traumas",
      "type": "Item",
      "path": "packs/battle-traumas"
    },
    {
      "name": "roll-tables",
      "label": "Roll Tables",
      "type": "RollTable",
      "path": "packs/roll-tables"
    }
  ]
}
```

### Build Command

```bash
# Compile source JSON to LevelDB
npm run build:packs
```

This will process:
- `src/packs-source/roll-tables/*.json` → `src/packs/roll-tables/`
- `src/packs-source/battle-traumas/*.json` → `src/packs/battle-traumas/`

---

## Integration with Insanity System

### When to Roll

Battle Trauma is rolled when:
1. Character fails an Insanity Test (WP test after gaining 10+ IP)
2. GM manually awards a trauma (via table or direct item)

### Workflow

```
Gain 10+ IP
    ↓
Trigger Insanity Test Dialog
    ↓
Roll 1d100 vs WP (with track modifier)
    ↓
Success: No trauma
    ↓
Failure: Roll on Battle Trauma Table
    ↓
Check for duplicates → Reroll if needed
    ↓
Add trauma item to character
    ↓
Post result to chat
```

### Chat Message

When a trauma is rolled, the system posts:

```
┌────────────────────────────────────────┐
│ BATTLE TRAUMA - Brother Alaric         │
├────────────────────────────────────────┤
│ Roll: 1d10 = 7                         │
│                                        │
│ Result: Righteous Contempt             │
│                                        │
│ The Battle-Brother sees the taint of  │
│ the enemy everywhere and becomes       │
│ paranoid about corruption.             │
│                                        │
│ Effect: -10 Fellowship with non-       │
│ Astartes allies                        │
└────────────────────────────────────────┘
```

---

## Testing

### Unit Tests

```javascript
describe('Battle Trauma RollTable', () => {
  let table;
  
  beforeEach(async () => {
    const pack = game.packs.get("deathwatch.roll-tables");
    table = await pack.getDocument("BattleTraumaTable001");
  });
  
  test('table exists in compendium', () => {
    expect(table).toBeDefined();
    expect(table.name).toBe("Battle Trauma Table");
  });
  
  test('has 5 results for d10', () => {
    expect(table.results.size).toBe(5);
  });
  
  test('all results link to battle-trauma items', async () => {
    for (const result of table.results) {
      expect(result.documentCollection).toBe("deathwatch.battle-traumas");
      
      const pack = game.packs.get(result.documentCollection);
      const item = await pack.getDocument(result.documentId);
      
      expect(item).toBeDefined();
      expect(item.type).toBe("battle-trauma");
    }
  });
  
  test('ranges cover 1-10', () => {
    const ranges = Array.from(table.results).map(r => r.range);
    
    expect(ranges).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
      [9, 10]
    ]);
  });
  
  test('can draw from table', async () => {
    const draw = await table.draw({ displayChat: false });
    
    expect(draw.results).toHaveLength(1);
    
    const result = draw.results[0];
    const pack = game.packs.get(result.documentCollection);
    const trauma = await pack.getDocument(result.documentId);
    
    expect(trauma.type).toBe("battle-trauma");
  });
});
```

---

## Migration from Old System

If upgrading from a code-based trauma lookup:

1. **Remove** `rollRange` field from Battle Trauma item schema
2. **Create** RollTable compendium with table JSON
3. **Update** `rollBattleTrauma()` to use `table.draw()`
4. **Test** duplicate prevention still works
5. **Document** for GMs: how to customize the table

---

## Benefits Summary

✅ **Native Foundry integration** - Uses built-in RollTable system  
✅ **Visual editing** - GMs can see and edit table in UI  
✅ **Easy customization** - Add house-rule traumas without code  
✅ **Better UX** - Familiar RollTable interface for GMs  
✅ **Automatic chat** - Table rolls post to chat with rich formatting  
✅ **Reusable** - Could create variant tables (e.g., "Lesser Traumas", "Severe Traumas")  
✅ **Follows Foundry patterns** - Standard approach used by other systems
