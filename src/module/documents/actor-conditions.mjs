export const ActorConditionsMixin = (superclass) => class extends superclass {
  hasCondition(conditionId) {
    return this.effects.some(e => e.statuses?.has(conditionId));
  }

  async setCondition(conditionId, enabled) {
    const effect = CONFIG.statusEffects.find(e => e.id === conditionId);
    if (!effect) return enabled;

    const existing = this.effects.find(e => e.statuses?.has(conditionId));
    
    if (enabled && !existing) {
      await this.createEmbeddedDocuments('ActiveEffect', [{
        name: effect.name,
        icon: effect.img,
        statuses: [conditionId]
      }]);
    } else if (!enabled && existing) {
      await existing.delete();
    }
    
    return enabled;
  }

  async toggleStatusEffect(statusId, options = {}) {
    const hasCondition = this.hasCondition(statusId);
    return this.setCondition(statusId, !hasCondition);
  }
};
