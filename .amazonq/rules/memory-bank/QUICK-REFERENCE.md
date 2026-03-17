# Quick Reference Guide

## Essential Commands
```bash
npm test                    # Run all tests
npm run test:coverage       # Generate coverage report
npm run build:packs         # Compile compendium packs
cls;npm run build:packs;.\builds\scripts\CopyLocal.ps1  # Full build + deploy
```

## Key Metrics
- **Test Coverage**: 79.31% (781 tests passing)
- **Target Coverage**: 90%+ for helpers, 70%+ for documents
- **Helper Classes**: 24 specialized helpers
- **Compendium Packs**: 15 packs (Ammunition, Weapons, Armor, Gear, Talents, Traits, Chapters, Specialties, Implants, Cybernetics, Weapon Qualities, Weapon Upgrades, Demeanours, Critical Effects, Tables)

## Core Systems Quick Links

### Modifiers
- **File**: modifiers.md
- **Types**: characteristic, skill, initiative, wounds, armor, psy-rating, weapon-damage, weapon-rof, weapon-blast
- **Sources**: Actor, equipped items, chapters, armor histories, ammunition

### Combat
- **File**: combat-systems.md
- **Ranged**: BS-based, RoF (Single/Semi/Full), aim, range modifiers, jamming
- **Melee**: WS-based, all-out attack, charge
- **Shared**: Hit locations, damage application, Righteous Fury

### Weapon Qualities
- **File**: weapon-qualities.md
- **Count**: 23+ implemented qualities
- **Key Qualities**: Accurate, Tearing, Primitive, Melta, Lightning Claws, Power Field, Overheats, Reliable, Power Fist, Gyro-Stabilised
- **Detection**: Synchronous via `attachedQualities.includes(key)`

### Weapon Upgrades
- **File**: weapon-upgrades.md
- **Modifiers**: characteristic (BS/WS), weapon-range (additive/multiplicative)
- **Example**: Red-Dot Laser Sight (+10 BS single shot)

### Ammunition
- **File**: ammunition-modifiers.md
- **Modifiers**: weapon-damage, weapon-rof, weapon-blast, righteous-fury-threshold, characteristic-damage
- **Special**: weaponClass restrictions, qualityException field

## Architecture Patterns

### Helper Class Pattern
```javascript
export class HelperName {
  static calculate(input) {
    // Pure function, no side effects
    return result;
  }
}
```

### Modifier Application
```javascript
// Collect from all sources
const modifiers = ModifierCollector.collectAllModifiers(actor);
// Apply to systems
ModifierCollector.applyCharacteristicModifiers(characteristics, modifiers);
ModifierCollector.applyPsyRatingModifiers(psyRating, modifiers);
```

### Quality Detection
```javascript
// Synchronous check (preferred)
const hasAccurate = weapon.system.attachedQualities?.includes('accurate');

// Async check (legacy)
const hasAccurate = await WeaponQualityHelper.hasQuality(weapon, 'accurate');
```

## Testing Patterns

### Test Structure
```javascript
import { jest } from '@jest/globals';
import './setup.mjs';

describe('ClassName', () => {
  beforeEach(() => jest.clearAllMocks());
  
  it('describes behavior', () => {
    expect(result).toBe(expected);
  });
});
```

### Mock Actor
```javascript
const mockActor = {
  name: 'Test Actor',
  system: { wounds: { value: 10, max: 20 } },
  update: jest.fn(),
  items: { get: jest.fn(), filter: jest.fn() }
};
```

## Common Tasks

### Add New Weapon Quality
1. Add to weapon-qualities.md documentation
2. Implement detection in WeaponQualityHelper
3. Add effect logic in CombatDialogHelper
4. Write tests in weapon-qualities.test.mjs
5. Update compendium pack

### Add New Modifier Type
1. Document in modifiers.md
2. Add to ModifierCollector apply methods
3. Update template.json if needed
4. Write tests
5. Update UI if needed

### Add Compendium Pack
1. Add item type to template.json
2. Register in system.json
3. Create source directory in packs-source/
4. Add JSON files
5. Run `npm run build:packs`

## File Locations

### Core Code
- **Documents**: `src/module/documents/`
- **Helpers**: `src/module/helpers/`
- **Sheets**: `src/module/sheets/`
- **Tests**: `tests/`

### Data
- **Schema**: `src/template.json`
- **Compendium Source**: `src/packs-source/`
- **Compendium Compiled**: `src/packs/`

### Documentation
- **Memory Bank**: `.amazonq/rules/memory-bank/`
- **Index**: `index.md`
- **This Guide**: `QUICK-REFERENCE.md`

## Troubleshooting

### Tests Failing
1. Check `jest.clearAllMocks()` in beforeEach
2. Verify mock setup in tests/setup.mjs
3. Check for async/await issues
4. Run single test: `npm test -- path/to/test.mjs`

### Compendium Issues
1. Verify unique `_id` fields
2. Check JSON syntax
3. Rebuild: `npm run build:packs`
4. Check system.json registration

### Modifier Not Applying
1. Check `enabled` field (must not be false)
2. Verify `effectType` matches expected value
3. Check item is equipped (except chapters)
4. Enable debug: `DEBUG_FLAGS.MODIFIERS = true`

## Best Practices

### Code Quality
- ✅ Write tests for all helpers (90%+ coverage)
- ✅ Use pure functions when possible
- ✅ Extract logic from UI into helpers
- ✅ Use debug() instead of console.log()
- ✅ Document with JSDoc comments

### Data Management
- ✅ Use unique IDs across all compendiums
- ✅ Store base values, calculate effective values
- ✅ Use modifiers for temporary changes
- ✅ Validate data before operations

### Performance
- ✅ Use synchronous checks when possible
- ✅ Cache calculated values in prepareData()
- ✅ Avoid unnecessary async operations
- ✅ Use optional chaining for safety

---

**Last Updated**: January 2025
**For detailed information, see the full memory bank documents**
