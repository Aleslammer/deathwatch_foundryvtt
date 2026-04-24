# Item Management Test Plan

**Coverage:** Item creation, editing, drag-and-drop, item types, quantity tracking, equipped/unequipped status

## Prerequisites
- Access to Items directory
- Character with items
- Compendium packs available

---

## Test Cases

### IM-01: Create Item (Weapon)
**Goal:** Verify weapon item creation

1. Items directory → Create Item
2. Type: "Weapon"
3. Name: "Test Bolter"
4. Click "Create"

**Expected:**
- Weapon created in Items directory
- Weapon sheet opens
- Fields visible: Damage, Pen, Range, RoF, Clip, Reload, Qualities

**Pass/Fail:** ____

---

### IM-02: Edit Weapon Stats
**Goal:** Verify weapon stats can be edited

1. Open Test Bolter sheet
2. Set values:
   - Damage: 1d10+5
   - Pen: 4
   - Range: 100m
   - RoF: S/2/−
   - Clip: 30
3. Save

**Expected:**
- All values persist after refresh
- Weapon usable in combat with these stats

**Pass/Fail:** ____

---

### IM-03: Weapon Qualities (Add)
**Goal:** Verify weapon qualities can be added

1. Open Test Bolter → Qualities section
2. Add quality: "Tearing"
3. Save

**Expected:**
- Quality added to weapon
- Quality applies during damage rolls
- Multiple qualities supported

**Pass/Fail:** ____

---

### IM-04: Create Item (Armor)
**Goal:** Verify armor item creation

1. Create Item → Type: "Armor"
2. Name: "Carapace Armor"

**Expected:**
- Armor created
- Fields visible: Armor Value, Locations, Special

**Pass/Fail:** ____

---

### IM-05: Armor Locations
**Goal:** Verify armor locations tracked per body part

1. Open Carapace Armor sheet
2. Set armor values:
   - Head: 6
   - Body: 6
   - Arms: 5
   - Legs: 5

**Expected:**
- Each location has separate armor value
- Values used in damage calculation by hit location

**Pass/Fail:** ____

---

### IM-06: Create Item (Talent)
**Goal:** Verify talent item creation

1. Create Item → Type: "Talent"
2. Name: "Swift Attack"

**Expected:**
- Talent created
- Fields visible: Description, Effects, Prerequisites

**Pass/Fail:** ____

---

### IM-07: Create Item (Psychic Power)
**Goal:** Verify psychic power item creation

1. Create Item → Type: "Psychic Power"
2. Name: "Smite"

**Expected:**
- Power created
- Fields visible: Action, Opposed, Range, Sustained, Effect

**Pass/Fail:** ____

---

### IM-08: Drag Item to Character
**Goal:** Verify item can be added to character

1. Drag Test Bolter from Items directory to Test Marine sheet

**Expected:**
- Weapon appears in Combat tab (Weapons section)
- Weapon clickable for attacks
- Item instance independent (editing doesn't affect original)

**Pass/Fail:** ____

---

### IM-09: Drag Item from Compendium
**Goal:** Verify item can be dragged from compendium pack

1. Open "Deathwatch: Weapons" compendium
2. Drag "Astartes Chainsword" to Test Marine

**Expected:**
- Weapon added to character
- All stats copied from compendium
- Compendium item unchanged

**Pass/Fail:** ____

---

### IM-10: Equip/Unequip Item
**Goal:** Verify equipped status toggle

1. **Setup:** Test Marine has Astartes Bolter and Stalker Bolter
2. Click "Equip" checkbox next to Astartes Bolter
3. Unequip Stalker Bolter

**Expected:**
- Equipped items highlighted or marked
- Only equipped items contribute to stats (if applicable)
- Equipped status persists

**Pass/Fail:** ____

---

### IM-11: Item Quantity
**Goal:** Verify quantity tracking for consumables

1. **Setup:** Test Marine has "Frag Grenades" (quantity: 3)
2. Use one grenade (throw in combat)
3. Check quantity

**Expected:**
- Quantity: 3 → 2
- Item remains on sheet until quantity = 0
- Quantity editable manually

**Pass/Fail:** ____

---

### IM-12: Delete Item from Actor
**Goal:** Verify item can be removed from character

1. Right-click "Test Bolter" on Test Marine sheet
2. Select "Delete"

**Expected:**
- Item removed from character
- Item still exists in Items directory (if original)
- Confirmation prompt shown

**Pass/Fail:** ____

---

### IM-13: Edit Item on Actor (Independent)
**Goal:** Verify editing item on actor doesn't affect original

1. **Setup:** Test Marine has "Astartes Bolter" (from compendium)
2. Edit Bolter on Marine: Change damage to 1d10+10
3. Check original compendium item

**Expected:**
- Marine's Bolter: 1d10+10
- Compendium Bolter: 1d10+5 (unchanged)
- Items are independent copies

**Pass/Fail:** ____

---

### IM-14: Item Key Field
**Goal:** Verify item `key` field used for identification

1. Open compendium item (e.g., "Astartes Bolter")
2. Check for `key` field (e.g., "astartes-bolter")

**Expected:**
- Key field present (lowercase, hyphenated)
- Key used for item matching (not name or ID)
- Key consistent across compendiums

**Pass/Fail:** ____

---

### IM-15: Item Search in Compendium
**Goal:** Verify compendium search functionality

1. Open "Deathwatch: Weapons" compendium
2. Type "bolter" in search box

**Expected:**
- Only items with "bolter" in name shown
- Case-insensitive search
- Clear search returns full list

**Pass/Fail:** ____

---

### IM-16: Item Drag to Hotbar
**Goal:** Verify item can be dragged to macro hotbar

1. Drag "Astartes Bolter" from Test Marine sheet to hotbar

**Expected:**
- Macro created on hotbar
- Clicking macro opens attack dialog (or attacks directly)
- Macro icon shows weapon image

**Pass/Fail:** ____

---

### IM-17: Item Image Upload
**Goal:** Verify item image can be changed

1. Open Test Bolter sheet
2. Click on item image
3. Select new image file (or from browser)

**Expected:**
- Image updates on item sheet
- Image shows on character sheet
- Image persists after refresh

**Pass/Fail:** ____

---

### IM-18: Item Description (Rich Text)
**Goal:** Verify item description supports rich text

1. Open Test Bolter sheet → Description tab
2. Enter formatted text (bold, italic, lists)
3. Save

**Expected:**
- Formatting preserved
- Description visible on item sheet
- Description shown in chat when posted

**Pass/Fail:** ____

---

### IM-19: Item Drag Between Actors
**Goal:** Verify item can be transferred between actors

1. **Setup:** Test Marine has "Frag Grenades" (qty 3)
2. Drag to Test Enemy

**Expected:**
- Item removed from Test Marine
- Item added to Test Enemy (qty 3)
- Transfer shown in chat (optional)

**Pass/Fail:** ____

---

### IM-20: Item Ownership Permissions
**Goal:** Verify item ownership can be restricted

1. Create item in Items directory
2. Set Permissions: Default = "None"
3. Assign Player 1: "Observer"

**Expected:**
- Only GM and Player 1 can see item
- Player 1 can view but not edit (Observer)
- Other players cannot see item

**Pass/Fail:** ____

---

### IM-21: Item Import/Export (JSON)
**Goal:** Verify item can be exported and imported

1. Right-click "Astartes Bolter" in Items directory
2. Select "Export Data" → Save JSON
3. Delete item
4. Import Data → Select JSON file

**Expected:**
- Item re-created from JSON
- All stats and fields restored
- Image links intact (if paths valid)

**Pass/Fail:** ____

---

### IM-22: Item Types (All 17)
**Goal:** Verify all 17 item types can be created

1. Create each item type:
   - Weapon, Armor, Gear, Talent, Trait, Skill
   - Psychic Power, Force Field, Cybernetic, Ammo
   - Special Ability, Chapter Ability, Specialty Ability
   - Critical Damage, Mental Disorder, Malignancy, Oath

**Expected:**
- All types available in Create Item dropdown
- Each type has appropriate fields
- Each type sheet renders correctly

**Pass/Fail:** ____

---

### IM-23: Ammo Linking (Weapon → Ammo Item)
**Goal:** Verify weapon can link to specific ammo item

1. **Setup:** Test Marine has "Astartes Bolter" and "Standard Bolter Rounds" (ammo item)
2. Link ammo to weapon

**Expected:**
- Weapon tracks ammo from linked item
- Firing weapon decrements ammo item quantity
- Reload refills from ammo item

**Pass/Fail:** ____

---

### IM-24: Cybernetics (Characteristic Replacement)
**Goal:** Verify cybernetic item replaces characteristic

1. Create Item → Type: "Cybernetic"
2. Name: "Bionic Arm"
3. Set: Replaces Strength with 40
4. Add to Test Marine

**Expected:**
- Marine's Strength = 40 (or uses bionic if higher)
- Strength Bonus recalculated
- Cybernetic shown on sheet

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- Item key field missing or inconsistent
- Equipped status not persisting
- Quantity not decrementing on use
- Drag-and-drop between actors not working
- Compendium items not copying correctly

**Reference:** 
- [.claude/docs/item-patterns.md](../../.claude/docs/item-patterns.md)
- [.claude/docs/compendium.md](../../.claude/docs/compendium.md)
- `src/module/documents/item.mjs`

_Item protocols sanctified. The Omnissiah catalogs all sacred wargear._ ⚙️
