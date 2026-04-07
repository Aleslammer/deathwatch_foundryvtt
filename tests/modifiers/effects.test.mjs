import { jest } from '@jest/globals';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../../src/module/helpers/effects.mjs';

describe('Effects', () => {
  describe('onManageActiveEffect', () => {
    let mockOwner, mockEvent, mockEffect;

    beforeEach(() => {
      mockEffect = {
        sheet: { render: jest.fn() },
        delete: jest.fn(),
        update: jest.fn(),
        disabled: false
      };

      mockOwner = {
        uuid: 'Actor.test123',
        effects: {
          get: jest.fn(() => mockEffect)
        },
        createEmbeddedDocuments: jest.fn()
      };

      mockEvent = {
        preventDefault: jest.fn(),
        currentTarget: {
          dataset: { action: 'create' },
          closest: jest.fn(() => ({
            dataset: { effectId: 'effect123', effectType: 'temporary' }
          }))
        }
      };
    });

    it('prevents default event behavior', () => {
      onManageActiveEffect(mockEvent, mockOwner);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('creates new temporary effect', () => {
      mockEvent.currentTarget.dataset.action = 'create';
      onManageActiveEffect(mockEvent, mockOwner);
      expect(mockOwner.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [{
        label: 'New Effect',
        icon: 'icons/svg/aura.svg',
        origin: 'Actor.test123',
        'duration.rounds': 1,
        disabled: false
      }]);
    });

    it('creates new passive effect', () => {
      mockEvent.currentTarget.closest = jest.fn(() => ({
        dataset: { effectId: null, effectType: 'passive' }
      }));
      mockEvent.currentTarget.dataset.action = 'create';
      onManageActiveEffect(mockEvent, mockOwner);
      expect(mockOwner.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [{
        label: 'New Effect',
        icon: 'icons/svg/aura.svg',
        origin: 'Actor.test123',
        'duration.rounds': undefined,
        disabled: false
      }]);
    });

    it('creates new inactive effect', () => {
      mockEvent.currentTarget.closest = jest.fn(() => ({
        dataset: { effectId: null, effectType: 'inactive' }
      }));
      mockEvent.currentTarget.dataset.action = 'create';
      onManageActiveEffect(mockEvent, mockOwner);
      expect(mockOwner.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [{
        label: 'New Effect',
        icon: 'icons/svg/aura.svg',
        origin: 'Actor.test123',
        'duration.rounds': undefined,
        disabled: true
      }]);
    });

    it('edits existing effect', () => {
      mockEvent.currentTarget.dataset.action = 'edit';
      onManageActiveEffect(mockEvent, mockOwner);
      expect(mockEffect.sheet.render).toHaveBeenCalledWith(true);
    });

    it('deletes existing effect', () => {
      mockEvent.currentTarget.dataset.action = 'delete';
      onManageActiveEffect(mockEvent, mockOwner);
      expect(mockEffect.delete).toHaveBeenCalled();
    });

    it('toggles effect disabled state', () => {
      mockEvent.currentTarget.dataset.action = 'toggle';
      mockEffect.disabled = false;
      onManageActiveEffect(mockEvent, mockOwner);
      expect(mockEffect.update).toHaveBeenCalledWith({ disabled: true });
    });
  });

  describe('prepareActiveEffectCategories', () => {
    it('categorizes temporary effects', () => {
      const effects = [{
        _getSourceName: jest.fn(),
        disabled: false,
        isTemporary: true
      }];

      const result = prepareActiveEffectCategories(effects);

      expect(result.temporary.effects).toHaveLength(1);
      expect(result.passive.effects).toHaveLength(0);
      expect(result.inactive.effects).toHaveLength(0);
    });

    it('categorizes passive effects', () => {
      const effects = [{
        _getSourceName: jest.fn(),
        disabled: false,
        isTemporary: false
      }];

      const result = prepareActiveEffectCategories(effects);

      expect(result.temporary.effects).toHaveLength(0);
      expect(result.passive.effects).toHaveLength(1);
      expect(result.inactive.effects).toHaveLength(0);
    });

    it('categorizes inactive effects', () => {
      const effects = [{
        _getSourceName: jest.fn(),
        disabled: true,
        isTemporary: false
      }];

      const result = prepareActiveEffectCategories(effects);

      expect(result.temporary.effects).toHaveLength(0);
      expect(result.passive.effects).toHaveLength(0);
      expect(result.inactive.effects).toHaveLength(1);
    });

    it('categorizes mixed effects', () => {
      const effects = [
        { _getSourceName: jest.fn(), disabled: false, isTemporary: true },
        { _getSourceName: jest.fn(), disabled: false, isTemporary: false },
        { _getSourceName: jest.fn(), disabled: true, isTemporary: false }
      ];

      const result = prepareActiveEffectCategories(effects);

      expect(result.temporary.effects).toHaveLength(1);
      expect(result.passive.effects).toHaveLength(1);
      expect(result.inactive.effects).toHaveLength(1);
    });

    it('calls _getSourceName on each effect', () => {
      const effects = [
        { _getSourceName: jest.fn(), disabled: false, isTemporary: false }
      ];

      prepareActiveEffectCategories(effects);

      expect(effects[0]._getSourceName).toHaveBeenCalled();
    });

    it('returns correct category structure', () => {
      const result = prepareActiveEffectCategories([]);

      expect(result).toHaveProperty('temporary');
      expect(result).toHaveProperty('passive');
      expect(result).toHaveProperty('inactive');
      expect(result.temporary.type).toBe('temporary');
      expect(result.temporary.label).toBe('Temporary Effects');
      expect(result.passive.type).toBe('passive');
      expect(result.passive.label).toBe('Passive Effects');
      expect(result.inactive.type).toBe('inactive');
      expect(result.inactive.label).toBe('Inactive Effects');
    });
  });
});
