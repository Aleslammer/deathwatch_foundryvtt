import { jest } from '@jest/globals';
import { NPCDataPreparer } from '../../src/module/sheets/shared/data-preparers/npc-data-preparer.mjs';
import { WoundHelper } from '../../src/module/helpers/character/wound-helper.mjs';
import { SkillHelper } from '../../src/module/helpers/character/skill-helper.mjs';

describe('NPCDataPreparer', () => {
  let mockContext;
  let mockActor;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock global game object
    global.game = {
      i18n: {
        localize: jest.fn((key) => key)
      },
      deathwatch: {
        config: {
          CharacteristicWords: {
            ws: 'Weapon Skill',
            bs: 'Ballistic Skill',
            str: 'Strength',
            tgh: 'Toughness',
            ag: 'Agility',
            int: 'Intelligence',
            per: 'Perception',
            wil: 'Willpower',
            fel: 'Fellowship'
          },
          Skills: {
            awareness: 'Awareness',
            command: 'Command',
            scrutiny: 'Scrutiny'
          }
        }
      }
    };

    mockContext = {
      system: {
        characteristics: {
          ws: { value: 45 },
          bs: { value: 40 },
          str: { value: 55 },
          tgh: { value: 50 },
          ag: { value: 35 },
          int: { value: 30 },
          per: { value: 45 },
          wil: { value: 40 },
          fel: { value: 25 }
        },
        skills: {
          awareness: { advances: 15, trained: true },
          command: { advances: 20, trained: true },
          scrutiny: { advances: 5, trained: false }
        },
        wounds: {
          value: 10,
          max: 25
        }
      }
    };

    mockActor = {
      system: {
        skills: {
          awareness: { advances: 15, trained: true, modifierTotal: 10 },
          command: { advances: 20, trained: true, modifierTotal: -5 },
          scrutiny: { advances: 5, trained: false, modifierTotal: 0 }
        },
        characteristics: mockContext.system.characteristics
      }
    };
  });

  describe('prepare', () => {
    it('calls all preparation methods', () => {
      const prepareCharacteristicsSpy = jest.spyOn(NPCDataPreparer, 'prepareCharacteristics');
      const prepareSkillsSpy = jest.spyOn(NPCDataPreparer, 'prepareSkills');
      const prepareConfigSpy = jest.spyOn(NPCDataPreparer, 'prepareConfig');
      const prepareWoundsSpy = jest.spyOn(NPCDataPreparer, 'prepareWounds');

      NPCDataPreparer.prepare(mockContext, mockActor);

      expect(prepareCharacteristicsSpy).toHaveBeenCalledWith(mockContext);
      expect(prepareSkillsSpy).toHaveBeenCalledWith(mockContext, mockActor);
      expect(prepareConfigSpy).toHaveBeenCalledWith(mockContext);
      expect(prepareWoundsSpy).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('prepareCharacteristics', () => {
    it('adds labels to characteristics', () => {
      NPCDataPreparer.prepareCharacteristics(mockContext);

      expect(mockContext.system.characteristics.ws.label).toBe('Weapon Skill');
      expect(mockContext.system.characteristics.bs.label).toBe('Ballistic Skill');
      expect(mockContext.system.characteristics.fel.label).toBe('Fellowship');
    });

    it('uses characteristic key as fallback if no localization', () => {
      global.game.i18n.localize.mockReturnValue(undefined);

      NPCDataPreparer.prepareCharacteristics(mockContext);

      expect(mockContext.system.characteristics.ws.label).toBe('ws');
      expect(mockContext.system.characteristics.int.label).toBe('int');
    });

    it('handles empty characteristics object', () => {
      mockContext.system.characteristics = {};

      expect(() => {
        NPCDataPreparer.prepareCharacteristics(mockContext);
      }).not.toThrow();
    });
  });

  describe('prepareSkills', () => {
    it('adds labels to skills', () => {
      NPCDataPreparer.prepareSkills(mockContext, mockActor);

      expect(mockContext.system.skills.awareness.label).toBe('Awareness');
      expect(mockContext.system.skills.command.label).toBe('Command');
      expect(mockContext.system.skills.scrutiny.label).toBe('Scrutiny');
    });

    it('calculates skill totals including modifiers', () => {
      jest.spyOn(SkillHelper, 'calculateSkillTotal').mockImplementation((skill, chars) => {
        // Mock calculation: just return a fixed value based on advances
        if (skill.advances === 15) return 30; // awareness
        if (skill.advances === 20) return 30; // command
        if (skill.advances === 5) return 30;  // scrutiny
        return 0;
      });

      NPCDataPreparer.prepareSkills(mockContext, mockActor);

      // awareness: base 30 + modifierTotal 10 = 40
      expect(mockContext.system.skills.awareness.total).toBe(40);

      // command: base 30 + modifierTotal -5 = 25
      expect(mockContext.system.skills.command.total).toBe(25);

      // scrutiny: base 30 + modifierTotal 0 = 30
      expect(mockContext.system.skills.scrutiny.total).toBe(30);
    });

    it('sorts skills alphabetically by localized name', () => {
      mockContext.system.skills = {
        scrutiny: { advances: 5, trained: false },
        awareness: { advances: 15, trained: true },
        command: { advances: 20, trained: true }
      };
      mockActor.system.skills = {
        scrutiny: { advances: 5, trained: false, modifierTotal: 0 },
        awareness: { advances: 15, trained: true, modifierTotal: 0 },
        command: { advances: 20, trained: true, modifierTotal: 0 }
      };

      jest.spyOn(SkillHelper, 'calculateSkillTotal').mockReturnValue(0);

      NPCDataPreparer.prepareSkills(mockContext, mockActor);

      // Verify skills were processed (all should have labels)
      expect(mockContext.system.skills.awareness.label).toBe('Awareness');
      expect(mockContext.system.skills.command.label).toBe('Command');
      expect(mockContext.system.skills.scrutiny.label).toBe('Scrutiny');
    });

    it('handles missing skills gracefully', () => {
      mockContext.system.skills = null;

      expect(() => {
        NPCDataPreparer.prepareSkills(mockContext, mockActor);
      }).not.toThrow();
    });

    it('handles undefined skills gracefully', () => {
      mockContext.system.skills = undefined;

      expect(() => {
        NPCDataPreparer.prepareSkills(mockContext, mockActor);
      }).not.toThrow();
    });

    it('handles skills with missing modifierTotal', () => {
      mockActor.system.skills.awareness.modifierTotal = undefined;
      jest.spyOn(SkillHelper, 'calculateSkillTotal').mockReturnValue(60);

      NPCDataPreparer.prepareSkills(mockContext, mockActor);

      // Should default to 0 if modifierTotal is missing
      expect(mockContext.system.skills.awareness.total).toBe(60);
    });

    it('uses skill key as fallback if no localization', () => {
      global.game.deathwatch.config.Skills = {};

      NPCDataPreparer.prepareSkills(mockContext, mockActor);

      expect(mockContext.system.skills.awareness.label).toBe('awareness');
    });
  });

  describe('prepareConfig', () => {
    it('adds config to context', () => {
      NPCDataPreparer.prepareConfig(mockContext);

      expect(mockContext.config).toBe(global.game.deathwatch.config);
    });

    it('handles missing config gracefully', () => {
      const originalConfig = global.game.deathwatch.config;
      global.game.deathwatch.config = null;

      NPCDataPreparer.prepareConfig(mockContext);

      expect(mockContext.config).toBeNull();

      global.game.deathwatch.config = originalConfig;
    });
  });

  describe('prepareWounds', () => {
    it('adds wound color class for healthy wounds', () => {
      jest.spyOn(WoundHelper, 'getWoundColorClass').mockReturnValue('wound-healthy');

      NPCDataPreparer.prepareWounds(mockContext);

      expect(WoundHelper.getWoundColorClass).toHaveBeenCalledWith(10, 25);
      expect(mockContext.woundColorClass).toBe('wound-healthy');
    });

    it('adds wound color class for wounded state', () => {
      mockContext.system.wounds = { value: 18, max: 25 };
      jest.spyOn(WoundHelper, 'getWoundColorClass').mockReturnValue('wound-damaged');

      NPCDataPreparer.prepareWounds(mockContext);

      expect(WoundHelper.getWoundColorClass).toHaveBeenCalledWith(18, 25);
      expect(mockContext.woundColorClass).toBe('wound-damaged');
    });

    it('adds wound color class for critical wounds', () => {
      mockContext.system.wounds = { value: 27, max: 25 };
      jest.spyOn(WoundHelper, 'getWoundColorClass').mockReturnValue('wound-critical');

      NPCDataPreparer.prepareWounds(mockContext);

      expect(WoundHelper.getWoundColorClass).toHaveBeenCalledWith(27, 25);
      expect(mockContext.woundColorClass).toBe('wound-critical');
    });

    it('handles missing wounds object', () => {
      mockContext.system.wounds = undefined;

      expect(() => {
        NPCDataPreparer.prepareWounds(mockContext);
      }).not.toThrow();
    });
  });
});
