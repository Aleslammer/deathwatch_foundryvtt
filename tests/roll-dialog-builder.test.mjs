import { jest } from '@jest/globals';
import './setup.mjs';
import { RollDialogBuilder } from '../src/module/helpers/roll-dialog-builder.mjs';
import { DWConfig } from '../src/module/helpers/config.mjs';

describe('RollDialogBuilder', () => {
  describe('buildModifierDialog', () => {
    it('builds dialog HTML with difficulty select', () => {
      const html = RollDialogBuilder.buildModifierDialog();
      expect(html).toContain('difficulty-select');
      expect(html).toContain('Difficulty:');
      expect(html).toContain('modifier');
    });

    it('includes all difficulty options', () => {
      const html = RollDialogBuilder.buildModifierDialog();
      expect(html).toContain('Trivial');
      expect(html).toContain('Challenging');
      expect(html).toContain('Hard');
    });

    it('sets challenging as default selected', () => {
      const html = RollDialogBuilder.buildModifierDialog();
      expect(html).toMatch(/value="challenging"[^>]*selected/);
    });
  });

  describe('attachModifierInputHandler', () => {
    it('attaches input handler to modifier field', () => {
      const mockInput = { on: jest.fn() };
      const mockHtml = { find: jest.fn().mockReturnValue(mockInput) };
      
      RollDialogBuilder.attachModifierInputHandler(mockHtml);
      
      expect(mockHtml.find).toHaveBeenCalledWith('#modifier');
      expect(mockInput.on).toHaveBeenCalledWith('input', expect.any(Function));
    });
  });

  describe('parseModifiers', () => {
    it('parses difficulty and additional modifiers', () => {
      const mockHtml = {
        find: jest.fn((selector) => {
          if (selector === '#difficulty-select') return { val: () => 'hard' };
          if (selector === '#modifier') return { val: () => { return { trim: () => '+10' }; } };
        })
      };

      const result = RollDialogBuilder.parseModifiers(mockHtml);
      
      expect(result.difficulty).toBe('hard');
      expect(result.difficultyModifier).toBe(-20);
      expect(result.additionalModifier).toBe(10);
      expect(result.difficultyLabel).toBe('Hard');
    });

    it('handles empty additional modifier', () => {
      const mockHtml = {
        find: jest.fn((selector) => {
          if (selector === '#difficulty-select') return { val: () => 'challenging' };
          if (selector === '#modifier') return { val: () => { return { trim: () => '' }; } };
        })
      };

      const result = RollDialogBuilder.parseModifiers(mockHtml);
      
      expect(result.additionalModifier).toBe(0);
    });

    it('handles negative additional modifier', () => {
      const mockHtml = {
        find: jest.fn((selector) => {
          if (selector === '#difficulty-select') return { val: () => 'challenging' };
          if (selector === '#modifier') return { val: () => { return { trim: () => '-20' }; } };
        })
      };

      const result = RollDialogBuilder.parseModifiers(mockHtml);
      
      expect(result.additionalModifier).toBe(-20);
    });
  });

  describe('buildModifierParts', () => {
    it('builds modifier parts with base value', () => {
      const modifiers = { difficultyModifier: 0, additionalModifier: 0 };
      const parts = RollDialogBuilder.buildModifierParts(50, 'Weapon Skill', modifiers);
      
      expect(parts).toEqual(['50 Weapon Skill']);
    });

    it('includes difficulty modifier when non-zero', () => {
      const modifiers = { difficultyModifier: -10, additionalModifier: 0, difficultyLabel: 'Hard' };
      const parts = RollDialogBuilder.buildModifierParts(50, 'Weapon Skill', modifiers);
      
      expect(parts).toContain('50 Weapon Skill');
      expect(parts).toContain('-10 Hard');
    });

    it('includes additional modifier when non-zero', () => {
      const modifiers = { difficultyModifier: 0, additionalModifier: 10 };
      const parts = RollDialogBuilder.buildModifierParts(50, 'Weapon Skill', modifiers);
      
      expect(parts).toContain('50 Weapon Skill');
      expect(parts).toContain('+10 Misc');
    });

    it('includes all modifiers when present', () => {
      const modifiers = { difficultyModifier: 10, additionalModifier: -5, difficultyLabel: 'Easy' };
      const parts = RollDialogBuilder.buildModifierParts(50, 'Weapon Skill', modifiers);
      
      expect(parts).toHaveLength(3);
      expect(parts).toContain('50 Weapon Skill');
      expect(parts).toContain('+10 Easy');
      expect(parts).toContain('-5 Misc');
    });
  });

  describe('buildResultFlavor', () => {
    it('builds success flavor', () => {
      const roll = { total: 30 };
      const flavor = RollDialogBuilder.buildResultFlavor('[Test] Roll', 50, roll, ['50 Base']);
      
      expect(flavor).toContain('Target: 50');
      expect(flavor).toContain('SUCCESS!');
      expect(flavor).toContain('2 DoS');
      expect(flavor).toContain('50 Base');
    });

    it('builds failure flavor', () => {
      const roll = { total: 70 };
      const flavor = RollDialogBuilder.buildResultFlavor('[Test] Roll', 50, roll, ['50 Base']);
      
      expect(flavor).toContain('Target: 50');
      expect(flavor).toContain('FAILED!');
      expect(flavor).toContain('2 DoF');
    });

    it('calculates degrees correctly', () => {
      const roll = { total: 25 };
      const flavor = RollDialogBuilder.buildResultFlavor('[Test] Roll', 50, roll, []);
      
      expect(flavor).toContain('2 DoS');
    });

    it('includes modifier details when present', () => {
      const roll = { total: 30 };
      const parts = ['50 Base', '+10 Easy', '-5 Misc'];
      const flavor = RollDialogBuilder.buildResultFlavor('[Test] Roll', 55, roll, parts);
      
      expect(flavor).toContain('<details');
      expect(flavor).toContain('Modifiers');
      expect(flavor).toContain('50 Base');
      expect(flavor).toContain('+10 Easy');
      expect(flavor).toContain('-5 Misc');
    });
  });
});
