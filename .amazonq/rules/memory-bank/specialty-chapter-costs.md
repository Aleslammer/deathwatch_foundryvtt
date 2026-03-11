# Specialty and Chapter Cost System

## Overview
The system includes a cost override mechanism where chapters can reduce XP costs for skills and talents, and specialties define costs for characteristic advances. This allows different Space Marine chapters and specialties to have different advancement costs.

## Architecture

### Core Components
- **Skills Base Costs** (`module/data/skills.json`): Default XP costs for all skills
- **SkillLoader** (`module/helpers/skill-loader.mjs`): Loads skill definitions
- **Actor Sheet** (`module/sheets/actor-sheet.mjs`): Applies chapter cost overrides
- **Chapter Items** (`template.json`): Store skill and talent cost overrides
- **Specialty Items** (`template.json`): Store characteristic advance costs

## Data Structure

### Skills Base Costs (skills.json)
```json
{
  "charm": {
    "isBasic": true,
    "characteristic": "fs",
    "costTrain": 800,
    "costMaster": 800,
    "costExpert": 800,
    "descriptor": "Interaction"
  }
}
```

### Chapter Item Schema
```json
{
  "chapter": {
    "skillCosts": {
      "charm": {
        "costTrain": 400,
        "costMaster": 400,
        "costExpert": 400
      }
    },
    "talentCosts": {
      "tal00000000055": 800,
      "tal00000000119": 500
    }
  }
}
```

### Specialty Item Schema
```json
{
  "specialty": {
    "characteristicCosts": {
      "ws": { "simple": 500, "intermediate": 1000, "trained": 1500, "expert": 2000 },
      "bs": { "simple": 500, "intermediate": 1000, "trained": 1500, "expert": 2000 }
    }
  }
}
```

## Implementation

### Skill Cost Override (IMPLEMENTED)
**Location:** `actor-sheet.mjs` in `_prepareCharacterData()` method (lines 119-128)

```javascript
// Get chapter skill cost overrides
const chapterSkillCosts = {};
if (context.chapterItem && context.chapterItem.system.skillCosts) {
  Object.assign(chapterSkillCosts, context.chapterItem.system.skillCosts);
}

// Apply chapter skill cost overrides to each skill
if (chapterSkillCosts[k]) {
  if (chapterSkillCosts[k].costTrain !== undefined) v.costTrain = chapterSkillCosts[k].costTrain;
  if (chapterSkillCosts[k].costMaster !== undefined) v.costMaster = chapterSkillCosts[k].costMaster;
  if (chapterSkillCosts[k].costExpert !== undefined) v.costExpert = chapterSkillCosts[k].costExpert;
}
```

**How It Works:**
1. Base skill costs loaded from `skills.json` via SkillLoader
2. Actor sheet checks if chapter is assigned (`context.chapterItem`)
3. If chapter has `skillCosts` defined, those override the base costs
4. Overridden costs available on skill object as `v.costTrain`, `v.costMaster`, `v.costExpert`

### Talent Cost Override (NOT IMPLEMENTED)
**Data Structure:** Exists in chapter items as `talentCosts` object
**Format:** `{ "talentId": xpCost }`
**Status:** Data structure defined but no code applies these overrides yet

### Characteristic Advance Costs (NOT IMPLEMENTED)
**Data Structure:** Exists in specialty items as `characteristicCosts` object
**Format:** `{ "ws": { "simple": 500, "intermediate": 1000, ... } }`
**Status:** Data structure defined but no code uses these costs yet

## Example: Ultramarines Chapter

### Skill Cost Overrides
```json
{
  "skillCosts": {
    "charm": { "costTrain": 400, "costMaster": 400, "costExpert": 400 },
    "command": { "costTrain": 400, "costMaster": 400, "costExpert": 400 },
    "tactics_assault_doctrine": { "costTrain": 400, "costMaster": 400, "costExpert": 400 }
  }
}
```

**Result:** An Ultramarine pays 400 XP to train Charm instead of the base 800 XP.

### Talent Cost Overrides
```json
{
  "talentCosts": {
    "tal00000000055": 800,
    "tal00000000119": 500
  }
}
```

**Status:** Not yet applied in code.

## Example: Tactical Marine Specialty

### Characteristic Costs
```json
{
  "characteristicCosts": {
    "ws": { "simple": 500, "intermediate": 1000, "trained": 1500, "expert": 2000 },
    "bs": { "simple": 500, "intermediate": 1000, "trained": 1500, "expert": 2000 },
    "wil": { "simple": 200, "intermediate": 500, "trained": 1000, "expert": 1500 },
    "fs": { "simple": 200, "intermediate": 500, "trained": 1000, "expert": 1500 }
  }
}
```

**Status:** Not yet used in code.

## Data Files

### Skills
- **Base Costs:** `src/module/data/skills.json`
- **All Skills:** 100+ skills with default costs

### Chapters
- **Location:** `src/packs-source/chapters/`
- **Files:** ultramarines.json, blood-angels.json, space-wolves.json, etc.
- **All chapters have:** `skillCosts` and `talentCosts` populated

### Specialties
- **Location:** `src/packs-source/specialties/`
- **Files:** tactical-marine.json, assault-marine.json, devastator-marine.json, etc.
- **All specialties have:** `characteristicCosts` populated

## UI Display

### Skills Tab
- Skills display their costs: `costTrain`, `costMaster`, `costExpert`
- Costs automatically reflect chapter overrides when chapter is assigned
- No special UI needed - costs just update

### Chapter Assignment
- Drag chapter item onto chapter drop zone on Biography tab
- Chapter stored in `actor.system.chapterId`
- Chapter item stored in actor's items collection

### Specialty Assignment
- Drag specialty item onto specialty drop zone on Biography tab
- Specialty stored in `actor.system.specialtyId`
- Specialty item stored in actor's items collection

## Future Implementation Needed

### 1. Talent Cost Override
Create helper to apply chapter talent cost overrides:
```javascript
// In actor-sheet.mjs or talent display logic
if (context.chapterItem && context.chapterItem.system.talentCosts) {
  const overrideCost = context.chapterItem.system.talentCosts[talent._id];
  if (overrideCost !== undefined) {
    talent.cost = overrideCost;
  }
}
```

### 2. Characteristic Advance Cost Display
Display specialty characteristic costs in UI:
```javascript
// In actor-sheet.mjs
if (context.specialtyItem && context.specialtyItem.system.characteristicCosts) {
  const charCosts = context.specialtyItem.system.characteristicCosts[charKey];
  // Display costs in characteristic advance UI
}
```

### 3. XP Calculation Integration
When calculating XP spent, use:
- Chapter-overridden skill costs
- Chapter-overridden talent costs
- Specialty characteristic advance costs

## Notes

- Skill cost override system is fully functional
- Talent and characteristic cost systems have data but no implementation
- All cost data is already populated in compendium packs
- Cost overrides are chapter/specialty-specific, not global
- Base costs remain in skills.json as fallback
