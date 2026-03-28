export class WeaponQualityHelper {
  static async getQualityKey(qualityId) {
    const pack = game.packs.get('deathwatch.weapon-qualities');
    if (!pack) return null;
    const quality = await pack.getDocument(qualityId);
    return quality?.system?.key || null;
  }

  static async getQualityValue(qualityId, field) {
    const pack = game.packs.get('deathwatch.weapon-qualities');
    if (!pack) return null;
    const quality = await pack.getDocument(qualityId);
    return quality?.system?.[field] || null;
  }

  static async hasQuality(weapon, qualityKey) {
    const qualityIds = weapon.system.attachedQualities || [];
    for (const q of qualityIds) {
      const id = typeof q === 'string' ? q : q.id;
      const key = await this.getQualityKey(id);
      if (key === qualityKey) return true;
    }
    return false;
  }

  static async getProvenRating(weapon) {
    const qualityIds = weapon.system.attachedQualities || [];
    for (const q of qualityIds) {
      const id = typeof q === 'string' ? q : q.id;
      const key = await this.getQualityKey(id);
      if (key === 'proven') {
        const value = await this.getQualityValue(id, 'value');
        return parseInt(value) || 0;
      }
    }
    return 0;
  }

  static async isLightningClaw(weapon) {
    return await this.hasQuality(weapon, 'lightning-claw');
  }

  static async hasLightningClawPair(actor) {
    const equippedClaws = [];
    for (const item of actor.items) {
      if (item.type === 'weapon' && item.system.equipped && await this.isLightningClaw(item)) {
        equippedClaws.push(item);
      }
    }
    return equippedClaws.length >= 2;
  }

  static async isMelta(weapon) {
    return await this.hasQuality(weapon, 'melta');
  }

  static async isStalkerPattern(weapon) {
    return await this.hasQuality(weapon, 'stalker-pattern');
  }

  static async getBlastValue(weapon) {
    if (weapon.system.effectiveBlast) return weapon.system.effectiveBlast;
    const qualityIds = weapon.system.attachedQualities || [];
    for (const q of qualityIds) {
      const id = typeof q === 'string' ? q : q.id;
      const key = await this.getQualityKey(id);
      if (key === 'blast') {
        const value = typeof q === 'object' ? q.value : await this.getQualityValue(id, 'value');
        return parseInt(value) || 0;
      }
    }
    return 0;
  }
}
