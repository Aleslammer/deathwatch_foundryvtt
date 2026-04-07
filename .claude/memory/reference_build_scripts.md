---
name: reference_build_scripts
description: Build script locations and purposes
type: reference
---

Build scripts are located in `builds/scripts/`:

**compactJson.mjs**
- Compacts JSON with smart key ordering per item type
- Inlines short objects (≤80 chars at their indent level)
- Not alphabetical - logical ordering (book/page → stats → description → modifiers)

**compilePacks.mjs**
- Converts JSON source files to LevelDB packs
- Processes all directories in `src/packs-source/`
- Supports Item, Actor, and RollTable types
- Creates folders from subdirectories

**validatePacks.mjs**
- Validates unique `_id` fields across ALL packs
- Checks talent `compendiumId` matches `_id`
- Validates weapon quality keys
- Checks embedded items sync

**copyLocal.mjs**
- Deploys `src/` folder to local Foundry installation
- Uses `LOCAL_DIR` from `.env` file
- Example: `LOCAL_DIR=\\thebrewery\Foundry\Data\systems\deathwatch`

**migrateEnemyIds.mjs**
- Assigns sequential faction-based IDs to enemy actors
- Format: `enmy{faction}{pad}{num}` (e.g., `enmytyranid00001`)
- Used when adding new enemies to compendium

**Commands:**
```bash
npm run format:json   # compactJson + prettier
npm run build:packs   # compactJson + prettier + validatePacks + compilePacks
npm run build:copy    # copyLocal (deploys to Foundry)
npm run build:all     # build:packs + build:copy
```
