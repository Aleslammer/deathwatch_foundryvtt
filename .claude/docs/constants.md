# Constants and Magic Numbers

**Location**: `src/module/helpers/constants/` (organized by domain)

All system-wide numeric constants are organized into domain-specific files with JSDoc comments referencing the source rulebook page. Use these constants instead of hardcoded "magic numbers".

---

## Constant Files

- `combat-constants.mjs` — Combat modifiers, hit locations, ranges, enemy classifications
- `characteristic-constants.mjs` — Character stats, rolls, XP, wounds, initiative
- `psychic-constants.mjs` — Psychic power levels
- `modifier-constants.mjs` — Modifier and effect type system
- `squad-constants.mjs` — Squad mode, cohesion, hordes
- `insanity-constants.mjs` — Insanity Points thresholds, battle traumas
- `corruption-constants.mjs` — Corruption Points thresholds, primarch's curses
- `index.mjs` — Re-exports all constants for convenience

---

## Key Constants

- `CHARACTERISTIC_CONSTANTS.BONUS_DIVISOR` — Characteristic bonus = value / 10 (Core p. 31)
- `ROLL_CONSTANTS.DEGREES_DIVISOR` — Degrees of Success/Failure = difference / 10 (Core p. 27)
- `HIT_LOCATION_RANGES` — Hit location determination ranges (Core p. 243)
- `INITIATIVE_CONSTANTS` — Initiative formula and decimal precision
- `WOUNDS_CONSTANTS` — Wounds calculation multipliers (SB + 2×TB, Core p. 214)
- `HORDE_CONSTANTS` — Horde damage bonus calculation (magnitude / 10, Core p. 358)
- `RANGE_MODIFIERS` — Point Blank (+30), Short (+10), Normal (0), Long (-10), Extreme (-30)
- `COMBAT_PENALTIES` — Called Shot (-20), Running Target (-20)
- `COHESION` — Cohesion rank thresholds, command skill bonuses, damage thresholds

---

## Usage Examples

```javascript
// Import from index.mjs (re-exports all)
import {
  CHARACTERISTIC_CONSTANTS,
  ROLL_CONSTANTS
} from "../helpers/constants/index.mjs";

// Or import from specific domain files
import {
  RANGE_MODIFIERS,
  HIT_LOCATIONS
} from "../helpers/constants/combat-constants.mjs";
import { CHARACTERISTICS } from "../helpers/constants/characteristic-constants.mjs";

// ✅ Good: Uses constant with documented source
const bonus = Math.floor(
  characteristic / CHARACTERISTIC_CONSTANTS.BONUS_DIVISOR
);
const dos = Math.floor((target - roll) / ROLL_CONSTANTS.DEGREES_DIVISOR);

// ❌ Bad: Magic number without explanation
const bonus = Math.floor(characteristic / 10);
const dos = Math.floor((target - roll) / 10);
```

---

## Adding New Constants

1. Identify the domain (combat, character, psychic, etc.)
2. Add constant to appropriate file in `src/module/helpers/constants/`
3. Include JSDoc comment with rulebook page reference
4. Export from `index.mjs` if needed for cross-domain usage

**Example**:

```javascript
/**
 * Weapon jam chance modifier for Full Auto fire.
 * @constant {number}
 * @source Core Rulebook p. 256
 */
export const FULL_AUTO_JAM_MODIFIER = -20;
```

---

_The sacred numbers are documented. No magic shall remain hidden._ ⚙️
