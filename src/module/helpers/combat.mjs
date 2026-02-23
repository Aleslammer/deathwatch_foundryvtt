import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES, RANGE_MODIFIERS } from "./constants.mjs";
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

    const distance = canvas.grid.measurePath([token1.center, token2.center]).distance;
    return distance;
  }
  
  static async clearJam(actor, weapon) {
    if (!weapon.system.jammed) {
      ui.notifications.info(`${weapon.name} is not jammed.`);
      return;
    }

    const bs = actor.system.characteristics.bs.value || 0;
    const bsAdv = actor.system.characteristics.bs.advances || 0;
    const targetNumber = bs + bsAdv;

    const roll = await new Roll('1d100').evaluate();
    const success = roll.total <= targetNumber;

    if (success) {
      await weapon.update({ "system.jammed": false });
      if (weapon.system.loadedAmmo) {
        const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
        if (loadedAmmo) {
          await loadedAmmo.update({ "system.capacity.value": 0 });
        }
        await weapon.update({ "system.loadedAmmo": null });
      }
      ui.notifications.info(`${weapon.name} jam cleared! Weapon needs reloading.`);
    } else {
      ui.notifications.warn(`Failed to clear jam on ${weapon.name}.`);
    }

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `<strong>Clear Jam: ${weapon.name}</strong><br>Target: ${targetNumber}<br><strong style="color: ${success ? 'green' : 'red'};">${success ? 'SUCCESS - Jam Cleared!' : 'FAILED - Still Jammed'}</strong>${success ? '<br><em>Ammo lost, weapon needs reloading</em>' : ''}`
    });
  }

  static async weaponAttackDialog(actor, weapon) {
    if (weapon.system.jammed) {
      ui.notifications.warn(`${weapon.name} is jammed! Clear the jam before firing.`);
      return;
    }

    const bs = actor.system.characteristics.bs.base || actor.system.characteristics.bs.value;
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

            let jamThreshold = 96;
            if (autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO || autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
              jamThreshold = 94;
            }
            const isJammed = hitValue >= jamThreshold;

            if (isJammed) {
              await weapon.update({ "system.jammed": true });
            }

            CombatHelper.lastAttackRoll = hitValue;
            CombatHelper.lastAttackTarget = targetNumber;
            CombatHelper.lastAttackHits = hitsTotal;

            let modifierParts = [];
            modifierParts.push(`${bs} Base BS`);
            if (bsAdv !== 0) modifierParts.push(`${bsAdv >= 0 ? '+' : ''}${bsAdv} BS Advances`);
            if (aim !== 0) modifierParts.push(`+${aim} Aim`);
            if (autoFire !== 0) modifierParts.push(`+${autoFire} Rate of Fire`);
            if (calledShot !== 0) modifierParts.push(`${calledShot} Called Shot`);
            if (autoRangeMod !== 0) modifierParts.push(`${autoRangeMod >= 0 ? '+' : ''}${autoRangeMod} Range`);
            if (runningTarget !== 0) modifierParts.push(`${runningTarget} Running Target`);
            if (miscModifier !== 0) modifierParts.push(`${miscModifier >= 0 ? '+' : ''}${miscModifier} Misc`);

            const label = `[Attack] ${weapon.name} - Target: ${targetNumber}<br><strong>${hitsTotal > 0 ? 'HIT!' : 'MISS!'} - ${hitsTotal} Hit${hitsTotal !== 1 ? 's' : ''}</strong>${isJammed ? '<br><strong style="color: red;">WEAPON JAMMED!</strong>' : ''}`;
            const flavor = modifierParts.length > 0 ? `${label}<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>` : label;

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
    const reversed = parseInt(attackRoll.toString().split('').reverse().join(''));
    if (reversed <= 10) return "Head";
    if (reversed <= 20) return "Right Arm";
    if (reversed <= 30) return "Left Arm";
    if (reversed <= 70) return "Body";
    if (reversed <= 85) return "Right Leg";
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
    const effectiveArmor = Math.max(0, armorValue - penetration);
    const woundsTaken = Math.max(0, damage - effectiveArmor);

    if (woundsTaken > 0) {
      const currentDamage = targetActor.system.wounds.value || 0;
      const newDamage = currentDamage + woundsTaken;
      const maxWounds = targetActor.system.wounds.max || 0;
      const isCritical = newDamage > maxWounds;
      
      await targetActor.update({ "system.wounds.value": newDamage });
      
      let message = `<strong>${targetActor.name}</strong> takes <strong style="color: red;">${woundsTaken} wounds</strong> to ${location}<br><em>Damage: ${damage} | Armor: ${armorValue} | Penetration: ${penetration} | Effective Armor: ${effectiveArmor}</em>`;
      
      if (isCritical) {
        const criticalDamage = newDamage - maxWounds;
        message += `<br><strong style="color: darkred; font-size: 1.1em;">☠ CRITICAL DAMAGE: ${criticalDamage} ☠</strong>`;
        message += `<br><button class="roll-critical-btn" data-actor-id="${targetActor.id}" data-location="${location}" data-damage-type="${damageType}" data-critical-damage="${criticalDamage}">Roll Critical Effect</button>`;
        ui.notifications.warn(`${targetActor.name} is taking CRITICAL DAMAGE!`);
      } else {
        ui.notifications.info(`${targetActor.name} takes ${woundsTaken} wounds!`);
      }
      
      await ChatMessage.create({ content: message });
    } else {
      ui.notifications.info(`${targetActor.name}'s armor absorbs all damage!`);
      await ChatMessage.create({
        content: `<strong>${targetActor.name}</strong>'s armor absorbs all damage to ${location}<br><em>Damage: ${damage} | Armor: ${armorValue} | Penetration: ${penetration}</em>`
      });
    }
  }

  static hasNaturalTen(roll) {
    return roll.dice.some(d => d.results.some(r => r.result === 10 || (d.faces === 5 && r.result === 5)));
  }

  static async rollRighteousFury(actor, weapon, targetNumber, hitLocation) {
    const confirmRoll = await new Roll('1d100').evaluate();
    const confirmed = confirmRoll.total <= targetNumber;
    
    await confirmRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `<strong style="background: #8b4513; color: gold; padding: 2px 6px; border-radius: 3px;">⚡ RIGHTEOUS FURY CONFIRMATION ⚡</strong><br>Target: ${targetNumber} - ${confirmed ? '<strong style="color: green;">CONFIRMED!</strong>' : '<strong style="color: red;">Failed</strong>'}`
    });
    
    return confirmed;
  }

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
                if (attackRoll <= targetNumber) {
                  degreesOfSuccess = Math.floor((targetNumber - attackRoll) / 10);
                }
              }
            }

            const hitLocations = this.determineMultipleHitLocations(firstHitLocation, numHits);
            const penetration = weapon.system.penetration || 0;
            
            for (let i = 0; i < numHits; i++) {
              let totalDamage = 0;
              let allRolls = [];
              let furyCount = 0;
              
              let damageFormula = dmg;
              if (i === 0 && degreesOfSuccess > 0) {
                damageFormula = damageFormula.replace(/(\d+)(d\d+)/, (match, count, die) => {
                  const diceCount = parseInt(count);
                  if (diceCount > 1) {
                    return `(${diceCount - 1}${die} + 1${die}min${degreesOfSuccess})`;
                  }
                  return `1${die}min${degreesOfSuccess}`;
                });
              }
              if (isMelee && strBonus !== 0) {
                damageFormula += ` + ${strBonus}`;
              }

              const roll = await new Roll(damageFormula).evaluate();
              totalDamage += roll.total;
              allRolls.push(roll);
              
              const applyButton = targetToken ? `<button class="apply-damage-btn" data-damage="${totalDamage}" data-penetration="${penetration}" data-location="${hitLocations[i]}" data-target-id="${targetToken.actor.id}" data-damage-type="${weapon.system.damageType || 'Impact'}">Apply Damage</button>` : '';
              
              await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: `<strong style="font-size: 1.1em;">${weapon.name}${numHits > 1 ? ` (${i + 1}/${numHits})` : ''}</strong><br><strong>Hit ${i + 1}:</strong> ${hitLocations[i]}${i === 0 && degreesOfSuccess > 0 ? `<br><strong>DoS:</strong> ${degreesOfSuccess}` : ''}<br><strong>Penetration:</strong> ${penetration}${isMelee && strBonus !== 0 && i === 0 ? `<br><em>Includes STR Bonus: ${strBonus}</em>` : ''}${applyButton ? `<br>${applyButton}` : ''}`
              });
              
              if (this.hasNaturalTen(roll) && targetNumber > 0) {
                let keepChecking = await this.rollRighteousFury(actor, weapon, targetNumber, hitLocations[i]);
                
                while (keepChecking) {
                  furyCount++;
                  const furyRoll = await new Roll(dmg).evaluate();
                  totalDamage += furyRoll.total;
                  allRolls.push(furyRoll);
                  
                  await furyRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    flavor: `<strong style="background: #8b4513; color: gold; padding: 2px 6px; border-radius: 3px;">⚡ RIGHTEOUS FURY DAMAGE ${furyCount} ⚡</strong>`
                  });
                  
                  keepChecking = this.hasNaturalTen(furyRoll) && await this.rollRighteousFury(actor, weapon, targetNumber, hitLocations[i]);
                }
                
                const applyFuryButton = targetToken ? `<button class="apply-damage-btn" data-damage="${totalDamage}" data-penetration="${penetration}" data-location="${hitLocations[i]}" data-target-id="${targetToken.actor.id}" data-damage-type="${weapon.system.damageType || 'Impact'}">Apply Total Damage</button>` : '';
                
                await ChatMessage.create({
                  speaker: ChatMessage.getSpeaker({ actor }),
                  content: `<strong style="background: #8b4513; color: gold; padding: 2px 6px; border-radius: 3px;">⚡ Righteous Fury x${furyCount} ⚡</strong><br><strong>Location:</strong> ${hitLocations[i]}<br><strong>Total Damage: ${totalDamage}</strong>${applyFuryButton ? `<br>${applyFuryButton}` : ''}`
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
