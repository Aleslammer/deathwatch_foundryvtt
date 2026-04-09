# Macros Compendium Guide

The Deathwatch system includes a **Macros** compendium pack with pre-built macros that players and GMs can drag to their hotbar.

## Accessing the Compendium

1. Open the **Compendium Packs** sidebar tab
2. Find **Deathwatch: Macros**
3. Browse available macros
4. **Drag any macro to your hotbar** to use it

## Available Macros

### GM Macros

#### 🔥 Flame Attack
- **Purpose**: GM macro for flame weapon attacks
- **Usage**: Target a token, run macro, configure flame weapon stats
- **Features**:
  - Configure damage, penetration, damage type, and weapon range
  - Automatic horde hit calculation (range/4 + 1d5)
  - Individual targets roll Dodge (Agility test)
  - Failed dodge triggers damage + Catch Fire test
  - Automatically applies "On Fire" status if catch fire fails
- **Best for**: GMs managing flame weapon attacks

#### 🔥 On Fire Round
- **Purpose**: Apply effects of being "On Fire" for one combat round
- **Usage**: Target a burning token at the start of their turn, run macro
- **Effects**:
  - 1d10 Energy damage (ignores armor)
  - +1 Fatigue
  - WP test to act normally (Power Armor auto-passes)
  - Extinguish test option (AG -20, Hard)
- **Best for**: GMs tracking burning characters each round

### Combat Reactions

#### Quick Dodge
- **Purpose**: Instantly roll a Dodge skill test
- **Usage**: Select a token, click the macro
- **Roll**: Dodge skill test (Challenging +0)
- **Best for**: Quick reactions without modifier dialog

#### Quick Parry
- **Purpose**: Instantly roll a Parry characteristic test
- **Usage**: Select a token, click the macro
- **Roll**: Weapon Skill characteristic test (Challenging +0)
- **Best for**: Quick reactions without modifier dialog

#### Dodge or Parry
- **Purpose**: Choose between Dodge or Parry with custom modifiers
- **Usage**: Select a token, click the macro, choose reaction type
- **Features**:
  - Shows current Dodge skill and WS values
  - Custom modifier input field
  - Helpful reminder text about reaction types
- **Best for**: When you need to add situational modifiers

#### Defensive Stance
- **Purpose**: Dodge or Parry with automatic +20 bonus
- **Usage**: Select a token, click the macro, choose reaction type
- **Features**:
  - Automatically applies +20 Defensive Stance bonus
  - Additional modifier field for other bonuses/penalties
  - Shows adjusted values in dropdown
- **Best for**: Characters in Defensive Stance

#### Combat Reactions (Advanced)
- **Purpose**: Comprehensive reaction macro with all modifiers
- **Usage**: Select a token, click the macro, configure situation
- **Features**:
  - ✅ Automatic talent detection (Lightning Reflexes, Blademaster, Step Aside)
  - ✅ Defensive Stance toggle (+20)
  - ✅ Called Shot toggle (-20)
  - ✅ Multiple attacker tracking (cumulative -20 per additional attacker)
  - ✅ Custom modifier field
  - ✅ Modifier summary notification
- **Best for**: Complex combat situations with multiple modifiers

## How to Use Macros

### Method 1: Drag to Hotbar (Recommended)
1. Open **Compendium Packs** → **Deathwatch: Macros**
2. Drag the macro to your hotbar (numbered slots 1-10)
3. Select your token
4. Press the hotbar number key or click the macro button

### Method 2: Execute from Compendium
1. Open **Compendium Packs** → **Deathwatch: Macros**
2. Select your token
3. Right-click the macro → **Execute**

### Method 3: Import to World Macros
1. Open **Compendium Packs** → **Deathwatch: Macros**
2. Right-click the macro → **Import**
3. The macro appears in your **Macro Directory**
4. Drag it to your hotbar from there

## Important Notes

### Dodge vs Parry

**Dodge is a SKILL test:**
- Uses `game.deathwatch.rollSkill(actorId, 'dodge', options)`
- Benefits from training (trained/expert/mastered)
- Total value = AG + training bonuses + modifiers

**Parry is a CHARACTERISTIC test:**
- Uses `game.deathwatch.rollCharacteristic(actorId, 'ws', options)`
- Raw WS value only
- No skill training bonuses

### Token Selection Required

All combat reaction macros require a token to be selected on the canvas. If no token is selected, you'll see a warning: "Please select a token first".

### GM vs Player Usage

All macros have `"ownership": { "default": 0 }`, meaning:
- **GMs** can use them on any token
- **Players** can use them on tokens they own/control

## Creating Custom Macros

You can create your own macros using the Deathwatch API:

```javascript
// Skill test
await game.deathwatch.rollSkill(actorId, 'awareness', {
  modifier: 10,
  difficulty: 'Easy',
  skipDialog: true
});

// Characteristic test
await game.deathwatch.rollCharacteristic(actorId, 'str', {
  modifier: -20,
  difficulty: 'Hard',
  skipDialog: false
});
```

See `docs/macro-api.md` for the full API reference.

## Adding New Macros to the Compendium

For system developers:

1. Create a new JSON file in `src/packs-source/macros/`
2. Use the template from `src/packs-source/_templates/macro-template.json`
3. Assign a unique `_id` with prefix `macro-xxxxx`
4. Run `npm run build:packs` to compile
5. The macro appears in the Macros compendium

### Macro ID Conventions

All macro IDs must follow the pattern: `macro-xxxxx`

Examples:
- `macro-quick-dodge`
- `macro-quick-parry`
- `macro-defensive-stance`
- `macro-combat-reactions`
- `macro-flame-attack`
- `macro-on-fire-round`

## See Also

- **Full API Documentation**: `docs/macro-api.md`
- **Combat Reactions Guide**: `docs/COMBAT-REACTIONS-GUIDE.md`
- **Example Macros**: `docs/example-macros/`
