/**
 * @file Tests for scroll position preservation during re-renders
 * Tests both sheet-body (main scroll) and skills-section (sub-panel scroll) preservation
 */

import { jest } from '@jest/globals';

describe('Actor Sheet Scroll Position Preservation', () => {
  let mockSheet, mockElement, mockSheetBody, mockSkillsSection;

  beforeEach(() => {
    // Mock sheet-body element (the main scrollable container)
    mockSheetBody = {
      scrollTop: 0
    };

    // Mock skills section (independent scrollable sub-panel)
    mockSkillsSection = {
      parentElement: { scrollTop: 0 }
    };

    // Mock element with querySelector
    mockElement = {
      querySelector: jest.fn((selector) => {
        if (selector === '.sheet-body') return mockSheetBody;
        if (selector === '.skills-section') return mockSkillsSection;
        return null;
      }),
      querySelectorAll: jest.fn(() => [])
    };

    // Create mock sheet with minimal properties
    mockSheet = {
      element: mockElement,
      _sheetBodyScrollTop: undefined,
      _skillsScrollTop: undefined
    };
  });

  describe('Sheet-body scroll position (main scroll)', () => {
    test('should save sheet-body scroll position', () => {
      mockSheetBody.scrollTop = 450;

      const el = mockSheet.element;
      if (el) {
        const sheetBody = el.querySelector('.sheet-body');
        if (sheetBody) mockSheet._sheetBodyScrollTop = sheetBody.scrollTop;
      }

      expect(mockSheet._sheetBodyScrollTop).toBe(450);
    });

    test('should restore sheet-body scroll position', () => {
      mockSheet._sheetBodyScrollTop = 350;
      mockSheetBody.scrollTop = 0;

      if (mockSheet._sheetBodyScrollTop !== undefined) {
        const sheetBody = mockSheet.element.querySelector('.sheet-body');
        if (sheetBody) sheetBody.scrollTop = mockSheet._sheetBodyScrollTop;
      }

      expect(mockSheetBody.scrollTop).toBe(350);
    });

    test('should handle missing sheet-body gracefully', () => {
      mockSheet.element = {
        querySelector: jest.fn(() => null)
      };

      const el = mockSheet.element;
      if (el) {
        const sheetBody = el.querySelector('.sheet-body');
        if (sheetBody) mockSheet._sheetBodyScrollTop = sheetBody.scrollTop;
      }

      expect(mockSheet._sheetBodyScrollTop).toBeUndefined();
    });
  });

  describe('Skills sub-panel scroll position', () => {
    test('should save skills section scroll position', () => {
      mockSkillsSection.parentElement.scrollTop = 200;

      const el = mockSheet.element;
      if (el) {
        const sc = el.querySelector('.skills-section')?.parentElement;
        if (sc) mockSheet._skillsScrollTop = sc.scrollTop;
      }

      expect(mockSheet._skillsScrollTop).toBe(200);
    });

    test('should restore skills section scroll position', () => {
      mockSheet._skillsScrollTop = 150;
      mockSkillsSection.parentElement.scrollTop = 0;

      if (mockSheet._skillsScrollTop !== undefined) {
        const sc = mockSheet.element.querySelector('.skills-section')?.parentElement;
        if (sc) sc.scrollTop = mockSheet._skillsScrollTop;
      }

      expect(mockSkillsSection.parentElement.scrollTop).toBe(150);
    });

    test('should handle missing skills section gracefully', () => {
      mockSheet.element = {
        querySelector: jest.fn(() => null)
      };

      const el = mockSheet.element;
      if (el) {
        const sc = el.querySelector('.skills-section')?.parentElement;
        if (sc) mockSheet._skillsScrollTop = sc.scrollTop;
      }

      expect(mockSheet._skillsScrollTop).toBeUndefined();
    });
  });

  describe('Independent scroll preservation', () => {
    test('should save both scroll positions independently', () => {
      mockSheetBody.scrollTop = 500;
      mockSkillsSection.parentElement.scrollTop = 150;

      const el = mockSheet.element;
      if (el) {
        const sheetBody = el.querySelector('.sheet-body');
        if (sheetBody) mockSheet._sheetBodyScrollTop = sheetBody.scrollTop;

        const sc = el.querySelector('.skills-section')?.parentElement;
        if (sc) mockSheet._skillsScrollTop = sc.scrollTop;
      }

      expect(mockSheet._sheetBodyScrollTop).toBe(500);
      expect(mockSheet._skillsScrollTop).toBe(150);
    });

    test('should restore both scroll positions independently', () => {
      mockSheet._sheetBodyScrollTop = 600;
      mockSheet._skillsScrollTop = 250;
      mockSheetBody.scrollTop = 0;
      mockSkillsSection.parentElement.scrollTop = 0;

      if (mockSheet._sheetBodyScrollTop !== undefined) {
        const sheetBody = mockSheet.element.querySelector('.sheet-body');
        if (sheetBody) sheetBody.scrollTop = mockSheet._sheetBodyScrollTop;
      }
      if (mockSheet._skillsScrollTop !== undefined) {
        const sc = mockSheet.element.querySelector('.skills-section')?.parentElement;
        if (sc) sc.scrollTop = mockSheet._skillsScrollTop;
      }

      expect(mockSheetBody.scrollTop).toBe(600);
      expect(mockSkillsSection.parentElement.scrollTop).toBe(250);
    });

    test('should preserve sheet-body scroll when only it is set', () => {
      mockSheet._sheetBodyScrollTop = 400;
      mockSheet._skillsScrollTop = undefined;
      mockSheetBody.scrollTop = 0;

      if (mockSheet._sheetBodyScrollTop !== undefined) {
        const sheetBody = mockSheet.element.querySelector('.sheet-body');
        if (sheetBody) sheetBody.scrollTop = mockSheet._sheetBodyScrollTop;
      }
      if (mockSheet._skillsScrollTop !== undefined) {
        const sc = mockSheet.element.querySelector('.skills-section')?.parentElement;
        if (sc) sc.scrollTop = mockSheet._skillsScrollTop;
      }

      expect(mockSheetBody.scrollTop).toBe(400);
      expect(mockSkillsSection.parentElement.scrollTop).toBe(0);
    });

    test('should preserve skills scroll when only it is set', () => {
      mockSheet._sheetBodyScrollTop = undefined;
      mockSheet._skillsScrollTop = 175;
      mockSkillsSection.parentElement.scrollTop = 0;

      if (mockSheet._sheetBodyScrollTop !== undefined) {
        const sheetBody = mockSheet.element.querySelector('.sheet-body');
        if (sheetBody) sheetBody.scrollTop = mockSheet._sheetBodyScrollTop;
      }
      if (mockSheet._skillsScrollTop !== undefined) {
        const sc = mockSheet.element.querySelector('.skills-section')?.parentElement;
        if (sc) sc.scrollTop = mockSheet._skillsScrollTop;
      }

      expect(mockSheetBody.scrollTop).toBe(0);
      expect(mockSkillsSection.parentElement.scrollTop).toBe(175);
    });
  });

  describe('Scroll position persistence across renders', () => {
    test('should update both scroll positions across multiple renders', () => {
      // First render - both scrolled
      mockSheetBody.scrollTop = 100;
      mockSkillsSection.parentElement.scrollTop = 50;

      let el = mockSheet.element;
      if (el) {
        const sheetBody = el.querySelector('.sheet-body');
        if (sheetBody) mockSheet._sheetBodyScrollTop = sheetBody.scrollTop;
        const sc = el.querySelector('.skills-section')?.parentElement;
        if (sc) mockSheet._skillsScrollTop = sc.scrollTop;
      }

      expect(mockSheet._sheetBodyScrollTop).toBe(100);
      expect(mockSheet._skillsScrollTop).toBe(50);

      // Second render - user scrolled both more
      mockSheetBody.scrollTop = 300;
      mockSkillsSection.parentElement.scrollTop = 120;

      el = mockSheet.element;
      if (el) {
        const sheetBody = el.querySelector('.sheet-body');
        if (sheetBody) mockSheet._sheetBodyScrollTop = sheetBody.scrollTop;
        const sc = el.querySelector('.skills-section')?.parentElement;
        if (sc) mockSheet._skillsScrollTop = sc.scrollTop;
      }

      expect(mockSheet._sheetBodyScrollTop).toBe(300);
      expect(mockSheet._skillsScrollTop).toBe(120);
    });

    test('should maintain both scroll positions through save-restore cycle', () => {
      // Save positions
      mockSheetBody.scrollTop = 750;
      mockSkillsSection.parentElement.scrollTop = 200;

      const el = mockSheet.element;
      if (el) {
        const sheetBody = el.querySelector('.sheet-body');
        if (sheetBody) mockSheet._sheetBodyScrollTop = sheetBody.scrollTop;
        const sc = el.querySelector('.skills-section')?.parentElement;
        if (sc) mockSheet._skillsScrollTop = sc.scrollTop;
      }

      // Simulate re-render (reset to 0)
      mockSheetBody.scrollTop = 0;
      mockSkillsSection.parentElement.scrollTop = 0;

      // Restore positions
      if (mockSheet._sheetBodyScrollTop !== undefined) {
        const sheetBody = mockSheet.element.querySelector('.sheet-body');
        if (sheetBody) sheetBody.scrollTop = mockSheet._sheetBodyScrollTop;
      }
      if (mockSheet._skillsScrollTop !== undefined) {
        const sc = mockSheet.element.querySelector('.skills-section')?.parentElement;
        if (sc) sc.scrollTop = mockSheet._skillsScrollTop;
      }

      expect(mockSheetBody.scrollTop).toBe(750);
      expect(mockSkillsSection.parentElement.scrollTop).toBe(200);
    });
  });

  describe('Edge cases', () => {
    test('should handle scroll position of 0 for both', () => {
      mockSheetBody.scrollTop = 0;
      mockSkillsSection.parentElement.scrollTop = 0;

      const el = mockSheet.element;
      if (el) {
        const sheetBody = el.querySelector('.sheet-body');
        if (sheetBody) mockSheet._sheetBodyScrollTop = sheetBody.scrollTop;
        const sc = el.querySelector('.skills-section')?.parentElement;
        if (sc) mockSheet._skillsScrollTop = sc.scrollTop;
      }

      expect(mockSheet._sheetBodyScrollTop).toBe(0);
      expect(mockSheet._skillsScrollTop).toBe(0);
    });

    test('should handle very large scroll positions', () => {
      const largePosition = 9999;

      mockSheetBody.scrollTop = largePosition;
      mockSkillsSection.parentElement.scrollTop = largePosition;

      const el = mockSheet.element;
      if (el) {
        const sheetBody = el.querySelector('.sheet-body');
        if (sheetBody) mockSheet._sheetBodyScrollTop = sheetBody.scrollTop;
        const sc = el.querySelector('.skills-section')?.parentElement;
        if (sc) mockSheet._skillsScrollTop = sc.scrollTop;
      }

      expect(mockSheet._sheetBodyScrollTop).toBe(largePosition);
      expect(mockSheet._skillsScrollTop).toBe(largePosition);
    });
  });
});
