import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { DWConfig } from "../helpers/config.mjs";
import { CombatHelper } from "../helpers/combat.mjs";
import { ModifierHelper } from "../helpers/modifiers.mjs";
import { RollDialogBuilder } from "../helpers/roll-dialog-builder.mjs";
import { ChatMessageBuilder } from "../helpers/chat-message-builder.mjs";
import { ItemHandlers } from "../helpers/item-handlers.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DeathwatchActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["deathwatch", "sheet", "actor"],
      template: "systems/deathwatch/templates/actor/actor-sheet.html",
      width: 1000,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "characteristics" }]
    });
  }


  /**
   * Calculate skill total
   * @param {Object} skill The skill object
   * @param {Object} characteristics The actor's characteristics
   * @returns {number} The calculated skill total
   */
  static calculateSkillTotal(skill, characteristics) {
    const characteristic = characteristics[skill.characteristic];
    const baseCharValue = characteristic ? characteristic.value : 0;
    const effectiveChar = skill.trained ? baseCharValue : Math.floor(baseCharValue / 2);
    const skillBonus = skill.expert ? 20 : (skill.mastered ? 10 : 0);
    
    return effectiveChar + skillBonus + skill.modifier;
  }

  /** @override */
  get template() {
    return `systems/deathwatch/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Prepare modifiers
    context.modifiers = actorData.system.modifiers || [];

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.characteristics)) {
      v.label = game.i18n.localize(game.deathwatch.config.CharacteristicWords[k]) ?? k;
    }

    // Get chapter item if set
    if (context.system.chapterId) {
      context.chapterItem = this.actor.items.get(context.system.chapterId);
    }

    // Get specialty item if set
    if (context.system.specialtyId) {
      context.specialtyItem = this.actor.items.get(context.system.specialtyId);
    }

    // Get chapter skill cost overrides
    const chapterSkillCosts = {};
    if (context.chapterItem && context.chapterItem.system.skillCosts) {
      Object.assign(chapterSkillCosts, context.chapterItem.system.skillCosts);
    }

    // Handle skills - use live actor data which has modifierTotal calculated
    if (context.system.skills) {
      for (let [k, v] of Object.entries(context.system.skills)) {
        v.label = game.i18n.localize(game.deathwatch.config.Skills[k]) ?? k;
        const liveSkill = this.actor.system.skills[k];
        const baseSkillTotal = DeathwatchActorSheet.calculateSkillTotal(v, context.system.characteristics);
        const skillModTotal = liveSkill?.modifierTotal || 0;
        v.total = baseSkillTotal + skillModTotal;
        
        // Apply chapter skill cost overrides
        if (chapterSkillCosts[k]) {
          if (chapterSkillCosts[k].costTrain !== undefined) v.costTrain = chapterSkillCosts[k].costTrain;
          if (chapterSkillCosts[k].costMaster !== undefined) v.costMaster = chapterSkillCosts[k].costMaster;
          if (chapterSkillCosts[k].costExpert !== undefined) v.costExpert = chapterSkillCosts[k].costExpert;
        }
      }
    }

    // Add config to context for template access
    context.config = game.deathwatch.config;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} context The sheet context
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    const categories = ItemHandlers.processItems(context.items);
    Object.assign(context, categories);
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Select all text on focus for input fields
    html.find('input[type="text"], input[type="number"]').focus(function() {
      $(this).select();
    });

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Show armor history in chat
    html.find('.history-show').click(ev => {
      const itemId = $(ev.currentTarget).data('itemId');
      const history = this.actor.items.get(itemId);
      if (history) ChatMessageBuilder.createItemCard(history, this.actor);
    });

    // Show critical effect in chat
    html.find('.critical-show').click(ev => {
      const itemId = $(ev.currentTarget).data('itemId');
      const critical = this.actor.items.get(itemId);
      if (critical) ChatMessageBuilder.createItemCard(critical, this.actor);
    });

    // Show demeanour in chat
    html.find('.demeanour-show').click(ev => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const demeanour = this.actor.items.get(itemId);
      if (demeanour) ChatMessageBuilder.createItemCard(demeanour, this.actor);
    });

    // Show talent in chat
    html.find('.talent-show').click(ev => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const talent = this.actor.items.get(itemId);
      if (talent) ChatMessageBuilder.createItemCard(talent, this.actor);
    });

    // Show trait in chat
    html.find('.trait-show').click(ev => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const trait = this.actor.items.get(itemId);
      if (trait) ChatMessageBuilder.createItemCard(trait, this.actor);
    });

    // Remove armor history from armor
    html.find('.history-remove').click(async ev => {
      const historyId = $(ev.currentTarget).data('historyId');
      const armorId = $(ev.currentTarget).data('armorId');
      const armor = this.actor.items.get(armorId);
      
      if (!armor) return;
      
      const currentHistories = armor.system.attachedHistories || [];
      const updatedHistories = currentHistories.filter(id => id !== historyId);
      
      await armor.update({ "system.attachedHistories": updatedHistories });
      ui.notifications.info('Armor history removed.');
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Toggle Equip Item
    html.find('.item-equip').click(async ev => {
      ev.preventDefault();
      const li = $(ev.currentTarget).closest(".item");
      const item = this.actor.items.get(li.data("itemId"));
      await item.update({ "system.equipped": !item.system.equipped });
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Modifier management
    html.find('.modifier-create').click(ev => ModifierHelper.createModifier(this.actor));
    html.find('.modifier-edit').click(ev => {
      const modifierId = $(ev.currentTarget).closest('.modifier').data('modifierId');
      ModifierHelper.editModifierDialog(this.actor, modifierId);
    });
    html.find('.modifier-delete').click(ev => {
      const modifierId = $(ev.currentTarget).closest('.modifier').data('modifierId');
      ModifierHelper.deleteModifier(this.actor, modifierId);
    });
    html.find('.modifier-toggle').click(ev => {
      const modifierId = $(ev.currentTarget).closest('.modifier').data('modifierId');
      ModifierHelper.toggleModifierEnabled(this.actor, modifierId);
    });

    // Skill checkbox cascade logic
    html.find('input[type="checkbox"][name*="system.skills."][name*=".trained"]').change(ev => {
      const match = ev.target.name.match(/system\.skills\.(\w+)\.trained/);
      if (!match) return;
      const skillKey = match[1];
      if (!ev.target.checked) {
        html.find(`input[name="system.skills.${skillKey}.mastered"]`).prop('checked', false);
        html.find(`input[name="system.skills.${skillKey}.expert"]`).prop('checked', false);
      }
    });

    html.find('input[type="checkbox"][name*="system.skills."][name*=".mastered"]').change(ev => {
      const match = ev.target.name.match(/system\.skills\.(\w+)\.mastered/);
      if (!match) return;
      const skillKey = match[1];
      if (!ev.target.checked) {
        html.find(`input[name="system.skills.${skillKey}.expert"]`).prop('checked', false);
      }
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Rollable weapon images for attacks
    html.find('.item-image.rollable').click(this._onWeaponAttack.bind(this));

    // Weapon attack and damage buttons
    html.find('.weapon-attack-btn').click(ev => {
      const itemId = $(ev.currentTarget).data('itemId');
      const weapon = this.actor.items.get(itemId);
      if (weapon) CombatHelper.weaponAttackDialog(this.actor, weapon);
    });
    html.find('.weapon-damage-btn').click(ev => {
      const itemId = $(ev.currentTarget).data('itemId');
      const weapon = this.actor.items.get(itemId);
      if (weapon) CombatHelper.weaponDamageRoll(this.actor, weapon);
    });
    html.find('.weapon-unjam-btn').click(ev => {
      const itemId = $(ev.currentTarget).data('itemId');
      const weapon = this.actor.items.get(itemId);
      if (weapon) CombatHelper.clearJam(this.actor, weapon);
    });

    // Remove ammunition from weapon
    html.find('.ammo-remove').click(async ev => {
      const ammoId = $(ev.currentTarget).data('ammoId');
      const weaponId = $(ev.currentTarget).data('weaponId');
      const weapon = this.actor.items.get(weaponId);
      const ammo = this.actor.items.get(ammoId);
      
      if (!weapon || !ammo) return;
      
      await weapon.update({ "system.loadedAmmo": null });
      ui.notifications.info('Ammunition removed.');
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Drop handler for armor histories on armor
    html.find('.inventory .items-list li.item').each((i, li) => {
      li.addEventListener('drop', this._onDropItemOnItem.bind(this), false);
      li.addEventListener('dragover', ev => ev.preventDefault(), false);
    });

    // Drop handler for chapter
    html.find('.chapter-drop-zone').each((i, el) => {
      el.addEventListener('drop', this._onDropChapter.bind(this), false);
      el.addEventListener('dragover', ev => ev.preventDefault(), false);
    });

    // Remove chapter
    html.find('.chapter-remove').click(async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const chapterId = this.actor.system.chapterId;
      if (chapterId) {
        const chapter = this.actor.items.get(chapterId);
        if (chapter) await chapter.delete();
      }
      await this.actor.update({ "system.chapterId": "" });
      ui.notifications.info('Chapter removed.');
    });

    // Drop handler for specialty
    html.find('.specialty-drop-zone').each((i, el) => {
      el.addEventListener('drop', this._onDropSpecialty.bind(this), false);
      el.addEventListener('dragover', ev => ev.preventDefault(), false);
    });

    // Remove specialty
    html.find('.specialty-remove').click(async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const specialtyId = this.actor.system.specialtyId;
      if (specialtyId) {
        const specialty = this.actor.items.get(specialtyId);
        if (specialty) await specialty.delete();
      }
      await this.actor.update({ "system.specialtyId": "" });
      ui.notifications.info('Specialty removed.');
    });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
      // Handle characteristic rolls.
      else if (dataset.rollType == 'characteristic') {
        return this._onCharacteristicRoll(dataset);
      }
      // Handle skill rolls.
      else if (dataset.rollType == 'skill') {
        return this._onSkillRoll(dataset);
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[Characteristic] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Handle characteristic rolls with modifier dialog.
   * @param {Object} dataset The dataset from the clicked element
   * @private
   */
  async _onCharacteristicRoll(dataset) {
    const rollData = this.actor.getRollData();
    const characteristic = this.actor.system.characteristics[dataset.characteristic];
    const label = `[Characteristic] ${dataset.label}`;

    return new Dialog({
      title: `Roll ${dataset.label}`,
      content: RollDialogBuilder.buildModifierDialog(),
      render: (html) => RollDialogBuilder.attachModifierInputHandler(html),
      buttons: {
        roll: {
          label: "Roll",
          class: "dialog-button roll",
          callback: async (html) => {
            const modifiers = RollDialogBuilder.parseModifiers(html);
            const target = characteristic.value + modifiers.difficultyModifier + modifiers.additionalModifier;
            
            const roll = new Roll('1d100', rollData);
            await roll.evaluate();
            
            const modifierParts = RollDialogBuilder.buildModifierParts(characteristic.value, dataset.label, modifiers);
            const flavor = RollDialogBuilder.buildResultFlavor(label, target, roll, modifierParts);
            
            ChatMessageBuilder.createRollMessage(roll, this.actor, flavor);
          }
        },
        cancel: {
          label: "Cancel",
          class: "dialog-button cancel"
        }
      },
      default: "roll"
    }).render(true);
  }
  /**
   * Handle skill rolls with modifier dialog.
   * @param {Object} dataset The dataset from the clicked element
   * @private
   */
  async _onSkillRoll(dataset) {
    const skill = this.actor.system.skills[dataset.skill];
    const label = `[Skill] ${dataset.label}`;

    if (!skill) {
      ui.notifications.warn(`Skill ${dataset.skill} not found`);
      return;
    }

    if (!skill.isBasic && !skill.trained) {
      ui.notifications.warn(`${dataset.label || dataset.skill} is an advanced skill and must be trained to use.`);
      return;
    }

    const characteristic = this.actor.system.characteristics[skill.characteristic];
    const baseCharValue = characteristic ? characteristic.value : 0;
    const effectiveChar = skill.trained ? baseCharValue : Math.floor(baseCharValue / 2);
    const skillBonus = skill.expert ? 20 : (skill.mastered ? 10 : 0);
    const skillTotal = effectiveChar + skillBonus + (skill.modifier || 0) + (skill.modifierTotal || 0);

    return new Dialog({
      title: `Roll ${dataset.label}`,
      content: RollDialogBuilder.buildModifierDialog(),
      render: (html) => RollDialogBuilder.attachModifierInputHandler(html),
      buttons: {
        roll: {
          label: "Roll",
          class: "dialog-button roll",
          callback: async (html) => {
            const modifiers = RollDialogBuilder.parseModifiers(html);
            const target = skillTotal + modifiers.difficultyModifier + modifiers.additionalModifier;
            
            const roll = new Roll('1d100', this.actor.getRollData());
            await roll.evaluate();
            
            const modifierParts = RollDialogBuilder.buildModifierParts(skillTotal, dataset.label, modifiers);
            const flavor = RollDialogBuilder.buildResultFlavor(label, target, roll, modifierParts);
            
            ChatMessageBuilder.createRollMessage(roll, this.actor, flavor);
          }
        },
        cancel: {
          label: "Cancel",
          class: "dialog-button cancel"
        }
      },
      default: "roll"
    }).render(true);
  }

  /**
   * Handle weapon attack rolls.
   * @param {Event} event The originating click event
   * @private
   */
  async _onWeaponAttack(event) {
    event.preventDefault();
    const itemId = $(event.currentTarget).data('itemId');
    const weapon = this.actor.items.get(itemId);
    
    if (!weapon) return;

    const weaponData = weapon.system;
    const bsChar = this.actor.system.characteristics.bs;
    const bsValue = bsChar?.value || 0;

    // Create attack dialog
    const content = `
      <div class="form-group">
        <label>Attack Type:</label>
        <select id="attack-type" name="attackType">
          <option value="standard">Standard Attack (BS: ${bsValue})</option>
          <option value="aimed">Aimed Shot (+10)</option>
          <option value="called">Called Shot (-20)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Range Modifier:</label>
        <input type="number" id="range-mod" name="rangeMod" value="0" />
      </div>
    `;

    new Dialog({
      title: `Attack with ${weapon.name}`,
      content: content,
      buttons: {
        attack: {
          label: "Attack",
          callback: async (html) => {
            const attackType = html.find('#attack-type').val();
            const rangeMod = parseInt(html.find('#range-mod').val()) || 0;
            
            let attackMod = 0;
            let modifierParts = [];
            
            modifierParts.push(`${bsValue} Base BS`);
            
            if (attackType === 'aimed') {
              attackMod = 10;
              modifierParts.push('+10 Aimed Shot');
            }
            if (attackType === 'called') {
              attackMod = -20;
              modifierParts.push('-20 Called Shot');
            }
            
            if (rangeMod !== 0) {
              modifierParts.push(`${rangeMod >= 0 ? '+' : ''}${rangeMod} Range`);
            }
            
            const totalMod = attackMod + rangeMod;
            let rollFormula = '1d100';
            if (totalMod !== 0) {
              rollFormula += ` ${totalMod >= 0 ? '+' : ''}${totalMod}`;
            }
            
            const roll = new Roll(rollFormula);
            await roll.evaluate();
            
            const label = `[Attack] ${weapon.name}`;
            roll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              flavor: modifierParts.length > 0 ? `${label}<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>` : label,
              rollMode: game.settings.get('core', 'rollMode')
            });
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "attack"
    }).render(true);
  }

  /**
   * Handle dropping an item on another item (e.g., armor history on armor, ammo on weapon)
   * @param {Event} event The drop event
   * @private
   */
  async _onDropItemOnItem(event) {
    event.preventDefault();
    event.stopPropagation();

    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data.type !== 'Item') return;

    const droppedItem = await Item.implementation.fromDropData(data);
    if (!droppedItem) return;

    // Handle armor history drops
    if (droppedItem.type === 'armor-history') {
      let historyItem = droppedItem;
      if (!droppedItem.parent) {
        const imported = await Item.create(droppedItem.toObject(), { parent: this.actor });
        historyItem = imported;
      }

      let targetItemId = $(event.currentTarget).data('itemId');
      let targetItem = this.actor.items.get(targetItemId);
      
      if (!targetItem || targetItem.type !== 'armor') {
        const armorItems = this.actor.items.filter(i => i.type === 'armor');
        if (armorItems.length === 1) targetItem = armorItems[0];
        else {
          ui.notifications.warn(armorItems.length > 1 ? 'Multiple armor items found. Please drop directly on the armor item.' : 'No armor items found.');
          return;
        }
      }

      const currentHistories = targetItem.system.attachedHistories || [];
      const existingHistory = currentHistories.find(histId => {
        const existing = this.actor.items.get(histId);
        if (!existing) return false;
        const sourceId = historyItem.flags?.core?.sourceId || historyItem.name;
        const existingSourceId = existing.flags?.core?.sourceId || existing.name;
        return sourceId === existingSourceId;
      });
      
      if (existingHistory) {
        ui.notifications.warn(`${historyItem.name} is already attached to ${targetItem.name}.`);
        return;
      }
      
      let maxHistories = targetItem.name.toLowerCase().includes('artificer') ? 2 : 1;
      if (currentHistories.length >= maxHistories) {
        ui.notifications.warn(`${targetItem.name} can only have ${maxHistories} armor ${maxHistories === 1 ? 'history' : 'histories'}.`);
        return;
      }
      
      await targetItem.update({ "system.attachedHistories": [...currentHistories, historyItem.id] });
      ui.notifications.info(`${historyItem.name} attached to ${targetItem.name}.`);
    }
    // Handle ammunition drops
    else if (droppedItem.type === 'ammunition') {
      let targetItemId = $(event.currentTarget).data('itemId');
      let targetItem = this.actor.items.get(targetItemId);
      
      if (!targetItem || targetItem.type !== 'weapon') {
        ui.notifications.warn('Ammunition can only be attached to weapons.');
        return;
      }

      if (targetItem.system.loadedAmmo) {
        ui.notifications.warn(`${targetItem.name} already has ammunition loaded.`);
        return;
      }

      // Ensure the ammo is owned by this actor
      let ammoItem = droppedItem;
      if (!droppedItem.parent || droppedItem.parent.id !== this.actor.id) {
        ui.notifications.warn('Ammunition must be in your inventory to load it.');
        return;
      }

      await targetItem.update({ "system.loadedAmmo": ammoItem.id });
      ui.notifications.info(`${ammoItem.name} loaded into ${targetItem.name}.`);
    }
  }

  /**
   * Handle dropping a chapter item
   * @param {Event} event The drop event
   * @private
   */
  async _onDropChapter(event) {
    event.preventDefault();
    event.stopPropagation();

    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data.type !== 'Item') return;

    const droppedItem = await Item.implementation.fromDropData(data);
    if (!droppedItem || droppedItem.type !== 'chapter') {
      ui.notifications.warn('Only chapter items can be dropped here.');
      return;
    }

    if (this.actor.system.chapterId) {
      const existingChapter = this.actor.items.get(this.actor.system.chapterId);
      if (existingChapter) {
        await existingChapter.delete();
      }
    }

    const chapterItem = await Item.create(droppedItem.toObject(), { parent: this.actor });
    await this.actor.update({ "system.chapterId": chapterItem.id });
    ui.notifications.info(`Chapter set to ${chapterItem.name}.`);
  }

  /**
   * Handle dropping a specialty item
   * @param {Event} event The drop event
   * @private
   */
  async _onDropSpecialty(event) {
    event.preventDefault();
    event.stopPropagation();

    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data.type !== 'Item') return;

    const droppedItem = await Item.implementation.fromDropData(data);
    if (!droppedItem || droppedItem.type !== 'specialty') {
      ui.notifications.warn('Only specialty items can be dropped here.');
      return;
    }

    if (this.actor.system.specialtyId) {
      const existingSpecialty = this.actor.items.get(this.actor.system.specialtyId);
      if (existingSpecialty) {
        await existingSpecialty.delete();
      }
    }

    const specialtyItem = await Item.create(droppedItem.toObject(), { parent: this.actor });
    await this.actor.update({ "system.specialtyId": specialtyItem.id });
    ui.notifications.info(`Specialty set to ${specialtyItem.name}.`);
  }

}
