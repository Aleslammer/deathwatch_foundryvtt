import { RANGE_MODIFIERS } from "../constants.mjs";
import { CombatDialogHelper } from "./combat-dialog.mjs";
import { CanvasHelper, FoundryAdapter } from "../foundry-adapter.mjs";
import { ChatMessageBuilder } from "../ui/chat-message-builder.mjs";
import { RangedCombatHelper } from "./ranged-combat.mjs";
import { MeleeCombatHelper } from "./melee-combat.mjs";
import { WeaponQualityHelper } from "./weapon-quality-helper.mjs";
import { RighteousFuryHelper } from "./righteous-fury-helper.mjs";
import { debug } from "../debug.mjs";
import { HordeCombatHelper } from "./horde-combat.mjs";

export class CombatHelper {
  static lastAttackRoll = null;
  static lastAttackTarget = null;
  static lastAttackHits = 1;
  static lastAttackAim = 0;
  static lastAttackRangeLabel = null;
  static lastAttackDistance = null;
  static lastCalledShotLocation = null;

  static calculateRangeModifier(distance, weaponRange) {
    debug('COMBAT', `Distance: ${distance}m, Weapon Range: ${weaponRange}m`);
    if (distance <= 2) {
      return { modifier: RANGE_MODIFIERS.POINT_BLANK, label: "Point Blank" };
    } else if (distance < (weaponRange * 0.5)) {
      return { modifier: RANGE_MODIFIERS.SHORT, label: "Short" };
    } else if (distance >= (weaponRange * 3)) {
      return { modifier: RANGE_MODIFIERS.EXTREME, label: "Extreme" };
    } else if (distance >= (weaponRange * 2)) {
      return { modifier: RANGE_MODIFIERS.LONG, label: "Long" };
    } else {
      return { modifier: RANGE_MODIFIERS.NORMAL, label: "Normal" };
    }
  }

  static getTokenDistance(token1, token2) {
    if (!token1 || !token2) return null;
    if (token1.scene.id !== token2.scene.id) return null;

    const distance = CanvasHelper.measureDistance(token1, token2);
    return distance;
  }
  
  static async clearJam(actor, weapon) {
    if (!weapon.system.jammed) {
      FoundryAdapter.showNotification('info', `${weapon.name} is not jammed.`);
      return;
    }

    const bs = actor.system.characteristics.bs.value || 0;
    const advances = actor.system.characteristics.bs.advances || {};
    const bsAdv = (advances.simple ? 5 : 0) + (advances.intermediate ? 5 : 0) + (advances.trained ? 5 : 0) + (advances.expert ? 5 : 0);
    const targetNumber = CombatDialogHelper.calculateClearJamTarget(bs, bsAdv);

    const roll = await FoundryAdapter.evaluateRoll('1d100');
    const success = roll.total <= targetNumber;

    if (success) {
      await FoundryAdapter.updateDocument(weapon, { "system.jammed": false });
      if (weapon.system.loadedAmmo) {
        const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
        if (loadedAmmo) {
          await FoundryAdapter.updateDocument(loadedAmmo, { "system.capacity.value": 0 });
        }
        await FoundryAdapter.updateDocument(weapon, { "system.loadedAmmo": null });
      }
      FoundryAdapter.showNotification('info', `${weapon.name} jam cleared! Weapon needs reloading.`);
    } else {
      FoundryAdapter.showNotification('warn', `Failed to clear jam on ${weapon.name}.`);
    }

    const flavor = CombatDialogHelper.buildClearJamFlavor(weapon.name, targetNumber, success);
    const speaker = FoundryAdapter.getChatSpeaker(actor);
    await FoundryAdapter.sendRollToChat(roll, speaker, flavor);
  }

  /**
   * Determine the attack type for a weapon.
   * @param {Object} weapon - Weapon item
   * @returns {Promise<string>} 'melee', 'flame', or 'ranged'
   */
  static async getWeaponAttackType(weapon) {
    if (weapon.system.class?.toLowerCase().includes('melee')) return 'melee';
    if (await WeaponQualityHelper.hasQuality(weapon, 'flame')) return 'flame';
    return 'ranged';
  }

  /* istanbul ignore next */
  static async weaponAttackDialog(actor, weapon) {
    const attackType = await this.getWeaponAttackType(weapon);
    if (attackType === 'melee') return MeleeCombatHelper.attackDialog(actor, weapon);
    if (attackType === 'flame') return this._flameWeaponRoll(actor, weapon);
    return RangedCombatHelper.attackDialog(actor, weapon);
  }

  /**
   * Roll damage for a flame weapon and post to chat. No attack roll needed.
   * GM uses the Flame Attack macro to apply damage to individual targets.
   * @param {Object} actor - Actor document
   * @param {Object} weapon - Weapon item
   */
  /* istanbul ignore next */
  static async _flameWeaponRoll(actor, weapon) {
    const dmg = weapon.system.effectiveDamage || weapon.system.dmg;
    if (!dmg) return FoundryAdapter.showNotification('warn', 'This weapon has no damage value.');

    const penetration = weapon.system.effectivePenetration ?? weapon.system.penetration ?? 0;
    const dmgType = weapon.system.dmgType || 'Energy';
    const range = weapon.system.effectiveRange || weapon.system.range || '—';

    const roll = await FoundryAdapter.evaluateRoll(dmg);
    const flavor = `<strong style="font-size: 1.1em;">\uD83D\uDD25 ${weapon.name}</strong><br><strong>Range:</strong> ${range}m | <strong>Damage:</strong> ${roll.total} | <strong>Pen:</strong> ${penetration} | <strong>Type:</strong> ${dmgType}<br><em>No attack roll — all targets in 30° cone must test Agility to dodge. Use \uD83D\uDD25 Flame Attack macro to apply damage per target.</em>`;

    const speaker = FoundryAdapter.getChatSpeaker(actor);
    await FoundryAdapter.sendRollToChat(roll, speaker, flavor);
  }

  static determineHitLocation(attackRoll) {
    const normalizedRoll = attackRoll === 100 ? 0 : attackRoll;
    const paddedRoll = normalizedRoll.toString().padStart(2, '0');
    const reversed = parseInt(paddedRoll.split('').reverse().join(''));
    if (reversed >= 1 && reversed <= 10) return "Head";
    if (reversed >= 11 && reversed <= 20) return "Right Arm";
    if (reversed >= 21 && reversed <= 30) return "Left Arm";
    if (reversed >= 31 && reversed <= 70) return "Body";
    if (reversed >= 71 && reversed <= 85) return "Right Leg";
    return "Left Leg";
  }

  static determineMultipleHitLocations(firstLocation, totalHits) {
    if (totalHits <= 1) return [firstLocation];

    const hitPattern = {
      "Head": ["Head", "Head", "Arm", "Body", "Arm", "Body"],
      "Right Arm": ["Right Arm", "Left Arm", "Body", "Head", "Body", "Arm"],
      "Left Arm": ["Left Arm", "Right Arm", "Body", "Head", "Body", "Arm"],
      "Body": ["Body", "Body", "Arm", "Head", "Arm", "Body"],
      "Right Leg": ["Right Leg", "Left Leg", "Body", "Arm", "Head", "Body"],
      "Left Leg": ["Left Leg", "Right Leg", "Body", "Arm", "Head", "Body"]
    };

    const basePattern = hitPattern[firstLocation] || hitPattern["Body"];
    const locations = [];
    let armToggle = firstLocation.includes("Right");
    let legToggle = firstLocation.includes("Right");

    for (let i = 0; i < totalHits; i++) {
      let location = basePattern[Math.min(i, 5)];
      
      if (location === "Arm") {
        location = armToggle ? "Right Arm" : "Left Arm";
        armToggle = !armToggle;
      } else if (location === "Leg") {
        location = legToggle ? "Right Leg" : "Left Leg";
        legToggle = !legToggle;
      }
      
      locations.push(location);
    }

    return locations;
  }

  static getArmorValue(actor, location) {
    return actor.system.getArmorValue(location);
  }

  static _getTargetDefenses(targetActor, location) {
    return targetActor.system.getDefenses(location);
  }


  static async applyDamage(targetActor, options) {
    return targetActor.system.receiveDamage(options);
  }

  static hasNaturalTen(roll) {
    return RighteousFuryHelper.hasNaturalTen(roll, 10);
  }

  static _getFuryThreshold(weapon, actor) {
    if (!weapon.system.loadedAmmo || !actor) return 10;
    const ammo = actor.items.get(weapon.system.loadedAmmo);
    if (!ammo || !Array.isArray(ammo.system.modifiers)) return 10;
    
    for (const mod of ammo.system.modifiers) {
      if (mod.enabled !== false && mod.effectType === 'righteous-fury-threshold') {
        return parseInt(mod.modifier) || 10;
      }
    }
    return 10;
  }

  static _getMagnitudeBonusDamage(weapon, actor) {
    if (!weapon.system.loadedAmmo || !actor) return 0;
    const ammo = actor.items.get(weapon.system.loadedAmmo);
    if (!ammo || !Array.isArray(ammo.system.modifiers)) return 0;
    
    for (const mod of ammo.system.modifiers) {
      if (mod.enabled !== false && mod.effectType === 'magnitude-bonus-damage') {
        return parseInt(mod.modifier) || 0;
      }
    }
    return 0;
  }

  static _getCharacteristicDamageEffect(weapon, actor) {
    if (!weapon.system.loadedAmmo || !actor) return null;
    const ammo = actor.items.get(weapon.system.loadedAmmo);
    if (!ammo || !Array.isArray(ammo.system.modifiers)) return null;
    
    for (const mod of ammo.system.modifiers) {
      if (mod.enabled !== false && mod.effectType === 'characteristic-damage') {
        return {
          formula: mod.modifier,
          characteristic: mod.valueAffected,
          name: mod.name
        };
      }
    }
    return null;
  }

  static _getIgnoresNaturalArmour(weapon, actor) {
    if (!weapon.system.loadedAmmo || !actor) return false;
    const ammo = actor.items.get(weapon.system.loadedAmmo);
    if (!ammo || !Array.isArray(ammo.system.modifiers)) return false;
    
    for (const mod of ammo.system.modifiers) {
      if (mod.enabled !== false && mod.effectType === 'ignores-natural-armour') {
        return true;
      }
    }
    return false;
  }

  static async rollRighteousFury(actor, weapon, targetNumber, hitLocation) {
    return RighteousFuryHelper.rollConfirmation(actor, targetNumber, hitLocation);
  }

  /* istanbul ignore next */
  static async weaponDamageRoll(actor, weapon) {
    const dmg = weapon.system.effectiveDamage || weapon.system.dmg;
    if (!dmg) return ui.notifications.warn("This weapon has no damage value.");

    const defaultRoll = this.lastAttackRoll || '';
    const defaultTarget = this.lastAttackTarget || '';
    const defaultHits = this.lastAttackHits || 1;
    const aimUsed = this.lastAttackAim || 0;
    const isMelee = weapon.system.class?.toLowerCase().includes('melee');
    const strBonus = actor.system.characteristics.str?.mod || 0;
    const targetToken = game.user.targets.first();
    const tokenInfo = targetToken?.document ? { sceneId: targetToken.document.parent.id, tokenId: targetToken.document.id } : null;

    const content = `
      <div style="display: flex; gap: 10px;">
        <div class="form-group" style="flex: 1;">
          <label>Attack Roll:</label>
          <input type="number" id="attackRoll" name="attackRoll" value="${defaultRoll}" placeholder="e.g., 32" min="1" max="100" readonly />
        </div>
        <div class="form-group" style="flex: 1;">
          <label>Target Number:</label>
          <input type="number" id="targetNumber" name="targetNumber" value="${defaultTarget}" placeholder="e.g., 50" min="1" max="200" readonly />
        </div>
      </div>
      <div class="form-group">
        <label>Number of Hits:</label>
        <input type="number" id="numHits" name="numHits" value="${defaultHits}" min="1" max="10" />
      </div>
      <div class="form-group">
        <label>Misc Damage Modifier:</label>
        <input type="text" id="miscDamageModifier" name="miscDamageModifier" value="" placeholder="e.g., 5 or 1d10" />
      </div>
      ${targetToken ? `<div class="form-group"><strong>Target:</strong> ${targetToken.actor.name}</div>` : ''}
    `;

    new Dialog({
      title: `Damage: ${weapon.name}`,
      content: content,
      buttons: {
        roll: {
          label: "Roll Damage",
          callback: async (html) => {
            const attackRollInput = html.find('#attackRoll').val();
            const targetNumberInput = html.find('#targetNumber').val();
            const numHits = parseInt(html.find('#numHits').val()) || 1;
            const miscDamageModifier = html.find('#miscDamageModifier').val()?.trim() || '';
            let firstHitLocation = "Unknown";
            let degreesOfSuccess = 0;
            let targetNumber = 0;
            
            if (attackRollInput && targetNumberInput) {
              const attackRoll = parseInt(attackRollInput);
              targetNumber = parseInt(targetNumberInput);
              if (attackRoll >= 1 && attackRoll <= 100) {
                firstHitLocation = this.lastCalledShotLocation || this.determineHitLocation(attackRoll);
                degreesOfSuccess = CombatDialogHelper.calculateDegreesOfSuccess(attackRoll, targetNumber);
              }
            }
            this.lastCalledShotLocation = null;

            const hitLocations = this.determineMultipleHitLocations(firstHitLocation, numHits);
            const penetration = weapon.system.effectivePenetration ?? weapon.system.penetration ?? weapon.system.pen ?? 0;
            const isAccurate = weapon.system.isAccurate || false;
            const isAiming = aimUsed > 0;
            const isSingleShot = numHits === 1;
            const isPrimitive = weapon.system.isPrimitive || false;
            const isRazorSharp = await WeaponQualityHelper.hasQuality(weapon, 'razor-sharp');
            const isScatter = await WeaponQualityHelper.hasQuality(weapon, 'scatter');
            const isShocking = await WeaponQualityHelper.hasQuality(weapon, 'shocking');
            const isTearing = await WeaponQualityHelper.hasQuality(weapon, 'tearing');
            const isToxic = await WeaponQualityHelper.hasQuality(weapon, 'toxic');
            const isVolatile = await WeaponQualityHelper.hasQuality(weapon, 'volatile');
            const provenRating = await WeaponQualityHelper.getProvenRating(weapon);
            const rangeLabel = this.lastAttackRangeLabel || "Unknown";
            const isLongOrExtremeRange = rangeLabel === "Long" || rangeLabel === "Extreme";
            const isPowerFist = await WeaponQualityHelper.hasQuality(weapon, 'power-fist');
            const isLightningClaw = await WeaponQualityHelper.isLightningClaw(weapon);
            const hasLightningClawPair = await WeaponQualityHelper.hasLightningClawPair(actor);
            const isMelta = await WeaponQualityHelper.isMelta(weapon);
            const distance = this.lastAttackDistance;
            const weaponRange = parseInt(weapon.system.range) || 0;
            const isMeltaRange = isMelta && distance !== null && weaponRange > 0 && distance < (weaponRange * 0.5);
            const furyThreshold = this._getFuryThreshold(weapon, actor);
            const charDamageEffect = this._getCharacteristicDamageEffect(weapon, actor);
            const magnitudeBonusDamage = this._getMagnitudeBonusDamage(weapon, actor);
            const ignoresNaturalArmour = this._getIgnoresNaturalArmour(weapon, actor);
            const isForce = weapon.system.attachedQualities?.some(q => (typeof q === 'string' ? q : q.id) === 'force') || false;
            const psyRating = actor.system?.psyRating?.value || 0;
            const forceWeaponData = (isForce && psyRating > 0) ? { attackerId: actor.id, psyRating } : null;
            
            const isHordeTarget = targetToken?.actor?.type === 'horde';
            const hordeHitResults = [];

            for (let i = 0; i < numHits; i++) {
              let totalDamage = 0;
              
              let damageFormula = CombatDialogHelper.buildDamageFormula({
                baseDmg: dmg,
                degreesOfSuccess,
                isMelee,
                strBonus,
                hitIndex: i,
                isAccurate,
                isAiming,
                isSingleShot,
                isTearing,
                provenRating,
                isPowerFist,
                isLightningClaw,
                hasLightningClawPair
              });

              if (actor.type === 'horde') {
                const currentMagnitude = (actor.system.wounds.max || 0) - (actor.system.wounds.value || 0);
                const bonusDice = HordeCombatHelper.calculateHordeDamageBonusDice(currentMagnitude);
                if (bonusDice > 0) damageFormula += ` + ${bonusDice}d10`;
              }

              if (miscDamageModifier) {
                damageFormula += ` + ${miscDamageModifier}`;
              }

              const roll = await new Roll(damageFormula).evaluate();
              totalDamage += roll.total;

              if (isHordeTarget) {
                if (actor.system.canRighteousFury() && RighteousFuryHelper.hasNaturalTen(roll, furyThreshold) && targetNumber > 0) {
                  const { totalDamage: furyDamage } = await RighteousFuryHelper.processFuryChain(
                    actor, weapon, dmg, targetNumber, hitLocations[i], isVolatile, furyThreshold, targetToken?.actor
                  );
                  totalDamage += furyDamage;
                }

                hordeHitResults.push({
                  damage: totalDamage, penetration, location: hitLocations[i],
                  damageType: weapon.system.dmgType || 'Impact',
                  isPrimitive, isRazorSharp, degreesOfSuccess,
                  isScatter, isLongOrExtremeRange, isMeltaRange, magnitudeBonusDamage, ignoresNaturalArmour
                });
              } else {
                const applyButton = targetToken ? ChatMessageBuilder.createDamageApplyButton(totalDamage, penetration, hitLocations[i], targetToken.actor.id, weapon.system.dmgType || 'Impact', isPrimitive, isRazorSharp, degreesOfSuccess, isScatter, isLongOrExtremeRange, isShocking, isToxic, isMeltaRange, charDamageEffect, forceWeaponData, tokenInfo, magnitudeBonusDamage, ignoresNaturalArmour) : '';
                const flavor = ChatMessageBuilder.createDamageFlavor(weapon.name, i + 1, numHits, hitLocations[i], degreesOfSuccess, penetration, isMelee, strBonus, applyButton);
              
                await roll.toMessage({
                  speaker: ChatMessage.getSpeaker({ actor }),
                  flavor
                });
              
                if (actor.system.canRighteousFury() && RighteousFuryHelper.hasNaturalTen(roll, furyThreshold) && targetNumber > 0) {
                  const { totalDamage: furyDamage, furyCount } = await RighteousFuryHelper.processFuryChain(
                    actor, weapon, dmg, targetNumber, hitLocations[i], isVolatile, furyThreshold, targetToken?.actor
                  );
                
                  totalDamage += furyDamage;
                
                  const applyFuryButton = targetToken ? ChatMessageBuilder.createDamageApplyButton(totalDamage, penetration, hitLocations[i], targetToken.actor.id, weapon.system.dmgType || 'Impact', isPrimitive, isRazorSharp, degreesOfSuccess, isScatter, isLongOrExtremeRange, isShocking, isToxic, isMeltaRange, charDamageEffect, forceWeaponData, tokenInfo, magnitudeBonusDamage, ignoresNaturalArmour) : '';
                  const summaryContent = ChatMessageBuilder.createRighteousFurySummary(furyCount, hitLocations[i], totalDamage, applyFuryButton);
                
                  await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    content: summaryContent
                  });
                }
              }
            }

            if (isHordeTarget && hordeHitResults.length > 0) {
              await targetToken.actor.system.receiveBatchDamage(hordeHitResults);
            }
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "roll"
    }).render(true);
  }
}
