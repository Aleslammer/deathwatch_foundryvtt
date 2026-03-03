import { XP_CONSTANTS } from './constants.mjs';

/**
 * XP calculation utilities for character progression
 */
export class XPCalculator {
  static STARTING_XP = XP_CONSTANTS.STARTING_XP;
  static RANK_THRESHOLDS = XP_CONSTANTS.RANK_THRESHOLDS;

  /**
   * Calculate character rank based on total XP
   * @param {number} totalXP - Total XP earned
   * @returns {number} Character rank (1-8)
   */
  static calculateRank(totalXP) {
    const xp = totalXP || this.STARTING_XP;
    for (let i = this.RANK_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= this.RANK_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  }

  /**
   * Calculate total spent XP from character advances
   * @param {Actor} actor - The actor to calculate for
   * @returns {number} Total XP spent
   */
  static calculateSpentXP(actor) {
    let spent = this.STARTING_XP;
    const chapterCosts = this._getChapterCosts(actor);
    
    spent += this._calculateCharacteristicAdvanceCosts(actor);
    spent += this._calculateTalentCosts(actor, chapterCosts.talents);
    spent += this._calculateSkillCosts(actor, chapterCosts.skills);
    
    return spent;
  }

  /**
   * Get chapter-specific cost overrides
   * @private
   */
  static _getChapterCosts(actor) {
    const chapter = actor.system.chapterId ? actor.items.get(actor.system.chapterId) : null;
    return {
      skills: chapter?.system.skillCosts || {},
      talents: chapter?.system.talentCosts || {}
    };
  }

  /**
   * Calculate XP spent on characteristic advances
   * @private
   */
  static _calculateCharacteristicAdvanceCosts(actor) {
    const specialty = actor.system.specialtyId ? actor.items.get(actor.system.specialtyId) : null;
    const costs = specialty?.system.characteristicCosts || {};
    
    let total = 0;
    for (const [key, char] of Object.entries(actor.system.characteristics || {})) {
      const charCosts = costs[key] || {};
      if (char.advances?.simple) total += charCosts.simple || 0;
      if (char.advances?.intermediate) total += charCosts.intermediate || 0;
      if (char.advances?.trained) total += charCosts.trained || 0;
      if (char.advances?.expert) total += charCosts.expert || 0;
    }
    return total;
  }

  /**
   * Calculate XP spent on talents
   * @private
   */
  static _calculateTalentCosts(actor, chapterTalentCosts) {
    const talentCounts = {};
    let total = 0;
    
    for (const item of actor.items) {
      if (item.type !== 'talent') continue;
      
      const sourceId = this._getTalentSourceId(item);
      const cost = chapterTalentCosts[sourceId] ?? item.system.cost ?? 0;
      
      if (!talentCounts[item.name]) {
        talentCounts[item.name] = { 
          count: 0, 
          firstCost: cost, 
          subsequentCost: item.system.subsequentCost ?? 0,
          stackable: item.system.stackable 
        };
      }
      
      const talent = talentCounts[item.name];
      talent.count++;
      
      if (talent.count === 1) {
        total += Math.max(0, cost);
      } else if (talent.stackable && talent.subsequentCost) {
        total += Math.max(0, talent.subsequentCost);
      } else {
        total += Math.max(0, cost);
      }
    }
    
    return total;
  }

  /**
   * Get talent source ID for chapter cost lookup
   * @private
   */
  static _getTalentSourceId(item) {
    if (item.system.compendiumId) return item.system.compendiumId;
    if (item.flags?.core?.sourceId) {
      return item.flags.core.sourceId.split('.').pop();
    }
    if (item._stats?.compendiumSource) {
      return item._stats.compendiumSource.split('.').pop();
    }
    return item._id;
  }

  /**
   * Calculate XP spent on skills
   * @private
   */
  static _calculateSkillCosts(actor, chapterSkillCosts) {
    let total = 0;
    
    for (const [key, skill] of Object.entries(actor.system.skills || {})) {
      const costs = chapterSkillCosts[key] || {};
      const trainCost = costs.costTrain ?? skill.costTrain ?? 0;
      const masterCost = costs.costMaster ?? skill.costMaster ?? 0;
      const expertCost = costs.costExpert ?? skill.costExpert ?? 0;
      
      if (skill.trained) total += Math.max(0, trainCost);
      if (skill.mastered) total += Math.max(0, masterCost);
      if (skill.expert) total += Math.max(0, expertCost);
    }
    
    return total;
  }
}
