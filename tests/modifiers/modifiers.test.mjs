import { jest } from '@jest/globals';
import '../setup.mjs';
import { ModifierHelper } from '../../src/module/helpers/modifiers.mjs';
import { MODIFIER_TYPES, EFFECT_TYPES, CHARACTERISTICS, CHARACTERISTIC_LABELS } from '../../src/module/helpers/constants.mjs';
import { DWConfig } from '../../src/module/helpers/config.mjs';

describe('ModifierHelper', () => {
  let mockActor;

  beforeEach(() => {
    mockActor = {
      system: {
        modifiers: []
      },
      update: jest.fn()
    };
  });

  describe('createModifier', () => {
    it('creates new modifier with default values', async () => {
      await ModifierHelper.createModifier(mockActor);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.modifiers': expect.arrayContaining([
          expect.objectContaining({
            name: 'New Modifier',
            modifier: '0',
            type: MODIFIER_TYPES.UNTYPED,
            modifierType: 'constant',
            effectType: EFFECT_TYPES.CHARACTERISTIC,
            valueAffected: '',
            enabled: true,
            source: 'Actor'
          })
        ])
      });
    });

    it('generates unique ID for new modifier', async () => {
      await ModifierHelper.createModifier(mockActor);

      const modifiers = mockActor.update.mock.calls[0][0]['system.modifiers'];
      expect(modifiers[0]._id).toBeDefined();
      expect(typeof modifiers[0]._id).toBe('string');
    });

    it('preserves existing modifiers', async () => {
      mockActor.system.modifiers = [
        { _id: 'existing1', name: 'Existing Modifier' }
      ];

      await ModifierHelper.createModifier(mockActor);

      const modifiers = mockActor.update.mock.calls[0][0]['system.modifiers'];
      expect(modifiers).toHaveLength(2);
      expect(modifiers[0]._id).toBe('existing1');
    });

    it('handles null modifiers array', async () => {
      mockActor.system.modifiers = null;

      await ModifierHelper.createModifier(mockActor);

      expect(mockActor.update).toHaveBeenCalled();
    });
  });

  describe('deleteModifier', () => {
    beforeEach(() => {
      mockActor.system.modifiers = [
        { _id: 'mod1', name: 'Modifier 1' },
        { _id: 'mod2', name: 'Modifier 2' },
        { _id: 'mod3', name: 'Modifier 3' }
      ];
    });

    it('deletes specified modifier', async () => {
      await ModifierHelper.deleteModifier(mockActor, 'mod2');

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.modifiers': [
          { _id: 'mod1', name: 'Modifier 1' },
          { _id: 'mod3', name: 'Modifier 3' }
        ]
      });
    });

    it('handles non-existent modifier ID', async () => {
      await ModifierHelper.deleteModifier(mockActor, 'nonexistent');

      const modifiers = mockActor.update.mock.calls[0][0]['system.modifiers'];
      expect(modifiers).toHaveLength(3);
    });

    it('handles null modifiers array', async () => {
      mockActor.system.modifiers = null;

      await ModifierHelper.deleteModifier(mockActor, 'mod1');

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.modifiers': []
      });
    });
  });

  describe('toggleModifierEnabled', () => {
    beforeEach(() => {
      mockActor.system.modifiers = [
        { _id: 'mod1', name: 'Modifier 1', enabled: true },
        { _id: 'mod2', name: 'Modifier 2', enabled: false }
      ];
    });

    it('toggles enabled to disabled', async () => {
      await ModifierHelper.toggleModifierEnabled(mockActor, 'mod1');

      const modifiers = mockActor.update.mock.calls[0][0]['system.modifiers'];
      expect(modifiers[0].enabled).toBe(false);
    });

    it('toggles disabled to enabled', async () => {
      await ModifierHelper.toggleModifierEnabled(mockActor, 'mod2');

      const modifiers = mockActor.update.mock.calls[0][0]['system.modifiers'];
      expect(modifiers[1].enabled).toBe(true);
    });

    it('does not update if modifier not found', async () => {
      await ModifierHelper.toggleModifierEnabled(mockActor, 'nonexistent');

      expect(mockActor.update).not.toHaveBeenCalled();
    });
  });

  describe('editModifierDialog', () => {
    let mockDialog, mockHtml;

    beforeEach(() => {
      mockActor.system.modifiers = [
        {
          _id: 'mod1',
          name: 'Test Modifier',
          modifier: '10',
          type: MODIFIER_TYPES.UNTYPED,
          effectType: EFFECT_TYPES.CHARACTERISTIC,
          valueAffected: 'ws',
          enabled: true
        }
      ];

      mockHtml = {
        find: jest.fn((selector) => {
          if (selector === '[name="name"]') return { val: () => 'Updated Name' };
          if (selector === '[name="modifier"]') return { val: () => '20' };
          if (selector === '[name="type"]') return { val: () => MODIFIER_TYPES.CIRCUMSTANCE };
          if (selector === '[name="effectType"]') return { val: () => EFFECT_TYPES.SKILL };
          if (selector === '[name="valueAffected"]') return { val: () => 'acrobatics' };
          if (selector === '#effectType') {
            return {
              change: jest.fn((callback) => {
                mockHtml._effectTypeCallback = callback;
              })
            };
          }
          if (selector === '#valueAffectedGroup') {
            return {
              find: jest.fn(() => ({ remove: jest.fn() })),
              append: jest.fn()
            };
          }
          return { val: () => '', change: jest.fn() };
        })
      };

      global.Dialog = jest.fn(function(config) {
        this.render = jest.fn(() => {
          if (config.render) config.render(mockHtml);
        });
        mockDialog = this;
        mockDialog.config = config;
      });
    });

    it('returns early if modifier not found', async () => {
      await ModifierHelper.editModifierDialog(mockActor, 'nonexistent');
      expect(global.Dialog).not.toHaveBeenCalled();
    });

    it('opens dialog with modifier data', async () => {
      await ModifierHelper.editModifierDialog(mockActor, 'mod1');

      expect(global.Dialog).toHaveBeenCalled();
      const config = mockDialog.config;
      expect(config.title).toBe('Edit Modifier');
      expect(config.content).toContain('Test Modifier');
      expect(config.content).toContain('10');
    });

    it('saves modified data on save button', async () => {
      await ModifierHelper.editModifierDialog(mockActor, 'mod1');

      await mockDialog.config.buttons.save.callback(mockHtml);

      expect(mockActor.update).toHaveBeenCalledWith({
        'system.modifiers': [
          expect.objectContaining({
            _id: 'mod1',
            name: 'Updated Name',
            modifier: '20',
            type: MODIFIER_TYPES.CIRCUMSTANCE,
            effectType: EFFECT_TYPES.SKILL,
            valueAffected: 'acrobatics'
          })
        ]
      });
    });

    it('registers effect type change handler', async () => {
      await ModifierHelper.editModifierDialog(mockActor, 'mod1');
      mockDialog.config.render(mockHtml);

      expect(mockHtml.find).toHaveBeenCalledWith('#effectType');
    });
  });

  describe('_getValueAffectedField', () => {
    it('returns characteristic select for characteristic effect type', () => {
      const modifier = { effectType: EFFECT_TYPES.CHARACTERISTIC, valueAffected: 'ws' };
      const result = ModifierHelper._getValueAffectedField(modifier);

      expect(result).toContain('Select Characteristic');
      expect(result).toContain(CHARACTERISTICS.WS);
    });

    it('returns skill select for skill effect type', () => {
      const modifier = { effectType: EFFECT_TYPES.SKILL, valueAffected: 'acrobatics' };
      const result = ModifierHelper._getValueAffectedField(modifier);

      expect(result).toContain('Select Skill');
    });

    it('returns text input for initiative effect type', () => {
      const modifier = { effectType: EFFECT_TYPES.INITIATIVE, valueAffected: '' };
      const result = ModifierHelper._getValueAffectedField(modifier);

      expect(result).toContain('text');
      expect(result).toContain('acrobatics');
    });

    it('returns text input for wounds effect type', () => {
      const modifier = { effectType: EFFECT_TYPES.WOUNDS, valueAffected: '' };
      const result = ModifierHelper._getValueAffectedField(modifier);

      expect(result).toContain('text');
      expect(result).toContain('acrobatics');
    });

    it('returns text input for other effect types', () => {
      const modifier = { effectType: 'other', valueAffected: 'custom' };
      const result = ModifierHelper._getValueAffectedField(modifier);

      expect(result).toContain('custom');
      expect(result).toContain('acrobatics');
    });
  });

  describe('_getCharacteristicSelect', () => {
    it('generates select with all characteristics', () => {
      const result = ModifierHelper._getCharacteristicSelect();

      expect(result).toContain('Select Characteristic');
      expect(result).toContain(CHARACTERISTICS.WS);
      expect(result).toContain(CHARACTERISTICS.BS);
      expect(result).toContain(CHARACTERISTICS.STR);
      expect(result).toContain(CHARACTERISTICS.TG);
      expect(result).toContain(CHARACTERISTICS.AG);
      expect(result).toContain(CHARACTERISTICS.INT);
      expect(result).toContain(CHARACTERISTICS.PER);
      expect(result).toContain(CHARACTERISTICS.WIL);
      expect(result).toContain(CHARACTERISTICS.FS);
    });

    it('marks selected characteristic', () => {
      const result = ModifierHelper._getCharacteristicSelect('ws');

      expect(result).toContain(`value="${CHARACTERISTICS.WS}" selected`);
    });

    it('includes characteristic labels', () => {
      const result = ModifierHelper._getCharacteristicSelect();

      expect(result).toContain(CHARACTERISTIC_LABELS.ws);
      expect(result).toContain(CHARACTERISTIC_LABELS.bs);
    });
  });

  describe('_getSkillSelect', () => {
    it('generates select with all skills', () => {
      const result = ModifierHelper._getSkillSelect();

      expect(result).toContain('Select Skill');
      expect(result).toContain('<select name="valueAffected">');
      expect(result).toContain('</select>');
    });

    it('marks selected skill', () => {
      const result = ModifierHelper._getSkillSelect('acrobatics');

      expect(result).toContain('value="acrobatics" selected');
    });

    it('includes all skills from config', () => {
      const result = ModifierHelper._getSkillSelect();

      for (const key of Object.keys(DWConfig.Skills)) {
        expect(result).toContain(`value="${key}"`);
      }
    });
  });
});
