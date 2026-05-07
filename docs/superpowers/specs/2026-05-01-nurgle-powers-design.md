# Design: Nurgle Psychic Powers

**Date:** 2026-05-01  
**Status:** Approved  
**Source:** Black Crusade Core Rulebook, pages 215-216

---

## Overview

Add 7 Nurgle-aligned psychic powers to the Deathwatch system compendium. These powers represent the blessings of the Plague God, offering disease-based attacks, resilience enhancements, and corrupting effects.

**Scope:** Compendium data only. No mechanical implementation, UI changes, or game system logic modifications required. This is pure data entry following existing psychic power patterns.

---

## Architecture

### Directory Structure

**New Directory:** `src/packs-source/psychic-powers/Nurgle/`

**Rationale:** 
- Follows existing pattern for faction-specific powers (e.g., `Tyranid/`, `Divination/`)
- Enables future expansion for other Chaos god powers (Khorne, Tzeentch, Slaanesh)
- Keeps Chaos-aligned powers organizationally separate from generic `Unaligned/` powers

### Files to Create

Seven JSON files, one per power:

1. `choir-of-poxes.json` - AOE stunning damage power
2. `inviolable-flesh.json` - Self-buff granting Unnatural Toughness
3. `lepers-curse.json` - Single-target withering curse causing Critical Effects
4. `nurgles-rot.json` - Sustained AOE damage aura with special Psychic Phenomena
5. `field-of-pestilence.json` - Environmental hazard creating difficult terrain
6. `putrefying-embrace.json` - Unarmed attack enhancement
7. `rain-of-foulness.json` - Psychic Blast with Pinning

---

## Data Schema

### ID Assignment

Sequential IDs starting from next available:
- **Range:** `psy00000000081` through `psy00000000087`
- **Current highest ID:** `psy00000000080` (Wind of Chaos)

### JSON Structure

All powers follow the standard psychic-power template:

```json
{
  "_id": "psy0000000008X",
  "name": "Power Name",
  "type": "psychic-power",
  "img": "systems/deathwatch/icons/psychic-powers/nurgle.webp",
  "system": {
    "book": "Black Crusade",
    "page": "215 or 216",
    "key": "kebab-case-power-name",
    "range": "[range from source]",
    "sustained": "[Yes/No/Free Action/Half Action/None]",
    "action": "[Half Action/Full Action]",
    "opposed": "[Yes/No]",
    "cost": [XP cost],
    "class": "Nurgle",
    "description": "[Rich HTML - see format below]",
    "damageFormula": "[if applicable]",
    "penetrationFormula": "[if applicable]",
    "damageType": "[if applicable]",
    "attachedQualities": [...]
  }
}
```

### Field-Specific Rules

**Icon Path:** All powers use `systems/deathwatch/icons/psychic-powers/nurgle.webp`

**Class:** All powers use `"Nurgle"`

**Damage Fields:** Only populated for powers with direct damage output:
- Choir of Poxes: `1d10+PR`, no pen, no type (stun damage)
- Nurgle's Rot: `1d10+PR`, pen 0, type varies per description
- Putrefying Embrace: `1d10+PR`, type I (Impact)
- Rain of Foulness: `1d10+7`, pen = PR, type I (Impact)
- Leper's Curse: No damage formula (causes Critical Effects directly)

**Attached Qualities:** Only for powers with weapon qualities:
- Nurgle's Rot: Tainted, Toxic (4)
- Putrefying Embrace: Toxic (3)
- Rain of Foulness: Toxic (3)

**Key Field:** Kebab-case version of power name for programmatic identification

---

## HTML Description Format

### Structure Pattern

Following existing power format (e.g., Wind of Chaos):

```html
<p><strong>Prerequisites:</strong> [if any]</p>
<p><strong>Focus Power:</strong> [test difficulty]</p>
<p><strong>Subtype:</strong> [comma-separated subtypes]</p>
<p>[Flavor text paragraph(s)]</p>
<p>[Mechanical effects paragraph(s)]</p>
<p><strong>Psychic Phenomena:</strong> [if power has special phenomena]</p>
```

### Content Guidelines

- **Prerequisites:** Include Aligned Nurgle, Mark of Nurgle, stat requirements, Corruption requirements, Psy Rating requirements
- **Focus Power:** Include full test description (e.g., "Difficult Opposed (-10) Willpower Test")
- **Subtype:** Attack, Concentration, Corruption, etc.
- **Flavor Text:** Preserve all narrative description from source
- **Mechanical Effects:** Transcribe all game mechanics accurately, including:
  - Damage values and formulas
  - Test requirements (Toughness, Agility, etc.)
  - Special effects (stunned, trait grants, terrain modifications)
  - Duration and timing details
- **Psychic Phenomena:** Only for powers with special phenomena (notably Nurgle's Rot)

### Example: Choir of Poxes

```html
<p><strong>Prerequisites:</strong> Aligned Nurgle</p>
<p><strong>Focus Power:</strong> Difficult Opposed (-10) Willpower Test</p>
<p><strong>Subtype:</strong> Attack, Concentration</p>
<p>As enacted by Nurgle's daemonic legions, the Sorcerer's throat rattles with the names of every disease he has ever suffered from, and every disease that Nurgle has ever gifted mortals with. Those caught within earshot of this pestilential incantation find themselves wracked with spasms of pain and delirium, as the Sorcerer speaks the true names of different diseases, invoking plagues both ancient and yet to occur.</p>
<p>Creatures caught within range of this power may oppose the Focus Power Test with a Toughness Test, suffering an additional -10 penalty if they have the Heightened Senses (Hearing) Talent. Any creature that fails to resist this power takes 1d10 + Psy Rating Damage and is stunned until the start of its next turn.</p>
```

---

## Power-Specific Details

### 1. Choir of Poxes
- **ID:** `psy00000000081`
- **Cost:** 100 XP
- **Action:** Full Action
- **Range:** 30 metres
- **Sustained:** No
- **Opposed:** Yes (Toughness)
- **Effect:** 1d10 + PR damage + stunned
- **Special:** Additional -10 penalty for Heightened Senses (Hearing)

### 2. Inviolable Flesh
- **ID:** `psy00000000082`
- **Cost:** 200 XP
- **Action:** Half Action
- **Range:** Self
- **Sustained:** Free Action
- **Opposed:** No
- **Effect:** Grants Unnatural Toughness (PR rating), -10 Agility penalty
- **Prerequisites:** Aligned Nurgle, Toughness 40+

### 3. Leper's Curse
- **ID:** `psy00000000083`
- **Cost:** 400 XP
- **Action:** Half Action
- **Range:** 5 metres x Psy Rating
- **Sustained:** None
- **Opposed:** No
- **Effect:** Psychic Bolt causing Rending Critical Effect (1d10), no Wounds damage
- **Prerequisites:** Mark of Nurgle, Psy Rating 5
- **Special:** Can only target each opponent once per combat

### 4. Nurgle's Rot
- **ID:** `psy00000000084`
- **Cost:** 400 XP
- **Action:** Half Action
- **Range:** 5 metres x Psy Rating radius
- **Sustained:** Half Action
- **Opposed:** No (Corruption Test to manifest)
- **Effect:** 1d10 + PR damage with Tainted and Toxic (4), ignores non-sealed armor
- **Prerequisites:** Corruption 30+, Aligned Nurgle
- **Special Psychic Phenomena:** Creates fog and fly swarms, -5 penalty to WS/BS/Int/Per/Fel for non-Nurgle devotees

### 5. Field of Pestilence
- **ID:** `psy00000000085`
- **Cost:** 300 XP
- **Action:** Full Action
- **Range:** 5 metres x Psy Rating radius (centered on caster, moves with them)
- **Sustained:** Free Action
- **Opposed:** No
- **Effect:** Creates swamp-like terrain, Agility test or fall when moving faster than Half Action
- **Prerequisites:** Aligned Nurgle
- **Special:** Must be touching ground to cast

### 6. Putrefying Embrace
- **ID:** `psy00000000086`
- **Cost:** 200 XP
- **Action:** Half Action
- **Range:** Self
- **Sustained:** Yes
- **Opposed:** No
- **Effect:** Unarmed attacks deal 1d10 + PR Impact damage with Toxic (3), grants Deadly Natural Weapons trait, Strength Bonus not added
- **Prerequisites:** Mark of Nurgle

### 7. Rain of Foulness
- **ID:** `psy00000000087`
- **Cost:** 300 XP
- **Action:** Half Action
- **Range:** 20m x Psy Rating
- **Sustained:** Half Action
- **Opposed:** No
- **Effect:** Psychic Blast (radius 1 + DoS), 1d10+7 Impact damage, Pen = PR, Toxic (3), Pinning Test required
- **Prerequisites:** Aligned Nurgle

---

## Build & Validation

### Build Process

1. **Format JSON files:**
   ```bash
   npm run format:json
   ```

2. **Validate and compile:**
   ```bash
   npm run build:packs
   ```
   - Validates unique IDs across all packs
   - Checks JSON schema compliance
   - Compiles to LevelDB format

3. **Deploy to local Foundry (optional):**
   ```bash
   npm run build:copy
   ```

### Validation Checklist

- [ ] All 7 JSON files created in `src/packs-source/psychic-powers/Nurgle/`
- [ ] IDs are sequential `psy00000000081` through `psy00000000087`
- [ ] No duplicate IDs in system (validated by build script)
- [ ] All files pass JSON formatting
- [ ] All powers have complete HTML descriptions
- [ ] Book references point to "Black Crusade" with correct page numbers
- [ ] Icon path is `systems/deathwatch/icons/psychic-powers/nurgle.webp` for all
- [ ] Class is "Nurgle" for all powers
- [ ] Damage formulas populated only for damage-dealing powers
- [ ] Attached qualities populated only where applicable

### Testing

**In Foundry:**
- Powers appear in compendium browser
- Powers are filterable by "Nurgle" class
- Power sheets display correctly
- HTML descriptions render properly with formatting
- Prerequisites, Focus Power tests, and Subtypes are clearly visible

---

## Dependencies

**None.** This is pure data addition with no code dependencies.

**Icon Assumption:** Assumes `systems/deathwatch/icons/psychic-powers/nurgle.webp` exists or will be provided. If icon doesn't exist, powers will display but with missing image icon in Foundry.

---

## Future Expansion

This design enables future Chaos god powers:
- `psychic-powers/Khorne/` - Khorne-aligned powers
- `psychic-powers/Tzeentch/` - Tzeentch-aligned powers  
- `psychic-powers/Slaanesh/` - Slaanesh-aligned powers

Each would follow the same pattern: dedicated directory, god-specific icon path, appropriate class value.

---

## Notes

- **No mechanical implementation:** These powers are data-only. Game Masters will manually apply effects (traits, modifiers, terrain) as described.
- **Sustained values vary:** Some use "Yes", some "Free Action", some "Half Action" - transcribed exactly as written in source.
- **Corruption Test for Nurgle's Rot:** The Focus Power is a Corruption Test rather than Willpower Test - unusual but transcribed as written.
- **Leper's Curse damage:** Does not deal Wounds damage, only Critical Effects - this is a unique mechanic.
- **Page references:** All powers cite pages 215-216 from Black Crusade.

---

## Implementation Order

1. Create directory structure
2. Create all 7 JSON files with complete data
3. Run format:json to standardize formatting
4. Run build:packs to validate and compile
5. Test in Foundry (optional, requires local deployment)
6. Commit source JSON files to repository

---

_Blessed be the code. The Machine Spirit approves this design._
