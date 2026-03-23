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
    schema.armor = new fields.NumberField({ initial: 0, min: 0, integer: true });
    return schema;
  }

  /** @override */
  getArmorValue(_location) {
    return this.armor || 0;
  }

  /** @override */
  getDefenses(_location) {
    return {
      armorValue: this.armor || 0,
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

  /**
   * Apply damage as magnitude reduction. Each hit that penetrates reduces magnitude by 1.
   * @override
   */
  async receiveDamage(options) {
    const actor = this.parent;
    const { damage, penetration, isPrimitive = false,
      isRazorSharp = false, degreesOfSuccess = 0, isMeltaRange = false,
      magnitudeBonusDamage = 0 } = options;

    const armorValue = this.armor || 0;
    const toughnessBonus = this.characteristics?.tg?.baseMod || 0;
    const unnaturalMultiplier = this.characteristics?.tg?.unnaturalMultiplier || 1;
    const effectiveTB = toughnessBonus * unnaturalMultiplier;

    const baseMagnitudeLost = HordeCombatHelper.calculateMagnitudeReduction(
      damage, armorValue, penetration, effectiveTB,
      { isPrimitive, isRazorSharp, degreesOfSuccess, isMeltaRange }
    );

    const magnitudeLost = baseMagnitudeLost > 0 ? baseMagnitudeLost + magnitudeBonusDamage : 0;

    if (magnitudeLost > 0) {
      const currentMagnitude = this.wounds.value || 0;
      const newMagnitude = currentMagnitude + magnitudeLost;
      await FoundryAdapter.updateDocument(actor, { "system.wounds.value": newMagnitude });

      const maxMagnitude = this.wounds.max || 0;
      const destroyed = newMagnitude >= maxMagnitude;

      let message = `<strong>${actor.name}</strong> loses <strong style="color: red;">${magnitudeLost} Magnitude</strong> (${newMagnitude}/${maxMagnitude})`;
      message += `<br><em>Damage: ${damage} | Armor: ${armorValue} | Penetration: ${penetration} | TB: ${effectiveTB}</em>`;
      if (magnitudeBonusDamage > 0) {
        message += `<br><em>+${magnitudeBonusDamage} bonus Magnitude from ammunition</em>`;
      }
      if (destroyed) {
        message += `<br><strong style="color: darkred; font-size: 1.1em;">☠ HORDE DESTROYED ☠</strong>`;
      }

      FoundryAdapter.showNotification(
        destroyed ? 'warn' : 'info',
        destroyed ? `${actor.name} has been destroyed!` : `${actor.name} loses ${magnitudeLost} Magnitude!`
      );
      await FoundryAdapter.createChatMessage(message);
    } else {
      FoundryAdapter.showNotification('info', `${actor.name}'s armor absorbs all damage!`);
      const message = `<strong>${actor.name}</strong>'s armor and toughness absorb all damage<br><em>Damage: ${damage} | Armor: ${armorValue} | Penetration: ${penetration} | TB: ${effectiveTB}</em>`;
      await FoundryAdapter.createChatMessage(message);
    }
  }
}
