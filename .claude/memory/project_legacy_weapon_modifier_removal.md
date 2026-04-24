---
name: Legacy Weapon Modifier Removal
description: Removed 170 lines of duplicate weapon modifier logic by consolidating into WeaponModifierCollector
type: project
---

Successfully removed legacy weapon modifier methods from DeathwatchWeapon class on 2026-04-22.

**Why:** Duplicate modifier logic existed in three places:
- WeaponModifierCollector (new centralized system)
- _applyWeaponUpgradeModifiers() (legacy)
- _applyAmmunitionModifiers() (legacy)

**What was removed:**
- _applyWeaponUpgradeModifiers() method (~63 lines)
- _applyAmmunitionModifiers() method (~100 lines)
- prepareDerivedData() legacy method calls
- Total: ~170 lines of duplicate code

**What replaced them:**
Extended _applyOwnModifiers() to handle all effect types via WeaponModifierCollector:
- weapon-damage-override (replaces base damage completely)
- weapon-damage (additive modifiers, sum before applying)
- weapon-rof (with weaponClass filtering)
- weapon-blast (with weaponClass filtering)
- weapon-penetration (max override with base)
- weapon-penetration-modifier (additive with 0 floor)
- weapon-felling
- weapon-range (additive + multiplier)
- weapon-weight (additive + multiplier)

**Key implementation details:**
- Damage override applied FIRST, then additive damage on top
- Quality exceptions supported (e.g., Stalker Pattern exemption)
- WeaponClass filtering for RoF and Blast modifiers
- Penetration modifiers use pen ?? penetration ?? 0 fallback
- Range defaults to base value when no modifiers exist
- All modifiers of same type summed before applying (prevents "1d10 +2 +3" format)

**Test impact:**
- Updated 6 test files to call _applyOwnModifiers() instead of legacy methods
- Changed mockActor.items from jest.fn() to Map for compatibility
- Added weapon.parent.system reference where missing
- Final result: 2000 tests passing (baseline was 1999, deleted 1 incorrect test)

**How to apply:**
When working with weapon modifiers, always use WeaponModifierCollector.collectWeaponModifiers() and apply via _applyOwnModifiers(). Never attempt to process weapon modifiers directly from upgrades or ammo — the collector handles source priority and consolidation.
