# Enemies & Hordes Compendium

## Overview
Enemy and horde actors are stored in `src/packs-source/enemies/` organized by faction subfolder. Each enemy has a normal (enemy type) and optionally a horde variant (horde type).

## ID Conventions
- **Enemy IDs**: `enmy00000000###`
- **Horde IDs**: `hord00000000###`
- **Embedded item IDs (enemy)**: `enmyitem00000##`
- **Embedded item IDs (horde)**: `horditem00000##`

## Compendium Entries

### Tyranid (`enemies/tyranid/`)

#### Hormagaunt
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmy00000000001` | `hormagaunt.json` |
| Horde | `hord00000000001` | `hormagaunt-horde.json` |

**Stats:** WS 45, BS 20, S 35, T 30, AG 55, INT 10, PER 40, WP 30, Fel 0
**Wounds:** 9 (Enemy), Magnitude 30 (Horde)
**Horde Armor:** 2 (Natural Armour)
**Skills:** Acrobatics +20, Awareness, Dodge +10, Silent Move, Swim +10
**Talents:** Leap Up, Swift Attack
**Traits:** Dark Sight, Natural Armour (3), Improved Natural Weapons, Instinctive Behaviour (Feed), Tyranid, Overwhelming (Horde), Unnatural Speed
**Weapons:** Scything Talons (1d10+3 R, Pen 3, Melee)
**Source:** Deathwatch Core Rulebook, p. 369

#### Termagant
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmy00000000002` | `termagant.json` |
| Horde | `hord00000000002` | `termagant-horde.json` |

**Stats:** WS 30, BS 33, S 32, T 30, AG 40, INT 10, PER 40, WP 30, Fel 0
**Wounds:** 9 (Enemy), Magnitude 30 (Horde)
**Horde Armor:** 3 (Natural Armour)
**Skills:** Awareness, Climb, Dodge, Silent Move, Swim +10
**Talents:** Leap Up
**Traits:** Dark Sight, Natural Armour (3), Improved Natural Weapons (Teeth and Claws), Instinctive Behaviour (Lurk), Tyranid, Overwhelming (Horde — horde only)
**Weapons:** Fleshborer (1d10+9 R, Pen 3, Range 20, S/-/-, Proven/Tearing/Living Ammunition), Teeth and Claws (1d10+3 R, Pen 3, Melee)
**Source:** Deathwatch Core Rulebook, p. 369

## Horde vs Enemy Differences
When creating a horde variant from an enemy:
- Type changes from `enemy` to `horde`
- `wounds` represents Magnitude (typically 30)
- `armor` field added (single value, not location-based) — set to Natural Armour value
- Overwhelming (Horde) trait added
- Same characteristics, skills, talents, and weapons
- Icon uses `_horde` suffix (e.g., `termagant_horde.webp`)
- Token name appends " Horde"

## Embedded Item ID Ranges
| Enemy | Enemy Items | Horde Items |
|-------|------------|-------------|
| Hormagaunt | `enmyitem0000010`–`enmyitem0000026` | `horditem0000010`–`horditem0000026` |
| Termagant | `enmyitem0000030`–`enmyitem0000037` | `horditem0000030`–`horditem0000038` |

## Icon Requirements
Each enemy needs artwork at:
- `src/icons/enemies/tyranid/{name}.webp` — individual enemy
- `src/icons/enemies/tyranid/{name}_horde.webp` — horde variant

## Notes
- Natural Armour trait includes an `armor` effectType modifier with the value
- Hormagaunt has Natural Armour (3) trait but horde `armor` field is 2 (appears to be a data discrepancy — trait says 3, horde armor says 2)
- Termagant horde `armor` field matches Natural Armour (3)
- Fleshborer weapon stats match the compendium weapon (`tyranid000000005`)
- Build validation ensures no duplicate `_id` values across all packs
