import { DWConfig } from "./config.mjs";
import { CHARACTERISTICS, CHARACTERISTIC_LABELS, MODIFIER_TYPES, EFFECT_TYPES } from "./constants.mjs";

export class ModifierHelper {
  
  static async createModifier(actor) {
    const modifiers = Array.isArray(actor.system.modifiers) ? [...actor.system.modifiers] : [];
    modifiers.push({
      _id: foundry.utils.randomID(),
      name: "New Modifier",
      modifier: "0",
      type: MODIFIER_TYPES.UNTYPED,
      modifierType: "constant",
      effectType: EFFECT_TYPES.CHARACTERISTIC,
      valueAffected: "",
      enabled: true,
      source: "Actor"
    });
    await actor.update({ "system.modifiers": modifiers });
  }

  static async deleteModifier(actor, modifierId) {
    const modifiers = Array.isArray(actor.system.modifiers) ? actor.system.modifiers.filter(m => m._id !== modifierId) : [];
    await actor.update({ "system.modifiers": modifiers });
  }

  static async toggleModifierEnabled(actor, modifierId) {
    const modifiers = [...actor.system.modifiers];
    const index = modifiers.findIndex(m => m._id === modifierId);
    if (index >= 0) {
      modifiers[index].enabled = !modifiers[index].enabled;
      await actor.update({ "system.modifiers": modifiers });
    }
  }

  static async editModifierDialog(actor, modifierId) {
    const modifier = actor.system.modifiers?.find(m => m._id === modifierId);
    if (!modifier) return;

    let valueAffectedField = this._getValueAffectedField(modifier);

    const content = `
      <div class="form-group">
        <label>Name:</label>
        <input type="text" name="name" value="${modifier.name}" />
      </div>
      <div class="form-group">
        <label>Modifier:</label>
        <input type="text" name="modifier" value="${modifier.modifier}" />
      </div>
      <div class="form-group">
        <label>Type:</label>
        <select name="type">
          <option value="${MODIFIER_TYPES.UNTYPED}" ${modifier.type === MODIFIER_TYPES.UNTYPED ? 'selected' : ''}>Untyped</option>
          <option value="${MODIFIER_TYPES.CIRCUMSTANCE}" ${modifier.type === MODIFIER_TYPES.CIRCUMSTANCE ? 'selected' : ''}>Circumstance</option>
          <option value="${MODIFIER_TYPES.EQUIPMENT}" ${modifier.type === MODIFIER_TYPES.EQUIPMENT ? 'selected' : ''}>Equipment</option>
          <option value="${MODIFIER_TYPES.TRAIT}" ${modifier.type === MODIFIER_TYPES.TRAIT ? 'selected' : ''}>Trait</option>
        </select>
      </div>
      <div class="form-group">
        <label>Effect Type:</label>
        <select name="effectType" id="effectType">
          <option value="${EFFECT_TYPES.CHARACTERISTIC}" ${modifier.effectType === EFFECT_TYPES.CHARACTERISTIC ? 'selected' : ''}>Characteristic</option>
          <option value="${EFFECT_TYPES.SKILL}" ${modifier.effectType === EFFECT_TYPES.SKILL ? 'selected' : ''}>Skill</option>
          <option value="${EFFECT_TYPES.CHARACTERISTIC_BONUS}" ${modifier.effectType === EFFECT_TYPES.CHARACTERISTIC_BONUS ? 'selected' : ''}>Characteristic Bonus</option>
          <option value="${EFFECT_TYPES.INITIATIVE}" ${modifier.effectType === EFFECT_TYPES.INITIATIVE ? 'selected' : ''}>Initiative</option>
          <option value="${EFFECT_TYPES.WOUNDS}" ${modifier.effectType === EFFECT_TYPES.WOUNDS ? 'selected' : ''}>Wounds</option>
        </select>
      </div>
      <div class="form-group" id="valueAffectedGroup" style="${modifier.effectType === EFFECT_TYPES.INITIATIVE || modifier.effectType === EFFECT_TYPES.WOUNDS ? 'display: none;' : ''}">
        <label>Value Affected:</label>
        ${valueAffectedField}
      </div>
    `;

    new Dialog({
      title: "Edit Modifier",
      content: content,
      render: (html) => {
        html.find('#effectType').change((ev) => {
          const effectType = ev.target.value;
          const group = html.find('#valueAffectedGroup');
          
          if (effectType === EFFECT_TYPES.INITIATIVE || effectType === EFFECT_TYPES.WOUNDS) {
            group.hide();
          } else {
            group.show();
            group.find('input, select').remove();
            
            if (effectType === EFFECT_TYPES.CHARACTERISTIC || effectType === EFFECT_TYPES.CHARACTERISTIC_BONUS) {
              group.append(this._getCharacteristicSelect());
            } else if (effectType === EFFECT_TYPES.SKILL) {
              group.append(this._getSkillSelect());
            } else {
              group.append(`<input type="text" name="valueAffected" value="" placeholder="e.g., acrobatics" />`);
            }
          }
        });
      },
      buttons: {
        save: {
          label: "Save",
          callback: async (html) => {
            const modifiers = [...actor.system.modifiers];
            const index = modifiers.findIndex(m => m._id === modifierId);
            if (index >= 0) {
              modifiers[index] = {
                ...modifiers[index],
                name: html.find('[name="name"]').val(),
                modifier: html.find('[name="modifier"]').val(),
                type: html.find('[name="type"]').val(),
                effectType: html.find('[name="effectType"]').val(),
                valueAffected: html.find('[name="valueAffected"]').val()
              };
              await actor.update({ "system.modifiers": modifiers });
            }
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "save"
    }).render(true);
  }

  static _getValueAffectedField(modifier) {
    if (modifier.effectType === EFFECT_TYPES.CHARACTERISTIC || modifier.effectType === EFFECT_TYPES.CHARACTERISTIC_BONUS) {
      return this._getCharacteristicSelect(modifier.valueAffected);
    } else if (modifier.effectType === EFFECT_TYPES.SKILL) {
      return this._getSkillSelect(modifier.valueAffected);
    } else {
      return `<input type="text" name="valueAffected" value="${modifier.valueAffected}" placeholder="e.g., acrobatics" />`;
    }
  }

  static _getCharacteristicSelect(selected = '') {
    return `
      <select name="valueAffected">
        <option value="">Select Characteristic</option>
        <option value="${CHARACTERISTICS.WS}" ${selected === CHARACTERISTICS.WS ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.WS]}</option>
        <option value="${CHARACTERISTICS.BS}" ${selected === CHARACTERISTICS.BS ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.BS]}</option>
        <option value="${CHARACTERISTICS.STR}" ${selected === CHARACTERISTICS.STR ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.STR]}</option>
        <option value="${CHARACTERISTICS.TG}" ${selected === CHARACTERISTICS.TG ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.TG]}</option>
        <option value="${CHARACTERISTICS.AG}" ${selected === CHARACTERISTICS.AG ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.AG]}</option>
        <option value="${CHARACTERISTICS.INT}" ${selected === CHARACTERISTICS.INT ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.INT]}</option>
        <option value="${CHARACTERISTICS.PER}" ${selected === CHARACTERISTICS.PER ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.PER]}</option>
        <option value="${CHARACTERISTICS.WIL}" ${selected === CHARACTERISTICS.WIL ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.WIL]}</option>
        <option value="${CHARACTERISTICS.FS}" ${selected === CHARACTERISTICS.FS ? 'selected' : ''}>${CHARACTERISTIC_LABELS[CHARACTERISTICS.FS]}</option>
      </select>
    `;
  }

  static _getSkillSelect(selected = '') {
    let html = '<select name="valueAffected"><option value="">Select Skill</option>';
    for (const [key, label] of Object.entries(DWConfig.Skills)) {
      html += `<option value="${key}" ${selected === key ? 'selected' : ''}>${label}</option>`;
    }
    html += '</select>';
    return html;
  }
}
