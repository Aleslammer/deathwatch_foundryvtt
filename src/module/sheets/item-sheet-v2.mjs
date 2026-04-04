import { ModifierHelper } from "../helpers/character/modifiers.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/**
 * ApplicationV2 item sheet for the Deathwatch system.
 * Handles all 17 item types.
 * @extends {ItemSheetV2}
 */
export class DeathwatchItemSheetV2 extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {

  static DEFAULT_OPTIONS = {
    classes: ["deathwatch", "sheet", "item"],
    position: { width: 520, height: 480 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      createModifier: DeathwatchItemSheetV2._onModifierCreate,
      editModifier: DeathwatchItemSheetV2._onModifierEdit,
      deleteModifier: DeathwatchItemSheetV2._onModifierDelete,
      toggleModifier: DeathwatchItemSheetV2._onToggleModifierEnabled,
      weaponAttack: DeathwatchItemSheetV2._onWeaponAttack,
      weaponDamage: DeathwatchItemSheetV2._onWeaponDamage,
      removeHistory: DeathwatchItemSheetV2._onHistoryRemove,
      removeQuality: DeathwatchItemSheetV2._onQualityRemove
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/deathwatch/templates/item/item-weapon-sheet.html"
    }
  };

  /** Return the correct template for this item's type. */
  get _itemTemplate() {
    return `systems/deathwatch/templates/item/item-${this.document.type}-sheet.html`;
  }

  /** @override */
  get title() {
    return this.document.name;
  }

  /** @override — render using per-instance template to avoid static PARTS sharing */
  async _renderHTML(context, options) {
    const template = this._itemTemplate;
    const compiled = await foundry.applications.handlebars.getTemplate(template);
    const htmlString = compiled(context, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });
    const temp = document.createElement("div");
    temp.innerHTML = htmlString;
    const content = temp.firstElementChild;
    content.dataset.applicationPart = "sheet";
    return { sheet: content };
  }

  _onFirstRender(context, options) {
    if (this.document.type === 'psychic-power' || this.document.type === 'special-ability') {
      this.setPosition({ height: 624 });
    }
    if (this.document.type === 'gear' || this.document.type === 'armor-history' || this.document.type === 'cybernetic') {
      this.setPosition({ width: 620 });
    }
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const itemData = this.item;
    context.item = itemData;
    context.cssClass = this.isEditable ? "editable" : "locked";
    context.editable = this.isEditable;
    context.owner = this.item.isOwner;

    context.rollData = {};
    let actor = this.item?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    context.system = itemData.system;
    context.flags = itemData.flags;

    if (itemData.type === 'specialty') {
      this._prepareSpecialtyData(context);
    }
    if (itemData.type === 'armor') {
      this._prepareArmorData(context, actor);
    }
    if (itemData.type === 'weapon') {
      this._prepareWeaponData(context, actor);
    }

    return context;
  }

  _prepareSpecialtyData(context) {
    context.characteristics = {
      ws: 'Weapon Skill', bs: 'Ballistic Skill', str: 'Strength',
      tg: 'Toughness', ag: 'Agility', int: 'Intelligence',
      per: 'Perception', wil: 'Willpower', fs: 'Fellowship'
    };
    if (!context.system.rankCosts) {
      context.system.rankCosts = {};
      for (let i = 1; i <= 8; i++) {
        context.system.rankCosts[i.toString()] = { skills: {}, talents: {} };
      }
    }
    context.skillNames = {};
    context.talentNames = {};
    if (game.deathwatch?.config?.Skills) {
      context.skillNames = game.deathwatch.config.Skills;
    }
    const talentIds = new Set();
    for (const rankData of Object.values(context.system.rankCosts)) {
      if (rankData.talents) {
        Object.keys(rankData.talents).forEach(id => talentIds.add(id));
      }
    }
    const talentPack = game.packs.get('deathwatch.talents');
    if (talentPack) {
      for (const talentId of talentIds) {
        const talent = talentPack.index.get(talentId);
        if (talent) context.talentNames[talentId] = talent.name;
      }
    }
  }

  _prepareArmorData(context, actor) {
    if (actor) {
      const historyIds = Array.isArray(this.item.system.attachedHistories) ? this.item.system.attachedHistories : [];
      context.system.attachedHistories = historyIds.map(histId => {
        const hist = actor.items.get(histId);
        return hist ? { _id: hist.id, name: hist.name, img: hist.img } : null;
      }).filter(h => h);
    } else {
      context.system.attachedHistories = [];
    }
  }

  _prepareWeaponData(context, actor) {
    const qualityIds = Array.isArray(this.item.system.attachedQualities) ? this.item.system.attachedQualities : [];
    const pack = game.packs.get('deathwatch.weapon-qualities');
    context.attachedQualities = qualityIds.map(q => {
      const qualityId = typeof q === 'string' ? q : q.id;
      let quality = actor?.items.get(qualityId);
      if (!quality && pack) quality = pack.index.get(qualityId);
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
    if (this.item.system.effectiveBlast) {
      context.attachedQualities.push({
        _id: 'effective-blast', name: 'Blast',
        system: { key: 'blast', value: this.item.system.effectiveBlast },
        isEffective: true
      });
    }
    if (this.item.system.effectiveFelling) {
      context.attachedQualities.push({
        _id: 'effective-felling', name: 'Felling',
        system: { key: 'felling', value: this.item.system.effectiveFelling },
        isEffective: true
      });
    }
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  static async _onModifierCreate(event, target) {
    const modifiers = Array.isArray(this.item.system.modifiers) ? [...this.item.system.modifiers] : [];
    modifiers.push({
      _id: foundry.utils.randomID(),
      name: "New Modifier", modifier: "0", type: "untyped",
      effectType: "characteristic", valueAffected: "", enabled: true
    });
    await this.item.update({ "system.modifiers": modifiers });
    this.render();
  }

  static async _onModifierEdit(event, target) {
    const modifierId = target.dataset.modifierId || target.closest('.modifier')?.dataset.modifierId;
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

  static async _onModifierDelete(event, target) {
    const modifierId = target.dataset.modifierId || target.closest('.modifier')?.dataset.modifierId;
    const modifiers = Array.isArray(this.item.system.modifiers) ? this.item.system.modifiers.filter(m => m._id !== modifierId) : [];
    await this.item.update({ "system.modifiers": modifiers });
    this.render();
  }

  static async _onToggleModifierEnabled(event, target) {
    const modifierId = target.dataset.modifierId || target.closest('.modifier')?.dataset.modifierId;
    const modifiers = [...this.item.system.modifiers];
    const index = modifiers.findIndex(m => m._id === modifierId);
    if (index >= 0) {
      modifiers[index].enabled = !modifiers[index].enabled;
      await this.item.update({ "system.modifiers": modifiers });
      this.render();
    }
  }

  /* istanbul ignore next */
  static async _onWeaponAttack(event, target) {
    const actor = this.item.actor;
    if (!actor) return ui.notifications.warn("This weapon must be owned by an actor to roll attacks.");
    const bs = actor.system.characteristics.bs.value;
    const roll = await new Roll("1d100").evaluate();
    const isHit = roll.total <= bs;
    const flavor = `<h2>${this.item.name} - Attack Roll</h2><p>Target: ${bs}</p>`;
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: flavor + `<p><strong>${isHit ? 'HIT!' : 'MISS!'}</strong></p>`
    });
  }

  /* istanbul ignore next */
  static async _onWeaponDamage(event, target) {
    const actor = this.item.actor;
    if (!actor) return ui.notifications.warn("This weapon must be owned by an actor to roll damage.");
    const dmg = this.item.system.dmg;
    if (!dmg) return ui.notifications.warn("This weapon has no damage value.");
    const roll = await new Roll(dmg).evaluate();
    const flavor = `<h2>${this.item.name} - Damage Roll</h2><p>Penetration: ${this.item.system.penetration}</p>`;
    roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor });
  }

  static async _onHistoryRemove(event, target) {
    const historyId = target.dataset.historyId;
    const attachedHistories = (this.item.system.attachedHistories || []).filter(id => id !== historyId);
    await this.item.update({ "system.attachedHistories": attachedHistories });
    this.render();
  }

  static async _onQualityRemove(event, target) {
    const qualityId = target.dataset.qualityId;
    const attachedQualities = (this.item.system.attachedQualities || []).filter(q => {
      const id = typeof q === 'string' ? q : q.id;
      return id !== qualityId;
    });
    await this.item.update({ "system.attachedQualities": attachedQualities });
    this.render();
  }

  /* -------------------------------------------- */
  /*  Post-Render & Drop Handlers                 */
  /* -------------------------------------------- */

  /* istanbul ignore next */
  _onRender(context, options) {
    super._onRender?.(context, options);
    const html = this.element;
    if (!html) return;

    // V1-style tab activation
    const tabNav = html.querySelector('.sheet-tabs');
    if (tabNav) {
      const tabs = new foundry.applications.ux.Tabs({
        navSelector: '.sheet-tabs', contentSelector: '.sheet-body',
        initial: this._activeTab || 'description'
      });
      tabs.bind(html);
      tabs.activate(this._activeTab || 'description');
      html.querySelectorAll('.sheet-tabs .item').forEach(tab => {
        tab.addEventListener('click', () => { this._activeTab = tab.dataset.tab; });
      });
    }

    // Quality value change
    html.querySelectorAll('.quality-value').forEach(input => {
      input.addEventListener('change', async (ev) => {
        const qualityId = ev.currentTarget.dataset.qualityId;
        const newValue = ev.currentTarget.value;
        const attachedQualities = (this.item.system.attachedQualities || []).map(q => {
          const id = typeof q === 'string' ? q : q.id;
          if (id === qualityId) return { id: qualityId, value: newValue };
          return q;
        });
        await this.item.update({ "system.attachedQualities": attachedQualities });
      });
    });
  }

  /* istanbul ignore next */
  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data.type !== 'Item') return super._onDrop?.(event);
    const droppedItem = await Item.implementation.fromDropData(data);
    if (!droppedItem) return super._onDrop?.(event);

    if (this.item.type === 'armor' && droppedItem.type === 'armor-history') {
      event.preventDefault();
      event.stopPropagation();
      const currentHistories = this.item.system.attachedHistories || [];
      if (!currentHistories.includes(droppedItem.id)) {
        await this.item.update({ "system.attachedHistories": [...currentHistories, droppedItem.id] });
        ui.notifications.info(`${droppedItem.name} attached to ${this.item.name}.`);
      } else {
        ui.notifications.warn(`${droppedItem.name} is already attached to ${this.item.name}.`);
      }
      return false;
    }

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
        await this.item.update({ "system.attachedQualities": [...currentQualities, newQuality] });
        ui.notifications.info(`${droppedItem.name} attached to ${this.item.name}.`);
      } else {
        ui.notifications.warn(`${droppedItem.name} is already attached to ${this.item.name}.`);
      }
      return false;
    }

    return super._onDrop?.(event);
  }
}
