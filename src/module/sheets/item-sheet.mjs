/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DeathwatchItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["deathwatch", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/deathwatch/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.item;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;

        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Modifier management
        html.find('.modifier-create').click(this._onModifierCreate.bind(this));
        html.find('.modifier-edit').click(this._onModifierEdit.bind(this));
        html.find('.modifier-delete').click(this._onModifierDelete.bind(this));
        html.find('.modifier-toggle').click(this._onToggleModifierEnabled.bind(this));

        // Weapon attack/damage rolls
        html.find('.weapon-attack').click(this._onWeaponAttack.bind(this));
        html.find('.weapon-damage').click(this._onWeaponDamage.bind(this));
    }

    async _onModifierCreate(event) {
        event.preventDefault();
        const modifiers = Array.isArray(this.item.system.modifiers) ? [...this.item.system.modifiers] : [];
        modifiers.push({
            _id: foundry.utils.randomID(),
            name: "New Modifier",
            modifier: "0",
            type: "untyped",
            effectType: "characteristic",
            valueAffected: "",
            enabled: true
        });
        await this.item.update({ "system.modifiers": modifiers });
    }

    async _onModifierDelete(event) {
        event.preventDefault();
        const modifierId = $(event.currentTarget).closest('.modifier').data('modifierId');
        const modifiers = Array.isArray(this.item.system.modifiers) ? this.item.system.modifiers.filter(m => m._id !== modifierId) : [];
        await this.item.update({ "system.modifiers": modifiers });
    }

    async _onModifierEdit(event) {
        event.preventDefault();
        const modifierId = $(event.currentTarget).closest('.modifier').data('modifierId');
        const modifier = this.item.system.modifiers?.find(m => m._id === modifierId);
        if (!modifier) return;

        const { DWConfig } = await import("../helpers/config.mjs");

        let valueAffectedField = '';
        if (modifier.effectType === 'characteristic') {
            valueAffectedField = `
                <select name="valueAffected">
                    <option value="">Select Characteristic</option>
                    <option value="ws" ${modifier.valueAffected === 'ws' ? 'selected' : ''}>Weapon Skill</option>
                    <option value="bs" ${modifier.valueAffected === 'bs' ? 'selected' : ''}>Ballistic Skill</option>
                    <option value="str" ${modifier.valueAffected === 'str' ? 'selected' : ''}>Strength</option>
                    <option value="tg" ${modifier.valueAffected === 'tg' ? 'selected' : ''}>Toughness</option>
                    <option value="ag" ${modifier.valueAffected === 'ag' ? 'selected' : ''}>Agility</option>
                    <option value="int" ${modifier.valueAffected === 'int' ? 'selected' : ''}>Intelligence</option>
                    <option value="per" ${modifier.valueAffected === 'per' ? 'selected' : ''}>Perception</option>
                    <option value="wil" ${modifier.valueAffected === 'wil' ? 'selected' : ''}>Willpower</option>
                    <option value="fs" ${modifier.valueAffected === 'fs' ? 'selected' : ''}>Fellowship</option>
                </select>
            `;
        } else if (modifier.effectType === 'skill') {
            valueAffectedField = '<select name="valueAffected"><option value="">Select Skill</option>';
            for (const [key, label] of Object.entries(DWConfig.Skills)) {
                const selected = modifier.valueAffected === key ? 'selected' : '';
                valueAffectedField += `<option value="${key}" ${selected}>${label}</option>`;
            }
            valueAffectedField += '</select>';
        } else {
            valueAffectedField = `<input type="text" name="valueAffected" value="${modifier.valueAffected}" />`;
        }

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
                    <option value="untyped" ${modifier.type === 'untyped' ? 'selected' : ''}>Untyped</option>
                    <option value="circumstance" ${modifier.type === 'circumstance' ? 'selected' : ''}>Circumstance</option>
                    <option value="equipment" ${modifier.type === 'equipment' ? 'selected' : ''}>Equipment</option>
                    <option value="trait" ${modifier.type === 'trait' ? 'selected' : ''}>Trait</option>
                </select>
            </div>
            <div class="form-group">
                <label>Effect Type:</label>
                <select name="effectType" id="effectType">
                    <option value="characteristic" ${modifier.effectType === 'characteristic' ? 'selected' : ''}>Characteristic</option>
                    <option value="skill" ${modifier.effectType === 'skill' ? 'selected' : ''}>Skill</option>
                </select>
            </div>
            <div class="form-group" id="valueAffectedGroup">
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
                    if (effectType === 'characteristic') {
                        group.find('input, select').remove();
                        group.append(`
                            <select name="valueAffected">
                                <option value="">Select Characteristic</option>
                                <option value="ws">Weapon Skill</option>
                                <option value="bs">Ballistic Skill</option>
                                <option value="str">Strength</option>
                                <option value="tg">Toughness</option>
                                <option value="ag">Agility</option>
                                <option value="int">Intelligence</option>
                                <option value="per">Perception</option>
                                <option value="wil">Willpower</option>
                                <option value="fs">Fellowship</option>
                            </select>
                        `);
                    } else if (effectType === 'skill') {
                        group.find('input, select').remove();
                        let skillOptions = '<select name="valueAffected"><option value="">Select Skill</option>';
                        for (const [key, label] of Object.entries(DWConfig.Skills)) {
                            skillOptions += `<option value="${key}">${label}</option>`;
                        }
                        skillOptions += '</select>';
                        group.append(skillOptions);
                    } else {
                        group.find('input, select').remove();
                        group.append(`<input type="text" name="valueAffected" value="" />`);
                    }
                });
            },
            buttons: {
                save: {
                    label: "Save",
                    callback: async (html) => {
                        const modifiers = [...this.item.system.modifiers];
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
                            await this.item.update({ "system.modifiers": modifiers });
                        }
                    }
                },
                cancel: { label: "Cancel" }
            },
            default: "save"
        }).render(true);
    }

    async _onToggleModifierEnabled(event) {
        event.preventDefault();
        const modifierId = $(event.currentTarget).closest('.modifier').data('modifierId');
        const modifiers = [...this.item.system.modifiers];
        const index = modifiers.findIndex(m => m._id === modifierId);
        if (index >= 0) {
            modifiers[index].enabled = !modifiers[index].enabled;
            await this.item.update({ "system.modifiers": modifiers });
        }
    }

    async _onWeaponAttack(event) {
        event.preventDefault();
        const actor = this.item.actor;
        if (!actor) return ui.notifications.warn("This weapon must be owned by an actor to roll attacks.");

        const bs = actor.system.characteristics.bs.value;
        const roll = await new Roll("1d100").evaluate();
        const total = roll.total;
        const target = bs;
        const isHit = total <= target;

        const flavor = `<h2>${this.item.name} - Attack Roll</h2><p>Target: ${target}</p>`;
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: flavor + `<p><strong>${isHit ? 'HIT!' : 'MISS!'}</strong></p>`
        });
    }

    async _onWeaponDamage(event) {
        event.preventDefault();
        const actor = this.item.actor;
        if (!actor) return ui.notifications.warn("This weapon must be owned by an actor to roll damage.");

        const dmg = this.item.system.dmg;
        if (!dmg) return ui.notifications.warn("This weapon has no damage value.");

        const roll = await new Roll(dmg).evaluate();
        const flavor = `<h2>${this.item.name} - Damage Roll</h2><p>Penetration: ${this.item.system.penetration}</p>`;
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: flavor
        });
    }
}
