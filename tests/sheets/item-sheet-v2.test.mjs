import { jest } from '@jest/globals';
import { DeathwatchItemSheetV2 } from '../../src/module/sheets/item-sheet-v2.mjs';
import { MODIFIER_TYPES } from '../../src/module/helpers/constants/modifier-constants.mjs';

describe('DeathwatchItemSheetV2', () => {
  let sheet;
  let mockItem;

  beforeEach(() => {
    jest.clearAllMocks();

    mockItem = {
      _id: 'item1',
      type: 'weapon',
      name: 'Test Weapon',
      img: 'icon.png',
      system: {
        description: 'Test description',
        modifiers: [],
        attachedQualities: [],
        attachedHistories: [],
        dmg: '1d10+5',
        penetration: 4
      },
      flags: {},
      parent: null,
      actor: null,
      update: jest.fn()
    };

    sheet = Object.create(DeathwatchItemSheetV2.prototype);
    sheet.item = mockItem;
    sheet.document = mockItem;
  });

  describe('_onModifierCreate', () => {
    it('creates new modifier with default values', async () => {
      mockItem.system.modifiers = [];
      await DeathwatchItemSheetV2._onModifierCreate.call(sheet, {}, {});
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.modifiers': expect.arrayContaining([
          expect.objectContaining({
            name: 'New Modifier',
            modifier: '0',
            effectType: 'characteristic',
            enabled: true
          })
        ])
      });
    });

    it('appends to existing modifiers', async () => {
      mockItem.system.modifiers = [{ _id: 'existing', name: 'Existing' }];
      await DeathwatchItemSheetV2._onModifierCreate.call(sheet, {}, {});
      const call = mockItem.update.mock.calls[0][0];
      expect(call['system.modifiers']).toHaveLength(2);
      expect(call['system.modifiers'][0].name).toBe('Existing');
    });
  });

  describe('_onModifierDelete', () => {
    it('removes modifier by id', async () => {
      mockItem.system.modifiers = [
        { _id: 'mod-1', name: 'Modifier 1' },
        { _id: 'mod-2', name: 'Modifier 2' }
      ];
      const target = { dataset: { modifierId: 'mod-1' }, closest: jest.fn() };
      await DeathwatchItemSheetV2._onModifierDelete.call(sheet, {}, target);
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.modifiers': [{ _id: 'mod-2', name: 'Modifier 2' }]
      });
    });
  });

  describe('_onToggleModifierEnabled', () => {
    it('toggles modifier enabled state', async () => {
      mockItem.system.modifiers = [
        { _id: 'mod-1', name: 'Modifier 1', enabled: true }
      ];
      const target = { dataset: { modifierId: 'mod-1' }, closest: jest.fn() };
      await DeathwatchItemSheetV2._onToggleModifierEnabled.call(sheet, {}, target);
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.modifiers': [
          { _id: 'mod-1', name: 'Modifier 1', enabled: false }
        ]
      });
    });
  });

  describe('_onHistoryRemove', () => {
    it('removes history from attached histories', async () => {
      mockItem.system.attachedHistories = ['hist-1', 'hist-2'];
      const target = { dataset: { historyId: 'hist-1' } };
      await DeathwatchItemSheetV2._onHistoryRemove.call(sheet, {}, target);
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedHistories': ['hist-2']
      });
    });
  });

  describe('_onQualityRemove', () => {
    it('removes quality (string format)', async () => {
      mockItem.system.attachedQualities = ['qual-1', 'qual-2'];
      const target = { dataset: { qualityId: 'qual-1' } };
      await DeathwatchItemSheetV2._onQualityRemove.call(sheet, {}, target);
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedQualities': ['qual-2']
      });
    });

    it('removes quality (object format)', async () => {
      mockItem.system.attachedQualities = [
        { id: 'qual-1', value: '4' },
        { id: 'qual-2', value: '2' }
      ];
      const target = { dataset: { qualityId: 'qual-1' } };
      await DeathwatchItemSheetV2._onQualityRemove.call(sheet, {}, target);
      expect(mockItem.update).toHaveBeenCalledWith({
        'system.attachedQualities': [{ id: 'qual-2', value: '2' }]
      });
    });
  });

  describe('_prepareSpecialtyData', () => {
    it('adds characteristic labels', () => {
      const context = { system: { rankCosts: {} } };
      sheet._prepareSpecialtyData(context);
      expect(context.characteristics.ws).toBe('Weapon Skill');
      expect(context.characteristics.fs).toBe('Fellowship');
    });

    it('initializes empty rankCosts if missing', () => {
      const context = { system: {} };
      sheet._prepareSpecialtyData(context);
      expect(context.system.rankCosts['1']).toEqual({ skills: {}, talents: {} });
      expect(context.system.rankCosts['8']).toEqual({ skills: {}, talents: {} });
    });
  });

  describe('_prepareArmorData', () => {
    it('populates attached histories from actor', () => {
      mockItem.system.attachedHistories = ['hist-1'];
      const mockActor = {
        items: {
          get: jest.fn(() => ({ id: 'hist-1', name: 'Test History', img: 'test.png' }))
        }
      };
      const context = { system: mockItem.system };
      sheet._prepareArmorData(context, mockActor);
      expect(context.system.attachedHistories).toHaveLength(1);
      expect(context.system.attachedHistories[0].name).toBe('Test History');
    });

    it('sets empty array without actor', () => {
      const context = { system: mockItem.system };
      sheet._prepareArmorData(context, null);
      expect(context.system.attachedHistories).toEqual([]);
    });
  });

  describe('getDefaultModifierType', () => {
    describe('Type: Talent', () => {
      it('should return MODIFIER_TYPES.TALENT for talent items', () => {
        mockItem.type = 'talent';
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.TALENT);
      });
    });

    describe('Type: Trait', () => {
      it('should return MODIFIER_TYPES.TRAIT for trait items', () => {
        mockItem.type = 'trait';
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.TRAIT);
      });
    });

    describe('Type: Armor', () => {
      it('should return MODIFIER_TYPES.EQUIPMENT for armor items', () => {
        mockItem.type = 'armor';
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.EQUIPMENT);
      });
    });

    describe('Type: Gear', () => {
      it('should return MODIFIER_TYPES.CHAPTER for chapter trapping gear (key contains "chapter-")', () => {
        mockItem.type = 'gear';
        mockItem.system.key = 'chapter-trapping-relic';
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.CHAPTER);
      });

      it('should return MODIFIER_TYPES.CHAPTER for gear with "chapter-" at start of key', () => {
        mockItem.type = 'gear';
        mockItem.system.key = 'chapter-blessed-icon';
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.CHAPTER);
      });

      it('should return MODIFIER_TYPES.EQUIPMENT for non-chapter gear', () => {
        mockItem.type = 'gear';
        mockItem.system.key = 'standard-gear';
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.EQUIPMENT);
      });

      it('should return MODIFIER_TYPES.EQUIPMENT for gear with undefined key', () => {
        mockItem.type = 'gear';
        mockItem.system.key = undefined;
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.EQUIPMENT);
      });
    });

    describe('Type: Unknown', () => {
      it('should return MODIFIER_TYPES.CIRCUMSTANCE for unknown item types', () => {
        mockItem.type = 'unknown-type';
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.CIRCUMSTANCE);
      });

      it('should return MODIFIER_TYPES.CIRCUMSTANCE for undefined item type', () => {
        mockItem.type = undefined;
        const result = sheet.getDefaultModifierType();
        expect(result).toBe(MODIFIER_TYPES.CIRCUMSTANCE);
      });
    });
  });
});
