# Add Enemy

You are creating a new enemy for the Deathwatch Foundry VTT system. Follow these steps exactly:

## Input Format
The user will provide enemy data in this format:
```
Name: <name>
Book: <book name>
Page: <page number>
Faction: <tyranid|ork|tau|chaos> (defaults to tyranid if not specified)
Type: <enemy|horde|both> (defaults to enemy if not specified)

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

## Creation Steps

1. **Create the enemy JSON file** at `src/packs-source/enemies/{faction}/{kebab-case-name}.json`
   - Use the existing enemies in that faction folder as a template for structure
   - Set `_id` to a placeholder — the migration script will assign the real one
   - Set `img` to `systems/deathwatch/icons/enemies/{faction}/{name}.webp`
   - Map characteristics: ws, bs, str, tg, ag, int, per, wil, fs (fel maps to fs)
   - Set wounds with base, max, and value: 0
   - Map skills using the system's skill keys (e.g., `silent_move`, `tech_use`, `chem_use`)
   - Skills: trained = base, mastered = +10, expert = +20
   - Set psyRating if provided
   - Include all special abilities in the description HTML
   - List traits in the description for reference

2. **Create embedded items** for each talent, trait, and weapon:
   - **Talents**: Use `compendiumId` from existing talent files in `src/packs-source/talents/`
   - **Traits**: Use `_sourceId` referencing trait IDs from `src/packs-source/traits/`
   - **Traits with modifiers**: Natural Armour needs `armor` effectType modifier. Multiple Arms needs `characteristic` modifier (+10 tg). Size traits need `movement` and `skill` (concealment) modifiers. Unnatural traits need `characteristic-bonus` modifiers with `x2` or `x3`.
   - **Unnatural x3**: Add the Unnatural trait TWICE (each instance is x2, stacking to x3)
   - **Weapons**: Match stats from source. Use `attachedQualities` array with `{id: "quality-key"}` format.
   - **Armor**: If the enemy has equipped armor (not Natural Armour), create an armor item with location values and `equipped: true`
   - **Psychic Powers**: If the enemy has psychic powers, embed them with `_sourceId` referencing `src/packs-source/psychic-powers/`

3. **Set prototypeToken**:
   - `displayName: 30`, `actorLink: false`, `disposition: -1`
   - `bar1: { attribute: "wounds" }`
   - Size: 1x1 default, 2x2 for Enormous, 3x3 for Massive

4. **If creating a horde variant** (`type: both`):
   - Create a second file: `{name}-horde.json`
   - Set `type: "horde"`, add `gearArmor: 0` to system
   - Change wounds to Magnitude (typically 30)
   - Add Overwhelming (Horde) trait (`_sourceId: trt000000000027`)
   - Icon uses `_horde` suffix
   - Token name appends " Horde"
   - Horde weapons may gain Tearing quality

5. **Add to migration script** (`builds/scripts/migrateEnemyIds.mjs`):
   - Add the filename to the appropriate faction in the FACTIONS array
   - Use the next sequential number for that faction
   - If horde variant, add it to the horde entries too

6. **Run migration and validate**:
   ```
   node builds/scripts/migrateEnemyIds.mjs
   npm run build:packs
   ```

7. **Report results**: Show the validated ID count and confirm the enemy was created successfully.

## Key References
- Trait source IDs: Check `src/packs-source/traits/` for `_id` values
- Talent compendium IDs: Check `src/packs-source/talents/` for `_id` and `compendiumId` values
- Psychic power IDs: Check `src/packs-source/psychic-powers/` for `_id` values
- Weapon quality keys: Use kebab-case keys matching `_id` in `src/packs-source/weapon-qualities/`
- Existing enemies: Reference `src/packs-source/enemies/{faction}/` for patterns

## Common Trait Source IDs
- Dark Sight: `trt000000000011`
- Fear: `trt000000000013`
- Flyer: `trt000000000016`
- Improved Natural Weapons: `trt000000000019`
- Instinctive Behaviour: `trt000000000021`
- Multiple Arms: `trt000000000024` (modifier: +10 tg)
- Natural Armour: `trt000000000025` (modifier: armor value)
- Natural Weapons: `trt000000000026`
- Overwhelming: `trt000000000027`
- Brutal Charge: `trt000000000007`
- Burrower: `trt000000000008`
- Crawler: `trt000000000009`
- Shadow in the Warp: `trt000000000032`
- Size (Enormous): `trt000000000033` (modifiers: +2 movement, -20 concealment)
- Size (Massive): `trt000000000061` (modifiers: +3 movement, -30 concealment)
- Size (Hulking): `trt000000000060` (modifiers: +1 movement, -10 concealment)
- Size (Puny): `trt000000000057` (modifiers: -2 movement, +20 concealment)
- Sturdy: `trt000000000038`
- Synapse Creature: `trt000000000039`
- Tyranid: `trt000000000043`
- Unnatural Agility: `trt000000000045` (modifier: x2 ag)
- Unnatural Perception: `trt000000000048` (modifier: x2 per)
- Unnatural Senses: `trt000000000049`
- Unnatural Speed: `trt000000000050` (modifier: movement-multiplier 2)
- Unnatural Strength: `trt000000000051` (modifier: x2 str)
- Unnatural Toughness: `trt000000000052` (modifier: x2 tg)
- Auto-stabilised: `trt000000000003`
- Make It Work: `trt000000000062`
- Mob Rule: `trt000000000063`
- Might Makes Right: `trt000000000064`
- WAAAGH!: `trt000000000065`

## Common Talent Compendium IDs
- Ambidextrous: `tal00000000011`
- Fearless: `tal00000000002`
- Swift Attack: `tal00000000252`
- Lightning Attack: `tal00000000145`
- Lightning Reflexes: `tal00000000146`
- Leap Up: `tal00000000143`
- Hard Target: `tal00000000115`
- Step Aside: `tal00000000247`
- Combat Master: `tal00000000038`
- Crushing Blow: `tal00000000055`
- Berserk Charge: `tal00000000027`
- Furious Assault: `tal00000000091`
- Iron Jaw: `tal00000000139`
- True Grit: `tal00000000261`
- Sprint: `tal00000000245`
- Bulging Biceps: `tal00000000032`
- Hardy: `tal00000000116`
- Street Fighting: `tal00000000249`
- Two-Weapon Wielder (Melee): `tal00000000263`
- Two-Weapon Wielder (Ballistic): `tal00000000262`
- Heightened Senses (Sound): `tal00000000129`
- Heightened Senses (Smell): `tal00000000128`
- Heightened Senses (Sight): `tal00000000127`
- Death From Above: `tal00000000046`
- Assassin Strike: `tal00000000013`
- Blind Fighting: `tal00000000030`
- Catfall: `tal00000000034`
- Into the Jaws of Hell: `tal00000000137`
- Iron Discipline: `tal00000000138`

## Important Rules
- Do NOT invent data not provided by the user — ask if unclear
- Do NOT change Fear levels, Size categories, or other traits unless the user specifies
- Weapon training talents (Basic, Pistol, Melee, Exotic) are omitted for enemies — weapons are already equipped
- The `-1 cost` warning icon only shows on character sheets, not enemy sheets
- Enemy actors use `psyRating` directly on the actor, not via Psy Rating talents
