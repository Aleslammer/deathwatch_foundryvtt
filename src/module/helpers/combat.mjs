import { AIM_MODIFIERS, RATE_OF_FIRE_MODIFIERS, COMBAT_PENALTIES } from "./constants.mjs";

export class CombatHelper {
  
  static async weaponAttackDialog(actor, weapon) {
    const bs = actor.system.characteristics.bs.value;
    const bsAdv = actor.system.characteristics.bs.advances || 0;

    const content = `
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
          <option value="${RATE_OF_FIRE_MODIFIERS.SINGLE}">Single</option>
          <option value="${RATE_OF_FIRE_MODIFIERS.SEMI_AUTO}">Semi-Auto (+${RATE_OF_FIRE_MODIFIERS.SEMI_AUTO})</option>
          <option value="${RATE_OF_FIRE_MODIFIERS.FULL_AUTO}">Full-Auto (+${RATE_OF_FIRE_MODIFIERS.FULL_AUTO})</option>
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
        <label>Range Modifier:</label>
        <input type="number" id="range" name="range" value="0" />
      </div>
      <div class="form-group">
        <label>Misc Modifier:</label>
        <input type="text" id="miscModifier" name="miscModifier" value="0" pattern="[+-]?[0-9]+" />
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
          if (e.target.tagName !== 'INPUT') {
            const checkbox = $(this).find('#calledShot');
            const icon = $(this).find('#calledShotIcon');
            checkbox.prop('checked', !checkbox.prop('checked'));
            icon.toggleClass('fa-square fa-check');
          }
        });
        
        html.find('label:has(#runningTarget)').click(function(e) {
          if (e.target.tagName !== 'INPUT') {
            const checkbox = $(this).find('#runningTarget');
            const icon = $(this).find('#runningTargetIcon');
            checkbox.prop('checked', !checkbox.prop('checked'));
            icon.toggleClass('fa-square fa-check');
          }
        });
      },
      buttons: {
        attack: {
          label: "Attack",
          callback: async (html) => {
            const aim = parseInt(html.find('#aim').val()) || 0;
            const autoFire = parseInt(html.find('#autoFire').val()) || 0;
            const calledShot = html.find('#calledShot').is(':checked') ? COMBAT_PENALTIES.CALLED_SHOT : 0;
            const range = parseInt(html.find('#range').val()) || 0;
            const runningTarget = html.find('#runningTarget').is(':checked') ? COMBAT_PENALTIES.RUNNING_TARGET : 0;
            const miscModifier = parseInt(html.find('#miscModifier').val()) || 0;

            const fullModifier = bs + bsAdv + aim + autoFire + calledShot + range + runningTarget + miscModifier;
            const hitRoll = await new Roll('1d100').evaluate();
            const hitValue = hitRoll.total;
            const hitsTotal = fullModifier - hitValue >= 0 ? 1 + Math.floor((fullModifier - hitValue) / 10) : 0;

            let chatContent = `<div class="deathwatch weapon-attack">
              <h3>${weapon.name} Attack</h3>
              <div><strong>Ballistic Skill:</strong> ${bs}</div>
              <div><strong>BS Advances:</strong> ${bsAdv}</div>`;
            
            if (aim !== 0) chatContent += `<div><strong>Aim:</strong> ${aim}</div>`;
            if (autoFire !== 0) chatContent += `<div><strong>Rate of Fire:</strong> +${autoFire}</div>`;
            if (calledShot !== 0) chatContent += `<div><strong>Called Shot:</strong> ${calledShot}</div>`;
            if (range !== 0) chatContent += `<div><strong>Range:</strong> ${range}</div>`;
            if (runningTarget !== 0) chatContent += `<div><strong>Running Target:</strong> ${runningTarget}</div>`;
            if (miscModifier !== 0) chatContent += `<div><strong>Misc:</strong> ${miscModifier}</div>`;
            
            chatContent += `<div><strong>Total Modifier:</strong> ${fullModifier}</div>
              <div><strong>Roll:</strong> ${hitValue}</div>
              <div><strong>Hits:</strong> ${hitsTotal}</div>`;

            if (hitsTotal > 0) {
              chatContent += `<div style="color: green;"><strong>HIT!</strong></div>`;
            } else {
              chatContent += `<div style="color: red;"><strong>MISS!</strong></div>`;
            }

            chatContent += `</div>`;

            ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor }),
              content: chatContent
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
}
