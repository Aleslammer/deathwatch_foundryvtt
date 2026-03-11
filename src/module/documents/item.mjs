/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class DeathwatchItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();
    
    // Auto-populate compendiumId for talents if not set
    if (this.type === 'talent' && !this.system.compendiumId && this._id?.startsWith('tal')) {
      this.system.compendiumId = this._id;
    }
    
    // Calculate effective cost for talents with chapter overrides
    if (this.type === 'talent' && this.actor) {
      const chapterId = this.actor.system.chapterId;
      if (chapterId) {
        const chapter = this.actor.items.get(chapterId);
        if (chapter?.system?.talentCosts) {
          const sourceId = this.system.compendiumId || this._id;
          const chapterCost = chapter.system.talentCosts[sourceId];
          if (chapterCost !== undefined) {
            this.system.effectiveCost = chapterCost;
          } else {
            this.system.effectiveCost = this.system.cost ?? 0;
          }
        } else {
          this.system.effectiveCost = this.system.cost ?? 0;
        }
      } else {
        this.system.effectiveCost = this.system.cost ?? 0;
      }
    }
    
    // Apply weapon upgrade modifiers to weapon stats
    if (this.type === 'weapon' && this.actor && Array.isArray(this.system.attachedUpgrades)) {
      this._applyWeaponUpgradeModifiers();
    }
    
    // Apply ammunition modifiers to weapon stats
    if (this.type === 'weapon' && this.actor && this.system.loadedAmmo) {
      this._applyAmmunitionModifiers();
    }
  }
  
  _applyWeaponUpgradeModifiers() {
    const baseDmg = this.system.dmg || this.system.damage;
    const baseRange = parseInt(this.system.range) || 0;
    const baseWeight = parseFloat(this.system.wt) || 0;
    
    let damageOverride = null;
    let rangeAdditive = 0;
    let rangeMultiplier = 1;
    
    for (const upgradeRef of this.system.attachedUpgrades) {
      const upgradeId = typeof upgradeRef === 'string' ? upgradeRef : upgradeRef.id;
      const upgrade = this.actor.items.get(upgradeId);
      
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
            }
          }
        }
      }
    }
    
    if (damageOverride && baseDmg) {
      this.system.effectiveDamage = damageOverride;
    } else {
      delete this.system.effectiveDamage;
    }
    
    if (baseRange === 0) {
      this.system.effectiveRange = this.system.range;
    } else if (rangeAdditive !== 0 || rangeMultiplier !== 1) {
      this.system.effectiveRange = Math.floor((baseRange + rangeAdditive) * rangeMultiplier);
    } else {
      delete this.system.effectiveRange;
    }
    
    // Apply weight modifiers
    if (baseWeight > 0) {
      let weightAdditive = 0;
      let weightMultiplier = 1;
      
      for (const upgradeRef of this.system.attachedUpgrades) {
        const upgradeId = typeof upgradeRef === 'string' ? upgradeRef : upgradeRef.id;
        const upgrade = this.actor.items.get(upgradeId);
        
        if (upgrade && Array.isArray(upgrade.system.modifiers)) {
          for (const mod of upgrade.system.modifiers) {
            if (mod.enabled !== false && mod.effectType === 'weapon-weight') {
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
      
      this.system.effectiveWeight = Math.max(0, (baseWeight + weightAdditive) * weightMultiplier);
    }
  }
  
  _applyAmmunitionModifiers() {
    if (!this.actor) return;
    
    const ammo = this.actor.items.get(this.system.loadedAmmo);
    if (!ammo || !Array.isArray(ammo.system.modifiers)) {
      delete this.system.effectiveDamage;
      delete this.system.effectiveRof;
      delete this.system.effectiveBlast;
      delete this.system.effectivePenetration;
      delete this.system.effectiveRange;
      return;
    }
    
    const baseDmg = this.system.dmg || this.system.damage;
    const baseRof = this.system.rof;
    const basePen = parseInt(this.system.pen || this.system.penetration) || 0;
    const baseRange = parseInt(this.system.range) || 0;
    const weaponClass = (this.system.class || '').toLowerCase();
    
    if (!baseDmg && !baseRof) {
      delete this.system.effectiveDamage;
      delete this.system.effectiveRof;
      delete this.system.effectiveBlast;
      delete this.system.effectivePenetration;
      delete this.system.effectiveRange;
      return;
    }
    
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
        if (mod.effectType === 'weapon-damage') {
          const modValue = parseInt(mod.modifier) || 0;
          // Check qualityException - skip if weapon has the quality
          if (mod.qualityException && this.system.attachedQualities?.includes(mod.qualityException)) {
            continue;
          }
          damageModifier += modValue;
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
    
    if (damageModifier !== 0 && baseDmg) {
      this.system.effectiveDamage = `${baseDmg} ${damageModifier >= 0 ? '+' : ''}${damageModifier}`;
    } else {
      delete this.system.effectiveDamage;
    }
    
    if (rofOverride && baseRof) {
      this.system.effectiveRof = rofOverride;
    } else {
      delete this.system.effectiveRof;
    }
    
    if (blastValue !== null) {
      this.system.effectiveBlast = blastValue;
    } else {
      delete this.system.effectiveBlast;
    }
    
    if (penOverride !== null) {
      this.system.effectivePenetration = Math.max(basePen, penOverride);
    } else if (penModifier !== 0) {
      this.system.effectivePenetration = Math.max(0, basePen + penModifier);
    } else {
      delete this.system.effectivePenetration;
    }
    
    if (baseRange > 0 && (rangeAdditive !== 0 || rangeMultiplier !== 1)) {
      this.system.effectiveRange = Math.floor((baseRange + rangeAdditive) * rangeMultiplier);
    } else {
      delete this.system.effectiveRange;
    }
    
    if (fellingValue !== null) {
      this.system.effectiveFelling = fellingValue;
    } else {
      delete this.system.effectiveFelling;
    }
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
