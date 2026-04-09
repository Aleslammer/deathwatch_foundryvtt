# Technical Specification

## File Structure

```
src/module/
├── helpers/
│   ├── constants/
│   │   ├── cover-constants.mjs          [NEW]
│   │   └── index.mjs                    [UPDATE] - export cover constants
│   └── combat/
│       └── cover-helper.mjs             [NEW]
├── regions/
│   └── cover-behavior.mjs               [NEW]
└── init/
    └── config.mjs                        [UPDATE] - register behavior

tests/
└── combat/
    └── cover-helper.test.mjs            [NEW]
```

## 1. Cover Constants

**File**: `src/module/helpers/constants/cover-constants.mjs`

```javascript
/**
 * Cover type definitions with armor bonuses by hit location.
 * Based on Deathwatch Core Rulebook p. 246-247.
 * 
 * @constant {Object} COVER_TYPES
 */
export const COVER_TYPES = {
  /**
   * Low obstacles that protect legs only.
   * Examples: sandbags, low walls, underbrush, fallen logs.
   * @type {Object}
   */
  LOW_WALL: {
    key: 'low-wall',
    name: 'Low Wall',
    armorBonus: 2,
    locations: ['rightLeg', 'leftLeg'],
    description: 'Protects legs only (sandbags, barricades)',
    icon: 'icons/svg/shield.svg'
  },

  /**
   * Waist-high barriers that protect legs and torso.
   * Examples: building walls, stone barriers, vehicle side.
   * @type {Object}
   */
  HIGH_WALL: {
    key: 'high-wall',
    name: 'High Wall',
    armorBonus: 4,
    locations: ['rightLeg', 'leftLeg', 'body'],
    description: 'Protects legs and body (stone walls, barriers)',
    icon: 'icons/svg/shield.svg'
  },

  /**
   * Full-height cover that protects all but head.
   * Examples: tree trunks, doorframes, consoles.
   * @type {Object}
   */
  FULL_COVER: {
    key: 'full-cover',
    name: 'Full Cover',
    armorBonus: 4,
    locations: ['rightLeg', 'leftLeg', 'body', 'rightArm', 'leftArm'],
    description: 'Protects all but head (tree trunks, doorways)',
    icon: 'icons/svg/shield.svg'
  },

  /**
   * Heavy fortifications with thick armor.
   * Examples: bunkers, vehicle hulls, rockcrete walls.
   * @type {Object}
   */
  REINFORCED: {
    key: 'reinforced',
    name: 'Reinforced Cover',
    armorBonus: 8,
    locations: ['rightLeg', 'leftLeg', 'body', 'rightArm', 'leftArm'],
    description: 'Heavy fortifications (bunkers, vehicle hulls)',
    icon: 'icons/svg/shield.svg'
  }
};

/**
 * Valid hit location keys for cover protection.
 * Must match actor data model location keys.
 * @constant {string[]}
 */
export const VALID_HIT_LOCATIONS = [
  'head',
  'body',
  'rightArm',
  'leftArm',
  'rightLeg',
  'leftLeg'
];

/**
 * Get cover type definition by key.
 * 
 * @param {string} key - Cover type key (e.g., 'low-wall')
 * @returns {Object|null} Cover type definition or null if not found
 */
export function getCoverType(key) {
  return Object.values(COVER_TYPES).find(type => type.key === key) || null;
}

/**
 * Validate that a cover type has all required fields.
 * Used for testing and future extensibility.
 * 
 * @param {Object} coverType - Cover type definition to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateCoverType(coverType) {
  const required = ['key', 'name', 'armorBonus', 'locations', 'description'];
  
  for (const field of required) {
    if (!(field in coverType)) {
      throw new Error(`Cover type missing required field: ${field}`);
    }
  }
  
  if (!Array.isArray(coverType.locations) || coverType.locations.length === 0) {
    throw new Error('Cover type locations must be non-empty array');
  }
  
  for (const loc of coverType.locations) {
    if (!VALID_HIT_LOCATIONS.includes(loc)) {
      throw new Error(`Invalid hit location: ${loc}`);
    }
  }
  
  if (typeof coverType.armorBonus !== 'number' || coverType.armorBonus <= 0) {
    throw new Error('Cover type armorBonus must be positive number');
  }
  
  return true;
}
```

## 2. Cover Helper

**File**: `src/module/helpers/combat/cover-helper.mjs`

```javascript
import { COVER_TYPES, getCoverType, VALID_HIT_LOCATIONS } from '../constants/cover-constants.mjs';
import { FoundryAdapter } from '../foundry-adapter.mjs';
import { Logger } from '../logger.mjs';
import { Validation } from '../validation.mjs';

/**
 * Helper class for managing cover bonuses from regions.
 * Handles applying/removing Active Effects when tokens enter/exit cover.
 */
export class CoverHelper {
  /**
   * Apply cover effect to an actor when entering a cover region.
   * Creates an Active Effect that increases armor values for protected locations.
   * 
   * @param {Actor} actor - The actor entering cover
   * @param {Object} coverData - Cover configuration from region
   * @param {string} coverData.coverType - Key from COVER_TYPES (e.g., 'low-wall')
   * @param {string} coverData.regionId - Unique region ID
   * @returns {Promise<void>}
   */
  static async applyCover(actor, coverData) {
    try {
      // Validate inputs
      Validation.requireDocument(actor, 'Actor', 'CoverHelper.applyCover');
      
      if (!coverData || typeof coverData !== 'object') {
        throw new Error('coverData must be an object');
      }
      
      if (!coverData.coverType || typeof coverData.coverType !== 'string') {
        throw new Error('coverData.coverType is required');
      }
      
      if (!coverData.regionId || typeof coverData.regionId !== 'string') {
        throw new Error('coverData.regionId is required');
      }

      // Get cover type definition
      const coverType = getCoverType(coverData.coverType);
      
      if (!coverType) {
        Logger.warn('COVER', `Unknown cover type: ${coverData.coverType}`);
        FoundryAdapter.showNotification(
          `Unknown cover type: ${coverData.coverType}`,
          'warning'
        );
        return;
      }

      // Check if actor already has effect from this region
      const existingEffect = actor.effects.find(e => 
        e.flags?.deathwatch?.coverRegionId === coverData.regionId
      );
      
      if (existingEffect) {
        Logger.debug('COVER', `Actor ${actor.name} already has effect from region ${coverData.regionId}`);
        return;
      }

      // Build Active Effect changes for each protected location
      const changes = coverType.locations.map(location => ({
        key: `system.armor.${location}`,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: coverType.armorBonus,
        priority: 20  // Apply after base armor but before character-specific modifiers
      }));

      // Create Active Effect
      const effectData = {
        name: `Cover: ${coverType.name}`,
        icon: coverType.icon,
        changes: changes,
        flags: {
          deathwatch: {
            coverRegionId: coverData.regionId,
            coverType: coverType.key,
            appliedAt: Date.now()
          }
        },
        duration: {
          // No expiration - effect persists until explicitly removed
        }
      };

      await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
      
      // Show notification
      const locationNames = this._formatLocationNames(coverType.locations);
      FoundryAdapter.showNotification(
        `${actor.name} is now in cover (+${coverType.armorBonus} AP: ${locationNames})`,
        'info'
      );
      
      Logger.info('COVER', `Applied ${coverType.name} to ${actor.name}`, {
        regionId: coverData.regionId,
        armorBonus: coverType.armorBonus,
        locations: coverType.locations
      });
      
    } catch (error) {
      Logger.error('COVER', 'Failed to apply cover', error);
      FoundryAdapter.showNotification(
        `Failed to apply cover: ${error.message}`,
        'error'
      );
    }
  }

  /**
   * Remove cover effect when leaving a cover region.
   * Finds and deletes the Active Effect associated with the region.
   * 
   * @param {Actor} actor - The actor leaving cover
   * @param {string} regionId - The region ID being exited
   * @returns {Promise<void>}
   */
  static async removeCover(actor, regionId) {
    try {
      // Validate inputs
      Validation.requireDocument(actor, 'Actor', 'CoverHelper.removeCover');
      
      if (!regionId || typeof regionId !== 'string') {
        throw new Error('regionId is required');
      }

      // Find effect by region ID
      const effect = actor.effects.find(e => 
        e.flags?.deathwatch?.coverRegionId === regionId
      );
      
      if (!effect) {
        Logger.debug('COVER', `No cover effect found for region ${regionId} on actor ${actor.name}`);
        return;
      }

      const coverType = effect.flags?.deathwatch?.coverType;
      
      await effect.delete();
      
      // Show notification
      FoundryAdapter.showNotification(
        `${actor.name} has left cover`,
        'info'
      );
      
      Logger.info('COVER', `Removed cover from ${actor.name}`, {
        regionId,
        coverType
      });
      
    } catch (error) {
      Logger.error('COVER', 'Failed to remove cover', error);
      FoundryAdapter.showNotification(
        `Failed to remove cover: ${error.message}`,
        'error'
      );
    }
  }

  /**
   * Get all cover types available for region configuration.
   * 
   * @returns {Object} Map of cover type keys to definitions
   */
  static getCoverTypes() {
    return COVER_TYPES;
  }

  /**
   * Check if an actor has any cover effects active.
   * 
   * @param {Actor} actor - The actor to check
   * @returns {boolean} True if actor has at least one cover effect
   */
  static hasCover(actor) {
    return actor.effects.some(e => e.flags?.deathwatch?.coverRegionId);
  }

  /**
   * Get all active cover effects on an actor.
   * 
   * @param {Actor} actor - The actor to query
   * @returns {Array<ActiveEffect>} Array of cover effects
   */
  static getCoverEffects(actor) {
    return actor.effects.filter(e => e.flags?.deathwatch?.coverRegionId);
  }

  /**
   * Format location names for display in notifications.
   * 
   * @param {string[]} locations - Hit location keys
   * @returns {string} Formatted string (e.g., "legs, body, arms")
   * @private
   */
  static _formatLocationNames(locations) {
    const groups = {
      legs: locations.filter(l => l.includes('Leg')).length > 0,
      arms: locations.filter(l => l.includes('Arm')).length > 0,
      body: locations.includes('body'),
      head: locations.includes('head')
    };
    
    const parts = [];
    if (groups.legs) parts.push('legs');
    if (groups.body) parts.push('body');
    if (groups.arms) parts.push('arms');
    if (groups.head) parts.push('head');
    
    return parts.join(', ');
  }
}
```

## 3. Region Behavior

**File**: `src/module/regions/cover-behavior.mjs`

```javascript
import { CoverHelper } from '../helpers/combat/cover-helper.mjs';
import { COVER_TYPES } from '../helpers/constants/cover-constants.mjs';
import { Logger } from '../helpers/logger.mjs';

/**
 * Custom region behavior for applying cover bonuses to tokens.
 * Automatically applies/removes Active Effects when tokens enter/exit the region.
 * 
 * @extends RegionBehavior
 */
export class CoverRegionBehavior extends RegionBehavior {
  /**
   * Define the schema for this behavior's configuration.
   * Creates the form fields shown to GMs when configuring the region.
   * 
   * @returns {Object} Schema definition
   */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    // Build choices object for dropdown
    const coverChoices = {};
    for (const [key, type] of Object.entries(COVER_TYPES)) {
      coverChoices[type.key] = `${type.name} (+${type.armorBonus} AP)`;
    }
    
    return {
      coverType: new fields.StringField({
        required: true,
        initial: 'low-wall',
        label: 'DEATHWATCH.CoverType',
        hint: 'DEATHWATCH.CoverTypeHint',
        choices: coverChoices
      })
    };
  }

  /**
   * Called when a token enters this region.
   * Applies cover bonus to the token's actor.
   * 
   * @param {Object} event - Region event data
   * @param {Token} event.data.token - The token entering the region
   * @returns {Promise<void>}
   * @private
   */
  async _handleTokenEnter(event) {
    const token = event.data.token;
    const actor = token?.actor;
    
    if (!actor) {
      Logger.debug('COVER', 'Token has no actor, skipping cover application');
      return;
    }

    Logger.debug('COVER', `Token ${token.name} entered cover region ${this.parent.id}`);

    await CoverHelper.applyCover(actor, {
      coverType: this.coverType,
      regionId: this.parent.id
    });
  }

  /**
   * Called when a token exits this region.
   * Removes cover bonus from the token's actor.
   * 
   * @param {Object} event - Region event data
   * @param {Token} event.data.token - The token exiting the region
   * @returns {Promise<void>}
   * @private
   */
  async _handleTokenExit(event) {
    const token = event.data.token;
    const actor = token?.actor;
    
    if (!actor) {
      Logger.debug('COVER', 'Token has no actor, skipping cover removal');
      return;
    }

    Logger.debug('COVER', `Token ${token.name} exited cover region ${this.parent.id}`);

    await CoverHelper.removeCover(actor, this.parent.id);
  }
}
```

## 4. Configuration Registration

**File**: `src/module/init/config.mjs` (update)

```javascript
import { CoverRegionBehavior } from '../regions/cover-behavior.mjs';

export class ConfigRegistrar {
  static configure() {
    // ... existing configuration ...

    // Register custom region behaviors
    CONFIG.RegionBehavior.dataModels['deathwatch.cover'] = CoverRegionBehavior;
    
    Logger.info('CONFIG', 'Region behaviors registered');
  }
}
```

## 5. Localization Strings

**File**: `src/lang/en.json` (update)

```json
{
  "DEATHWATCH.CoverType": "Cover Type",
  "DEATHWATCH.CoverTypeHint": "Type of cover this region provides (affects armor bonus and protected locations)",
  "DEATHWATCH.CoverApplied": "{actor} is now in cover (+{bonus} AP: {locations})",
  "DEATHWATCH.CoverRemoved": "{actor} has left cover",
  "DEATHWATCH.CoverInvalidType": "Unknown cover type: {type}"
}
```

## 6. Unit Tests

**File**: `tests/combat/cover-helper.test.mjs`

```javascript
import { CoverHelper } from '../../src/module/helpers/combat/cover-helper.mjs';
import { COVER_TYPES, getCoverType, validateCoverType } from '../../src/module/helpers/constants/cover-constants.mjs';

describe('CoverHelper', () => {
  describe('getCoverTypes', () => {
    it('returns all cover type definitions', () => {
      const types = CoverHelper.getCoverTypes();
      
      expect(types).toBeDefined();
      expect(types.LOW_WALL).toBeDefined();
      expect(types.HIGH_WALL).toBeDefined();
      expect(types.FULL_COVER).toBeDefined();
      expect(types.REINFORCED).toBeDefined();
    });
  });

  describe('applyCover', () => {
    let mockActor;
    
    beforeEach(() => {
      mockActor = createMockActor({
        name: 'Test Marine',
        effects: []
      });
    });

    it('creates Active Effect with correct armor bonuses', async () => {
      await CoverHelper.applyCover(mockActor, {
        coverType: 'low-wall',
        regionId: 'region123'
      });
      
      expect(mockActor.createEmbeddedDocuments).toHaveBeenCalledWith(
        'ActiveEffect',
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Cover: Low Wall',
            changes: expect.arrayContaining([
              expect.objectContaining({
                key: 'system.armor.rightLeg',
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: 2
              }),
              expect.objectContaining({
                key: 'system.armor.leftLeg',
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: 2
              })
            ])
          })
        ])
      );
    });

    it('stores region ID in effect flags', async () => {
      await CoverHelper.applyCover(mockActor, {
        coverType: 'high-wall',
        regionId: 'region456'
      });
      
      const effectData = mockActor.createEmbeddedDocuments.mock.calls[0][1][0];
      expect(effectData.flags.deathwatch.coverRegionId).toBe('region456');
      expect(effectData.flags.deathwatch.coverType).toBe('high-wall');
    });

    it('prevents duplicate effects from same region', async () => {
      // Add existing effect
      mockActor.effects.push({
        name: 'Cover: Low Wall',
        flags: {
          deathwatch: { coverRegionId: 'region123' }
        }
      });
      
      await CoverHelper.applyCover(mockActor, {
        coverType: 'low-wall',
        regionId: 'region123'
      });
      
      expect(mockActor.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it('allows effects from different regions', async () => {
      // Add existing effect from different region
      mockActor.effects.push({
        name: 'Cover: Low Wall',
        flags: {
          deathwatch: { coverRegionId: 'region123' }
        }
      });
      
      await CoverHelper.applyCover(mockActor, {
        coverType: 'high-wall',
        regionId: 'region456'
      });
      
      expect(mockActor.createEmbeddedDocuments).toHaveBeenCalled();
    });

    it('handles unknown cover type gracefully', async () => {
      await CoverHelper.applyCover(mockActor, {
        coverType: 'invalid-type',
        regionId: 'region123'
      });
      
      expect(mockActor.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it('throws error for missing actor', async () => {
      await expect(
        CoverHelper.applyCover(null, {
          coverType: 'low-wall',
          regionId: 'region123'
        })
      ).rejects.toThrow();
    });
  });

  describe('removeCover', () => {
    let mockActor;
    let mockEffect;
    
    beforeEach(() => {
      mockEffect = {
        id: 'effect123',
        name: 'Cover: Low Wall',
        flags: {
          deathwatch: {
            coverRegionId: 'region123',
            coverType: 'low-wall'
          }
        },
        delete: jest.fn().mockResolvedValue(true)
      };
      
      mockActor = createMockActor({
        name: 'Test Marine',
        effects: [mockEffect]
      });
    });

    it('deletes effect by region ID', async () => {
      await CoverHelper.removeCover(mockActor, 'region123');
      
      expect(mockEffect.delete).toHaveBeenCalled();
    });

    it('handles missing effect gracefully', async () => {
      await CoverHelper.removeCover(mockActor, 'nonexistent-region');
      
      expect(mockEffect.delete).not.toHaveBeenCalled();
    });

    it('throws error for missing actor', async () => {
      await expect(
        CoverHelper.removeCover(null, 'region123')
      ).rejects.toThrow();
    });
  });

  describe('hasCover', () => {
    it('returns true when actor has cover effect', () => {
      const mockActor = createMockActor({
        effects: [{
          flags: { deathwatch: { coverRegionId: 'region123' } }
        }]
      });
      
      expect(CoverHelper.hasCover(mockActor)).toBe(true);
    });

    it('returns false when actor has no cover effect', () => {
      const mockActor = createMockActor({ effects: [] });
      
      expect(CoverHelper.hasCover(mockActor)).toBe(false);
    });
  });

  describe('getCoverEffects', () => {
    it('returns only cover effects', () => {
      const coverEffect = {
        name: 'Cover: Low Wall',
        flags: { deathwatch: { coverRegionId: 'region123' } }
      };
      const otherEffect = {
        name: 'Rage',
        flags: {}
      };
      
      const mockActor = createMockActor({
        effects: [coverEffect, otherEffect]
      });
      
      const result = CoverHelper.getCoverEffects(mockActor);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(coverEffect);
    });
  });
});

describe('Cover Constants', () => {
  describe('getCoverType', () => {
    it('returns cover type by key', () => {
      const type = getCoverType('low-wall');
      
      expect(type).toBeDefined();
      expect(type.name).toBe('Low Wall');
      expect(type.armorBonus).toBe(2);
    });

    it('returns null for unknown key', () => {
      const type = getCoverType('invalid-key');
      
      expect(type).toBeNull();
    });
  });

  describe('validateCoverType', () => {
    it('accepts valid cover type', () => {
      expect(() => {
        validateCoverType(COVER_TYPES.LOW_WALL);
      }).not.toThrow();
    });

    it('rejects cover type missing required fields', () => {
      expect(() => {
        validateCoverType({ key: 'test' });
      }).toThrow(/missing required field/);
    });

    it('rejects cover type with invalid locations', () => {
      expect(() => {
        validateCoverType({
          key: 'test',
          name: 'Test',
          armorBonus: 2,
          locations: ['invalid_location'],
          description: 'Test'
        });
      }).toThrow(/Invalid hit location/);
    });

    it('rejects cover type with invalid armor bonus', () => {
      expect(() => {
        validateCoverType({
          key: 'test',
          name: 'Test',
          armorBonus: -5,
          locations: ['body'],
          description: 'Test'
        });
      }).toThrow(/armorBonus must be positive number/);
    });
  });
});
```

## Constants Export

**File**: `src/module/helpers/constants/index.mjs` (update)

```javascript
// ... existing exports ...

export * from './cover-constants.mjs';
```

## Implementation Checklist

- [ ] Create `cover-constants.mjs` with cover type definitions
- [ ] Create `cover-helper.mjs` with business logic
- [ ] Create `cover-behavior.mjs` region behavior class
- [ ] Update `config.mjs` to register behavior
- [ ] Update `constants/index.mjs` to export cover constants
- [ ] Add localization strings to `en.json`
- [ ] Create unit tests for `CoverHelper`
- [ ] Create unit tests for cover constants validation
- [ ] Manual test: token enter/exit region
- [ ] Manual test: combat damage with cover
- [ ] Manual test: overlapping regions
- [ ] Manual test: character sheet displays effects correctly
- [ ] Update CLAUDE.md with cover system documentation
