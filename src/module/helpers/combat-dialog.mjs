import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from "./constants.mjs";

export class CombatDialogHelper {
  
  static buildAttackModifiers(bs, bsAdv, aim, autoFire, calledShot, autoRangeMod, runningTarget, miscModifier) {
    const modifiers = bsAdv + aim + autoFire + calledShot + autoRangeMod + runningTarget + miscModifier;
    const clampedModifiers = Math.max(-60, Math.min(60, modifiers));
    return { modifiers, clampedModifiers, targetNumber: bs + clampedModifiers };
  }

  static buildModifierParts(bs, bsAdv, aim, autoFire, calledShot, autoRangeMod, runningTarget, miscModifier) {
    const parts = [];
    parts.push(`${bs} Base BS`);
    if (bsAdv !== 0) parts.push(`${bsAdv >= 0 ? '+' : ''}${bsAdv} BS Advances`);
    if (aim !== 0) parts.push(`+${aim} Aim`);
    if (autoFire !== 0) parts.push(`+${autoFire} Rate of Fire`);
    if (calledShot !== 0) parts.push(`${calledShot} Called Shot`);
    if (autoRangeMod !== 0) parts.push(`${autoRangeMod >= 0 ? '+' : ''}${autoRangeMod} Range`);
    if (runningTarget !== 0) parts.push(`${runningTarget} Running Target`);
    if (miscModifier !== 0) parts.push(`${miscModifier >= 0 ? '+' : ''}${miscModifier} Misc`);
    return parts;
  }

  static calculateHits(hitValue, targetNumber, maxHits) {
    const calculatedHits = hitValue <= targetNumber ? 1 + Math.floor((targetNumber - hitValue) / 10) : 0;
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

  static buildAttackLabel(weaponName, targetNumber, hitsTotal, isJammed) {
    return `[Attack] ${weaponName} - Target: ${targetNumber}<br><strong>${hitsTotal > 0 ? 'HIT!' : 'MISS!'} - ${hitsTotal} Hit${hitsTotal !== 1 ? 's' : ''}</strong>${isJammed ? '<br><strong style="color: red;">WEAPON JAMMED!</strong>' : ''}`;
  }

  static buildAttackFlavor(label, modifierParts) {
    if (modifierParts.length === 0) return label;
    return `${label}<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>`;
  }
}
