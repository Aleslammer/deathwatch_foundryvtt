import { Logger } from '../logger.mjs';

let skillDefinitions = null;

// Load skills synchronously for Node.js (Jest)
if (typeof process !== 'undefined' && process.versions?.node) {
  const { readFileSync } = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  skillDefinitions = JSON.parse(readFileSync(join(__dirname, '../../data/skills.json'), 'utf-8'));
}

export class SkillLoader {
  static async init() {
    if (!skillDefinitions) {
      const response = await fetch('systems/deathwatch/module/data/skills.json', { cache: 'no-store' });
      skillDefinitions = await response.json();
    }
  }

  static loadSkills(actorSkills = {}) {
    if (!skillDefinitions) {
      Logger.error('SKILLS', 'Skills not loaded. Call SkillLoader.init() first.');
      return {};
    }
    
    const mergedSkills = {};
    const sortedEntries = Object.entries(skillDefinitions)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    
    for (const [key, definition] of sortedEntries) {
      mergedSkills[key] = {
        ...definition,
        trained: actorSkills[key]?.trained || false,
        mastered: actorSkills[key]?.mastered || false,
        expert: actorSkills[key]?.expert || false,
        modifier: actorSkills[key]?.modifier || 0
      };
    }
    
    return mergedSkills;
  }
}
