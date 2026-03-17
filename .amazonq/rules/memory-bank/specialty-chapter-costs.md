# Specialty and Chapter Cost System

## Overview
The system includes a cost override mechanism where chapters can reduce XP costs for skills and talents, and specialties define costs for characteristic advances. This allows different Space Marine chapters and specialties to have different advancement costs.

## Architecture

### Core Components
- **Skills Base Costs** (`module/data/skills.json`): Default XP costs for all skills
- **SkillLoader** (`module/helpers/skill-loader.mjs`): Loads skill definitions
- **Actor Sheet** (`module/sheets/actor-sheet.mjs`): Applies chapter cost overrides
- **Chapter Items** (`template.json`): Store skill and talent cost overrides
- **Specialty Items** (`template.json`): Store characteristic advance costs, talent cost overrides, and psy rating flag

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
    "hasPsyRating": false,
    "talentCosts": {},
    "characteristicCosts": {
      "ws": { "simple": 500, "intermediate": 1000, "trained": 1500, "expert": 2000 },
      "bs": { "simple": 500, "intermediate": 1000, "trained": 1500, "expert": 2000 }
    },
    "rankCosts": {
      "1": {
        "skills": { 
          "medicae": { "costTrain": 400 },
          "chem_use": { "costTrain": 400 }
        },
        "talents": { "tal00000000012": 500, "tal00000000092": 500 }
      },
      "2": {
        "skills": {
          "medicae": { "costMaster": 400 }
        },
        "talents": {}
      },
      "2": { "skills": {}, "talents": {} },
      "3": { "skills": {}, "talents": {} },
      "4": { "skills": {}, "talents": {} },
      "5": { "skills": {}, "talents": {} },
      "6": { "skills": {}, "talents": {} },
      "7": { "skills": {}, "talents": {} },
      "8": { "skills": {}, "talents": {} }
    }
  }
}
```

## Implementation

### Skill Cost Override (IMPLEMENTED)
**Location:** `actor-sheet.mjs` in `_prepareCharacterData()` method (lines 119-135)

```javascript
// Get chapter skill cost overrides
const chapterSkillCosts = {};
if (context.chapterItem && context.chapterItem.system.skillCosts) {
  Object.assign(chapterSkillCosts, context.chapterItem.system.skillCosts);
}

// Get specialty rank-based skill cost overrides
const specialtySkillCosts = {};
if (context.specialtyItem && context.specialtyItem.system.rankCosts) {
  const currentRank = context.system.rank || 1;
  const rankData = context.specialtyItem.system.rankCosts[currentRank.toString()];
  if (rankData && rankData.skills) {
    Object.assign(specialtySkillCosts, rankData.skills);
  }
}

// Apply chapter skill cost overrides
if (chapterSkillCosts[k]) {
  if (chapterSkillCosts[k].costTrain !== undefined) v.costTrain = chapterSkillCosts[k].costTrain;
  if (chapterSkillCosts[k].costMaster !== undefined) v.costMaster = chapterSkillCosts[k].costMaster;
  if (chapterSkillCosts[k].costExpert !== undefined) v.costExpert = chapterSkillCosts[k].costExpert;
}

// Apply specialty rank-based skill cost overrides (takes precedence over chapter)
if (specialtySkillCosts[k] !== undefined) {
  // Support both simple number format and full object format
  if (typeof specialtySkillCosts[k] === 'number') {
    v.costTrain = specialtySkillCosts[k];
  } else if (typeof specialtySkillCosts[k] === 'object') {
    if (specialtySkillCosts[k].costTrain !== undefined) v.costTrain = specialtySkillCosts[k].costTrain;
    if (specialtySkillCosts[k].costMaster !== undefined) v.costMaster = specialtySkillCosts[k].costMaster;
    if (specialtySkillCosts[k].costExpert !== undefined) v.costExpert = specialtySkillCosts[k].costExpert;
  }
}
```

**How It Works:**
1. Base skill costs loaded from `skills.json` via SkillLoader
2. Actor sheet checks if chapter is assigned (`context.chapterItem`)
3. If chapter has `skillCosts` defined, those override the base costs
4. Actor sheet checks if specialty is assigned and gets current rank
5. If specialty has rank-specific `skillCosts`, those override chapter costs
6. Specialty rank costs support flexible format:
   - Single level: `"medicae": { "costTrain": 400 }` (only overrides Train)
   - Multiple levels: `"medicae": { "costTrain": 400, "costMaster": 500 }`
   - Simple number (legacy): `"medicae": 400` (only overrides costTrain)
7. Each rank typically overrides one skill level:
   - Rank 1: "Chem-Use" → costTrain override
   - Rank 2: "Chem-Use+10" → costMaster override
   - Rank 3: "Chem-Use+20" → costExpert override
8. Overridden costs available on skill object as `v.costTrain`, `v.costMaster`, `v.costExpert`

### Talent Cost Override (IMPLEMENTED)
**Location:** `actor-sheet.mjs` in `_prepareItems()` method

```javascript
// Apply talent cost overrides
if (context.talents && context.talents.length > 0) {
  const chapterTalentCosts = context.chapterTalentCosts || {};
  const specialtyBaseTalentCosts = context.specialtyBaseTalentCosts || {};
  const specialtyTalentCosts = context.specialtyTalentCosts || {};
  
  for (const talent of context.talents) {
    let effectiveCost = talent.system.cost;
    
    // Apply chapter override
    if (chapterTalentCosts[talent._id] !== undefined) {
      effectiveCost = chapterTalentCosts[talent._id];
    }
    
    // Apply specialty base talentCosts override (takes precedence over chapter)
    if (specialtyBaseTalentCosts[talent._id] !== undefined) {
      effectiveCost = specialtyBaseTalentCosts[talent._id];
    }
    
    // Apply specialty rank override (highest precedence)
    if (specialtyTalentCosts[talent._id] !== undefined) {
      effectiveCost = specialtyTalentCosts[talent._id];
    }
    
    talent.system.effectiveCost = effectiveCost;
  }
}
```

**How It Works:**
1. Base talent costs from talent item's `cost` field
2. Chapter talent cost overrides applied from `chapter.system.talentCosts`
3. Specialty base talent cost overrides applied from `specialty.system.talentCosts`
4. Specialty rank-based talent cost overrides applied from `specialty.system.rankCosts[rank].talents`
5. Precedence: chapter → specialty base talentCosts → specialty rankCosts (highest)
6. Effective cost stored in `talent.system.effectiveCost` for display

**Specialty talentCosts vs rankCosts:**
- `specialty.system.talentCosts`: Base overrides that apply regardless of rank (e.g., Librarian Psy Rating 3 cost = 0)
- `specialty.system.rankCosts[rank].talents`: Rank-specific overrides that change as character advances

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

## Example: Librarian Specialty

### Base Talent Cost Overrides
```json
{
  "talentCosts": {
    "tal00000000275": 0
  }
}
```

**Result:** Librarian pays 0 XP for Psy Rating 3 (base cost is -1, meaning unavailable without override).

## Example: Apothecary Specialty Rank 1

### Rank-Based Cost Overrides
```json
{
  "rankCosts": {
    "1": {
      "skills": {
        "chem_use": { "costTrain": 400 },
        "interrogation": { "costTrain": 200 },
        "medicae": { "costTrain": 400 }
      },
      "talents": {
        "tal00000000012": 500,
        "tal00000000092": 500,
        "tal00000000189": 500,
        "tal00000000190": 500,
        "tal00000000191": 500
      }
    },
    "2": {
      "skills": {
        "chem_use": { "costMaster": 400 },
        "interrogation": { "costMaster": 200 }
      },
      "talents": {}
    }
  }
}
```

**Result:** 
- **Rank 1**: Apothecary pays 400 XP to **train** Chem-Use (costTrain override)
- **Rank 2**: Apothecary pays 400 XP to **master** Chem-Use (costMaster override)
- **Rank 3**: Would have Chem-Use+20 for costExpert override
- Each rank only overrides one skill level at a time

**Skill Cost Format:**
- Rank 1 (base skill): `"skill_name": { "costTrain": 400 }`
- Rank 2 (skill+10): `"skill_name": { "costMaster": 400 }`
- Rank 3 (skill+20): `"skill_name": { "costExpert": 400 }`
- Can specify any combination: `{ "costTrain": 400, "costMaster": 500 }`

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

### 1. Characteristic Advance Cost Display
Display specialty characteristic costs in UI:
```javascript
// In actor-sheet.mjs
if (context.specialtyItem && context.specialtyItem.system.characteristicCosts) {
  const charCosts = context.specialtyItem.system.characteristicCosts[charKey];
  // Display costs in characteristic advance UI
}
```

### 2. XP Calculation Integration
When calculating XP spent, use:
- Chapter-overridden skill costs
- Chapter-overridden talent costs
- Specialty characteristic advance costs

## Notes

- Skill cost override system is fully functional (chapter + specialty rank-based)
- Talent cost override system is fully functional (chapter + specialty base talentCosts + specialty rank-based)
- Talent cost precedence: chapter → specialty base talentCosts → specialty rankCosts (highest)
- Specialty `talentCosts` field provides rank-independent overrides (e.g., Librarian Psy Rating 3 = 0 XP)
- Specialty `hasPsyRating` flag controls Psy Rating box and Psychic Powers tab visibility
- Characteristic advance costs from specialty are defined but not yet used in code
- All cost data is already populated in compendium packs
- Cost overrides are chapter/specialty/rank-specific, not global
- Base costs remain in skills.json and talent items as fallback
- Rank-based costs allow different XP costs at each of the 8 ranks
- Cost of -1 means "not normally available" (talent cannot be purchased without override)
