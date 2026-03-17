/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { debug } from "../helpers/debug.mjs";
import { XPCalculator } from "../helpers/xp-calculator.mjs";
import { ModifierCollector } from "../helpers/modifier-collector.mjs";
import { CHARACTERISTIC_CONSTANTS } from "../helpers/constants.mjs";
import { SkillLoader } from "../helpers/skill-loader.mjs";
import { ActorConditionsMixin } from "./actor-conditions.mjs";

export class DeathwatchActor extends ActorConditionsMixin(Actor) {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    
    // Set default token settings based on actor type
    if (data.type === 'character') {
      this.updateSource({
        'prototypeToken.actorLink': true
      });
    }
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.

  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.deathwatch || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const systemData = actorData.system;

    // Initialize fatePoints if not present
    if (!systemData.fatePoints) {
      systemData.fatePoints = { value: 0, max: 0 };
    }

    // Initialize renown if not present
    if (systemData.renown === undefined) {
      systemData.renown = 0;
    }

    // Load skills dynamically from JSON
    systemData.skills = SkillLoader.loadSkills(systemData.skills);

    // Calculate rank and XP using XPCalculator
    systemData.rank = XPCalculator.calculateRank(systemData.xp?.total || systemData.xp);
    const spentXP = XPCalculator.calculateSpentXP(this);
    
    if (typeof systemData.xp === 'object') {
      systemData.xp.spent = spentXP;
      systemData.xp.available = (systemData.xp.total || XPCalculator.STARTING_XP) - spentXP;
    }

    // Collect and apply modifiers using ModifierCollector
    const allModifiers = ModifierCollector.collectAllModifiers(this);
    ModifierCollector.applyCharacteristicModifiers(systemData.characteristics, allModifiers);
    
    if (systemData.skills) {
      ModifierCollector.applySkillModifiers(systemData.skills, allModifiers);
    }
    
    systemData.initiativeBonus = ModifierCollector.applyInitiativeModifiers(allModifiers);
    ModifierCollector.applyWoundModifiers(systemData.wounds, allModifiers);
    ModifierCollector.applyFatigueModifiers(systemData.fatigue, systemData.characteristics?.tg?.mod || 0);
    ModifierCollector.applyArmorModifiers(this.items, allModifiers);
    ModifierCollector.applyPsyRatingModifiers(systemData.psyRating, allModifiers);

    // Calculate movement based on Agility Bonus
    const agBonus = systemData.characteristics?.ag?.mod || 0;
    if (!systemData.movement) {
      systemData.movement = {};
    }
    systemData.movement.half = agBonus;
    systemData.movement.full = agBonus * 2;
    systemData.movement.charge = agBonus * 3;
    systemData.movement.run = agBonus * 6;
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = (systemData.cr * systemData.cr) * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.characteristics)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add agility bonus for initiative
    data.agBonus = data.characteristics?.ag?.bonus || Math.floor((data.characteristics?.ag?.value || 0) / CHARACTERISTIC_CONSTANTS.BONUS_DIVISOR);
    
    // Add initiative bonus from modifiers
    data.initiativeBonus = data.initiativeBonus || 0;

    // TODO: Figure out level stuff
    // Add level for easier access, or fall back to 0.
    // if (data.attributes.level) {
    //  data.lvl = data.attributes.level.value ?? 0;
    // }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

}