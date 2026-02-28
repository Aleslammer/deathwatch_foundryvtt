import { jest } from '@jest/globals';
import './setup.mjs';
import { ItemHandlers } from '../src/module/helpers/item-handlers.mjs';

describe('ItemHandlers', () => {
  describe('weapon', () => {
    it('populates loadedAmmoItem when loadedAmmo is set', () => {
      const ammo = { _id: 'ammo1', type: 'ammunition', name: 'Bolter Rounds' };
      const weapon = { _id: 'weapon1', type: 'weapon', system: { loadedAmmo: 'ammo1' } };
      const context = { items: [weapon, ammo] };

      const result = ItemHandlers.weapon(weapon, context);

      expect(result.loadedAmmoItem).toEqual(ammo);
    });

    it('does not populate loadedAmmoItem when loadedAmmo is not set', () => {
      const weapon = { _id: 'weapon1', type: 'weapon', system: {} };
      const context = { items: [weapon] };

      const result = ItemHandlers.weapon(weapon, context);

      expect(result.loadedAmmoItem).toBeUndefined();
    });
  });

  describe('armor', () => {
    it('populates attachedHistories array', () => {
      const history1 = { _id: 'hist1', type: 'armor-history', name: 'Battle-Scarred' };
      const history2 = { _id: 'hist2', type: 'armor-history', name: 'Blessed' };
      const armor = { 
        _id: 'armor1', 
        type: 'armor', 
        system: { attachedHistories: ['hist1', 'hist2'] } 
      };
      const context = { items: [armor, history1, history2] };

      const result = ItemHandlers.armor(armor, context);

      expect(result.attachedHistories).toHaveLength(2);
      expect(result.attachedHistories[0]).toEqual(history1);
      expect(result.attachedHistories[1]).toEqual(history2);
    });

    it('filters out missing histories', () => {
      const history1 = { _id: 'hist1', type: 'armor-history', name: 'Battle-Scarred' };
      const armor = { 
        _id: 'armor1', 
        type: 'armor', 
        system: { attachedHistories: ['hist1', 'missing'] } 
      };
      const context = { items: [armor, history1] };

      const result = ItemHandlers.armor(armor, context);

      expect(result.attachedHistories).toHaveLength(1);
      expect(result.attachedHistories[0]).toEqual(history1);
    });
  });

  describe('characteristic', () => {
    it('identifies demeanours by name', () => {
      const demeanours = [
        { name: 'Zeal of the Chapter' },
        { name: 'Thirst for Battle' },
        { name: 'Calculating' },
        { name: 'Gregarious' },
        { name: 'Hot-Blooded' },
        { name: 'Studious' },
        { name: 'Taciturn' },
        { name: 'Pious' },
        { name: 'Stoic' },
        { name: 'Scornful' },
        { name: 'Ambitious' },
        { name: 'Proud' }
      ];

      demeanours.forEach(item => {
        expect(ItemHandlers.characteristic(item)).toBe('demeanour');
      });
    });

    it('identifies non-demeanour characteristics', () => {
      const characteristics = [
        { name: 'Weapon Skill' },
        { name: 'Ballistic Skill' },
        { name: 'Other Characteristic' }
      ];

      characteristics.forEach(item => {
        expect(ItemHandlers.characteristic(item)).toBe('characteristic');
      });
    });
  });

  describe('processItems', () => {
    it('categorizes all item types correctly', () => {
      const items = [
        { _id: '1', type: 'weapon', system: {} },
        { _id: '2', type: 'armor', system: {} },
        { _id: '3', type: 'gear', system: {} },
        { _id: '4', type: 'ammunition', system: {} },
        { _id: '5', type: 'characteristic', name: 'Weapon Skill', system: {} },
        { _id: '6', type: 'characteristic', name: 'Calculating', system: {} },
        { _id: '7', type: 'critical-effect', system: {} },
        { _id: '8', type: 'talent', system: {} },
        { _id: '9', type: 'trait', system: {} },
        { _id: '10', type: 'specialty', system: {} },
        { _id: '11', type: 'characteristic-advance', system: {} },
        { _id: '12', type: 'chapter', system: {} },
        { _id: '13', type: 'spell', system: { spellLevel: 1 } }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.weapons).toHaveLength(1);
      expect(result.armor).toHaveLength(1);
      expect(result.gear).toHaveLength(1);
      expect(result.ammunition).toHaveLength(1);
      expect(result.characteristics).toHaveLength(1);
      expect(result.demeanours).toHaveLength(1);
      expect(result.criticalEffects).toHaveLength(1);
      expect(result.talents).toHaveLength(1);
      expect(result.traits).toHaveLength(1);
      expect(result.specialties).toHaveLength(1);
      expect(result.characteristicAdvances).toHaveLength(1);
      expect(result.chapters).toHaveLength(1);
      expect(result.spells[1]).toHaveLength(1);
    });

    it('excludes loaded ammunition from ammunition list', () => {
      const items = [
        { _id: 'ammo1', type: 'ammunition', system: {} },
        { _id: 'ammo2', type: 'ammunition', system: {} },
        { _id: 'weapon1', type: 'weapon', system: { loadedAmmo: 'ammo1' } }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.ammunition).toHaveLength(1);
      expect(result.ammunition[0]._id).toBe('ammo2');
    });

    it('processes weapon with loaded ammo', () => {
      const items = [
        { _id: 'ammo1', type: 'ammunition', name: 'Bolter Rounds', system: {} },
        { _id: 'weapon1', type: 'weapon', system: { loadedAmmo: 'ammo1' } }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.weapons[0].loadedAmmoItem).toBeDefined();
      expect(result.weapons[0].loadedAmmoItem.name).toBe('Bolter Rounds');
    });

    it('processes armor with attached histories', () => {
      const items = [
        { _id: 'hist1', type: 'armor-history', name: 'Battle-Scarred', system: {} },
        { _id: 'armor1', type: 'armor', system: { attachedHistories: ['hist1'] } }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.armor[0].attachedHistories).toHaveLength(1);
      expect(result.armor[0].attachedHistories[0].name).toBe('Battle-Scarred');
    });

    it('organizes spells by level', () => {
      const items = [
        { _id: 'spell1', type: 'spell', system: { spellLevel: 0 } },
        { _id: 'spell2', type: 'spell', system: { spellLevel: 1 } },
        { _id: 'spell3', type: 'spell', system: { spellLevel: 9 } }
      ];

      const result = ItemHandlers.processItems(items);

      expect(result.spells[0]).toHaveLength(1);
      expect(result.spells[1]).toHaveLength(1);
      expect(result.spells[9]).toHaveLength(1);
    });
  });
});
