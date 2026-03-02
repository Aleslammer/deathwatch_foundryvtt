import { jest } from '@jest/globals';
import './setup.mjs';
import { SkillLoader } from '../src/module/helpers/skill-loader.mjs';

describe('SkillLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadSkills', () => {
    it('loads all skills from JSON with default values', () => {
      const skills = SkillLoader.loadSkills();
      
      expect(skills.awareness).toBeDefined();
      expect(skills.awareness.isBasic).toBe(true);
      expect(skills.awareness.characteristic).toBe('per');
      expect(skills.awareness.trained).toBe(false);
      expect(skills.awareness.mastered).toBe(false);
      expect(skills.awareness.expert).toBe(false);
      expect(skills.awareness.modifier).toBe(0);
    });

    it('loads skills in sorted order by key', () => {
      const skills = SkillLoader.loadSkills();
      const keys = Object.keys(skills);
      const sortedKeys = [...keys].sort();
      
      expect(keys).toEqual(sortedKeys);
    });

    it('merges actor skill training data with definitions', () => {
      const actorSkills = {
        awareness: { trained: true, modifier: 5 },
        dodge: { trained: true, mastered: true }
      };
      
      const skills = SkillLoader.loadSkills(actorSkills);
      
      expect(skills.awareness.trained).toBe(true);
      expect(skills.awareness.modifier).toBe(5);
      expect(skills.awareness.isBasic).toBe(true);
      expect(skills.awareness.characteristic).toBe('per');
      
      expect(skills.dodge.trained).toBe(true);
      expect(skills.dodge.mastered).toBe(true);
      expect(skills.dodge.expert).toBe(false);
    });

    it('preserves all skill definition properties', () => {
      const skills = SkillLoader.loadSkills();
      
      expect(skills.awareness.costTrain).toBe(0);
      expect(skills.awareness.costMaster).toBe(300);
      expect(skills.awareness.costExpert).toBe(800);
      expect(skills.awareness.descriptor).toBe('');
    });

    it('handles empty actor skills object', () => {
      const skills = SkillLoader.loadSkills({});
      
      expect(Object.keys(skills).length).toBeGreaterThan(0);
      expect(skills.awareness.trained).toBe(false);
    });

    it('loads advanced skills correctly', () => {
      const skills = SkillLoader.loadSkills();
      
      expect(skills.acrobatics.isBasic).toBe(false);
      expect(skills.acrobatics.characteristic).toBe('ag');
    });

    it('does not modify original actor skills object', () => {
      const actorSkills = { awareness: { trained: true } };
      const originalSkills = JSON.parse(JSON.stringify(actorSkills));
      
      SkillLoader.loadSkills(actorSkills);
      
      expect(actorSkills).toEqual(originalSkills);
    });
  });
});
