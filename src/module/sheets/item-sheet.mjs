import { ModifierHelper } from "../helpers/character/modifiers.mjs";
import { ErrorHandler } from "../helpers/error-handler.mjs";
import { Validation } from "../helpers/validation.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DeathwatchItemSheet extends foundry.appv1.sheets.ItemSheet {

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
        if (this.item.type === 'psychic-power' || this.item.type === 'special-ability') {
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
        try {
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
        } catch (error) {
            console.error('[Deathwatch] Create Modifier failed:', error);
            ui.notifications.error(`Create Modifier failed: ${error.message}`);
        }
    }

    async _onModifierDelete(event) {
        try {
            event.preventDefault();
            const modifierId = $(event.currentTarget).closest('.modifier').data('modifierId');
            if (modifierId === undefined) throw new Error('Modifier ID not found');
            const modifiers = Array.isArray(this.item.system.modifiers) ? this.item.system.modifiers.filter(m => m._id !== modifierId) : [];
            await this.item.update({ "system.modifiers": modifiers });
        } catch (error) {
            console.error('[Deathwatch] Delete Modifier failed:', error);
            ui.notifications.error(`Delete Modifier failed: ${error.message}`);
        }
    }

    async _onModifierEdit(event) {
        try {
            event.preventDefault();
            const modifierId = $(event.currentTarget).closest('.modifier').data('modifierId');
            if (modifierId === undefined) throw new Error('Modifier ID not found');
            const modifier = this.item.system.modifiers?.find(m => m._id === modifierId);
            if (!modifier) throw new Error('Modifier not found');

            ModifierHelper._showEditDialog(modifier, async (updated) => {
                try {
                    const modifiers = [...this.item.system.modifiers];
                    const index = modifiers.findIndex(m => m._id === modifierId);
                    if (index >= 0) {
                        modifiers[index] = { ...modifiers[index], ...updated };
                        await this.item.update({ "system.modifiers": modifiers });
                    }
                } catch (error) {
                    console.error('[Deathwatch] Edit Modifier update failed:', error);
                    ui.notifications.error(`Edit Modifier failed: ${error.message}`);
                }
            });
        } catch (error) {
            console.error('[Deathwatch] Edit Modifier failed:', error);
            ui.notifications.error(`Edit Modifier failed: ${error.message}`);
        }
    }

    async _onToggleModifierEnabled(event) {
        try {
            event.preventDefault();
            const modifierId = $(event.currentTarget).closest('.modifier').data('modifierId');
            if (modifierId === undefined) throw new Error('Modifier ID not found');
            const modifiers = [...this.item.system.modifiers];
            const index = modifiers.findIndex(m => m._id === modifierId);
            if (index >= 0) {
                modifiers[index].enabled = !modifiers[index].enabled;
                await this.item.update({ "system.modifiers": modifiers });
            }
        } catch (error) {
            console.error('[Deathwatch] Toggle Modifier failed:', error);
            ui.notifications.error(`Toggle Modifier failed: ${error.message}`);
        }
    }

    async _onWeaponAttack(event) {
        try {
            event.preventDefault();
            const actor = Validation.requireDocument(this.item.actor, 'Actor', 'Weapon Attack');

            const bs = actor.system.characteristics?.bs?.value || 0;
            const roll = await new Roll("1d100").evaluate();
            const total = roll.total;
            const target = bs;
            const isHit = total <= target;

            const flavor = `<h2>${this.item.name} - Attack Roll</h2><p>Target: ${target}</p>`;
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: flavor + `<p><strong>${isHit ? 'HIT!' : 'MISS!'}</strong></p>`
            });
        } catch (error) {
            console.error('[Deathwatch] Weapon Attack failed:', error);
            ui.notifications.error(`Weapon Attack failed: ${error.message}`);
        }
    }

    async _onWeaponDamage(event) {
        try {
            event.preventDefault();
            const actor = Validation.requireDocument(this.item.actor, 'Actor', 'Weapon Damage');

            const dmg = this.item.system.dmg;
            if (!dmg) throw new Error('This weapon has no damage value');

            const roll = await new Roll(dmg).evaluate();
            const flavor = `<h2>${this.item.name} - Damage Roll</h2><p>Penetration: ${this.item.system.penetration}</p>`;
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: flavor
            });
        } catch (error) {
            console.error('[Deathwatch] Weapon Damage failed:', error);
            ui.notifications.error(`Weapon Damage failed: ${error.message}`);
        }
    }

    async _onDrop(event) {
        try {
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
        } catch (error) {
            console.error('[Deathwatch] Item Drop failed:', error);
            ui.notifications.error(`Item Drop failed: ${error.message}`);
            return false;
        }
    }

    async _onHistoryRemove(event) {
        try {
            event.preventDefault();
            const historyId = $(event.currentTarget).data('historyId');
            if (!historyId) throw new Error('History ID not provided');
            const attachedHistories = (this.item.system.attachedHistories || []).filter(id => id !== historyId);
            await this.item.update({ "system.attachedHistories": attachedHistories });
            this.render(false);
        } catch (error) {
            console.error('[Deathwatch] Remove History failed:', error);
            ui.notifications.error(`Remove History failed: ${error.message}`);
        }
    }

    async _onQualityRemove(event) {
        try {
            event.preventDefault();
            const qualityId = $(event.currentTarget).data('qualityId');
            if (!qualityId) throw new Error('Quality ID not provided');
            const attachedQualities = (this.item.system.attachedQualities || []).filter(q => {
                const id = typeof q === 'string' ? q : q.id;
                return id !== qualityId;
            });
            await this.item.update({ "system.attachedQualities": attachedQualities });
            this.render(false);
        } catch (error) {
            console.error('[Deathwatch] Remove Quality failed:', error);
            ui.notifications.error(`Remove Quality failed: ${error.message}`);
        }
    }

    async _onQualityValueChange(event) {
        try {
            event.preventDefault();
            const qualityId = $(event.currentTarget).data('qualityId');
            if (!qualityId) throw new Error('Quality ID not provided');
            const newValue = $(event.currentTarget).val();
            const attachedQualities = (this.item.system.attachedQualities || []).map(q => {
                const id = typeof q === 'string' ? q : q.id;
                if (id === qualityId) {
                    return { id: qualityId, value: newValue };
                }
                return q;
            });
            await this.item.update({ "system.attachedQualities": attachedQualities });
        } catch (error) {
            console.error('[Deathwatch] Change Quality Value failed:', error);
            ui.notifications.error(`Change Quality Value failed: ${error.message}`);
        }
    }
}
