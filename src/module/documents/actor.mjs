/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { debug } from "../helpers/debug.mjs";

export class DeathwatchActor extends Actor {

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
    const modifiers = systemData.modifiers || [];

    // Calculate rank from XP
    const xp = systemData.xp?.total || systemData.xp || 0;
    if (xp < 13000) systemData.rank = 1;
    else if (xp < 17000) systemData.rank = 1;
    else if (xp < 21000) systemData.rank = 2;
    else if (xp < 25000) systemData.rank = 3;
    else if (xp < 30000) systemData.rank = 4;
    else if (xp < 35000) systemData.rank = 5;
    else if (xp < 40000) systemData.rank = 6;
    else if (xp < 45000) systemData.rank = 7;
    else systemData.rank = 8;

    // Calculate spent XP from characteristic advances and skills
    let spentXP = 13000;
    for (const item of this.items) {
      if (item.type === 'characteristic-advance' && item.system.cost) {
        spentXP += item.system.cost;
      }
    }
    
    // Add skill costs
    if (systemData.skills) {
      for (const [key, skill] of Object.entries(systemData.skills)) {
        if (skill.trained) spentXP += skill.costTrain || 0;
        if (skill.mastered) spentXP += skill.costMaster || 0;
        if (skill.expert) spentXP += skill.costExpert || 0;
      }
    }
    
    if (typeof systemData.xp === 'object') {
      systemData.xp.spent = spentXP;
      systemData.xp.available = (systemData.xp.total || 13000) - spentXP;
    }

    // Collect modifiers from equipped items
    const itemModifiers = [];
    for (const item of this.items) {
      debug('MODIFIERS', `Checking item: ${item.name}, type: ${item.type}, equipped: ${item.system.equipped}`);
      
      if (item.system.equipped && item.system.modifiers) {
        debug('MODIFIERS', `  Found ${item.system.modifiers.length} modifiers on ${item.name}`);
        for (const mod of item.system.modifiers) {
          if (mod.enabled !== false) {
            itemModifiers.push({ ...mod, source: item.name });
          }
        }
      }
      
      // Collect modifiers from armor histories attached to equipped armor
      if (item.type === 'armor' && item.system.equipped && Array.isArray(item.system.attachedHistories)) {
        debug('MODIFIERS', `  Armor ${item.name} has ${item.system.attachedHistories.length} attached histories`);
        for (const historyId of item.system.attachedHistories) {
          const history = this.items.get(historyId);
          debug('MODIFIERS', `    History ID: ${historyId}, found: ${!!history}`);
          if (history) {
            debug('MODIFIERS', `    History: ${history.name}, modifiers: ${history.system.modifiers?.length || 0}`);
          }
          if (history && Array.isArray(history.system.modifiers)) {
            for (const mod of history.system.modifiers) {
              debug('MODIFIERS', `      Modifier: ${mod.name}, ${mod.modifier}, ${mod.effectType}, ${mod.valueAffected}`);
              if (mod.enabled !== false) {
                itemModifiers.push({ ...mod, source: `${history.name} (${item.name})` });
              }
            }
          }
        }
      }
    }

    debug('MODIFIERS', `Total item modifiers collected: ${itemModifiers.length}`);

    // Combine actor and item modifiers
    const allModifiers = [...modifiers, ...itemModifiers];

    // Loop through characteristics and calculate totals with modifiers
    for (let [key, characteristic] of Object.entries(systemData.characteristics)) {
      // Store base value if not already stored
      if (characteristic.base === undefined) {
        characteristic.base = characteristic.value;
      }
      
      // Start with base value
      let total = characteristic.base || 0;
      const appliedMods = [];
      
      // Apply modifiers
      for (const mod of allModifiers) {
        if (mod.enabled !== false && mod.effectType === 'characteristic' && mod.valueAffected === key) {
          const modValue = parseInt(mod.modifier) || 0;
          total += modValue;
          appliedMods.push({ name: mod.name, value: modValue, source: mod.source });
        }
      }
      
      characteristic.value = total;
      characteristic.modifiers = appliedMods;
      characteristic.mod = Math.floor(total / 10);
    }

    // Apply skill modifiers
    if (systemData.skills) {
      for (let [key, skill] of Object.entries(systemData.skills)) {
        let skillModTotal = 0;
        for (const mod of allModifiers) {
          if (mod.enabled !== false && mod.effectType === 'skill' && mod.valueAffected === key) {
            skillModTotal += parseInt(mod.modifier) || 0;
          }
        }
        skill.modifierTotal = skillModTotal;
      }
    }

    // Apply initiative modifiers
    let initiativeModTotal = 0;
    for (const mod of allModifiers) {
      if (mod.enabled !== false && mod.effectType === 'initiative') {
        initiativeModTotal += parseInt(mod.modifier) || 0;
      }
    }
    systemData.initiativeBonus = initiativeModTotal;
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
    data.agBonus = data.characteristics?.ag?.bonus || Math.floor((data.characteristics?.ag?.value || 0) / 10);
    
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