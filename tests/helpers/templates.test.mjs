import { jest } from '@jest/globals';
import { preloadHandlebarsTemplates } from '../../src/module/helpers/templates.mjs';

describe('Templates', () => {
  let loadTemplatesMock;

  beforeEach(() => {
    loadTemplatesMock = jest.fn().mockResolvedValue(undefined);
    global.loadTemplates = loadTemplatesMock;
  });

  describe('preloadHandlebarsTemplates', () => {
    it('calls loadTemplates with template paths', async () => {
      await preloadHandlebarsTemplates();

      expect(loadTemplatesMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          'systems/deathwatch/templates/actor/parts/actor-skills.html',
          'systems/deathwatch/templates/actor/parts/actor-items.html',
          'systems/deathwatch/templates/actor/parts/actor-spells.html',
          'systems/deathwatch/templates/actor/parts/actor-effects.html',
          'systems/deathwatch/templates/actor/parts/actor-armor.html'
        ])
      );
    });

    it('loads templates', async () => {
      await preloadHandlebarsTemplates();

      const templates = loadTemplatesMock.mock.calls[0][0];
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toContain('systems/deathwatch/templates/actor/parts/actor-skills.html');
    });

    it('returns promise from loadTemplates', async () => {
      const result = await preloadHandlebarsTemplates();

      expect(result).toBeUndefined();
    });

    it('loads actor and item templates', async () => {
      await preloadHandlebarsTemplates();

      const templates = loadTemplatesMock.mock.calls[0][0];
      const hasActorTemplates = templates.some(t => t.includes('systems/deathwatch/templates/actor/parts/'));
      const hasItemTemplates = templates.some(t => t.includes('systems/deathwatch/templates/item/'));
      expect(hasActorTemplates).toBe(true);
      expect(hasItemTemplates).toBe(true);
    });
  });
});
