import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { DWConfig } from "../helpers/config.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DeathwatchActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["deathwatch", "sheet", "actor"],
      template: "systems/deathwatch/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "characteristics" }]
    });
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
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const characteristics = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: []
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to characteristics.
      else if (i.type === 'characteristic') {
        characteristics.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.characteristics = characteristics;
    context.spells = spells;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

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

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
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
    const baseFormula = dataset.roll;
    const characteristicKey = dataset.characteristic;
    const label = dataset.label ? `[Characteristic] ${dataset.label}` : '';

    // Get the characteristic modifier
    const characteristicMod = this.actor.system.characteristics[characteristicKey]?.mod || 0;

    // Create the dialog content with difficulty dropdown and free-form modifier
    let content = `
      <div class="modifier-dialog">
        <div class="form-group">
          <label for="difficulty-select">Difficulty:</label>
          <select id="difficulty-select" name="difficulty">
    `;

    // Add options for each difficulty level
    for (const [key, difficulty] of Object.entries(DWConfig.TestDifficulties)) {
      const selected = key === 'challenging' ? 'selected' : '';
      content += `
            <option value="${key}" ${selected}>${difficulty.label} (${difficulty.modifier >= 0 ? '+' : ''}${difficulty.modifier})</option>
      `;
    }

    content += `
          </select>
        </div>
        <div class="form-group modifier-row">
          <label for="modifier">Misc:</label>
          <input type="text" id="modifier" name="modifier" value="" placeholder="e.g., +5, -10, or leave blank" />
        </div>
      </div>
    `;

    // Show the dialog
    return new Dialog({
      title: `Roll ${dataset.label}`,
      content: content,
      render: (html) => {
        // Add input validation to restrict misc field to numbers only
        const miscInput = html.find('#modifier');
        miscInput.on('input', function() {
          // Allow only numbers, +, -, and spaces
          const value = this.value.replace(/[^0-9+\-\s]/g, '');
          if (this.value !== value) {
            this.value = value;
          }
        });
      },
      buttons: {
        roll: {
          label: "Roll",
          class: "dialog-button roll",
          callback: (html) => {
            const selectedDifficulty = html.find('#difficulty-select').val();
            const difficultyModifier = DWConfig.TestDifficulties[selectedDifficulty].modifier;
            
            const additionalModifierInput = html.find('#modifier').val().trim();
            let additionalModifier = 0;
            
            // Parse the additional modifier (allow free-form input)
            if (additionalModifierInput) {
              // Try to evaluate simple expressions like "+5", "-10", "2d6", etc.
              try {
                // If it starts with + or -, treat as modifier
                if (additionalModifierInput.match(/^[-+]\d+$/)) {
                  additionalModifier = parseInt(additionalModifierInput);
                } else if (additionalModifierInput.match(/^\d+$/)) {
                  additionalModifier = parseInt(additionalModifierInput);
                } else {
                  // For more complex expressions, we'll add them as-is to the formula
                  additionalModifier = additionalModifierInput;
                }
              } catch (e) {
                // If parsing fails, treat as string to add to formula
                additionalModifier = additionalModifierInput;
              }
            }
            
            // Build roll formula and modifier breakdown
            let rollFormula = 'd100';
            let modifierBreakdown = [];
            
            if (characteristicMod !== 0) {
              rollFormula += ` ${characteristicMod >= 0 ? '+' : ''}${characteristicMod}`;
              modifierBreakdown.push(`${characteristicMod >= 0 ? '+' : ''}${characteristicMod} (${dataset.label})`);
            }
            
            if (difficultyModifier !== 0) {
              rollFormula += ` ${difficultyModifier >= 0 ? '+' : ''}${difficultyModifier}`;
              modifierBreakdown.push(`${difficultyModifier >= 0 ? '+' : ''}${difficultyModifier} (${DWConfig.TestDifficulties[selectedDifficulty].label})`);
            }
            
            if (typeof additionalModifier === 'number' && additionalModifier !== 0) {
              rollFormula += ` ${additionalModifier >= 0 ? '+' : ''}${additionalModifier}`;
              modifierBreakdown.push(`${additionalModifier >= 0 ? '+' : ''}${additionalModifier} (Misc)`);
            } else if (additionalModifierInput && typeof additionalModifier === 'string') {
              rollFormula += ` + ${additionalModifier}`;
              modifierBreakdown.push(`+ ${additionalModifier} (Misc)`);
            }
            
            let roll = new Roll(rollFormula, rollData);
            
            // Create detailed flavor text with modifier breakdown
            let flavorText = `${label}`;
            if (modifierBreakdown.length > 0) {
              flavorText += `<br><span style="font-size: 0.9em; color: #666;">${modifierBreakdown.join('<br>')}</span>`;
            }
            
            roll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              flavor: flavorText,
              rollMode: game.settings.get('core', 'rollMode'),
            });
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

}
