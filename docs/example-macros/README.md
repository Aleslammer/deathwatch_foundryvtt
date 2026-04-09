# Example Macros - Learning Resources

This folder contains **learning examples** for advanced users who want to write custom macro scripts using the Deathwatch API.

**Looking for ready-to-use macros?** → Open **Compendium Packs** → **Deathwatch: Macros** in Foundry and drag them to your hotbar!

---

## What's Here

These examples demonstrate advanced macro scripting techniques:

### Skill Test Examples

**`contextual-awareness.js`** - Awareness test with scene conditions
- Shows how to calculate modifiers based on game state
- Demonstrates checking for equipment (Auspex)
- Good example of conditional logic

**`skill-selector.js`** - Dialog to choose which skill to roll
- Shows how to build custom dialogs with ApplicationV2
- Demonstrates iterating over actor skills
- Good for understanding dialog callbacks

**`party-awareness.js`** - GM macro to roll for entire party
- Shows how to filter actors by type and ownership
- Demonstrates batch operations
- GM-only macro pattern

**`opposed-test.js`** - Roll same skill for two selected tokens
- Shows how to work with multiple selected tokens
- Good example of sequential rolls

### Characteristic Test Examples

**`quick-strength.js`** - Simple Strength test
- Minimal example of characteristic rolling
- Good starting point for learning

**`servo-arm-strength.js`** - Strength test with cybernetic detection
- Shows how to check for equipped cybernetics
- Demonstrates conditional API options
- Good example of item filtering

**`characteristic-selector.js`** - Dialog to choose which characteristic
- Shows how to build dialogs with characteristic data
- Demonstrates dynamic option generation
- Good for understanding characteristic API

**`toughness-with-wounds.js`** - Toughness test with wound penalties
- Shows how to check actor health state
- Demonstrates talent detection
- Good example of conditional modifiers

**`willpower-fear.js`** - Fear test with difficulty scaling
- Shows how to map ratings to difficulties
- Demonstrates talent-based auto-pass logic
- Good example of rule automation

---

## How to Use These Examples

These are **learning resources**, not ready-to-use macros. Here's how to use them:

### 1. Read the Code
Open the `.js` files in a text editor and read the comments. Each example demonstrates specific techniques.

### 2. Create a Test Macro
1. Open Foundry VTT and load your Deathwatch world
2. Click the **Macros Directory** button in the bottom toolbar
3. Click **Create Macro**
4. Set the **Type** to "Script"
5. Copy the contents of one of the `.js` files
6. Paste into the macro editor
7. Give it a name and click **Save**

### 3. Experiment and Customize
All examples include comments marking customization points:

```javascript
// ===== CUSTOMIZE THESE CONDITIONS =====
const isDark = false;
const isNoisy = false;
// ======================================
```

Feel free to:
- Change skill/characteristic names
- Adjust difficulty presets and modifiers
- Add your own conditions and logic
- Combine patterns from multiple examples

---

## Learning Path

**New to macro scripting?** Follow this path:

1. **Start with simple examples:**
   - `quick-strength.js` - Minimal characteristic test
   - `contextual-awareness.js` - Skill test with basic conditions

2. **Learn about dialogs:**
   - `skill-selector.js` - Basic dialog with dropdowns
   - `characteristic-selector.js` - Dynamic option generation

3. **Explore advanced patterns:**
   - `servo-arm-strength.js` - Item detection and conditional logic
   - `toughness-with-wounds.js` - Multiple condition checks
   - `party-awareness.js` - Batch operations and filtering

4. **Read the full API reference:**
   - See `../macro-api.md` for complete documentation
   - Covers all available methods and options

### Basic Template

Start your own macros with this template:

```javascript
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// Skill test
await game.deathwatch.rollSkill(token.actor.id, 'skillName', {
  modifier: 0,
  difficulty: 'Challenging',
  skipDialog: false
});

// OR characteristic test
await game.deathwatch.rollCharacteristic(token.actor.id, 'str', {
  modifier: 0,
  difficulty: 'Challenging',
  skipDialog: false
});
```

## Troubleshooting

**"Actor not found"**
- Make sure you've selected a token first
- Check that `canvas.tokens.controlled[0]` is not undefined

**"Skill not found"**
- Check the skill name spelling (use lowercase, e.g., 'dodge', not 'Dodge')
- Skill names with spaces use hyphens (e.g., 'forbidden-lore', not 'Forbidden Lore')
- Use `console.log(token.actor.system.skills)` to see all available skill keys

**"Advanced skill must be trained"**
- The character doesn't have the skill trained
- Either train the skill or try a different character

**Dialog doesn't show**
- Check if `skipDialog: true` is set
- Remove that option or set it to `false` to show dialog

## Need Help?

- Check `../macro-api.md` for full documentation
- Press F12 to open browser console and check for errors
- Look at the source code of working macros to learn patterns
- File an issue on GitHub if you find a bug
