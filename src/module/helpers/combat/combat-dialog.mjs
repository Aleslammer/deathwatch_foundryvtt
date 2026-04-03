import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES, SIZE_HIT_MODIFIERS } from "../constants.mjs";

export class CombatDialogHelper {

  /**
   * Extract the size hit modifier from a target actor by scanning its traits.
   * @param {Object} targetActor - The target actor document
   * @returns {{ modifier: number, label: string }}
   */
  static getTargetSizeModifier(targetActor) {
    if (!targetActor?.items) return { modifier: 0, label: "" };
    const items = targetActor.items instanceof Map
      ? Array.from(targetActor.items.values())
      : (targetActor.items.filter ? targetActor.items.filter(() => true) : []);
    for (const item of items) {
      if (item.type !== "trait") continue;
      const match = item.name.match(/^Size\s*\((.+)\)$/i);
      if (match) {
        const size = match[1].trim();
        const modifier = SIZE_HIT_MODIFIERS[size] ?? 0;
        if (modifier !== 0) return { modifier, label: `Target Size (${size})` };
      }
    }
    return { modifier: 0, label: "" };
  }
  
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
      sizeModifier = 0,
      isAccurate = false,
      isInaccurate = false,
      isGyroStabilised = false,
      isTwinLinked = false
    } = options;

    const effectiveAim = isInaccurate ? 0 : aim;
    const accurateBonus = (isAccurate && !isInaccurate && aim > 0) ? 10 : 0;
    const twinLinkedBonus = isTwinLinked ? 20 : 0;
    const gyroRangeMod = isGyroStabilised ? this.applyGyroStabilisedRangeLimit(rangeMod) : rangeMod;
    const modifiers = bsAdv + effectiveAim + autoFire + calledShot + gyroRangeMod + runningTarget + miscModifier + accurateBonus + twinLinkedBonus + sizeModifier;
    const clampedModifiers = Math.max(-60, Math.min(60, modifiers));
    return { modifiers, clampedModifiers, targetNumber: bs + clampedModifiers, accurateBonus, gyroRangeMod, twinLinkedBonus, effectiveAim };
  }

  static applyGyroStabilisedRangeLimit(rangeMod) {
    return Math.max(rangeMod, -10);
  }

  static buildModifierParts(bs, bsAdv, aim, autoFire, calledShot, autoRangeMod, runningTarget, miscModifier, accurateBonus = 0, twinLinkedBonus = 0, upgradeModifiers = [], sizeModifier = 0, sizeLabel = "") {
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
    if (sizeModifier !== 0) parts.push(`${sizeModifier >= 0 ? '+' : ''}${sizeModifier} ${sizeLabel || 'Target Size'}`);
    for (const mod of upgradeModifiers) {
      if (mod.effectType === 'characteristic' && mod.valueAffected === 'bs') {
        const value = parseInt(mod.modifier) || 0;
        if (value !== 0) parts.push(`${value >= 0 ? '+' : ''}${value} ${mod.source}`);
      }
    }
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

  static determineJamThreshold(autoFire, isUnreliable = false) {
    if (isUnreliable) return 91;
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
    const isHorde = actor.type === 'horde';

    if (!isHorde && weapon.system.jammed) {
      return { valid: false, message: `${weapon.name} is jammed! Clear the jam before firing.` };
    }

    if (!isHorde) {
      const clip = weapon.system.clip;
      const hasAmmoManagement = clip && clip !== '—' && clip !== '-' && clip !== '';
      
      if (hasAmmoManagement) {
        if (!weapon.system.loadedAmmo) {
          return { valid: false, message: `${weapon.name} has no ammunition loaded!` };
        }
        const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
        if (!loadedAmmo || loadedAmmo.system.capacity.value <= 0) {
          return { valid: false, message: `${weapon.name} is out of ammunition!` };
        }
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
      isLongOrExtremeRange = false,
      isMeltaRange = false
    } = options;

    const effectiveMultiplier = Math.max(1, unnaturalToughnessMultiplier - felling);
    const effectiveTB = toughnessBonus * effectiveMultiplier;
    let effectivePenetration = penetration;
    if (isRazorSharp && degreesOfSuccess >= 2) {
      effectivePenetration = penetration * 2;
    } else if (isMeltaRange) {
      effectivePenetration = penetration * 2;
    }
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

  static buildDamageMessage(targetName, woundsTaken, location, damage, armorValue, penetration, effectiveArmor, toughnessBonus, isCritical, criticalDamage, targetId, damageType, isShocking = false, isToxic = false, drainLifeMessage = '', charDamageEffect = null, forceWeaponData = null, tokenInfo = null) {
    const tokenData = tokenInfo ? ` data-scene-id="${tokenInfo.sceneId}" data-token-id="${tokenInfo.tokenId}"` : '';
    let message = `<strong>${targetName}</strong> takes <strong style="color: red;">${woundsTaken} wounds</strong> to ${location}<br><em>Damage: ${damage} | Armor: ${armorValue} | Penetration: ${penetration} | Effective Armor: ${effectiveArmor} | TB: ${toughnessBonus}</em>`;
    
    if (charDamageEffect && woundsTaken > 0) {
      message += `<br><button class="char-damage-btn" data-actor-id="${targetId}"${tokenData} data-formula="${charDamageEffect.formula}" data-characteristic="${charDamageEffect.characteristic}">${charDamageEffect.name}: Roll ${charDamageEffect.formula}</button>`;
    }
    
    if (isShocking && woundsTaken > 0) {
      const stunRounds = Math.floor(woundsTaken / 2);
      message += `<br><button class="shocking-test-btn" data-actor-id="${targetId}"${tokenData} data-armor-value="${armorValue}" data-stun-rounds="${stunRounds}">Shocking: Roll Toughness Test</button>`;
    }
    
    if (isToxic && woundsTaken > 0) {
      const penalty = woundsTaken * 5;
      message += `<br><button class="toxic-test-btn" data-actor-id="${targetId}"${tokenData} data-penalty="${penalty}">Toxic: Roll Toughness Test (-${penalty})</button>`;
    }
    
    if (forceWeaponData && woundsTaken > 0) {
      message += `<br><button class="force-channel-btn" data-attacker-id="${forceWeaponData.attackerId}" data-target-id="${targetId}"${tokenData} data-psy-rating="${forceWeaponData.psyRating}">Force: Channel Psychic Energy (Opposed Willpower)</button>`;
    }
    
    if (drainLifeMessage) {
      message += `<br>${drainLifeMessage}`;
    }
    
    if (isCritical) {
      message += `<br><strong style="color: darkred; font-size: 1.1em;">☠ CRITICAL DAMAGE: ${criticalDamage} ☠</strong>`;
      message += `<br><button class="roll-critical-btn" data-actor-id="${targetId}"${tokenData} data-location="${location}" data-damage-type="${damageType}" data-critical-damage="${criticalDamage}">Apply Critical Effect</button>`;
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

  /**
   * Validate that a preset rate of fire option is available on the weapon.
   * @param {number} rofOption - 0=Single, 1=Semi-Auto, 2=Full-Auto
   * @param {Object} weapon - Weapon item
   * @param {Object} actor - Actor document
   * @returns {{ valid: boolean, message?: string }}
   */
  static validateRofOption(rofOption, weapon, actor) {
    const rof = weapon.system.effectiveRof || weapon.system.rof || "S/-/-";
    const rofParts = rof.split('/');
    const clip = weapon.system.clip;
    const hasAmmoManagement = clip && clip !== '—' && clip !== '-' && clip !== '';
    const loadedAmmo = hasAmmoManagement && weapon.system.loadedAmmo
      ? actor.items.get(weapon.system.loadedAmmo) : null;
    const currentAmmo = loadedAmmo?.system.capacity.value || 0;

    if (rofOption === 1) {
      if (!rofParts[1] || rofParts[1] === '-') {
        return { valid: false, message: `${weapon.name} does not support Semi-Auto fire.` };
      }
      if (hasAmmoManagement && loadedAmmo) {
        const semiAutoRounds = parseInt(rofParts[1]) || 0;
        if (currentAmmo < semiAutoRounds) {
          return { valid: false, message: `${weapon.name} needs ${semiAutoRounds} rounds for Semi-Auto but only has ${currentAmmo}.` };
        }
      }
    }
    if (rofOption === 2) {
      if (!rofParts[2] || rofParts[2] === '-') {
        return { valid: false, message: `${weapon.name} does not support Full-Auto fire.` };
      }
      if (hasAmmoManagement && loadedAmmo) {
        const fullAutoRounds = parseInt(rofParts[2]) || 0;
        if (currentAmmo < fullAutoRounds) {
          return { valid: false, message: `${weapon.name} needs ${fullAutoRounds} rounds for Full-Auto but only has ${currentAmmo}.` };
        }
      }
    }
    return { valid: true };
  }

  /**
   * Map shorthand aim value (0/1/2) to AIM_MODIFIERS constant.
   * @param {number} aim - 0=None, 1=Half, 2=Full
   * @returns {number}
   */
  static mapAimOption(aim) {
    if (aim === 2) return AIM_MODIFIERS.FULL;
    if (aim === 1) return AIM_MODIFIERS.HALF;
    return AIM_MODIFIERS.NONE;
  }

  /**
   * Map shorthand rof value (0/1/2) to RATE_OF_FIRE_MODIFIERS constant.
   * @param {number} rof - 0=Single, 1=Semi-Auto, 2=Full-Auto
   * @returns {number}
   */
  static mapRofOption(rof) {
    if (rof === 2) return RATE_OF_FIRE_MODIFIERS.FULL_AUTO;
    if (rof === 1) return RATE_OF_FIRE_MODIFIERS.SEMI_AUTO;
    return RATE_OF_FIRE_MODIFIERS.SINGLE;
  }
}
