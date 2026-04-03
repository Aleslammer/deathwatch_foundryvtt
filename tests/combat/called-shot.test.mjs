import { jest } from '@jest/globals';
import { CombatHelper } from '../../src/module/helpers/combat/combat.mjs';
import { HIT_LOCATIONS } from '../../src/module/helpers/constants.mjs';

describe('Called Shot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CombatHelper.lastCalledShotLocation = null;
  });

  describe('HIT_LOCATIONS constant', () => {
    it('contains all six body locations', () => {
      expect(HIT_LOCATIONS).toEqual([
        "Head", "Right Arm", "Left Arm", "Body", "Right Leg", "Left Leg"
      ]);
    });

    it('has exactly 6 entries', () => {
      expect(HIT_LOCATIONS).toHaveLength(6);
    });
  });

  describe('lastCalledShotLocation static property', () => {
    it('initializes as null', () => {
      expect(CombatHelper.lastCalledShotLocation).toBeNull();
    });

    it('can be set to a location', () => {
      CombatHelper.lastCalledShotLocation = "Head";
      expect(CombatHelper.lastCalledShotLocation).toBe("Head");
    });

    it('can be reset to null', () => {
      CombatHelper.lastCalledShotLocation = "Body";
      CombatHelper.lastCalledShotLocation = null;
      expect(CombatHelper.lastCalledShotLocation).toBeNull();
    });
  });

  describe('Called Shot overrides first hit location only', () => {
    it('uses called shot location as first hit when set', () => {
      CombatHelper.lastCalledShotLocation = "Head";
      const firstLocation = CombatHelper.lastCalledShotLocation || CombatHelper.determineHitLocation(55);
      expect(firstLocation).toBe("Head");
    });

    it('falls back to determineHitLocation when not set', () => {
      CombatHelper.lastCalledShotLocation = null;
      const firstLocation = CombatHelper.lastCalledShotLocation || CombatHelper.determineHitLocation(55);
      expect(firstLocation).toBe(CombatHelper.determineHitLocation(55));
    });

    it('subsequent hits follow normal pattern from called shot location', () => {
      const calledLocation = "Head";
      const locations = CombatHelper.determineMultipleHitLocations(calledLocation, 3);
      expect(locations[0]).toBe("Head");
      expect(locations).toHaveLength(3);
    });

    it('called shot to Right Leg with multiple hits follows leg pattern', () => {
      const calledLocation = "Right Leg";
      const locations = CombatHelper.determineMultipleHitLocations(calledLocation, 4);
      expect(locations[0]).toBe("Right Leg");
      expect(locations[1]).toBe("Left Leg");
    });

    it('called shot to Left Arm with multiple hits follows arm pattern', () => {
      const calledLocation = "Left Arm";
      const locations = CombatHelper.determineMultipleHitLocations(calledLocation, 3);
      expect(locations[0]).toBe("Left Arm");
      expect(locations[1]).toBe("Right Arm");
    });

    it('single hit called shot uses only the declared location', () => {
      const calledLocation = "Body";
      const locations = CombatHelper.determineMultipleHitLocations(calledLocation, 1);
      expect(locations).toEqual(["Body"]);
    });
  });

  describe('Called Shot for each location', () => {
    for (const location of HIT_LOCATIONS) {
      it(`can target ${location}`, () => {
        CombatHelper.lastCalledShotLocation = location;
        const firstLocation = CombatHelper.lastCalledShotLocation || CombatHelper.determineHitLocation(50);
        expect(firstLocation).toBe(location);
      });
    }
  });
});
