import { CohesionHelper } from "../helpers/cohesion.mjs";
import { ModeHelper } from "../helpers/mode-helper.mjs";
import { MODES } from "../helpers/constants.mjs";

/**
 * Floating HUD panel displaying Kill-team Cohesion.
 * Singleton — one instance shared across the session.
 * Uses popOut: true for proper Foundry window management.
 * @extends {Application}
 */
export class CohesionPanel extends Application {
  static _instance = null;

  static getInstance() {
    if (!CohesionPanel._instance) {
      CohesionPanel._instance = new CohesionPanel();
    }
    return CohesionPanel._instance;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'cohesion-panel',
      title: '⚔ Kill-team Cohesion',
      template: 'systems/deathwatch/templates/ui/cohesion-panel.html',
      popOut: true,
      width: 220,
      height: 'auto',
      minimizable: false,
      resizable: false,
      classes: ['cohesion-panel']
    });
  }

  /** After render, position at top center on first open only. */
  async _render(...args) {
    const firstRender = !this._element?.length;
    await super._render(...args);
    if (firstRender) {
      const left = Math.round((window.innerWidth - 220) / 2);
      super.setPosition({ left, top: 10 });
    }
  }

  getData() {
    const cohesion = game.settings.get('deathwatch', 'cohesion');
    const leaderId = game.settings.get('deathwatch', 'squadLeader');
    const leader = leaderId ? game.actors.get(leaderId) : null;
    const gmMod = game.settings.get('deathwatch', 'cohesionModifier');
    const activeAbilities = game.settings.get('deathwatch', 'activeSquadAbilities') || [];

    const characters = game.actors
      .filter(a => a.type === 'character')
      .map(a => ({
        id: a.id,
        name: a.name,
        mode: a.system.mode || MODES.SOLO,
        canToggle: game.user.isGM || a.isOwner
      }));

    return {
      value: cohesion.value,
      max: cohesion.max,
      leaderName: leader?.name || 'None',
      isGM: game.user.isGM,
      breakdown: CohesionHelper.buildCohesionBreakdown(leader, gmMod),
      characters,
      activeAbilities
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.cohesion-recover').click(() => CohesionHelper.recoverCohesion(1));
    html.find('.cohesion-lose').click(() => this._adjustCohesion(-1));
    html.find('.cohesion-recalculate').click(() => this._onRecalculate());
    html.find('.cohesion-edit').click(() => this._onEdit());
    html.find('.cohesion-set-leader').click(() => this._onSetLeader());
    html.find('.cohesion-challenge-btn').click(() => this._onCohesionChallenge());
    html.find('.mode-toggle').click(ev => this._onToggleMode(ev));
    html.find('.squad-ability-deactivate').click(ev => this._onDeactivateAbility(ev));
  }

  /**
   * Toggle the panel open/closed.
   */
  static toggle() {
    const panel = CohesionPanel.getInstance();
    if (panel.rendered) {
      panel.close();
    } else {
      panel.render(true);
    }
  }

  /* -------------------------------------------- */
  /*  Mode Toggle                                 */
  /* -------------------------------------------- */

  async _onToggleMode(ev) {
    if (!game.ready) return;
    const actorId = $(ev.currentTarget).data('actorId');
    const actor = game.actors.get(actorId);
    if (!actor || !(actor instanceof Actor)) return;

    const currentMode = actor.system.mode || MODES.SOLO;
    const newMode = currentMode === MODES.SOLO ? MODES.SQUAD : MODES.SOLO;

    if (newMode === MODES.SQUAD) {
      const cohesion = game.settings.get('deathwatch', 'cohesion');
      if (!ModeHelper.canEnterSquadMode(cohesion.value)) {
        ui.notifications.warn('Cannot enter Squad Mode — Cohesion is 0.');
        return;
      }
    }

    // Deactivate sustained abilities when leaving Squad Mode
    if (newMode === MODES.SOLO) {
      await CohesionPanel.deactivateAbilitiesForActor(actorId);
    }

    await actor.update({ 'system.mode': newMode });
    await ChatMessage.create({ content: ModeHelper.buildModeChangeMessage(actor.name, newMode) });
    this.render(false);
  }

  /**
   * Force all characters in Squad Mode back to Solo Mode.
   * Called when Cohesion reaches 0. Also deactivates all sustained abilities.
   */
  static async dropAllToSoloMode() {
    if (!game.ready) return;
    const squadCharacters = game.actors.filter(a => a.type === 'character' && a.system.mode === MODES.SQUAD);
    if (!squadCharacters.length) return;

    for (const actor of squadCharacters) {
      await actor.update({ 'system.mode': MODES.SOLO });
    }

    // Deactivate all sustained abilities
    await game.settings.set('deathwatch', 'activeSquadAbilities', []);

    await ChatMessage.create({ content: ModeHelper.buildCohesionDepletedMessage() });
  }

  /* -------------------------------------------- */
  /*  Cohesion Adjustments                        */
  /* -------------------------------------------- */

  /**
   * Activate a Squad Mode ability: validate, deduct Cohesion, track if sustained.
   * @param {Actor} actor
   * @param {Item} ability
   */
  static async activateSquadAbility(actor, ability) {
    const sys = ability.system;
    const cohesion = game.settings.get('deathwatch', 'cohesion');
    const check = ModeHelper.canActivateSquadAbility(actor.system.mode || MODES.SOLO, cohesion.value, sys.cohesionCost);
    if (!check.allowed) {
      ui.notifications.warn(check.reason);
      return;
    }

    // Block any activation if already sustaining
    const active = game.settings.get('deathwatch', 'activeSquadAbilities') || [];
    if (ModeHelper.isSustainingAbility(active, actor.id)) {
      ui.notifications.warn(`${actor.name} is already sustaining a Squad Mode ability. Deactivate it first.`);
      return;
    }

    // Deduct Cohesion
    const newValue = cohesion.value - sys.cohesionCost;
    await game.settings.set('deathwatch', 'cohesion', { ...cohesion, value: newValue });

    // Track sustained ability
    if (sys.sustained) {
      active.push({
        abilityId: ability.id,
        abilityName: ability.name,
        initiatorId: actor.id,
        initiatorName: actor.name,
        sustained: true
      });
      await game.settings.set('deathwatch', 'activeSquadAbilities', active);
    }

    await ChatMessage.create({
      content: ModeHelper.buildSquadActivationMessage(
        actor.name, ability.name, sys.cohesionCost, newValue, cohesion.max,
        sys.effect || '', sys.improvements || [], actor.system.rank || 1
      )
    });
  }

  /**
   * Deactivate a sustained ability by index.
   * @param {Event} ev
   */
  async _onDeactivateAbility(ev) {
    const index = parseInt($(ev.currentTarget).data('index'));
    const active = game.settings.get('deathwatch', 'activeSquadAbilities') || [];
    if (index < 0 || index >= active.length) return;

    const removed = active[index];
    active.splice(index, 1);
    await game.settings.set('deathwatch', 'activeSquadAbilities', active);
    await ChatMessage.create({ content: ModeHelper.buildDeactivationMessage(removed.abilityName) });
  }

  /**
   * Deactivate all sustained abilities for a specific actor.
   * @param {string} actorId
   */
  static async deactivateAbilitiesForActor(actorId) {
    const active = game.settings.get('deathwatch', 'activeSquadAbilities') || [];
    const remaining = active.filter(a => a.initiatorId !== actorId);
    if (remaining.length !== active.length) {
      await game.settings.set('deathwatch', 'activeSquadAbilities', remaining);
    }
  }

  async _adjustCohesion(delta) {
    const cohesion = game.settings.get('deathwatch', 'cohesion');
    const newValue = Math.max(0, Math.min(cohesion.max, cohesion.value + delta));
    if (newValue === cohesion.value) {
      ui.notifications.info(delta > 0 ? 'Cohesion is already at maximum.' : 'Cohesion is already at 0.');
      return;
    }
    await game.settings.set('deathwatch', 'cohesion', { ...cohesion, value: newValue });
    const label = delta > 0 ? 'Recovered' : 'Lost';
    await ChatMessage.create({
      content: `<div class="cohesion-chat"><strong>⚔ Cohesion ${label}</strong> — now ${newValue} / ${cohesion.max}</div>`
    });
  }

  /* -------------------------------------------- */
  /*  Dialogs                                     */
  /* -------------------------------------------- */

  async _onRecalculate() {
    const leaderId = game.settings.get('deathwatch', 'squadLeader');
    const leader = leaderId ? game.actors.get(leaderId) : null;
    if (!leader) return ui.notifications.warn('No squad leader assigned.');

    const currentGmMod = game.settings.get('deathwatch', 'cohesionModifier');
    const fsBonus = Math.floor((leader.system.characteristics?.fs?.value || 0) / 10);
    const rankMod = CohesionHelper.getRankModifier(leader.system.rank || 1);
    const commandMod = CohesionHelper.getCommandModifier(leader.system.skills?.command || {});

    new Dialog({
      title: 'Recalculate Cohesion',
      content: `
        <div class="form-group">
          <p>Leader: <strong>${leader.name}</strong></p>
          <p>Fellowship Bonus: <strong>${fsBonus}</strong></p>
          <p>Rank Modifier: <strong>+${rankMod}</strong></p>
          <p>Command Modifier: <strong>+${commandMod}</strong></p>
          <hr/>
          <label>GM Modifier:</label>
          <input type="number" id="gm-modifier" value="${currentGmMod}" />
        </div>`,
      buttons: {
        confirm: {
          label: 'Recalculate',
          callback: async (html) => {
            const gmMod = parseInt(html.find('#gm-modifier').val()) || 0;
            await game.settings.set('deathwatch', 'cohesionModifier', gmMod);
            const max = CohesionHelper.calculateCohesionMaxFromActor(leader, gmMod);
            const current = game.settings.get('deathwatch', 'cohesion');
            await game.settings.set('deathwatch', 'cohesion', { value: Math.min(current.value, max), max });
          }
        },
        cancel: { label: 'Cancel' }
      },
      default: 'confirm'
    }).render(true);
  }

  async _onEdit() {
    const current = game.settings.get('deathwatch', 'cohesion');
    new Dialog({
      title: 'Edit Cohesion',
      content: `
        <div class="form-group">
          <label>Current:</label>
          <input type="number" id="cohesion-value" value="${current.value}" min="0" />
        </div>
        <div class="form-group">
          <label>Maximum:</label>
          <input type="number" id="cohesion-max" value="${current.max}" min="0" />
        </div>`,
      buttons: {
        confirm: {
          label: 'Save',
          callback: async (html) => {
            const value = parseInt(html.find('#cohesion-value').val()) || 0;
            const max = parseInt(html.find('#cohesion-max').val()) || 0;
            await game.settings.set('deathwatch', 'cohesion', { value: Math.min(value, max), max });
          }
        },
        cancel: { label: 'Cancel' }
      },
      default: 'confirm'
    }).render(true);
  }

  async _onSetLeader() {
    const characters = game.actors.filter(a => a.type === 'character');
    if (!characters.length) return ui.notifications.warn('No character actors found.');

    const currentLeader = game.settings.get('deathwatch', 'squadLeader');
    const options = characters.map(a => `<option value="${a.id}" ${a.id === currentLeader ? 'selected' : ''}>${a.name}</option>`).join('');

    new Dialog({
      title: 'Set Squad Leader',
      content: `
        <div class="form-group">
          <label>Squad Leader:</label>
          <select id="leader-select">${options}</select>
        </div>`,
      buttons: {
        confirm: {
          label: 'Confirm',
          callback: async (html) => {
            const leaderId = html.find('#leader-select').val();
            await game.settings.set('deathwatch', 'squadLeader', leaderId);
            const gmMod = game.settings.get('deathwatch', 'cohesionModifier');
            const leader = game.actors.get(leaderId);
            const max = CohesionHelper.calculateCohesionMaxFromActor(leader, gmMod);
            await game.settings.set('deathwatch', 'cohesion', { value: max, max });
          }
        },
        cancel: { label: 'Cancel' }
      },
      default: 'confirm'
    }).render(true);
  }

  async _onCohesionChallenge() {
    const owned = game.actors.filter(a => a.type === 'character' && a.isOwner);
    if (!owned.length) return ui.notifications.warn('No owned character actors found.');

    if (owned.length === 1) {
      return CohesionHelper.rollCohesionChallenge(owned[0]);
    }

    const options = owned.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    new Dialog({
      title: 'Cohesion Challenge',
      content: `
        <div class="form-group">
          <label>Battle-Brother:</label>
          <select id="challenge-actor">${options}</select>
        </div>`,
      buttons: {
        roll: {
          label: 'Roll',
          callback: async (html) => {
            const actor = game.actors.get(html.find('#challenge-actor').val());
            if (actor) await CohesionHelper.rollCohesionChallenge(actor);
          }
        },
        cancel: { label: 'Cancel' }
      },
      default: 'roll'
    }).render(true);
  }
}
