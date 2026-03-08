import { debug } from "./debug.mjs";
import { CHARACTERISTIC_CONSTANTS } from './constants.mjs';

export class ModifierCollector {
  static collectAllModifiers(actor) {
    const actorModifiers = actor.system.modifiers || [];
    const itemModifiers = this.collectItemModifiers(actor.items);
    const effectModifiers = this.collectActiveEffectModifiers(actor);
    return [...actorModifiers, ...itemModifiers, ...effectModifiers];
  }

  static collectActiveEffectModifiers(actor) {
    const modifiers = [];
    
    if (!actor.effects) return modifiers;
    
    for (const effect of actor.effects) {
      if (effect.disabled) continue;
      
      for (const change of effect.changes) {
        const match = change.key.match(/^system\.characteristics\.(\w+)\.value$/);
        if (match && change.mode === 2) {
          modifiers.push({
            name: effect.name,
            modifier: change.value,
            effectType: 'characteristic',
            valueAffected: match[1],
            enabled: true,
            source: 'Status Effect'
          });
        }
      }
    }
    
    return modifiers;
  }

  static collectItemModifiers(items) {
    const modifiers = [];
    
    // Handle both Map (from actor.items) and Array (from tests)
    const itemsArray = items instanceof Map ? Array.from(items.values()) : items;
    
    for (const item of itemsArray) {
      if (!item?.system) continue;
      
      // Chapter items and traits are always active (no equipped check)
      const isActive = item.type === 'chapter' || item.type === 'trait' || item.system.equipped;
      if (!isActive) continue;
      
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
        if (characteristic.advances.simple) { total += 5; appliedMods.push({ name: 'Simple Advance', value: 5, source: 'Advances' }); }
        if (characteristic.advances.intermediate) { total += 5; appliedMods.push({ name: 'Intermediate Advance', value: 5, source: 'Advances' }); }
        if (characteristic.advances.trained) { total += 5; appliedMods.push({ name: 'Trained Advance', value: 5, source: 'Advances' }); }
        if (characteristic.advances.expert) { total += 5; appliedMods.push({ name: 'Expert Advance', value: 5, source: 'Advances' }); }
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
      characteristic.baseMod = characteristic.mod;
      characteristic.unnaturalMultiplier = 1;
      
      // Group and apply characteristic bonus modifiers
      const bonusModGroups = new Map();
      for (const mod of modifiers) {
        if (mod.enabled !== false && mod.effectType === 'characteristic-bonus' && mod.valueAffected === key) {
          const modStr = String(mod.modifier);
          if (bonusModGroups.has(mod.name)) {
            const existing = bonusModGroups.get(mod.name);
            if (modStr.startsWith('x')) {
              const mult = parseFloat(modStr.substring(1)) || 1;
              existing.multiplier += mult - 1;
            } else {
              existing.value += parseInt(mod.modifier) || 0;
            }
          } else {
            bonusModGroups.set(mod.name, {
              name: mod.name,
              source: mod.source,
              value: modStr.startsWith('x') ? 0 : (parseInt(mod.modifier) || 0),
              multiplier: modStr.startsWith('x') ? (parseFloat(modStr.substring(1)) || 1) : null
            });
          }
        }
      }
      
      // Apply grouped modifiers
      const bonusMods = [];
      for (const group of bonusModGroups.values()) {
        if (group.multiplier !== null) {
          const multipliedValue = Math.floor(characteristic.baseMod * group.multiplier);
          const addedValue = multipliedValue - characteristic.baseMod;
          characteristic.mod += addedValue;
          characteristic.unnaturalMultiplier = group.multiplier;
          bonusMods.push({ name: group.name, value: multipliedValue, source: group.source, display: `x${group.multiplier}` });
        } else if (group.value !== 0) {
          characteristic.mod += group.value;
          bonusMods.push({ name: group.name, value: group.value, source: group.source });
        }
      }
      characteristic.bonusModifiers = bonusMods;
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

  static applyWoundModifiers(wounds, modifiers) {
    if (!wounds) return;
    
    if (wounds.base === undefined) {
      wounds.base = wounds.max;
    }
    
    let total = wounds.base || 0;
    const appliedMods = [];
    
    for (const mod of modifiers) {
      if (mod.enabled !== false && mod.effectType === 'wounds') {
        const modValue = parseInt(mod.modifier) || 0;
        total += modValue;
        appliedMods.push({ name: mod.name, value: modValue, source: mod.source });
      }
    }
    
    wounds.max = total;
    wounds.modifiers = appliedMods;
  }

  static applyFatigueModifiers(fatigue, toughnessBonus) {
    if (!fatigue) return;
    
    fatigue.max = toughnessBonus;
    fatigue.unconscious = fatigue.value > toughnessBonus;
    fatigue.penalty = fatigue.value > 0 ? -10 : 0;
  }

  static applyArmorModifiers(items, modifiers) {
    const itemsArray = items instanceof Map ? Array.from(items.values()) : items;
    
    for (const item of itemsArray) {
      if (item?.type === 'armor' && item.system.equipped) {
        const locations = ['head', 'body', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
        
        for (const location of locations) {
          if (item.system[location] !== undefined) {
            if (item.system[`${location}_base`] === undefined) {
              item.system[`${location}_base`] = item.system[location];
            }
            const base = item.system[`${location}_base`];
            let total = base;
            
            for (const mod of modifiers) {
              if (mod.enabled !== false && mod.effectType === 'armor') {
                total += parseInt(mod.modifier) || 0;
              }
            }
            
            item.system[location] = total;
          }
        }
      }
    }
  }
}
