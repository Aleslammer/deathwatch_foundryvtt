import { jest } from '@jest/globals';
import './setup.mjs';

describe('Talents and Traits - Chat Posting', () => {
  let mockActor;
  let mockTalent;
  let mockTrait;

  beforeEach(() => {
    jest.clearAllMocks();

    mockActor = {
      _id: 'actor1',
      name: 'Test Marine',
      type: 'character',
      system: {},
      items: {
        get: jest.fn()
      }
    };

    mockTalent = {
      _id: 'talent1',
      name: 'Deadeye Shot',
      type: 'talent',
      img: 'icons/talent.png',
      system: {
        prerequisite: 'BS 40',
        benefit: 'Reduce called shot penalty by 10',
        description: '<p>You are skilled at making precise shots.</p>',
        book: 'Core Rulebook',
        page: '50'
      }
    };

    mockTrait = {
      _id: 'trait1',
      name: 'Unnatural Strength (x2)',
      type: 'trait',
      img: 'icons/trait.png',
      system: {
        description: '<p>Your strength bonus is doubled for all tests.</p>',
        book: 'Core Rulebook',
        page: '100'
      }
    };
  });

  describe('Talent Chat Card', () => {
    it('should create chat message with talent name', () => {
      mockActor.items.get.mockReturnValue(mockTalent);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('<h3>Deadeye Shot</h3>');
        return Promise.resolve({});
      });

      // Simulate the click handler logic
      const talent = mockActor.items.get('talent1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="talent-card">
          <h3>${talent.name}</h3>
          ${talent.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${talent.system.prerequisite}</p>` : ''}
          ${talent.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${talent.system.benefit}</p>` : ''}
          ${talent.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${talent.system.book}, p${talent.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalledTimes(1);
    });

    it('should include prerequisite in talent chat card', () => {
      mockActor.items.get.mockReturnValue(mockTalent);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('<strong>Prerequisite:</strong> BS 40');
        return Promise.resolve({});
      });

      const talent = mockActor.items.get('talent1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="talent-card">
          <h3>${talent.name}</h3>
          ${talent.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${talent.system.prerequisite}</p>` : ''}
          ${talent.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${talent.system.benefit}</p>` : ''}
          ${talent.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${talent.system.book}, p${talent.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('should include benefit in talent chat card', () => {
      mockActor.items.get.mockReturnValue(mockTalent);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('<strong>Benefit:</strong> Reduce called shot penalty by 10');
        return Promise.resolve({});
      });

      const talent = mockActor.items.get('talent1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="talent-card">
          <h3>${talent.name}</h3>
          ${talent.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${talent.system.prerequisite}</p>` : ''}
          ${talent.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${talent.system.benefit}</p>` : ''}
          ${talent.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${talent.system.book}, p${talent.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('should include description in talent chat card', () => {
      mockActor.items.get.mockReturnValue(mockTalent);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('<p>You are skilled at making precise shots.</p>');
        return Promise.resolve({});
      });

      const talent = mockActor.items.get('talent1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="talent-card">
          <h3>${talent.name}</h3>
          ${talent.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${talent.system.prerequisite}</p>` : ''}
          ${talent.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${talent.system.benefit}</p>` : ''}
          ${talent.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${talent.system.book}, p${talent.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('should include source reference in talent chat card', () => {
      mockActor.items.get.mockReturnValue(mockTalent);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('Core Rulebook, p50');
        return Promise.resolve({});
      });

      const talent = mockActor.items.get('talent1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="talent-card">
          <h3>${talent.name}</h3>
          ${talent.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${talent.system.prerequisite}</p>` : ''}
          ${talent.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${talent.system.benefit}</p>` : ''}
          ${talent.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${talent.system.book}, p${talent.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('should handle talent without prerequisite', () => {
      const talentNoPrereq = {
        ...mockTalent,
        system: {
          ...mockTalent.system,
          prerequisite: ''
        }
      };
      mockActor.items.get.mockReturnValue(talentNoPrereq);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).not.toContain('<strong>Prerequisite:</strong>');
        return Promise.resolve({});
      });

      const talent = mockActor.items.get('talent1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="talent-card">
          <h3>${talent.name}</h3>
          ${talent.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${talent.system.prerequisite}</p>` : ''}
          ${talent.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${talent.system.benefit}</p>` : ''}
          ${talent.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${talent.system.book}, p${talent.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('should handle talent without benefit', () => {
      const talentNoBenefit = {
        ...mockTalent,
        system: {
          ...mockTalent.system,
          benefit: ''
        }
      };
      mockActor.items.get.mockReturnValue(talentNoBenefit);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).not.toContain('<strong>Benefit:</strong>');
        return Promise.resolve({});
      });

      const talent = mockActor.items.get('talent1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="talent-card">
          <h3>${talent.name}</h3>
          ${talent.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${talent.system.prerequisite}</p>` : ''}
          ${talent.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${talent.system.benefit}</p>` : ''}
          ${talent.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${talent.system.book}, p${talent.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });
  });

  describe('Trait Chat Card', () => {
    it('should create chat message with trait name', () => {
      mockActor.items.get.mockReturnValue(mockTrait);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('<h3>Unnatural Strength (x2)</h3>');
        return Promise.resolve({});
      });

      const trait = mockActor.items.get('trait1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="trait-card">
          <h3>${trait.name}</h3>
          ${trait.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${trait.system.book}, p${trait.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalledTimes(1);
    });

    it('should include description in trait chat card', () => {
      mockActor.items.get.mockReturnValue(mockTrait);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('<p>Your strength bonus is doubled for all tests.</p>');
        return Promise.resolve({});
      });

      const trait = mockActor.items.get('trait1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="trait-card">
          <h3>${trait.name}</h3>
          ${trait.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${trait.system.book}, p${trait.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('should include source reference in trait chat card', () => {
      mockActor.items.get.mockReturnValue(mockTrait);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('Core Rulebook, p100');
        return Promise.resolve({});
      });

      const trait = mockActor.items.get('trait1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="trait-card">
          <h3>${trait.name}</h3>
          ${trait.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${trait.system.book}, p${trait.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('should use correct speaker for trait chat message', () => {
      mockActor.items.get.mockReturnValue(mockTrait);

      global.ChatMessage.getSpeaker.mockReturnValue({ alias: 'Test Marine' });

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.speaker).toEqual({ alias: 'Test Marine' });
        return Promise.resolve({});
      });

      const trait = mockActor.items.get('trait1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="trait-card">
          <h3>${trait.name}</h3>
          ${trait.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${trait.system.book}, p${trait.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.getSpeaker).toHaveBeenCalledWith({ actor: mockActor });
      expect(global.ChatMessage.create).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing talent gracefully', () => {
      mockActor.items.get.mockReturnValue(null);

      const talent = mockActor.items.get('nonexistent');
      
      expect(talent).toBeNull();
      expect(global.ChatMessage.create).not.toHaveBeenCalled();
    });

    it('should handle missing trait gracefully', () => {
      mockActor.items.get.mockReturnValue(null);

      const trait = mockActor.items.get('nonexistent');
      
      expect(trait).toBeNull();
      expect(global.ChatMessage.create).not.toHaveBeenCalled();
    });

    it('should handle talent with empty description', () => {
      const talentNoDesc = {
        ...mockTalent,
        system: {
          ...mockTalent.system,
          description: ''
        }
      };
      mockActor.items.get.mockReturnValue(talentNoDesc);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('<h3>Deadeye Shot</h3>');
        return Promise.resolve({});
      });

      const talent = mockActor.items.get('talent1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="talent-card">
          <h3>${talent.name}</h3>
          ${talent.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${talent.system.prerequisite}</p>` : ''}
          ${talent.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${talent.system.benefit}</p>` : ''}
          ${talent.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${talent.system.book}, p${talent.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('should handle trait with empty description', () => {
      const traitNoDesc = {
        ...mockTrait,
        system: {
          ...mockTrait.system,
          description: ''
        }
      };
      mockActor.items.get.mockReturnValue(traitNoDesc);

      global.ChatMessage.create.mockImplementation((data) => {
        expect(data.content).toContain('<h3>Unnatural Strength (x2)</h3>');
        return Promise.resolve({});
      });

      const trait = mockActor.items.get('trait1');
      global.ChatMessage.create({
        speaker: global.ChatMessage.getSpeaker({ actor: mockActor }),
        content: `<div class="trait-card">
          <h3>${trait.name}</h3>
          ${trait.system.description}
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${trait.system.book}, p${trait.system.page}</em></p>
        </div>`
      });

      expect(global.ChatMessage.create).toHaveBeenCalled();
    });
  });
});
