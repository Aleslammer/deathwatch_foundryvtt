import { XP_CONSTANTS } from '../constants.mjs';

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
    const specialtyCosts = this._getSpecialtyCosts(actor);
    
    spent += this._calculateCharacteristicAdvanceCosts(actor);
    spent += this._calculateTalentCosts(actor, chapterCosts.talents, specialtyCosts.talents);
    spent += this._calculateSkillCosts(actor, chapterCosts.skills, specialtyCosts);
    spent += this._calculatePsychicPowerCosts(actor);
    
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
   * Get specialty rank-specific cost overrides
   * @private
   */
  static _getSpecialtyCosts(actor) {
    const specialty = actor.system.specialtyId ? actor.items.get(actor.system.specialtyId) : null;
    if (!specialty) return { skills: {}, talents: {}, baseSkills: {} };
    
    const currentRank = actor.system.rank || 1;
    
    // Accumulate costs from rank 1 up to current rank
    const accumulatedSkills = {};
    const accumulatedTalents = {}; // Maps talent ID to array of costs (for stackable) or single cost (for non-stackable)
    
    if (specialty.system.rankCosts) {
      for (let rank = 1; rank <= currentRank; rank++) {
        const rankData = specialty.system.rankCosts[rank.toString()];
        if (rankData) {
          // Merge skills (later ranks override earlier ranks)
          if (rankData.skills) {
            for (const [skillKey, skillCost] of Object.entries(rankData.skills)) {
              if (!accumulatedSkills[skillKey]) accumulatedSkills[skillKey] = {};
              Object.assign(accumulatedSkills[skillKey], skillCost);
            }
          }
          // Accumulate talents - we'll determine if they're stackable later
          if (rankData.talents) {
            for (const [talentId, cost] of Object.entries(rankData.talents)) {
              if (!accumulatedTalents[talentId]) accumulatedTalents[talentId] = [];
              accumulatedTalents[talentId].push(cost);
            }
          }
        }
      }
    }
    
    return {
      baseSkills: specialty.system.skillCosts || {},
      skills: accumulatedSkills,
      talents: accumulatedTalents
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
  static _calculateTalentCosts(actor, chapterTalentCosts, specialtyTalentCosts) {
    const talentCounts = {};
    let total = 0;
    
    for (const item of actor.items) {
      if (item.type !== 'talent') continue;
      
      const sourceId = this._getTalentSourceId(item);
      let cost = item.system.cost ?? 0;
      
      // Apply chapter override
      if (chapterTalentCosts[sourceId] !== undefined) cost = chapterTalentCosts[sourceId];
      
      if (!talentCounts[item.name]) {
        talentCounts[item.name] = { 
          count: 0, 
          sourceId: sourceId,
          subsequentCost: item.system.subsequentCost ?? 0,
          stackable: item.system.stackable 
        };
      }
      
      const talent = talentCounts[item.name];
      talent.count++;
      
      // Check if specialty has a cost override
      const specialtyOverrides = specialtyTalentCosts[sourceId];
      if (Array.isArray(specialtyOverrides) && specialtyOverrides.length > 0) {
        if (talent.stackable) {
          // For stackable talents, use the array index for this instance (if available)
          if (specialtyOverrides.length >= talent.count) {
            cost = specialtyOverrides[talent.count - 1];
          }
          // If no override for this instance, fall through to use subsequentCost
        } else {
          // For non-stackable talents, use the last (most recent rank) override
          cost = specialtyOverrides[specialtyOverrides.length - 1];
        }
      }
      
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
   * Calculate XP spent on psychic powers
   * @private
   */
  static _calculatePsychicPowerCosts(actor) {
    let total = 0;
    for (const item of actor.items) {
      if (item.type !== 'psychic-power') continue;
      total += Math.max(0, item.system.cost ?? 0);
    }
    return total;
  }

  /**
   * Calculate XP spent on skills
   * @private
   */
  static _calculateSkillCosts(actor, chapterSkillCosts, specialtyCosts) {
    let total = 0;
    
    for (const [key, skill] of Object.entries(actor.system.skills || {})) {
      let trainCost = skill.costTrain ?? 0;
      let masterCost = skill.costMaster ?? 0;
      let expertCost = skill.costExpert ?? 0;
      
      // Apply chapter overrides
      const chapterCosts = chapterSkillCosts[key];
      if (chapterCosts) {
        if (chapterCosts.costTrain !== undefined) trainCost = chapterCosts.costTrain;
        if (chapterCosts.costMaster !== undefined) masterCost = chapterCosts.costMaster;
        if (chapterCosts.costExpert !== undefined) expertCost = chapterCosts.costExpert;
      }
      
      // Apply specialty base overrides (takes precedence over chapter)
      const specialtyBaseCosts = specialtyCosts.baseSkills[key];
      if (specialtyBaseCosts) {
        if (specialtyBaseCosts.costTrain !== undefined) trainCost = specialtyBaseCosts.costTrain;
        if (specialtyBaseCosts.costMaster !== undefined) masterCost = specialtyBaseCosts.costMaster;
        if (specialtyBaseCosts.costExpert !== undefined) expertCost = specialtyBaseCosts.costExpert;
      }
      
      // Apply specialty rank overrides (takes precedence over base specialty)
      const specialtyRankCosts = specialtyCosts.skills[key];
      if (specialtyRankCosts !== undefined) {
        if (typeof specialtyRankCosts === 'number') {
          trainCost = specialtyRankCosts;
        } else if (typeof specialtyRankCosts === 'object') {
          if (specialtyRankCosts.costTrain !== undefined) trainCost = specialtyRankCosts.costTrain;
          if (specialtyRankCosts.costMaster !== undefined) masterCost = specialtyRankCosts.costMaster;
          if (specialtyRankCosts.costExpert !== undefined) expertCost = specialtyRankCosts.costExpert;
        }
      }
      
      if (skill.trained) total += Math.max(0, trainCost);
      if (skill.mastered) total += Math.max(0, masterCost);
      if (skill.expert) total += Math.max(0, expertCost);
    }
    
    return total;
  }
}
