# Product Overview

## Purpose
Warhammer 40k: Deathwatch is a custom game system implementation for Foundry Virtual Tabletop (VTT). This system enables players and game masters to run Warhammer 40k Deathwatch tabletop RPG campaigns in a digital environment, providing character management, combat mechanics, and item tracking specific to the Deathwatch setting.

## Value Proposition
- Provides a complete digital implementation of the Warhammer 40k Deathwatch RPG system
- Automates complex game mechanics including characteristic-based skill checks, combat calculations, and modifier management
- Offers pre-configured compendium packs for weapons, armor, ammunition, and gear
- Integrates seamlessly with Foundry VTT's core features (initiative tracking, token management, etc.)
- Reduces manual bookkeeping and calculation overhead for players and GMs

## Key Features

### Character Management
- Full character sheet implementation with all nine Deathwatch characteristics (WS, BS, STR, TG, AG, INT, PER, WIL, FS)
- Comprehensive skill system with basic and advanced skills
- Characteristic bonuses automatically calculated
- Wounds and fatigue tracking with token integration
- Biography and character progression tracking
- Modifier system for temporary and permanent character adjustments

### Combat System
- Initiative formula: 1d10 + Agility Bonus + Initiative Bonus
- Weapon management with damage types and capacity tracking
- Ammunition loading and tracking system
- Armor system with location-based protection (head, body, arms, legs)
- Combat-specific modifiers and effects

### Item System
- Weapons with damage, type, capacity, and loaded ammunition tracking
- Armor with location-based protection values and armor histories
- Gear items with requisition and renown requirements
- Ammunition with quantity and capacity management
- Characteristic items for special abilities

### Compendium Packs
- Pre-configured ammunition types
- Weapon catalog (Imperial, Tau, Tyranid)
- Armor sets with histories
- General gear and equipment
- Talents (200+ talents)
- Traits (50+ traits)
- Chapters (9 Space Marine chapters)
- Specialties (6 specialties: Tactical, Assault, Devastator, Apothecary, Librarian, Techmarine)
- Implants (19 Space Marine implants)
- Cybernetics (mechanical augmentations)
- Weapon Qualities (35+ qualities, including Force weapons for psykers)
- Weapon Upgrades (attachments and modifications)
- Demeanours (19 personality traits)
- Critical Effects (by damage type)
- Roll Tables (scatter, haywire effects)
- All items include book references and page numbers

### Lore and Knowledge System
- Common Lore (Adeptus Astartes, Deathwatch, Imperium, etc.)
- Forbidden Lore (Daemonology, Heresy, Xenos, etc.)
- Scholastic Lore (Codex Astartes, Tactica Imperialis, etc.)
- Cipher skills for various languages and codes
- Investigation and interaction skill categories

## Target Users

### Game Masters
- Run Deathwatch campaigns with automated mechanics
- Manage NPCs and encounters
- Access pre-built item libraries
- Track combat and initiative

### Players
- Create and manage Space Marine characters
- Track skills, characteristics, and equipment
- Roll skill checks and combat actions
- Manage ammunition and gear loadouts

### Use Cases
- Running official Deathwatch RPG campaigns (Jericho Reach, etc.)
- Custom Warhammer 40k Space Marine missions
- One-shot tactical combat scenarios
- Long-term campaign character progression
- Multi-player cooperative gameplay sessions


### Talents and Traits System
- Talent management with prerequisites, benefits, and XP costs
- Trait tracking for special abilities and characteristics
- Clickable talent/trait names post full details to chat
- Drag-and-drop from compendium packs
- Integrated into Characteristics tab for easy access
- Chat cards display all relevant information (prerequisite, benefit, description, source)

### Augmentations System
- **Implants**: 19 standard Space Marine biological implants
  - Secondary Heart, Ossmodula, Biscopea, Haemastamen, Larraman's Organ
  - Catalepsean Node, Preomnor, Omophagea, Multi-lung, Occulobe
  - Lyman's Ear, Sus-an Membrane, Melanchromic Organ, Oolitic Kidney
  - Neuroglottis, Mucranoid, Betcher's Gland, Progenoids, Black Carapace
  - Each implant includes summary and full description
  - Clickable names post full details to chat
- **Cybernetics**: Mechanical augmentations with modifier support
  - Equipped/unequipped toggle
  - Modifiers applied when equipped
  - Support for characteristic, skill, initiative, and wound modifiers
- Dedicated Augmentations tab on character sheet
- All items include book references (Deathwatch Core Rulebook)

### Characteristic Advances
- Integrated checkbox system on characteristic boxes
- Four advance levels: Simple, Intermediate, Trained, Expert
- Each advance adds +5 to characteristic value
- Visual feedback directly on characteristic display
- No separate items needed for tracking advances

### Psychic Powers System
- **Psy Rating**: Derived value (base + modifiers) displayed on Attributes tab
  - Psy Rating box shown conditionally based on specialty (`hasPsyRating: true`)
  - Currently only Librarian specialty enables Psy Rating
  - Editable base value, computed total with modifier tooltip
  - Modifier support via `psy-rating` effectType
- **Psy Rating Talents**: 8 talents (Psy Rating 3-10, IDs tal00000000275-282)
  - Each adds to Psy Rating via modifier system
  - Escalating XP costs (0 for Librarians at rank 3, up to 2500 for rank 10)
  - Librarian specialty overrides Psy Rating 3 cost to 0 via `talentCosts`
- **Psychic Powers Tab**: Dedicated tab on character sheet
  - Shows current Psy Rating in header with modifier tooltip
  - Conditionally visible based on specialty
