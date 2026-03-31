# Enemies & Hordes Compendium

## Overview
Enemy and horde actors are stored in `src/packs-source/enemies/` organized by faction subfolder. Each enemy has a normal (enemy type) and optionally a horde variant (horde type).

## ID Conventions (Faction-Based)

All enemy/horde IDs use a faction-based format for self-documenting, collision-free identifiers. IDs are always **16 characters**.

### Actor IDs
- **Enemy**: `enmy{faction}{padding}{number}` — e.g., `enmytyranid00001`, `enmyork000000001`
- **Horde**: `hord{faction}{padding}{number}` — e.g., `hordtyranid00001`, `hordork000000001`

### Embedded Item IDs
- **Enemy items**: `ei{faction}{number}{padding}0{seq}` — e.g., `eityranid0100001`, `eiork0100000001`
- **Horde items**: `hi{faction}{number}{padding}0{seq}` — e.g., `hityranid0100001`, `hiork0100000001`

Where `{number}` matches the actor number and `{seq}` is a zero-padded sequential item index (01, 02, ...).

### Adding a New Faction
1. Create subfolder: `src/packs-source/enemies/{faction}/`
2. Choose a short faction key (e.g., `tyranid`, `ork`, `tau`, `chaos`)
3. Number enemies sequentially within the faction starting at `01`
4. Add the faction to `builds/scripts/migrateEnemyIds.mjs` FACTIONS array
5. Run the migration script to assign IDs, then `npm run build:packs`

### Adding a New Enemy to an Existing Faction
1. Create JSON file in the faction subfolder
2. Use the next sequential number for the faction
3. Add to `migrateEnemyIds.mjs` and run it, OR manually assign IDs following the pattern
4. Run `npm run build:packs` to validate

### Migration Script
`builds/scripts/migrateEnemyIds.mjs` — Assigns faction-based IDs to all enemies/hordes. Supports multiple factions. Safe to re-run (idempotent on numbering). Run `npm run format:json` after to restore key ordering.

## Compendium Entries

### Tyranid (`enemies/tyranid/`)

#### Hormagaunt
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00001` | `hormagaunt.json` |
| Horde | `hordtyranid00001` | `hormagaunt-horde.json` |

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
| Enemy | `enmytyranid00002` | `termagant.json` |
| Horde | `hordtyranid00002` | `termagant-horde.json` |

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
| Enemy | `enmytyranid00003` | `tyranid-warrior.json` |

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
| Enemy | `enmytyranid00004` | `tyranid-shrike.json` |

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
| Enemy | `enmytyranid00005` | `carnifex.json` |

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
| Enemy | `enmytyranid00006` | `carnifex-thornback.json` |

**Stats:** WS 35, BS 35, S 70, T 55, AG 22, INT 20, PER 40, WP 45, Fel 0
**Wounds:** 100
**Differences from base Carnifex:** +10 BS, +5 Per. Replaces Swift Attack and Two-Weapon Wielder (Melee) with Two-Weapon Wielder (Ballistic). Adds Toxic (1d10) trait. Replaces weapons with ranged loadout.
**Talents:** Ambidextrous, Berserk Charge, Combat Master, Fearless, Furious Assault, Heightened Senses (Sound), Heightened Senses (Smell), Iron Jaw, True Grit, Two-Weapon Wielder (Ballistic)
**Traits:** Same as Carnifex + Toxic (1d10)
**Weapons:** Devourer (1d10+6 R, Pen 0, Range 30, -/-/6, Twin-linked, Living Ammunition, Storm, Tearing), Stranglethorn Cannon (2d10+10 I, Pen 3, Range 80, S/-/-, Blast 10, Deadly Snare, Devastating 2, Living Ammunition, Tearing)
**Token:** 3x3 (Massive)
**Source:** Deathwatch Core Rulebook, p. 370

#### Carnifex (Venomspitter)
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00007` | `carnifex-venomspitter.json` |

**Stats:** WS 35, BS 40, S 70, T 55, AG 22, INT 20, PER 45, WP 45, Fel 0
**Wounds:** 100
**Differences from base Carnifex:** +15 BS, +10 Per. Adds Spore Cysts trait. Replaces weapons with twin Heavy Venom Cannons.
**Traits:** Same as Carnifex + Spore Cysts
**Weapons:** Heavy Venom Cannon ×2 (4d10+10 I, Pen 6, Range 100, S/-/-, Blast 6, Living Ammunition, Toxic)
**Token:** 3x3 (Massive)
**Source:** Deathwatch Core Rulebook, p. 370

#### Carnifex (Bile-Beast)
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00008` | `carnifex-bile-beast.json` |

**Stats:** WS 35, BS 25, S 70, T 55, AG 22, INT 20, PER 35, WP 45, Fel 0
**Wounds:** 100
**Differences from base Carnifex:** Adds Dorsal Chimneys and Spore Cysts traits. Mixed ranged/melee loadout.
**Traits:** Same as Carnifex + Dorsal Chimneys, Spore Cysts
**Weapons:** Deathspitters (twin-linked, tearing), Rending Claws (Razor Sharp), Prehensile Tongue (Flexible, Snare)
**Token:** 3x3 (Massive)
**Source:** Deathwatch Core Rulebook, p. 370

#### Purestrain Genestealer
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00009` | `purestrain-genestealer.json` |

**Stats:** WS 65, BS 0, S 45, T 40, AG 40, INT 35, PER 60, WP 45, Fel 0
**Wounds:** 20
**Skills:** Awareness +10, Climb +10, Dodge +10, Swim +10
**Talents:** Ambidextrous, Fearless, Hard Target, Leap Up, Lightning Attack, Lightning Reflexes, Step Aside, Swift Attack
**Traits:** Dark Sight, Fear 2 (Frightening), Improved Natural Weapons (Rending Claws), Multiple Arms, Natural Armour (4), Unnatural Agility (×2), Unnatural Speed, Unnatural Strength (×2), Unnatural Toughness (×2), Tyranid
**Weapons:** Rending Claws (1d10+4 R, Pen 5, Melee, Razor Sharp)
**Token:** 1x1 (default)
**Source:** Mark of the Xenos, p. 39

#### Broodlord
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00010` | `broodlord.json` |

**Stats:** WS 75, BS 0, S 45, T 40, AG 50, INT 45, PER 60, WP 55, Fel 0
**Wounds:** 50
**Psy Rating:** 5
**Skills:** Awareness +10, Climb +10, Dodge +10, Swim +10
**Talents:** Ambidextrous, Fearless, Hard Target, Leap Up, Lightning Attack, Lightning Reflexes, Step Aside, Swift Attack
**Traits:** Dark Sight, Fear 2 (Frightening), Improved Natural Weapons (Rending Claws), Multiple Arms, Natural Armour (6), Unnatural Agility (×2), Unnatural Speed, Unnatural Strength (×3), Unnatural Toughness (×3), Tyranid
**Weapons:** Rending Claws (1d10+4 R, Pen 5, Melee, Razor Sharp)
**Psychic Powers:** Hypnotic Gaze (embedded), plus 2 selectable Tyranid Psychic Powers (Mark of the Xenos, p. 29)
**Differences from Purestrain Genestealer:** +10 WS, +10 AG, +10 INT, +10 WIL, +30 Wounds, Natural Armour 4→6, Unnatural STR/TG ×2→×3, Psy Rating 5
**Token:** 1x1 (default)
**Source:** Mark of the Xenos, p. 39

#### Hive Tyrant
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00011` | `hive-tyrant.json` |

**Stats:** WS 78, BS 33, S 60, T 53, AG 45, INT 45, PER 49, WP 70, Fel 0
**Wounds:** 120
**Psy Rating:** 8
**Talents:** Ambidextrous, Combat Master, Crushing Blow, Fearless, Heightened Senses (All), Two-Weapon Wielder (Melee), Swift Attack, Lightning Attack
**Traits:** Brutal Charge, Dark Sight, Fear 4 (Terrifying), Natural Armour (10), Multiple Arms, Unnatural Strength (×3), Unnatural Toughness (×3), Improved Natural Weapons, Shadow in the Warp, Size (Massive), Synapse Creature, Tyranid
**Psychic Powers:** Catalyst, Psychic Scream, The Horror
**Special:** Death Shock (shockwave on death affects nearby Tyranids)
**Token:** 3×3 (Massive)
**Source:** Deathwatch Core Rulebook, p. 369

#### Gargoyle
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00012` | `gargoyle.json` |
| Horde | `hordtyranid00003` | `gargoyle-horde.json` |

**Stats:** WS 30, BS 33, S 32, T 30, AG 40, INT 10, PER 40, WP 30, Fel 0
**Wounds:** 9 (Enemy), Magnitude 30 (Horde)
**Talents:** Death From Above, Leap Up
**Traits:** Dark Sight, Flyer (20), Natural Armour (3), Natural Weapons (Teeth and Claws), Instinctive Behaviour (Lurk), Tyranid
**Weapons:** Fleshborer (1d10+9 R, Pen 3), Teeth and Claws (1d10+3 R, Pen 3, Primitive)
**Special:** Blinding Venom (head hits blind on failed TG test), Enclosed Spaces (gains Frenzy/Furious Assault)
**Source:** Mark of the Xenos, p. 36

#### Lictor
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00013` | `lictor.json` |

**Stats:** WS 65, BS 0, S 65, T 40, AG 40, INT 25, PER 45, WP 45, Fel 0
**Wounds:** 40
**Skills:** 11 skills, many at +20 (Awareness, Climb, Concealment, Shadowing, Silent Move, Survival, Tracking)
**Talents:** 16 talents (Ambidextrous through Swift Attack)
**Traits:** Dark Sight, Fear 3, Instinctive Behaviour (Lurk), Natural Armour (6), Multiple Arms, Unnatural Agility/Strength/Perception/Toughness (×2), Improved Natural Weapons, Size (Enormous), Tyranid
**Weapons:** Scything Talons (Toxic), Rending Claws (Razor Sharp + Toxic)
**Special:** Flesh Hooks (10m grapple), Chameleonic Scales (-30 to detect), Memory Devourer
**Token:** 2×2 (Enormous)
**Source:** Mark of the Xenos, p. 37

#### Ravener
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00014` | `ravener.json` |

**Stats:** WS 60, BS 0, S 45, T 40, AG 50, INT 17, PER 50, WP 35, Fel 0
**Wounds:** 40
**Talents:** Fearless, Heightened Senses (All), Sprint, Swift Attack, Lightning Attack
**Traits:** Dark Sight, Fear 3, Burrower, Instinctive Behaviour (Feed), Natural Armour (6), Multiple Arms, Unnatural Strength/Toughness (×2), Improved Natural Weapons, Size (Enormous), Tyranid, Unnatural Senses (30m)
**Weapons:** Scything Talons, Rending Claws (equipped), Devourer, Deathspitter, Spine Fists (unequipped)
**Special:** Extraordinary Senses (never worse than -30 PER), Surprise Strike (auto-surprise from burrowing)
**Token:** 2×2 (Enormous)
**Source:** Mark of the Xenos, p. 41

#### Ripper Swarm
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00015` | `ripper-swarm.json` |
| Horde | `hordtyranid00004` | `ripper-swarm-horde.json` |

**Stats:** WS 35, BS 0, S 25, T 30, AG 40, INT 10, PER 30, WP 30, Fel 0
**Wounds:** 10 (Enemy), Magnitude 30 (Horde)
**Talents:** Fearless, Heightened Senses (Smell); Horde adds Swift Attack
**Traits:** Burrower (1), Crawler, Dark Sight, Improved Natural Weapons (Mandibles), Instinctive Behaviour (Feed), Natural Armour (2), Size (Puny), Tyranid; Horde adds Overwhelming, Fear 1
**Weapons:** Mandibles (1d5+3 R, Pen 3); Horde adds Tearing
**Special:** Tenacious Grappler (-10 WS instead of -20), Biomorphs (optional Toxic/Flyer/Unnatural TG)
**Source:** Mark of the Xenos, p. 43

#### Spinespitter
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmytyranid00016` | `spinespitter.json` |
| Horde | `hordtyranid00005` | `spinespitter-horde.json` |

**Stats:** Same as Ripper Swarm but BS 30
**Differences from Ripper Swarm:** +30 BS, adds Spinespitter ranged weapon
**Weapons:** Mandibles + Spinespitter (Pistol, 20m, -/3/-, 1d10+1 I, Pen 0, Living Ammunition)
**Source:** Mark of the Xenos, p. 43

#### Ork Boy
| Variant | ID | File |
|---------|-----|------|
| Enemy | `enmyork000000001` | `ork-boy.json` |
| Horde | `hordork000000001` | `ork-boy-horde.json` |

## Tyranid Psychic Powers
10 powers in `packs-source/psychic-powers/Tyranid/`:
- Hypnotic Gaze (`psy00000000059`) — Broodlord unique, opposed WP, immobilize target
- Catalyst (`psy00000000060`) — Horde gains 10+1d10 Magnitude
- Dominion (`psy00000000061`) — Double synapse range, +10 WP to Tyranids
- Leech Essence (`psy00000000062`) — Drain life from target, heal self
- Onslaught (`psy00000000063`) — Grant free action to brood
- Paroxysm (`psy00000000064`) — Reduce target WS/BS to 10
- Psychic Scream (`psy00000000065`) — 1d10+8 Impact to head, Shocking
- The Horror (`psy00000000066`) — Cohesion damage, fear-based flee
- Warp Blast (`psy00000000067`) — 1d10 Energy x PR, area effect
- Warp Lance (`psy00000000068`) — 2d10 Energy x PR, single target

## Horde vs Enemy Differences
When creating a horde variant from an enemy:
- Type changes from `enemy` to `horde`
- `wounds` represents Magnitude (typically 30)
- `armor` field added (single value, not location-based) — set to Natural Armour value
- Overwhelming (Horde) trait added
- Same characteristics, skills, talents, and weapons
- Icon uses `_horde` suffix (e.g., `termagant_horde.webp`)
- Token name appends " Horde"

## Enemy Classification
All enemy and horde actors have a `classification` field in `system`:
- `"human"` — Human enemies (default for base actor)
- `"xenos"` — Aliens (Tyranids, Orks, Tau, etc.) (default for enemy/horde DataModel)
- `"chaos"` — Chaos enemies

**Purpose:** Used by Deathwatch Training talent for Righteous Fury auto-confirm (only triggers vs xenos).
**UI:** Dropdown on enemy/horde/NPC sheet headers.
**Schema:** `DeathwatchActorBase` has `classification` with initial `"human"`. `DeathwatchEnemy` overrides initial to `"xenos"`. All compendium enemies have `classification` set explicitly.

## Icon Requirements
Each enemy needs artwork at:
- `src/icons/enemies/{faction}/{name}.webp` — individual enemy
- `src/icons/enemies/{faction}/{name}_horde.webp` — horde variant

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
- Purestrain Genestealer is a melee-only elite with 4 Unnatural traits
- Build validation ensures no duplicate `_id` values across all packs
