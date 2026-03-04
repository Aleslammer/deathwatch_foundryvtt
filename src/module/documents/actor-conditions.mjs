export const ActorConditionsMixin = (superclass) => class extends superclass {
  hasCondition(conditionId) {
    return this.effects.some(e => e.statuses?.has(conditionId));
  }

  async setCondition(conditionId, enabled) {
    const effect = CONFIG.statusEffects?.find(e => e.id === conditionId);
    if (!effect) return enabled;

    const existing = this.effects.find(e => e.statuses?.has(conditionId));
    
    if (enabled && !existing) {
      await this.createEmbeddedDocuments('ActiveEffect', [{
        name: effect.name,
        icon: effect.img,
        statuses: [conditionId]
      }]);
      
      // Add modifiers to actor if status effect has them
      if (effect.modifiers?.length > 0) {
        const currentModifiers = this.system.modifiers || [];
        const newModifiers = effect.modifiers.map(m => ({
          ...m,
          _statusId: conditionId,
          source: effect.name,
          enabled: true
        }));
        await this.update({ 'system.modifiers': [...currentModifiers, ...newModifiers] });
      }
    } else if (!enabled && existing) {
      await existing.delete();
      
      // Remove modifiers from actor
      const currentModifiers = this.system.modifiers || [];
      const filteredModifiers = currentModifiers.filter(m => m._statusId !== conditionId);
      await this.update({ 'system.modifiers': filteredModifiers });
    }
    
    return enabled;
  }

  async toggleStatusEffect(statusId, options = {}) {
    const hasCondition = this.hasCondition(statusId);
    return this.setCondition(statusId, !hasCondition);
  }
};
