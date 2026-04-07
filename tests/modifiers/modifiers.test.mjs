import { jest } from '@jest/globals';
import { ModifierHelper } from '../../src/module/helpers/character/modifiers.mjs';
import { MODIFIER_TYPES, EFFECT_TYPES, CHARACTERISTICS, CHARACTERISTIC_LABELS } from "../../src/module/helpers/constants/index.mjs";
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
    });

    it('returns early if modifier not found', async () => {
      foundry.applications.api.DialogV2.wait.mockResolvedValue(null);
      await ModifierHelper.editModifierDialog(mockActor, 'nonexistent');
      expect(foundry.applications.api.DialogV2.wait).not.toHaveBeenCalled();
    });

    it('opens dialog with modifier data', async () => {
      foundry.applications.api.DialogV2.wait.mockResolvedValue('cancel');
      await ModifierHelper.editModifierDialog(mockActor, 'mod1');

      expect(foundry.applications.api.DialogV2.wait).toHaveBeenCalledTimes(1);
      const callArgs = foundry.applications.api.DialogV2.wait.mock.calls[0][0];
      expect(callArgs.window.title).toBe('Edit Modifier');
      expect(callArgs.content).toContain('Test Modifier');
      expect(callArgs.content).toContain('10');
    });

    it('saves modified data on save button callback', async () => {
      foundry.applications.api.DialogV2.wait.mockImplementation(async (config) => {
        const saveBtn = config.buttons.find(b => b.action === 'save');
        const mockElement = {
          querySelector: (sel) => {
            if (sel === '[name="name"]') return { value: 'Updated Name' };
            if (sel === '[name="modifier"]') return { value: '20' };
            if (sel === '[name="type"]') return { value: MODIFIER_TYPES.CIRCUMSTANCE };
            if (sel === '[name="effectType"]') return { value: EFFECT_TYPES.SKILL };
            if (sel === '[name="valueAffected"]') return { value: 'acrobatics' };
            return null;
          }
        };
        return saveBtn.callback(null, null, { element: mockElement });
      });

      await ModifierHelper.editModifierDialog(mockActor, 'mod1');

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

    it('does not save when cancel is selected', async () => {
      foundry.applications.api.DialogV2.wait.mockResolvedValue('cancel');
      await ModifierHelper.editModifierDialog(mockActor, 'mod1');
      expect(mockActor.update).not.toHaveBeenCalled();
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
      expect(result).toContain('name="valueAffected"');
    });

    it('returns text input for wounds effect type', () => {
      const modifier = { effectType: EFFECT_TYPES.WOUNDS, valueAffected: '' };
      const result = ModifierHelper._getValueAffectedField(modifier);

      expect(result).toContain('text');
      expect(result).toContain('name="valueAffected"');
    });

    it('returns text input for other effect types', () => {
      const modifier = { effectType: 'other', valueAffected: 'custom' };
      const result = ModifierHelper._getValueAffectedField(modifier);

      expect(result).toContain('custom');
      expect(result).toContain('name="valueAffected"');
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
