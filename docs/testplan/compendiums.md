# Compendiums Test Plan

**Coverage:** Compendium packs, pack loading, item/actor search, drag-and-drop, pack validation, ID conventions

## Prerequisites
- All 17 compendium packs built and deployed
- Foundry VTT running with Deathwatch system active

---

## Test Cases

### CP-01: List All Compendiums
**Goal:** Verify all 17 compendium packs are available

1. Open Compendium Packs sidebar tab
2. Expand "Deathwatch" section

**Expected:**
- All 17 packs visible:
  - Actors (Characters, NPCs, Enemies, Hordes)
  - Weapons, Armor, Gear
  - Talents, Traits, Skills
  - Psychic Powers, Force Fields
  - Cybernetics, Ammo
  - Special Abilities, Chapter Abilities, Specialty Abilities
  - Macros, Journals (if applicable)
- Each pack has icon and item count

**Pass/Fail:** ____

---

### CP-02: Open Compendium (Weapons)
**Goal:** Verify Weapons compendium opens and displays items

1. Click "Deathwatch: Weapons" compendium

**Expected:**
- Pack opens in separate window
- List of weapons displayed (Astartes Bolter, Stalker Bolter, etc.)
- Items sorted alphabetically
- Search bar present at top

**Pass/Fail:** ____

---

### CP-03: Search Compendium
**Goal:** Verify compendium search functionality

1. Open "Deathwatch: Weapons"
2. Type "bolter" in search box

**Expected:**
- Only items with "bolter" in name shown (case-insensitive)
- Results update live as typing
- Clear search (X button) returns full list

**Pass/Fail:** ____

---

### CP-04: Drag Item from Compendium to Actor
**Goal:** Verify drag-and-drop from pack to character sheet

1. Open "Deathwatch: Weapons"
2. Drag "Astartes Bolter" to Test Marine sheet

**Expected:**
- Weapon added to Test Marine's Combat tab
- All stats copied (damage, pen, range, etc.)
- Original compendium item unchanged
- Item is independent copy

**Pass/Fail:** ____

---

### CP-05: Drag Actor from Compendium to Directory
**Goal:** Verify actor can be imported from compendium

1. Open "Deathwatch: Characters" compendium
2. Drag character (e.g., "Sample Tactical Marine") to Actors directory

**Expected:**
- Actor created in directory
- All stats, gear, and settings copied
- Independent of compendium (changes don't affect original)

**Pass/Fail:** ____

---

### CP-06: Drag Actor from Compendium to Scene
**Goal:** Verify actor can be dragged directly to scene

1. Open "Deathwatch: Enemies"
2. Drag "Ork Boy" directly to combat scene

**Expected:**
- Token created on scene
- Actor created in Actors directory (or temporary)
- Token functional (can attack, roll, etc.)

**Pass/Fail:** ____

---

### CP-07: Compendium Item (View Only)
**Goal:** Verify compendium items are read-only (unless imported)

1. Open "Deathwatch: Weapons"
2. Click "Astartes Bolter" to open sheet
3. Attempt to edit damage value

**Expected:**
- Item sheet opens in read-only mode
- Fields not editable (or edits don't save)
- Warning shown: "Compendium items are read-only"

**Pass/Fail:** ____

---

### CP-08: Compendium ID Convention
**Goal:** Verify items use consistent ID format

1. Open "Deathwatch: Weapons" (source JSON)
2. Check item IDs (e.g., in `packs/weapons/` folder)

**Expected:**
- IDs follow convention: `{type}:{category}:{name-slug}`
- Example: `weapon:basic:astartes-bolter`
- IDs lowercase, hyphenated, no spaces

**Pass/Fail:** ____

---

### CP-09: Compendium Validation (Build)
**Goal:** Verify compendium build validates items

1. Open terminal
2. Run `npm run build:packs`

**Expected:**
- Build completes successfully
- Validation checks run (schema, required fields)
- If errors: Build fails with descriptive messages
- Output: "✓ All packs validated"

**Pass/Fail:** ____

---

### CP-10: Compendium JSON Format
**Goal:** Verify source JSON follows correct format

1. Open `packs/weapons/astartes-bolter.json`
2. Check structure

**Expected:**
- JSON valid (no syntax errors)
- Fields present: `name`, `type`, `system`, `img`
- `system` contains weapon stats (damage, pen, etc.)
- `img` path valid (relative to system root)

**Pass/Fail:** ____

---

### CP-11: Compendium Item Count
**Goal:** Verify compendium packs contain expected number of items

1. Open each compendium pack
2. Note item counts

**Expected:**
- **Weapons**: 50+ items
- **Armor**: 20+ items
- **Talents**: 100+ items
- **Psychic Powers**: 40+ items
- **Enemies**: 30+ actors
- **Total across all packs**: 800+ items/actors

**Pass/Fail:** ____

---

### CP-12: Compendium Images (Icons)
**Goal:** Verify compendium items display correct icons

1. Open "Deathwatch: Weapons"
2. Check item icons

**Expected:**
- Each item has unique icon (not default/placeholder)
- Images load correctly (no broken links)
- Icons visible in list view and item sheet

**Pass/Fail:** ____

---

### CP-13: Compendium Item Key Field
**Goal:** Verify all compendium items have `key` field

1. Open compendium item (e.g., "Astartes Bolter")
2. Check for `system.key` field

**Expected:**
- Key field present: e.g., `"key": "astartes-bolter"`
- Key unique within pack
- Key used for item matching (not ID or name)

**Pass/Fail:** ____

---

### CP-14: Drag Multiple Items
**Goal:** Verify multiple items can be dragged at once

1. Open "Deathwatch: Gear"
2. Shift-click to select 5 items
3. Drag all 5 to Test Marine

**Expected:**
- All 5 items added to character
- Each item independent
- Bulk drag supported (or drag one-by-one)

**Pass/Fail:** ____

---

### CP-15: Compendium Sorting
**Goal:** Verify compendium items sorted correctly

1. Open "Deathwatch: Talents"

**Expected:**
- Items sorted alphabetically by name (A-Z)
- Sorting consistent across packs
- No duplicate names at top/bottom (case sensitivity)

**Pass/Fail:** ____

---

### CP-16: Compendium Pack Rebuild
**Goal:** Verify packs can be rebuilt after source JSON changes

1. Edit source JSON: `packs/weapons/astartes-bolter.json`
2. Change damage: 1d10+5 → 1d10+6
3. Run `npm run build:packs`
4. Run `npm run build:copy` (deploy)
5. Refresh Foundry, open compendium

**Expected:**
- Bolter damage updated to 1d10+6
- Change reflected in compendium
- Other items unaffected

**Pass/Fail:** ____

---

### CP-17: Compendium Error Handling
**Goal:** Verify build catches common errors

1. Edit source JSON: `packs/weapons/astartes-bolter.json`
2. Introduce syntax error (e.g., missing comma)
3. Run `npm run build:packs`

**Expected:**
- Build fails with error message
- Error message points to file and line number
- No packs generated (or existing packs intact)

**Pass/Fail:** ____

---

### CP-18: Compendium Item Duplicate
**Goal:** Verify compendium items can be duplicated to World

1. Open "Deathwatch: Weapons"
2. Right-click "Astartes Bolter"
3. Select "Import"

**Expected:**
- Item copied to World Items directory
- Item now editable (not read-only)
- Changes to World item don't affect compendium

**Pass/Fail:** ____

---

### CP-19: Compendium Macros
**Goal:** Verify Macros compendium loads and macros execute

1. Open "Deathwatch: Macros"
2. Drag "🔥 Flame Attack" to hotbar
3. Select target token
4. Click macro

**Expected:**
- Macro executes (prompts for damage, etc.)
- Flame mechanics applied correctly
- Chat message shows results

**Pass/Fail:** ____

---

### CP-20: Compendium Journal Entries
**Goal:** Verify Journals compendium (if present) displays entries

1. Open "Deathwatch: Journals" (if available)
2. Click journal entry (e.g., "Deathwatch Lore")

**Expected:**
- Journal opens with formatted text
- Images display correctly
- Links functional (internal/external)

**Pass/Fail:** ____

---

## Notes

**Common Issues:**
- Compendium packs not visible (build not deployed)
- Items missing `key` field (breaks item matching)
- IDs inconsistent (breaks migrations)
- Images not loading (broken paths)
- Drag-and-drop not working (Foundry permissions)

**Reference:** 
- [.claude/docs/compendium.md](../../.claude/docs/compendium.md)
- [.claude/docs/build-deploy.md](../../.claude/docs/build-deploy.md)
- `scripts/build-packs.mjs`

_Compendium protocols sanctified. The sacred repositories are complete._ ⚙️
