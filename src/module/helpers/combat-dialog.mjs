import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from "./constants.mjs";

export class CombatDialogHelper {
  
  static buildAttackModifiers(options) {
    const {
      bs,
      bsAdv = 0,
      aim = 0,
      autoFire = 0,
      calledShot = 0,
      rangeMod = 0,
      runningTarget = 0,
      miscModifier = 0,
      isAccurate = false,
      isGyroStabilised = false,
      isTwinLinked = false
    } = options;

    const accurateBonus = (isAccurate && aim > 0) ? 10 : 0;
    const twinLinkedBonus = isTwinLinked ? 20 : 0;
    const gyroRangeMod = isGyroStabilised ? this.applyGyroStabilisedRangeLimit(rangeMod) : rangeMod;
    const modifiers = bsAdv + aim + autoFire + calledShot + gyroRangeMod + runningTarget + miscModifier + accurateBonus + twinLinkedBonus;
    const clampedModifiers = Math.max(-60, Math.min(60, modifiers));
    return { modifiers, clampedModifiers, targetNumber: bs + clampedModifiers, accurateBonus, gyroRangeMod, twinLinkedBonus };
  }

  static applyGyroStabilisedRangeLimit(rangeMod) {
    return Math.max(rangeMod, -10);
  }

  static buildModifierParts(bs, bsAdv, aim, autoFire, calledShot, autoRangeMod, runningTarget, miscModifier, accurateBonus = 0, twinLinkedBonus = 0) {
    const parts = [];
    parts.push(`${bs} Base BS`);
    if (bsAdv !== 0) parts.push(`${bsAdv >= 0 ? '+' : ''}${bsAdv} BS Advances`);
    if (aim !== 0) parts.push(`+${aim} Aim`);
    if (accurateBonus !== 0) parts.push(`+${accurateBonus} Accurate`);
    if (twinLinkedBonus !== 0) parts.push(`+${twinLinkedBonus} Twin-Linked`);
    if (autoFire !== 0) parts.push(`+${autoFire} Rate of Fire`);
    if (calledShot !== 0) parts.push(`${calledShot} Called Shot`);
    if (autoRangeMod !== 0) parts.push(`${autoRangeMod >= 0 ? '+' : ''}${autoRangeMod} Range`);
    if (runningTarget !== 0) parts.push(`${runningTarget} Running Target`);
    if (miscModifier !== 0) parts.push(`${miscModifier >= 0 ? '+' : ''}${miscModifier} Misc`);
    return parts;
  }

  static calculateHits(hitValue, targetNumber, maxHits, rateOfFire = RATE_OF_FIRE_MODIFIERS.SINGLE, isScatter = false, isPointBlank = false, isStorm = false, isTwinLinked = false) {
    if (hitValue > targetNumber) return 0;
    
    const degreesOfSuccess = Math.floor((targetNumber - hitValue) / 10);
    let calculatedHits = 1;
    
    if (isTwinLinked && degreesOfSuccess >= 2) {
      calculatedHits += 1;
    }
    
    if (isScatter && isPointBlank) {
      calculatedHits += Math.floor(degreesOfSuccess / 2);
    } else if (rateOfFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
      calculatedHits += degreesOfSuccess;
    } else if (rateOfFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO) {
      calculatedHits += Math.floor(degreesOfSuccess / 2);
    }
    
    if (isStorm) {
      calculatedHits *= 2;
    }
    
    return Math.min(calculatedHits, maxHits);
  }

  static determineJamThreshold(autoFire) {
    if (autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO || autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
      return 94;
    }
    return 96;
  }

  static parseRateOfFire(rof, currentAmmo) {
    const rofParts = rof.split('/');
    const hasSingle = rofParts[0] && rofParts[0] !== '-';
    const semiAutoRounds = parseInt(rofParts[1]) || 0;
    const fullAutoRounds = parseInt(rofParts[2]) || 0;
    const hasSemiAuto = rofParts[1] && rofParts[1] !== '-' && currentAmmo >= semiAutoRounds;
    const hasFullAuto = rofParts[2] && rofParts[2] !== '-' && currentAmmo >= fullAutoRounds;

    return {
      rofParts,
      hasSingle,
      semiAutoRounds,
      fullAutoRounds,
      hasSemiAuto,
      hasFullAuto
    };
  }

  static buildRofOptions(rofData) {
    let options = '';
    if (rofData.hasSingle) {
      options += `<option value="${RATE_OF_FIRE_MODIFIERS.SINGLE}" data-rounds="1">Single (1 round)</option>`;
    }
    if (rofData.hasSemiAuto) {
      options += `<option value="${RATE_OF_FIRE_MODIFIERS.SEMI_AUTO}" data-rounds="${rofData.semiAutoRounds}">Semi-Auto (+${RATE_OF_FIRE_MODIFIERS.SEMI_AUTO}, ${rofData.semiAutoRounds} rounds)</option>`;
    }
    if (rofData.hasFullAuto) {
      options += `<option value="${RATE_OF_FIRE_MODIFIERS.FULL_AUTO}" data-rounds="${rofData.fullAutoRounds}">Full-Auto (+${RATE_OF_FIRE_MODIFIERS.FULL_AUTO}, ${rofData.fullAutoRounds} rounds)</option>`;
    }
    return options;
  }

  static determineRoundsFired(autoFire, rofParts) {
    if (autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO) {
      return parseInt(rofParts[1]) || 1;
    } else if (autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO) {
      return parseInt(rofParts[2]) || 1;
    }
    return 1;
  }

  static buildAttackLabel(weaponName, targetNumber, hitsTotal, isJammed, isOverheated = false) {
    let warnings = '';
    if (isJammed) warnings += '<br><strong style="color: red;">WEAPON JAMMED!</strong>';
    if (isOverheated) warnings += '<br><strong style="color: orange;">WEAPON OVERHEATED!</strong>';
    return `[Attack] ${weaponName} - Target: ${targetNumber}<br><strong>${hitsTotal > 0 ? 'HIT!' : 'MISS!'} - ${hitsTotal} Hit${hitsTotal !== 1 ? 's' : ''}</strong>${warnings}`;
  }

  static buildAttackFlavor(label, modifierParts) {
    if (modifierParts.length === 0) return label;
    return `${label}<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>`;
  }

  static validateWeaponForAttack(weapon, actor) {
    if (weapon.system.jammed) {
      return { valid: false, message: `${weapon.name} is jammed! Clear the jam before firing.` };
    }

    if (weapon.system.capacity && weapon.system.capacity.max > 0) {
      if (!weapon.system.loadedAmmo) {
        return { valid: false, message: `${weapon.name} has no ammunition loaded!` };
      }
      const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
      if (!loadedAmmo || loadedAmmo.system.capacity.value <= 0) {
        return { valid: false, message: `${weapon.name} is out of ammunition!` };
      }
    }

    return { valid: true };
  }

  static buildDamageFormula(options) {
    const {
      baseDmg,
      degreesOfSuccess,
      isMelee,
      strBonus,
      hitIndex,
      isAccurate = false,
      isAiming = false,
      isSingleShot = false,
      isTearing = false,
      provenRating = 0,
      isPowerFist = false,
      isLightningClaw = false,
      hasLightningClawPair = false
    } = options;

    let formula = baseDmg;
    const effectiveMin = Math.max(provenRating, (hitIndex === 0 ? degreesOfSuccess : 0));
    
    if (isTearing) {
      formula = formula.replace(/(\d+)(d\d+)/g, (match, count, die) => {
        const diceCount = parseInt(count);
        const minClause = effectiveMin > 0 ? `min${effectiveMin}` : '';
        return `${diceCount + 1}${die}${minClause}dl1`;
      });
    } else if (effectiveMin > 0) {
      formula = formula.replace(/(\d+)(d\d+)/g, (match, count, die) => {
        return `${count}${die}min${effectiveMin}`;
      });
    }
    
    if (hitIndex === 0 && !isMelee && isAccurate && isAiming && isSingleShot && degreesOfSuccess >= 2) {
      const extraDice = Math.min(Math.floor(degreesOfSuccess / 2), 2);
      formula += ` + ${extraDice}d10`;
    }
    
    if (isMelee && strBonus !== 0) {
      const effectiveStrBonus = isPowerFist ? strBonus * 2 : strBonus;
      formula += ` + ${effectiveStrBonus}`;
    }
    
    if (isLightningClaw && degreesOfSuccess > 0) {
      const bonusPerDegree = hasLightningClawPair ? 2 : 1;
      formula += ` + ${degreesOfSuccess * bonusPerDegree}`;
    }
    
    return formula;
  }

  static calculateDegreesOfSuccess(attackRoll, targetNumber) {
    if (attackRoll > targetNumber) return 0;
    return Math.floor((targetNumber - attackRoll) / 10);
  }

  static calculateDamageResult(options) {
    const {
      damage,
      armorValue,
      penetration,
      toughnessBonus = 0,
      unnaturalToughnessMultiplier = 1,
      felling = 0,
      isPrimitive = false,
      isRazorSharp = false,
      degreesOfSuccess = 0,
      isScatter = false,
      isLongOrExtremeRange = false
    } = options;

    const effectiveMultiplier = Math.max(1, unnaturalToughnessMultiplier - felling);
    const effectiveTB = toughnessBonus * effectiveMultiplier;
    const effectivePenetration = (isRazorSharp && degreesOfSuccess >= 2) ? penetration * 2 : penetration;
    let baseArmor = armorValue;
    if (isScatter && isLongOrExtremeRange) {
      baseArmor = armorValue * 2;
    }
    const effectiveArmor = isPrimitive ? Math.max(0, (baseArmor * 2) - effectivePenetration) : Math.max(0, baseArmor - effectivePenetration);
    const woundsTaken = Math.max(0, damage - effectiveArmor - effectiveTB);
    return { effectiveArmor, woundsTaken, effectiveTB };
  }

  static calculateCriticalDamage(currentWounds, woundsTaken, maxWounds) {
    const newWounds = currentWounds + woundsTaken;
    const isCritical = newWounds > maxWounds;
    const criticalDamage = isCritical ? newWounds - maxWounds : 0;
    return { newWounds, isCritical, criticalDamage };
  }

  static buildDamageMessage(targetName, woundsTaken, location, damage, armorValue, penetration, effectiveArmor, toughnessBonus, isCritical, criticalDamage, targetId, damageType, isShocking = false, isToxic = false) {
    let message = `<strong>${targetName}</strong> takes <strong style="color: red;">${woundsTaken} wounds</strong> to ${location}<br><em>Damage: ${damage} | Armor: ${armorValue} | Penetration: ${penetration} | Effective Armor: ${effectiveArmor} | TB: ${toughnessBonus}</em>`;
    
    if (isShocking && woundsTaken > 0) {
      const stunRounds = Math.floor(woundsTaken / 2);
      message += `<br><button class="shocking-test-btn" data-actor-id="${targetId}" data-armor-value="${armorValue}" data-stun-rounds="${stunRounds}">Shocking: Roll Toughness Test</button>`;
    }
    
    if (isToxic && woundsTaken > 0) {
      const penalty = woundsTaken * 5;
      message += `<br><button class="toxic-test-btn" data-actor-id="${targetId}" data-penalty="${penalty}">Toxic: Roll Toughness Test (-${penalty})</button>`;
    }
    
    if (isCritical) {
      message += `<br><strong style="color: darkred; font-size: 1.1em;">☠ CRITICAL DAMAGE: ${criticalDamage} ☠</strong>`;
      message += `<br><button class="roll-critical-btn" data-actor-id="${targetId}" data-location="${location}" data-damage-type="${damageType}" data-critical-damage="${criticalDamage}">Apply Critical Effect</button>`;
    }
    
    return message;
  }

  static buildArmorAbsorbMessage(targetName, location, damage, armorValue, penetration, toughnessBonus) {
    return `<strong>${targetName}</strong>'s armor and toughness absorb all damage to ${location}<br><em>Damage: ${damage} | Armor: ${armorValue} | Penetration: ${penetration} | TB: ${toughnessBonus}</em>`;
  }

  static calculateClearJamTarget(bs, bsAdv) {
    return bs + bsAdv;
  }

  static buildClearJamFlavor(weaponName, targetNumber, success) {
    return `<strong>Clear Jam: ${weaponName}</strong><br>Target: ${targetNumber}<br><strong style="color: ${success ? 'green' : 'red'};">${success ? 'SUCCESS - Jam Cleared!' : 'FAILED - Still Jammed'}</strong>${success ? '<br><em>Ammo lost, weapon needs reloading</em>' : ''}`;
  }
}
