import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { DWConfig } from "../helpers/config.mjs";
import { CombatHelper } from "../helpers/combat/combat.mjs";
import { PsychicCombatHelper } from "../helpers/combat/psychic-combat.mjs";
import { ModifierHelper } from "../helpers/character/modifiers.mjs";
import { RollDialogBuilder } from "../helpers/ui/roll-dialog-builder.mjs";
import { ChatMessageBuilder } from "../helpers/ui/chat-message-builder.mjs";
import { ItemHandlers } from "../helpers/ui/item-handlers.mjs";
import { ModeHelper } from "../helpers/mode-helper.mjs";
import { CohesionPanel } from "../ui/cohesion-panel.mjs";
import { ErrorHandler } from "../helpers/error-handler.mjs";
import { Validation } from "../helpers/validation.mjs";
import { Sanitizer } from "../helpers/sanitizer.mjs";
import { CharacterDataPreparer } from "./shared/data-preparers/character-data-preparer.mjs";
import { NPCDataPreparer } from "./shared/data-preparers/npc-data-preparer.mjs";
import { EnemyDataPreparer } from "./shared/data-preparers/enemy-data-preparer.mjs";
import { ItemListPreparer } from "./shared/data-preparers/item-list-preparer.mjs";
import { CharacteristicHandlers } from "./shared/handlers/characteristic-handlers.mjs";
import { SkillHandlers } from "./shared/handlers/skill-handlers.mjs";
import { SheetHandlers } from "./shared/handlers/sheet-handlers.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DeathwatchActorSheet extends foundry.appv1.sheets.ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["deathwatch", "sheet", "actor"],
      template: "systems/deathwatch/templates/actor/actor-character-sheet.html",
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
    // Retrieve the data structure from the base sheet
    const context = super.getData();

    // Use a safe clone of the actor data for further operations
    const actorData = this.actor.toObject(false);

    // Use live actor system data to preserve derived DataModel properties
    // (toObject() strips prepareDerivedData() values like characteristic.mod, movement, etc.)
    context.system = { ...this.actor.system };
    context.flags = actorData.flags;

    // Prepare type-specific data using data preparers
    if (actorData.type === 'character') {
      CharacterDataPreparer.prepare(context, this.actor);
      ItemListPreparer.prepare(context, this.actor);
    } else if (actorData.type === 'npc') {
      NPCDataPreparer.prepare(context, this.actor);
      ItemListPreparer.prepare(context, this.actor);
    } else if (actorData.type === 'enemy' || actorData.type === 'horde') {
      EnemyDataPreparer.prepare(context, this.actor);
      ItemListPreparer.prepare(context, this.actor);
    }

    // Add roll data for TinyMCE editors
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Prepare modifiers
    context.modifiers = actorData.system.modifiers || [];

    // Prepare status effects
    context.statusEffects = CONFIG.statusEffects.map(effect => ({
      ...effect,
      active: this.actor.hasCondition?.(effect.id) || false
    }));

    return context;
  }


  /* -------------------------------------------- */

  /** @override */
  /* istanbul ignore next */
  async _render(force, options = {}) {
    // Store scroll position before render
    if (this.element.length) {
      const skillsContainer = this.element.find('.tab.characteristics > div > div[style*="overflow-y"]');
      if (skillsContainer.length) {
        this._skillsScrollTop = skillsContainer[0].scrollTop;
      }
    }
    
    await super._render(force, options);
    
    // Restore scroll position after render
    if (this._skillsScrollTop !== undefined) {
      const skillsContainer = this.element.find('.tab.characteristics > div > div[style*="overflow-y"]');
      if (skillsContainer.length) {
        skillsContainer[0].scrollTop = this._skillsScrollTop;
      }
    }
  }

  /** @override */
  /* istanbul ignore next */
  activateListeners(html) {
    super.activateListeners(html);

    // Attach sheet-specific handlers (input focus, status effects, collapsible sections)
    SheetHandlers.attach(html, this.actor);

    // Attach skill handlers (checkbox cascade)
    SkillHandlers.attach(html, this.actor);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const itemId = li.data("itemId");
      const item = Validation.requireDocument(this.actor.items.get(itemId), 'Item', 'Edit Item');
      item.sheet.render(true);
    }, 'Edit Item'));

    // Show armor history in chat
    html.find('.history-show').click(ErrorHandler.wrap(async (ev) => {
      const itemId = $(ev.currentTarget).data('itemId');
      const history = Validation.requireDocument(this.actor.items.get(itemId), 'Armor History', 'Show in Chat');
      await ChatMessageBuilder.createItemCard(history, this.actor);
    }, 'Show Armor History'));

    // Show critical effect in chat
    html.find('.critical-show').click(ErrorHandler.wrap(async (ev) => {
      const itemId = $(ev.currentTarget).data('itemId');
      const critical = Validation.requireDocument(this.actor.items.get(itemId), 'Critical Effect', 'Show in Chat');
      await ChatMessageBuilder.createItemCard(critical, this.actor);
    }, 'Show Critical Effect'));

    // Show demeanour in chat
    html.find('.demeanour-show').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const demeanour = Validation.requireDocument(this.actor.items.get(itemId), 'Demeanour', 'Show in Chat');
      await ChatMessageBuilder.createItemCard(demeanour, this.actor);
    }, 'Show Demeanour'));

    // Show talent in chat
    html.find('.talent-show').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const talent = Validation.requireDocument(this.actor.items.get(itemId), 'Talent', 'Show in Chat');
      await ChatMessageBuilder.createItemCard(talent, this.actor);
    }, 'Show Talent'));

    // Show trait in chat
    html.find('.trait-show').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const trait = Validation.requireDocument(this.actor.items.get(itemId), 'Trait', 'Show in Chat');
      await ChatMessageBuilder.createItemCard(trait, this.actor);
    }, 'Show Trait'));

    // Show implant in chat
    html.find('.implant-show').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const implant = Validation.requireDocument(this.actor.items.get(itemId), 'Implant', 'Show in Chat');
      await ChatMessageBuilder.createItemCard(implant, this.actor);
    }, 'Show Implant'));

    // Show psychic power in chat
    html.find('.psychic-power-show').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const power = Validation.requireDocument(this.actor.items.get(itemId), 'Psychic Power', 'Show in Chat');
      await ChatMessageBuilder.createItemCard(power, this.actor);
    }, 'Show Psychic Power'));

    // Use psychic power (Focus Power Test)
    html.find('.psychic-power-use').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const power = Validation.requireDocument(this.actor.items.get(itemId), 'Psychic Power', 'Use Power');
      await PsychicCombatHelper.focusPowerDialog(this.actor, power);
    }, 'Use Psychic Power'));

    // Show special ability in chat (with mode activation message support)
    html.find('.special-ability-show').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const ability = Validation.requireDocument(this.actor.items.get(itemId), 'Special Ability', 'Show in Chat');

      const sys = ability.system;
      if (sys.effect && sys.modeRequirement) {
        const msg = ModeHelper.buildAbilityActivationMessage(
          this.actor.name, ability.name, sys.modeRequirement,
          sys.effect, sys.improvements || [], this.actor.system.rank || 1
        );
        if (msg) {
          await ChatMessage.create({ content: msg, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
          return;
        }
      }
      await ChatMessageBuilder.createItemCard(ability, this.actor);
    }, 'Show Special Ability'));

    // Activate Squad Mode ability
    html.find('.squad-ability-activate').click(ErrorHandler.wrap(async (ev) => {
      ev.stopPropagation();
      const itemId = $(ev.currentTarget).data('itemId');
      const ability = Validation.requireDocument(this.actor.items.get(itemId), 'Squad Ability', 'Activate');
      await CohesionPanel.activateSquadAbility(this.actor, ability);
    }, 'Activate Squad Ability'));

    // Remove armor history from armor
    html.find('.history-remove').click(ErrorHandler.wrap(async (ev) => {
      const historyId = $(ev.currentTarget).data('historyId');
      const armorId = $(ev.currentTarget).data('armorId');
      const armor = Validation.requireDocument(this.actor.items.get(armorId), 'Armor', 'Remove History');

      const currentHistories = armor.system.attachedHistories || [];
      const updatedHistories = currentHistories.filter(id => id !== historyId);

      await armor.update({ "system.attachedHistories": updatedHistories });
      ui.notifications.info('Armor history removed.');
    }, 'Remove Armor History'));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Toggle Equip Item
    html.find('.item-equip').click(ErrorHandler.wrap(async (ev) => {
      ev.preventDefault();
      const li = $(ev.currentTarget).closest(".item");
      const itemId = li.data("itemId");
      const item = Validation.requireDocument(this.actor.items.get(itemId), 'Item', 'Toggle Equip');
      await item.update({ "system.equipped": !item.system.equipped });
    }, 'Toggle Equip'));

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ErrorHandler.wrap(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const itemId = li.data("itemId");
      const item = Validation.requireDocument(this.actor.items.get(itemId), 'Item', 'Delete');
      await item.delete();
      li.slideUp(200, () => this.render(false));
    }, 'Delete Item'));

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Modifier management
    html.find('.modifier-create').click(ErrorHandler.wrap(async (ev) => {
      await ModifierHelper.createModifier(this.actor);
    }, 'Create Modifier'));
    html.find('.modifier-edit').click(ErrorHandler.wrap(async (ev) => {
      const modifierId = $(ev.currentTarget).closest('.modifier').data('modifierId');
      if (modifierId === undefined) throw new Error('Modifier ID not found');
      await ModifierHelper.editModifierDialog(this.actor, modifierId);
    }, 'Edit Modifier'));
    html.find('.modifier-delete').click(ErrorHandler.wrap(async (ev) => {
      const modifierId = $(ev.currentTarget).closest('.modifier').data('modifierId');
      if (modifierId === undefined) throw new Error('Modifier ID not found');
      await ModifierHelper.deleteModifier(this.actor, modifierId);
    }, 'Delete Modifier'));
    html.find('.modifier-toggle').click(ErrorHandler.wrap(async (ev) => {
      const modifierId = $(ev.currentTarget).closest('.modifier').data('modifierId');
      if (modifierId === undefined) throw new Error('Modifier ID not found');
      await ModifierHelper.toggleModifierEnabled(this.actor, modifierId);
    }, 'Toggle Modifier'));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Rollable weapon images for attacks
    html.find('.item-image.rollable').click(this._onWeaponAttack.bind(this));

    // Weapon attack and damage buttons
    html.find('.weapon-attack-btn').click(ErrorHandler.wrap(async (ev) => {
      const itemId = $(ev.currentTarget).data('itemId');
      const weapon = Validation.requireDocument(this.actor.items.get(itemId), 'Weapon', 'Attack');
      await CombatHelper.weaponAttackDialog(this.actor, weapon);
    }, 'Weapon Attack'));
    html.find('.weapon-damage-btn').click(ErrorHandler.wrap(async (ev) => {
      const itemId = $(ev.currentTarget).data('itemId');
      const weapon = Validation.requireDocument(this.actor.items.get(itemId), 'Weapon', 'Roll Damage');
      await CombatHelper.weaponDamageRoll(this.actor, weapon);
    }, 'Weapon Damage'));
    html.find('.weapon-unjam-btn').click(ErrorHandler.wrap(async (ev) => {
      const itemId = $(ev.currentTarget).data('itemId');
      const weapon = Validation.requireDocument(this.actor.items.get(itemId), 'Weapon', 'Clear Jam');
      await CombatHelper.clearJam(this.actor, weapon);
    }, 'Clear Jam'));

    // Remove ammunition from weapon
    html.find('.ammo-remove').click(ErrorHandler.wrap(async (ev) => {
      const ammoId = $(ev.currentTarget).data('ammoId');
      const weaponId = $(ev.currentTarget).data('weaponId');
      const weapon = Validation.requireDocument(this.actor.items.get(weaponId), 'Weapon', 'Remove Ammo');
      Validation.requireDocument(this.actor.items.get(ammoId), 'Ammunition', 'Remove Ammo');

      await weapon.update({ "system.loadedAmmo": null });
      ui.notifications.info('Ammunition removed.');
    }, 'Remove Ammunition'));

    // Edit ammunition from inline ammo display
    html.find('.ammo-edit-btn').click(ErrorHandler.wrap(async (ev) => {
      ev.stopPropagation();
      const itemId = $(ev.currentTarget).data('itemId');
      const item = Validation.requireDocument(this.actor.items.get(itemId), 'Ammunition', 'Edit');
      item.sheet.render(true);
    }, 'Edit Ammunition'));

    // Remove upgrade from weapon
    html.find('.upgrade-remove').click(ErrorHandler.wrap(async (ev) => {
      const upgradeId = $(ev.currentTarget).data('upgradeId');
      const weaponId = $(ev.currentTarget).data('weaponId');
      const weapon = Validation.requireDocument(this.actor.items.get(weaponId), 'Weapon', 'Remove Upgrade');

      const currentUpgrades = weapon.system.attachedUpgrades || [];
      const updatedUpgrades = currentUpgrades.filter(u => u.id !== upgradeId);

      await weapon.update({ "system.attachedUpgrades": updatedUpgrades });
      ui.notifications.info('Weapon upgrade removed.');
    }, 'Remove Weapon Upgrade'));

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
    html.find('.chapter-remove').click(ErrorHandler.wrap(async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const chapterId = this.actor.system.chapterId;
      if (chapterId) {
        const chapter = this.actor.items.get(chapterId);
        if (chapter) await chapter.delete();
      }
      await this.actor.update({ "system.chapterId": "" });
      ui.notifications.info('Chapter removed.');
    }, 'Remove Chapter'));

    // Drop handler for specialty
    html.find('.specialty-drop-zone').each((i, el) => {
      el.addEventListener('drop', this._onDropSpecialty.bind(this), false);
      el.addEventListener('dragover', ev => ev.preventDefault(), false);
    });

    // Remove specialty
    html.find('.specialty-remove').click(ErrorHandler.wrap(async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const specialtyId = this.actor.system.specialtyId;
      if (specialtyId) {
        const specialty = this.actor.items.get(specialtyId);
        if (specialty) await specialty.delete();
      }
      await this.actor.update({ "system.specialtyId": "" });
      ui.notifications.info('Specialty removed.');
    }, 'Remove Specialty'));
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
  /* istanbul ignore next */
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
        return CharacteristicHandlers.handleRoll(dataset, this.actor);
      }
      // Handle skill rolls.
      else if (dataset.rollType == 'skill') {
        return SkillHandlers.handleRoll(dataset, this.actor);
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
   * Handle weapon attack rolls.
   * @param {Event} event The originating click event
   * @private
   */
  /* istanbul ignore next */
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

    const safeWeaponName = Sanitizer.escape(weapon.name);
    foundry.applications.api.DialogV2.wait({
      window: { title: `Attack with ${safeWeaponName}` },
      content: content,
      buttons: [
        {
          label: "Attack", action: "attack",
          callback: async (event, button, dialog) => {
            const el = dialog.element;
            const attackType = el.querySelector('#attack-type').value;
            const rangeMod = parseInt(el.querySelector('#range-mod').value) || 0;
            
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

            const label = `[Attack] ${safeWeaponName}`;
            roll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              flavor: modifierParts.length > 0 ? `${label}<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>` : label,
              rollMode: game.settings.get('core', 'rollMode')
            });
          }
        },
        { label: "Cancel", action: "cancel" }
      ]
    });
  }

  /**
   * Handle dropping an item on another item (e.g., armor history on armor, ammo on weapon)
   * @param {Event} event The drop event
   * @private
   */
  /* istanbul ignore next */
  async _onDropItemOnItem(event) {
    event.preventDefault();

    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data.type !== 'Item') return;

    const droppedItem = await Item.implementation.fromDropData(data);
    if (!droppedItem) return;

    // Handle armor history drops
    if (droppedItem.type === 'armor-history') {
      event.stopPropagation();
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
    // Handle ammunition drops on weapons
    else if (droppedItem.type === 'ammunition') {
      let targetItemId = $(event.currentTarget).data('itemId');
      let targetItem = this.actor.items.get(targetItemId);
      
      if (!targetItem || targetItem.type !== 'weapon') {
        return;
      }
      event.stopPropagation();

      const weaponClass = targetItem.system.class?.toLowerCase();
      if (weaponClass?.includes('melee')) {
        ui.notifications.warn('Ammunition cannot be loaded into melee weapons.');
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
    // Handle weapon upgrade drops
    else if (droppedItem.type === 'weapon-upgrade') {
      event.stopPropagation();
      let upgradeItem = droppedItem;
      if (!droppedItem.parent || droppedItem.parent.id !== this.actor.id) {
        const imported = await Item.create(droppedItem.toObject(), { parent: this.actor });
        upgradeItem = imported;
      }

      let targetItemId = $(event.currentTarget).data('itemId');
      let targetItem = this.actor.items.get(targetItemId);
      
      if (!targetItem || targetItem.type !== 'weapon') {
        ui.notifications.warn('Weapon upgrades can only be attached to weapons.');
        return;
      }

      const currentUpgrades = targetItem.system.attachedUpgrades || [];
      if (currentUpgrades.find(u => u.id === upgradeItem.id)) {
        ui.notifications.warn(`${upgradeItem.name} is already attached to ${targetItem.name}.`);
        return;
      }
      
      await targetItem.update({ "system.attachedUpgrades": [...currentUpgrades, { id: upgradeItem.id }] });
      ui.notifications.info(`${upgradeItem.name} attached to ${targetItem.name}.`);
    }
  }

  /**
   * Handle dropping a chapter item
   * @param {Event} event The drop event
   * @private
   */
  /* istanbul ignore next */
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
  /* istanbul ignore next */
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
