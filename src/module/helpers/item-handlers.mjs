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
   * Handle characteristic items (separate demeanours)
   * @param {Object} item The characteristic item
   * @returns {string} The category ('demeanour' or 'characteristic')
   */
  static characteristic(item) {
    const demeanourNames = [
      'Zeal', 'Thirst', 'Lion', 'Russ', 'Glory', 'Codex',
      'Calculating', 'Gregarious', 'Hot-Blooded', 'Studious',
      'Taciturn', 'Pious', 'Stoic', 'Scornful', 'Ambitious', 'Proud'
    ];
    
    const isDemeanour = demeanourNames.some(name => item.name?.includes(name));
    return isDemeanour ? 'demeanour' : 'characteristic';
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
      spells: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] }
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
        case 'characteristic':
          const category = this.characteristic(item);
          categories[category === 'demeanour' ? 'demeanours' : 'characteristics'].push(item);
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
        case 'spell':
          if (item.system.spellLevel !== undefined) {
            categories.spells[item.system.spellLevel].push(item);
          }
          break;
      }
    }

    // Add unloaded ammunition
    for (const item of items) {
      if (item.type === 'ammunition' && !loadedAmmoIds.has(item._id)) {
        categories.ammunition.push(item);
      }
    }

    return categories;
  }
}
