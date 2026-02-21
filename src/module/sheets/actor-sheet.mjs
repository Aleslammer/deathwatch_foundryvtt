import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { DWConfig } from "../helpers/config.mjs";
import { CombatHelper } from "../helpers/combat.mjs";
import { ModifierHelper } from "../helpers/modifiers.mjs";

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
      width: 600,
      height: 600,
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
    const charMod = skill.trained ? Math.floor(baseCharValue / 10) : Math.floor((baseCharValue / 2) / 10);
    const skillBonus = skill.advanced ? 20 : (skill.mastered ? 10 : 0);
    
    return charMod + skillBonus + skill.modifier;
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

    // Handle skills - use live actor data which has modifierTotal calculated
    if (context.system.skills) {
      for (let [k, v] of Object.entries(context.system.skills)) {
        v.label = game.i18n.localize(game.deathwatch.config.Skills[k]) ?? k;
        const liveSkill = this.actor.system.skills[k];
        const baseSkillTotal = DeathwatchActorSheet.calculateSkillTotal(v, context.system.characteristics);
        const skillModTotal = liveSkill?.modifierTotal || 0;
        v.total = baseSkillTotal + skillModTotal;
      }
    }

    // Add config to context for template access
    context.config = game.deathwatch.config;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    const weapons = [];
    const armor = [];
    const gear = [];
    const ammunition = [];
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

    // Track which ammo is loaded in weapons
    const loadedAmmoIds = new Set();

    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'weapon') {
        // Populate loaded ammo
        if (i.system.loadedAmmo) {
          i.loadedAmmoItem = context.items.find(item => item._id === i.system.loadedAmmo);
          if (i.loadedAmmoItem) {
            loadedAmmoIds.add(i.system.loadedAmmo);
          }
        }
        weapons.push(i);
      }
      else if (i.type === 'armor') {
        // Populate attached histories
        i.attachedHistories = (i.system.attachedHistories || []).map(histId => {
          return context.items.find(item => item._id === histId);
        }).filter(h => h);
        armor.push(i);
      }
      else if (i.type === 'gear') {
        gear.push(i);
      }
      else if (i.type === 'characteristic') {
        characteristics.push(i);
      }
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Add ammunition that is NOT loaded in weapons
    for (let i of context.items) {
      if (i.type === 'ammunition') {
        if (!loadedAmmoIds.has(i._id)) {
          ammunition.push(i);
        }
      }
    }

    context.weapons = weapons;
    context.armor = armor;
    context.gear = gear;
    context.ammunition = ammunition;
    context.characteristics = characteristics;
    context.spells = spells;
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
      if (!history) return;
      
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="armor-history-card">
          <h3>${history.name}</h3>
          ${history.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${history.system.book}, p${history.system.page}</em></p>
        </div>`
      });
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

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Toggle Equip Item
    html.find('.item-equip').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.update({ "system.equipped": !item.system.equipped });
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
    html.find('input[type="checkbox"][name*=".trained"]').change(ev => {
      const skillKey = ev.target.name.match(/system\.skills\.(\w+)\.trained/)[1];
      if (!ev.target.checked) {
        html.find(`input[name="system.skills.${skillKey}.mastered"]`).prop('checked', false);
        html.find(`input[name="system.skills.${skillKey}.advanced"]`).prop('checked', false);
      }
    });

    html.find('input[type="checkbox"][name*=".mastered"]').change(ev => {
      const skillKey = ev.target.name.match(/system\.skills\.(\w+)\.mastered/)[1];
      if (!ev.target.checked) {
        html.find(`input[name="system.skills.${skillKey}.advanced"]`).prop('checked', false);
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
  /**
   * Handle skill rolls with modifier dialog.
   * @param {Object} dataset The dataset from the clicked element
   * @private
   */
  async _onSkillRoll(dataset) {
    const rollData = this.actor.getRollData();
    const skillKey = dataset.skill;
    const skill = this.actor.system.skills[skillKey];
    const label = dataset.label ? `[Skill] ${dataset.label}` : '';

    if (!skill) {
      ui.notifications.warn(`Skill ${skillKey} not found`);
      return;
    }

    // Check if advanced skill is trained
    if (!skill.isBasic && !skill.trained) {
      ui.notifications.warn(`${dataset.label || skillKey} is an advanced skill and must be trained to use.`);
      return;
    }

    // Get skill total with modifiers applied
    const baseSkillTotal = DeathwatchActorSheet.calculateSkillTotal(skill, this.actor.system.characteristics);
    const skillModTotal = skill.modifierTotal || 0;
    const skillTotal = baseSkillTotal + skillModTotal;

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
            
            // Parse the additional modifier
            if (additionalModifierInput) {
              try {
                if (additionalModifierInput.match(/^[-+]\d+$/)) {
                  additionalModifier = parseInt(additionalModifierInput);
                } else if (additionalModifierInput.match(/^\d+$/)) {
                  additionalModifier = parseInt(additionalModifierInput);
                } else {
                  additionalModifier = additionalModifierInput;
                }
              } catch (e) {
                additionalModifier = additionalModifierInput;
              }
            }
            
            // Build roll formula and modifier breakdown
            let rollFormula = 'd100';
            let modifierBreakdown = [];
            
            // Add skill total
            if (skillTotal !== 0) {
              rollFormula += ` ${skillTotal >= 0 ? '+' : ''}${skillTotal}`;
              modifierBreakdown.push(`${skillTotal >= 0 ? '+' : ''}${skillTotal} (${dataset.label})`);
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
            if (attackType === 'aimed') attackMod = 10;
            if (attackType === 'called') attackMod = -20;
            
            const totalMod = attackMod + rangeMod;
            const targetNumber = bsValue + totalMod;
            
            // Roll to hit
            const hitRoll = new Roll('1d100');
            await hitRoll.evaluate();
            const hitResult = hitRoll.total;
            const success = hitResult <= targetNumber;
            
            let chatContent = `<div class="deathwatch weapon-attack">
              <h3>${weapon.name} Attack</h3>
              <div><strong>Target:</strong> ${targetNumber} (BS ${bsValue} ${totalMod >= 0 ? '+' : ''}${totalMod})</div>
              <div><strong>Roll:</strong> ${hitResult}</div>
              <div><strong>Result:</strong> ${success ? '<span style="color: green;">HIT</span>' : '<span style="color: red;">MISS</span>'}</div>`;
            
            if (success) {
              // Roll damage
              const damageRoll = new Roll(weaponData.dmg);
              await damageRoll.evaluate();
              chatContent += `<div><strong>Damage:</strong> ${damageRoll.total} (${weaponData.dmgType})</div>`;
              chatContent += `<div><strong>Penetration:</strong> ${weaponData.penetration}</div>`;
              if (weaponData.isTearing) chatContent += `<div><em>Tearing: Reroll damage dice, take highest</em></div>`;
            }
            
            chatContent += `</div>`;
            
            ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: chatContent
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

}
