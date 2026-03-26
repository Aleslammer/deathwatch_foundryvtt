import { AIM_MODIFIERS, COMBAT_PENALTIES, MELEE_MODIFIERS } from "./constants.mjs";
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
  static buildMeleeModifiers({ ws = 0, aim = 0, allOut = 0, charge = 0, calledShot = 0, runningTarget = 0, miscModifier = 0, isDefensive = false } = {}) {
    const defensivePenalty = isDefensive ? -10 : 0;
    const modifiers = aim + allOut + charge + calledShot + runningTarget + miscModifier + defensivePenalty;
    const clampedModifiers = Math.max(-60, Math.min(60, modifiers));
    const targetNumber = ws + clampedModifiers;
    return { modifiers, clampedModifiers, targetNumber, defensivePenalty };
  }

  /**
   * Build modifier breakdown parts for chat display.
   * @param {Object} options
   * @returns {string[]}
   */
  static buildMeleeModifierParts({ ws = 0, aim = 0, allOut = 0, charge = 0, calledShot = 0, runningTarget = 0, miscModifier = 0, defensivePenalty = 0 } = {}) {
    const parts = [`${ws} WS`];
    if (aim !== 0) parts.push(`+${aim} Aim`);
    if (allOut !== 0) parts.push(`+${allOut} All Out Attack`);
    if (charge !== 0) parts.push(`+${charge} Charge`);
    if (defensivePenalty !== 0) parts.push(`${defensivePenalty} Defensive`);
    if (calledShot !== 0) parts.push(`${calledShot} Called Shot`);
    if (runningTarget !== 0) parts.push(`${runningTarget} Running Target`);
    if (miscModifier !== 0) parts.push(`${miscModifier >= 0 ? '+' : ''}${miscModifier} Misc`);
    return parts;
  }
  /* istanbul ignore next */
  static async attackDialog(actor, weapon) {
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
        <label><i class="far fa-square" id="allOutIcon"></i> All Out Attack (+${MELEE_MODIFIERS.ALL_OUT_ATTACK})
          <input type="checkbox" id="allOut" name="allOut" style="display:none;" />
        </label>
        <label><i class="far fa-square" id="chargeIcon"></i> Charge (+${MELEE_MODIFIERS.CHARGE})
          <input type="checkbox" id="charge" name="charge" style="display:none;" />
        </label>
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
      title: `Melee Attack: ${weapon.name}`,
      content: content,
      render: (html) => {
        html.find('#miscModifier').on('input', function() {
          this.value = this.value.replace(/[^0-9+\-]/g, '');
        });
        
        ['allOut', 'charge', 'calledShot', 'runningTarget'].forEach(id => {
          html.find(`label:has(#${id})`).click(function(e) {
            e.preventDefault();
            const checkbox = $(this).find(`#${id}`);
            const icon = $(this).find(`#${id}Icon`);
            checkbox.prop('checked', !checkbox.prop('checked'));
            icon.toggleClass('fa-square').toggleClass('fa-check-square');
          });
        });
      },
      buttons: {
        attack: {
          label: "Attack",
          callback: async (html) => {
            const aim = parseInt(html.find('#aim').val()) || 0;
            const allOut = html.find('#allOut').prop('checked') ? MELEE_MODIFIERS.ALL_OUT_ATTACK : 0;
            const charge = html.find('#charge').prop('checked') ? MELEE_MODIFIERS.CHARGE : 0;
            const calledShot = html.find('#calledShot').prop('checked') ? COMBAT_PENALTIES.CALLED_SHOT : 0;
            const runningTarget = html.find('#runningTarget').prop('checked') ? COMBAT_PENALTIES.RUNNING_TARGET : 0;
            const miscModifier = parseInt(html.find('#miscModifier').val()) || 0;

            const { targetNumber, defensivePenalty } = MeleeCombatHelper.buildMeleeModifiers({
              ws, aim, allOut, charge, calledShot, runningTarget, miscModifier,
              isDefensive: weapon.attachedQualities?.some(q => q.system.key === 'defensive')
            });

            const hitRoll = await new Roll('1d100').evaluate();
            const hitValue = hitRoll.total;
            const success = hitValue <= targetNumber;

            CombatHelper.lastAttackRoll = hitValue;
            CombatHelper.lastAttackTarget = targetNumber;
            const degreesOfSuccess = success ? CombatDialogHelper.calculateDegreesOfSuccess(hitValue, targetNumber) : 0;
            let hitsTotal = success ? 1 : 0;

            const targetToken = game.user.targets.first();
            const targetActor = targetToken?.actor;
            if (targetActor && hitsTotal > 0) {
              const hasPowerField = await WeaponQualityHelper.hasQuality(weapon, 'power-field');
              hitsTotal = targetActor.system.calculateHitsReceived({
                isMelee: true,
                degreesOfSuccess,
                hasPowerField,
                baseHits: 1
              });
            }

            CombatHelper.lastAttackHits = hitsTotal;
            CombatHelper.lastAttackAim = aim;

            const modifierParts = MeleeCombatHelper.buildMeleeModifierParts({
              ws, aim, allOut, charge, calledShot, runningTarget, miscModifier, defensivePenalty
            });

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
        cancel: {
          label: "Cancel"
        }
      },
      default: "attack"
    }).render(true);
  }
}
