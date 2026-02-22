import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES, RANGE_MODIFIERS } from "./constants.mjs";
import { debug } from "./debug.mjs";

export class CombatHelper {

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

    const distance = canvas.grid.measurePath([token1.center, token2.center]).distance;
    return distance;
  }
  
  static async weaponAttackDialog(actor, weapon) {
    const bs = actor.system.characteristics.bs.value;
    const bsAdv = actor.system.characteristics.bs.advances || 0;

    // Check if weapon uses ammo and has ammo loaded
    if (weapon.system.capacity && weapon.system.capacity.max > 0) {
      if (!weapon.system.loadedAmmo) {
        ui.notifications.warn(`${weapon.name} has no ammunition loaded!`);
        return;
      }
      const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
      if (!loadedAmmo || loadedAmmo.system.capacity.value <= 0) {
        ui.notifications.warn(`${weapon.name} is out of ammunition!`);
        return;
      }
    }

    // Get selected tokens for range calculation
    const attackerToken = canvas.tokens.controlled[0];
    const targetToken = game.user.targets.first();
    
    if (!targetToken) {
      ui.notifications.warn("No target selected. Please target a token before attacking.");
    }
    
    let autoRangeMod = 0;
    let rangeLabel = "Unknown";
    let distanceText = "";
    
    if (attackerToken && targetToken && weapon.system.range) {
      const weaponRange = parseInt(weapon.system.range) || 0;
      if (weaponRange > 0) {
        const distance = this.getTokenDistance(attackerToken, targetToken);
        if (distance !== null) {
          const rangeInfo = this.calculateRangeModifier(distance, weaponRange);
          autoRangeMod = rangeInfo.modifier;
          rangeLabel = rangeInfo.label;
          distanceText = `<div class="form-group"><strong>Distance:</strong> ${Math.round(distance)}m (${rangeLabel} Range: ${autoRangeMod >= 0 ? '+' : ''}${autoRangeMod})</div>`;
        }
      }
    }

    // Parse weapon RoF (e.g., "S/2/4" or "S/-/-" or "-/3/-")
    const rof = weapon.system.rof || "S/-/-";
    const rofParts = rof.split('/');
    const loadedAmmo = weapon.system.loadedAmmo ? actor.items.get(weapon.system.loadedAmmo) : null;
    const currentAmmo = loadedAmmo?.system.capacity.value || 0;
    const hasSingle = rofParts[0] && rofParts[0] !== '-';
    const semiAutoRounds = parseInt(rofParts[1]) || 0;
    const fullAutoRounds = parseInt(rofParts[2]) || 0;
    const hasSemiAuto = rofParts[1] && rofParts[1] !== '-' && currentAmmo >= semiAutoRounds;
    const hasFullAuto = rofParts[2] && rofParts[2] !== '-' && currentAmmo >= fullAutoRounds;

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
      title: `Attack with ${weapon.name}`,
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

            // Determine rounds fired based on RoF
            let roundsFired = 1;
            if (autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO) {
              roundsFired = parseInt(rofParts[1]) || 1;
            } else if (autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
              roundsFired = parseInt(rofParts[2]) || 1;
            }

            // Determine max hits based on RoF
            let maxHits = roundsFired;

            const modifiers = bsAdv + aim + autoFire + calledShot + autoRangeMod + runningTarget + miscModifier;
            const clampedModifiers = Math.max(-60, Math.min(60, modifiers));
            const targetNumber = bs + clampedModifiers;
            
            const hitRoll = await new Roll('1d100').evaluate();
            const hitValue = hitRoll.total;
            const calculatedHits = hitValue <= targetNumber ? 1 + Math.floor((targetNumber - hitValue) / 10) : 0;
            const hitsTotal = Math.min(calculatedHits, maxHits);

            let modifierParts = [];
            modifierParts.push(`${bs} Base BS`);
            if (bsAdv !== 0) modifierParts.push(`${bsAdv >= 0 ? '+' : ''}${bsAdv} BS Advances`);
            if (aim !== 0) modifierParts.push(`+${aim} Aim`);
            if (autoFire !== 0) modifierParts.push(`+${autoFire} Rate of Fire`);
            if (calledShot !== 0) modifierParts.push(`${calledShot} Called Shot`);
            if (autoRangeMod !== 0) modifierParts.push(`${autoRangeMod >= 0 ? '+' : ''}${autoRangeMod} Range`);
            if (runningTarget !== 0) modifierParts.push(`${runningTarget} Running Target`);
            if (miscModifier !== 0) modifierParts.push(`${miscModifier >= 0 ? '+' : ''}${miscModifier} Misc`);

            const label = `[Attack] ${weapon.name} - Target: ${targetNumber}<br><strong>${hitsTotal > 0 ? 'HIT!' : 'MISS!'} - ${hitsTotal} Hit${hitsTotal !== 1 ? 's' : ''}</strong>`;
            const flavor = modifierParts.length > 0 ? `${label}<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>` : label;

            hitRoll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: flavor,
              rollMode: game.settings.get('core', 'rollMode')
            });

            let finalHits = hitsTotal;
            if (hitsTotal > 0 && targetToken?.actor) {
              const dodgeResult = await this.dodgeParryDialog(targetToken.actor, hitsTotal);
              finalHits = hitsTotal - dodgeResult.hitsNegated;
              if (finalHits > 0) {
                ui.notifications.info(`${finalHits} hit${finalHits !== 1 ? 's' : ''} confirmed!`);
              }
            }

            // Deduct ammunition if weapon has loaded ammo
            if (weapon.system.loadedAmmo) {
              const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
              if (loadedAmmo) {
                const currentValue = loadedAmmo.system.capacity.value;
                const newAmmoValue = Math.max(0, currentValue - roundsFired);
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

  static async weaponDamageRoll(actor, weapon) {
    const dmg = weapon.system.dmg;
    if (!dmg) return ui.notifications.warn("This weapon has no damage value.");

    const roll = await new Roll(dmg).evaluate();
    const flavor = `<h2>${weapon.name} - Damage Roll</h2><p>Penetration: ${weapon.system.penetration}</p>`;
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: flavor
    });
  }

  static async dodgeParryDialog(targetActor, hitsTotal) {
    if (!targetActor) return { dodged: false, hitsNegated: 0 };

    const dodge = targetActor.system.skills?.dodge;
    if (!dodge || (!dodge.isBasic && !dodge.trained)) {
      return { dodged: false, hitsNegated: 0 };
    }

    const ag = targetActor.system.characteristics.ag;
    const agValue = ag?.value || 0;
    const effectiveChar = dodge.trained ? agValue : Math.floor(agValue / 2);
    const charBonus = Math.floor(agValue / 10);
    const skillBonus = dodge.advanced ? 20 : (dodge.mastered ? 10 : 0);
    const skillModTotal = dodge.modifierTotal || 0;
    const dodgeTarget = effectiveChar + charBonus + skillBonus + (dodge.modifier || 0) + skillModTotal;

    return new Promise((resolve) => {
      new Dialog({
        title: `Dodge Reaction - ${targetActor.name}`,
        content: `
          <p><strong>${hitsTotal} hit${hitsTotal > 1 ? 's' : ''} incoming!</strong></p>
          <p>Dodge Target: ${dodgeTarget}</p>
          <p>Each degree of success negates ${hitsTotal > 1 ? 'one hit' : 'the hit'}.</p>
        `,
        buttons: {
          dodge: {
            label: "Attempt Dodge",
            callback: async () => {
              const roll = await new Roll('1d100').evaluate();
              const success = roll.total <= dodgeTarget;
              const degrees = Math.floor(Math.abs(dodgeTarget - roll.total) / 10);
              const hitsNegated = success ? Math.min(degrees, hitsTotal) : 0;

              roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: targetActor }),
                flavor: `<strong>Dodge Test</strong><br>Target: ${dodgeTarget}<br>${success ? `SUCCESS! (${degrees} DoS) - ${hitsNegated} hit${hitsNegated !== 1 ? 's' : ''} negated` : `FAILED! (${degrees} DoF)`}`
              });

              resolve({ dodged: success, hitsNegated });
            }
          },
          skip: {
            label: "No Reaction",
            callback: () => resolve({ dodged: false, hitsNegated: 0 })
          }
        },
        default: "dodge",
        close: () => resolve({ dodged: false, hitsNegated: 0 })
      }).render(true);
    });
  }
}
