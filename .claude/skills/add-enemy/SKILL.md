---
name: add-enemy
description: Guide developer through adding a new enemy to the Deathwatch system
trigger: /add-enemy
---

# Add Enemy Skill

You are guiding a developer through creating a new enemy for the Deathwatch Foundry VTT system.

## Your Role

**Be interactive and helpful:**
- Ask the user for enemy data (don't assume or invent anything)
- Guide them through each step with clear explanations
- Validate their input and catch common mistakes
- Show progress as you work through the steps

## Process Overview

You will:
1. Collect enemy data from the user
2. Create the enemy JSON file with embedded items
3. Create horde variant if requested
4. Update the migration script
5. Run migration and build
6. Report results

---

## Step 1: Collect Enemy Data

Ask the user for the following information. Use this exact format:

```
Name: <name>
Book: <book name>
Page: <page number>
Faction: <tyranid|ork|tau|chaos> (defaults to tyranid if not specified)
Type: <enemy|horde|both> (defaults to enemy if not specified)
Classification: <human|xenos|chaos> (defaults to xenos if not specified)

Description: <flavor text>

WS BS S T AG INT PER WP FEL
<values>

Wounds: <number>
Psy Rating: <number> (optional)

Skills: <skill list with modifiers>
Talents: <talent list>
Traits: <trait list>
Armour: <armor details> (optional)
Weapons: <weapon list with stats>
Gear: <gear list> (optional)

Special Abilities: (optional)
<ability descriptions>
```

**If the user provides data in a different format:**
- Parse it and confirm your understanding
- Ask for any missing required fields
- Clarify ambiguities before proceeding

---

## Step 2: Create Enemy JSON File

1. **Find a template**: Read an existing enemy from `src/packs-source/enemies/{faction}/` to use as a structure reference
2. **Create the file**: `src/packs-source/enemies/{faction}/{kebab-case-name}.json`
3. **Key mappings**:
   - Characteristics: `ws, bs, str, tg, ag, int, per, wil, fs` (fel → fs)
   - Wounds: `{ base: X, max: X, value: 0 }`
   - Skills: Use system keys (e.g., `silent_move`, `tech_use`)
     - trained = base value, mastered = +10, expert = +20
   - Set `_id` to placeholder (migration script assigns real ID)
   - Set `img` to `systems/deathwatch/icons/enemies/{faction}/{name}.webp`
   - Set `classification` field: `"xenos"` (aliens), `"chaos"` (Chaos), `"human"` (humans)

4. **Embed items**:
   - **Talents**: Look up `compendiumId` from `src/packs-source/talents/`
   - **Traits**: Use `_sourceId` from `src/packs-source/traits/`
     - Natural Armour: needs `armor` modifier
     - Multiple Arms: needs `+10 tg` modifier
     - Size traits: need `movement` and `concealment` modifiers
     - Unnatural traits: need `characteristic-bonus` modifiers (x2 each, stack for higher multipliers)
     - **CRITICAL - Black Crusade Conversion**:
       - Black Crusade notation: "Unnatural Strength (+12)" means **+12 to the bonus value**
       - Deathwatch uses **stacking x2 multipliers** instead
       - **Calculation**: `(base_bonus + modifier) / base_bonus = required_multiplier`
       - Round to nearest achievable multiplier (x2, x3, x4, etc.)
       - **Example**: Str 45 with Unnatural Strength (+12)
         - Base SB: 45 / 10 = 4
         - Target SB: 4 + 12 = 16
         - Multiplier: 16 / 4 = 4 (x4)
         - Implementation: Add trait **2 times** (x2 + x2 = x4)
   - **Weapons**: Match stats from source, use `attachedQualities` array with `{id: "quality-key"}`
     - **IMPORTANT - Weapon Damage Calculation**:
       - Source book weapon damage INCLUDES the creature's Strength Bonus
       - Foundry automatically adds SB to melee weapon damage during attacks
       - **Therefore**: Subtract SB from melee weapon damage when creating JSON
       - **Ranged weapons**: Use damage as written (no SB is added)
       - **Example**: Trygon has Str 60 (SB 6) × 3 (Unnatural) = SB 18
         - Book says: "Scything Talons (1d10+20)"
         - JSON should be: `"dmg": "1d10+2"` (because 20 - 18 = 2)
         - In-game result: 1d10+2+18 = 1d10+20 ✓
   - **Armor items**: If equipped armor (not Natural Armour trait), create armor item with locations and `equipped: true`
   - **Psychic Powers**: If present, embed with `_sourceId` from `src/packs-source/psychic-powers/`

5. **Set prototypeToken**:
   ```json
   {
     "displayName": 30,
     "actorLink": false,
     "disposition": -1,
     "bar1": { "attribute": "wounds" },
     "width": 1, "height": 1  // 2x2 for Enormous, 3x3 for Massive
   }
   ```

**Common trait IDs** (see full list in source prompt):
- Dark Sight: `trt000000000011`
- Fear: `trt000000000013`
- Natural Armour: `trt000000000025`
- Natural Weapons: `trt000000000026`
- Unnatural Strength: `trt000000000051`
- Unnatural Toughness: `trt000000000052`
- Size (Enormous): `trt000000000033`
- Size (Massive): `trt000000000061`
- Tyranid: `trt000000000043`

**Common talent IDs** (see full list in source prompt):
- Fearless: `tal00000000002`
- Swift Attack: `tal00000000252`
- Lightning Attack: `tal00000000145`
- Crushing Blow: `tal00000000055`

---

## Step 3: Create Horde Variant (if type: both)

If the user specified `type: both`, create a horde version:

1. **Create file**: `{name}-horde.json`
2. **Modifications**:
   - Set `type: "horde"`
   - Add `gearArmor: 0` to system
   - Change wounds to Magnitude (typically 30)
   - Add Overwhelming (Horde) trait: `_sourceId: trt000000000027`
   - Icon uses `_horde` suffix
   - Token name appends " Horde"
   - Horde weapons may gain Tearing quality

---

## Step 4: Update Migration Script

1. **Read** `builds/scripts/migrateEnemyIds.mjs`
2. **Find the FACTIONS array** for the appropriate faction
3. **Add the filename** to the array in the next sequential position
4. **If horde variant**, add it to the horde section too

---

## Step 5: Run Migration and Build

Execute these commands in sequence:
```bash
node builds/scripts/migrateEnemyIds.mjs
npm run build:packs
```

**Validate**:
- Check the migration script output for ID assignment
- Check build output for validation errors (build:packs runs compactJson automatically)
- Confirm no duplicate IDs

---

## Step 6: Report Results

Show the user:
- ✅ Enemy created: `{name}` (`{faction}/{filename}`)
- ✅ Horde variant created (if applicable)
- ✅ Migration script updated
- ✅ Build successful: X enemies validated
- 📝 Next steps: Test in Foundry, add enemy icon to `src/icons/enemies/{faction}/`

---

## Important Rules

- **DO NOT invent data** - Ask the user if something is unclear
- **DO NOT change** Fear levels, Size categories, or traits unless specified
- **Omit weapon training talents** - Enemies have weapons pre-equipped
- **Enemy actors use `psyRating` directly** - Not via Psy Rating talent
- **All enemies MUST have `classification`** - Controls Deathwatch Training auto-confirm Righteous Fury
- **Faction→classification mapping**: tyranid/ork/tau → xenos, chaos → chaos, explicit for humans
- **CRITICAL: Melee weapon damage** - Always subtract Strength Bonus from book damage (Foundry adds it automatically)
- **CRITICAL: Black Crusade Unnatural Characteristics** - "+X" notation means +X to bonus value, NOT x multiplier
  - Convert using: `(base_bonus + modifier) / base_bonus = multiplier`
  - Stack Unnatural trait x2 instances to achieve the multiplier
  - Example: "Unnatural Strength (+12)" on Str 45 → SB 4 + 12 = 16 → 16/4 = x4 → Add trait 2 times

---

## Key References

During the process, you may need to read:
- `src/packs-source/traits/` - Trait IDs and structure
- `src/packs-source/talents/` - Talent compendium IDs
- `src/packs-source/psychic-powers/` - Psychic power IDs
- `src/packs-source/weapon-qualities/` - Weapon quality keys
- `src/packs-source/enemies/{faction}/` - Existing enemy examples
- `builds/scripts/migrateEnemyIds.mjs` - Migration script to update

---

## Common Trait Source IDs Reference

**Movement & Senses:**
- Dark Sight: `trt000000000011`
- Flyer: `trt000000000016`
- Burrower: `trt000000000008`
- Crawler: `trt000000000009`
- Unnatural Senses: `trt000000000049`
- Heightened Senses (Sight): `trt000000000127`
- Heightened Senses (Sound): `trt000000000129`
- Heightened Senses (Smell): `trt000000000128`

**Combat:**
- Fear: `trt000000000013`
- Natural Weapons: `trt000000000026`
- Improved Natural Weapons: `trt000000000019`
- Natural Armour: `trt000000000025`
- Brutal Charge: `trt000000000007`

**Unnatural Characteristics:**
- Unnatural Agility: `trt000000000045` (modifier: x2 ag)
- Unnatural Perception: `trt000000000048` (modifier: x2 per)
- Unnatural Speed: `trt000000000050` (modifier: movement-multiplier 2)
- Unnatural Strength: `trt000000000051` (modifier: x2 str)
- Unnatural Toughness: `trt000000000052` (modifier: x2 tg)

**Size:**
- Size (Puny): `trt000000000057` (modifiers: -2 movement, +20 concealment)
- Size (Hulking): `trt000000000060` (modifiers: +1 movement, -10 concealment)
- Size (Enormous): `trt000000000033` (modifiers: +2 movement, -20 concealment)
- Size (Massive): `trt000000000061` (modifiers: +3 movement, -30 concealment)

**Special:**
- Multiple Arms: `trt000000000024` (modifier: +10 tg)
- Instinctive Behaviour: `trt000000000021`
- Overwhelming (Horde): `trt000000000027`
- Sturdy: `trt000000000038`
- Synapse Creature: `trt000000000039`
- Shadow in the Warp: `trt000000000032`
- Tyranid: `trt000000000043`
- Auto-stabilised: `trt000000000003`

**Ork Traits:**
- Make It Work: `trt000000000062`
- Mob Rule: `trt000000000063`
- Might Makes Right: `trt000000000064`
- WAAAGH!: `trt000000000065`

---

## Common Talent Compendium IDs Reference

**Combat:**
- Fearless: `tal00000000002`
- Swift Attack: `tal00000000252`
- Lightning Attack: `tal00000000145`
- Lightning Reflexes: `tal00000000146`
- Combat Master: `tal00000000038`
- Crushing Blow: `tal00000000055`
- Step Aside: `tal00000000247`
- Hard Target: `tal00000000115`
- Furious Assault: `tal00000000091`
- Berserk Charge: `tal00000000027`
- Assassin Strike: `tal00000000013`
- Death From Above: `tal00000000046`

**Physical:**
- Ambidextrous: `tal00000000011`
- Leap Up: `tal00000000143`
- Sprint: `tal00000000245`
- Bulging Biceps: `tal00000000032`
- Catfall: `tal00000000034`

**Durability:**
- Iron Jaw: `tal00000000139`
- True Grit: `tal00000000261`
- Hardy: `tal00000000116`

**Two-Weapon:**
- Two-Weapon Wielder (Melee): `tal00000000263`
- Two-Weapon Wielder (Ballistic): `tal00000000262`

**Other:**
- Street Fighting: `tal00000000249`
- Blind Fighting: `tal00000000030`
- Into the Jaws of Hell: `tal00000000137`
- Iron Discipline: `tal00000000138`

---

## Begin

Start by asking the user for the enemy data. Be friendly and helpful!
