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
}
