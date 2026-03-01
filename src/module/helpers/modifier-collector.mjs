import { debug } from "./debug.mjs";
import { CHARACTERISTIC_CONSTANTS } from './constants.mjs';

export class ModifierCollector {
  static collectAllModifiers(actor) {
    const actorModifiers = actor.system.modifiers || [];
    const itemModifiers = this.collectItemModifiers(actor.items);
    return [...actorModifiers, ...itemModifiers];
  }

  static collectItemModifiers(items) {
    const modifiers = [];
    
    // Handle both Map (from actor.items) and Array (from tests)
    const itemsArray = items instanceof Map ? Array.from(items.values()) : items;
    
    for (const item of itemsArray) {
      if (!item?.system?.equipped) continue;
      
      debug('MODIFIERS', `Checking item: ${item.name}, type: ${item.type}, equipped: ${item.system.equipped}`);
      
      if (item.system.modifiers) {
        debug('MODIFIERS', `  Found ${item.system.modifiers.length} modifiers on ${item.name}`);
        for (const mod of item.system.modifiers) {
          if (mod.enabled !== false) {
            modifiers.push({ ...mod, source: item.name });
          }
        }
      }
      
      if (item.type === 'armor' && Array.isArray(item.system.attachedHistories)) {
        modifiers.push(...this.collectArmorHistoryModifiers(item, items));
      }
    }
    
    debug('MODIFIERS', `Total item modifiers collected: ${modifiers.length}`);
    return modifiers;
  }

  static collectArmorHistoryModifiers(armor, allItems) {
    const modifiers = [];
    
    debug('MODIFIERS', `  Armor ${armor.name} has ${armor.system.attachedHistories.length} attached histories`);
    
    for (const historyId of armor.system.attachedHistories) {
      const history = allItems.get(historyId);
      debug('MODIFIERS', `    History ID: ${historyId}, found: ${!!history}`);
      
      if (history) {
        debug('MODIFIERS', `    History: ${history.name}, modifiers: ${history.system.modifiers?.length || 0}`);
      }
      
      if (history && Array.isArray(history.system.modifiers)) {
        for (const mod of history.system.modifiers) {
          debug('MODIFIERS', `      Modifier: ${mod.name}, ${mod.modifier}, ${mod.effectType}, ${mod.valueAffected}`);
          if (mod.enabled !== false) {
            modifiers.push({ ...mod, source: `${history.name} (${armor.name})` });
          }
        }
      }
    }
    
    return modifiers;
  }

  static applyCharacteristicModifiers(characteristics, modifiers) {
    for (const [key, characteristic] of Object.entries(characteristics)) {
      if (characteristic.base === undefined) {
        characteristic.base = characteristic.value;
      }
      
      let total = characteristic.base || 0;
      const appliedMods = [];
      
      // Apply advances (+5 each)
      if (characteristic.advances) {
        if (characteristic.advances.simple) total += 5;
        if (characteristic.advances.intermediate) total += 5;
        if (characteristic.advances.trained) total += 5;
        if (characteristic.advances.expert) total += 5;
      }
      
      for (const mod of modifiers) {
        if (mod.enabled !== false && mod.effectType === 'characteristic' && mod.valueAffected === key) {
          const modValue = parseInt(mod.modifier) || 0;
          total += modValue;
          appliedMods.push({ name: mod.name, value: modValue, source: mod.source });
        }
      }
      
      characteristic.value = total;
      characteristic.modifiers = appliedMods;
      characteristic.mod = Math.floor(total / CHARACTERISTIC_CONSTANTS.BONUS_DIVISOR);
    }
  }

  static applySkillModifiers(skills, modifiers) {
    for (const [key, skill] of Object.entries(skills)) {
      let total = 0;
      
      for (const mod of modifiers) {
        if (mod.enabled !== false && mod.effectType === 'skill' && mod.valueAffected === key) {
          total += parseInt(mod.modifier) || 0;
        }
      }
      
      skill.modifierTotal = total;
    }
  }

  static applyInitiativeModifiers(modifiers) {
    let total = 0;
    
    for (const mod of modifiers) {
      if (mod.enabled !== false && mod.effectType === 'initiative') {
        total += parseInt(mod.modifier) || 0;
      }
    }
    
    return total;
  }
}
