---
name: compendium_system
description: Compendium pack workflow and ID conventions
type: project
---

**Source files:** `src/packs-source/` (JSON, version controlled)  
**Compiled packs:** `src/packs/` (LevelDB, generated, not version controlled)

**Workflow:**
1. Edit JSON files in `src/packs-source/{pack-name}/`
2. Run `npm run build:packs` to validate and compile
3. Commit source JSON files (never commit compiled packs)
4. Run `npm run build:copy` to deploy to local Foundry

**ID Conventions:**

**CRITICAL:** All `_id` fields must be unique across ALL compendium packs. Duplicate IDs cause data corruption.

Common prefixes:
- Ammunition: `clip00000000###`
- Weapons: `weap00000000###`
- Armor: `armr00000000###`
- Talents: `tal000000000###`
- Traits: `trt000000000###`
- Enemies: `enmy{faction}{pad}{num}` (e.g., `enmytyranid00001`)
- Hordes: `hord{faction}{pad}{num}` (e.g., `hordtyranid00001`)

**Talents MUST have compendiumId:** All talent items must have `system.compendiumId` set to match their `_id`. This is used by XPCalculator and chapter/specialty cost overrides.

**Build Pipeline:**
1. `compactJson.mjs` - Smart key ordering + inline compaction
2. `prettier` - Adds spacing to inlined JSON
3. `validatePacks.mjs` - Validates unique IDs, talent compendiumIds, quality keys
4. `compilePacks.mjs` - Converts JSON to LevelDB

**Validation:**
```bash
npm run build:packs  # Full validation + compilation
```

Build will fail if:
- Duplicate `_id` found across any packs
- Talent missing `system.compendiumId`
- Invalid weapon quality keys
- Embedded items out of sync
