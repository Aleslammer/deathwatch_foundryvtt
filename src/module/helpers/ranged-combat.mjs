import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from "./constants.mjs";
import { CombatDialogHelper } from "./combat-dialog.mjs";
import { CombatHelper } from "./combat.mjs";
import { WeaponQualityHelper } from "./weapon-quality-helper.mjs";
import { WeaponUpgradeHelper } from "./weapon-upgrade-helper.mjs";

export class RangedCombatHelper {
  static calculateThrownWeaponRange(weapon, actor) {
    if (weapon.system.class?.toLowerCase() !== 'thrown') {
      return null;
    }
    const match = weapon.system.range?.match(/sb\s*x\s*(\d+)/i);
    if (!match) {
      return null;
    }
    const multiplier = parseInt(match[1]);
    const strBonus = actor.system.characteristics.str?.mod || 0;
    return strBonus * multiplier;
  }

  /* istanbul ignore next */
  static async attackDialog(actor, weapon) {
    const validation = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    if (!validation.valid) {
      ui.notifications.warn(validation.message);
      return;
    }

    const bs = actor.system.characteristics.bs.base || actor.system.characteristics.bs.value;
    const advances = actor.system.characteristics.bs.advances || {};
    const bsAdv = (advances.simple ? 5 : 0) + (advances.intermediate ? 5 : 0) + (advances.trained ? 5 : 0) + (advances.expert ? 5 : 0);

    const attackerToken = actor.getActiveTokens()[0] || canvas.tokens.controlled[0];
    const targetToken = game.user.targets.first();
    
    if (!targetToken) {
      ui.notifications.warn("No target selected. Please target a token before attacking.");
    }
    
    let autoRangeMod = 0;
    let rangeLabel = "Unknown";
    let distanceText = "";
    
    if (attackerToken && targetToken) {
      let weaponRange = 0;
      if (weapon.system.class?.toLowerCase() === 'thrown') {
        const thrownRange = this.calculateThrownWeaponRange(weapon, actor);
        weaponRange = thrownRange || 0;
      }
      else {
        weaponRange = parseInt(weapon.system.range) || 0;
      }
      
      if (weaponRange > 0) {
        const distance = CombatHelper.getTokenDistance(attackerToken, targetToken);
        if (distance !== null) {
          const rangeInfo = CombatHelper.calculateRangeModifier(distance, weaponRange);
          autoRangeMod = rangeInfo.modifier;
          rangeLabel = rangeInfo.label;
          distanceText = `<div class="form-group"><strong>Distance:</strong> ${Math.round(distance)}m (${rangeLabel} Range: ${autoRangeMod >= 0 ? '+' : ''}${autoRangeMod})</div>`;
        }
      } else {
        distanceText = `<div class="form-group"><strong>Warning:</strong> Weapon has no range value set (range: ${weapon.system.range})</div>`;
      }
    }

    const rof = weapon.system.rof || "S/-/-";
    const rofParts = rof.split('/');
    const clip = weapon.system.clip;
    const hasAmmoManagement = clip && clip !== '—' && clip !== '-' && clip !== '';
    const loadedAmmo = hasAmmoManagement && weapon.system.loadedAmmo ? actor.items.get(weapon.system.loadedAmmo) : null;
    const currentAmmo = loadedAmmo?.system.capacity.value || 0;
    const hasSingle = rofParts[0] && rofParts[0] !== '-';
    const semiAutoRounds = parseInt(rofParts[1]) || 0;
    const fullAutoRounds = parseInt(rofParts[2]) || 0;
    const hasSemiAuto = rofParts[1] && rofParts[1] !== '-' && (!hasAmmoManagement || currentAmmo >= semiAutoRounds);
    const hasFullAuto = rofParts[2] && rofParts[2] !== '-' && (!hasAmmoManagement || currentAmmo >= fullAutoRounds);

    let rofOptions = '';
    if (hasSingle) rofOptions += `<option value="${RATE_OF_FIRE_MODIFIERS.SINGLE}" data-rounds="1">Single (1 round)</option>`;
    if (hasSemiAuto) rofOptions += `<option value="${RATE_OF_FIRE_MODIFIERS.SEMI_AUTO}" data-rounds="${semiAutoRounds}">Semi-Auto (+${RATE_OF_FIRE_MODIFIERS.SEMI_AUTO}, ${semiAutoRounds} rounds)</option>`;
    if (hasFullAuto) rofOptions += `<option value="${RATE_OF_FIRE_MODIFIERS.FULL_AUTO}" data-rounds="${fullAutoRounds}">Full-Auto (+${RATE_OF_FIRE_MODIFIERS.FULL_AUTO}, ${fullAutoRounds} rounds)</option>`;

    const content = `
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${weapon.img}" alt="${weapon.name}" style="max-width: 100px; max-height: 100px; border: none;" />
      </div>
      ${distanceText}
      <div class="form-group">
        <label>Aim:</label>
        <select id="aim" name="aim">
          <option value="${AIM_MODIFIERS.NONE}">None</option>
          <option value="${AIM_MODIFIERS.HALF}">Half (+${AIM_MODIFIERS.HALF})</option>
          <option value="${AIM_MODIFIERS.FULL}">Full (+${AIM_MODIFIERS.FULL})</option>
        </select>
      </div>
      <div class="form-group">
        <label>Rate of Fire:</label>
        <select id="autoFire" name="autoFire">
          ${rofOptions}
        </select>
      </div>
      <div class="form-group" style="display: flex; gap: 20px;">
        <label><i class="far fa-square" id="calledShotIcon"></i> Called Shot (${COMBAT_PENALTIES.CALLED_SHOT})
          <input type="checkbox" id="calledShot" name="calledShot" style="display:none;" />
        </label>
        <label><i class="far fa-square" id="runningTargetIcon"></i> Running Target (${COMBAT_PENALTIES.RUNNING_TARGET})
          <input type="checkbox" id="runningTarget" name="runningTarget" style="display:none;" />
        </label>
      </div>
      <div class="form-group">
        <label>Misc Modifier:</label>
        <input type="text" id="miscModifier" name="miscModifier" value="0" />
      </div>
    `;

    new Dialog({
      title: `Ranged Attack: ${weapon.name}`,
      content: content,
      render: (html) => {
        html.find('#miscModifier').on('input', function() {
          this.value = this.value.replace(/[^0-9+\-]/g, '');
        });
        
        html.find('label:has(#calledShot)').click(function(e) {
          e.preventDefault();
          const checkbox = $(this).find('#calledShot');
          const icon = $(this).find('#calledShotIcon');
          checkbox.prop('checked', !checkbox.prop('checked'));
          icon.toggleClass('fa-square').toggleClass('fa-check-square');
        });
        
        html.find('label:has(#runningTarget)').click(function(e) {
          e.preventDefault();
          const checkbox = $(this).find('#runningTarget');
          const icon = $(this).find('#runningTargetIcon');
          checkbox.prop('checked', !checkbox.prop('checked'));
          icon.toggleClass('fa-square').toggleClass('fa-check-square');
        });
      },
      buttons: {
        attack: {
          label: "Attack",
          callback: async (html) => {
            const aim = parseInt(html.find('#aim').val()) || 0;
            const autoFire = parseInt(html.find('#autoFire').val()) || 0;
            const calledShot = html.find('#calledShot').prop('checked') ? COMBAT_PENALTIES.CALLED_SHOT : 0;
            const runningTarget = html.find('#runningTarget').prop('checked') ? COMBAT_PENALTIES.RUNNING_TARGET : 0;
            const miscModifier = parseInt(html.find('#miscModifier').val()) || 0;

            const roundsFired = CombatDialogHelper.determineRoundsFired(autoFire, rofParts);
            const maxHits = roundsFired;

            const isAccurate = await WeaponQualityHelper.hasQuality(weapon, 'accurate');
            const isGyroStabilised = await WeaponQualityHelper.hasQuality(weapon, 'gyro-stabilised');
            const hasOverheats = await WeaponQualityHelper.hasQuality(weapon, 'overheats');
            const isScatter = await WeaponQualityHelper.hasQuality(weapon, 'scatter');
            const isStorm = await WeaponQualityHelper.hasQuality(weapon, 'storm');
            const isTwinLinked = await WeaponQualityHelper.hasQuality(weapon, 'twin-linked');
            const hasLivingAmmo = await WeaponQualityHelper.hasQuality(weapon, 'living-ammunition');
            const isPointBlank = rangeLabel === "Point Blank";
            
            const isSingleShot = roundsFired === 1;
            const upgradeModifiers = await WeaponUpgradeHelper.getModifiers(weapon, isSingleShot);
            const upgradeBSBonus = upgradeModifiers
              .filter(m => m.effectType === 'characteristic' && m.valueAffected === 'bs')
              .reduce((sum, m) => sum + (parseInt(m.modifier) || 0), 0);
            
            const { targetNumber, accurateBonus, gyroRangeMod, twinLinkedBonus } = CombatDialogHelper.buildAttackModifiers({
              bs,
              bsAdv,
              aim,
              autoFire,
              calledShot,
              rangeMod: autoRangeMod,
              runningTarget,
              miscModifier: miscModifier + upgradeBSBonus,
              isAccurate,
              isGyroStabilised,
              isTwinLinked
            });
            
            const hitRoll = await new Roll('1d100').evaluate();
            const hitValue = hitRoll.total;
            const hitsTotal = CombatDialogHelper.calculateHits(hitValue, targetNumber, maxHits, autoFire, isScatter, isPointBlank, isStorm, isTwinLinked);

            const jamThreshold = CombatDialogHelper.determineJamThreshold(autoFire);
            let isJammed = !hasLivingAmmo && hitValue >= jamThreshold;
            const hasReliable = await WeaponQualityHelper.hasQuality(weapon, 'reliable');
            
            if (isJammed && hasReliable) {
              const reliableRoll = await new Roll('1d10').evaluate();
              await reliableRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: `<strong>Reliable Check:</strong> ${weapon.name} - ${reliableRoll.total === 10 ? 'Jammed!' : 'Not Jammed'}`,
                rollMode: game.settings.get('core', 'rollMode')
              });
              isJammed = reliableRoll.total === 10;
            }
            
            const isOverheated = hasOverheats && hitValue >= 91;

            if (isJammed) {
              await weapon.update({ "system.jammed": true });
            }

            CombatHelper.lastAttackRoll = hitValue;
            CombatHelper.lastAttackTarget = targetNumber;
            CombatHelper.lastAttackHits = hitsTotal;
            CombatHelper.lastAttackAim = aim;
            CombatHelper.lastAttackRangeLabel = rangeLabel;

            const modifierParts = CombatDialogHelper.buildModifierParts(bs, bsAdv, aim, autoFire, calledShot, gyroRangeMod, runningTarget, miscModifier, accurateBonus, twinLinkedBonus, upgradeModifiers);
            const label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, isJammed, isOverheated);
            const flavor = CombatDialogHelper.buildAttackFlavor(label, modifierParts);

            hitRoll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: flavor,
              rollMode: game.settings.get('core', 'rollMode')
            });

            if (hasAmmoManagement && weapon.system.loadedAmmo) {
              const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
              if (loadedAmmo) {
                const currentValue = loadedAmmo.system.capacity.value;
                let ammoExpended = roundsFired;
                if (isStorm) ammoExpended *= 2;
                if (isTwinLinked) ammoExpended *= 2;
                const newAmmoValue = Math.max(0, currentValue - ammoExpended);
                await loadedAmmo.update({ "system.capacity.value": newAmmoValue });
                if (newAmmoValue === 0) {
                  ui.notifications.warn(`${weapon.name} is out of ammunition!`);
                }
                actor.sheet.render(false);
              }
            }
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "attack"
    }).render(true);
  }
}
