/**
 * Item type handlers for organizing and preparing items for display
 */
export class ItemHandlers {
  /**
   * Handle weapon items
   * @param {Object} item The weapon item
   * @param {Object} context The sheet context
   * @returns {Object} The processed weapon item
   */
  static weapon(item, context) {
    if (item.system.loadedAmmo) {
      item.loadedAmmoItem = context.items.find(i => i._id === item.system.loadedAmmo);
    }
    item.attachedQualities = (item.system.attachedQualities || [])
      .map(q => {
        const qualityId = typeof q === 'string' ? q : q.id;
        const quality = context.items.find(i => i._id === qualityId);
        if (!quality) return null;
        return {
          _id: quality._id,
          name: quality.name,
          system: {
            ...quality.system,
            value: (typeof q === 'object' && q.value !== undefined) ? q.value : quality.system.value
          }
        };
      })
      .filter(q => q);
    item.attachedUpgrades = (item.system.attachedUpgrades || [])
      .map(u => {
        const upgradeId = typeof u === 'string' ? u : u.id;
        return context.items.find(i => i._id === upgradeId);
      })
      .filter(u => u);
    return item;
  }

  /**
   * Handle armor items
   * @param {Object} item The armor item
   * @param {Object} context The sheet context
   * @returns {Object} The processed armor item
   */
  static armor(item, context) {
    item.attachedHistories = (item.system.attachedHistories || [])
      .map(histId => context.items.find(i => i._id === histId))
      .filter(h => h);
    return item;
  }

  /**
   * Process all items and categorize them
   * @param {Array} items The items to process
   * @returns {Object} Categorized items
   */
  static processItems(items) {
    const categories = {
      weapons: [],
      armor: [],
      gear: [],
      ammunition: [],
      characteristics: [],
      demeanours: [],
      criticalEffects: [],
      talents: [],
      traits: [],
      specialties: [],
      chapters: [],
      implants: [],
      cybernetics: [],
      psychicPowers: []
    };

    const loadedAmmoIds = new Set();
    const context = { items };

    for (const item of items) {
      item.img = item.img || 'icons/svg/item-bag.svg';

      switch (item.type) {
        case 'weapon':
          categories.weapons.push(this.weapon(item, context));
          if (item.loadedAmmoItem) loadedAmmoIds.add(item.system.loadedAmmo);
          break;
        case 'armor':
          categories.armor.push(this.armor(item, context));
          break;
        case 'gear':
          categories.gear.push(item);
          break;
        case 'weapon-upgrade':
          categories.gear.push(item);
          break;
        case 'characteristic':
          categories.characteristics.push(item);
          break;
        case 'demeanour':
          categories.demeanours.push(item);
          break;
        case 'critical-effect':
          categories.criticalEffects.push(item);
          break;
        case 'talent':
          categories.talents.push(item);
          break;
        case 'trait':
          categories.traits.push(item);
          break;
        case 'specialty':
          categories.specialties.push(item);
          break;
        case 'chapter':
          categories.chapters.push(item);
          break;
        case 'implant':
          categories.implants.push(item);
          break;
        case 'cybernetic':
          categories.cybernetics.push(item);
          break;
        case 'psychic-power':
          categories.psychicPowers.push(item);
          break;
      }
    }

    // Add unloaded ammunition
    for (const item of items) {
      if (item.type === 'ammunition' && !loadedAmmoIds.has(item._id)) {
        categories.ammunition.push(item);
      }
    }

    // Sort talents by name (numeric option handles "Psy Rating 3" vs "Psy Rating 10")
    categories.talents.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Group duplicate traits and add count/multiplier
    categories.traits = this.groupTraits(categories.traits);

    return categories;
  }

  /**
   * Group duplicate traits and add count/multiplier display
   * @param {Array} traits The trait items
   * @returns {Array} Grouped traits with count
   */
  static groupTraits(traits) {
    const grouped = new Map();
    
    for (const trait of traits) {
      const key = trait.name;
      if (grouped.has(key)) {
        const existing = grouped.get(key);
        existing.count++;
        existing.ids.push(trait._id);
        // Update multiplier if it's an Unnatural Characteristic
        if (trait.system.modifiers?.length > 0) {
          const mod = trait.system.modifiers[0];
          if (mod.effectType === 'characteristic-bonus' && mod.modifier?.startsWith('x')) {
            existing.multiplier = existing.count + 1;
          }
        }
      } else {
        grouped.set(key, {
          ...trait,
          count: 1,
          ids: [trait._id],
          multiplier: null
        });
        // Check if it's an Unnatural Characteristic
        if (trait.system.modifiers?.length > 0) {
          const mod = trait.system.modifiers[0];
          if (mod.effectType === 'characteristic-bonus' && mod.modifier?.startsWith('x')) {
            grouped.get(key).multiplier = 2;
          }
        }
      }
    }
    
    return Array.from(grouped.values());
  }
}
