import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES, HIT_LOCATIONS } from "../constants.mjs";
import { CombatDialogHelper } from "./combat-dialog.mjs";
import { CombatHelper } from "./combat.mjs";
import { WeaponQualityHelper } from "./weapon-quality-helper.mjs";
import { WeaponUpgradeHelper } from "./weapon-upgrade-helper.mjs";
import { Sanitizer } from "../sanitizer.mjs";

/**
 * Ranged combat helper for Ballistic Skill tests, rate of fire, jamming, and ranged attacks.
 * Handles Full Auto, Semi-Auto, Single Shot attacks with all weapon qualities and modifiers.
 *
 * @example
 * // Resolve a ranged attack
 * const result = await RangedCombatHelper.resolveRangedAttack(actor, boltgun, {
 *   hitValue: 42,
 *   aim: 10,
 *   autoFire: -10,
 *   rangeMod: 10,
 *   rangeLabel: 'Short'
 * });
 */
export class RangedCombatHelper {
  /**
   * Calculate ammo expenditure based on rounds fired and weapon qualities.
   *
   * Ammo consumption is modified by:
   * - Storm quality: Doubles ammo expenditure (hail of fire)
   * - Twin-Linked quality: Doubles ammo expenditure (two barrels fire)
   *
   * These effects stack: Storm + Twin-Linked = 4× ammo consumption.
   *
   * @param {number} roundsFired - Base rounds fired (from rate of fire)
   * @param {boolean} [isStorm=false] - Whether weapon has Storm quality
   * @param {boolean} [isTwinLinked=false] - Whether weapon has Twin-Linked quality
   * @returns {number} Total ammo consumed
   * @example
   * const ammo = RangedCombatHelper.calculateAmmoExpenditure(10, true, true);
   * // Returns: 40 (10 rounds × 2 Storm × 2 Twin-Linked)
   */
  static calculateAmmoExpenditure(roundsFired, isStorm = false, isTwinLinked = false) {
    let ammo = roundsFired;
    if (isStorm) ammo *= 2;
    if (isTwinLinked) ammo *= 2;
    return ammo;
  }

  /**
   * Check if ammunition has a premature detonation modifier and if the roll triggers it.
   *
   * Some volatile ammo types (e.g., Plasma, Melta) can detonate prematurely on
   * high attack rolls (typically 95+), dealing damage to the wielder instead of
   * the target.
   *
   * @param {Item} weapon - Weapon item
   * @param {Actor} actor - Actor document (to access loaded ammo)
   * @param {number} hitValue - The d100 attack roll result
   * @returns {{detonates: boolean, threshold: number}} Detonation data
   * @property {boolean} return.detonates - Whether the ammo detonated
   * @property {number} return.threshold - The roll threshold for detonation (default: 101 = never)
   * @example
   * const result = RangedCombatHelper.checkPrematureDetonation(plasmaGun, actor, 97);
   * // Returns: { detonates: true, threshold: 95 } if using volatile plasma ammo
   */
  static checkPrematureDetonation(weapon, actor, hitValue) {
    let threshold = 101;
    if (weapon.system.loadedAmmo && actor) {
      const ammo = actor.items.get(weapon.system.loadedAmmo);
      if (ammo?.system.modifiers) {
        for (const mod of ammo.system.modifiers) {
          if (mod.enabled !== false && mod.effectType === 'premature-detonation') {
            threshold = parseInt(mod.modifier) || 101;
            break;
          }
        }
      }
    }
    return { detonates: hitValue >= threshold, threshold };
  }

  /**
   * Calculate maximum hits accounting for Twin-Linked bonus.
   *
   * Twin-Linked weapons (Deathwatch Core p. 158) gain +1 maximum hit on Full Auto
   * attacks due to firing two barrels simultaneously.
   *
   * @param {number} roundsFired - Base rounds fired (from rate of fire)
   * @param {boolean} [isTwinLinked=false] - Whether weapon has Twin-Linked quality
   * @returns {number} Maximum hits possible (roundsFired or roundsFired + 1)
   * @example
   * const maxHits = RangedCombatHelper.calculateMaxHits(10, true);
   * // Returns: 11 (10 rounds + 1 Twin-Linked bonus)
   */
  static calculateMaxHits(roundsFired, isTwinLinked = false) {
    return isTwinLinked ? roundsFired + 1 : roundsFired;
  }

  /**
   * Calculate effective range for thrown weapons based on Strength Bonus.
   *
   * Thrown weapons (grenades, knives, etc.) have range = SB × multiplier.
   * For example, "SB x 3" means a character with SB 4 can throw 12 meters.
   *
   * @param {Item} weapon - Weapon item
   * @param {Actor} actor - Actor document (to access STR characteristic)
   * @returns {number|null} Effective range in meters, or null if not a thrown weapon or invalid format
   * @example
   * // Frag Grenade with range "SB x 3" thrown by character with SB 5
   * const range = RangedCombatHelper.calculateThrownWeaponRange(grenade, actor);
   * // Returns: 15 (5 SB × 3)
   */
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

  /**
   * Resolve a ranged attack given parsed dialog inputs and a d100 roll.
   *
   * This is the core ranged attack resolution function. It computes:
   * - Target number (BS + modifiers)
   * - Hits landed (based on degrees of success and rate of fire)
   * - Jam/overheat/premature detonation checks
   * - Ammo expenditure
   *
   * This is a pure logic function: no UI, no rolls, no document updates.
   * All randomness (d100 roll) is passed in via options.hitValue.
   *
   * @param {Actor} actor - Attacking actor
   * @param {Item} weapon - Weapon item being fired
   * @param {Object} options - Parsed attack options from dialog or preset
   * @param {number} options.hitValue - The d100 attack roll result (1-100)
   * @param {number} options.aim - Aim modifier (+0, +10, or +20)
   * @param {number} options.autoFire - Rate of fire modifier (+0, +10, or +20)
   * @param {number} options.calledShot - Called shot penalty (−20)
   * @param {number} options.runningTarget - Running target penalty (−20)
   * @param {number} options.miscModifier - Miscellaneous modifier
   * @param {number} options.rangeMod - Range modifier (+30 to −30)
   * @param {string} options.rangeLabel - Range band label ("Point Blank", "Short", etc.)
   * @param {string[]} options.rofParts - Rate of fire parts array (e.g., ["S", "3", "10"])
   * @param {number} [options.sizeModifier=0] - Target size modifier (+30 to −30)
   * @param {string} [options.sizeLabel=''] - Target size label ("Enormous", "Minuscule", etc.)
   * @param {Actor} [options.targetActor=null] - Target actor (for horde hit recalculation)
   * @returns {Promise<Object>} Attack resolution result
   * @property {number} return.hitValue - The attack roll
   * @property {number} return.targetNumber - Target number (BS + modifiers)
   * @property {number} return.hitsTotal - Total hits landed
   * @property {number} return.maxHits - Maximum possible hits
   * @property {number} return.roundsFired - Rounds of ammo fired
   * @property {boolean} return.isJammed - Whether weapon jammed
   * @property {boolean} return.hasPrematureDetonation - Whether ammo detonated prematurely
   * @property {boolean} return.isOverheated - Whether weapon overheated
   * @property {boolean} return.hasReliable - Whether weapon has Reliable quality
   * @property {number} return.ammoExpended - Total ammo consumed
   * @property {Object[]} return.modifierParts - Breakdown of all modifiers
   * @example
   * const result = await RangedCombatHelper.resolveRangedAttack(actor, boltgun, {
   *   hitValue: 42,
   *   aim: 10,
   *   autoFire: 10,
   *   calledShot: -20,
   *   runningTarget: 0,
   *   miscModifier: 0,
   *   rangeMod: 10,
   *   rangeLabel: 'Short',
   *   rofParts: ['S', '3', '10']
   * });
   * // Returns: { hitValue: 42, targetNumber: 60, hitsTotal: 2, isJammed: false, ... }
   */
  static async resolveRangedAttack(actor, weapon, options) {
    const {
      hitValue, aim, autoFire, calledShot, runningTarget, miscModifier,
      rangeMod, rangeLabel, rofParts,
      sizeModifier = 0, sizeLabel = '', targetActor = null
    } = options;

    const bs = actor.system.characteristics.bs.value || 0;
    const roundsFired = CombatDialogHelper.determineRoundsFired(autoFire, rofParts);

    const isAccurate = await WeaponQualityHelper.hasQuality(weapon, 'accurate');
    const isInaccurate = await WeaponQualityHelper.hasQuality(weapon, 'inaccurate');
    const isGyroStabilised = await WeaponQualityHelper.hasQuality(weapon, 'gyro-stabilised');
    const hasOverheats = await WeaponQualityHelper.hasQuality(weapon, 'overheats');
    const isScatter = await WeaponQualityHelper.hasQuality(weapon, 'scatter');
    const isStorm = await WeaponQualityHelper.hasQuality(weapon, 'storm');
    const isTwinLinked = await WeaponQualityHelper.hasQuality(weapon, 'twin-linked');
    const hasLivingAmmo = await WeaponQualityHelper.hasQuality(weapon, 'living-ammunition');
    const isUnreliable = await WeaponQualityHelper.hasQuality(weapon, 'unreliable');
    const hasReliable = await WeaponQualityHelper.hasQuality(weapon, 'reliable');

    const maxHits = RangedCombatHelper.calculateMaxHits(roundsFired, isTwinLinked);
    const isPointBlank = rangeLabel === "Point Blank";
    const isSingleShot = roundsFired === 1;
    const isAutoFire = autoFire !== RATE_OF_FIRE_MODIFIERS.SINGLE;

    const upgradeModifiers = await WeaponUpgradeHelper.getModifiers(weapon, isSingleShot, isAutoFire);
    const upgradeBSBonus = upgradeModifiers
      .filter(m => m.effectType === 'characteristic' && m.valueAffected === 'bs')
      .reduce((sum, m) => sum + (parseInt(m.modifier) || 0), 0);

    const hasTelescopicSight = await WeaponUpgradeHelper.hasUpgrade(weapon, 'telescopic-sight');
    const isFullAim = aim === AIM_MODIFIERS.FULL;
    const isLongOrExtreme = rangeLabel === "Long" || rangeLabel === "Extreme";
    let telescopicRangeMod = rangeMod;
    if (hasTelescopicSight && isFullAim && isLongOrExtreme) {
      telescopicRangeMod = 0;
    }

    const { targetNumber, accurateBonus, gyroRangeMod, twinLinkedBonus } = CombatDialogHelper.buildAttackModifiers({
      bs, bsAdv: 0, aim, autoFire, calledShot,
      rangeMod: telescopicRangeMod, runningTarget,
      miscModifier: miscModifier + upgradeBSBonus,
      sizeModifier, isAccurate, isInaccurate, isGyroStabilised, isTwinLinked
    });

    const { detonates: hasPrematureDetonation } = RangedCombatHelper.checkPrematureDetonation(weapon, actor, hitValue);

    let hitsTotal = CombatDialogHelper.calculateHits(hitValue, targetNumber, maxHits, autoFire, isScatter, isPointBlank, isStorm, isTwinLinked);

    if (targetActor && hitsTotal > 0) {
      const blastValue = await WeaponQualityHelper.getBlastValue(weapon);
      const isFlame = await WeaponQualityHelper.hasQuality(weapon, 'flame');
      const hasPowerField = await WeaponQualityHelper.hasQuality(weapon, 'power-field');
      const degreesOfSuccess = CombatDialogHelper.calculateDegreesOfSuccess(hitValue, targetNumber);
      hitsTotal = targetActor.system.calculateHitsReceived({
        damageType: weapon.system.dmgType || '',
        blastValue, isFlame,
        flameRange: parseInt(weapon.system.effectiveRange || weapon.system.range) || 0,
        isMelee: false, degreesOfSuccess, hasPowerField, baseHits: hitsTotal
      });
    }

    const isHorde = actor.type === 'horde';
    const jamThreshold = CombatDialogHelper.determineJamThreshold(autoFire, isUnreliable);
    const isJammed = !isHorde && !hasLivingAmmo && hitValue >= jamThreshold;
    const isOverheated = hasOverheats && hitValue >= 91;
    const ammoExpended = RangedCombatHelper.calculateAmmoExpenditure(roundsFired, isStorm, isTwinLinked);

    const modifierParts = CombatDialogHelper.buildModifierParts(
      bs, 0, aim, autoFire, calledShot, gyroRangeMod, runningTarget,
      miscModifier, accurateBonus, twinLinkedBonus, upgradeModifiers, sizeModifier, sizeLabel
    );

    return {
      hitValue, targetNumber, hitsTotal, maxHits, roundsFired,
      isJammed, hasPrematureDetonation, isOverheated,
      hasReliable, ammoExpended, modifierParts,
      isStorm, isTwinLinked, isScatter, isPointBlank,
      accurateBonus, twinLinkedBonus, gyroRangeMod, upgradeModifiers
    };
  }

  /**
   * Open the ranged attack dialog and resolve the attack.
   *
   * This is the main entry point for ranged attacks. Opens a dialog with:
   * - Rate of fire selection (Single, Semi-Auto, Full Auto)
   * - Aim options (None, Half, Full)
   * - Called shot selection
   * - Range calculation (auto-calculated from tokens if available)
   * - Modifiers (running target, misc)
   *
   * If `options` are provided with `skipDialog: true`, skips the dialog and
   * uses preset values (useful for hotbar macros).
   *
   * After the attack resolves, stores attack data in CombatHelper state for
   * the subsequent damage roll dialog.
   *
   * @param {Actor} actor - Attacking actor
   * @param {Item} weapon - Weapon item being fired
   * @param {Object} [options={}] - Optional preset attack parameters
   * @param {string} [options.rateOfFire] - Preset rate of fire ("single", "semi", "full")
   * @param {number} [options.aim] - Preset aim modifier (0, 1, or 2 for None/Half/Full)
   * @param {string} [options.calledShot] - Preset called shot location
   * @param {number} [options.miscModifier] - Preset misc modifier
   * @param {boolean} [options.skipDialog] - If true, skip dialog and roll immediately
   * @returns {Promise<void>} Resolves when attack is complete
   * @example
   * // Standard attack with dialog
   * await RangedCombatHelper.attackDialog(actor, boltgun);
   *
   * @example
   * // Preset Full Auto attack with Full Aim (for hotbar macro)
   * await RangedCombatHelper.attackDialog(actor, boltgun, {
   *   rateOfFire: 'full',
   *   aim: 2,
   *   skipDialog: true
   * });
   */
  /* istanbul ignore next */
  static async attackDialog(actor, weapon, options = {}) {
    const hasOptions = Object.keys(options).length > 0 && options.action !== 'damage';

    // Skip-dialog: roll immediately with preset values
    if (hasOptions && options.skipDialog) {
      return this._attackWithOptions(actor, weapon, options);
    }

    const validation = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    if (!validation.valid) {
      ui.notifications.warn(validation.message);
      return;
    }

    const bs = actor.system.characteristics.bs.value || 0;

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
        weaponRange = parseInt(weapon.system.effectiveRange || weapon.system.range) || 0;
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

    const rof = weapon.system.effectiveRof || weapon.system.rof || "S/-/-";
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

    const safeWeaponName = Sanitizer.escape(weapon.name);
    const content = `
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${weapon.img}" alt="${safeWeaponName}" style="max-width: 100px; max-height: 100px; border: none;" />
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
        <label title="${COMBAT_PENALTIES.CALLED_SHOT} penalty"><i class="far fa-square" id="calledShotIcon"></i> Called Shot
          <input type="checkbox" id="calledShot" name="calledShot" style="display:none;" />
        </label>
        <label title="${COMBAT_PENALTIES.RUNNING_TARGET} penalty"><i class="far fa-square" id="runningTargetIcon"></i> Running Target
          <input type="checkbox" id="runningTarget" name="runningTarget" style="display:none;" />
        </label>
      </div>
      <div class="form-group" id="calledShotLocationGroup" style="display: none;">
        <label>Location:</label>
        <select id="calledShotLocation" name="calledShotLocation">
          ${HIT_LOCATIONS.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Modifier:</label>
        <input type="text" id="miscModifier" name="miscModifier" value="0" />
      </div>
    `;

    foundry.applications.api.DialogV2.wait({
      window: { title: `Ranged Attack: ${safeWeaponName}` },
      position: { width: 325 },
      content: content,
      render: (event, dialog) => {
        const el = dialog.element;
        const miscInput = el.querySelector('#miscModifier');
        if (miscInput) miscInput.addEventListener('input', function() {
          this.value = this.value.replace(/[^0-9+\-]/g, '');
        });

        const setupCheckbox = (id) => {
          const label = el.querySelector(`label:has(#${id})`);
          if (!label) return;
          label.addEventListener('click', (e) => {
            e.preventDefault();
            const cb = label.querySelector(`#${id}`);
            const icon = label.querySelector(`#${id}Icon`);
            cb.checked = !cb.checked;
            icon.classList.toggle('fa-square');
            icon.classList.toggle('fa-check-square');
            if (id === 'calledShot') {
              el.querySelector('#calledShotLocationGroup').style.display = cb.checked ? '' : 'none';
            }
          });
        };
        setupCheckbox('calledShot');
        setupCheckbox('runningTarget');

        if (hasOptions) {
          if (options.aim !== undefined) el.querySelector('#aim').value = CombatDialogHelper.mapAimOption(options.aim);
          if (options.rof !== undefined) el.querySelector('#autoFire').value = CombatDialogHelper.mapRofOption(options.rof);
          if (options.calledShot) {
            el.querySelector('#calledShot').checked = true;
            el.querySelector('#calledShotIcon').classList.replace('fa-square', 'fa-check-square');
            el.querySelector('#calledShotLocationGroup').style.display = '';
            if (options.calledShotLocation) el.querySelector('#calledShotLocation').value = options.calledShotLocation;
          }
          if (options.runningTarget) {
            el.querySelector('#runningTarget').checked = true;
            el.querySelector('#runningTargetIcon').classList.replace('fa-square', 'fa-check-square');
          }
          if (options.miscModifier !== undefined) el.querySelector('#miscModifier').value = options.miscModifier;
        }
      },
      buttons: [
        {
          label: "Attack", action: "attack",
          callback: async (event, button, dialog) => {
            const el = dialog.element;
            const aim = parseInt(el.querySelector('#aim').value) || 0;
            const autoFire = parseInt(el.querySelector('#autoFire').value) || 0;
            const calledShot = el.querySelector('#calledShot').checked ? COMBAT_PENALTIES.CALLED_SHOT : 0;
            const runningTarget = el.querySelector('#runningTarget').checked ? COMBAT_PENALTIES.RUNNING_TARGET : 0;
            const miscModifier = parseInt(el.querySelector('#miscModifier').value) || 0;

            const hitRoll = await new Roll('1d100').evaluate();
            const hitValue = hitRoll.total;

            const targetActor = targetToken?.actor;
            const { modifier: sizeModifier, label: sizeLabel } = CombatDialogHelper.getTargetSizeModifier(targetActor);

            const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
              hitValue, aim, autoFire, calledShot, runningTarget, miscModifier,
              rangeMod: autoRangeMod, rangeLabel, rofParts,
              sizeModifier, sizeLabel, targetActor
            });

            let { hitsTotal, isJammed } = result;
            const { targetNumber, hasPrematureDetonation, isOverheated, hasReliable,
                    ammoExpended, modifierParts, isStorm, isTwinLinked } = result;

            // Flame vs Horde: extra 1d5 hits (requires a roll)
            if (targetActor?.type === 'horde' && hitsTotal > 0) {
              const isFlame = await WeaponQualityHelper.hasQuality(weapon, 'flame');
              if (isFlame) {
                const flameRoll = await new Roll('1d5').evaluate();
                hitsTotal += flameRoll.total;
                await flameRoll.toMessage({
                  speaker: ChatMessage.getSpeaker({ actor }),
                  flavor: `<strong>Flame vs Horde:</strong> +${flameRoll.total} additional hits (1d5)`,
                  rollMode: game.settings.get('core', 'rollMode')
                });
              }
            }

            // Reliable jam reroll
            if (isJammed && hasReliable) {
              const reliableRoll = await new Roll('1d10').evaluate();
              const safeWeaponName = Sanitizer.escape(weapon.name);
              await reliableRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: `<strong>Reliable Check:</strong> ${safeWeaponName} - ${reliableRoll.total === 10 ? 'Jammed!' : 'Not Jammed'}`,
                rollMode: game.settings.get('core', 'rollMode')
              });
              isJammed = reliableRoll.total === 10;
            }

            // Apply jam state
            if (isJammed) {
              await weapon.update({ "system.jammed": true });
            }

            // Premature detonation side effects
            if (hasPrematureDetonation) {
              await weapon.update({ "system.jammed": true });
              const safeWeaponName = Sanitizer.escape(weapon.name);
              ui.notifications.error(`${safeWeaponName} detonated prematurely!`);
              const armLocation = Math.random() < 0.5 ? "Right Arm" : "Left Arm";
              const weaponDamage = weapon.system.effectiveDamage || weapon.system.dmg;
              const damageRoll = await new Roll(weaponDamage).evaluate();
              await CombatHelper.applyDamage(actor, {
                damage: damageRoll.total, penetration: 5,
                location: armLocation, damageType: 'Explosive'
              });
              const safeActorName = Sanitizer.escape(actor.name);
              await damageRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: `<h3>Premature Detonation!</h3><p><strong>${safeWeaponName}</strong> exploded in ${safeActorName}'s hands!</p><p><strong>Location:</strong> ${armLocation}</p><p><strong>Penetration:</strong> 5</p>`
              });
            }

            // Store last attack state
            CombatHelper.lastAttackRoll = hitValue;
            CombatHelper.lastAttackTarget = targetNumber;
            CombatHelper.lastAttackHits = hitsTotal;
            CombatHelper.lastAttackAim = aim;
            CombatHelper.lastAttackRangeLabel = rangeLabel;
            CombatHelper.lastAttackDistance = attackerToken && targetToken ? CombatHelper.getTokenDistance(attackerToken, targetToken) : null;
            CombatHelper.lastCalledShotLocation = (calledShot !== 0 && hitsTotal > 0) ? el.querySelector('#calledShotLocation').value : null;

            // Post chat message
            const label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, isJammed || hasPrematureDetonation, isOverheated);
            const flavor = CombatDialogHelper.buildAttackFlavor(label, modifierParts);
            hitRoll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: flavor,
              rollMode: game.settings.get('core', 'rollMode')
            });

            // Deduct ammo
            const isHorde = actor.type === 'horde';
            if (!isHorde && hasAmmoManagement && weapon.system.loadedAmmo) {
              const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
              if (loadedAmmo) {
                const newAmmoValue = Math.max(0, loadedAmmo.system.capacity.value - ammoExpended);
                await loadedAmmo.update({ "system.capacity.value": newAmmoValue });
                if (newAmmoValue === 0) {
                  const safeWeaponName = Sanitizer.escape(weapon.name);
                  ui.notifications.warn(`${safeWeaponName} is out of ammunition!`);
                }
                actor.sheet.render(false);
              }
            }
          }
        },
        { label: "Cancel", action: "cancel" }
      ]
    });
  }

  /**
   * Execute a ranged attack immediately with preset options (skip dialog).
   * @param {Object} actor - Actor document
   * @param {Object} weapon - Weapon item
   * @param {Object} options - Preset attack options
   */
  /* istanbul ignore next */
  static async _attackWithOptions(actor, weapon, options) {
    const validation = CombatDialogHelper.validateWeaponForAttack(weapon, actor);
    if (!validation.valid) {
      ui.notifications.warn(validation.message);
      return;
    }

    const rofValidation = CombatDialogHelper.validateRofOption(options.rof || 0, weapon, actor);
    if (!rofValidation.valid) {
      ui.notifications.warn(rofValidation.message);
      return;
    }

    const aim = CombatDialogHelper.mapAimOption(options.aim || 0);
    const autoFire = CombatDialogHelper.mapRofOption(options.rof || 0);
    const calledShot = options.calledShot ? COMBAT_PENALTIES.CALLED_SHOT : 0;
    const runningTarget = options.runningTarget ? COMBAT_PENALTIES.RUNNING_TARGET : 0;
    const miscModifier = options.miscModifier || 0;

    const rof = weapon.system.effectiveRof || weapon.system.rof || "S/-/-";
    const rofParts = rof.split('/');
    const clip = weapon.system.clip;
    const hasAmmoManagement = clip && clip !== '\u2014' && clip !== '-' && clip !== '';

    const attackerToken = actor.getActiveTokens()[0] || canvas.tokens.controlled[0];
    const targetToken = game.user.targets.first();

    let autoRangeMod = 0;
    let rangeLabel = "Unknown";

    if (attackerToken && targetToken) {
      let weaponRange = 0;
      if (weapon.system.class?.toLowerCase() === 'thrown') {
        weaponRange = this.calculateThrownWeaponRange(weapon, actor) || 0;
      } else {
        weaponRange = parseInt(weapon.system.effectiveRange || weapon.system.range) || 0;
      }
      if (weaponRange > 0) {
        const distance = CombatHelper.getTokenDistance(attackerToken, targetToken);
        if (distance !== null) {
          const rangeInfo = CombatHelper.calculateRangeModifier(distance, weaponRange);
          autoRangeMod = rangeInfo.modifier;
          rangeLabel = rangeInfo.label;
        }
      }
    }

    const hitRoll = await new Roll('1d100').evaluate();
    const hitValue = hitRoll.total;

    const targetActor = targetToken?.actor;
    const { modifier: sizeModifier, label: sizeLabel } = CombatDialogHelper.getTargetSizeModifier(targetActor);

    const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
      hitValue, aim, autoFire, calledShot, runningTarget, miscModifier,
      rangeMod: autoRangeMod, rangeLabel, rofParts,
      sizeModifier, sizeLabel, targetActor
    });

    let { hitsTotal, isJammed } = result;
    const { targetNumber, hasPrematureDetonation, isOverheated, hasReliable,
            ammoExpended, modifierParts, isStorm, isTwinLinked } = result;

    if (targetActor?.type === 'horde' && hitsTotal > 0) {
      const isFlame = await WeaponQualityHelper.hasQuality(weapon, 'flame');
      if (isFlame) {
        const flameRoll = await new Roll('1d5').evaluate();
        hitsTotal += flameRoll.total;
        await flameRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: `<strong>Flame vs Horde:</strong> +${flameRoll.total} additional hits (1d5)`,
          rollMode: game.settings.get('core', 'rollMode')
        });
      }
    }

    if (isJammed && hasReliable) {
      const reliableRoll = await new Roll('1d10').evaluate();
      const safeWeaponName = Sanitizer.escape(weapon.name);
      await reliableRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `<strong>Reliable Check:</strong> ${safeWeaponName} - ${reliableRoll.total === 10 ? 'Jammed!' : 'Not Jammed'}`,
        rollMode: game.settings.get('core', 'rollMode')
      });
      isJammed = reliableRoll.total === 10;
    }

    if (isJammed) await weapon.update({ "system.jammed": true });

    if (hasPrematureDetonation) {
      await weapon.update({ "system.jammed": true });
      const safeWeaponName = Sanitizer.escape(weapon.name);
      ui.notifications.error(`${safeWeaponName} detonated prematurely!`);
      const armLocation = Math.random() < 0.5 ? "Right Arm" : "Left Arm";
      const weaponDamage = weapon.system.effectiveDamage || weapon.system.dmg;
      const damageRoll = await new Roll(weaponDamage).evaluate();
      await CombatHelper.applyDamage(actor, {
        damage: damageRoll.total, penetration: 5,
        location: armLocation, damageType: 'Explosive'
      });
      const safeActorName = Sanitizer.escape(actor.name);
      await damageRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `<h3>Premature Detonation!</h3><p><strong>${safeWeaponName}</strong> exploded in ${safeActorName}'s hands!</p><p><strong>Location:</strong> ${armLocation}</p><p><strong>Penetration:</strong> 5</p>`
      });
    }

    CombatHelper.lastAttackRoll = hitValue;
    CombatHelper.lastAttackTarget = targetNumber;
    CombatHelper.lastAttackHits = hitsTotal;
    CombatHelper.lastAttackAim = aim;
    CombatHelper.lastAttackRangeLabel = rangeLabel;
    CombatHelper.lastAttackDistance = attackerToken && targetToken ? CombatHelper.getTokenDistance(attackerToken, targetToken) : null;
    CombatHelper.lastCalledShotLocation = (calledShot !== 0 && hitsTotal > 0 && options.calledShotLocation) ? options.calledShotLocation : null;

    const label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, isJammed || hasPrematureDetonation, isOverheated);
    const flavor = CombatDialogHelper.buildAttackFlavor(label, modifierParts);
    hitRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: flavor,
      rollMode: game.settings.get('core', 'rollMode')
    });

    const isHorde = actor.type === 'horde';
    if (!isHorde && hasAmmoManagement && weapon.system.loadedAmmo) {
      const loadedAmmo = actor.items.get(weapon.system.loadedAmmo);
      if (loadedAmmo) {
        const newAmmoValue = Math.max(0, loadedAmmo.system.capacity.value - ammoExpended);
        await loadedAmmo.update({ "system.capacity.value": newAmmoValue });
        if (newAmmoValue === 0) {
          const safeWeaponName = Sanitizer.escape(weapon.name);
          ui.notifications.warn(`${safeWeaponName} is out of ammunition!`);
        }
        actor.sheet.render(false);
      }
    }
  }
}
