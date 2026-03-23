import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { DWConfig } from "../helpers/config.mjs";
import { CombatHelper } from "../helpers/combat.mjs";
import { ModifierHelper } from "../helpers/modifiers.mjs";
import { RollDialogBuilder } from "../helpers/roll-dialog-builder.mjs";
import { ChatMessageBuilder } from "../helpers/chat-message-builder.mjs";
import { ItemHandlers } from "../helpers/item-handlers.mjs";
import { getRankImage } from "../helpers/rank-helper.mjs";
import { WoundHelper } from "../helpers/wound-helper.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DeathwatchActorSheet extends ActorSheet {

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
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    // Use live actor system data to preserve derived DataModel properties
    // (toObject() strips prepareDerivedData() values like characteristic.mod, movement, etc.)
    context.system = { ...this.actor.system };
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareCharacterData(context);
      this._prepareItems(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareNPCData(context);
      this._prepareItems(context);
    }

    // Prepare Enemy data and items.
    if (actorData.type == 'enemy') {
      this._prepareEnemyData(context);
      this._prepareItems(context);
    }

    // Prepare Horde data and items.
    if (actorData.type == 'horde') {
      this._prepareEnemyData(context);
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
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

    // Get specialty base skill cost overrides
    const specialtyBaseSkillCosts = {};
    if (context.specialtyItem && context.specialtyItem.system.skillCosts) {
      Object.assign(specialtyBaseSkillCosts, context.specialtyItem.system.skillCosts);
    }

    // Get specialty rank-based skill cost overrides (cumulative from rank 1 to current rank)
    const specialtySkillCosts = {};
    const specialtyTalentCosts = {}; // Maps talent ID to array of costs
    if (context.specialtyItem && context.specialtyItem.system.rankCosts) {
      const currentRank = context.system.rank || 1;
      // Accumulate costs from rank 1 up to current rank
      for (let rank = 1; rank <= currentRank; rank++) {
        const rankData = context.specialtyItem.system.rankCosts[rank.toString()];
        if (rankData) {
          // Merge skills (later ranks override earlier ranks for same skill level)
          if (rankData.skills) {
            for (const [skillKey, skillCost] of Object.entries(rankData.skills)) {
              if (!specialtySkillCosts[skillKey]) specialtySkillCosts[skillKey] = {};
              Object.assign(specialtySkillCosts[skillKey], skillCost);
            }
          }
          // Accumulate talents as arrays (for stackable talents)
          if (rankData.talents) {
            for (const [talentId, cost] of Object.entries(rankData.talents)) {
              if (!specialtyTalentCosts[talentId]) specialtyTalentCosts[talentId] = [];
              specialtyTalentCosts[talentId].push(cost);
            }
          }
        }
      }
    }

    // Store talent cost overrides for later use
    context.specialtyTalentCosts = specialtyTalentCosts;
    context.chapterTalentCosts = context.chapterItem?.system.talentCosts || {};
    context.specialtyBaseTalentCosts = context.specialtyItem?.system.talentCosts || {};

    // Handle skills - use live actor data which has modifierTotal calculated
    if (context.system.skills) {
      const sortedSkills = Object.entries(context.system.skills)
        .sort(([keyA, a], [keyB, b]) => {
          const labelA = game.i18n.localize(game.deathwatch.config.Skills[keyA] || keyA);
          const labelB = game.i18n.localize(game.deathwatch.config.Skills[keyB] || keyB);
          return labelA.localeCompare(labelB);
        });

      for (const [k, v] of sortedSkills) {
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
        
        // Apply specialty base skill cost overrides (takes precedence over chapter)
        if (specialtyBaseSkillCosts[k]) {
          if (specialtyBaseSkillCosts[k].costTrain !== undefined) v.costTrain = specialtyBaseSkillCosts[k].costTrain;
          if (specialtyBaseSkillCosts[k].costMaster !== undefined) v.costMaster = specialtyBaseSkillCosts[k].costMaster;
          if (specialtyBaseSkillCosts[k].costExpert !== undefined) v.costExpert = specialtyBaseSkillCosts[k].costExpert;
        }
        
        // Apply specialty rank-based skill cost overrides (takes precedence over base specialty)
        if (specialtySkillCosts[k] !== undefined) {
          // Support both simple number format and full object format
          if (typeof specialtySkillCosts[k] === 'number') {
            v.costTrain = specialtySkillCosts[k];
          } else if (typeof specialtySkillCosts[k] === 'object') {
            if (specialtySkillCosts[k].costTrain !== undefined) v.costTrain = specialtySkillCosts[k].costTrain;
            if (specialtySkillCosts[k].costMaster !== undefined) v.costMaster = specialtySkillCosts[k].costMaster;
            if (specialtySkillCosts[k].costExpert !== undefined) v.costExpert = specialtySkillCosts[k].costExpert;
          }
        }
      }
    }

    // Add config to context for template access
    context.config = game.deathwatch.config;

    // Add rank image
    context.rankImage = getRankImage(context.system.rank);

    // Calculate wound color class
    const wounds = context.system.wounds;
    context.woundColorClass = WoundHelper.getWoundColorClass(wounds?.value, wounds?.max);

    // Calculate renown rank
    context.renownRank = this._getRenownRank(context.system.renown || 0);

    // Show Psy Rating box if specialty has hasPsyRating
    context.showPsyRating = context.specialtyItem?.system?.hasPsyRating || false;
  }

  /**
   * Prepare NPC-specific data.
   * Simplified version of _prepareCharacterData — characteristics labels, skills, wound color.
   * @param {Object} context The sheet context
   */
  _prepareNPCData(context) {
    for (let [k, v] of Object.entries(context.system.characteristics)) {
      v.label = game.i18n.localize(game.deathwatch.config.CharacteristicWords[k]) ?? k;
    }

    if (context.system.skills) {
      const sortedSkills = Object.entries(context.system.skills)
        .sort(([keyA], [keyB]) => {
          const labelA = game.i18n.localize(game.deathwatch.config.Skills[keyA] || keyA);
          const labelB = game.i18n.localize(game.deathwatch.config.Skills[keyB] || keyB);
          return labelA.localeCompare(labelB);
        });

      for (const [k, v] of sortedSkills) {
        v.label = game.i18n.localize(game.deathwatch.config.Skills[k]) ?? k;
        const liveSkill = this.actor.system.skills[k];
        const baseSkillTotal = DeathwatchActorSheet.calculateSkillTotal(v, context.system.characteristics);
        const skillModTotal = liveSkill?.modifierTotal || 0;
        v.total = baseSkillTotal + skillModTotal;
      }
    }

    context.config = game.deathwatch.config;

    const wounds = context.system.wounds;
    context.woundColorClass = WoundHelper.getWoundColorClass(wounds?.value, wounds?.max);
  }

  /**
   * Prepare Enemy-specific data.
   * Same as character but without chapter/specialty/rank/XP/renown.
   * @param {Object} context The sheet context
   */
  _prepareEnemyData(context) {
    for (let [k, v] of Object.entries(context.system.characteristics)) {
      v.label = game.i18n.localize(game.deathwatch.config.CharacteristicWords[k]) ?? k;
    }

    if (context.system.skills) {
      const sortedSkills = Object.entries(context.system.skills)
        .sort(([keyA], [keyB]) => {
          const labelA = game.i18n.localize(game.deathwatch.config.Skills[keyA] || keyA);
          const labelB = game.i18n.localize(game.deathwatch.config.Skills[keyB] || keyB);
          return labelA.localeCompare(labelB);
        });

      for (const [k, v] of sortedSkills) {
        v.label = game.i18n.localize(game.deathwatch.config.Skills[k]) ?? k;
        const liveSkill = this.actor.system.skills[k];
        const baseSkillTotal = DeathwatchActorSheet.calculateSkillTotal(v, context.system.characteristics);
        const skillModTotal = liveSkill?.modifierTotal || 0;
        v.total = baseSkillTotal + skillModTotal;
      }
    }

    context.config = game.deathwatch.config;

    const wounds = context.system.wounds;
    context.woundColorClass = WoundHelper.getWoundColorClass(wounds?.value, wounds?.max);

    // Show Psy Rating box if psyRating base > 0 or any psy-rating modifiers exist
    context.showPsyRating = (context.system.psyRating?.base > 0) || (context.system.psyRating?.value > 0);
  }

  /**
   * Get renown rank based on renown value
   * @param {number} renown The renown value
   * @returns {string} The renown rank
   * @private
   */
  _getRenownRank(renown) {
    if (renown >= 80) return 'Hero';
    if (renown >= 60) return 'Famed';
    if (renown >= 40) return 'Distinguished';
    if (renown >= 20) return 'Respected';
    return 'Initiated';
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} context The sheet context
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    if (this.actor?.items?.map) {
      context.items = this.actor.items.map(i => ({
        ...i.toObject(false),
        system: { ...i.system }
      }));
    }
    const categories = ItemHandlers.processItems(context.items);
    Object.assign(context, categories);
    
    // Apply talent cost overrides
    if (context.talents && context.talents.length > 0) {
      const chapterTalentCosts = context.chapterTalentCosts || {};
      const specialtyBaseTalentCosts = context.specialtyBaseTalentCosts || {};
      const specialtyTalentCosts = context.specialtyTalentCosts || {};
      
      // Count instances of each talent by compendiumId
      const talentCounts = {};
      
      for (const talent of context.talents) {
        let effectiveCost = talent.system.cost;
        
        // Get talent ID for matching (prefer compendiumId for dragged talents)
        const talentId = talent.system.compendiumId || talent._id;
        
        // Track instance count for this talent
        if (!talentCounts[talentId]) {
          talentCounts[talentId] = { count: 0, stackable: talent.system.stackable };
        }
        talentCounts[talentId].count++;
        const instanceCount = talentCounts[talentId].count;
        
        // Apply chapter override
        if (chapterTalentCosts[talentId] !== undefined) {
          effectiveCost = chapterTalentCosts[talentId];
        }
        
        // Apply specialty base talent cost override (takes precedence over chapter)
        if (specialtyBaseTalentCosts[talentId] !== undefined) {
          effectiveCost = specialtyBaseTalentCosts[talentId];
        }
        
        // Apply specialty rank override (takes precedence)
        const specialtyOverrides = specialtyTalentCosts[talentId];
        if (Array.isArray(specialtyOverrides) && specialtyOverrides.length > 0) {
          if (talentCounts[talentId].stackable) {
            // For stackable talents, use the array index for this instance (if available)
            if (specialtyOverrides.length >= instanceCount) {
              effectiveCost = specialtyOverrides[instanceCount - 1];
            }
            // If no override for this instance, use subsequentCost or base cost
            else if (instanceCount > 1 && talent.system.subsequentCost) {
              effectiveCost = talent.system.subsequentCost;
            }
          } else {
            // For non-stackable talents, use the last (most recent rank) override
            effectiveCost = specialtyOverrides[specialtyOverrides.length - 1];
          }
        }
        
        talent.system.effectiveCost = effectiveCost;
      }
    }
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

    // Show implant in chat
    html.find('.implant-show').click(ev => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const implant = this.actor.items.get(itemId);
      if (implant) ChatMessageBuilder.createItemCard(implant, this.actor);
    });

    // Show psychic power in chat
    html.find('.psychic-power-show').click(ev => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const power = this.actor.items.get(itemId);
      if (power) ChatMessageBuilder.createItemCard(power, this.actor);
    });

    // Show special ability in chat
    html.find('.special-ability-show').click(ev => {
      const li = $(ev.currentTarget).closest('.item');
      const itemId = li.data('itemId');
      const ability = this.actor.items.get(itemId);
      if (ability) ChatMessageBuilder.createItemCard(ability, this.actor);
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

    // Status effect toggle
    html.find('.effect-toggle').change(async ev => {
      const effectId = $(ev.currentTarget).data('effectId');
      const enabled = ev.currentTarget.checked;
      await this.actor.setCondition(effectId, enabled);
    });

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

    // Remove upgrade from weapon
    html.find('.upgrade-remove').click(async ev => {
      const upgradeId = $(ev.currentTarget).data('upgradeId');
      const weaponId = $(ev.currentTarget).data('weaponId');
      const weapon = this.actor.items.get(weaponId);
      
      if (!weapon) return;
      
      const currentUpgrades = weapon.system.attachedUpgrades || [];
      const updatedUpgrades = currentUpgrades.filter(u => u.id !== upgradeId);
      
      await weapon.update({ "system.attachedUpgrades": updatedUpgrades });
      ui.notifications.info('Weapon upgrade removed.');
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

    // Collapsible gear sections
    const collapsedSections = this.actor.getFlag('deathwatch', 'collapsedGearSections') || {};
    html.find('.gear-section').each((i, el) => {
      const section = el.dataset.section;
      if (collapsedSections[section]) el.classList.add('collapsed');
    });
    html.find('.section-toggle').click(async ev => {
      const section = $(ev.currentTarget).closest('.gear-section');
      const sectionKey = section.data('section');
      section.toggleClass('collapsed');
      const current = this.actor.getFlag('deathwatch', 'collapsedGearSections') || {};
      current[sectionKey] = section.hasClass('collapsed');
      await this.actor.setFlag('deathwatch', 'collapsedGearSections', current);
    });

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
  /* istanbul ignore next */
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
  /* istanbul ignore next */
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
