// Import document classes.
import { DeathwatchActor } from "./documents/actor.mjs";
import { DeathwatchItem } from "./documents/item.mjs";
// Import data models.
import * as models from './data/_module.mjs';
// Import sheet classes.
import { DeathwatchActorSheet } from "./sheets/actor-sheet.mjs";
import { DeathwatchItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { DWConfig } from "./helpers/config.mjs";
import { initializeHandlebars } from "./helpers/handlebars.js";
import { CombatHelper } from "./helpers/combat.mjs";
import { CriticalEffectsHelper } from "./helpers/critical-effects.mjs";
import { InitiativeHelper } from "./helpers/initiative.mjs";
import { SkillLoader } from "./helpers/skill-loader.mjs";
import { DW_STATUS_EFFECTS } from "./helpers/status-effects.mjs";


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {

    // Load skill definitions
    await SkillLoader.init();

    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.deathwatch = {
        DeathwatchActor,
        DeathwatchItem,
        rollItemMacro
    };

    // Add custom constants for configuration.
    game.deathwatch.config = DWConfig;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d10 + @agBonus + @initiativeBonus",
        decimals: 2
    };

    CONFIG.Combat.turnMarker = {
        path: "systems/deathwatch/icons/aquila.png",
        animation: "pulse"
    };

    // Override Combat.rollInitiative to show dialog
    const originalRollInitiative = Combat.prototype.rollInitiative;
    Combat.prototype.rollInitiative = async function(ids, options = {}) {
        ids = typeof ids === "string" ? [ids] : ids;
        
        for (const id of ids) {
            const combatant = this.combatants.get(id);
            if (!combatant?.isOwner) continue;
            
            const customFormula = await InitiativeHelper.rollInitiativeDialog(combatant);
            if (!customFormula) continue;
            
            const roll = new Roll(customFormula, combatant.actor.getRollData());
            await roll.evaluate();
            
            await this.updateEmbeddedDocuments("Combatant", [{_id: id, initiative: roll.total}]);
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: combatant.actor, token: combatant.token }),
                flavor: `${combatant.name} rolls for Initiative!`
            });
        }
        
        return this;
    };

    // Define custom Document classes
    CONFIG.Actor.documentClass = DeathwatchActor;
    CONFIG.Item.documentClass = DeathwatchItem;

    // Register DataModels
    CONFIG.Actor.dataModels = {
      character: models.DeathwatchCharacter,
      npc: models.DeathwatchNPC,
      enemy: models.DeathwatchEnemy,
      horde: models.DeathwatchHorde
    };

    CONFIG.Item.dataModels = {
      gear: models.DeathwatchGear,
      demeanour: models.DeathwatchDemeanour,
      trait: models.DeathwatchTrait,
      "armor-history": models.DeathwatchArmorHistory,
      "weapon-quality": models.DeathwatchWeaponQuality,
      "critical-effect": models.DeathwatchCriticalEffect,
      implant: models.DeathwatchImplant,
      cybernetic: models.DeathwatchCybernetic,
      talent: models.DeathwatchTalent,
      ammunition: models.DeathwatchAmmunition,
      "weapon-upgrade": models.DeathwatchWeaponUpgrade,
      "psychic-power": models.DeathwatchPsychicPower,
      "special-ability": models.DeathwatchSpecialAbility,
      armor: models.DeathwatchArmor,
      chapter: models.DeathwatchChapter,
      specialty: models.DeathwatchSpecialty,
      weapon: models.DeathwatchWeapon
    };

    // Register status effects
    CONFIG.statusEffects = DW_STATUS_EFFECTS;

    // Sync token name when actor name changes (for unlinked tokens like enemies/NPCs)
    Hooks.on('updateActor', (actor, changes, options, userId) => {
        if (!changes.name) return;
        for (const token of actor.getActiveTokens()) {
            if (!token.document.actorLink) {
                token.document.update({ name: changes.name });
            }
        }
    });

    // Re-render actor sheets when Active Effects change to keep checkboxes in sync
    Hooks.on('createActiveEffect', (effect, options, userId) => {
        if (effect.parent?.documentName === 'Actor') {
            effect.parent.sheet?.render(false);
        }
    });
    
    Hooks.on('deleteActiveEffect', (effect, options, userId) => {
        if (effect.parent?.documentName === 'Actor') {
            effect.parent.sheet?.render(false);
        }
    });

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("deathwatch", DeathwatchActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("deathwatch", DeathwatchItemSheet, { makeDefault: true });
    initializeHandlebars();

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});

Hooks.once('ready', async function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));

    // Set Skip Defeated default on first load (respects manual changes after)
    if (game.user.isGM) {
        const config = game.settings.get("core", "combatTrackerConfig") || {};
        if (config.skipDefeated === undefined) {
            game.settings.set("core", "combatTrackerConfig", { ...config, skipDefeated: true });
        }
    }
});

Hooks.on('renderChatMessage', (message, html) => {
    /**
     * Resolve an actor from button data. For unlinked tokens, resolves the
     * synthetic token actor so damage is applied to the token, not the base actor.
     */
    function resolveActor(button, actorIdAttr = 'targetId') {
        const sceneId = button.data('sceneId');
        const tokenId = button.data('tokenId');
        if (sceneId && tokenId) {
            const tokenDoc = game.scenes.get(sceneId)?.tokens.get(tokenId);
            if (tokenDoc?.actor) return tokenDoc.actor;
        }
        const actorId = button.data(actorIdAttr);
        return actorId ? game.actors.get(actorId) : null;
    }

    html.find('.apply-damage-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const damage = parseInt(button.data('damage'));
        const penetration = parseInt(button.data('penetration'));
        const location = button.data('location');
        const damageType = button.data('damageType') || 'Impact';
        const isPrimitive = button.data('isPrimitive') === 'true' || button.data('isPrimitive') === true;
        const isRazorSharp = button.data('isRazorSharp') === 'true' || button.data('isRazorSharp') === true;
        const degreesOfSuccess = parseInt(button.data('degreesOfSuccess')) || 0;
        const isScatter = button.data('isScatter') === 'true' || button.data('isScatter') === true;
        const isLongOrExtremeRange = button.data('isLongOrExtremeRange') === 'true' || button.data('isLongOrExtremeRange') === true;
        const isShocking = button.data('isShocking') === 'true' || button.data('isShocking') === true;
        const isToxic = button.data('isToxic') === 'true' || button.data('isToxic') === true;
        const isMeltaRange = button.data('isMeltaRange') === 'true' || button.data('isMeltaRange') === true;
        
        const charDamageFormula = button.data('charDamageFormula');
        const charDamageChar = button.data('charDamageChar');
        const charDamageName = button.data('charDamageName');
        const charDamageEffect = charDamageFormula ? { formula: charDamageFormula, characteristic: charDamageChar, name: charDamageName } : null;
        
        const isForce = button.data('isForce') === 'true' || button.data('isForce') === true;
        const forceAttackerId = button.data('forceAttackerId');
        const forcePsyRating = parseInt(button.data('forcePsyRating')) || 0;
        const forceWeaponData = isForce ? { attackerId: forceAttackerId, psyRating: forcePsyRating } : null;
        
        const magnitudeBonusDamage = parseInt(button.data('magnitudeBonusDamage')) || 0;
        
        const sceneId = button.data('sceneId');
        const tokenId = button.data('tokenId');
        const tokenInfo = (sceneId && tokenId) ? { sceneId, tokenId } : null;
        
        const targetActor = resolveActor(button);
        if (!targetActor) {
            ui.notifications.warn('Target actor not found!');
            return;
        }
        
        await CombatHelper.applyDamage(targetActor, { damage, penetration, location, damageType, felling: 0, isPrimitive, isRazorSharp, degreesOfSuccess, isScatter, isLongOrExtremeRange, isShocking, isToxic, isMeltaRange, charDamageEffect, forceWeaponData, tokenInfo, magnitudeBonusDamage });
    });
    
    html.find('.shocking-test-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const armorValue = parseInt(button.data('armorValue'));
        const stunRounds = parseInt(button.data('stunRounds'));
        
        const actor = resolveActor(button, 'actorId');
        if (!actor) {
            ui.notifications.warn('Actor not found!');
            return;
        }
        
        const tg = actor.system.characteristics?.tg?.value || 0;
        const armorBonus = armorValue * 10;
        const targetNumber = tg + armorBonus;
        
        const roll = await new Roll('1d100').evaluate();
        const success = roll.total <= targetNumber;
        
        let flavor = `<strong>Shocking Toughness Test</strong><br>Target: ${targetNumber} (TG ${tg} + ${armorBonus} armor bonus)<br>`;
        if (success) {
            flavor += '<strong style="color: green;">SUCCESS - Not Stunned</strong>';
        } else {
            flavor += `<strong style="color: red;">FAILED - Stunned for ${stunRounds} rounds!</strong>`;
        }
        
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor,
            rollMode: game.settings.get('core', 'rollMode')
        });
    });
    
    html.find('.toxic-test-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const penalty = parseInt(button.data('penalty'));
        
        const actor = resolveActor(button, 'actorId');
        if (!actor) {
            ui.notifications.warn('Actor not found!');
            return;
        }
        
        const tg = actor.system.characteristics?.tg?.value || 0;
        const targetNumber = tg - penalty;
        
        const roll = await new Roll('1d100').evaluate();
        const success = roll.total <= targetNumber;
        
        let flavor = `<strong>Toxic Toughness Test</strong><br>Target: ${targetNumber} (TG ${tg} - ${penalty} penalty)<br>`;
        if (success) {
            flavor += '<strong style="color: green;">SUCCESS - No Additional Damage</strong>';
        } else {
            const toxicRoll = await new Roll('1d10').evaluate();
            const toxicDamage = toxicRoll.total;
            flavor += `<strong style="color: red;">FAILED - Takes ${toxicDamage} Impact Damage (ignores armor & TB)</strong>`;
            
            const currentWounds = actor.system.wounds.value || 0;
            await actor.update({ 'system.wounds.value': currentWounds + toxicDamage });
            
            await toxicRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: '<strong>Toxic Damage</strong>',
                rollMode: game.settings.get('core', 'rollMode')
            });
        }
        
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor,
            rollMode: game.settings.get('core', 'rollMode')
        });
    });
    
    html.find('.char-damage-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const formula = button.data('formula');
        const characteristic = button.data('characteristic');
        
        const actor = resolveActor(button, 'actorId');
        if (!actor) {
            ui.notifications.warn('Actor not found!');
            return;
        }
        
        const roll = await new Roll(formula).evaluate();
        const charDamage = roll.total;
        
        const currentDamage = actor.system.characteristics[characteristic]?.damage || 0;
        const newDamage = currentDamage + charDamage;
        
        await actor.update({ [`system.characteristics.${characteristic}.damage`]: newDamage });
        
        const charName = characteristic.toUpperCase();
        const flavor = `<strong>Characteristic Damage</strong><br><strong style="color: red;">${charName} takes ${charDamage} damage</strong><br>Total ${charName} Damage: ${newDamage}`;
        
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor,
            rollMode: game.settings.get('core', 'rollMode')
        });
    });
    
    html.find('.force-channel-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const attackerId = button.data('attackerId');
        const psyRating = parseInt(button.data('psyRating')) || 0;
        
        const attacker = game.actors.get(attackerId);
        const target = resolveActor(button);
        if (!attacker || !target) {
            ui.notifications.warn('Attacker or target actor not found!');
            return;
        }
        const targetId = button.data('targetId');
        
        const attackerWP = attacker.system.characteristics?.wil?.value || 0;
        const targetWP = target.system.characteristics?.wil?.value || 0;
        
        const attackerRoll = await new Roll('1d100').evaluate();
        const targetRoll = await new Roll('1d100').evaluate();
        
        const attackerDoS = attackerRoll.total <= attackerWP ? Math.floor((attackerWP - attackerRoll.total) / 10) + 1 : 0;
        const targetDoS = targetRoll.total <= targetWP ? Math.floor((targetWP - targetRoll.total) / 10) + 1 : 0;
        
        const attackerWins = attackerDoS > targetDoS;
        const netDoS = attackerDoS - targetDoS;
        
        let flavor = `<strong style="background: #4a0080; color: #e0b0ff; padding: 2px 6px; border-radius: 3px;">🔮 Force: Channel Psychic Energy 🔮</strong>`;
        flavor += `<br><strong>${attacker.name}</strong> WP ${attackerWP}: rolled ${attackerRoll.total} (${attackerDoS} DoS)`;
        flavor += `<br><strong>${target.name}</strong> WP ${targetWP}: rolled ${targetRoll.total} (${targetDoS} DoS)`;
        
        if (attackerWins && netDoS > 0) {
            const forceDamageFormula = `${netDoS}d10`;
            const forceDamageRoll = await new Roll(forceDamageFormula).evaluate();
            const forceDamage = forceDamageRoll.total;
            
            flavor += `<br><strong style="color: #9900cc;">SUCCESS (${netDoS} net DoS) - ${forceDamage} Energy Damage (ignores Armour & TB)</strong>`;
            
            const currentWounds = target.system.wounds.value || 0;
            const maxWounds = target.system.wounds.max || 0;
            const newWounds = currentWounds + forceDamage;
            await target.update({ 'system.wounds.value': newWounds });
            
            if (newWounds > maxWounds) {
                const criticalDamage = newWounds - maxWounds;
                flavor += `<br><strong style="color: darkred; font-size: 1.1em;">☠ CRITICAL DAMAGE: ${criticalDamage} ☠</strong>`;
                flavor += `<br><button class="roll-critical-btn" data-actor-id="${targetId}" data-location="Body" data-damage-type="Energy" data-critical-damage="${criticalDamage}">Apply Critical Effect</button>`;
            }
            
            await forceDamageRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: attacker }),
                flavor,
                rollMode: game.settings.get('core', 'rollMode')
            });
        } else {
            flavor += `<br><strong style="color: green;">FAILED - Target resists the psychic force</strong>`;
            
            await attackerRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: attacker }),
                flavor,
                rollMode: game.settings.get('core', 'rollMode')
            });
        }
    });
    
    html.find('.roll-critical-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const location = button.data('location');
        const damageType = button.data('damageType');
        
        const actor = resolveActor(button, 'actorId');
        if (!actor) {
            ui.notifications.warn('Actor not found!');
            return;
        }
        
        await CriticalEffectsHelper.applyCriticalEffect(actor, location, damageType);
    });
});


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
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
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
    // Reconstruct the drop data so that we can load the item.
    const dropData = {
        type: 'Item',
        uuid: itemUuid
    };
    // Load the item from the uuid.
    Item.fromDropData(dropData).then(item => {
        // Determine if the item loaded and if it's an owned item.
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
        }

        // Trigger the item roll
        item.roll();
    });
}