# ApplicationV2 Code Examples

System-specific code examples for the Deathwatch Foundry VTT system migration.

## ActorSheetV2 — Skeleton

```javascript
import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { DWConfig } from "../helpers/config.mjs";
import { CombatHelper } from "../helpers/combat/combat.mjs";
import { PsychicCombatHelper } from "../helpers/combat/psychic-combat.mjs";
import { ModifierHelper } from "../helpers/character/modifiers.mjs";
import { ChatMessageBuilder } from "../helpers/ui/chat-message-builder.mjs";
import { ItemHandlers } from "../helpers/ui/item-handlers.mjs";
import { getRankImage } from "../helpers/character/rank-helper.mjs";
import { WoundHelper } from "../helpers/character/wound-helper.mjs";
import { ModeHelper } from "../helpers/mode-helper.mjs";
import { CohesionPanel } from "../ui/cohesion-panel.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class DeathwatchActorSheetV2 extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {

  static DEFAULT_OPTIONS = {
    classes: ["deathwatch", "sheet", "actor"],
    position: { width: 1000, height: 800 },
    actions: {
      // Item management
      editItem: this._onEditItem,
      deleteItem: this._onDeleteItem,
      createItem: this._onCreateItem,
      toggleEquip: this._onToggleEquip,
      // Combat
      weaponAttack: this._onWeaponAttack,
      weaponDamage: this._onWeaponDamage,
      weaponUnjam: this._onWeaponUnjam,
      removeAmmo: this._onRemoveAmmo,
      removeUpgrade: this._onRemoveUpgrade,
      editAmmo: this._onEditAmmo,
      // Rolls
      rollCharacteristic: this._onRollCharacteristic,
      rollSkill: this._onRollSkill,
      // Display/Chat
      showTalent: this._onShowItem,
      showTrait: this._onShowItem,
      showImplant: this._onShowItem,
      showDemeanour: this._onShowItem,
      showHistory: this._onShowItem,
      showCritical: this._onShowItem,
      showPsychicPower: this._onShowItem,
      usePsychicPower: this._onUsePsychicPower,
      showSpecialAbility: this._onShowSpecialAbility,
      activateSquadAbility: this._onActivateSquadAbility,
      // Modifiers
      createModifier: this._onCreateModifier,
      editModifier: this._onEditModifier,
      deleteModifier: this._onDeleteModifier,
      toggleModifier: this._onToggleModifier,
      // Effects
      manageEffect: this._onManageEffect,
      toggleEffect: this._onToggleEffect,
      // Other
      removeChapter: this._onRemoveChapter,
      removeSpecialty: this._onRemoveSpecialty,
      removeHistory: this._onRemoveHistory,
      toggleSection: this._onToggleSection
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/deathwatch/templates/actor/actor-character-sheet.hbs",
      scrollable: [".skills-container", ".items-list"]
    }
  };

  /** @override */
  get template() {
    return `systems/deathwatch/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  tabGroups = { primary: "characteristics" };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Live system data (preserves derived DataModel properties)
    context.system = { ...this.actor.system };
    context.flags = this.actor.flags;

    if (this.actor.type === 'character') {
      this._prepareCharacterData(context);
      this._prepareItems(context);
    }
    if (this.actor.type === 'npc') {
      this._prepareNPCData(context);
      this._prepareItems(context);
    }
    if (this.actor.type === 'enemy' || this.actor.type === 'horde') {
      this._prepareEnemyData(context);
      this._prepareItems(context);
    }

    context.rollData = this.actor.getRollData();
    context.effects = prepareActiveEffectCategories(this.actor.effects);
    context.modifiers = this.actor.system.modifiers || [];
    context.statusEffects = CONFIG.statusEffects.map(effect => ({
      ...effect,
      active: this.actor.hasCondition?.(effect.id) || false
    }));

    return context;
  }

  // --- Data preparation methods transfer unchanged from V1 ---
  _prepareCharacterData(context) { /* same as V1 */ }
  _prepareNPCData(context) { /* same as V1 */ }
  _prepareEnemyData(context) { /* same as V1 */ }
  _prepareItems(context) { /* same as V1 */ }

  // --- Action Handlers (static, 'this' bound to sheet by Foundry) ---

  static async _onEditItem(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    item?.sheet.render(true);
  }

  static async _onDeleteItem(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    await item?.delete();
  }

  static async _onCreateItem(event, target) {
    const type = target.dataset.type;
    await Item.create({ name: `New ${type.capitalize()}`, type }, { parent: this.actor });
  }

  static async _onToggleEquip(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    await item?.update({ "system.equipped": !item.system.equipped });
  }

  static async _onWeaponAttack(event, target) {
    const weapon = this.actor.items.get(target.dataset.itemId);
    if (weapon) CombatHelper.weaponAttackDialog(this.actor, weapon);
  }

  static async _onWeaponDamage(event, target) {
    const weapon = this.actor.items.get(target.dataset.itemId);
    if (weapon) CombatHelper.weaponDamageRoll(this.actor, weapon);
  }

  static async _onWeaponUnjam(event, target) {
    const weapon = this.actor.items.get(target.dataset.itemId);
    if (weapon) CombatHelper.clearJam(this.actor, weapon);
  }

  static async _onShowItem(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (item) ChatMessageBuilder.createItemCard(item, this.actor);
  }

  static async _onUsePsychicPower(event, target) {
    const power = this.actor.items.get(target.dataset.itemId);
    if (power) PsychicCombatHelper.focusPowerDialog(this.actor, power);
  }

  static async _onShowSpecialAbility(event, target) {
    const ability = this.actor.items.get(target.dataset.itemId);
    if (!ability) return;
    const sys = ability.system;
    if (sys.effect && sys.modeRequirement) {
      const msg = ModeHelper.buildAbilityActivationMessage(
        this.actor.name, ability.name, sys.modeRequirement,
        sys.effect, sys.improvements || [], this.actor.system.rank || 1
      );
      if (msg) {
        ChatMessage.create({ content: msg, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
        return;
      }
    }
    ChatMessageBuilder.createItemCard(ability, this.actor);
  }

  static async _onActivateSquadAbility(event, target) {
    const ability = this.actor.items.get(target.dataset.itemId);
    if (ability) CohesionPanel.activateSquadAbility(this.actor, ability);
  }

  static async _onRollCharacteristic(event, target) {
    const charKey = target.dataset.characteristic;
    const label = target.dataset.label;
    const characteristic = this.actor.system.characteristics[charKey];
    // Open DialogV2 with modifier inputs, then roll (see quickref.md → Dialog Migration)
  }

  static async _onRollSkill(event, target) {
    const skillKey = target.dataset.skill;
    const label = target.dataset.label;
    const skill = this.actor.system.skills[skillKey];
    // Open DialogV2 with modifier inputs, then roll
  }

  static async _onCreateModifier(event, target) {
    ModifierHelper.createModifier(this.actor);
  }

  static async _onEditModifier(event, target) {
    ModifierHelper.editModifierDialog(this.actor, target.dataset.modifierId);
  }

  static async _onDeleteModifier(event, target) {
    ModifierHelper.deleteModifier(this.actor, target.dataset.modifierId);
  }

  static async _onToggleModifier(event, target) {
    ModifierHelper.toggleModifierEnabled(this.actor, target.dataset.modifierId);
  }
}
```

## CohesionPanel V2 — Skeleton

```javascript
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class CohesionPanel extends HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static _instance = null;

  static getInstance() {
    if (!CohesionPanel._instance) CohesionPanel._instance = new CohesionPanel();
    return CohesionPanel._instance;
  }

  static DEFAULT_OPTIONS = {
    id: 'cohesion-panel',
    window: { title: '⚔ Kill-team Cohesion', minimizable: false, resizable: false },
    position: { width: 220, height: 'auto' },
    classes: ['cohesion-panel'],
    actions: {
      recover: this._onRecover,
      lose: this._onLose,
      recalculate: this._onRecalculate,
      edit: this._onEdit,
      setLeader: this._onSetLeader,
      challenge: this._onChallenge,
      toggleMode: this._onToggleMode,
      deactivateAbility: this._onDeactivateAbility
    }
  };

  static PARTS = {
    panel: { template: 'systems/deathwatch/templates/ui/cohesion-panel.hbs' }
  };

  _onFirstRender(context, options) {
    const left = Math.round((window.innerWidth - 220) / 2);
    this.setPosition({ left, top: 10 });
  }

  async _prepareContext(options) {
    // Same logic as current getData()
    const cohesion = game.settings.get('deathwatch', 'cohesion');
    // ... build context
    return { value: cohesion.value, max: cohesion.max, /* ... */ };
  }

  static toggle() {
    const panel = CohesionPanel.getInstance();
    if (panel.rendered) panel.close();
    else panel.render(true);
  }

  static async _onRecover(event, target) {
    CohesionHelper.recoverCohesion(1);
  }

  static async _onToggleMode(event, target) {
    const actorId = target.dataset.actorId;
    // Same logic as current _onToggleMode, using native DOM
  }

  static async _onDeactivateAbility(event, target) {
    const index = parseInt(target.dataset.index);
    // Same logic as current _onDeactivateAbility
  }
}
```

## DialogV2 Examples (System-Specific)

### Weapon Attack/Damage Choice (Hotbar Macro)
```javascript
// V1
new Dialog({
  title: item.name,
  content: `<p style="text-align: center;"><img src="${item.img}" width="50" /><br><strong>${item.name}</strong></p>`,
  buttons: {
    attack: { icon: '<i class="fas fa-crosshairs"></i>', label: "Attack",
      callback: () => CombatHelper.weaponAttackDialog(item.parent, item) },
    damage: { icon: '<i class="fas fa-burst"></i>', label: "Damage",
      callback: () => CombatHelper.weaponDamageRoll(item.parent, item) }
  },
  default: "attack"
}).render(true);

// V2
await foundry.applications.api.DialogV2.wait({
  window: { title: item.name },
  content: `<p style="text-align: center;"><img src="${item.img}" width="50" /><br><strong>${item.name}</strong></p>`,
  buttons: [
    { icon: '<i class="fas fa-crosshairs"></i>', label: "Attack", action: "attack",
      callback: () => CombatHelper.weaponAttackDialog(item.parent, item) },
    { icon: '<i class="fas fa-burst"></i>', label: "Damage", action: "damage",
      callback: () => CombatHelper.weaponDamageRoll(item.parent, item) }
  ]
});
```

### On Fire Confirmation
```javascript
// V1
new Dialog({
  title: `🔥 ${actor.name} is On Fire!`,
  content: `<p><strong>${actor.name}</strong> is On Fire! Apply fire damage?</p>`,
  buttons: {
    apply: { label: '🔥 Apply Fire', callback: () => applyOnFireEffects(actor) },
    skip: { label: 'Skip' }
  },
  default: 'apply'
}).render(true);

// V2
await foundry.applications.api.DialogV2.wait({
  window: { title: `🔥 ${actor.name} is On Fire!` },
  content: `<p><strong>${actor.name}</strong> is On Fire! Apply fire damage?</p>`,
  buttons: [
    { label: '🔥 Apply Fire', action: 'apply', callback: () => applyOnFireEffects(actor) },
    { label: 'Skip', action: 'skip' }
  ]
});
```

### Cohesion Recalculate (Form Dialog)
```javascript
// V2
const result = await foundry.applications.api.DialogV2.prompt({
  window: { title: 'Recalculate Cohesion' },
  content: `
    <div class="form-group">
      <p>Leader: <strong>${leader.name}</strong></p>
      <p>Fellowship Bonus: <strong>${fsBonus}</strong></p>
      <p>Rank Modifier: <strong>+${rankMod}</strong></p>
      <p>Command Modifier: <strong>+${commandMod}</strong></p>
      <hr/>
      <label>GM Modifier:</label>
      <input type="number" name="gmModifier" value="${currentGmMod}" />
    </div>`,
  ok: {
    label: 'Recalculate',
    callback: (event, button, dialog) => {
      return parseInt(button.form.elements.gmModifier.value) || 0;
    }
  }
});
if (result !== null) {
  await game.settings.set('deathwatch', 'cohesionModifier', result);
  // ... recalculate
}
```

## Template Example — V2 Item Controls

```handlebars
{{!-- V2 item controls partial --}}
<div class="item-controls">
  <button type="button" data-action="editItem" data-item-id="{{item._id}}" title="Edit">
    <i class="fas fa-edit"></i>
  </button>
  <button type="button" data-action="deleteItem" data-item-id="{{item._id}}" title="Delete">
    <i class="fas fa-trash"></i>
  </button>
</div>
```

## Template Example — V2 Weapon Row

```handlebars
<li class="item" data-item-id="{{item._id}}">
  <div class="item-image">
    <img src="{{item.img}}" data-action="weaponAttack" data-item-id="{{item._id}}" />
  </div>
  <div class="item-name">{{item.name}}</div>
  <div class="item-damage">{{item.system.effectiveDamage}}</div>
  <div class="item-controls">
    <button type="button" data-action="weaponAttack" data-item-id="{{item._id}}" title="Attack">
      <i class="fas fa-crosshairs"></i>
    </button>
    <button type="button" data-action="weaponDamage" data-item-id="{{item._id}}" title="Damage">
      <i class="fas fa-burst"></i>
    </button>
    {{#if item.system.jammed}}
    <button type="button" data-action="weaponUnjam" data-item-id="{{item._id}}" title="Clear Jam">
      <i class="fas fa-wrench"></i>
    </button>
    {{/if}}
    <button type="button" data-action="editItem" data-item-id="{{item._id}}" title="Edit">
      <i class="fas fa-edit"></i>
    </button>
    <button type="button" data-action="deleteItem" data-item-id="{{item._id}}" title="Delete">
      <i class="fas fa-trash"></i>
    </button>
  </div>
</li>
```

## Feature Flag Registration

```javascript
// In deathwatch.mjs init hook
game.settings.register('deathwatch', 'useV2Sheets', {
  name: 'Use ApplicationV2 Sheets (Experimental)',
  hint: 'Enable the new sheet architecture. Requires reload.',
  scope: 'client',
  config: true,
  type: Boolean,
  default: false,
  onChange: () => window.location.reload()
});

const useV2 = game.settings.get('deathwatch', 'useV2Sheets');
const ActorSheetClass = useV2
  ? (await import('./sheets/actor-sheet-v2.mjs')).DeathwatchActorSheetV2
  : DeathwatchActorSheet;

Actors.unregisterSheet("core", ActorSheet);
Actors.registerSheet("deathwatch", ActorSheetClass, { makeDefault: true });
```

## Test Mock for V2

```javascript
// In tests/setup.mjs
global.foundry.applications = {
  api: {
    ApplicationV2: class ApplicationV2 {
      static DEFAULT_OPTIONS = {};
      static PARTS = {};
      render() {}
      close() {}
      setPosition() {}
      get rendered() { return false; }
    },
    HandlebarsApplicationMixin: (Base) => class extends Base {
      async _prepareContext() { return {}; }
      _onRender() {}
      _onFirstRender() {}
    },
    DialogV2: {
      wait: jest.fn().mockResolvedValue(null),
      prompt: jest.fn().mockResolvedValue(null),
      confirm: jest.fn().mockResolvedValue(true)
    }
  },
  sheets: {
    ActorSheetV2: class {
      // No .mixin() — use HandlebarsApplicationMixin(ActorSheetV2) pattern
    },
    ItemSheetV2: class {
      // No .mixin() — use HandlebarsApplicationMixin(ItemSheetV2) pattern
    }
  }
};
```
