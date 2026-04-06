import { CombatHelper } from '../helpers/combat/combat.mjs';
import { PsychicCombatHelper } from '../helpers/combat/psychic-combat.mjs';

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data - The dropped data
 * @param {number} slot - The hotbar slot to use
 * @returns {Promise<boolean>}
 */
export async function createItemMacro(data, slot) {
    // First, determine if this is a valid owned item.
    if (data.type !== "Item") return;
    if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
        return ui.notifications.warn("You can only create macro buttons for owned Items");
    }
    // If it is, retrieve it based on the uuid.
    const item = await Item.fromDropData(data);

    // Create the macro command using the uuid.
    const command = `game.deathwatch.rollItemMacro("${data.uuid}");`;
    let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "deathwatch.itemMacro": true }
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Execute a macro for an owned item. Weapons show Attack/Damage dialog,
 * psychic powers open Focus Power Test, other items use generic roll.
 * When options are provided for weapons, skips the Attack/Damage choice dialog.
 * @param {string} itemUuid - UUID of the item
 * @param {Object} [options={}] - Preset attack options (see docs/hotbar-macros.md)
 */
export function rollItemMacro(itemUuid, options = {}) {
    const dropData = { type: 'Item', uuid: itemUuid };
    Item.fromDropData(dropData).then(item => {
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
        }

        if (item.type === 'weapon') {
            const hasOptions = Object.keys(options).length > 0;

            // action: "damage" goes straight to damage roll
            if (hasOptions && options.action === 'damage') {
                CombatHelper.weaponDamageRoll(item.parent, item);
                return;
            }

            // With options: skip Attack/Damage choice, go straight to attack
            if (hasOptions) {
                CombatHelper.weaponAttackDialog(item.parent, item, options);
                return;
            }

            // No options: show Attack/Damage choice dialog (original behavior)
            foundry.applications.api.DialogV2.wait({
                window: { title: item.name },
                content: `<p style="text-align: center;"><img src="${item.img}" width="50" height="50" style="border: none;" /><br><strong>${item.name}</strong></p>`,
                buttons: [
                    {
                        icon: '<i class="fas fa-crosshairs"></i>',
                        label: "Attack", action: "attack",
                        callback: () => CombatHelper.weaponAttackDialog(item.parent, item)
                    },
                    {
                        icon: '<i class="fas fa-burst"></i>',
                        label: "Damage", action: "damage",
                        callback: () => CombatHelper.weaponDamageRoll(item.parent, item)
                    }
                ]
            });
            return;
        }

        if (item.type === 'psychic-power') {
            PsychicCombatHelper.focusPowerDialog(item.parent, item);
            return;
        }

        item.roll();
    });
}
