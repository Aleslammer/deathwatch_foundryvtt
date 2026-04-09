# Design Overview

## Architecture Philosophy

### Why Regions?

Foundry VTT v13 includes a native region system designed for spatial triggers. Instead of writing custom token movement hooks, we leverage this built-in functionality.

**Benefits**:
- ✅ **No custom hooks** - Foundry handles token enter/exit detection
- ✅ **GM-friendly** - Familiar drawing tools workflow
- ✅ **Visual feedback** - Regions visible on canvas, can be color-coded
- ✅ **Performance** - Native implementation optimized by Foundry team
- ✅ **Future-proof** - Foundry will maintain region system compatibility

**Alternative approaches considered**:
- ❌ **Token movement hooks** - More code, harder to maintain, performance concerns
- ❌ **Tile-based cover** - Inflexible, requires grid alignment, visual clutter
- ❌ **Manual toggles** - Requires player/GM to remember to activate, error-prone

### Why Active Effects?

Active Effects are Foundry's built-in system for temporary stat modifications.

**Benefits**:
- ✅ **Automatic integration** - Actor data model recalculates armor when effects change
- ✅ **Visible to players** - Effects show in character sheet UI
- ✅ **Stacking handled** - Foundry manages multiple effects correctly
- ✅ **Temporary nature** - Perfect for position-dependent bonuses
- ✅ **No combat code changes** - Damage calculation already considers all armor modifiers

**Active Effect structure**:
```javascript
{
  name: "Cover: Low Wall",
  icon: "icons/svg/shield.svg",
  changes: [
    { key: "system.armor.rightLeg", mode: ADD, value: 2 },
    { key: "system.armor.leftLeg", mode: ADD, value: 2 }
  ],
  flags: { deathwatch: { coverRegionId: "region123" } }
}
```

**Alternative approaches considered**:
- ❌ **Modifier system** - Designed for items/talents, not position-based effects
- ❌ **Temporary items** - Hacky, clutters inventory, confusing UX
- ❌ **Direct stat modification** - Would need to track and restore original values

## System Components

### 1. Cover Constants

**File**: `src/module/helpers/constants/cover-constants.mjs`

**Purpose**: Define available cover types with their armor bonuses and protected locations.

**Why separate constants file?**
- Single source of truth for cover definitions
- Easy to add new cover types without code changes
- Testable (can verify all types have required fields)
- Reusable across helper and behavior classes

**Design decision**: Cover types are static definitions, not dynamic data. No database storage needed.

### 2. Cover Helper

**File**: `src/module/helpers/combat/cover-helper.mjs`

**Purpose**: Pure business logic for applying/removing cover effects.

**Why a helper class?**
- Testable without Foundry instance running
- Reusable (could be called from other contexts like macros)
- Follows existing system pattern (`combat.mjs`, `ranged-combat.mjs`, etc.)
- Separates business logic from Foundry event handling

**Key responsibilities**:
- Create Active Effects with correct armor bonuses
- Remove Active Effects when leaving cover
- Prevent duplicate effects from same region
- Validate cover type configurations

### 3. Region Behavior

**File**: `src/module/regions/cover-behavior.mjs`

**Purpose**: Foundry integration layer that responds to token enter/exit events.

**Why extend RegionBehavior?**
- Required by Foundry's region system architecture
- Provides schema for GM configuration UI
- Handles event lifecycle (enter/exit/move)
- Minimal code (just delegates to CoverHelper)

**Design decision**: Keep behavior class thin. All business logic lives in CoverHelper for testability.

### 4. Registration

**File**: `src/module/init/config.mjs` (update)

**Purpose**: Register custom behavior with Foundry's CONFIG.

**Pattern**: Follows existing system initialization architecture (see CLAUDE.md "Modular Initialization Architecture").

## Data Flow

### Token Enters Cover

```
1. Player moves token into region
   ↓
2. Foundry detects collision, triggers RegionBehavior._handleTokenEnter()
   ↓
3. CoverRegionBehavior delegates to CoverHelper.applyCover()
   ↓
4. CoverHelper creates Active Effect on actor
   ↓
5. Actor data model recalculates derived data (armor values)
   ↓
6. Character sheet updates (if open)
   ↓
7. Notification shown to user
```

### Token Leaves Cover

```
1. Player moves token out of region
   ↓
2. Foundry detects exit, triggers RegionBehavior._handleTokenExit()
   ↓
3. CoverRegionBehavior delegates to CoverHelper.removeCover()
   ↓
4. CoverHelper finds and deletes Active Effect
   ↓
5. Actor data model recalculates (armor returns to normal)
   ↓
6. Character sheet updates
   ↓
7. Notification shown to user
```

### Attack Hits Character in Cover

```
1. Attacker rolls damage, selects hit location
   ↓
2. Chat message posts with "Apply Damage" button
   ↓
3. GM clicks button
   ↓
4. combat.mjs → applyDamage() → getArmorValue(location)
   ↓
5. Actor returns armor value (base armor + Active Effect bonuses)
   ↓
6. Damage reduction calculated normally
   ↓
7. No special cover logic needed - Active Effects already applied!
```

## Design Decisions

### Hit Location Granularity

**Decision**: Use Deathwatch's 6 hit locations (head, body, arms, legs).

**Rationale**: Matches existing actor data model. Cover types specify which locations they protect.

**Alternative considered**: Binary "in cover / not in cover" - Rejected as less tactical and less faithful to Deathwatch rules.

### Omnidirectional vs Directional

**Decision**: Start with omnidirectional cover (protection regardless of attack angle).

**Rationale**: 
- Simpler implementation (no geometry calculations)
- 80% use case (most cover works from multiple angles)
- Can add directional cover as optional enhancement later

**Future enhancement**: Add `direction` field to cover types for walls/barriers that only protect from one side.

### Armor Bonus vs Attack Penalty

**Decision**: Implement armor bonuses first. Attack penalties as future enhancement.

**Rationale**:
- Deathwatch rules specify both (armor bonus + BS penalty)
- Armor bonus is simpler (Active Effects, no combat roll changes)
- Attack penalty requires modifying attack dialog (more complex)
- Can add attack penalty later without breaking existing functionality

**Deathwatch rules** (Core p. 246-247):
- Cover provides armor bonus (varies by cover type)
- Shooting at target in cover incurs BS penalty (−10 to −30)

### Region Overlap Handling

**Decision**: Allow multiple region effects to stack.

**Rationale**:
- Foundry Active Effects stack by default (ADD mode)
- Realistic (corner of two walls = better protection)
- Emergent gameplay (players seek best positions)
- GMs can choose to use overlapping or non-overlapping regions

**Example**: Token in corner with two "High Wall" regions gets +8 AP to body (4 + 4), +4 AP to one set of legs (protected by one wall), +4 AP to other set of legs (protected by other wall).

**Alternative considered**: "Highest bonus wins" - Rejected as less intuitive and requires custom Active Effect handling.

### Horde Compatibility

**Decision**: Hordes do not benefit from cover (initial implementation).

**Rationale**:
- Hordes use single `system.armor` value (no hit locations)
- Hordes already have high armor values for balance
- Represents swarm nature (can't all hide behind one wall)
- Keeps implementation simpler

**Future enhancement**: Add setting to enable horde cover (apply highest/average bonus to single armor value).

### Cover Type Extensibility

**Decision**: Cover types defined in constants file, not in database.

**Rationale**:
- Cover types are system-wide rules, not world-specific data
- Changing armor values shouldn't require GM database edits
- Module developers can add custom cover types via code
- Keeps UI simpler (dropdown, not CRUD interface)

**Alternative considered**: Store cover types in world settings - Rejected as over-engineered for current needs.

### Effect Cleanup

**Decision**: Delete effects on region exit (don't just disable).

**Rationale**:
- Simpler (no lingering disabled effects)
- Cleaner character sheet (only shows currently active effects)
- No edge cases around re-enabling effects

**Foundry handles**: Effect deletion automatically triggers actor data recalculation.

## Performance Considerations

### Token Movement Frequency

**Concern**: Region behavior triggers on every token move. Could this cause lag?

**Analysis**:
- Token movement is already expensive (Foundry redraws canvas, checks vision, etc.)
- Our code adds: 1 Active Effect create/delete per region enter/exit
- Active Effect operations are fast (<10ms typical)
- Region enter/exit is less frequent than token move (only triggers on boundary cross)

**Conclusion**: No performance concerns expected. If issues arise, can add throttling.

### Multiple Overlapping Regions

**Concern**: Token in 5 overlapping regions = 5 Active Effects.

**Analysis**:
- Actor data model recalculates once after all effects applied
- Foundry optimizes effect batching
- Realistic scenarios have 1-2 overlapping regions max

**Conclusion**: Acceptable. GMs should avoid excessive overlap as map design practice.

### Large Maps with Many Regions

**Concern**: Scene with 50+ cover regions could be slow.

**Analysis**:
- Foundry's region collision detection is optimized (spatial indexing)
- Only regions near token are checked
- Our code only runs on boundary cross (not continuous)

**Conclusion**: No special optimization needed. Foundry handles this.

## Testing Strategy

### Unit Tests

**File**: `tests/combat/cover-helper.test.mjs`

**Approach**: Mock Foundry API via test setup. Test pure business logic.

**Test coverage**:
- Cover type validation
- Active Effect creation with correct armor bonuses
- Duplicate effect prevention
- Effect removal by region ID
- Error handling (missing actor, invalid cover type)

### Integration Tests (Manual)

**Approach**: Test in live Foundry instance.

**Test scenarios**:
- Single region enter/exit
- Multiple overlapping regions
- Combat damage with cover bonuses
- Character sheet displays correct values
- Notifications appear correctly

### Edge Cases to Test

- Token teleported into region (not movement) - Does enter trigger?
- Region deleted while token inside - Is effect cleaned up?
- Actor deleted while in region - No orphaned effects?
- Scene unloaded - Effects persist on actor? (Desired behavior)
- Multiple tokens enter same region simultaneously
- Token exactly on region boundary - Which side?

## Future Expansion Paths

### Phase 1: Core System (Initial Implementation)
- Omnidirectional cover with armor bonuses
- Basic cover types (low/high/full/reinforced)
- Active Effect integration
- Unit tests

### Phase 2: Enhanced UX
- Custom cover icons
- Color-coded region templates
- Cover status indicator on tokens
- "Show Cover" macro to highlight all regions

### Phase 3: Advanced Mechanics
- Directional cover (wall facing matters)
- Attack roll penalties for targets in cover
- Cover penetration (weapons that ignore cover)
- Blast weapons scatter into cover

### Phase 4: Dynamic Cover
- Cover destruction (regions gain HP)
- Degrading cover (AP reduces as cover damaged)
- Deployable cover (create temporary regions via items)
- Smoke/concealment (vision penalties, not armor)

## Migration Path

**Backward compatibility**: ✅ This is a new feature. No breaking changes.

**Existing scenes**: Continue to work unchanged. GMs add regions when desired.

**Module conflicts**: Region behaviors are namespaced (`deathwatch.cover`). Should not conflict with other modules using regions.

## Open Architecture Questions

See [open-questions.md](./open-questions.md) for design decisions still being finalized.
