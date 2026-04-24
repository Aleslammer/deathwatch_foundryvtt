# Actor Types Test Plan

**Coverage:** Character sheets, NPC sheets, Enemy sheets, Horde sheets, actor creation, drag-and-drop, token configuration

## Prerequisites
- Access to Actors directory
- Ability to create new actors
- Combat scene with grid

---

## Test Cases

### AT-01: Create Character (Space Marine)
**Goal:** Verify Space Marine character creation

1. Click "Create Actor" in Actors directory
2. Select Type: "Character"
3. Name: "Test Marine"
4. Click "Create"

**Expected:**
- Character created in directory
- Sheet opens automatically
- Default stats populated (WS, BS, etc.)
- Tabs visible: Characteristics, Combat, Gear, Advances, etc.

**Pass/Fail:** ____

---

### AT-02: Character Sheet (All Tabs)
**Goal:** Verify all character sheet tabs accessible

1. Open Test Marine character sheet
2. Navigate through all tabs

**Expected:**
- **Characteristics**: Stats (WS, BS, S, T, Ag, Int, Per, WP, Fel)
- **Combat**: Weapons, armor, combat stats
- **Gear**: Inventory, equipment
- **Psychic**: Powers, Psy Rating (if psyker)
- **Advances**: XP, skills, talents, ranks
- **Mental**: Insanity, Corruption, disorders
- **Biography**: Background, chapter, specialty

**Pass/Fail:** ____

---

### AT-03: Character Sheet (Edit Stats)
**Goal:** Verify characteristics can be edited

1. Open Test Marine → Characteristics tab
2. Change Weapon Skill: 40 → 45
3. Save

**Expected:**
- WS updates to 45
- WS Bonus recalculates: 4 → 4 (still)
- Change persists after refresh

**Pass/Fail:** ____

---

### AT-04: Create NPC
**Goal:** Verify NPC actor creation

1. Create Actor → Type: "NPC"
2. Name: "Inquisitor Kryptman"

**Expected:**
- NPC created
- NPC sheet opens (similar to Character but simplified)
- Stats editable
- Can equip gear

**Pass/Fail:** ____

---

### AT-05: Create Enemy
**Goal:** Verify Enemy actor creation

1. Create Actor → Type: "Enemy"
2. Name: "Ork Boy"

**Expected:**
- Enemy created
- Enemy sheet opens (simpler layout)
- Stats editable (WS, BS, T, etc.)
- Traits section (e.g., "Brutish", "Fearless")
- **Auto-moves to "Enemies" folder** (if enabled)

**Pass/Fail:** ____

---

### AT-06: Create Horde
**Goal:** Verify Horde actor creation

1. Create Actor → Type: "Horde"
2. Name: "Termagant Swarm"

**Expected:**
- Horde created
- Horde sheet opens
- **Magnitude**: Starting value (e.g., 30)
- Stats based on individual creature
- Horde-specific fields visible

**Pass/Fail:** ____

---

### AT-07: Horde Magnitude Tracking
**Goal:** Verify horde magnitude reduces with damage

1. **Setup:** Test Horde at magnitude 30
2. Deal 15 damage → magnitude reduces by 1 (15 / 10 = 1)
3. Deal 50 damage → magnitude reduces by 5

**Expected:**
- Magnitude: 30 → 29 → 24
- When magnitude = 0: Horde defeated
- Token updates to reflect magnitude

**Pass/Fail:** ____

---

### AT-08: Enemy Auto-Folder
**Goal:** Verify new Enemy actors auto-move to "Enemies" folder

1. Create new Enemy: "Genestealer"

**Expected:**
- Enemy created
- **Automatically moved to "Enemies" folder** (if folder exists)
- Setting configurable (may be disabled)

**Pass/Fail:** ____

---

### AT-09: Drag Actor to Scene
**Goal:** Verify actor can be dragged to scene to create token

1. Drag Test Marine from Actors directory to scene

**Expected:**
- Token created on scene at drop location
- Token uses actor's default image
- Token linked to actor
- Token bars configured (Wounds, Fatigue)

**Pass/Fail:** ____

---

### AT-10: Token Configuration (Bars)
**Goal:** Verify token bars display correct stats

1. **Setup:** Test Marine token on scene
2. Check token bars

**Expected:**
- **Bar 1 (top)**: Wounds (current/max)
- **Bar 2 (bottom)**: Fatigue (current/max)
- Bars update when stats change
- Colors: Green (wounds), yellow (fatigue)

**Pass/Fail:** ____

---

### AT-11: Token Configuration (Vision)
**Goal:** Verify token vision settings (if scene lighting active)

1. **Setup:** Scene with lighting enabled
2. Place Test Marine token
3. Check token vision settings (right-click → Configure)

**Expected:**
- Vision: Enabled
- Range: 60ft (or unlimited for Space Marines)
- Darkvision: Enabled (Power Armor has Auto-Senses)

**Pass/Fail:** ____

---

### AT-12: Drag Item to Actor
**Goal:** Verify item can be dragged from compendium to actor

1. Open compendium: "Deathwatch: Weapons"
2. Drag "Astartes Bolter" to Test Marine sheet

**Expected:**
- Weapon added to Combat tab
- Weapon stats visible (damage, pen, range)
- Weapon clickable for attacks

**Pass/Fail:** ____

---

### AT-13: Drag Item Between Actors
**Goal:** Verify item can be transferred between actors

1. **Setup:** Test Marine has "Frag Grenades"
2. Drag Frag Grenades from Test Marine to Test Enemy

**Expected:**
- Item removed from Test Marine
- Item added to Test Enemy
- Quantity preserved (if applicable)

**Pass/Fail:** ____

---

### AT-14: Delete Actor
**Goal:** Verify actor can be deleted

1. Right-click Test Enemy in Actors directory
2. Select "Delete"
3. Confirm deletion

**Expected:**
- Actor removed from directory
- Associated tokens removed from scenes
- Deletion confirmation prompt shown

**Pass/Fail:** ____

---

### AT-15: Duplicate Actor
**Goal:** Verify actor can be duplicated

1. Right-click Test Marine
2. Select "Duplicate"

**Expected:**
- New actor created: "Test Marine (Copy)"
- All stats, gear, and settings copied
- Independent of original (changes don't affect original)

**Pass/Fail:** ____

---

### AT-16: Import Actor (JSON)
**Goal:** Verify actor can be imported from JSON

1. **Setup:** Export Test Marine to JSON (right-click → Export)
2. Delete Test Marine
3. Right-click Actors directory → Import Data
4. Select exported JSON file

**Expected:**
- Actor re-created from JSON
- All stats and gear restored
- Image links intact (if paths valid)

**Pass/Fail:** ____

---

### AT-17: Actor Permissions (Ownership)
**Goal:** Verify actor ownership settings

1. Open Test Marine sheet
2. Go to Permissions tab
3. Set Player 1: "Owner"

**Expected:**
- Player 1 can open and edit sheet
- Player 1 can control token
- Other players cannot see/edit (unless "Observer")

**Pass/Fail:** ____

---

### AT-18: Unlinked Token (NPC Copy)
**Goal:** Verify unlinked tokens create independent copies

1. **Setup:** Create Enemy actor with unlinked token setting
2. Drag to scene twice (two tokens)
3. Damage first token

**Expected:**
- Two tokens with separate HP pools
- Damaging one doesn't affect the other
- Both reference same base actor for stats

**Pass/Fail:** ____

---

### AT-19: Linked Token (Player Character)
**Goal:** Verify linked tokens share HP pool

1. **Setup:** Test Marine with linked token setting (default for PCs)
2. Place token on Scene A
3. Place same token on Scene B
4. Damage token on Scene A

**Expected:**
- Damage reflected on token in Scene B
- Both tokens share same actor data
- HP changes persist across scenes

**Pass/Fail:** ____

---

### AT-20: Actor Search/Filter
**Goal:** Verify actor directory search functionality

1. Open Actors directory
2. Type "Marine" in search box

**Expected:**
- Only actors with "Marine" in name shown
- Folders collapse/expand correctly
- Clear search returns to full list

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- Token bars not displaying correct stats
- Unlinked tokens incorrectly sharing HP
- Enemy actors not auto-moving to Enemies folder
- Drag-and-drop not working between sheets
- Vision settings not applying to tokens

**Reference:** 
- [.claude/docs/architecture.md](../../.claude/docs/architecture.md)
- `src/module/documents/actor.mjs`
- `src/module/sheets/`

_Actor protocols sanctified. The Omnissiah blesses these sacred data-forms._ ⚙️
