// Import document classes.
import { DeathwatchActor } from "./documents/actor.mjs";
import { DeathwatchItem } from "./documents/item.mjs";
// Import data models.
import * as models from './data/_module.mjs';
// Import sheet classes.
import { DeathwatchActorSheet } from "./sheets/actor-sheet.mjs";
import { DeathwatchItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/ui/templates.mjs";
import { DWConfig } from "./helpers/config.mjs";
import { initializeHandlebars } from "./helpers/ui/handlebars.js";
import { CombatHelper } from "./helpers/combat/combat.mjs";
import { PsychicCombatHelper } from "./helpers/combat/psychic-combat.mjs";
import { CriticalEffectsHelper } from "./helpers/combat/critical-effects.mjs";
import { InitiativeHelper } from "./helpers/initiative.mjs";
import { SkillLoader } from "./helpers/character/skill-loader.mjs";
import { DW_STATUS_EFFECTS } from "./helpers/status-effects.mjs";
import { FireHelper } from "./helpers/combat/fire-helper.mjs";
import { CohesionHelper } from "./helpers/cohesion.mjs";
import { CohesionPanel } from "./ui/cohesion-panel.mjs";


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
        rollItemMacro,
        flameAttack,
        applyOnFireEffects,
        CohesionHelper,
        CohesionPanel
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

    // Register Cohesion world settings
    game.settings.register('deathwatch', 'cohesion', {
      name: 'Kill-team Cohesion',
      scope: 'world',
      config: false,
      type: Object,
      default: { value: 0, max: 0 }
    });
    game.settings.register('deathwatch', 'squadLeader', {
      name: 'Squad Leader Actor ID',
      scope: 'world',
      config: false,
      type: String,
      default: ''
    });
    game.settings.register('deathwatch', 'cohesionModifier', {
      name: 'Cohesion GM Modifier',
      scope: 'world',
      config: false,
      type: Number,
      default: 0
    });
    game.settings.register('deathwatch', 'cohesionDamageThisRound', {
      name: 'Cohesion Damage This Round',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false
    });

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

    // Check for On Fire condition when combat turn advances
    Hooks.on('updateCombat', async (combat, changed) => {
        if (!game.user.isGM) return;
        if (!("turn" in changed) && !("round" in changed)) return;

        // Reset Cohesion damage cap on new round
        if ("round" in changed) {
            game.settings.set('deathwatch', 'cohesionDamageThisRound', false);
        }

        const combatant = combat.combatants.get(combat.current.combatantId);
        if (!combatant?.actor?.hasCondition?.('on-fire')) return;

        const actor = combatant.actor;
        new Dialog({
            title: `\uD83D\uDD25 ${actor.name} is On Fire!`,
            content: `<p><strong>${actor.name}</strong> is On Fire! Apply fire damage and effects?</p>`,
            buttons: {
                apply: {
                    label: '\uD83D\uDD25 Apply Fire',
                    callback: () => applyOnFireEffects(actor)
                },
                skip: { label: 'Skip' }
            },
            default: 'apply'
        }).render(true);
    });

    // Auto-assign enemy/horde actors to an "Enemies" folder
    Hooks.on('createActor', async (actor, options, userId) => {
        if (game.user.id !== userId) return;
        if (actor.type !== 'enemy' && actor.type !== 'horde') return;
        if (actor.folder) return;

        let folder = game.folders.find(f => f.type === 'Actor' && f.name === 'Enemies');
        if (!folder) {
            folder = await Folder.create({ name: 'Enemies', type: 'Actor', parent: null });
        }
        if (folder) await actor.update({ folder: folder.id });
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
    // Render Cohesion panel
    CohesionPanel.getInstance().render(true);

    // Re-render Cohesion panel when settings change
    Hooks.on('updateSetting', (setting) => {
        if (['deathwatch.cohesion', 'deathwatch.squadLeader', 'deathwatch.cohesionModifier'].includes(setting.key)) {
            CohesionPanel.getInstance().render(false);
        }
    });

    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => {
        if (data.type === "Item") {
            createItemMacro(data, slot);
            return false;
        }
    });

    // Set Skip Defeated default on first load (respects manual changes after)
    if (game.user.isGM) {
        const config = game.settings.get("core", "combatTrackerConfig") || {};
        if (config.skipDefeated === undefined) {
            game.settings.set("core", "combatTrackerConfig", { ...config, skipDefeated: true });
        }

        // Auto-create Flame Attack macro for GM
        const flameMacroCommand = 'game.deathwatch.flameAttack();';
        const existingFlame = game.macros.find(m => m.name === '🔥 Flame Attack' && m.command === flameMacroCommand);
        if (!existingFlame) {
            await Macro.create({
                name: '🔥 Flame Attack',
                type: 'script',
                img: 'icons/svg/fire.svg',
                command: flameMacroCommand,
                flags: { 'deathwatch.systemMacro': true }
            });
        }
        // Auto-create On Fire macro for GM
        const onFireMacroCommand = 'const t = game.user.targets.first()?.actor; if (t) game.deathwatch.applyOnFireEffects(t); else ui.notifications.warn("Target a token first.");';
        const existingOnFire = game.macros.find(m => m.name === '\uD83D\uDD25 On Fire Round' && m.flags?.deathwatch?.systemMacro);
        if (!existingOnFire) {
            await Macro.create({
                name: '\uD83D\uDD25 On Fire Round',
                type: 'script',
                img: 'icons/svg/fire.svg',
                command: onFireMacroCommand,
                flags: { 'deathwatch.systemMacro': true }
            });
        }
    }
});

/**
 * Resolve an actor from button data. For unlinked tokens, resolves the
 * synthetic token actor so damage is applied to the token, not the base actor.
 * @param {jQuery} button - The clicked button element
 * @param {string} [actorIdAttr='targetId'] - Data attribute name for actor ID
 * @returns {Actor|null}
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

Hooks.on('renderChatMessage', (message, html) => {

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
        const ignoresNaturalArmour = button.data('ignoresNaturalArmour') === 'true' || button.data('ignoresNaturalArmour') === true;
        
        const sceneId = button.data('sceneId');
        const tokenId = button.data('tokenId');
        const tokenInfo = (sceneId && tokenId) ? { sceneId, tokenId } : null;
        
        const targetActor = resolveActor(button);
        if (!targetActor) {
            ui.notifications.warn('Target actor not found!');
            return;
        }
        
        await CombatHelper.applyDamage(targetActor, { damage, penetration, location, damageType, felling: 0, isPrimitive, isRazorSharp, degreesOfSuccess, isScatter, isLongOrExtremeRange, isShocking, isToxic, isMeltaRange, charDamageEffect, forceWeaponData, tokenInfo, magnitudeBonusDamage, ignoresNaturalArmour });

        // Check for Cohesion damage trigger (10+ raw damage from Accurate/Blast/Devastating)
        const weaponQualitiesRaw = button.data('weaponQualities');
        const weaponQualities = weaponQualitiesRaw ? (typeof weaponQualitiesRaw === 'string' ? JSON.parse(weaponQualitiesRaw) : weaponQualitiesRaw) : [];
        if (targetActor.type === 'character' && CohesionHelper.shouldTriggerCohesionDamage(damage, weaponQualities)) {
            await CohesionHelper.handleCohesionDamage(`${targetActor.name} took ${damage} raw damage from a qualifying weapon.`);
        }
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

    html.find('.cohesion-rally-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const leaderId = button.data('leaderId');
        const leader = leaderId ? game.actors.get(leaderId) : null;
        if (!leader) {
            ui.notifications.warn('Squad leader not found!');
            return;
        }

        const commandTotal = leader.system.skills?.command?.total || 0;
        const fsValue = leader.system.characteristics?.fs?.value || 0;
        const targetNumber = Math.max(commandTotal, fsValue);

        const roll = await new Roll('1d100').evaluate();
        const success = CohesionHelper.resolveRallyTest(targetNumber, roll.total);

        if (success) {
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: leader }),
                flavor: `<strong>\uD83D\uDEE1 Rally Successful!</strong><br>${leader.name} rallies the Kill-team! (Rolled ${roll.total} vs ${targetNumber})<br>Cohesion damage negated.`
            });
        } else {
            await CohesionHelper.applyCohesionDamage(1);
            const cohesion = game.settings.get('deathwatch', 'cohesion');
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: leader }),
                flavor: `<strong>\u26A0 Rally Failed!</strong><br>${leader.name} fails to rally! (Rolled ${roll.total} vs ${targetNumber})<br>Kill-team loses 1 Cohesion. Now ${cohesion.value} / ${cohesion.max}`
            });
        }
    });

    html.find('.cohesion-damage-accept-btn').click(async () => {
        await CohesionHelper.applyCohesionDamage(1);
        const cohesion = game.settings.get('deathwatch', 'cohesion');
        await ChatMessage.create({
            content: `<div class="cohesion-chat"><strong>\u26A0 Cohesion Lost</strong> \u2014 Kill-team loses 1 Cohesion. Now ${cohesion.value} / ${cohesion.max}</div>`
        });
    });

    html.find('.extinguish-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const actor = resolveActor(button, 'actorId');
        if (!actor) {
            ui.notifications.warn('Actor not found!');
            return;
        }

        const ag = actor.system.characteristics?.ag?.value || 0;
        const content = `
          <div style="margin-bottom: 8px;"><strong>Extinguish Attempt: ${actor.name}</strong></div>
          <div class="form-group">
            <label>AG: ${ag} | Base Target: ${ag - 20} (Hard \u221220)</label>
          </div>
          <div class="form-group">
            <label>Misc Modifier:</label>
            <input type="number" id="extinguishMod" value="0" style="width: 60px;" />
          </div>
        `;

        new Dialog({
            title: `\uD83D\uDD25 Extinguish: ${actor.name}`,
            content,
            buttons: {
                roll: {
                    label: 'Roll',
                    callback: async (html) => {
                        const miscMod = parseInt(html.find('#extinguishMod').val()) || 0;
                        const roll = await new Roll('1d100').evaluate();
                        const result = FireHelper.resolveExtinguishTest(ag, roll.total, miscMod);
                        const flavor = FireHelper.buildExtinguishFlavor(actor.name, ag, roll.total, result, miscMod);

                        if (result.success) {
                            await actor.setCondition('on-fire', false);
                        }

                        await roll.toMessage({
                            speaker: ChatMessage.getSpeaker({ actor }),
                            flavor,
                            rollMode: game.settings.get('core', 'rollMode')
                        });
                    }
                },
                cancel: { label: 'Cancel' }
            },
            default: 'roll'
        }).render(true);
    });

    html.find('.psychic-oppose-btn').click(async (ev) => {
        const button = $(ev.currentTarget);
        const powerName = button.data('powerName');
        const psykerDoS = parseInt(button.data('psykerDos')) || 0;
        const targetName = button.data('targetName') || 'Target';
        const targetWP = parseInt(button.data('targetWp')) || 0;
        const targetId = button.data('targetId');
        const sceneId = button.data('sceneId');
        const tokenId = button.data('tokenId');

        const target = (sceneId && tokenId)
            ? game.scenes.get(sceneId)?.tokens.get(tokenId)?.actor
            : (targetId ? game.actors.get(targetId) : null);

        const content = `
          <div style="margin-bottom: 8px;"><strong>Opposed Willpower Test: ${targetName}</strong></div>
          <div class="form-group">
            <label>Target WP:</label>
            <input type="number" id="opposeTargetWP" value="${targetWP}" style="width: 60px;" />
          </div>
          <div class="form-group">
            <label>Misc Modifier:</label>
            <input type="number" id="opposeMiscMod" value="0" style="width: 60px;" />
          </div>
          <div class="form-group">
            <label>Manual Roll (leave blank to auto-roll):</label>
            <input type="number" id="opposeManualRoll" min="1" max="100" placeholder="Auto" style="width: 60px;" />
          </div>
        `;

        new Dialog({
            title: `Opposed Test: ${powerName}`,
            content,
            buttons: {
                resolve: {
                    label: "Resolve",
                    callback: async (html) => {
                        const wp = parseInt(html.find('#opposeTargetWP').val()) || 0;
                        const miscMod = parseInt(html.find('#opposeMiscMod').val()) || 0;
                        const manualRoll = html.find('#opposeManualRoll').val();

                        let targetRoll;
                        let rollObj = null;
                        if (manualRoll && manualRoll.trim() !== '') {
                            targetRoll = parseInt(manualRoll);
                        } else {
                            rollObj = await new Roll('1d100').evaluate();
                            targetRoll = rollObj.total;
                        }

                        const result = PsychicCombatHelper.resolveOpposedTest(psykerDoS, wp, targetRoll, miscMod);
                        const msg = PsychicCombatHelper.buildOpposedResultMessage(targetName, wp, targetRoll, result, powerName, psykerDoS);

                        if (rollObj) {
                            await rollObj.toMessage({
                                speaker: ChatMessage.getSpeaker({ actor: target }),
                                flavor: msg,
                                rollMode: game.settings.get('core', 'rollMode')
                            });
                        } else {
                            await ChatMessage.create({
                                content: msg + `<br><em>(Manual roll: ${targetRoll})</em>`,
                                speaker: ChatMessage.getSpeaker({ actor: target })
                            });
                        }
                    }
                },
                cancel: { label: "Cancel" }
            },
            default: "resolve"
        }).render(true);
    });
});


/* -------------------------------------------- */
/*  On Fire Effects                             */
/* -------------------------------------------- */

/**
 * Apply On Fire effects to an actor: 1d10 Energy damage (ignores armor),
 * +1 Fatigue, Willpower test to act normally, and extinguish button.
 * @param {Object} actor - Actor document
 */
async function applyOnFireEffects(actor) {
    const name = actor.name;
    const speaker = ChatMessage.getSpeaker({ actor });

    // Resolve token info for unlinked token support
    const token = actor.getActiveTokens?.()?.[0];
    const sceneId = token?.document?.parent?.id || '';
    const tokenId = token?.document?.id || '';

    // 1d10 Energy damage to Body (ignores armor)
    const damageRoll = await new Roll('1d10').evaluate();
    const damage = damageRoll.total;
    const currentWounds = actor.system.wounds?.value || 0;
    const maxWounds = actor.system.wounds?.max || 0;
    await actor.update({ 'system.wounds.value': currentWounds + damage });

    // +1 Fatigue
    const currentFatigue = actor.system.fatigue?.value || 0;
    const newFatigue = currentFatigue + 1;
    await actor.update({ 'system.fatigue.value': newFatigue });

    // Willpower test
    const wp = actor.system.characteristics?.wil?.value || 0;
    let wpResult;
    if (FireHelper.hasPowerArmor(actor)) {
        wpResult = { autoPass: true };
    } else {
        const wpRoll = await new Roll('1d100').evaluate();
        wpResult = { roll: wpRoll.total, success: wpRoll.total <= wp, wp };
    }

    const content = FireHelper.buildOnFireMessage(name, damage, currentWounds, maxWounds, newFatigue, wpResult, actor.id, sceneId, tokenId);
    await ChatMessage.create({ content, speaker });
}

/* -------------------------------------------- */
/*  Flame Attack Macro                          */
/* -------------------------------------------- */

/**
 * GM macro for flame weapon attacks. Opens a dialog for damage/pen,
 * GM targets a token and clicks Burn. Applies damage, rolls catch fire
 * Agility test, and applies On Fire status if failed.
 */
async function flameAttack() {
    const content = `
      <div class="form-group">
        <label>Damage:</label>
        <input type="text" id="flameDamage" placeholder="e.g., 1d10+4" />
      </div>
      <div class="form-group">
        <label>Penetration:</label>
        <input type="number" id="flamePen" value="0" />
      </div>
      <div class="form-group">
        <label>Damage Type:</label>
        <input type="text" id="flameDmgType" value="Energy" />
      </div>
      <div class="form-group">
        <label>Weapon Range (m):</label>
        <input type="number" id="flameRange" value="20" min="1" />
      </div>
    `;

    new Dialog({
        title: '\uD83D\uDD25 Flame Attack',
        content,
        buttons: {
            burn: {
                label: '\uD83D\uDD25 Burn',
                callback: async (html) => {
                    const damageFormula = html.find('#flameDamage').val()?.trim();
                    if (!damageFormula) {
                        ui.notifications.warn('Enter a damage formula.');
                        return;
                    }
                    const penetration = parseInt(html.find('#flamePen').val()) || 0;
                    const damageType = html.find('#flameDmgType').val()?.trim() || 'Energy';
                    const weaponRange = parseInt(html.find('#flameRange').val()) || 20;

                    const targetToken = game.user.targets.first();
                    if (!targetToken?.actor) {
                        ui.notifications.warn('Target a token before clicking Burn.');
                        return;
                    }
                    const targetActor = targetToken.actor;
                    const targetName = targetActor.name;
                    const isHorde = targetActor.type === 'horde';

                    if (isHorde) {
                        // Horde: ceil(range/4) + 1d5 hits, each rolled separately
                        const staticHits = Math.ceil(weaponRange / 4);
                        const flameRoll = await new Roll('1d5').evaluate();
                        const totalHits = staticHits + flameRoll.total;

                        await flameRoll.toMessage({
                            speaker: ChatMessage.getSpeaker(),
                            flavor: `<strong>\uD83D\uDD25 Flame vs Horde: ${targetName}</strong><br>Hits: ${staticHits} (range ${weaponRange}/4) + ${flameRoll.total} (1d5) = <strong>${totalHits} hits</strong>`
                        });

                        const hordeHitResults = [];
                        for (let i = 0; i < totalHits; i++) {
                            const roll = await new Roll(damageFormula).evaluate();
                            hordeHitResults.push({ damage: roll.total, penetration, location: 'Body', damageType });
                        }
                        await targetActor.system.receiveBatchDamage(hordeHitResults);
                    } else {
                        // Individual target: Agility dodge test first
                        const ag = targetActor.system.characteristics?.ag?.value || 0;

                        const dodgeContent = `
                          <div style="margin-bottom: 8px;"><strong>\uD83D\uDD25 Dodge Flame: ${targetName}</strong></div>
                          <div class="form-group">
                            <label>AG: ${ag}</label>
                          </div>
                          <div class="form-group">
                            <label>Misc Modifier:</label>
                            <input type="number" id="dodgeMod" value="0" style="width: 60px;" />
                          </div>
                        `;

                        new Dialog({
                            title: `\uD83D\uDD25 Dodge Flame: ${targetName}`,
                            content: dodgeContent,
                            buttons: {
                                roll: {
                                    label: 'Roll Dodge',
                                    callback: async (dodgeHtml) => {
                                        const dodgeMod = parseInt(dodgeHtml.find('#dodgeMod').val()) || 0;
                                        const dodgeRoll = await new Roll('1d100').evaluate();
                                        const dodgeResult = FireHelper.resolveDodgeFlameTest(ag, dodgeRoll.total, dodgeMod);
                                        const dodgeFlavor = FireHelper.buildDodgeFlameFlavor(targetName, ag, dodgeResult, dodgeMod);

                                        await dodgeRoll.toMessage({
                                            speaker: ChatMessage.getSpeaker({ actor: targetActor }),
                                            flavor: dodgeFlavor,
                                            rollMode: game.settings.get('core', 'rollMode')
                                        });

                                        if (!dodgeResult.success) {
                                            // Apply damage
                                            const damageRoll = await new Roll(damageFormula).evaluate();
                                            const damage = damageRoll.total;
                                            const locRoll = await new Roll('1d100').evaluate();
                                            const location = CombatHelper.determineHitLocation(locRoll.total);

                                            await CombatHelper.applyDamage(targetActor, {
                                                damage, penetration, location, damageType,
                                                felling: 0, isPrimitive: false, isRazorSharp: false,
                                                degreesOfSuccess: 0, isScatter: false, isLongOrExtremeRange: false,
                                                isShocking: false, isToxic: false, isMeltaRange: false
                                            });

                                            // Catch Fire test
                                            const catchFireRoll = await new Roll('1d100').evaluate();
                                            const catchResult = FireHelper.resolveCatchFireTest(ag, catchFireRoll.total);
                                            const catchFlavor = FireHelper.buildCatchFireFlavor(targetName, ag, catchResult);

                                            if (!catchResult.success) {
                                                await targetActor.setCondition('on-fire', true);
                                            }

                                            await catchFireRoll.toMessage({
                                                speaker: ChatMessage.getSpeaker({ actor: targetActor }),
                                                flavor: catchFlavor,
                                                rollMode: game.settings.get('core', 'rollMode')
                                            });
                                        }
                                    }
                                },
                                cancel: { label: 'Cancel' }
                            },
                            default: 'roll'
                        }).render(true);
                    }
                }
            },
            cancel: { label: 'Cancel' }
        },
        default: 'burn'
    }).render(true);
}

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
 * Execute a macro for an owned item. Weapons show Attack/Damage dialog,
 * psychic powers open Focus Power Test, other items use generic roll.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
    const dropData = { type: 'Item', uuid: itemUuid };
    Item.fromDropData(dropData).then(item => {
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
        }

        if (item.type === 'weapon') {
            new Dialog({
                title: item.name,
                content: `<p style="text-align: center;"><img src="${item.img}" width="50" height="50" style="border: none;" /><br><strong>${item.name}</strong></p>`,
                buttons: {
                    attack: {
                        icon: '<i class="fas fa-crosshairs"></i>',
                        label: "Attack",
                        callback: () => CombatHelper.weaponAttackDialog(item.parent, item)
                    },
                    damage: {
                        icon: '<i class="fas fa-burst"></i>',
                        label: "Damage",
                        callback: () => CombatHelper.weaponDamageRoll(item.parent, item)
                    }
                },
                default: "attack"
            }).render(true);
            return;
        }

        if (item.type === 'psychic-power') {
            PsychicCombatHelper.focusPowerDialog(item.parent, item);
            return;
        }

        item.roll();
    });
}