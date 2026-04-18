# Item Identification Pattern

## The Problem

**Rule**: Never match items by ID or name.

- **IDs change** when Foundry copies items between actors or compendiums
- **Names can be changed** by users at any time

## The Solution: Key Field Pattern

**Pattern**: Use a `key` field for stable identification across item copies.

---

## Implementation

### 1. Add Key Field to Item Schema

Add `...DeathwatchItemBase.keyTemplate()` to item schema (provides `key` field):

```javascript
export class DeathwatchWeapon extends DeathwatchItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ...DeathwatchItemBase.keyTemplate(), // Adds 'key' field
      // ... other fields
    };
  }
}
```

### 2. Assign Unique Keys in Compendium Source Files

```json
{
  "_id": "weapon-001",
  "name": "Bolter",
  "type": "weapon",
  "system": {
    "key": "bolter-standard",
    "damage": "1d10+5",
    "penetration": 4
  }
}
```

**Key naming convention**:
- Use lowercase with hyphens
- Make it human-readable and descriptive
- Include quality/variant if needed (e.g., `bolter-master-crafted`)
- Must be unique within item type

### 3. Match Items by Key

```javascript
// ✅ Good: Match by key
static async hasUpgrade(weapon, upgradeKey) {
  const upgrades = await this.getUpgrades(weapon);
  return upgrades.some(u => u.system.key === upgradeKey);
}

// ✅ Good: Find item by key
const servo arm = actor.items.find(i => i.system.key === "servo-arm-standard");

// ❌ Bad: Match by ID (changes when copied)
const upgrade = actor.items.get(upgradeId);

// ❌ Bad: Match by name (user can rename)
const upgrade = actor.items.find(i => i.name === "Motion Predictor");
```

---

## When to Use

- ✅ Linking items (e.g., weapon → upgrade, weapon → cybernetic)
- ✅ Checking for specific items in code (e.g., "does actor have X talent?")
- ✅ Any cross-reference between items
- ✅ Special case detection (e.g., "is this a force weapon?")
- ❌ UI display (use `name` for display)
- ❌ User selection (user sees names, code converts to keys)

---

## Key Examples

### Weapons
- `bolter-standard`
- `bolter-master-crafted`
- `chainsword-astartes`
- `force-sword-nemesis`

### Weapon Upgrades
- `motion-predictor`
- `photo-sight`
- `red-dot-laser-sight`
- `mono-edge`

### Cybernetics
- `servo-arm-standard`
- `servo-arm-exceptional`
- `bionic-arm-standard`
- `bionic-eye-basic`

### Talents
- `ambidextrous`
- `bolter-drill`
- `lightning-reflexes`
- `hatred-orks`

---

## Reference Examples

**Weapon Upgrade Helper** (`src/module/helpers/combat/weapon-upgrade-helper.mjs`):
```javascript
static async hasUpgrade(weapon, upgradeKey) {
  const upgrades = await this.getUpgrades(weapon);
  return upgrades.some(u => u.system.key === upgradeKey);
}
```

**Weapon Upgrade Item** (`src/module/data/item/weapon-upgrade.mjs`):
```javascript
static defineSchema() {
  return {
    ...super.defineSchema(),
    ...DeathwatchItemBase.keyTemplate(), // Adds key field
    // ... other fields
  };
}
```

---

## Migration Strategy

If converting existing items without keys:

1. Generate keys from existing names (lowercase, replace spaces with hyphens)
2. Update all compendium source JSON files
3. Add key validation to build script
4. Update any existing ID-based lookups to use key-based lookups

---

_Item identification protocols sanctified._ ⚙️
