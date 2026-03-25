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

#### Tyranid Warrior
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmy00000000003` | `tyranid-warrior.json` |

**Stats:** WS 55, BS 30, S 60, T 50, AG 44, INT 22, PER 35, WP 50, Fel 0
**Wounds:** 48
**Skills:** Awareness, Climb, Swim +10
**Talents:** Fearless, Swift Attack
**Traits:** Dark Sight, Fear 3 (Horrifying), Natural Armour (8), Multiple Arms, Unnatural Strength (×2), Unnatural Toughness (×2), Improved Natural Weapons (Scything Talons or Rending Claws), Shadow in the Warp, Size (Enormous), Synapse Creature, Tyranid
**Weapons:** Scything Talons (1d10+2 R, Pen 3, Melee, equipped), Rending Claws (1d10 R, Pen 5, Melee, unequipped), Devourer (1d10+9 R, Pen 0, Range 30, -/-/6, equipped), Deathspitter (1d10+12 E, Pen 4, Range 40, S/3/-, unequipped)
**Token:** 2x2 (Enormous)
**Source:** Deathwatch Core Rulebook, p. 370

#### Tyranid Shrike
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmy00000000004` | `tyranid-shrike.json` |

**Stats:** Identical to Tyranid Warrior
**Wounds:** 48
**Difference from Warrior:** Adds Flyer (10) trait. Shrikes are winged Tyranid Warriors.
**Traits:** Same as Warrior + Flyer (10)
**Weapons:** Same as Warrior
**Token:** 2x2 (Enormous)
**Source:** Deathwatch Core Rulebook, p. 370

#### Carnifex
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmy00000000005` | `carnifex.json` |

**Stats:** WS 35, BS 25, S 70, T 55, AG 22, INT 20, PER 35, WP 45, Fel 0
**Wounds:** 100
**Skills:** Awareness, Climb, Swim, Tracking
**Talents:** Ambidextrous, Berserk Charge, Combat Master, Fearless, Furious Assault, Heightened Senses (Sound), Heightened Senses (Smell), Iron Jaw, Swift Attack, True Grit, Two-Weapon Wielder (Melee)
**Traits:** Brutal Charge, Dark Sight, Fear 3 (Horrifying), Improved Natural Weapons (Scything Talons), Multiple Arms, Natural Armour (10), Regeneration (5), Size (Massive), Sturdy, Unnatural Strength (×3), Unnatural Toughness (×2), Tyranid
**Weapons:** Scything Talons (1d10+2 R, Pen 3, Melee), Bio-Plasma (3d10+10 E, Pen 9, Range 30, S/-/-, Blast 5, Living Ammunition)
**Token:** 3x3 (Massive)
**Source:** Deathwatch Core Rulebook, p. 370

#### Carnifex (Thornback)
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmy00000000006` | `carnifex-thornback.json` |

**Stats:** WS 35, BS 35, S 70, T 55, AG 22, INT 20, PER 40, WP 45, Fel 0
**Wounds:** 100
**Differences from base Carnifex:** +10 BS, +5 Per. Replaces Swift Attack and Two-Weapon Wielder (Melee) with Two-Weapon Wielder (Ballistic). Adds Toxic (1d10) trait. Replaces weapons with ranged loadout.
**Talents:** Ambidextrous, Berserk Charge, Combat Master, Fearless, Furious Assault, Heightened Senses (Sound), Heightened Senses (Smell), Iron Jaw, True Grit, Two-Weapon Wielder (Ballistic)
**Traits:** Same as Carnifex + Toxic (1d10)
**Weapons:** Devourer (1d10+6 R, Pen 0, Range 30, -/-/6, Twin-linked, Living Ammunition, Storm, Tearing), Stranglethorn Cannon (2d10+10 I, Pen 3, Range 80, S/-/-, Blast 10, Deadly Snare, Devastating 2, Living Ammunition, Tearing)
**Token:** 3x3 (Massive)
**Source:** Deathwatch Core Rulebook, p. 370

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
| Termagant | `enmyitem0000030`–`enmyitem0000039` | `horditem0000030`–`horditem0000039` |
| Tyranid Warrior | `enmyitem0000040`–`enmyitem0000073` | N/A |
| Tyranid Shrike | `enmyitem0000080`–`enmyitem0000097` | N/A |
| Carnifex | `enmyitem0000100`–`enmyitem0000142` | N/A |
| Carnifex (Thornback) | `enmyitem0000150`–`enmyitem0000175` | N/A |

## Icon Requirements
Each enemy needs artwork at:
- `src/icons/enemies/tyranid/{name}.webp` — individual enemy
- `src/icons/enemies/tyranid/{name}_horde.webp` — horde variant

## Notes
- Natural Armour trait includes an `armor` effectType modifier with the value
- Hormagaunt has Natural Armour (3) trait but horde `armor` field is 2 (appears to be a data discrepancy — trait says 3, horde armor says 2)
- Termagant horde `armor` field matches Natural Armour (3)
- Fleshborer weapon stats match the compendium weapon (`tyranid000000005`)
- Tyranid Warrior has no horde variant
- Tyranid Shrike is a Warrior variant with Flyer (10) trait added
- Multiple Arms trait includes +10 Toughness characteristic modifier
- Carnifex has no horde variant
- Carnifex (Thornback) is a ranged variant of the Carnifex
- Build validation ensures no duplicate `_id` values across all packs
