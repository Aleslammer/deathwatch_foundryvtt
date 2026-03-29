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
      
      let modifiersToApply = [];

      if (effect.dynamicModifiers) {
        // Compute dynamic WS/BS reduction to 10
        const ws = this.system.characteristics?.ws?.value || 0;
        const bs = this.system.characteristics?.bs?.value || 0;
        const wsMod = Math.min(0, -(ws - 10));
        const bsMod = Math.min(0, -(bs - 10));
        if (wsMod !== 0) modifiersToApply.push({ name: `${effect.name} (WS)`, modifier: wsMod, effectType: "characteristic", valueAffected: "ws" });
        if (bsMod !== 0) modifiersToApply.push({ name: `${effect.name} (BS)`, modifier: bsMod, effectType: "characteristic", valueAffected: "bs" });
        if (effect.staticModifiers) {
          modifiersToApply.push(...effect.staticModifiers);
        }
      } else if (effect.modifiers?.length > 0) {
        modifiersToApply = [...effect.modifiers];
      }

      if (modifiersToApply.length > 0) {
        const currentModifiers = this.system.modifiers || [];
        const newModifiers = modifiersToApply.map(m => ({
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
