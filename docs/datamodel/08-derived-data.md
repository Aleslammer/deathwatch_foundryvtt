# Derived Data: Moving prepareData Logic into Models

## Overview

DataModels support their own `prepareDerivedData()` method, which Foundry calls during the data preparation lifecycle. Moving derived data logic into the models is a core part of this migration — each type's computed values belong with its data definition.

## What Moves Where

| Logic | From | To | Phase |
|-------|------|----|-------|
| Weapon upgrade modifiers | `item.mjs _applyWeaponUpgradeModifiers()` | `DeathwatchWeapon.prepareDerivedData()` | 3c |
| Ammunition modifiers | `item.mjs _applyAmmunitionModifiers()` | `DeathwatchWeapon.prepareDerivedData()` | 3c |
| Force weapon modifiers | `item.mjs _applyForceWeaponModifiers()` | `DeathwatchWeapon.prepareDerivedData()` | 3c |
| Talent compendiumId | `item.mjs prepareData()` | `DeathwatchTalent.prepareDerivedData()` | 3a |
| Talent effective cost | `item.mjs prepareData()` | `DeathwatchTalent.prepareDerivedData()` | 3a |
| Character skills/XP/modifiers/movement | `actor.mjs _prepareCharacterData()` | `DeathwatchCharacter.prepareDerivedData()` | 4 |
| Force weapon loop (actor-level) | `actor.mjs _prepareCharacterData()` | `DeathwatchCharacter.prepareDerivedData()` | 4 |
| NPC derived data | `actor.mjs _prepareNpcData()` | `DeathwatchNPC.prepareDerivedData()` | 4 |

## Access Patterns in DataModels

### Field Access

```javascript
// In DataModel prepareDerivedData():
this.dmg              // Direct field access (no .system prefix)
this.penetration      // Direct field access
this.modifiers        // Direct field access
```

### Parent Document Access

```javascript
this.parent           // The Item or Actor document
this.parent._id       // Document ID
this.parent.name      // Document name
this.parent.actor     // Owning actor (for items)
this.parent.items     // Item collection (for actors)
```

### Setting Derived Values

```javascript
// Derived values not in the schema can be set directly:
this.effectiveDamage = `${this.dmg} +3`;
this.effectiveRange = 70;

// Accessible externally as item.system.effectiveDamage, item.system.effectiveRange
```

## Item Models

### Weapon — DeathwatchWeapon.prepareDerivedData()

All three weapon prep methods move here. The logic is identical — only the access pattern changes (`this.dmg` instead of `this.system.dmg`, `this.parent.actor` instead of `this.actor`).

```javascript
prepareDerivedData() {
  const actor = this.parent?.actor;
  if (!actor) return;

  if (Array.isArray(this.attachedUpgrades)) {
    this._applyWeaponUpgradeModifiers(actor);
  }

  if (this.loadedAmmo) {
    this._applyAmmunitionModifiers(actor);
  }

  // Force weapon modifiers are applied from the character model's
  // prepareDerivedData() after psy rating is computed — not here.
  // See DeathwatchCharacter.prepareDerivedData() in 04-actor-models.md.
}

_applyWeaponUpgradeModifiers(actor) {
  const baseDmg = this.dmg || this.damage;
  const baseRange = parseInt(this.range) || 0;
  const baseWeight = parseFloat(this.wt) || 0;

  let damageOverride = null;
  let rangeAdditive = 0;
  let rangeMultiplier = 1;
  let weightAdditive = 0;
  let weightMultiplier = 1;

  for (const upgradeRef of this.attachedUpgrades) {
    const upgradeId = typeof upgradeRef === 'string' ? upgradeRef : upgradeRef.id;
    const upgrade = actor.items.get(upgradeId);

    if (upgrade && Array.isArray(upgrade.system.modifiers)) {
      for (const mod of upgrade.system.modifiers) {
        if (mod.enabled !== false) {
          if (mod.effectType === 'weapon-damage') {
            damageOverride = mod.modifier;
          } else if (mod.effectType === 'weapon-range') {
            const modStr = String(mod.modifier);
            if (modStr.startsWith('x')) {
              rangeMultiplier *= parseFloat(modStr.substring(1)) || 1;
            } else {
              rangeAdditive += parseInt(mod.modifier) || 0;
            }
          } else if (mod.effectType === 'weapon-weight') {
            const modStr = String(mod.modifier);
            if (modStr.startsWith('x')) {
              weightMultiplier *= parseFloat(modStr.substring(1)) || 1;
            } else {
              weightAdditive += parseFloat(mod.modifier) || 0;
            }
          }
        }
      }
    }
  }

  if (damageOverride && baseDmg) {
    this.effectiveDamage = damageOverride;
  }

  if (baseRange === 0) {
    this.effectiveRange = this.range;
  } else if (rangeAdditive !== 0 || rangeMultiplier !== 1) {
    this.effectiveRange = Math.floor((baseRange + rangeAdditive) * rangeMultiplier);
  } else {
    this.effectiveRange = baseRange;
  }

  if (baseWeight > 0 && (weightAdditive !== 0 || weightMultiplier !== 1)) {
    this.effectiveWeight = Math.max(0, (baseWeight + weightAdditive) * weightMultiplier);
  }
}

_applyAmmunitionModifiers(actor) {
  const ammo = actor.items.get(this.loadedAmmo);
  if (!ammo || !Array.isArray(ammo.system.modifiers)) return;

  const baseDmg = this.dmg || this.damage;
  const baseRof = this.rof;
  const basePen = parseInt(this.pen || this.penetration) || 0;
  const baseRange = parseInt(this.range) || 0;
  const weaponClass = (this.class || '').toLowerCase();

  if (!baseDmg && !baseRof) return;

  let damageModifier = 0;
  let rofOverride = null;
  let blastValue = null;
  let penOverride = null;
  let penModifier = 0;
  let rangeAdditive = 0;
  let rangeMultiplier = 1;
  let fellingValue = null;

  for (const mod of ammo.system.modifiers) {
    if (mod.enabled === false) continue;

    if (mod.effectType === 'weapon-damage') {
      if (mod.qualityException && this.attachedQualities?.includes(mod.qualityException)) continue;
      damageModifier += parseInt(mod.modifier) || 0;
    } else if (mod.effectType === 'weapon-rof') {
      const requiredClass = (mod.weaponClass || '').toLowerCase();
      if (!requiredClass || weaponClass.includes(requiredClass)) rofOverride = mod.modifier;
    } else if (mod.effectType === 'weapon-blast') {
      const requiredClass = (mod.weaponClass || '').toLowerCase();
      if (!requiredClass || weaponClass.includes(requiredClass)) blastValue = parseInt(mod.modifier) || 0;
    } else if (mod.effectType === 'weapon-felling') {
      fellingValue = parseInt(mod.modifier) || 0;
    } else if (mod.effectType === 'weapon-penetration') {
      penOverride = parseInt(mod.modifier) || 0;
    } else if (mod.effectType === 'weapon-penetration-modifier') {
      penModifier += parseInt(mod.modifier) || 0;
    } else if (mod.effectType === 'weapon-range') {
      const modStr = String(mod.modifier);
      if (modStr.startsWith('x')) {
        rangeMultiplier *= parseFloat(modStr.substring(1)) || 1;
      } else {
        rangeAdditive += parseInt(mod.modifier) || 0;
      }
    }
  }

  if (damageModifier !== 0 && baseDmg) {
    this.effectiveDamage = `${baseDmg} ${damageModifier >= 0 ? '+' : ''}${damageModifier}`;
  }
  if (rofOverride && baseRof) this.effectiveRof = rofOverride;
  if (blastValue !== null) this.effectiveBlast = blastValue;
  if (penOverride !== null) {
    this.effectivePenetration = Math.max(basePen, penOverride);
  } else if (penModifier !== 0) {
    this.effectivePenetration = Math.max(0, basePen + penModifier);
  }
  if (baseRange > 0 && (rangeAdditive !== 0 || rangeMultiplier !== 1)) {
    this.effectiveRange = Math.floor((baseRange + rangeAdditive) * rangeMultiplier);
  }
  if (fellingValue !== null) this.effectiveFelling = fellingValue;
}

/**
 * Called from DeathwatchCharacter.prepareDerivedData() after psy rating is computed.
 */
applyForceWeaponModifiers() {
  if (!this.attachedQualities?.includes('force')) return;

  const psyRating = this.parent?.actor?.system?.psyRating?.value || 0;
  if (psyRating <= 0) return;

  const baseDmg = this.effectiveDamage || this.dmg;
  const basePen = parseInt(this.effectivePenetration ?? this.penetration ?? 0);

  if (baseDmg) this.effectiveDamage = `${baseDmg} +${psyRating}`;
  this.effectivePenetration = basePen + psyRating;
}
```

**Key difference from current code:** `_applyForceWeaponModifiers()` is renamed to `applyForceWeaponModifiers()` (public) because it's called externally from the character model after psy rating computation. It is NOT called from the weapon's own `prepareDerivedData()` — the ordering dependency requires the character model to orchestrate it.

### Talent — DeathwatchTalent.prepareDerivedData()

```javascript
prepareDerivedData() {
  // Auto-populate compendiumId
  if (!this.compendiumId && this.parent?._id?.startsWith('tal')) {
    this.compendiumId = this.parent._id;
  }

  // Calculate effective cost
  const actor = this.parent?.actor;
  if (!actor) {
    this.effectiveCost = this.cost ?? 0;
    return;
  }

  const chapterId = actor.system.chapterId;
  if (!chapterId) {
    this.effectiveCost = this.cost ?? 0;
    return;
  }

  const chapter = actor.items.get(chapterId);
  if (!chapter?.system?.talentCosts) {
    this.effectiveCost = this.cost ?? 0;
    return;
  }

  const sourceId = this.compendiumId || this.parent._id;
  const chapterCost = chapter.system.talentCosts[sourceId];
  this.effectiveCost = chapterCost !== undefined ? chapterCost : (this.cost ?? 0);
}
```

## Actor Models

### Character — DeathwatchCharacter.prepareDerivedData()

The entire `_prepareCharacterData()` method moves here. The character model owns all character-specific derived data computation.

```javascript
prepareDerivedData() {
  const actor = this.parent;

  // Initialize defaults
  if (!this.fatePoints) this.fatePoints = { value: 0, max: 0 };
  if (this.renown === undefined) this.renown = 0;

  // Load skills dynamically from JSON
  this.skills = SkillLoader.loadSkills(this.skills);

  // Calculate rank and XP
  this.rank = XPCalculator.calculateRank(this.xp?.total || this.xp);
  const spentXP = XPCalculator.calculateSpentXP(actor);

  if (typeof this.xp === 'object') {
    this.xp.spent = spentXP;
    this.xp.available = (this.xp.total || XPCalculator.STARTING_XP) - spentXP;
  }

  // Collect and apply modifiers
  const allModifiers = ModifierCollector.collectAllModifiers(actor);
  ModifierCollector.applyCharacteristicModifiers(this.characteristics, allModifiers);

  if (this.skills) {
    ModifierCollector.applySkillModifiers(this.skills, allModifiers);
  }

  this.initiativeBonus = ModifierCollector.applyInitiativeModifiers(allModifiers);
  ModifierCollector.applyWoundModifiers(this.wounds, allModifiers);
  ModifierCollector.applyFatigueModifiers(this.fatigue, this.characteristics?.tg?.mod || 0);
  ModifierCollector.applyArmorModifiers(actor.items, allModifiers);
  ModifierCollector.applyPsyRatingModifiers(this.psyRating, allModifiers);

  // Apply force weapon modifiers AFTER psy rating is computed
  for (const item of actor.items) {
    if (item.type === 'weapon') {
      item.system.applyForceWeaponModifiers();
    }
  }

  // Calculate movement from Agility Bonus
  const agBonus = this.characteristics?.ag?.mod || 0;
  if (!this.movement) this.movement = {};
  ModifierCollector.applyMovementModifiers(this.movement, agBonus, allModifiers);
}
```

**Import requirements:** The character model needs imports for `ModifierCollector`, `XPCalculator`, `SkillLoader`.

### NPC — DeathwatchNPC.prepareDerivedData()

```javascript
prepareDerivedData() {
  this.xp = (this.cr * this.cr) * 100;
}
```

## Resulting item.mjs

After migration, `DeathwatchItem` becomes a thin shell:

```javascript
export class DeathwatchItem extends Item {
  prepareData() {
    super.prepareData();
    // All type-specific logic now lives in DataModel.prepareDerivedData()
  }

  getRollData() {
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);
    return rollData;
  }

  async roll() {
    // Unchanged
  }
}
```

## Resulting actor.mjs

After migration, `DeathwatchActor` keeps only type-agnostic concerns:

```javascript
export class DeathwatchActor extends ActorConditionsMixin(Actor) {
  prepareData() {
    super.prepareData();
    // DataModel.prepareDerivedData() called automatically by super
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (data.type === 'character') {
      this.updateSource({ 'prototypeToken.actorLink': true });
    }
  }

  getRollData() {
    const data = super.getRollData();
    this._getCharacterRollData(data);
    this._getNpcRollData(data);
    return data;
  }

  // getRollData helpers stay here — they format data for roll formulas,
  // which is a Document concern, not a DataModel concern.
  _getCharacterRollData(data) { /* unchanged */ }
  _getNpcRollData(data) { /* unchanged */ }
}
```

**Note:** `getRollData()` stays on the Document class. It formats data for Foundry's roll formula system, which is a Document-level concern. The DataModel computes the values; the Document exposes them to rolls.

## Test Impact

### Access Pattern Changes

Tests that directly call moved methods need updating:

```javascript
// Before: called on Item document
item._applyAmmunitionModifiers();
item._applyForceWeaponModifiers();

// After: called on DataModel (item.system)
item.system._applyAmmunitionModifiers(actor);
// Or triggered automatically via prepareData()
```

### Mock Changes

Tests that mock `this.system.dmg` continue to work — the DataModel IS `this.system`. The main change is that `prepareDerivedData()` is now called on the model, so test setup that triggers `prepareData()` will automatically invoke the model's derived data logic.

See `07-test-impact.md` for detailed test migration guidance.
