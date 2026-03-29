import { ModifierHelper } from "../helpers/character/modifiers.mjs";

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
    async _renderOuter() {
        const html = await super._renderOuter();
        if (this.item.type === 'psychic-power') {
            this.position.height = 624;
        }
        return html;
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

        // Add characteristic labels for specialty sheet
        if (itemData.type === 'specialty') {
            context.characteristics = {
                ws: 'Weapon Skill',
                bs: 'Ballistic Skill',
                str: 'Strength',
                tg: 'Toughness',
                ag: 'Agility',
                int: 'Intelligence',
                per: 'Perception',
                wil: 'Willpower',
                fs: 'Fellowship'
            };
            
            // Ensure rankCosts exists and is properly structured
            if (!context.system.rankCosts) {
                context.system.rankCosts = {};
                for (let i = 1; i <= 8; i++) {
                    context.system.rankCosts[i.toString()] = { skills: {}, talents: {} };
                }
            }
            
            // Add skill and talent name lookups for display
            context.skillNames = {};
            context.talentNames = {};
            
            // Get skill names from config
            if (game.deathwatch?.config?.Skills) {
                context.skillNames = game.deathwatch.config.Skills;
            }
            
            // Get talent names from actor's items or compendium
            const talentIds = new Set();
            for (const rankData of Object.values(context.system.rankCosts)) {
                if (rankData.talents) {
                    Object.keys(rankData.talents).forEach(id => talentIds.add(id));
                }
            }
            
            // Look up talent names from compendium
            const talentPack = game.packs.get('deathwatch.talents');
            if (talentPack) {
                for (const talentId of talentIds) {
                    const talent = talentPack.index.get(talentId);
                    if (talent) {
                        context.talentNames[talentId] = talent.name;
                    }
                }
            }
        }


        // Populate attached histories for armor
        if (itemData.type === 'armor') {
            if (actor) {
                const historyIds = Array.isArray(itemData.system.attachedHistories) ? itemData.system.attachedHistories : [];
                context.system.attachedHistories = historyIds.map(histId => {
                    const hist = actor.items.get(histId);
                    return hist ? { _id: hist.id, name: hist.name, img: hist.img } : null;
                }).filter(h => h);
            } else {
                context.system.attachedHistories = [];
            }
        }

        // Populate attached qualities for weapons
        if (itemData.type === 'weapon') {
            const qualityIds = Array.isArray(itemData.system.attachedQualities) ? itemData.system.attachedQualities : [];
            const pack = game.packs.get('deathwatch.weapon-qualities');
            context.attachedQualities = qualityIds.map(q => {
                const qualityId = typeof q === 'string' ? q : q.id;
                let quality = actor?.items.get(qualityId);
                if (!quality && pack) {
                    quality = pack.index.get(qualityId);
                }
                if (!quality) return null;
                return {
                    _id: quality._id || quality.id,
                    name: quality.name,
                    system: {
                        key: quality.system?.key,
                        value: (typeof q === 'object' && q.value !== undefined) ? q.value : quality.system?.value
                    }
                };
            }).filter(q => q);
            
            // Add Blast quality if effectiveBlast is set
            if (itemData.system.effectiveBlast) {
                context.attachedQualities.push({
                    _id: 'effective-blast',
                    name: 'Blast',
                    system: {
                        key: 'blast',
                        value: itemData.system.effectiveBlast
                    },
                    isEffective: true
                });
            }
            
            // Add Felling quality if effectiveFelling is set
            if (itemData.system.effectiveFelling) {
                context.attachedQualities.push({
                    _id: 'effective-felling',
                    name: 'Felling',
                    system: {
                        key: 'felling',
                        value: itemData.system.effectiveFelling
                    },
                    isEffective: true
                });
            }
        }

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

        // Armor history management
        html.find('.history-remove').click(this._onHistoryRemove.bind(this));

        // Weapon quality management
        html.find('.quality-remove').click(this._onQualityRemove.bind(this));
        html.find('.quality-value').change(this._onQualityValueChange.bind(this));
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

        ModifierHelper._showEditDialog(modifier, async (updated) => {
            const modifiers = [...this.item.system.modifiers];
            const index = modifiers.findIndex(m => m._id === modifierId);
            if (index >= 0) {
                modifiers[index] = { ...modifiers[index], ...updated };
                await this.item.update({ "system.modifiers": modifiers });
            }
        });
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

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data.type !== 'Item') return super._onDrop?.(event);
        
        const droppedItem = await Item.implementation.fromDropData(data);
        if (!droppedItem) return super._onDrop?.(event);

        // Handle armor history drop on armor
        if (this.item.type === 'armor' && droppedItem.type === 'armor-history') {
            event.preventDefault();
            event.stopPropagation();
            
            const currentHistories = this.item.system.attachedHistories || [];
            
            if (!currentHistories.includes(droppedItem.id)) {
                const newHistories = [...currentHistories, droppedItem.id];
                
                await this.item.update({ 
                    "system.attachedHistories": newHistories
                });
                ui.notifications.info(`${droppedItem.name} attached to ${this.item.name}.`);
            } else {
                ui.notifications.warn(`${droppedItem.name} is already attached to ${this.item.name}.`);
            }
            return false;
        }

        // Handle weapon quality drop on weapon
        if (this.item.type === 'weapon' && droppedItem.type === 'weapon-quality') {
            event.preventDefault();
            event.stopPropagation();
            
            const currentQualities = this.item.system.attachedQualities || [];
            const qualityExists = currentQualities.some(q => {
                const id = typeof q === 'string' ? q : q.id;
                return id === droppedItem.id;
            });
            
            if (!qualityExists) {
                const newQuality = droppedItem.system.value 
                    ? { id: droppedItem.id, value: droppedItem.system.value }
                    : droppedItem.id;
                const newQualities = [...currentQualities, newQuality];
                
                await this.item.update({ 
                    "system.attachedQualities": newQualities
                });
                ui.notifications.info(`${droppedItem.name} attached to ${this.item.name}.`);
            } else {
                ui.notifications.warn(`${droppedItem.name} is already attached to ${this.item.name}.`);
            }
            return false;
        }

        return super._onDrop?.(event);
    }

    async _onHistoryRemove(event) {
        event.preventDefault();
        const historyId = $(event.currentTarget).data('historyId');
        const attachedHistories = (this.item.system.attachedHistories || []).filter(id => id !== historyId);
        await this.item.update({ "system.attachedHistories": attachedHistories });
        this.render(false);
    }

    async _onQualityRemove(event) {
        event.preventDefault();
        const qualityId = $(event.currentTarget).data('qualityId');
        const attachedQualities = (this.item.system.attachedQualities || []).filter(q => {
            const id = typeof q === 'string' ? q : q.id;
            return id !== qualityId;
        });
        await this.item.update({ "system.attachedQualities": attachedQualities });
        this.render(false);
    }

    async _onQualityValueChange(event) {
        event.preventDefault();
        const qualityId = $(event.currentTarget).data('qualityId');
        const newValue = $(event.currentTarget).val();
        const attachedQualities = (this.item.system.attachedQualities || []).map(q => {
            const id = typeof q === 'string' ? q : q.id;
            if (id === qualityId) {
                return { id: qualityId, value: newValue };
            }
            return q;
        });
        await this.item.update({ "system.attachedQualities": attachedQualities });
    }
}
