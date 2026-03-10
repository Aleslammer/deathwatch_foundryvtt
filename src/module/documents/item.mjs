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
    const baseRange = parseInt(this.system.range) || 0;
    const baseWeight = parseFloat(this.system.wt) || 0;
    
    if (baseRange === 0) {
      this.system.effectiveRange = this.system.range;
    } else {
      let rangeAdditive = 0;
      let rangeMultiplier = 1;
      
      for (const upgradeRef of this.system.attachedUpgrades) {
        const upgradeId = typeof upgradeRef === 'string' ? upgradeRef : upgradeRef.id;
        const upgrade = this.actor.items.get(upgradeId);
        
        if (upgrade && Array.isArray(upgrade.system.modifiers)) {
          for (const mod of upgrade.system.modifiers) {
            if (mod.enabled !== false && mod.effectType === 'weapon-range') {
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
      
      this.system.effectiveRange = Math.floor((baseRange + rangeAdditive) * rangeMultiplier);
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
      return;
    }
    
    const baseDmg = this.system.dmg || this.system.damage;
    const baseRof = this.system.rof;
    const weaponClass = (this.system.class || '').toLowerCase();
    
    if (!baseDmg && !baseRof) {
      delete this.system.effectiveDamage;
      delete this.system.effectiveRof;
      delete this.system.effectiveBlast;
      return;
    }
    
    let damageModifier = 0;
    let rofOverride = null;
    let blastValue = null;
    
    for (const mod of ammo.system.modifiers) {
      if (mod.enabled !== false) {
        if (mod.effectType === 'weapon-damage') {
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
