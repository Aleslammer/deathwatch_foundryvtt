# Phase 9: Full Validation Checklist

## Goal
Comprehensive end-to-end validation that the system works correctly on Foundry VTT v14.359.

## Pre-Validation
- [ ] All previous phases complete
- [ ] `npm test` passes (1458+ tests)
- [ ] `npm run build:packs` succeeds
- [ ] System deployed to v14 installation
- [ ] No errors on system load (console clean)
- [ ] No deprecation warnings in console

## Actor Sheets

### Character Sheet
- [ ] Sheet opens without errors
- [ ] All 6 tabs navigate correctly (Characteristics, Skills, Gear, Biography, Psychic Powers, Effects)
- [ ] 9 characteristics display with correct values
- [ ] Characteristic advances (Simple/Intermediate/Trained/Expert) toggle and save
- [ ] Characteristic rolls open dialog and produce chat messages
- [ ] Skills display with correct totals (base + modifiers)
- [ ] Skill rolls open dialog and produce chat messages
- [ ] Advanced skill restriction works (cannot roll untrained advanced skills)
- [ ] Wounds/Fatigue display and edit correctly
- [ ] Token bars update with wounds/fatigue changes
- [ ] Movement box displays correct values
- [ ] Psy Rating box shows for Librarian, hidden for others
- [ ] Chapter drag-and-drop assignment works
- [ ] Specialty drag-and-drop assignment works
- [ ] Chapter/Specialty removal works
- [ ] XP tracking displays (total, spent, available, rank)
- [ ] Renown rank displays correctly
- [ ] Rank image displays correctly

### Character Gear Tab
- [ ] Weapons display with correct stats (damage, pen, range, ammo)
- [ ] Weapon effective values display (effectiveDamage, effectiveRange, effectivePenetration)
- [ ] Weapon attack button opens combat dialog
- [ ] Weapon damage button opens damage dialog
- [ ] Weapon unjam button clears jam
- [ ] Ammunition loading (drag ammo onto weapon) works
- [ ] Ammunition removal works
- [ ] Weapon upgrade attachment works
- [ ] Weapon upgrade removal works
- [ ] Armor displays with location values
- [ ] Armor equip toggle works
- [ ] Armor history attachment works
- [ ] Armor history removal works
- [ ] Gear items display and equip toggle works
- [ ] Ammunition items display with capacity
- [ ] Collapsible gear sections work
- [ ] Item create/edit/delete works for all types

### Character Talents/Traits
- [ ] Talents display with name, benefit, cost
- [ ] Talent effective cost reflects chapter/specialty overrides
- [ ] Talent click posts details to chat
- [ ] Traits display with name and description
- [ ] Trait click posts details to chat
- [ ] Talent/Trait create/edit/delete works

### Character Augmentations
- [ ] Implants display with name and summary
- [ ] Implant click posts details to chat
- [ ] Cybernetics display with equip toggle
- [ ] Cybernetic modifiers apply when equipped

### Character Psychic Powers
- [ ] Psychic Powers tab visible for Librarian
- [ ] Psychic Powers tab hidden for non-Librarian
- [ ] Current Psy Rating displays in header
- [ ] Power list displays with all fields
- [ ] Use Power button opens Focus Power dialog
- [ ] Power click posts details to chat

### Character Special Abilities
- [ ] Solo Mode abilities display correctly
- [ ] Squad Mode abilities display with cost/sustained badges
- [ ] Row dimming for wrong-mode abilities
- [ ] Activate button for Squad Mode abilities
- [ ] Click posts activation message to chat

### Character Modifiers
- [ ] Actor modifiers display
- [ ] Create/Edit/Delete/Toggle modifiers works
- [ ] Modifiers apply to characteristics correctly
- [ ] Modifiers apply to skills correctly
- [ ] Post-multiplier modifiers work correctly with Unnatural

### Character Biography
- [ ] All biography fields editable (gender, age, complexion, hair)
- [ ] Chapter and specialty display
- [ ] Description editor works

### Character Effects
- [ ] Active effects display
- [ ] Status effect toggles work
- [ ] Effect create/edit/delete works

### NPC Sheet
- [ ] Sheet opens without errors
- [ ] Characteristics display correctly
- [ ] Skills display correctly
- [ ] Wounds/Fatigue work
- [ ] Items display and manage correctly

### Enemy Sheet
- [ ] Sheet opens without errors
- [ ] All characteristics display
- [ ] Skills display correctly
- [ ] Psy Rating displays when applicable
- [ ] Classification dropdown works (human/xenos/chaos)
- [ ] Weapons, talents, traits display
- [ ] Movement displays correctly

### Horde Sheet
- [ ] Sheet opens without errors
- [ ] Magnitude (wounds) displays correctly
- [ ] Single armor value displays
- [ ] Classification dropdown works
- [ ] All embedded items display

## Item Sheets (17 types)
- [ ] Weapon sheet — all fields, qualities, upgrades
- [ ] Armor sheet — location values, histories
- [ ] Ammunition sheet — capacity, modifiers
- [ ] Gear sheet — equipped, requisition
- [ ] Talent sheet — cost, prerequisite, benefit
- [ ] Trait sheet — modifiers tab
- [ ] Chapter sheet — skill costs, talent costs, modifiers
- [ ] Specialty sheet — characteristic costs, rank costs, hasPsyRating
- [ ] Psychic Power sheet — all fields, background image
- [ ] Special Ability sheet — mode fields, background image
- [ ] Implant sheet — summary, description
- [ ] Cybernetic sheet — equipped, modifiers
- [ ] Demeanour sheet — description
- [ ] Armor History sheet — modifiers
- [ ] Weapon Quality sheet — key, value
- [ ] Weapon Upgrade sheet — modifiers, singleShotOnly
- [ ] Critical Effect sheet — damage type, location

## Combat System

### Ranged Combat
- [ ] Attack dialog opens with correct BS
- [ ] Aim modifiers apply (+10/+20)
- [ ] Rate of fire options work (Single/Semi/Full)
- [ ] Range auto-calculation works
- [ ] Called Shot works with location selection
- [ ] Running Target penalty applies
- [ ] Target Size modifier applies
- [ ] Ammunition deduction works
- [ ] Jamming detection works
- [ ] Attack result posts to chat with modifier breakdown

### Melee Combat
- [ ] Attack dialog opens with correct WS
- [ ] All Out Attack modifier applies
- [ ] Charge modifier applies
- [ ] Called Shot works
- [ ] Degrees of Success display in chat
- [ ] Horde hit calculation works (DoS-based)

### Damage Application
- [ ] Damage dialog opens after attack
- [ ] Hit locations determined correctly
- [ ] Multiple hit locations work
- [ ] Apply Damage button appears in chat
- [ ] Damage calculation correct (armor, pen, TB)
- [ ] Primitive quality doubles armor
- [ ] Razor Sharp doubles penetration
- [ ] Melta doubles penetration at short range
- [ ] Felling reduces Unnatural Toughness
- [ ] Critical damage triggers correctly
- [ ] Critical effect button works
- [ ] Shocking test button works
- [ ] Toxic test button works
- [ ] Characteristic damage button works
- [ ] Force channel button works

### Righteous Fury
- [ ] Triggers on natural 10
- [ ] Confirmation roll works
- [ ] Deathwatch Training auto-confirms vs xenos
- [ ] Fury chain continues on additional 10s

### Horde Combat
- [ ] Blast hit calculation correct
- [ ] Flame hit calculation correct
- [ ] Melee DoS hit calculation correct
- [ ] Magnitude reduction per penetrating hit
- [ ] Batch damage summary message
- [ ] Horde destruction detection
- [ ] Magnitude bonus damage from ammunition

### Flame Weapons
- [ ] Flame weapon routes to flame attack
- [ ] Flame Attack macro opens dialog
- [ ] Individual target: dodge test → damage → catch fire
- [ ] Horde target: hit calculation → batch damage
- [ ] On Fire condition applied on failed catch fire test

### Fire System
- [ ] On Fire detection on combat turn advance
- [ ] Fire damage (1d10 Energy to Body)
- [ ] Fatigue increment
- [ ] Willpower test (auto-pass for Power Armour)
- [ ] Extinguish button and dialog
- [ ] On Fire condition removal on success

### Psychic Combat
- [ ] Focus Power dialog opens
- [ ] Power levels (Fettered/Unfettered/Push) work
- [ ] Effective Psy Rating calculates correctly
- [ ] WP Bonus editable
- [ ] Psychic test modifiers apply
- [ ] Phenomena triggers on doubles (Unfettered)
- [ ] Phenomena always triggers (Push)
- [ ] Fatigue on Push + doubles
- [ ] Perils cascade from Phenomena 75+
- [ ] No-perils modifier suppresses Perils
- [ ] Tyranid backlash (1d10 Energy) instead of tables
- [ ] Opposed Willpower test dialog works
- [ ] Psychic damage powers work (PR substitution)

## Cohesion System
- [ ] CohesionPanel opens via scene control button
- [ ] Panel displays value/max
- [ ] +1 / -1 buttons work with chat messages
- [ ] Recalculate dialog works
- [ ] Edit dialog works
- [ ] Set Leader dialog works
- [ ] Cohesion Challenge rolls correctly
- [ ] Character mode list displays
- [ ] Mode toggle works (Solo ↔ Squad)
- [ ] Squad Mode requires Cohesion ≥ 1
- [ ] Auto-drop to Solo on zero Cohesion
- [ ] Squad ability activation works
- [ ] Cohesion deduction on activation
- [ ] Sustained ability tracking
- [ ] Ability deactivation works
- [ ] Socket communication (player activation)
- [ ] Chat messages for all mode changes

## Hotbar Macros
- [ ] Drag weapon to hotbar creates macro
- [ ] Weapon macro → Attack/Damage choice dialog
- [ ] Weapon macro with preset options skips dialog
- [ ] Drag psychic power to hotbar creates macro
- [ ] Psychic power macro → Focus Power dialog
- [ ] Drag other item to hotbar creates macro
- [ ] Other item macro → posts description to chat

## Compendium Packs
- [ ] All 17 packs load without errors
- [ ] Weapons pack (93 entries) browsable
- [ ] Talents pack (281 entries) browsable
- [ ] Enemies pack (35 entries) browsable
- [ ] Drag-and-drop from compendium to actor works
- [ ] Compendium search works

## Initiative
- [ ] Initiative dialog opens on roll
- [ ] Formula: 1d10 + AG Bonus + Initiative Bonus
- [ ] Modifier input works
- [ ] Initiative posts to chat
- [ ] Combat tracker orders correctly
- [ ] Skip Defeated setting works

## Miscellaneous
- [ ] Token name sync on actor rename (unlinked tokens)
- [ ] Enemy auto-folder assignment
- [ ] Turn marker displays (aquila)
- [ ] Grid distance (3m) correct
- [ ] Token bars (wounds/fatigue) display

## Performance
- [ ] Character sheet opens in < 2 seconds
- [ ] Sheet re-renders smoothly on data changes
- [ ] No memory leaks on repeated open/close
- [ ] Combat with 10+ combatants runs smoothly

## Final Steps
- [ ] Update `system.json` version to 0.1.0 (or appropriate)
- [ ] Update `system.json` compatibility: `verified: "14"`, `maximum: "14"`
- [ ] Update README.md badge to v14
- [ ] Update memory bank documents
- [ ] Tag release in git
