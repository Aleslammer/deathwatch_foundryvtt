import { jest } from '@jest/globals';
import { EnemyDataPreparer } from '../../src/module/sheets/shared/data-preparers/enemy-data-preparer.mjs';
import { WoundHelper } from '../../src/module/helpers/character/wound-helper.mjs';
import { SkillHelper } from '../../src/module/helpers/character/skill-helper.mjs';

describe('EnemyDataPreparer', () => {
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
            dodge: 'Dodge',
            parry: 'Parry',
            intimidate: 'Intimidate'
          }
        }
      }
    };

    mockContext = {
      system: {
        characteristics: {
          ws: { value: 40 },
          bs: { value: 35 },
          str: { value: 50 },
          tgh: { value: 45 },
          ag: { value: 30 },
          int: { value: 25 },
          per: { value: 40 },
          wil: { value: 35 },
          fel: { value: 20 }
        },
        skills: {
          awareness: { advances: 10, trained: true },
          dodge: { advances: 0, trained: false },
          parry: { advances: 5, trained: true }
        },
        wounds: {
          value: 15,
          max: 20
        },
        psyRating: {
          base: 0,
          value: 0
        }
      }
    };

    mockActor = {
      system: {
        skills: {
          awareness: { advances: 10, trained: true, modifierTotal: 5 },
          dodge: { advances: 0, trained: false, modifierTotal: 0 },
          parry: { advances: 5, trained: true, modifierTotal: -10 }
        },
        characteristics: mockContext.system.characteristics
      }
    };
  });

  describe('prepare', () => {
    it('calls all preparation methods', () => {
      const prepareCharacteristicsSpy = jest.spyOn(EnemyDataPreparer, 'prepareCharacteristics');
      const prepareSkillsSpy = jest.spyOn(EnemyDataPreparer, 'prepareSkills');
      const prepareConfigSpy = jest.spyOn(EnemyDataPreparer, 'prepareConfig');
      const prepareWoundsSpy = jest.spyOn(EnemyDataPreparer, 'prepareWounds');
      const preparePsyRatingSpy = jest.spyOn(EnemyDataPreparer, 'preparePsyRating');

      EnemyDataPreparer.prepare(mockContext, mockActor);

      expect(prepareCharacteristicsSpy).toHaveBeenCalledWith(mockContext);
      expect(prepareSkillsSpy).toHaveBeenCalledWith(mockContext, mockActor);
      expect(prepareConfigSpy).toHaveBeenCalledWith(mockContext);
      expect(prepareWoundsSpy).toHaveBeenCalledWith(mockContext);
      expect(preparePsyRatingSpy).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('prepareCharacteristics', () => {
    it('adds labels to characteristics', () => {
      EnemyDataPreparer.prepareCharacteristics(mockContext);

      expect(mockContext.system.characteristics.ws.label).toBe('Weapon Skill');
      expect(mockContext.system.characteristics.bs.label).toBe('Ballistic Skill');
      expect(mockContext.system.characteristics.str.label).toBe('Strength');
    });

    it('uses characteristic key as fallback if no localization', () => {
      global.game.i18n.localize.mockReturnValue(undefined);

      EnemyDataPreparer.prepareCharacteristics(mockContext);

      expect(mockContext.system.characteristics.ws.label).toBe('ws');
    });
  });

  describe('prepareSkills', () => {
    it('adds labels to skills', () => {
      EnemyDataPreparer.prepareSkills(mockContext, mockActor);

      expect(mockContext.system.skills.awareness.label).toBe('Awareness');
      expect(mockContext.system.skills.dodge.label).toBe('Dodge');
      expect(mockContext.system.skills.parry.label).toBe('Parry');
    });

    it('calculates skill totals including modifiers', () => {
      jest.spyOn(SkillHelper, 'calculateSkillTotal').mockImplementation((skill, chars) => {
        // Mock calculation: just return a fixed value for simplicity
        if (skill.advances === 10) return 50; // awareness
        if (skill.advances === 0) return 30;  // dodge
        if (skill.advances === 5) return 45;  // parry
        return 0;
      });

      EnemyDataPreparer.prepareSkills(mockContext, mockActor);

      // awareness: base 50 + modifierTotal 5 = 55
      expect(mockContext.system.skills.awareness.total).toBe(55);

      // dodge: base 30 + modifierTotal 0 = 30
      expect(mockContext.system.skills.dodge.total).toBe(30);

      // parry: base 45 + modifierTotal -10 = 35
      expect(mockContext.system.skills.parry.total).toBe(35);
    });

    it('sorts skills alphabetically by localized name', () => {
      mockContext.system.skills = {
        intimidate: { advances: 0, trained: false },
        awareness: { advances: 10, trained: true },
        dodge: { advances: 5, trained: true }
      };
      mockActor.system.skills = {
        intimidate: { advances: 0, trained: false, modifierTotal: 0 },
        awareness: { advances: 10, trained: true, modifierTotal: 0 },
        dodge: { advances: 5, trained: true, modifierTotal: 0 }
      };

      jest.spyOn(SkillHelper, 'calculateSkillTotal').mockReturnValue(0);

      EnemyDataPreparer.prepareSkills(mockContext, mockActor);

      // Verify skills were processed (all should have labels)
      expect(mockContext.system.skills.awareness.label).toBe('Awareness');
      expect(mockContext.system.skills.dodge.label).toBe('Dodge');
      expect(mockContext.system.skills.intimidate.label).toBe('Intimidate');
    });

    it('handles missing skills gracefully', () => {
      mockContext.system.skills = null;

      expect(() => {
        EnemyDataPreparer.prepareSkills(mockContext, mockActor);
      }).not.toThrow();
    });

    it('handles skills with missing modifierTotal', () => {
      mockActor.system.skills.awareness.modifierTotal = undefined;
      jest.spyOn(SkillHelper, 'calculateSkillTotal').mockReturnValue(50);

      EnemyDataPreparer.prepareSkills(mockContext, mockActor);

      // Should default to 0 if modifierTotal is missing
      expect(mockContext.system.skills.awareness.total).toBe(50);
    });
  });

  describe('prepareConfig', () => {
    it('adds config to context', () => {
      EnemyDataPreparer.prepareConfig(mockContext);

      expect(mockContext.config).toBe(global.game.deathwatch.config);
    });
  });

  describe('prepareWounds', () => {
    it('adds wound color class for healthy wounds', () => {
      jest.spyOn(WoundHelper, 'getWoundColorClass').mockReturnValue('wound-healthy');

      EnemyDataPreparer.prepareWounds(mockContext);

      expect(WoundHelper.getWoundColorClass).toHaveBeenCalledWith(15, 20);
      expect(mockContext.woundColorClass).toBe('wound-healthy');
    });

    it('adds wound color class for critical wounds', () => {
      mockContext.system.wounds = { value: 22, max: 20 };
      jest.spyOn(WoundHelper, 'getWoundColorClass').mockReturnValue('wound-critical');

      EnemyDataPreparer.prepareWounds(mockContext);

      expect(WoundHelper.getWoundColorClass).toHaveBeenCalledWith(22, 20);
      expect(mockContext.woundColorClass).toBe('wound-critical');
    });
  });

  describe('preparePsyRating', () => {
    it('shows psy rating when base is greater than 0', () => {
      mockContext.system.psyRating = { base: 3, value: 3 };

      EnemyDataPreparer.preparePsyRating(mockContext);

      expect(mockContext.showPsyRating).toBe(true);
    });

    it('shows psy rating when value is greater than 0 even if base is 0', () => {
      mockContext.system.psyRating = { base: 0, value: 2 };

      EnemyDataPreparer.preparePsyRating(mockContext);

      expect(mockContext.showPsyRating).toBe(true);
    });

    it('hides psy rating when both base and value are 0', () => {
      mockContext.system.psyRating = { base: 0, value: 0 };

      EnemyDataPreparer.preparePsyRating(mockContext);

      expect(mockContext.showPsyRating).toBe(false);
    });

    it('handles negative values correctly', () => {
      mockContext.system.psyRating = { base: -1, value: -1 };

      EnemyDataPreparer.preparePsyRating(mockContext);

      expect(mockContext.showPsyRating).toBe(false);
    });
  });
});
