import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES, RANGE_MODIFIERS } from "./constants.mjs";
import { CombatDialogHelper } from "./combat-dialog.mjs";
import { CanvasHelper, FoundryAdapter } from "./foundry-adapter.mjs";
import { ChatMessageBuilder } from "./chat-message-builder.mjs";
import { debug } from "./debug.mjs";

export class CombatHelper {
  static lastAttackRoll = null;
  static lastAttackTarget = null;
  static lastAttackHits = 1;

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

  /* istanbul ignore next */
  static async weaponAttackDialog(actor, weapon) {
    const validation = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    if (!validation.valid) {
      ui.notifications.warn(validation.message);
      return;
    }

    const bs = actor.system.characteristics.bs.base || actor.system.characteristics.bs.value;
    const advances = actor.system.characteristics.bs.advances || {};
    const bsAdv = (advances.simple ? 5 : 0) + (advances.intermediate ? 5 : 0) + (advances.trained ? 5 : 0) + (advances.expert ? 5 : 0);

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

            const roundsFired = CombatDialogHelper.determineRoundsFired(autoFire, rofParts);
            const maxHits = roundsFired;

            const { targetNumber } = CombatDialogHelper.buildAttackModifiers(bs, bsAdv, aim, autoFire, calledShot, autoRangeMod, runningTarget, miscModifier);
            
            const hitRoll = await new Roll('1d100').evaluate();
            const hitValue = hitRoll.total;
            const hitsTotal = CombatDialogHelper.calculateHits(hitValue, targetNumber, maxHits);

            const jamThreshold = CombatDialogHelper.determineJamThreshold(autoFire);
            const isJammed = hitValue >= jamThreshold;

            if (isJammed) {
              await weapon.update({ "system.jammed": true });
            }

            CombatHelper.lastAttackRoll = hitValue;
            CombatHelper.lastAttackTarget = targetNumber;
            CombatHelper.lastAttackHits = hitsTotal;

            const modifierParts = CombatDialogHelper.buildModifierParts(bs, bsAdv, aim, autoFire, calledShot, autoRangeMod, runningTarget, miscModifier);
            const label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, isJammed);
            const flavor = CombatDialogHelper.buildAttackFlavor(label, modifierParts);

            hitRoll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: flavor,
              rollMode: game.settings.get('core', 'rollMode')
            });

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
    const equippedArmor = actor.items.find(i => i.type === 'armor' && i.system.equipped);
    if (!equippedArmor) return 0;

    const locationMap = {
      "Head": "head",
      "Body": "body",
      "Right Arm": "right_arm",
      "Left Arm": "left_arm",
      "Right Leg": "right_leg",
      "Left Leg": "left_leg"
    };

    const armorField = locationMap[location];
    return armorField ? (equippedArmor.system[armorField] || 0) : 0;
  }

  static async applyDamage(targetActor, damage, penetration, location, damageType = 'Impact') {
    const armorValue = this.getArmorValue(targetActor, location);
    const { effectiveArmor, woundsTaken } = CombatDialogHelper.calculateDamageResult(damage, armorValue, penetration);

    if (woundsTaken > 0) {
      const currentDamage = targetActor.system.wounds.value || 0;
      const maxWounds = targetActor.system.wounds.max || 0;
      const { newWounds, isCritical, criticalDamage } = CombatDialogHelper.calculateCriticalDamage(currentDamage, woundsTaken, maxWounds);

      await FoundryAdapter.updateDocument(targetActor, { "system.wounds.value": newWounds });
      
      const message = CombatDialogHelper.buildDamageMessage(
        targetActor.name, woundsTaken, location, damage, armorValue, penetration, 
        effectiveArmor, isCritical, criticalDamage, targetActor.id, damageType
      );
      
      if (isCritical) {
        FoundryAdapter.showNotification('warn', `${targetActor.name} is taking CRITICAL DAMAGE!`);
      } else {
        FoundryAdapter.showNotification('info', `${targetActor.name} takes ${woundsTaken} wounds!`);
      }

      await FoundryAdapter.createChatMessage(message);
    } else {
      FoundryAdapter.showNotification('info', `${targetActor.name}'s armor absorbs all damage!`);
      const message = CombatDialogHelper.buildArmorAbsorbMessage(targetActor.name, location, damage, armorValue, penetration);
      await FoundryAdapter.createChatMessage(message);
    }
  }

  static hasNaturalTen(roll) {
    return roll.dice.some(d => d.results.some(r => r.result === 10 || (d.faces === 5 && r.result === 5)));
  }

  static async rollRighteousFury(actor, weapon, targetNumber, hitLocation) {
    const confirmRoll = await FoundryAdapter.evaluateRoll('1d100');
    const confirmed = confirmRoll.total <= targetNumber;
    
    const speaker = FoundryAdapter.getChatSpeaker(actor);
    const flavor = ChatMessageBuilder.createRighteousFuryFlavor(targetNumber, confirmed);
    await FoundryAdapter.sendRollToChat(confirmRoll, speaker, flavor);
    
    return confirmed;
  }

  /* istanbul ignore next */
  static async weaponDamageRoll(actor, weapon) {
    const dmg = weapon.system.dmg;
    if (!dmg) return ui.notifications.warn("This weapon has no damage value.");

    const defaultRoll = this.lastAttackRoll || '';
    const defaultTarget = this.lastAttackTarget || '';
    const defaultHits = this.lastAttackHits || 1;
    const isMelee = weapon.system.class?.toLowerCase().includes('melee');
    const strBonus = actor.system.characteristics.str?.mod || 0;
    const targetToken = game.user.targets.first();

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
            let firstHitLocation = "Unknown";
            let degreesOfSuccess = 0;
            let targetNumber = 0;
            
            if (attackRollInput && targetNumberInput) {
              const attackRoll = parseInt(attackRollInput);
              targetNumber = parseInt(targetNumberInput);
              if (attackRoll >= 1 && attackRoll <= 100) {
                firstHitLocation = this.determineHitLocation(attackRoll);
                degreesOfSuccess = CombatDialogHelper.calculateDegreesOfSuccess(attackRoll, targetNumber);
              }
            }

            const hitLocations = this.determineMultipleHitLocations(firstHitLocation, numHits);
            const penetration = weapon.system.penetration || 0;
            
            for (let i = 0; i < numHits; i++) {
              let totalDamage = 0;
              let allRolls = [];
              let furyCount = 0;
              
              const damageFormula = CombatDialogHelper.buildDamageFormula(dmg, degreesOfSuccess, isMelee, strBonus, i);

              const roll = await new Roll(damageFormula).evaluate();
              totalDamage += roll.total;
              allRolls.push(roll);
              
              const applyButton = targetToken ? ChatMessageBuilder.createDamageApplyButton(totalDamage, penetration, hitLocations[i], targetToken.actor.id, weapon.system.dmgType || 'Impact') : '';
              const flavor = ChatMessageBuilder.createDamageFlavor(weapon.name, i + 1, numHits, hitLocations[i], degreesOfSuccess, penetration, isMelee, strBonus, applyButton);
              
              await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor
              });
              
              if (this.hasNaturalTen(roll) && targetNumber > 0) {
                let keepChecking = await this.rollRighteousFury(actor, weapon, targetNumber, hitLocations[i]);
                
                while (keepChecking) {
                  furyCount++;
                  const furyRoll = await new Roll(dmg).evaluate();
                  totalDamage += furyRoll.total;
                  allRolls.push(furyRoll);
                  
                  const furyFlavor = ChatMessageBuilder.createRighteousFuryDamageFlavor(furyCount);
                  await furyRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    flavor: furyFlavor
                  });
                  
                  keepChecking = this.hasNaturalTen(furyRoll) && await this.rollRighteousFury(actor, weapon, targetNumber, hitLocations[i]);
                }
                
                const applyFuryButton = targetToken ? ChatMessageBuilder.createDamageApplyButton(totalDamage, penetration, hitLocations[i], targetToken.actor.id, weapon.system.dmgType || 'Impact') : '';
                const summaryContent = ChatMessageBuilder.createRighteousFurySummary(furyCount, hitLocations[i], totalDamage, applyFuryButton);
                
                await ChatMessage.create({
                  speaker: ChatMessage.getSpeaker({ actor }),
                  content: summaryContent
                });
              }
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
