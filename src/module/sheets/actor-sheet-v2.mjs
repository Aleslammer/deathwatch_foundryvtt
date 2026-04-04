import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { DWConfig } from "../helpers/config.mjs";
import { CombatHelper } from "../helpers/combat/combat.mjs";
import { PsychicCombatHelper } from "../helpers/combat/psychic-combat.mjs";
import { ModifierHelper } from "../helpers/character/modifiers.mjs";
import { RollDialogBuilder } from "../helpers/ui/roll-dialog-builder.mjs";
import { ChatMessageBuilder } from "../helpers/ui/chat-message-builder.mjs";
import { ItemHandlers } from "../helpers/ui/item-handlers.mjs";
import { getRankImage } from "../helpers/character/rank-helper.mjs";
import { WoundHelper } from "../helpers/character/wound-helper.mjs";
import { ModeHelper } from "../helpers/mode-helper.mjs";
import { CohesionPanel } from "../ui/cohesion-panel.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/**
 * ApplicationV2 actor sheet for the Deathwatch system.
 * Handles all 4 actor types: character, npc, enemy, horde.
 * @extends {ActorSheetV2}
 */
export class DeathwatchActorSheetV2 extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {

  static DEFAULT_OPTIONS = {
    classes: ["deathwatch", "sheet", "actor"],
    position: { width: 1000, height: 800 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      // Step 2: show-item-in-chat handlers
      showTalent: DeathwatchActorSheetV2._onShowItem,
      showTrait: DeathwatchActorSheetV2._onShowItem,
      showImplant: DeathwatchActorSheetV2._onShowItem,
      showPsychicPower: DeathwatchActorSheetV2._onShowItem,
      showHistory: DeathwatchActorSheetV2._onShowItem,
      showCritical: DeathwatchActorSheetV2._onShowItem,
      showDemeanour: DeathwatchActorSheetV2._onShowItem,
      showSpecialAbility: DeathwatchActorSheetV2._onShowSpecialAbility,
      usePsychicPower: DeathwatchActorSheetV2._onUsePsychicPower,
      activateSquadAbility: DeathwatchActorSheetV2._onActivateSquadAbility,
      // Step 3: item CRUD handlers
      editItem: DeathwatchActorSheetV2._onEditItem,
      deleteItem: DeathwatchActorSheetV2._onDeleteItem,
      createItem: DeathwatchActorSheetV2._onCreateItem,
      toggleEquip: DeathwatchActorSheetV2._onToggleEquip,
      // Step 4: combat handlers
      weaponAttack: DeathwatchActorSheetV2._onWeaponAttack,
      weaponDamage: DeathwatchActorSheetV2._onWeaponDamage,
      weaponUnjam: DeathwatchActorSheetV2._onWeaponUnjam,
      removeAmmo: DeathwatchActorSheetV2._onRemoveAmmo,
      editAmmo: DeathwatchActorSheetV2._onEditAmmo,
      removeUpgrade: DeathwatchActorSheetV2._onRemoveUpgrade,
      // Step 5: roll handlers
      rollCharacteristic: DeathwatchActorSheetV2._onRollCharacteristic,
      rollSkill: DeathwatchActorSheetV2._onRollSkill,
      // Step 6: modifier + effects + misc handlers
      createModifier: DeathwatchActorSheetV2._onCreateModifier,
      editModifier: DeathwatchActorSheetV2._onEditModifier,
      deleteModifier: DeathwatchActorSheetV2._onDeleteModifier,
      toggleModifier: DeathwatchActorSheetV2._onToggleModifier,
      removeChapter: DeathwatchActorSheetV2._onRemoveChapter,
      removeSpecialty: DeathwatchActorSheetV2._onRemoveSpecialty,
      removeHistory: DeathwatchActorSheetV2._onRemoveHistory,
      toggleSection: DeathwatchActorSheetV2._onToggleSection,
      // Step 7: drag-and-drop (handled via _onDrop override)
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/deathwatch/templates/actor/actor-character-sheet.html",
      scrollable: [".skills-container", ".items-list", ".tab"]
    }
  };

  /** @override — select template by actor type */
  _getHeaderControls() {
    return super._getHeaderControls?.() || [];
  }

  /**
   * Override to return the correct template per actor type.
   * V2 uses _configureRenderParts but we can override the PARTS template dynamically.
   */
  async _preparePartContext(partId, context) {
    context.tab = context.tabs?.[partId];
    return context;
  }

  /** @override — render using per-instance template */
  async _renderHTML(context, options) {
    const template = `systems/deathwatch/templates/actor/actor-${this.document.type}-sheet.html`;
    const compiled = await foundry.applications.handlebars.getTemplate(template);
    const htmlString = compiled(context, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });
    const temp = document.createElement("div");
    temp.innerHTML = htmlString;
    const content = temp.firstElementChild;
    return { sheet: content };
  }

  tabGroups = { primary: "characteristics" };

  /** @override */
  get title() {
    return this.document.name;
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Provide actor reference for template compatibility with V1
    context.actor = this.actor;
    // Live system data (preserves derived DataModel properties)
    context.system = { ...this.actor.system };
    context.flags = this.actor.flags;
    context.cssClass = this.isEditable ? "editable" : "locked";
    context.editable = this.isEditable;
    context.owner = this.actor.isOwner;

    if (this.actor.type === 'character') {
      this._prepareCharacterData(context);
      this._prepareItems(context);
    }
    if (this.actor.type === 'npc') {
      this._prepareNPCData(context);
      this._prepareItems(context);
    }
    if (this.actor.type === 'enemy' || this.actor.type === 'horde') {
      this._prepareEnemyData(context);
      this._prepareItems(context);
    }

    context.rollData = this.actor.getRollData();
    context.effects = prepareActiveEffectCategories(this.actor.effects);
    context.modifiers = this.actor.system.modifiers || [];
    context.statusEffects = CONFIG.statusEffects.map(effect => ({
      ...effect,
      active: this.actor.hasCondition?.(effect.id) || false
    }));

    return context;
  }

  /* -------------------------------------------- */
  /*  Character Data Preparation                  */
  /* -------------------------------------------- */

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

  _prepareCharacterData(context) {
    for (let [k, v] of Object.entries(context.system.characteristics)) {
      v.label = game.i18n.localize(game.deathwatch.config.CharacteristicWords[k]) ?? k;
    }

    if (context.system.chapterId) {
      context.chapterItem = this.actor.items.get(context.system.chapterId);
    }
    if (context.system.specialtyId) {
      context.specialtyItem = this.actor.items.get(context.system.specialtyId);
    }

    const chapterSkillCosts = {};
    if (context.chapterItem && context.chapterItem.system.skillCosts) {
      Object.assign(chapterSkillCosts, context.chapterItem.system.skillCosts);
    }

    const specialtyBaseSkillCosts = {};
    if (context.specialtyItem && context.specialtyItem.system.skillCosts) {
      Object.assign(specialtyBaseSkillCosts, context.specialtyItem.system.skillCosts);
    }

    const specialtySkillCosts = {};
    const specialtyTalentCosts = {};
    if (context.specialtyItem && context.specialtyItem.system.rankCosts) {
      const currentRank = context.system.rank || 1;
      for (let rank = 1; rank <= currentRank; rank++) {
        const rankData = context.specialtyItem.system.rankCosts[rank.toString()];
        if (rankData) {
          if (rankData.skills) {
            for (const [skillKey, skillCost] of Object.entries(rankData.skills)) {
              if (!specialtySkillCosts[skillKey]) specialtySkillCosts[skillKey] = {};
              Object.assign(specialtySkillCosts[skillKey], skillCost);
            }
          }
          if (rankData.talents) {
            for (const [talentId, cost] of Object.entries(rankData.talents)) {
              if (!specialtyTalentCosts[talentId]) specialtyTalentCosts[talentId] = [];
              specialtyTalentCosts[talentId].push(cost);
            }
          }
        }
      }
    }

    context.specialtyTalentCosts = specialtyTalentCosts;
    context.chapterTalentCosts = context.chapterItem?.system.talentCosts || {};
    context.specialtyBaseTalentCosts = context.specialtyItem?.system.talentCosts || {};

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
        const baseSkillTotal = DeathwatchActorSheetV2.calculateSkillTotal(v, context.system.characteristics);
        const skillModTotal = liveSkill?.modifierTotal || 0;
        v.total = baseSkillTotal + skillModTotal;

        if (chapterSkillCosts[k]) {
          if (chapterSkillCosts[k].costTrain !== undefined) v.costTrain = chapterSkillCosts[k].costTrain;
          if (chapterSkillCosts[k].costMaster !== undefined) v.costMaster = chapterSkillCosts[k].costMaster;
          if (chapterSkillCosts[k].costExpert !== undefined) v.costExpert = chapterSkillCosts[k].costExpert;
        }

        if (specialtyBaseSkillCosts[k]) {
          if (specialtyBaseSkillCosts[k].costTrain !== undefined) v.costTrain = specialtyBaseSkillCosts[k].costTrain;
          if (specialtyBaseSkillCosts[k].costMaster !== undefined) v.costMaster = specialtyBaseSkillCosts[k].costMaster;
          if (specialtyBaseSkillCosts[k].costExpert !== undefined) v.costExpert = specialtyBaseSkillCosts[k].costExpert;
        }

        if (specialtySkillCosts[k] !== undefined) {
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

    context.config = game.deathwatch.config;
    context.rankImage = getRankImage(context.system.rank);

    const wounds = context.system.wounds;
    context.woundColorClass = WoundHelper.getWoundColorClass(wounds?.value, wounds?.max);
    context.renownRank = this._getRenownRank(context.system.renown || 0);
    context.showPsyRating = context.specialtyItem?.system?.hasPsyRating || false;
  }

  /* -------------------------------------------- */
  /*  NPC Data Preparation                        */
  /* -------------------------------------------- */

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
        const baseSkillTotal = DeathwatchActorSheetV2.calculateSkillTotal(v, context.system.characteristics);
        const skillModTotal = liveSkill?.modifierTotal || 0;
        v.total = baseSkillTotal + skillModTotal;
      }
    }

    context.config = game.deathwatch.config;
    const wounds = context.system.wounds;
    context.woundColorClass = WoundHelper.getWoundColorClass(wounds?.value, wounds?.max);
  }

  /* -------------------------------------------- */
  /*  Enemy Data Preparation                      */
  /* -------------------------------------------- */

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
        const baseSkillTotal = DeathwatchActorSheetV2.calculateSkillTotal(v, context.system.characteristics);
        const skillModTotal = liveSkill?.modifierTotal || 0;
        v.total = baseSkillTotal + skillModTotal;
      }
    }

    context.config = game.deathwatch.config;
    const wounds = context.system.wounds;
    context.woundColorClass = WoundHelper.getWoundColorClass(wounds?.value, wounds?.max);
    context.showPsyRating = (context.system.psyRating?.base > 0) || (context.system.psyRating?.value > 0);
  }

  /* -------------------------------------------- */
  /*  Item Preparation                            */
  /* -------------------------------------------- */

  _prepareItems(context) {
    if (this.actor?.items?.map) {
      context.items = this.actor.items.map(i => ({
        ...i.toObject(false),
        system: { ...i.system }
      }));
    }
    const categories = ItemHandlers.processItems(context.items);
    Object.assign(context, categories);

    if (context.talents && context.talents.length > 0) {
      const chapterTalentCosts = context.chapterTalentCosts || {};
      const specialtyBaseTalentCosts = context.specialtyBaseTalentCosts || {};
      const specialtyTalentCosts = context.specialtyTalentCosts || {};

      const talentCounts = {};

      for (const talent of context.talents) {
        let effectiveCost = talent.system.cost;
        const talentId = talent.system.compendiumId || talent._id;

        if (!talentCounts[talentId]) {
          talentCounts[talentId] = { count: 0, stackable: talent.system.stackable };
        }
        talentCounts[talentId].count++;
        const instanceCount = talentCounts[talentId].count;

        if (chapterTalentCosts[talentId] !== undefined) {
          effectiveCost = chapterTalentCosts[talentId];
        }
        if (specialtyBaseTalentCosts[talentId] !== undefined) {
          effectiveCost = specialtyBaseTalentCosts[talentId];
        }

        const specialtyOverrides = specialtyTalentCosts[talentId];
        if (Array.isArray(specialtyOverrides) && specialtyOverrides.length > 0) {
          if (talentCounts[talentId].stackable) {
            if (specialtyOverrides.length >= instanceCount) {
              effectiveCost = specialtyOverrides[instanceCount - 1];
            } else if (instanceCount > 1 && talent.system.subsequentCost) {
              effectiveCost = talent.system.subsequentCost;
            }
          } else {
            effectiveCost = specialtyOverrides[specialtyOverrides.length - 1];
          }
        }

        talent.system.effectiveCost = effectiveCost;
      }
    }
  }

  /* -------------------------------------------- */
  /*  Utility                                     */
  /* -------------------------------------------- */

  _getRenownRank(renown) {
    if (renown >= 80) return 'Hero';
    if (renown >= 60) return 'Famed';
    if (renown >= 40) return 'Distinguished';
    if (renown >= 20) return 'Respected';
    return 'Initiated';
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  /**
   * Generic show-item-in-chat handler. Works for talents, traits, implants,
   * psychic powers, armor histories, critical effects, and demeanours.
   */
  static _onShowItem(event, target) {
    const itemId = target.dataset.itemId || target.closest('[data-item-id]')?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) ChatMessageBuilder.createItemCard(item, this.actor);
  }

  /**
   * Show special ability — posts mode activation message if applicable,
   * otherwise falls back to generic item card.
   */
  static _onShowSpecialAbility(event, target) {
    const itemId = target.dataset.itemId || target.closest('[data-item-id]')?.dataset.itemId;
    const ability = this.actor.items.get(itemId);
    if (!ability) return;

    const sys = ability.system;
    if (sys.effect && sys.modeRequirement) {
      const msg = ModeHelper.buildAbilityActivationMessage(
        this.actor.name, ability.name, sys.modeRequirement,
        sys.effect, sys.improvements || [], this.actor.system.rank || 1
      );
      if (msg) {
        ChatMessage.create({ content: msg, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
        return;
      }
    }
    ChatMessageBuilder.createItemCard(ability, this.actor);
  }

  /**
   * Use psychic power — opens Focus Power Test dialog.
   */
  static _onUsePsychicPower(event, target) {
    const itemId = target.dataset.itemId || target.closest('[data-item-id]')?.dataset.itemId;
    const power = this.actor.items.get(itemId);
    if (power) PsychicCombatHelper.focusPowerDialog(this.actor, power);
  }

  /**
   * Activate a Squad Mode ability.
   */
  static _onActivateSquadAbility(event, target) {
    const itemId = target.dataset.itemId;
    const ability = this.actor.items.get(itemId);
    if (ability) CohesionPanel.activateSquadAbility(this.actor, ability);
  }

  /* -------------------------------------------- */
  /*  Item CRUD Handlers                          */
  /* -------------------------------------------- */

  static _onEditItem(event, target) {
    const itemId = target.dataset.itemId || target.closest('[data-item-id]')?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    item?.sheet.render(true);
  }

  static async _onDeleteItem(event, target) {
    const itemId = target.dataset.itemId || target.closest('[data-item-id]')?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    await item?.delete();
    this.render();
  }

  static async _onCreateItem(event, target) {
    const type = target.dataset.type;
    const name = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    await Item.create({ name, type, system: {} }, { parent: this.actor });
    this.render();
  }

  static async _onToggleEquip(event, target) {
    event.preventDefault();
    const itemId = target.dataset.itemId || target.closest('[data-item-id]')?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) await item.update({ "system.equipped": !item.system.equipped });
    this.render();
  }

  /* -------------------------------------------- */
  /*  Combat Handlers                             */
  /* -------------------------------------------- */

  static _onWeaponAttack(event, target) {
    const itemId = target.dataset.itemId || target.closest('[data-item-id]')?.dataset.itemId;
    const weapon = this.actor.items.get(itemId);
    if (weapon) CombatHelper.weaponAttackDialog(this.actor, weapon);
  }

  static _onWeaponDamage(event, target) {
    const itemId = target.dataset.itemId;
    const weapon = this.actor.items.get(itemId);
    if (weapon) CombatHelper.weaponDamageRoll(this.actor, weapon);
  }

  static _onWeaponUnjam(event, target) {
    const itemId = target.dataset.itemId;
    const weapon = this.actor.items.get(itemId);
    if (weapon) CombatHelper.clearJam(this.actor, weapon);
  }

  static async _onRemoveAmmo(event, target) {
    const weaponId = target.dataset.weaponId;
    const weapon = this.actor.items.get(weaponId);
    if (!weapon) return;
    await weapon.update({ "system.loadedAmmo": null });
    ui.notifications.info('Ammunition removed.');
    this.render();
  }

  static _onEditAmmo(event, target) {
    event.stopPropagation();
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  static async _onRemoveUpgrade(event, target) {
    const upgradeId = target.dataset.upgradeId;
    const weaponId = target.dataset.weaponId;
    const weapon = this.actor.items.get(weaponId);
    if (!weapon) return;
    const currentUpgrades = weapon.system.attachedUpgrades || [];
    const updatedUpgrades = currentUpgrades.filter(u => u.id !== upgradeId);
    await weapon.update({ "system.attachedUpgrades": updatedUpgrades });
    ui.notifications.info('Weapon upgrade removed.');
    this.render();
  }

  /* -------------------------------------------- */
  /*  Roll Handlers                               */
  /* -------------------------------------------- */

  /* istanbul ignore next */
  static async _onRollCharacteristic(event, target) {
    const charKey = target.dataset.characteristic;
    const label = target.dataset.label || charKey;
    const characteristic = this.actor.system.characteristics[charKey];
    const flavorLabel = `[Characteristic] ${label}`;

    return DialogV2.wait({
      window: { title: `Roll ${label}` },
      content: RollDialogBuilder.buildModifierDialog(),
      render: (event, dialog) => RollDialogBuilder.attachModifierInputHandlerV2(dialog.element),
      buttons: [
        {
          label: "Roll", action: "roll",
          class: "dialog-button roll",
          callback: async (event, button, dialog) => {
            const modifiers = RollDialogBuilder.parseModifiersV2(dialog.element);
            const targetNum = characteristic.value + modifiers.difficultyModifier + modifiers.additionalModifier;
            const roll = new Roll('1d100', this.actor.getRollData());
            await roll.evaluate();
            const modifierParts = RollDialogBuilder.buildModifierParts(characteristic.value, label, modifiers);
            const flavor = RollDialogBuilder.buildResultFlavor(flavorLabel, targetNum, roll, modifierParts);
            ChatMessageBuilder.createRollMessage(roll, this.actor, flavor);
          }
        },
        { label: "Cancel", action: "cancel", class: "dialog-button cancel" }
      ]
    });
  }

  /* istanbul ignore next */
  static async _onRollSkill(event, target) {
    const skillKey = target.dataset.skill;
    const label = target.dataset.label || skillKey;
    const skill = this.actor.system.skills[skillKey];
    const flavorLabel = `[Skill] ${label}`;

    if (!skill) {
      ui.notifications.warn(`Skill ${skillKey} not found`);
      return;
    }
    if (!skill.isBasic && !skill.trained) {
      ui.notifications.warn(`${label} is an advanced skill and must be trained to use.`);
      return;
    }

    const characteristic = this.actor.system.characteristics[skill.characteristic];
    const baseCharValue = characteristic ? characteristic.value : 0;
    const effectiveChar = skill.trained ? baseCharValue : Math.floor(baseCharValue / 2);
    const skillBonus = skill.expert ? 20 : (skill.mastered ? 10 : 0);
    const skillTotal = effectiveChar + skillBonus + (skill.modifier || 0) + (skill.modifierTotal || 0);

    return DialogV2.wait({
      window: { title: `Roll ${label}` },
      content: RollDialogBuilder.buildModifierDialog(),
      render: (event, dialog) => RollDialogBuilder.attachModifierInputHandlerV2(dialog.element),
      buttons: [
        {
          label: "Roll", action: "roll",
          class: "dialog-button roll",
          callback: async (event, button, dialog) => {
            const modifiers = RollDialogBuilder.parseModifiersV2(dialog.element);
            const targetNum = skillTotal + modifiers.difficultyModifier + modifiers.additionalModifier;
            const roll = new Roll('1d100', this.actor.getRollData());
            await roll.evaluate();
            const modifierParts = RollDialogBuilder.buildModifierParts(skillTotal, label, modifiers);
            const flavor = RollDialogBuilder.buildResultFlavor(flavorLabel, targetNum, roll, modifierParts);
            ChatMessageBuilder.createRollMessage(roll, this.actor, flavor);
          }
        },
        { label: "Cancel", action: "cancel", class: "dialog-button cancel" }
      ]
    });
  }

  /* -------------------------------------------- */
  /*  Modifier, Effect & Misc Handlers            */
  /* -------------------------------------------- */

  static _onCreateModifier(event, target) {
    ModifierHelper.createModifier(this.actor);
  }

  static _onEditModifier(event, target) {
    const modifierId = target.dataset.modifierId || target.closest('.modifier')?.dataset.modifierId;
    ModifierHelper.editModifierDialog(this.actor, modifierId);
  }

  static _onDeleteModifier(event, target) {
    const modifierId = target.dataset.modifierId || target.closest('.modifier')?.dataset.modifierId;
    ModifierHelper.deleteModifier(this.actor, modifierId);
  }

  static _onToggleModifier(event, target) {
    const modifierId = target.dataset.modifierId || target.closest('.modifier')?.dataset.modifierId;
    ModifierHelper.toggleModifierEnabled(this.actor, modifierId);
  }

  static async _onRemoveChapter(event, target) {
    const chapterId = this.actor.system.chapterId;
    if (chapterId) {
      const chapter = this.actor.items.get(chapterId);
      if (chapter) await chapter.delete();
    }
    await this.actor.update({ "system.chapterId": "" });
    ui.notifications.info('Chapter removed.');
    this.render();
  }

  static async _onRemoveSpecialty(event, target) {
    const specialtyId = this.actor.system.specialtyId;
    if (specialtyId) {
      const specialty = this.actor.items.get(specialtyId);
      if (specialty) await specialty.delete();
    }
    await this.actor.update({ "system.specialtyId": "" });
    ui.notifications.info('Specialty removed.');
    this.render();
  }

  static async _onRemoveHistory(event, target) {
    const historyId = target.dataset.historyId;
    const armorId = target.dataset.armorId;
    const armor = this.actor.items.get(armorId);
    if (!armor) return;
    const currentHistories = armor.system.attachedHistories || [];
    const updatedHistories = currentHistories.filter(id => id !== historyId);
    await armor.update({ "system.attachedHistories": updatedHistories });
    ui.notifications.info('Armor history removed.');
    this.render();
  }

  /* istanbul ignore next */
  static async _onToggleSection(event, target) {
    const section = target.closest('.gear-section');
    const sectionKey = section?.dataset.section;
    if (!section || !sectionKey) return;
    section.classList.toggle('collapsed');
    const current = this.actor.getFlag('deathwatch', 'collapsedGearSections') || {};
    current[sectionKey] = section.classList.contains('collapsed');
    await this.actor.setFlag('deathwatch', 'collapsedGearSections', current);
  }

  /* -------------------------------------------- */
  /*  Post-Render Setup                           */
  /* -------------------------------------------- */

  /* istanbul ignore next */
  _onRender(context, options) {
    super._onRender?.(context, options);
    const html = this.element;
    if (!html) return;

    // V1-style tab activation (V2 doesn't auto-manage these)
    const tabs = new foundry.applications.ux.Tabs({ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: this._activeTab || 'characteristics' });
    tabs.bind(html);
    this._tabs = tabs;
    tabs.activate(this._activeTab || 'characteristics');
    // Track active tab across re-renders
    html.querySelectorAll('.sheet-tabs .item').forEach(tab => {
      tab.addEventListener('click', () => { this._activeTab = tab.dataset.tab; });
    });

    // Select all text on focus
    html.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
      input.addEventListener('focus', () => input.select());
    });

    // Status effect toggle (checkbox change — can't use data-action)
    html.querySelectorAll('.effect-toggle').forEach(cb => {
      cb.addEventListener('change', async (ev) => {
        const effectId = ev.currentTarget.dataset.effectId;
        await this.actor.setCondition(effectId, ev.currentTarget.checked);
      });
    });

    // Skill checkbox cascade
    html.querySelectorAll('input[type="checkbox"][name*="system.skills."][name*=".trained"]').forEach(cb => {
      cb.addEventListener('change', (ev) => {
        const match = ev.target.name.match(/system\.skills\.(\w+)\.trained/);
        if (!match) return;
        const skillKey = match[1];
        if (!ev.target.checked) {
          const mastered = html.querySelector(`input[name="system.skills.${skillKey}.mastered"]`);
          const expert = html.querySelector(`input[name="system.skills.${skillKey}.expert"]`);
          if (mastered) mastered.checked = false;
          if (expert) expert.checked = false;
        }
      });
    });

    html.querySelectorAll('input[type="checkbox"][name*="system.skills."][name*=".mastered"]').forEach(cb => {
      cb.addEventListener('change', (ev) => {
        const match = ev.target.name.match(/system\.skills\.(\w+)\.mastered/);
        if (!match) return;
        const skillKey = match[1];
        if (!ev.target.checked) {
          const expert = html.querySelector(`input[name="system.skills.${skillKey}.expert"]`);
          if (expert) expert.checked = false;
        }
      });
    });

    // Restore collapsed gear sections
    const collapsedSections = this.actor.getFlag?.('deathwatch', 'collapsedGearSections') || {};
    html.querySelectorAll('.gear-section').forEach(el => {
      if (collapsedSections[el.dataset.section]) el.classList.add('collapsed');
    });

    // Item-on-item drop zones (ammo→weapon, upgrade→weapon, history→armor)
    html.querySelectorAll('.inventory .items-list li.item').forEach(li => {
      li.addEventListener('drop', (ev) => this._onDropItemOnItem(ev), false);
      li.addEventListener('dragover', (ev) => ev.preventDefault(), false);
    });

    // Chapter drop zone
    html.querySelectorAll('.chapter-drop-zone').forEach(el => {
      el.addEventListener('drop', (ev) => this._onDropChapter(ev), false);
      el.addEventListener('dragover', (ev) => ev.preventDefault(), false);
    });

    // Specialty drop zone
    html.querySelectorAll('.specialty-drop-zone').forEach(el => {
      el.addEventListener('drop', (ev) => this._onDropSpecialty(ev), false);
      el.addEventListener('dragover', (ev) => ev.preventDefault(), false);
    });

    // Drag events for macros
    if (this.actor.isOwner) {
      html.querySelectorAll('li.item').forEach(li => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', 'true');
        li.addEventListener('dragstart', (ev) => this._onDragStart?.(ev), false);
      });
    }
  }

  /* -------------------------------------------- */
  /*  Drop Handlers                               */
  /* -------------------------------------------- */

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

      let targetItemId = event.currentTarget.dataset.itemId;
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
      let targetItemId = event.currentTarget.dataset.itemId;
      let targetItem = this.actor.items.get(targetItemId);

      if (!targetItem || targetItem.type !== 'weapon') return;
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

      if (!droppedItem.parent || droppedItem.parent.id !== this.actor.id) {
        ui.notifications.warn('Ammunition must be in your inventory to load it.');
        return;
      }

      await targetItem.update({ "system.loadedAmmo": droppedItem.id });
      ui.notifications.info(`${droppedItem.name} loaded into ${targetItem.name}.`);
    }
    // Handle weapon upgrade drops
    else if (droppedItem.type === 'weapon-upgrade') {
      event.stopPropagation();
      let upgradeItem = droppedItem;
      if (!droppedItem.parent || droppedItem.parent.id !== this.actor.id) {
        const imported = await Item.create(droppedItem.toObject(), { parent: this.actor });
        upgradeItem = imported;
      }

      let targetItemId = event.currentTarget.dataset.itemId;
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
      if (existingChapter) await existingChapter.delete();
    }

    const chapterItem = await Item.create(droppedItem.toObject(), { parent: this.actor });
    await this.actor.update({ "system.chapterId": chapterItem.id });
    ui.notifications.info(`Chapter set to ${chapterItem.name}.`);
  }

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
      if (existingSpecialty) await existingSpecialty.delete();
    }

    const specialtyItem = await Item.create(droppedItem.toObject(), { parent: this.actor });
    await this.actor.update({ "system.specialtyId": specialtyItem.id });
    ui.notifications.info(`Specialty set to ${specialtyItem.name}.`);
  }
}
