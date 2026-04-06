// Import document classes.
import { DeathwatchActor } from "./documents/actor.mjs";
import { DeathwatchItem } from "./documents/item.mjs";
// Import data models.
import * as models from './data/_module.mjs';
// Import sheet classes.
import { DeathwatchActorSheet } from "./sheets/actor-sheet.mjs";
import { DeathwatchActorSheetV2 } from "./sheets/actor-sheet-v2.mjs";
import { DeathwatchItemSheet } from "./sheets/item-sheet.mjs";
import { DeathwatchItemSheetV2 } from "./sheets/item-sheet-v2.mjs";
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
import { ModeHelper } from "./helpers/mode-helper.mjs";
// Import macros.
import { applyOnFireEffects } from "./macros/on-fire-effects.mjs";
import { flameAttack } from "./macros/flame-attack.mjs";
import { createItemMacro, rollItemMacro } from "./macros/hotbar.mjs";
// Import error handling utilities.
import { ErrorHandler } from "./helpers/error-handler.mjs";
import { Validation } from "./helpers/validation.mjs";
import { Sanitizer } from "./helpers/sanitizer.mjs";


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
        rollItemMacro,  // From macros/hotbar.mjs
        flameAttack,    // From macros/flame-attack.mjs
        applyOnFireEffects,  // From macros/on-fire-effects.mjs
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
                flavor: `${Sanitizer.escape(combatant.name)} rolls for Initiative!`
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
    game.settings.register('deathwatch', 'activeSquadAbilities', {
      name: 'Active Squad Mode Abilities',
      scope: 'world',
      config: false,
      type: Array,
      default: []
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
        const safeActorName = Sanitizer.escape(actor.name);
        foundry.applications.api.DialogV2.wait({
            window: { title: `\uD83D\uDD25 ${safeActorName} is On Fire!` },
            content: `<p><strong>${safeActorName}</strong> is On Fire! Apply fire damage and effects?</p>`,
            buttons: [
                { label: '\uD83D\uDD25 Apply Fire', action: 'apply', callback: () => applyOnFireEffects(actor) },
                { label: 'Skip', action: 'skip' }
            ]
        });
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

    // Add Kill-team Cohesion toggle to Token Controls toolbar
    Hooks.on('getSceneControlButtons', (controls) => {
        const tokenControls = controls.tokens;
        if (tokenControls?.tools) {
            tokenControls.tools.cohesionPanel = {
                name: 'cohesionPanel',
                title: 'Toggle Cohesion Panel',
                icon: 'fas fa-shield-alt',
                button: true,
                visible: true,
                onChange: () => CohesionPanel.toggle()
            };
        }
    });

    // Feature flag: V2 sheets
    game.settings.register('deathwatch', 'useV2Sheets', {
      name: 'Use ApplicationV2 Sheets (Experimental)',
      hint: 'Enable the new sheet architecture. Requires reload.',
      scope: 'client',
      config: true,
      type: Boolean,
      default: false,
      onChange: () => window.location.reload()
    });

    // Register sheet application classes
    const useV2 = game.settings.get('deathwatch', 'useV2Sheets');
    const ActorSheetClass = useV2 ? DeathwatchActorSheetV2 : DeathwatchActorSheet;
    const ItemSheetClass = useV2 ? DeathwatchItemSheetV2 : DeathwatchItemSheet;
    foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
    foundry.documents.collections.Actors.registerSheet("deathwatch", ActorSheetClass, { makeDefault: true });
    foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
    foundry.documents.collections.Items.registerSheet("deathwatch", ItemSheetClass, { makeDefault: true });
    initializeHandlebars();

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});

Hooks.once('ready', async function () {
    // Register socket for player-initiated world setting changes
    if (game.deathwatch) game.deathwatch.socket = `system.deathwatch`;

    // Re-render Cohesion panel when settings change; auto-drop Squad Mode on zero Cohesion
    Hooks.on('updateSetting', (setting) => {
        if (['deathwatch.cohesion', 'deathwatch.squadLeader', 'deathwatch.cohesionModifier', 'deathwatch.activeSquadAbilities'].includes(setting.key)) {
            const panel = CohesionPanel.getInstance();
            if (panel.rendered) panel.render(false);
        }
        if (setting.key === 'deathwatch.cohesion' && game.user.isGM) {
            const cohesion = game.settings.get('deathwatch', 'cohesion');
            if (cohesion.value <= 0) {
                CohesionPanel.dropAllToSoloMode();
            }
        }
    });

    // Re-render Cohesion panel when a character's mode changes
    Hooks.on('updateActor', (actor, changes) => {
        if (actor.type === 'character' && changes.system?.mode !== undefined) {
            const panel = CohesionPanel.getInstance();
            if (panel.rendered) panel.render(false);
        }
    });

    // Listen for socket messages (GM processes player requests)
    game.socket.on('system.deathwatch', async (data) => {
        if (data.type === 'activateSquadAbility' && game.user.isGM) {
            const actor = game.actors.get(data.actorId);
            const ability = actor?.items.get(data.abilityId);
            if (actor && ability) {
                await CohesionPanel.activateSquadAbility(actor, ability);
            }
        }
        if (data.type === 'deactivateSquadAbility' && game.user.isGM) {
            const active = game.settings.get('deathwatch', 'activeSquadAbilities') || [];
            if (data.index >= 0 && data.index < active.length) {
                const removed = active[data.index];
                active.splice(data.index, 1);
                await game.settings.set('deathwatch', 'activeSquadAbilities', active);
                await ChatMessage.create({ content: ModeHelper.buildDeactivationMessage(removed.abilityName) });
            }
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
 * Resolve an actor from button dataset. For unlinked tokens, resolves the
 * synthetic token actor so damage is applied to the token, not the base actor.
 * @param {HTMLElement} button - The clicked button element
 * @param {string} [actorIdAttr='targetId'] - Dataset attribute name for actor ID
 * @returns {Actor|null}
 */
function resolveActor(button, actorIdAttr = 'targetId') {
    const sceneId = button.dataset.sceneId;
    const tokenId = button.dataset.tokenId;
    if (sceneId && tokenId) {
        const tokenDoc = game.scenes.get(sceneId)?.tokens.get(tokenId);
        if (tokenDoc?.actor) return tokenDoc.actor;
    }
    const actorId = button.dataset[actorIdAttr];
    return actorId ? game.actors.get(actorId) : null;
}

Hooks.on('renderChatMessageHTML', (message, html) => {

    html.querySelectorAll('.apply-damage-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const d = button.dataset;

        // Validate and parse required fields
        const damage = Validation.requireInt(d.damage, 'Damage');
        const penetration = Validation.requireInt(d.penetration, 'Penetration');
        const location = d.location;
        const damageType = d.damageType || 'Impact';
        const isPrimitive = Validation.parseBoolean(d.isPrimitive);
        const isRazorSharp = Validation.parseBoolean(d.isRazorSharp);
        const degreesOfSuccess = parseInt(d.degreesOfSuccess) || 0;
        const isScatter = Validation.parseBoolean(d.isScatter);
        const isLongOrExtremeRange = Validation.parseBoolean(d.isLongOrExtremeRange);
        const isShocking = Validation.parseBoolean(d.isShocking);
        const isToxic = Validation.parseBoolean(d.isToxic);
        const isMeltaRange = Validation.parseBoolean(d.isMeltaRange);

        const charDamageFormula = d.charDamageFormula;
        const charDamageChar = d.charDamageChar;
        const charDamageName = d.charDamageName;
        const charDamageEffect = charDamageFormula ? { formula: charDamageFormula, characteristic: charDamageChar, name: charDamageName } : null;

        const isForce = Validation.parseBoolean(d.isForce);
        const forceAttackerId = d.forceAttackerId;
        const forcePsyRating = parseInt(d.forcePsyRating) || 0;
        const forceWeaponData = isForce ? { attackerId: forceAttackerId, psyRating: forcePsyRating } : null;

        const magnitudeBonusDamage = parseInt(d.magnitudeBonusDamage) || 0;
        const ignoresNaturalArmour = Validation.parseBoolean(d.ignoresNaturalArmour);
        const criticalDamageBonus = parseInt(d.criticalDamageBonus) || 0;

        const sceneId = d.sceneId;
        const tokenId = d.tokenId;
        const tokenInfo = (sceneId && tokenId) ? { sceneId, tokenId } : null;

        const targetActor = resolveActor(button);
        Validation.requireDocument(targetActor, 'Target Actor', 'Apply Damage');

        await CombatHelper.applyDamage(targetActor, { damage, penetration, location, damageType, felling: 0, isPrimitive, isRazorSharp, degreesOfSuccess, isScatter, isLongOrExtremeRange, isShocking, isToxic, isMeltaRange, charDamageEffect, forceWeaponData, tokenInfo, magnitudeBonusDamage, ignoresNaturalArmour, criticalDamageBonus });

        const weaponQualitiesRaw = d.weaponQualities;
        const weaponQualities = weaponQualitiesRaw ? (typeof weaponQualitiesRaw === 'string' ? Validation.parseJSON(weaponQualitiesRaw, 'Weapon Qualities') : weaponQualitiesRaw) : [];
        if (targetActor.type === 'character' && CohesionHelper.shouldTriggerCohesionDamage(damage, weaponQualities)) {
            await CohesionHelper.handleCohesionDamage(`${Sanitizer.escape(targetActor.name)} took ${damage} raw damage from a qualifying weapon.`);
        }
    }, 'Apply Damage')));
    
    html.querySelectorAll('.shocking-test-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const armorValue = Validation.requireInt(button.dataset.armorValue, 'Armor Value');
        const stunRounds = Validation.requireInt(button.dataset.stunRounds, 'Stun Rounds');

        const actor = resolveActor(button, 'actorId');
        Validation.requireDocument(actor, 'Actor', 'Shocking Test');

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
    }, 'Shocking Test')));
    
    html.querySelectorAll('.toxic-test-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const penalty = Validation.requireInt(button.dataset.penalty, 'Penalty');

        const actor = resolveActor(button, 'actorId');
        Validation.requireDocument(actor, 'Actor', 'Toxic Test');

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
    }, 'Toxic Test')));

    html.querySelectorAll('.char-damage-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const formula = button.dataset.formula;
        const characteristic = button.dataset.characteristic;

        const actor = resolveActor(button, 'actorId');
        Validation.requireDocument(actor, 'Actor', 'Characteristic Damage');

        if (!formula) {
            throw new Error('Damage formula not provided');
        }
        if (!characteristic) {
            throw new Error('Characteristic not provided');
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
    }, 'Characteristic Damage')));
    
    html.querySelectorAll('.force-channel-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const attackerId = button.dataset.attackerId;
        const psyRating = Validation.requireInt(button.dataset.psyRating, 'Psy Rating');

        const attacker = Validation.requireActor(attackerId, 'Force Channel');
        const target = resolveActor(button);
        Validation.requireDocument(target, 'Target Actor', 'Force Channel');
        const targetId = button.dataset.targetId;
        
        const attackerWP = attacker.system.characteristics?.wil?.value || 0;
        const targetWP = target.system.characteristics?.wil?.value || 0;
        
        const attackerRoll = await new Roll('1d100').evaluate();
        const targetRoll = await new Roll('1d100').evaluate();
        
        const attackerDoS = attackerRoll.total <= attackerWP ? Math.floor((attackerWP - attackerRoll.total) / 10) + 1 : 0;
        const targetDoS = targetRoll.total <= targetWP ? Math.floor((targetWP - targetRoll.total) / 10) + 1 : 0;
        
        const attackerWins = attackerDoS > targetDoS;
        const netDoS = attackerDoS - targetDoS;

        const safeAttackerName = Sanitizer.escape(attacker.name);
        const safeTargetName = Sanitizer.escape(target.name);
        let flavor = `<strong style="background: #4a0080; color: #e0b0ff; padding: 2px 6px; border-radius: 3px;">🔮 Force: Channel Psychic Energy 🔮</strong>`;
        flavor += `<br><strong>${safeAttackerName}</strong> WP ${attackerWP}: rolled ${attackerRoll.total} (${attackerDoS} DoS)`;
        flavor += `<br><strong>${safeTargetName}</strong> WP ${targetWP}: rolled ${targetRoll.total} (${targetDoS} DoS)`;
        
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
    }, 'Force Channel')));

    html.querySelectorAll('.roll-critical-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const location = button.dataset.location;
        const damageType = button.dataset.damageType;

        const actor = resolveActor(button, 'actorId');
        Validation.requireDocument(actor, 'Actor', 'Roll Critical');

        await CriticalEffectsHelper.applyCriticalEffect(actor, location, damageType);
    }, 'Roll Critical')));

    html.querySelectorAll('.cohesion-rally-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const leaderId = button.dataset.leaderId;
        const leader = Validation.requireActor(leaderId, 'Rally Test');

        const commandTotal = leader.system.skills?.command?.total || 0;
        const fsValue = leader.system.characteristics?.fs?.value || 0;
        const targetNumber = Math.max(commandTotal, fsValue);

        const roll = await new Roll('1d100').evaluate();
        const success = CohesionHelper.resolveRallyTest(targetNumber, roll.total);

        const safeLeaderName = Sanitizer.escape(leader.name);
        if (success) {
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: leader }),
                flavor: `<strong>\uD83D\uDEE1 Rally Successful!</strong><br>${safeLeaderName} rallies the Kill-team! (Rolled ${roll.total} vs ${targetNumber})<br>Cohesion damage negated.`
            });
        } else {
            await CohesionHelper.applyCohesionDamage(1);
            const cohesion = game.settings.get('deathwatch', 'cohesion');
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: leader }),
                flavor: `<strong>\u26A0 Rally Failed!</strong><br>${safeLeaderName} fails to rally! (Rolled ${roll.total} vs ${targetNumber})<br>Kill-team loses 1 Cohesion. Now ${cohesion.value} / ${cohesion.max}`
            });
        }
    }, 'Rally Test')));

    html.querySelectorAll('.cohesion-damage-accept-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async () => {
        await CohesionHelper.applyCohesionDamage(1);
        const cohesion = game.settings.get('deathwatch', 'cohesion');
        await ChatMessage.create({
            content: `<div class="cohesion-chat"><strong>\u26A0 Cohesion Lost</strong> \u2014 Kill-team loses 1 Cohesion. Now ${cohesion.value} / ${cohesion.max}</div>`
        });
    }, 'Accept Cohesion Damage')));

    html.querySelectorAll('.extinguish-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const actor = resolveActor(button, 'actorId');
        Validation.requireDocument(actor, 'Actor', 'Extinguish Test');

        const ag = actor.system.characteristics?.ag?.value || 0;
        const safeActorName = Sanitizer.escape(actor.name);
        const content = `
          <div style="margin-bottom: 8px;"><strong>Extinguish Attempt: ${safeActorName}</strong></div>
          <div class="form-group">
            <label>AG: ${ag} | Base Target: ${ag - 20} (Hard \u221220)</label>
          </div>
          <div class="form-group">
            <label>Misc Modifier:</label>
            <input type="number" id="extinguishMod" value="0" style="width: 60px;" />
          </div>
        `;

        foundry.applications.api.DialogV2.wait({
            window: { title: `\uD83D\uDD25 Extinguish: ${safeActorName}` },
            content,
            buttons: [
                {
                    label: 'Roll', action: 'roll',
                    callback: async (event, button, dialog) => {
                        const miscMod = parseInt(dialog.element.querySelector('#extinguishMod').value) || 0;
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
                { label: 'Cancel', action: 'cancel' }
            ]
        });
    }, 'Extinguish Test')));

    html.querySelectorAll('.psychic-oppose-btn').forEach(btn => btn.addEventListener('click', ErrorHandler.wrap(async (ev) => {
        const button = ev.currentTarget;
        const powerName = button.dataset.powerName;
        const psykerDoS = Validation.requireInt(button.dataset.psykerDos, 'Psyker DoS');
        const targetName = button.dataset.targetName || 'Target';
        const targetWP = Validation.requireInt(button.dataset.targetWp, 'Target WP');
        const targetId = button.dataset.targetId;
        const sceneId = button.dataset.sceneId;
        const tokenId = button.dataset.tokenId;

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

        foundry.applications.api.DialogV2.wait({
            window: { title: `Opposed Test: ${powerName}` },
            content,
            buttons: [
                {
                    label: "Resolve", action: "resolve",
                    callback: async (event, button, dialog) => {
                        const el = dialog.element;
                        const wp = parseInt(el.querySelector('#opposeTargetWP').value) || 0;
                        const miscMod = parseInt(el.querySelector('#opposeMiscMod').value) || 0;
                        const manualRoll = el.querySelector('#opposeManualRoll').value;

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
                { label: "Cancel", action: "cancel" }
            ]
        });
    }, 'Psychic Oppose Test')));
});