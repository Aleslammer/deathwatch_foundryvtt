import DeathwatchItemBase from './base-item.mjs';

const { fields } = foundry.data;

/**
 * DataModel for weapon items.
 * @extends {DeathwatchItemBase}
 */
export default class DeathwatchWeapon extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });
    schema.damage = new fields.StringField({ initial: "1d10", blank: true });
    schema.dmgType = new fields.StringField({ initial: "", blank: true });
    schema.weaponType = new fields.StringField({ initial: "", blank: true });
    schema.range = new fields.StringField({ initial: "", blank: true });
    schema.rof = new fields.StringField({ initial: "S/-/-", blank: true });
    schema.dmg = new fields.StringField({ initial: "1d10", blank: true });
    schema.penetration = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.class = new fields.StringField({ initial: "", blank: true });
    schema.clip = new fields.StringField({ initial: "", blank: true });
    schema.reload = new fields.StringField({ initial: "", blank: true });
    schema.jammed = new fields.BooleanField({ initial: false });
    schema.loadedAmmo = new fields.StringField({ initial: null, nullable: true });
    schema.attachedQualities = new fields.ArrayField(new fields.ObjectField(), { initial: [] });
    schema.attachedUpgrades = new fields.ArrayField(new fields.ObjectField(), { initial: [] });
    schema.doublesStrengthBonus = new fields.BooleanField({ initial: false });
    schema.wt = new fields.NumberField({ initial: 0, min: 0 });
    // Cybernetic weapon source (e.g., servo-arm uses cybernetic's Str, not character's)
    schema.cyberneticSource = new fields.StringField({ initial: "", blank: true });
    return schema;
  }

  static migrateData(source) {
    if (!source.clip && source.capacity?.max) {
      source.clip = String(source.capacity.max);
    }
    return super.migrateData(source);
  }

  prepareDerivedData() {
    const actor = this.parent?.actor;
    if (!actor) return;

    if (Array.isArray(this.attachedUpgrades)) {
      this._applyWeaponUpgradeModifiers();
    }

    if (this.loadedAmmo) {
      this._applyAmmunitionModifiers();
    }
  }

  static CHAR_KEYS = ['ws', 'bs', 'str', 'tg', 'ag', 'int', 'per', 'wil', 'fs'];

  _resolveCharBonus(formula) {
    const actor = this.parent?.actor;
    if (!actor) return parseInt(formula) || 0;

    const match = formula.match(/^([a-z]+)b(x(\d+))?([+-]\d+)?$/);
    if (!match) return parseInt(formula) || 0;

    const charKey = match[1];
    if (!DeathwatchWeapon.CHAR_KEYS.includes(charKey)) return parseInt(formula) || 0;

    const bonus = actor.system?.characteristics?.[charKey]?.mod || 0;
    const multiplier = match[3] ? parseInt(match[3]) : 1;
    const offset = match[4] ? parseInt(match[4]) : 0;
    return (bonus * multiplier) + offset;
  }

  _applyOwnModifiers() {
    if (!Array.isArray(this.modifiers)) return;

    const weaponClass = (this.class || '').toLowerCase();

    for (const mod of this.modifiers) {
      if (mod.enabled === false) continue;
      if (mod.weaponClass && weaponClass !== mod.weaponClass.toLowerCase()) continue;

      if (mod.effectType === 'weapon-damage') {
        const dmgMod = this._resolveCharBonus(mod.modifier);
        const baseDmg = this.effectiveDamage || this.dmg;
        if (baseDmg && dmgMod !== 0) {
          this.effectiveDamage = `${baseDmg} ${dmgMod >= 0 ? '+' : ''}${dmgMod}`;
        }
      } else if (mod.effectType === 'weapon-rof') {
        this.effectiveRof = mod.modifier;
      } else if (mod.effectType === 'weapon-blast') {
        this.effectiveBlast = parseInt(mod.modifier) || 0;
      } else if (mod.effectType === 'weapon-penetration') {
        const basePen = parseInt(this.effectivePenetration ?? this.penetration ?? 0);
        this.effectivePenetration = Math.max(basePen, parseInt(mod.modifier) || 0);
      }
    }
  }

  /**
   * Called from actor _prepareCharacterData() after psy rating is computed.
   */
  applyForceWeaponModifiers() {
    if (!this.attachedQualities?.some(q => (typeof q === 'string' ? q : q.id) === 'force')) return;

    const psyRating = this.parent?.actor?.system?.psyRating?.value || 0;
    if (psyRating <= 0) return;

    const baseDmg = this.effectiveDamage || this.dmg;
    const basePen = parseInt(this.effectivePenetration ?? this.penetration ?? this.pen ?? 0);

    if (baseDmg) {
      this.effectiveDamage = `${baseDmg} +${psyRating}`;
    }
    this.effectivePenetration = basePen + psyRating;
  }

  _applyWeaponUpgradeModifiers() {
    const actor = this.parent?.actor;
    if (!actor) return;

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
            if (mod.effectType === 'weapon-damage-override') {
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
    } else if (baseWeight > 0) {
      this.effectiveWeight = baseWeight;
    } else {
      delete this.effectiveWeight;
    }
  }

  _applyAmmunitionModifiers() {
    const actor = this.parent?.actor;
    if (!actor) return;

    const ammo = actor.items.get(this.loadedAmmo);
    if (!ammo || !Array.isArray(ammo.system.modifiers)) {
      return;
    }

    const baseDmg = this.dmg || this.damage;
    const baseRof = this.rof;
    const basePen = parseInt(this.pen || this.penetration) || 0;
    const baseRange = parseInt(this.range) || 0;
    const weaponClass = (this.class || '').toLowerCase();

    if (!baseDmg && !baseRof) {
      return;
    }

    let damageOverride = null;
    let damageModifier = 0;
    let rofOverride = null;
    let blastValue = null;
    let penOverride = null;
    let penModifier = 0;
    let rangeAdditive = 0;
    let rangeMultiplier = 1;
    let fellingValue = null;

    for (const mod of ammo.system.modifiers) {
      if (mod.enabled !== false) {
        if (mod.effectType === 'weapon-damage-override') {
          damageOverride = mod.modifier;
        } else if (mod.effectType === 'weapon-damage') {
          if (mod.qualityException && this.attachedQualities?.some(q => (typeof q === 'string' ? q : q.id) === mod.qualityException)) {
            continue;
          }
          damageModifier += parseInt(mod.modifier) || 0;
        } else if (mod.effectType === 'weapon-rof') {
          const requiredClass = (mod.weaponClass || '').toLowerCase();
          if (!requiredClass || weaponClass.includes(requiredClass)) {
            rofOverride = mod.modifier;
          }
        } else if (mod.effectType === 'weapon-blast') {
          const requiredClass = (mod.weaponClass || '').toLowerCase();
          if (!requiredClass || weaponClass.includes(requiredClass)) {
            blastValue = parseInt(mod.modifier) || 0;
          }
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
    }

    // Apply damage override first (replaces base damage completely)
    if (damageOverride && String(damageOverride).trim()) {
      this.effectiveDamage = damageOverride;
    }

    // Then apply additive damage modifier on top of override or base
    if (damageModifier !== 0 && (this.effectiveDamage || baseDmg)) {
      const base = this.effectiveDamage || baseDmg;
      this.effectiveDamage = `${base} ${damageModifier >= 0 ? '+' : ''}${damageModifier}`;
    }

    if (rofOverride && baseRof) {
      this.effectiveRof = rofOverride;
    }

    if (blastValue !== null) {
      this.effectiveBlast = blastValue;
    }

    if (penOverride !== null) {
      this.effectivePenetration = Math.max(basePen, penOverride);
    } else if (penModifier !== 0) {
      this.effectivePenetration = Math.max(0, basePen + penModifier);
    }

    if (baseRange > 0 && (rangeAdditive !== 0 || rangeMultiplier !== 1)) {
      this.effectiveRange = Math.floor((baseRange + rangeAdditive) * rangeMultiplier);
    }

    if (fellingValue !== null) {
      this.effectiveFelling = fellingValue;
    }
  }
}
