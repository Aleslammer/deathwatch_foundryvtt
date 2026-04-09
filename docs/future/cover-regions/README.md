# Cover Regions System

**Status**: Design Phase  
**Priority**: Medium  
**Estimated Complexity**: Medium

## Quick Overview

A region-based cover system that automatically applies armor bonuses to specific hit locations when tokens enter cover areas. Uses Foundry VTT's native region mechanics to provide tactical depth to combat encounters.

## Core Concept

**Problem**: Deathwatch combat rules include cover mechanics (Core p. 246-247) but current system has no automated way to track which characters are in cover.

**Solution**: Use Foundry regions to define cover areas on scenes. When a token enters a region, automatically apply Active Effects that increase armor values for the protected hit locations.

**Example**: A low wall region adds +2 AP to both leg locations. When a Space Marine takes cover behind it, their leg armor increases from 10 to 12 until they move away.

## Key Features

- ✅ **Automatic**: Cover bonuses apply/remove on token movement
- ✅ **Hit Location Aware**: Different cover types protect different body parts
- ✅ **Easy GM Setup**: Point-and-click region drawing, dropdown configuration
- ✅ **Visible to Players**: Active Effects show in character sheet
- ✅ **Foundry Native**: Uses built-in region system
- ✅ **Testable**: Pure business logic, fully unit testable

## Document Structure

This folder contains detailed design documents for the cover regions system:

- **[design-overview.md](./design-overview.md)** - Architecture and design decisions
- **[technical-specification.md](./technical-specification.md)** - Detailed implementation specs
- **[user-guide.md](./user-guide.md)** - GM usage workflows and best practices
- **[advanced-features.md](./advanced-features.md)** - Future enhancements (directional cover, destruction, etc.)
- **[integration-notes.md](./integration-notes.md)** - Integration with existing systems
- **[open-questions.md](./open-questions.md)** - Design decisions to finalize

## Quick Start (When Implemented)

### For GMs

1. Open scene in Foundry VTT
2. Drawing Tools → Regions
3. Draw region around cover area
4. Add Behavior → "Deathwatch: Cover"
5. Select cover type (Low Wall, High Wall, etc.)
6. Done! Tokens automatically get bonuses when entering

### For Players

No action needed. When your token enters cover:
- Notification appears: "Character is now in cover (+2 AP: legs)"
- Active Effect appears on character sheet showing bonuses
- Armor values automatically update
- When you leave, bonuses automatically remove

## Example Cover Types

| Cover Type | Armor Bonus | Protected Locations | Example Terrain |
|------------|-------------|---------------------|-----------------|
| Low Wall | +2 AP | Legs only | Sandbags, barricades, underbrush |
| High Wall | +4 AP | Legs + Body | Building walls, stone barriers |
| Full Cover | +4 AP | All but head | Tree trunks, doorways, consoles |
| Reinforced | +8 AP | All but head | Bunkers, vehicle hulls, rockcrete |

## Design Philosophy

**Simplicity First**: Start with basic omnidirectional cover. Add complexity (directional cover, destruction, attack penalties) as optional enhancements later.

**Leverage Foundry**: Use native region system rather than custom token movement hooks. Less code to maintain, better performance, familiar GM workflow.

**Active Effects Over Custom Logic**: Armor bonuses via Active Effects integrate automatically with existing damage calculations. No changes needed to combat system.

**Hit Location Integration**: Cover system respects Deathwatch's detailed hit location rules. A low wall protects legs but not head/arms/body.

## Next Steps

1. **Review design documents** - Provide feedback on architecture and features
2. **Answer open questions** - Finalize design decisions in `open-questions.md`
3. **Refine specifications** - Iterate on technical details
4. **Implementation** - Once design is solid, create implementation plan

## Related Systems

- **Armor System** (`src/module/data/actor/*.mjs`) - Cover bonuses stack with worn armor
- **Hit Locations** (`combat.mjs`) - Cover protects specific body parts
- **Active Effects** (Foundry core) - Delivery mechanism for cover bonuses
- **Regions** (Foundry v13) - Spatial trigger system

## References

- Deathwatch Core Rulebook p. 246-247 (Cover rules)
- Foundry VTT Regions: https://foundryvtt.com/article/regions/
- Foundry VTT Active Effects: https://foundryvtt.com/article/active-effects/
