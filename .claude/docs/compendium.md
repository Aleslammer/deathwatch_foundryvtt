# Compendium Pack System

**Source files**: `src/packs-source/` (JSON, version controlled)  
**Compiled packs**: `src/packs/` (LevelDB, generated, not version controlled)

---

## Adding Compendium Content

1. Create a JSON file in the appropriate `src/packs-source/` subdirectory
2. Assign a unique `_id` following the pack's ID convention (see `src/packs-source/_templates/` for examples)
3. Run `npm run build:packs` to validate and compile
4. The build will fail if any duplicate IDs are detected across all packs

---

## Pack ID Conventions

Each pack has a prefix pattern for IDs:

- **Weapons**: `weapon-xxx`
- **Armor**: `armor-xxx`
- **Talents**: `talent-xxx`
- **Psychic Powers**: `power-xxx`
- **Enemies**: `enemy-xxx` (individual), `horde-xxx` (hordes)
- **Weapon Upgrades**: `upgrade-xxx`
- **Cybernetics**: `cyb-xxx`
- **Chapters**: `chapter-xxx`
- **Specialties**: `spec-xxx`

**Important**: IDs must be unique across ALL packs, not just within a single pack.

---

## Book References

All compendium items include `book` and `page` fields:

```json
{
  "_id": "talent-001",
  "name": "Ambidextrous",
  "type": "talent",
  "system": {
    "book": "Deathwatch Core Rulebook",
    "page": "143",
    "description": "..."
  }
}
```

**Standard book abbreviations**:
- `"Deathwatch Core Rulebook"` (most items)
- `"Rites of Battle"`
- `"The Achilus Assault"`
- `"Mark of the Xenos"`
- `"First Founding"`

---

## Compendium Structure

```
src/packs-source/
├── _templates/          # Example templates for new items
├── weapons/             # All weapon items (bolters, chainswords, etc.)
├── armor/               # Armor items (power armor, scout armor, etc.)
├── talents/             # Talents (Ambidextrous, Bolter Drill, etc.)
├── psychic-powers/      # Psychic powers (Smite, Compel, etc.)
├── enemies/             # Enemy actors (Orks, Tyranids, etc.)
├── hordes/              # Horde actors (Ork Boyz, Termagants, etc.)
├── weapon-upgrades/     # Weapon attachments (scopes, mono-edges, etc.)
├── cybernetics/         # Cybernetic implants (servo-arms, bionics, etc.)
├── chapters/            # Space Marine chapters (Ultramarines, Blood Angels, etc.)
├── specialties/         # Deathwatch specialties (Apothecary, Techmarine, etc.)
└── macros/              # Pre-built macros (Quick Dodge, Flame Attack, etc.)
```

---

## Build Pipeline

### 1. Validation (`npm run build:packs`)

Checks for:
- Duplicate IDs across all packs
- Valid JSON syntax
- Required fields present
- Schema validation

### 2. Compilation

Converts JSON source files → LevelDB databases in `src/packs/`

### 3. Format (`npm run format:json`)

Compacts and formats all JSON files for consistency.

---

## Adding a New Item

### Example: Adding a New Weapon

1. Create file: `src/packs-source/weapons/plasma-gun.json`

```json
{
  "_id": "weapon-plasma-gun",
  "name": "Plasma Gun",
  "type": "weapon",
  "img": "systems/deathwatch/assets/icons/weapons/plasma-gun.webp",
  "system": {
    "key": "plasma-gun-standard",
    "book": "Deathwatch Core Rulebook",
    "page": "165",
    "class": "Plasma",
    "type": "Basic",
    "damage": "1d10+6",
    "penetration": 6,
    "range": {
      "short": 30,
      "normal": 60,
      "long": 120,
      "extreme": 240
    },
    "rateOfFire": {
      "single": true,
      "semiAuto": true,
      "fullAuto": false
    },
    "clip": 10,
    "reload": "Full",
    "qualities": ["overheats", "maximal"],
    "weight": 18,
    "availability": "Rare"
  }
}
```

2. Run `npm run build:packs` to validate and compile

3. Check Foundry: Open compendium pack → Verify new item appears

---

## Key Field Pattern

All items should include a `key` field for stable identification (see [item-patterns.md](item-patterns.md) for details).

**Why?** IDs change when items are copied, names can be changed by users. Keys remain stable.

---

## Common Mistakes

### ❌ Duplicate IDs
```json
// weapons/bolter.json
{ "_id": "weapon-001", "name": "Bolter" }

// weapons/boltgun.json  
{ "_id": "weapon-001", "name": "Boltgun" }  // ERROR: Duplicate ID
```

### ❌ Missing Required Fields
```json
{
  "_id": "weapon-002",
  "name": "Chainsword",
  "type": "weapon"
  // ERROR: Missing 'system' object
}
```

### ❌ Invalid ID Pattern
```json
{
  "_id": "bolter-001",  // ERROR: Should be "weapon-001"
  "name": "Bolter"
}
```

---

## Templates

Check `src/packs-source/_templates/` for example templates of each item type.

---

_Compendium data sanctified and organized._ ⚙️
