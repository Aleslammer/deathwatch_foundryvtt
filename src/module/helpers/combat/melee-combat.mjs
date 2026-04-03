import { AIM_MODIFIERS, COMBAT_PENALTIES, MELEE_MODIFIERS, HIT_LOCATIONS } from "../constants.mjs";
import { CombatHelper } from "./combat.mjs";
import { CombatDialogHelper } from "./combat-dialog.mjs";
import { WeaponQualityHelper } from "./weapon-quality-helper.mjs";

export class MeleeCombatHelper {
  /**
   * Calculate melee attack modifiers and target number.
   * @param {Object} options
   * @param {number} options.ws - Weapon Skill value
   * @param {number} options.aim - Aim modifier
   * @param {number} options.allOut - All Out Attack modifier
   * @param {number} options.charge - Charge modifier
   * @param {number} options.calledShot - Called Shot penalty
   * @param {number} options.runningTarget - Running Target penalty
   * @param {number} options.miscModifier - Misc modifier
   * @param {boolean} options.isDefensive - Whether weapon has Defensive quality
   * @returns {{ modifiers: number, clampedModifiers: number, targetNumber: number, defensivePenalty: number }}
   */
  static buildMeleeModifiers({ ws = 0, aim = 0, allOut = 0, charge = 0, calledShot = 0, runningTarget = 0, miscModifier = 0, sizeModifier = 0, isDefensive = false } = {}) {
    const defensivePenalty = isDefensive ? -10 : 0;
    const modifiers = aim + allOut + charge + calledShot + runningTarget + miscModifier + defensivePenalty + sizeModifier;
    const clampedModifiers = Math.max(-60, Math.min(60, modifiers));
    const targetNumber = ws + clampedModifiers;
    return { modifiers, clampedModifiers, targetNumber, defensivePenalty };
  }

  /**
   * Build modifier breakdown parts for chat display.
   * @param {Object} options
   * @returns {string[]}
   */
  static buildMeleeModifierParts({ ws = 0, aim = 0, allOut = 0, charge = 0, calledShot = 0, runningTarget = 0, miscModifier = 0, defensivePenalty = 0, sizeModifier = 0, sizeLabel = "" } = {}) {
    const parts = [`${ws} WS`];
    if (aim !== 0) parts.push(`+${aim} Aim`);
    if (allOut !== 0) parts.push(`+${allOut} All Out Attack`);
    if (charge !== 0) parts.push(`+${charge} Charge`);
    if (defensivePenalty !== 0) parts.push(`${defensivePenalty} Defensive`);
    if (calledShot !== 0) parts.push(`${calledShot} Called Shot`);
    if (runningTarget !== 0) parts.push(`${runningTarget} Running Target`);
    if (miscModifier !== 0) parts.push(`${miscModifier >= 0 ? '+' : ''}${miscModifier} Misc`);
    if (sizeModifier !== 0) parts.push(`${sizeModifier >= 0 ? '+' : ''}${sizeModifier} ${sizeLabel || 'Target Size'}`);
    return parts;
  }
  /**
   * Resolve a melee attack given parsed dialog inputs and a d100 roll.
   * Pure logic — no UI, no rolls, no document updates.
   * @param {Object} actor - Actor document
   * @param {Object} weapon - Weapon item
   * @param {Object} options - Parsed attack options
   * @param {number} options.hitValue - The d100 attack roll result
   * @param {number} options.aim - Aim modifier
   * @param {number} options.allOut - All Out Attack modifier
   * @param {number} options.charge - Charge modifier
   * @param {number} options.calledShot - Called shot penalty
   * @param {number} options.runningTarget - Running target penalty
   * @param {number} options.miscModifier - Misc modifier
   * @param {number} [options.sizeModifier=0] - Target size modifier
   * @param {string} [options.sizeLabel=''] - Target size label
   * @param {Object} [options.targetActor=null] - Target actor for horde hit recalculation
   * @returns {Promise<Object>} Attack resolution result
   */
  static async resolveMeleeAttack(actor, weapon, options) {
    const {
      hitValue, aim, allOut, charge, calledShot, runningTarget, miscModifier,
      sizeModifier = 0, sizeLabel = '', targetActor = null
    } = options;

    const ws = actor.system.characteristics.ws.value || 0;
    const isDefensive = weapon.system?.attachedQualities?.some(
      q => (typeof q === 'string' ? q : q.id) === 'defensive'
    ) || false;

    const { targetNumber, defensivePenalty } = MeleeCombatHelper.buildMeleeModifiers({
      ws, aim, allOut, charge, calledShot, runningTarget, miscModifier, sizeModifier, isDefensive
    });

    const success = hitValue <= targetNumber;
    const degreesOfSuccess = success ? CombatDialogHelper.calculateDegreesOfSuccess(hitValue, targetNumber) : 0;
    let hitsTotal = success ? 1 : 0;

    if (targetActor && hitsTotal > 0) {
      const hasPowerField = await WeaponQualityHelper.hasQuality(weapon, 'power-field');
      hitsTotal = targetActor.system.calculateHitsReceived({
        isMelee: true, degreesOfSuccess, hasPowerField, baseHits: 1
      });
    }

    const modifierParts = MeleeCombatHelper.buildMeleeModifierParts({
      ws, aim, allOut, charge, calledShot, runningTarget, miscModifier, defensivePenalty, sizeModifier, sizeLabel
    });

    return {
      hitValue, targetNumber, success, degreesOfSuccess,
      hitsTotal, modifierParts, defensivePenalty
    };
  }

  /* istanbul ignore next */
  static async attackDialog(actor, weapon, options = {}) {
    const hasOptions = Object.keys(options).length > 0 && options.action !== 'damage';

    if (hasOptions && options.skipDialog) {
      return this._attackWithOptions(actor, weapon, options);
    }

    const ws = actor.system.characteristics.ws.value || 0;

    const content = `
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${weapon.img}" alt="${weapon.name}" style="max-width: 100px; max-height: 100px; border: none;" />
      </div>
      <div class="form-group">
        <label>Aim:</label>
        <select id="aim" name="aim">
          <option value="${AIM_MODIFIERS.NONE}">None</option>
          <option value="${AIM_MODIFIERS.HALF}">Half (+${AIM_MODIFIERS.HALF})</option>
          <option value="${AIM_MODIFIERS.FULL}">Full (+${AIM_MODIFIERS.FULL})</option>
        </select>
      </div>
      <div class="form-group" style="display: flex; gap: 20px;">
        <label title="+${MELEE_MODIFIERS.ALL_OUT_ATTACK} bonus"><i class="far fa-square" id="allOutIcon"></i> All Out Attack
          <input type="checkbox" id="allOut" name="allOut" style="display:none;" />
        </label>
        <label title="+${MELEE_MODIFIERS.CHARGE} bonus"><i class="far fa-square" id="chargeIcon"></i> Charge
          <input type="checkbox" id="charge" name="charge" style="display:none;" />
        </label>
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
      window: { title: `Melee Attack: ${weapon.name}` },
      position: { width: 325 },
      content: content,
      render: (event, dialog) => {
        const el = dialog.element;
        const miscInput = el.querySelector('#miscModifier');
        if (miscInput) miscInput.addEventListener('input', function() {
          this.value = this.value.replace(/[^0-9+\-]/g, '');
        });

        ['allOut', 'charge', 'calledShot', 'runningTarget'].forEach(id => {
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
        });

        if (hasOptions) {
          if (options.aim !== undefined) el.querySelector('#aim').value = CombatDialogHelper.mapAimOption(options.aim);
          if (options.allOut) {
            el.querySelector('#allOut').checked = true;
            el.querySelector('#allOutIcon').classList.replace('fa-square', 'fa-check-square');
          }
          if (options.charge) {
            el.querySelector('#charge').checked = true;
            el.querySelector('#chargeIcon').classList.replace('fa-square', 'fa-check-square');
          }
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
            const allOut = el.querySelector('#allOut').checked ? MELEE_MODIFIERS.ALL_OUT_ATTACK : 0;
            const charge = el.querySelector('#charge').checked ? MELEE_MODIFIERS.CHARGE : 0;
            const calledShot = el.querySelector('#calledShot').checked ? COMBAT_PENALTIES.CALLED_SHOT : 0;
            const runningTarget = el.querySelector('#runningTarget').checked ? COMBAT_PENALTIES.RUNNING_TARGET : 0;
            const miscModifier = parseInt(el.querySelector('#miscModifier').value) || 0;

            const hitRoll = await new Roll('1d100').evaluate();
            const hitValue = hitRoll.total;

            const targetToken = game.user.targets.first();
            const targetActor = targetToken?.actor;
            const { modifier: sizeModifier, label: sizeLabel } = CombatDialogHelper.getTargetSizeModifier(targetActor);

            const result = await MeleeCombatHelper.resolveMeleeAttack(actor, weapon, {
              hitValue, aim, allOut, charge, calledShot, runningTarget, miscModifier,
              sizeModifier, sizeLabel, targetActor
            });

            const { targetNumber, success, degreesOfSuccess, hitsTotal, modifierParts } = result;

            CombatHelper.lastAttackRoll = hitValue;
            CombatHelper.lastAttackTarget = targetNumber;
            CombatHelper.lastAttackHits = hitsTotal;
            CombatHelper.lastAttackAim = aim;
            CombatHelper.lastCalledShotLocation = (calledShot !== 0 && hitsTotal > 0) ? el.querySelector('#calledShotLocation').value : null;

            let label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, false);
            if (success) label += `<br><em>${degreesOfSuccess} Degree${degreesOfSuccess !== 1 ? 's' : ''} of Success</em>`;
            const flavor = modifierParts.length > 0 
              ? `${label}<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>`
              : label;

            hitRoll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: flavor,
              rollMode: game.settings.get('core', 'rollMode')
            });
          }
        },
        { label: "Cancel", action: "cancel" }
      ]
    });
  }

  /**
   * Execute a melee attack immediately with preset options (skip dialog).
   * @param {Object} actor - Actor document
   * @param {Object} weapon - Weapon item
   * @param {Object} options - Preset attack options
   */
  /* istanbul ignore next */
  static async _attackWithOptions(actor, weapon, options) {
    const aim = CombatDialogHelper.mapAimOption(options.aim || 0);
    const allOut = options.allOut ? MELEE_MODIFIERS.ALL_OUT_ATTACK : 0;
    const charge = options.charge ? MELEE_MODIFIERS.CHARGE : 0;
    const calledShot = options.calledShot ? COMBAT_PENALTIES.CALLED_SHOT : 0;
    const runningTarget = options.runningTarget ? COMBAT_PENALTIES.RUNNING_TARGET : 0;
    const miscModifier = options.miscModifier || 0;

    const hitRoll = await new Roll('1d100').evaluate();
    const hitValue = hitRoll.total;

    const targetToken = game.user.targets.first();
    const targetActor = targetToken?.actor;
    const { modifier: sizeModifier, label: sizeLabel } = CombatDialogHelper.getTargetSizeModifier(targetActor);

    const result = await MeleeCombatHelper.resolveMeleeAttack(actor, weapon, {
      hitValue, aim, allOut, charge, calledShot, runningTarget, miscModifier,
      sizeModifier, sizeLabel, targetActor
    });

    const { targetNumber, success, degreesOfSuccess, hitsTotal, modifierParts } = result;

    CombatHelper.lastAttackRoll = hitValue;
    CombatHelper.lastAttackTarget = targetNumber;
    CombatHelper.lastAttackHits = hitsTotal;
    CombatHelper.lastAttackAim = aim;
    CombatHelper.lastCalledShotLocation = (calledShot !== 0 && hitsTotal > 0 && options.calledShotLocation) ? options.calledShotLocation : null;

    let label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, false);
    if (success) label += `<br><em>${degreesOfSuccess} Degree${degreesOfSuccess !== 1 ? 's' : ''} of Success</em>`;
    const flavor = modifierParts.length > 0
      ? `${label}<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>`
      : label;

    hitRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: flavor,
      rollMode: game.settings.get('core', 'rollMode')
    });
  }
}
