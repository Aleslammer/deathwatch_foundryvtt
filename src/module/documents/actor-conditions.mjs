export const ActorConditionsMixin = (superclass) => class extends superclass {
  hasCondition(conditionId) {
    return this.system.conditions?.[conditionId] === true;
  }

  async setCondition(conditionId, enabled) {
    const updateData = {};
    updateData[`system.conditions.${conditionId}`] = enabled;
    await this.update(updateData);

    // Update token status effects
    const tokens = this.getActiveTokens(true);
    for (const token of tokens) {
      token._onApplyStatusEffect(conditionId, enabled);
    }

    return enabled;
  }

  async toggleStatusEffect(statusId, options = {}) {
    const hasCondition = this.hasCondition(statusId);
    return this.setCondition(statusId, !hasCondition);
  }
};
