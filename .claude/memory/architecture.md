---
name: architecture
description: Core architectural patterns used in this system
type: project
---

## TypeDataModel Pattern (Foundry v13)

The system uses Foundry v13's programmatic schema approach:

**DataModel classes** (`src/module/data/`) define schemas and derived data computation:
- `base-document.mjs` - Root class with shared templates
- `actor/*.mjs` - 4 actor type DataModels (Character, NPC, Enemy, Horde)
- `item/*.mjs` - 17 item type DataModels

**Document classes** (`src/module/documents/`) are thin shells that delegate to DataModels:
- `actor.mjs` - Delegates to `DeathwatchActorBase` → concrete actor types
- `item.mjs` - Delegates to `DeathwatchItemBase` → concrete item types

**Registration** in `deathwatch.mjs`:
```javascript
CONFIG.Actor.dataModels = {
  character: models.DeathwatchCharacter,
  enemy: models.DeathwatchEnemy,
  horde: models.DeathwatchHorde,
  npc: models.DeathwatchNPC
};
```

## Polymorphic Combat System

Combat methods defined in `DeathwatchActorBase` and overridden as needed:
- `getArmorValue(location)` - Character looks up armor by location; Horde uses single value
- `getDefenses()` - Returns armor map, natural armor, toughness bonus
- `receiveDamage(damageData)` - Main damage entry point (Horde overrides for magnitude-based)
- `receiveBatchDamage(damageArray)` - For hordes (multi-hit from Full Auto/Blast/Flame)

**Horde-specific:**
- Health = magnitude × 10
- Single armor value (no hit locations)
- Blast/flame hits multiply by 1.5×
- Explosive weapons add +1d10 per hit

## Helper Organization

Helpers contain pure business logic (testable without Foundry globals):

**Combat** (`src/module/helpers/combat/`):
- `combat.mjs` - Main combat logic (hit location, armor, damage)
- `ranged-combat.mjs` - BS tests, rate of fire, jamming
- `melee-combat.mjs` - WS tests, charge, All Out Attack
- `horde-combat.mjs` - Magnitude damage, blast/flame multipliers
- `psychic-combat.mjs` - Focus Power tests, Phenomena/Perils
- `weapon-quality-helper.mjs` - 24+ weapon qualities (Tearing, Accurate, Melta, etc.)

**Character** (`src/module/helpers/character/`):
- `modifier-collector.mjs` - Collects modifiers from items/talents/chapters
- `modifiers.mjs` - Applies modifiers to characteristics/skills/armor
- `xp-calculator.mjs` - XP computation, rank determination

**UI** (`src/module/helpers/ui/`):
- `chat-message-builder.mjs` - Builds combat chat messages
- `templates.mjs` - Preloads Handlebars templates

## FoundryAdapter Pattern

All Foundry API calls route through `foundry-adapter.mjs`, which is mocked in tests. This enables 100% unit testing without a running Foundry instance.

Example:
```javascript
// Instead of: await item.update({...})
await FoundryAdapter.updateDocument(item, {...});
```

Tests mock the adapter:
```javascript
FoundryAdapter.updateDocument = jest.fn();
```

## Modifier System

Items, talents, chapters, and traits can modify character attributes:

```json
{
  "modifier": 5,
  "effectType": "characteristic",
  "valueAffected": "str",
  "enabled": true
}
```

**Effect types:**
- `characteristic` - Pre-multiplier (e.g., +5 STR)
- `characteristic-post-multiplier` - Post-multiplier
- `skill` - Skill modifier
- `initiative`, `wounds`, `armor`, `psy-rating` - Direct stat modifiers
- `movement`, `movement-restriction` - Movement modifiers
- `psychic-test`, `no-perils` - Psychic power modifiers

Modifiers collected by `ModifierCollector.collectAllModifiers(actor)` and applied in DataModel `prepareDerivedData()`.
