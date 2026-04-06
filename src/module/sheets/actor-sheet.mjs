import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { DWConfig } from "../helpers/config.mjs";
import { RollDialogBuilder } from "../helpers/ui/roll-dialog-builder.mjs";
import { ChatMessageBuilder } from "../helpers/ui/chat-message-builder.mjs";
import { ItemHandlers } from "../helpers/ui/item-handlers.mjs";
import { Sanitizer } from "../helpers/sanitizer.mjs";
import { CharacterDataPreparer } from "./shared/data-preparers/character-data-preparer.mjs";
import { NPCDataPreparer } from "./shared/data-preparers/npc-data-preparer.mjs";
import { EnemyDataPreparer } from "./shared/data-preparers/enemy-data-preparer.mjs";
import { ItemListPreparer } from "./shared/data-preparers/item-list-preparer.mjs";
import { CharacteristicHandlers } from "./shared/handlers/characteristic-handlers.mjs";
import { SkillHandlers } from "./shared/handlers/skill-handlers.mjs";
import { SheetHandlers } from "./shared/handlers/sheet-handlers.mjs";
import { DropHandlers } from "./shared/handlers/drop-handlers.mjs";
import { ItemDisplayHandlers } from "./shared/handlers/item-display-handlers.mjs";
import { ItemManagementHandlers } from "./shared/handlers/item-management-handlers.mjs";
import { WeaponHandlers } from "./shared/handlers/weapon-handlers.mjs";

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

    // Attach item display handlers (show in chat, use power, activate ability)
    ItemDisplayHandlers.attach(html, this.actor);

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Attach item management handlers (equip, create, delete, effects, modifiers)
    ItemManagementHandlers.attach(html, this.actor, this);

    // Rollable abilities (characteristics)
    html.find('.rollable').click(this._onRoll.bind(this));

    // Attach weapon handlers (attack, damage, unjam)
    WeaponHandlers.attach(html, this.actor, this);

    // Drag events for macros
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Attach drop handlers
    DropHandlers.attach(html, this.actor);
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

}
