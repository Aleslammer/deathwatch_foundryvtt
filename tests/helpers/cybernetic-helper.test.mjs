import { CyberneticHelper } from '../../src/module/helpers/cybernetic-helper.mjs';
import { CHARACTERISTIC_CONSTANTS } from '../../src/module/helpers/constants/index.mjs';

describe('CyberneticHelper', () => {
  describe('getCharacteristicReplacements', () => {
    it('should return empty array when no cybernetics exist', () => {
      const actor = {
        items: []
      };

      const replacements = CyberneticHelper.getCharacteristicReplacements(actor, 'str');
      expect(replacements).toEqual([]);
    });

    it('should return equipped cybernetic that replaces strength', () => {
      const servoArm = {
        id: 'cyb1',
        name: 'Astartes Servo-Arm',
        type: 'cybernetic',
        system: {
          equipped: true,
          replacesCharacteristic: 'str',
          replacementValue: 75,
          unnaturalMultiplier: 2,
          replacementLabel: 'Servo-Arm'
        }
      };

      const actor = {
        items: [servoArm]
      };

      const replacements = CyberneticHelper.getCharacteristicReplacements(actor, 'str');
      expect(replacements).toHaveLength(1);
      expect(replacements[0].item).toBe(servoArm);
      expect(replacements[0].value).toBe(75);
      expect(replacements[0].bonus).toBe(14); // (75/10) * 2 = 7 * 2 = 14
      expect(replacements[0].label).toBe('Servo-Arm');
    });

    it('should not return unequipped cybernetics', () => {
      const servoArm = {
        id: 'cyb1',
        type: 'cybernetic',
        system: {
          equipped: false,
          replacesCharacteristic: 'str',
          replacementValue: 75,
          unnaturalMultiplier: 2
        }
      };

      const actor = {
        items: [servoArm]
      };

      const replacements = CyberneticHelper.getCharacteristicReplacements(actor, 'str');
      expect(replacements).toEqual([]);
    });

    it('should not return cybernetics for different characteristics', () => {
      const servoArm = {
        id: 'cyb1',
        type: 'cybernetic',
        system: {
          equipped: true,
          replacesCharacteristic: 'str',
          replacementValue: 75,
          unnaturalMultiplier: 2
        }
      };

      const actor = {
        items: [servoArm]
      };

      const replacements = CyberneticHelper.getCharacteristicReplacements(actor, 'ag');
      expect(replacements).toEqual([]);
    });

    it('should use item name as label if replacementLabel is empty', () => {
      const servoArm = {
        id: 'cyb1',
        name: 'Custom Servo-Arm',
        type: 'cybernetic',
        system: {
          equipped: true,
          replacesCharacteristic: 'str',
          replacementValue: 75,
          unnaturalMultiplier: 2,
          replacementLabel: ''
        }
      };

      const actor = {
        items: [servoArm]
      };

      const replacements = CyberneticHelper.getCharacteristicReplacements(actor, 'str');
      expect(replacements[0].label).toBe('Custom Servo-Arm');
    });

    it('should handle exceptional craftsmanship servo-arm (Str 85)', () => {
      const exceptionalServoArm = {
        id: 'cyb2',
        name: 'Astartes Servo-Arm (Exceptional)',
        type: 'cybernetic',
        system: {
          equipped: true,
          replacesCharacteristic: 'str',
          replacementValue: 85,
          unnaturalMultiplier: 2,
          replacementLabel: 'Servo-Arm (Exceptional)'
        }
      };

      const actor = {
        items: [exceptionalServoArm]
      };

      const replacements = CyberneticHelper.getCharacteristicReplacements(actor, 'str');
      expect(replacements).toHaveLength(1);
      expect(replacements[0].value).toBe(85);
      expect(replacements[0].bonus).toBe(16); // (85/10) * 2 = 8 * 2 = 16
    });
  });

  describe('getWeaponStrengthBonus', () => {
    it('should return null when weapon has no cybernetic source', () => {
      const weapon = {
        system: {
          cyberneticSource: ''
        }
      };

      const actor = {
        items: []
      };

      const bonus = CyberneticHelper.getWeaponStrengthBonus(actor, weapon);
      expect(bonus).toBeNull();
    });

    it('should return strength bonus from any equipped strength cybernetic', () => {
      const servoArm = {
        id: 'cyb1',
        type: 'cybernetic',
        system: {
          equipped: true,
          replacesCharacteristic: 'str',
          replacementValue: 75,
          unnaturalMultiplier: 2
        }
      };

      const weapon = {
        system: {
          cyberneticSource: 'any-value' // Just needs to be truthy
        }
      };

      const actor = {
        items: [servoArm]
      };

      const bonus = CyberneticHelper.getWeaponStrengthBonus(actor, weapon);
      expect(bonus).toBe(14); // (75/10) * 2 = 14
    });

    it('should return null when cybernetic is not equipped', () => {
      const servoArm = {
        id: 'cyb1',
        type: 'cybernetic',
        system: {
          equipped: false,
          replacesCharacteristic: 'str',
          replacementValue: 75,
          unnaturalMultiplier: 2
        }
      };

      const weapon = {
        system: {
          cyberneticSource: 'any-value'
        }
      };

      const actor = {
        items: [servoArm]
      };

      const bonus = CyberneticHelper.getWeaponStrengthBonus(actor, weapon);
      expect(bonus).toBeNull();
    });

    it('should return null when no strength-replacing cybernetic exists', () => {
      const bionicEye = {
        id: 'cyb1',
        type: 'cybernetic',
        system: {
          equipped: true,
          replacesCharacteristic: 'per',
          replacementValue: 50,
          unnaturalMultiplier: 1
        }
      };

      const weapon = {
        system: {
          cyberneticSource: 'any-value'
        }
      };

      const actor = {
        items: [bionicEye]
      };

      const bonus = CyberneticHelper.getWeaponStrengthBonus(actor, weapon);
      expect(bonus).toBeNull();
    });
  });

  describe('getCybernetic', () => {
    it('should return cybernetic item by id', () => {
      const servoArm = {
        id: 'cyb1',
        type: 'cybernetic',
        system: {}
      };

      const actor = {
        items: new Map([['cyb1', servoArm]])
      };

      const result = CyberneticHelper.getCybernetic(actor, 'cyb1');
      expect(result).toBe(servoArm);
    });

    it('should return null for non-cybernetic items', () => {
      const weapon = {
        id: 'weapon1',
        type: 'weapon',
        system: {}
      };

      const actor = {
        items: new Map([['weapon1', weapon]])
      };

      const result = CyberneticHelper.getCybernetic(actor, 'weapon1');
      expect(result).toBeNull();
    });

    it('should return null for non-existent id', () => {
      const actor = {
        items: new Map()
      };

      const result = CyberneticHelper.getCybernetic(actor, 'nonexistent');
      expect(result).toBeNull();
    });
  });
});
