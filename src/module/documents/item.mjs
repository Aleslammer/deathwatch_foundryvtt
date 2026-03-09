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
  }
  
  _applyWeaponUpgradeModifiers() {
    const baseRange = parseInt(this.system.range) || 0;
    
    if (baseRange === 0) {
      this.system.effectiveRange = this.system.range;
      return;
    }
    
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
