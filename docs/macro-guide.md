# Deathwatch Macro System Guide

This guide covers all three ways to use macros in the Deathwatch system.

## Quick Start

**New to macros?** Start here:
1. Open **Compendium Packs** → **Deathwatch: Macros**
2. Drag a macro (like "Quick Dodge") to your hotbar
3. Select your token and press the hotbar number

That's it! You now have instant combat reactions.

---

## Three Types of Macros

### 1. Drag-and-Drop Item Macros

Drag any item from a character sheet to your hotbar to create a macro.

**What you can drag:**
- **Weapons** → Opens attack dialog with all combat options
- **Psychic Powers** → Opens Focus Power Test dialog
- **Other Items** → Posts item description to chat

**Customization:** You can edit weapon macros to pre-load combat options (aim, rate of fire, called shots, etc.). See [hotbar-macros.md](hotbar-macros.md) for full details.

**Example:**
```javascript
// Pre-configured for Semi-Auto burst fire
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  rof: 1,
  skipDialog: true
});
```

### 2. Compendium Macros (Pre-Built)

Ready-to-use macros in **Compendium Packs** → **Deathwatch: Macros**.

**Available Macros:**

**Combat Reactions:**
- **Quick Dodge** - Instant Dodge roll (Agility skill)
- **Quick Parry** - Instant Parry roll (Weapon Skill)
- **Dodge or Parry** - Choose between them with modifiers
- **Defensive Stance** - Dodge/Parry with +20 bonus
- **Combat Reactions** - Advanced macro with auto-modifiers for talents, multiple attackers, etc.

**GM Macros:**
- **🔥 Flame Attack** - Handle flame weapon attacks (damage, dodge, catch fire)
- **🔥 On Fire Round** - Apply On Fire effects each round

**Usage:** Select a token, drag the macro to your hotbar, press the hotbar number.

See [macros-compendium.md](macros-compendium.md) for detailed guide.

### 3. Custom Scripted Macros

Write your own macros using the Deathwatch API.

**Basic Example:**
```javascript
const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// Roll a skill test
await game.deathwatch.rollSkill(token.actor.id, 'awareness', {
  modifier: 10,
  difficulty: 'Hard'
});
```

**Available APIs:**
- `game.deathwatch.rollSkill(actorId, skillName, options)` - Skill tests
- `game.deathwatch.rollCharacteristic(actorId, charKey, options)` - Characteristic tests
- `game.deathwatch.getDifficulties()` - Get difficulty presets
- `game.deathwatch.getCharacteristics()` - Get characteristic keys

See [macro-api.md](macro-api.md) for complete API reference with examples.

**Learning Resources:** Check out [example-macros/](example-macros/) for 10+ example scripts you can learn from and customize.

---

## Combat Reactions Reference

Dodge and Parry are the most common macros you'll use. Quick reference:

**Dodge** (Agility-based SKILL):
- Benefits from training (trained/expert/mastered)
- Use `rollSkill(actorId, 'dodge', options)`

**Parry** (Weapon Skill CHARACTERISTIC):
- Uses raw WS value only
- Use `rollCharacteristic(actorId, 'ws', options)`

**Common Modifiers:**
- Defensive Stance: +20
- Lightning Reflexes (Dodge): +10
- Blademaster (Parry): +10
- 2nd attacker this round: -20
- 3rd attacker: -40
- Called Shot attack: -20

See [combat-reactions-guide.md](combat-reactions-guide.md) for scenarios and detailed examples.

---

## Tips

**For Players:**
- Keep Quick Dodge and Quick Parry on your hotbar for fast reactions
- Drag commonly used weapons to hotbar for quick attacks
- Use Defensive Stance macro when outnumbered

**For GMs:**
- Use Flame Attack macro for flame weapons (handles all mechanics)
- Use On Fire Round macro to track burning characters
- Create custom macros for recurring situations (Fear tests, poison checks, etc.)

**For Everyone:**
- Press F12 to open browser console if something goes wrong
- The macro API validates your inputs and shows helpful error messages
- You can have multiple macros for the same weapon with different presets

---

## File Reference

| File | Purpose |
|------|---------|
| [macro-guide.md](macro-guide.md) | **This file** - Main overview and quick start |
| [macros-compendium.md](macros-compendium.md) | Guide to pre-built compendium macros |
| [hotbar-macros.md](hotbar-macros.md) | Drag-and-drop item macros and weapon presets |
| [macro-api.md](macro-api.md) | Complete API reference for custom scripts |
| [combat-reactions-guide.md](combat-reactions-guide.md) | Dodge/Parry mechanics and scenarios |
| [example-macros/](example-macros/) | Learning examples for custom macros |

---

## Need Help?

1. Check the specific guide for your use case (see File Reference above)
2. Look at [example-macros/](example-macros/) for working code samples
3. Press F12 to check browser console for error messages
4. File an issue on GitHub if you find a bug
