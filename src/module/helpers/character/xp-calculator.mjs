import { XP_CONSTANTS } from "../constants/index.mjs";

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
    spent += this._calculateInsanityReductionCosts(actor);

    return spent;
  }

  /**
   * Calculate XP breakdown by category with individual purchases
   * @param {Actor} actor - The actor to calculate for
   * @returns {Array<{category: string, source: string, cost: number}>} Array of XP expenditures
   */
  static calculateXPBreakdown(actor) {
    const breakdown = [];
    const chapterCosts = this._getChapterCosts(actor);
    const specialtyCosts = this._getSpecialtyCosts(actor);

    // Starting XP
    breakdown.push({
      category: 'Starting XP',
      source: 'Character Creation',
      cost: this.STARTING_XP
    });

    // Characteristic advances
    breakdown.push(...this._getCharacteristicAdvancesBreakdown(actor));

    // Skills
    breakdown.push(...this._getSkillsBreakdown(actor, chapterCosts.skills, specialtyCosts));

    // Talents
    breakdown.push(...this._getTalentsBreakdown(actor, chapterCosts.talents, specialtyCosts.talents));

    // Psychic powers
    breakdown.push(...this._getPsychicPowersBreakdown(actor));

    // Insanity reduction
    breakdown.push(...this._getInsanityReductionBreakdown(actor));

    return breakdown;
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
      const baseCost = item.system.cost ?? 0;

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

      // Collect all applicable cost overrides
      const costCandidates = [baseCost];

      // Chapter override
      if (chapterTalentCosts[sourceId] !== undefined) {
        costCandidates.push(chapterTalentCosts[sourceId]);
      }

      // Specialty rank override
      const specialtyOverrides = specialtyTalentCosts[sourceId];
      if (Array.isArray(specialtyOverrides) && specialtyOverrides.length > 0) {
        if (talent.stackable) {
          // For stackable talents, use the array index for this instance (if available)
          if (specialtyOverrides.length >= talent.count) {
            costCandidates.push(specialtyOverrides[talent.count - 1]);
          }
        } else {
          // For non-stackable talents, use the last (most recent rank) override
          costCandidates.push(specialtyOverrides[specialtyOverrides.length - 1]);
        }
      }

      // Use the lowest cost from all candidates (excluding -1)
      const cost = this._getLowestCost(costCandidates);

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

      // Collect all applicable cost overrides (chapter, specialty base, specialty rank)
      const trainCandidates = [trainCost];
      const masterCandidates = [masterCost];
      const expertCandidates = [expertCost];

      // Chapter overrides
      const chapterCosts = chapterSkillCosts[key];
      if (chapterCosts) {
        if (chapterCosts.costTrain !== undefined) trainCandidates.push(chapterCosts.costTrain);
        if (chapterCosts.costMaster !== undefined) masterCandidates.push(chapterCosts.costMaster);
        if (chapterCosts.costExpert !== undefined) expertCandidates.push(chapterCosts.costExpert);
      }

      // Specialty base overrides
      const specialtyBaseCosts = specialtyCosts.baseSkills[key];
      if (specialtyBaseCosts) {
        if (specialtyBaseCosts.costTrain !== undefined) trainCandidates.push(specialtyBaseCosts.costTrain);
        if (specialtyBaseCosts.costMaster !== undefined) masterCandidates.push(specialtyBaseCosts.costMaster);
        if (specialtyBaseCosts.costExpert !== undefined) expertCandidates.push(specialtyBaseCosts.costExpert);
      }

      // Specialty rank overrides
      const specialtyRankCosts = specialtyCosts.skills[key];
      if (specialtyRankCosts !== undefined) {
        if (typeof specialtyRankCosts === 'number') {
          trainCandidates.push(specialtyRankCosts);
        } else if (typeof specialtyRankCosts === 'object') {
          if (specialtyRankCosts.costTrain !== undefined) trainCandidates.push(specialtyRankCosts.costTrain);
          if (specialtyRankCosts.costMaster !== undefined) masterCandidates.push(specialtyRankCosts.costMaster);
          if (specialtyRankCosts.costExpert !== undefined) expertCandidates.push(specialtyRankCosts.costExpert);
        }
      }

      // Use the lowest cost from all candidates (excluding -1 which means "not trainable")
      trainCost = this._getLowestCost(trainCandidates);
      masterCost = this._getLowestCost(masterCandidates);
      expertCost = this._getLowestCost(expertCandidates);

      if (skill.trained) total += Math.max(0, trainCost);
      if (skill.mastered) total += Math.max(0, masterCost);
      if (skill.expert) total += Math.max(0, expertCost);
    }

    return total;
  }

  /**
   * Get the lowest cost from candidates, excluding -1 (not trainable).
   * If all candidates are -1, return -1.
   * @private
   * @param {Array<number>} candidates - Array of cost candidates
   * @returns {number} Lowest cost (excluding -1), or -1 if all are -1
   */
  static _getLowestCost(candidates) {
    const valid = candidates.filter(c => c !== -1);
    return valid.length > 0 ? Math.min(...valid) : -1;
  }

  /**
   * Calculate XP spent on insanity reduction from history.
   * Sums up all xpSpent values in insanityHistory entries.
   * @private
   */
  static _calculateInsanityReductionCosts(actor) {
    let total = 0;
    const history = actor.system.insanityHistory || [];

    for (const entry of history) {
      if (entry.xpSpent) {
        total += Math.max(0, entry.xpSpent);
      }
    }

    return total;
  }

  /* -------------------------------------------- */
  /*  XP Breakdown Methods                        */
  /* -------------------------------------------- */

  /**
   * Get characteristic advances breakdown
   * @private
   */
  static _getCharacteristicAdvancesBreakdown(actor) {
    const breakdown = [];
    const specialty = actor.system.specialtyId ? actor.items.get(actor.system.specialtyId) : null;
    const costs = specialty?.system.characteristicCosts || {};

    const charNames = {
      ws: 'Weapon Skill',
      bs: 'Ballistic Skill',
      str: 'Strength',
      tgh: 'Toughness',
      ag: 'Agility',
      int: 'Intelligence',
      per: 'Perception',
      wil: 'Willpower',
      fel: 'Fellowship'
    };

    for (const [key, char] of Object.entries(actor.system.characteristics || {})) {
      const charCosts = costs[key] || {};
      const charName = charNames[key] || key.toUpperCase();

      if (char.advances?.simple) {
        breakdown.push({
          category: 'Characteristic',
          source: `${charName} (Simple)`,
          cost: charCosts.simple || 0
        });
      }
      if (char.advances?.intermediate) {
        breakdown.push({
          category: 'Characteristic',
          source: `${charName} (Intermediate)`,
          cost: charCosts.intermediate || 0
        });
      }
      if (char.advances?.trained) {
        breakdown.push({
          category: 'Characteristic',
          source: `${charName} (Trained)`,
          cost: charCosts.trained || 0
        });
      }
      if (char.advances?.expert) {
        breakdown.push({
          category: 'Characteristic',
          source: `${charName} (Expert)`,
          cost: charCosts.expert || 0
        });
      }
    }

    return breakdown;
  }

  /**
   * Get skills breakdown
   * @private
   */
  static _getSkillsBreakdown(actor, chapterSkillCosts, specialtyCosts) {
    const breakdown = [];

    for (const [key, skill] of Object.entries(actor.system.skills || {})) {
      let trainCost = skill.costTrain ?? 0;
      let masterCost = skill.costMaster ?? 0;
      let expertCost = skill.costExpert ?? 0;

      // Collect all applicable cost overrides (chapter, specialty base, specialty rank)
      const trainCandidates = [trainCost];
      const masterCandidates = [masterCost];
      const expertCandidates = [expertCost];

      // Chapter overrides
      const chapterCosts = chapterSkillCosts[key];
      if (chapterCosts) {
        if (chapterCosts.costTrain !== undefined) trainCandidates.push(chapterCosts.costTrain);
        if (chapterCosts.costMaster !== undefined) masterCandidates.push(chapterCosts.costMaster);
        if (chapterCosts.costExpert !== undefined) expertCandidates.push(chapterCosts.costExpert);
      }

      // Specialty base overrides
      const specialtyBaseCosts = specialtyCosts.baseSkills[key];
      if (specialtyBaseCosts) {
        if (specialtyBaseCosts.costTrain !== undefined) trainCandidates.push(specialtyBaseCosts.costTrain);
        if (specialtyBaseCosts.costMaster !== undefined) masterCandidates.push(specialtyBaseCosts.costMaster);
        if (specialtyBaseCosts.costExpert !== undefined) expertCandidates.push(specialtyBaseCosts.costExpert);
      }

      // Specialty rank overrides
      const specialtyRankCosts = specialtyCosts.skills[key];
      if (specialtyRankCosts !== undefined) {
        if (typeof specialtyRankCosts === 'number') {
          trainCandidates.push(specialtyRankCosts);
        } else if (typeof specialtyRankCosts === 'object') {
          if (specialtyRankCosts.costTrain !== undefined) trainCandidates.push(specialtyRankCosts.costTrain);
          if (specialtyRankCosts.costMaster !== undefined) masterCandidates.push(specialtyRankCosts.costMaster);
          if (specialtyRankCosts.costExpert !== undefined) expertCandidates.push(specialtyRankCosts.costExpert);
        }
      }

      // Use the lowest cost from all candidates (excluding -1 which means "not trainable")
      trainCost = this._getLowestCost(trainCandidates);
      masterCost = this._getLowestCost(masterCandidates);
      expertCost = this._getLowestCost(expertCandidates);

      if (skill.trained) {
        breakdown.push({
          category: 'Skill',
          source: `${skill.label || key} (Trained)`,
          cost: Math.max(0, trainCost)
        });
      }
      if (skill.mastered) {
        breakdown.push({
          category: 'Skill',
          source: `${skill.label || key} (+10)`,
          cost: Math.max(0, masterCost)
        });
      }
      if (skill.expert) {
        breakdown.push({
          category: 'Skill',
          source: `${skill.label || key} (+20)`,
          cost: Math.max(0, expertCost)
        });
      }
    }

    return breakdown;
  }

  /**
   * Get talents breakdown
   * @private
   */
  static _getTalentsBreakdown(actor, chapterTalentCosts, specialtyTalentCosts) {
    const breakdown = [];
    const talentCounts = {};

    for (const item of actor.items) {
      if (item.type !== 'talent') continue;

      const sourceId = this._getTalentSourceId(item);
      const baseCost = item.system.cost ?? 0;

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

      // Collect all applicable cost overrides
      const costCandidates = [baseCost];

      // Chapter override
      if (chapterTalentCosts[sourceId] !== undefined) {
        costCandidates.push(chapterTalentCosts[sourceId]);
      }

      // Specialty rank override
      const specialtyOverrides = specialtyTalentCosts[sourceId];
      if (Array.isArray(specialtyOverrides) && specialtyOverrides.length > 0) {
        if (talent.stackable) {
          if (specialtyOverrides.length >= talent.count) {
            costCandidates.push(specialtyOverrides[talent.count - 1]);
          }
        } else {
          costCandidates.push(specialtyOverrides[specialtyOverrides.length - 1]);
        }
      }

      // Use the lowest cost from all candidates (excluding -1)
      const cost = this._getLowestCost(costCandidates);

      let itemCost = 0;
      if (talent.count === 1) {
        itemCost = Math.max(0, cost);
      } else if (talent.stackable && talent.subsequentCost) {
        itemCost = Math.max(0, talent.subsequentCost);
      } else {
        itemCost = Math.max(0, cost);
      }

      const displayName = talent.stackable && talent.count > 1
        ? `${item.name} (${talent.count})`
        : item.name;

      breakdown.push({
        category: 'Talent',
        source: displayName,
        cost: itemCost
      });
    }

    return breakdown;
  }

  /**
   * Get psychic powers breakdown
   * @private
   */
  static _getPsychicPowersBreakdown(actor) {
    const breakdown = [];

    for (const item of actor.items) {
      if (item.type !== 'psychic-power') continue;
      const cost = Math.max(0, item.system.cost ?? 0);

      breakdown.push({
        category: 'Psychic Power',
        source: item.name,
        cost: cost
      });
    }

    return breakdown;
  }

  /**
   * Get insanity reduction breakdown
   * @private
   */
  static _getInsanityReductionBreakdown(actor) {
    const breakdown = [];
    const history = actor.system.insanityHistory || [];

    for (const entry of history) {
      if (entry.xpSpent && entry.xpSpent > 0) {
        const date = new Date(entry.timestamp).toLocaleDateString();
        breakdown.push({
          category: 'Insanity Reduction',
          source: `Reduction (${date})`,
          cost: Math.max(0, entry.xpSpent)
        });
      }
    }

    return breakdown;
  }
}
