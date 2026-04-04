# ApplicationV2 Migration Plan

## Overview
Complete plan for migrating from Foundry VTT's legacy V1 Application/Sheet/Dialog architecture to ApplicationV2. V1 classes are deprecated in v14 and will be removed in v15.

This folder is self-contained — everything needed to execute the migration lives here.

## Current State (v0.0.2, 1567 tests)
- `DeathwatchActorSheet` extends `ActorSheet` (V1) — 1170 lines, 4 actor types, 25+ jQuery event handlers
- `DeathwatchActorSheetV2` extends `HandlebarsApplicationMixin(ActorSheetV2)` ✅ **MIGRATED** — feature flag `useV2Sheets`
- `DeathwatchItemSheet` extends `ItemSheet` (V1) — 17 item type templates, 9 jQuery event handlers
- `DeathwatchItemSheetV2` extends `ItemSheetV2.mixin(HandlebarsApplicationMixin)` ✅ **MIGRATED** — feature flag `useV2Sheets`
- `CohesionPanel` extends `HandlebarsApplicationMixin(ApplicationV2)` ✅ **MIGRATED**
- All `Dialog` → `DialogV2` ✅ **MIGRATED** (~30 instances across all files)
- All templates have dual `class` + `data-action` attributes ✅ **MIGRATED** — both V1 and V2 work
- Feature flag `useV2Sheets` (client setting, default: off) toggles V1/V2 sheets

## Target State
- `DeathwatchActorSheetV2` extends `HandlebarsApplicationMixin(ActorSheetV2)`
- `DeathwatchItemSheetV2` extends `ItemSheetV2.mixin(HandlebarsApplicationMixin)`
- `CohesionPanel` extends `HandlebarsApplicationMixin(ApplicationV2)`
- All `Dialog` → `DialogV2` (prompt/confirm/wait patterns)
- Native DOM event handling via `data-action` attributes
- Reactive partial re-rendering

## Key Architectural Changes

| Aspect | V1 (Current) | V2 (Target) |
|--------|-------------|-------------|
| Base Class | `ActorSheet` / `ItemSheet` / `Application` | `HandlebarsApplicationMixin(ActorSheetV2)` / `HandlebarsApplicationMixin(ItemSheetV2)` / `ApplicationV2` |
| Options | `static get defaultOptions()` | `static DEFAULT_OPTIONS = {}` |
| Template | `get template()` | `static PARTS = {}` |
| Data Prep | `getData()` | `async _prepareContext(options)` |
| Events | `activateListeners(html)` + jQuery | `data-action` + static action handlers |
| Rendering | Full re-render | Partial re-render per PART |
| jQuery | Required | Not needed |
| Form Submit | Manual handling | Automatic |
| Dialogs | `new Dialog({}).render(true)` | `await DialogV2.wait({})` |
| Position | `_render()` override | `_onFirstRender()` |
| Scroll | Manual tracking | `scrollable` in PARTS |

---

## Phase 1: Dialog → DialogV2

Dialogs are used everywhere. Migrating them first unblocks all other phases.

### DialogV2 API

| Pattern | Use Case |
|---------|----------|
| `DialogV2.wait({ buttons: [...] })` | Multi-button (attack/damage choice, roll dialogs) |
| `DialogV2.confirm({ content })` | Yes/no (On Fire confirmation, delete confirmation) |
| `DialogV2.prompt({ ok: { callback } })` | Single-action with form (recalculate, edit values) |

### Key Differences

| V1 Dialog | V2 DialogV2 |
|-----------|-------------|
| `new Dialog({}).render(true)` | `await DialogV2.wait({})` |
| `title: "..."` | `window: { title: "..." }` |
| `buttons: { key: { label, callback } }` | `buttons: [{ label, action, callback }]` |
| `default: "key"` | First button is default (or `default: { action: "key" }`) |
| `render: (html) => {}` | `render: (event, dialog) => {}` |
| `callback: (html) => {}` | `callback: (event, button, dialog) => {}` |
| `html.find('#id').val()` | `dialog.querySelector('#id').value` or `button.form.elements.id.value` |

### Dialog Inventory (~30 instances)

**deathwatch.mjs** (6 dialogs):
1. On Fire confirmation (`updateCombat` hook) → `DialogV2.wait`
2. Flame Attack dialog (`flameAttack()`) → `DialogV2.wait`
3. Dodge Flame dialog (inner) → `DialogV2.wait`
4. Weapon Attack/Damage choice (`rollItemMacro()`) → `DialogV2.wait`
5. Extinguish attempt (`extinguish-btn` handler) → `DialogV2.prompt`
6. Opposed WP test (`psychic-oppose-btn` handler) → `DialogV2.prompt`

**actor-sheet.mjs** (3 dialogs):
1. Characteristic roll modifier → `DialogV2.wait`
2. Skill roll modifier → `DialogV2.wait`
3. Weapon attack (legacy `_onWeaponAttack`) → `DialogV2.wait`

**cohesion-panel.mjs** (4 dialogs):
1. Recalculate Cohesion → `DialogV2.prompt`
2. Edit Cohesion → `DialogV2.prompt`
3. Set Squad Leader → `DialogV2.prompt`
4. Cohesion Challenge character selection → `DialogV2.prompt`

**Combat modules** (6+ dialogs):
1. `ranged-combat.mjs` — Ranged attack → `DialogV2.wait`
2. `melee-combat.mjs` — Melee attack → `DialogV2.wait`
3. `psychic-combat.mjs` — Focus Power → `DialogV2.wait`
4. `psychic-combat.mjs` — Opposed WP → `DialogV2.prompt`
5. `combat.mjs` — Damage → `DialogV2.wait`
6. `initiative.mjs` — Initiative modifier → `DialogV2.wait`

**Helpers** (2 dialogs):
1. `modifiers.mjs` — Edit modifier → `DialogV2.prompt`
2. `roll-dialog-builder.mjs` — Builds dialog HTML (used by sheets)

### Migration Order
1. `roll-dialog-builder.mjs` — used by sheets, migrate builder pattern
2. `modifiers.mjs` — simple edit dialog
3. `cohesion-panel.mjs` — 4 simple dialogs
4. `actor-sheet.mjs` — 3 dialogs (use updated roll-dialog-builder)
5. `deathwatch.mjs` — 6 dialogs (largest file)
6. Combat modules — ranged, melee, psychic, combat, initiative

### Test Impact
- `tests/setup.mjs` — add `DialogV2` mock (`wait`, `prompt`, `confirm` as `jest.fn()`)
- `tests/helpers/roll-dialog-builder.test.mjs` — update mock expectations
- Combat tests use pure functions (not dialogs) — minimal impact

---

## Phase 2: CohesionPanel → ApplicationV2

Simplest Application class. Good practice before tackling sheets.

### Current → Target

```javascript
// V1 (current)
export class CohesionPanel extends Application {
  static get defaultOptions() { ... }
  getData() { ... }
  activateListeners(html) { ... }
  async _render(...args) { ... }
}

// V2 (target)
export class CohesionPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = { id, window, position, classes, actions };
  static PARTS = { panel: { template } };
  async _prepareContext(options) { ... }
  _onFirstRender(context, options) { ... }
  // static action handlers
}
```

### Event Handler Mapping (8 handlers)

| V1 jQuery Selector | V2 data-action | Data Attributes |
|--------------------|----------------|-----------------|
| `.cohesion-recover` | `recover` | — |
| `.cohesion-lose` | `lose` | — |
| `.cohesion-recalculate` | `recalculate` | — |
| `.cohesion-edit` | `edit` | — |
| `.cohesion-set-leader` | `setLeader` | — |
| `.cohesion-challenge-btn` | `challenge` | — |
| `.mode-toggle` | `toggleMode` | `data-actor-id` |
| `.squad-ability-deactivate` | `deactivateAbility` | `data-index` |

### Position Override
```javascript
// V1: _render() override
async _render(...args) {
  const firstRender = !this._element?.length;
  await super._render(...args);
  if (firstRender) super.setPosition({ left, top: 10 });
}

// V2: _onFirstRender()
_onFirstRender(context, options) {
  this.setPosition({ left: Math.round((window.innerWidth - 220) / 2), top: 10 });
}
```

### Template Changes
- Replace `class="cohesion-*"` click targets with `data-action="*"`
- Add `data-actor-id` / `data-index` attributes where needed
- Keep all display logic unchanged

### What Transfers Unchanged
- Singleton pattern (`getInstance()`, `toggle()`)
- `_adjustCohesion()`, `activateSquadAbility()`, `deactivateAbilitiesForActor()`, `dropAllToSoloMode()` — business logic unchanged
- Reactive re-render via `updateSetting` hook — unchanged

---

## Phase 3: ActorSheet → ActorSheetV2

Largest migration. 671 lines, 4 actor types, 25+ event handlers.

### Current Architecture
```
DeathwatchActorSheet extends ActorSheet
├── static get defaultOptions()
├── get template()                    → type-specific template path
├── getData()                         → context preparation
│   ├── _prepareCharacterData()       → characteristics, skills, costs
│   ├── _prepareNPCData()             → simplified character data
│   ├── _prepareEnemyData()           → enemy/horde data
│   └── _prepareItems()              → item categorization + cost overrides
├── activateListeners(html)           → 25+ jQuery event handlers
├── _onRoll(), _onCharacteristicRoll(), _onSkillRoll(), _onWeaponAttack()
├── _onDropItemOnItem()               → ammo/upgrade/history drops
├── _onDropChapter(), _onDropSpecialty()
```

### Target Architecture
```
DeathwatchActorSheetV2 extends HandlebarsApplicationMixin(ActorSheetV2)
├── static DEFAULT_OPTIONS            → classes, position, actions, window
├── static PARTS                      → template parts
├── tabGroups                         → tab configuration
├── async _prepareContext(options)     → same logic as getData()
├── _onRender(context, options)       → post-render setup
├── static action handlers            → one per user interaction
└── _onDrop(event)                    → unified drop handler
```

### Event Handler Mapping (25+ handlers)

#### Item Management (6)
| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.item-edit` | `editItem` | `data-item-id` |
| `.item-delete` | `deleteItem` | `data-item-id` |
| `.item-create` | `createItem` | `data-type` |
| `.item-equip` | `toggleEquip` | `data-item-id` |
| `.ammo-remove` | `removeAmmo` | `data-ammo-id`, `data-weapon-id` |
| `.ammo-edit-btn` | `editAmmo` | `data-item-id` |

#### Combat (4)
| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.weapon-attack-btn` | `weaponAttack` | `data-item-id` |
| `.weapon-damage-btn` | `weaponDamage` | `data-item-id` |
| `.weapon-unjam-btn` | `weaponUnjam` | `data-item-id` |
| `.upgrade-remove` | `removeUpgrade` | `data-upgrade-id`, `data-weapon-id` |

#### Rolls (2)
| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.rollable[rollType=characteristic]` | `rollCharacteristic` | `data-characteristic`, `data-label` |
| `.rollable[rollType=skill]` | `rollSkill` | `data-skill`, `data-label` |

#### Display/Chat (9)
| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.talent-show` | `showTalent` | `data-item-id` |
| `.trait-show` | `showTrait` | `data-item-id` |
| `.implant-show` | `showImplant` | `data-item-id` |
| `.demeanour-show` | `showDemeanour` | `data-item-id` |
| `.history-show` | `showHistory` | `data-item-id` |
| `.critical-show` | `showCritical` | `data-item-id` |
| `.psychic-power-show` | `showPsychicPower` | `data-item-id` |
| `.psychic-power-use` | `usePsychicPower` | `data-item-id` |
| `.special-ability-show` | `showSpecialAbility` | `data-item-id` |

#### Squad Mode (1)
| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.squad-ability-activate` | `activateSquadAbility` | `data-item-id` |

#### Modifiers (4)
| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.modifier-create` | `createModifier` | — |
| `.modifier-edit` | `editModifier` | `data-modifier-id` |
| `.modifier-delete` | `deleteModifier` | `data-modifier-id` |
| `.modifier-toggle` | `toggleModifier` | `data-modifier-id` |

#### Effects (2)
| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.effect-control` | `manageEffect` | effect data |
| `.effect-toggle` | `toggleEffect` | `data-effect-id` |

#### Other (4)
| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.chapter-remove` | `removeChapter` | — |
| `.specialty-remove` | `removeSpecialty` | — |
| `.history-remove` | `removeHistory` | `data-history-id`, `data-armor-id` |
| `.section-toggle` | `toggleSection` | `data-section` |

#### Drag-and-Drop (3 drop zones)
| V1 Handler | V2 Method | Notes |
|------------|-----------|-------|
| `_onDropItemOnItem` | `_onDrop` | Ammo→weapon, upgrade→weapon, history→armor |
| `_onDropChapter` | `_onDrop` | Chapter assignment |
| `_onDropSpecialty` | `_onDrop` | Specialty assignment |

### PARTS Strategy

**Option A — Single template per type (start here):**
```javascript
static PARTS = {
  sheet: {
    template: "systems/deathwatch/templates/actor/actor-character-sheet.hbs",
    scrollable: [".skills-container", ".items-list"]
  }
};
get template() {
  return `systems/deathwatch/templates/actor/actor-${this.actor.type}-sheet.hbs`;
}
```

**Option B — Multi-part (refactor later):**
```javascript
static PARTS = {
  header: { template: "systems/deathwatch/templates/actor/parts/v2-header.hbs" },
  characteristics: { template: "...", scrollable: [".skills-container"] },
  gear: { template: "...", scrollable: [".items-list"] },
  biography: { template: "...", scrollable: [""] },
  psychicPowers: { template: "..." },
  effects: { template: "..." }
};
```

### Data Preparation
`getData()` → `_prepareContext()` is a rename. The `_prepareCharacterData()`, `_prepareNPCData()`, `_prepareEnemyData()`, and `_prepareItems()` methods are pure data manipulation — they transfer unchanged.

### Scroll Position
V2 handles via `scrollable` in PARTS — replaces manual `_skillsScrollTop` tracking.

### Drag-and-Drop
jQuery → native DOM in drop handlers:
```javascript
// V1: let targetItemId = $(event.currentTarget).data('itemId');
// V2: let targetItemId = event.currentTarget.dataset.itemId;
```

---

## Phase 4: ItemSheet → ItemSheetV2

17 item type templates. Simpler than ActorSheet.

### Event Handler Mapping (9 handlers)

| V1 Selector | V2 Action | Data Attributes |
|-------------|-----------|-----------------|
| `.modifier-create` | `createModifier` | — |
| `.modifier-edit` | `editModifier` | `data-modifier-id` |
| `.modifier-delete` | `deleteModifier` | `data-modifier-id` |
| `.modifier-toggle` | `toggleModifier` | `data-modifier-id` |
| `.weapon-attack` | `weaponAttack` | — |
| `.weapon-damage` | `weaponDamage` | — |
| `.history-remove` | `removeHistory` | `data-history-id` |
| `.quality-remove` | `removeQuality` | `data-quality-id` |
| `.quality-value` change | `changeQualityValue` | `data-quality-id` |

### PARTS — Single template per type
```javascript
static PARTS = {
  sheet: { template: "systems/deathwatch/templates/item/item-{{type}}-sheet.hbs" }
};
```

### Height Override
```javascript
_onFirstRender(context, options) {
  if (this.document.type === 'psychic-power' || this.document.type === 'special-ability') {
    this.setPosition({ height: 624 });
  }
}
```

### Templates to Update (17)
All `item-*-sheet.html` files need `data-action` attributes replacing class-based handlers. Most only need modifier button updates. Weapon and armor sheets have the most changes.

### Drop Handlers
Weapon quality drops on weapon sheets, armor history drops on armor sheets — same logic, jQuery → native DOM.

---

## Phase 5: Template Updates

All interactive elements need `data-action` attributes:
```handlebars
{{!-- V1 --}}
<a class="item-edit" data-item-id="{{item._id}}"><i class="fas fa-edit"></i></a>

{{!-- V2 --}}
<button type="button" data-action="editItem" data-item-id="{{item._id}}"><i class="fas fa-edit"></i></button>
```

### Files to Update
- 4 actor templates (`actor-*-sheet.html`)
- 17 actor partials (`templates/actor/parts/`)
- 17 item templates (`item-*-sheet.html`)
- 1 UI template (`cohesion-panel.html`)

### CSS Considerations
- `<button>` has different default styling than `<a>` — may need CSS adjustments
- V2 sheets may have different wrapper elements — verify `.deathwatch.sheet.actor` selectors still match
- Ensure `DEFAULT_OPTIONS.classes` includes same classes as V1

---

## Phase 6: Test Infrastructure

### New Mocks Needed (`tests/setup.mjs`)

```javascript
// ApplicationV2 mock
global.foundry.applications = {
  api: {
    ApplicationV2: class ApplicationV2 { ... },
    HandlebarsApplicationMixin: (Base) => class extends Base { ... },
    DialogV2: {
      wait: jest.fn().mockResolvedValue(null),
      prompt: jest.fn().mockResolvedValue(null),
      confirm: jest.fn().mockResolvedValue(true)
    }
  },
  sheets: {
    ActorSheetV2: class { static mixin(...m) { ... } },
    ItemSheetV2: class { static mixin(...m) { ... } }
  }
};
```

### Test Files Affected
- `tests/setup.mjs` — add V2 mocks (keep V1 during transition)
- `tests/sheets/actor-sheet.test.mjs` — update for V2 API
- `tests/sheets/actor-sheet-renown.test.mjs` — update for V2 API
- `tests/sheets/actor-sheet-talents-traits.test.mjs` — update for V2 API
- `tests/helpers/roll-dialog-builder.test.mjs` — update for DialogV2

### Tests NOT Affected
- All pure function tests (combat, modifiers, XP, skills, cohesion, modes)
- DataModel tests
- Document tests
- Weapon quality tests

---

## Feature Flag Strategy

```javascript
game.settings.register('deathwatch', 'useV2Sheets', {
  name: 'Use ApplicationV2 Sheets (Experimental)',
  hint: 'Enable the new sheet architecture. Requires reload.',
  scope: 'client', config: true, type: Boolean, default: false,
  onChange: () => window.location.reload()
});

const useV2 = game.settings.get('deathwatch', 'useV2Sheets');
const ActorSheetClass = useV2 ? DeathwatchActorSheetV2 : DeathwatchActorSheet;
const ItemSheetClass = useV2 ? DeathwatchItemSheetV2 : DeathwatchItemSheet;
Actors.registerSheet("deathwatch", ActorSheetClass, { makeDefault: true });
Items.registerSheet("deathwatch", ItemSheetClass, { makeDefault: true });
```

Remove flag and V1 classes after validation.

---

## What Transfers Unchanged
- All TypeDataModel classes (`src/module/data/`)
- All pure helper functions (combat, modifiers, XP, skills, cohesion, modes)
- Document shells (`actor.mjs`, `item.mjs`)
- Data preparation logic (`_prepareCharacterData`, `_prepareItems`, etc.)
- Compendium data and build pipeline
- All constants, config, debug utilities

---

## Migration Order Summary
1. **Dialogs** — unblocks everything, removes most widespread deprecation
2. **CohesionPanel** — simplest Application, good practice
3. **ActorSheet** — largest, most complex
4. **ItemSheet** — follows ActorSheet patterns
5. **Templates** — update markup for `data-action`
6. **Tests** — update mocks and sheet tests

---

## Validation Checklist

### Dialogs
- [ ] All ~30 dialogs open and function
- [ ] No `Dialog` deprecation warnings
- [ ] Form values read correctly from V2 callbacks
- [ ] Cancel returns null/undefined

### CohesionPanel
- [ ] Opens via scene control button
- [ ] +1 / -1 / Recalculate / Edit / Set Leader / Challenge all work
- [ ] Mode toggle works
- [ ] Active abilities display and deactivate
- [ ] Re-renders on setting changes
- [ ] Auto-drop on zero Cohesion
- [ ] Socket communication (player Squad Mode)

### ActorSheet
- [ ] All 4 actor types render (character, NPC, enemy, horde)
- [ ] All tabs navigate correctly
- [ ] Characteristic and skill rolls work
- [ ] Weapon attack/damage/unjam work
- [ ] Item CRUD works
- [ ] Drag-and-drop (chapter, specialty, ammo, upgrades, histories) works
- [ ] Modifier CRUD works
- [ ] Collapsible sections work
- [ ] Scroll position preserved
- [ ] Psychic power use works
- [ ] Special ability activation works

### ItemSheet
- [ ] All 17 item types render
- [ ] Modifier CRUD works
- [ ] Weapon quality add/remove/value-change works
- [ ] Armor history add/remove works
- [ ] Drop handlers work
- [ ] Psychic power / special ability height correct

### Tests
- [ ] All 1458+ tests pass
- [ ] No V1 deprecation warnings in console

---

## Related Files
- `quickref.md` — V1 vs V2 comparison card, gotchas, debugging
- `examples.md` — System-specific V2 code skeletons and DialogV2 examples
