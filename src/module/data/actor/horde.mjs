import DeathwatchEnemy from './enemy.mjs';
import { HordeCombatHelper } from '../../helpers/horde-combat.mjs';
import { FoundryAdapter } from '../../helpers/foundry-adapter.mjs';

const { fields } = foundry.data;

/**
 * Horde DataModel. Extends Enemy with a single armor value.
 * Wounds fields represent Magnitude instead of individual wounds.
 * Overrides combat methods for horde-specific mechanics.
 * @extends {DeathwatchEnemy}
 */
export default class DeathwatchHorde extends DeathwatchEnemy {

  static defineSchema() {
    const schema = super.defineSchema();
    schema.gearArmor = new fields.NumberField({ initial: 0, min: 0, integer: true });
    return schema;
  }

  /** @override */
  getArmorValue(_location) {
    return (this.gearArmor || 0) + (this.naturalArmorValue || 0);
  }

  /** @override */
  getDefenses(_location) {
    return {
      armorValue: (this.gearArmor || 0) + (this.naturalArmorValue || 0),
      naturalArmorValue: this.naturalArmorValue || 0,
      toughnessBonus: this.characteristics?.tg?.baseMod || 0,
      unnaturalToughnessMultiplier: this.characteristics?.tg?.unnaturalMultiplier || 1
    };
  }

  /**
   * Calculate hits received using horde rules (blast, flame, melee DoS).
   * @override
   */
  calculateHitsReceived(options) {
    return HordeCombatHelper.calculateHordeHits(options);
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.armor = (this.gearArmor || 0) + (this.naturalArmorValue || 0);
  }

  /**
   * Apply damage as magnitude reduction. Each hit that penetrates reduces magnitude by 1.
   * @override
   */
  async receiveDamage(options) {
    return this.receiveBatchDamage([options]);
  }

  /**
   * Apply multiple hits as a single magnitude update with one summary message.
   * @param {Array<Object>} hits - Array of damage options per hit
   */
  async receiveBatchDamage(hits) {
    const actor = this.parent;
    const baseArmorValue = (this.gearArmor || 0) + (this.naturalArmorValue || 0);
    const toughnessBonus = this.characteristics?.tg?.baseMod || 0;
    const unnaturalMultiplier = this.characteristics?.tg?.unnaturalMultiplier || 1;
    const effectiveTB = toughnessBonus * unnaturalMultiplier;

    let totalMagnitudeLost = 0;
    const hitResults = [];

    for (const hit of hits) {
      const { damage, penetration, isPrimitive = false,
        isRazorSharp = false, degreesOfSuccess = 0, isMeltaRange = false,
        magnitudeBonusDamage = 0, location = 'Body', ignoresNaturalArmour = false } = hit;

      const armorValue = ignoresNaturalArmour
        ? Math.max(0, baseArmorValue - (this.naturalArmorValue || 0))
        : baseArmorValue;

      const baseLost = HordeCombatHelper.calculateMagnitudeReduction(
        damage, armorValue, penetration, effectiveTB,
        { isPrimitive, isRazorSharp, degreesOfSuccess, isMeltaRange }
      );
      const lost = baseLost > 0 ? baseLost + magnitudeBonusDamage : 0;
      totalMagnitudeLost += lost;
      hitResults.push({ damage, penetration, location, lost });
    }

    const currentMagnitude = this.wounds.value || 0;
    const maxMagnitude = this.wounds.max || 0;

    if (totalMagnitudeLost > 0) {
      const newMagnitude = currentMagnitude + totalMagnitudeLost;
      await FoundryAdapter.updateDocument(actor, { "system.wounds.value": newMagnitude });

      const destroyed = newMagnitude >= maxMagnitude;
      const magnitudeBonusDamage = hits[0]?.magnitudeBonusDamage || 0;

      let message = `<strong>${actor.name}</strong> takes <strong>${hits.length}</strong> hit${hits.length > 1 ? 's' : ''}, loses <strong style="color: red;">${totalMagnitudeLost} Magnitude</strong> (${newMagnitude}/${maxMagnitude})`;
      message += `<br><em>Armor: ${baseArmorValue} | TB: ${effectiveTB}</em>`;
      if (magnitudeBonusDamage > 0) {
        message += `<br><em>+${magnitudeBonusDamage} bonus Magnitude per penetrating hit from ammunition</em>`;
      }

      if (hits.length > 1) {
        const penetrating = hitResults.filter(r => r.lost > 0).length;
        const absorbed = hitResults.length - penetrating;
        message += `<details style="margin-top:4px;"><summary style="cursor:pointer; font-size:0.85em;">${penetrating} penetrating, ${absorbed} absorbed — click for details</summary>`;
        message += `<table style="width:100%; font-size:0.85em; margin-top:4px; border-collapse:collapse;">`;
        message += `<tr style="border-bottom:1px solid #999;"><th>#</th><th>Dmg</th><th>Pen</th><th>Result</th></tr>`;
        for (let i = 0; i < hitResults.length; i++) {
          const r = hitResults[i];
          const result = r.lost > 0
            ? `<span style="color:red;">-${r.lost} Mag</span>`
            : `<span style="color:gray;">Absorbed</span>`;
          message += `<tr><td>${i + 1}</td><td>${r.damage}</td><td>${r.penetration}</td><td>${result}</td></tr>`;
        }
        message += `</table></details>`;
      }

      if (destroyed) {
        message += `<br><strong style="color: darkred; font-size: 1.1em;">☠ HORDE DESTROYED ☠</strong>`;
      }

      await FoundryAdapter.createChatMessage(message);
    } else {
      const message = `<strong>${actor.name}</strong> takes <strong>${hits.length}</strong> hit${hits.length > 1 ? 's' : ''} — armor and toughness absorb all damage<br><em>Armor: ${baseArmorValue} | TB: ${effectiveTB}</em>`;
      await FoundryAdapter.createChatMessage(message);
    }
  }
}
