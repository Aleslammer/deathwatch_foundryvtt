# Phase 5: Hooks, Scene Controls, and Settings

## Goal
Update all hook registrations, scene control integration, and world settings to v14 API.

## 1. Scene Controls (`getSceneControlButtons`)

### Current (v13)
```javascript
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
```

### v14 Changes
The `getSceneControlButtons` hook signature changed in v14. Controls are now structured differently. Verify the exact v14 API and update accordingly. The hook may now pass an array or use a different property structure.

**Action**: Test on v14, update property names as needed.

## 2. World Settings Registration

### Current (v13)
```javascript
game.settings.register('deathwatch', 'cohesion', {
  name: 'Kill-team Cohesion',
  scope: 'world',
  config: false,
  type: Object,
  default: { value: 0, max: 0 }
});
```

### v14 Changes
v14 may require `type` to use `foundry.data.fields` instead of native JS types:
```javascript
// Possible v14 pattern
game.settings.register('deathwatch', 'cohesion', {
  name: 'Kill-team Cohesion',
  scope: 'world',
  config: false,
  type: new foundry.data.fields.ObjectField(),
  default: { value: 0, max: 0 }
});
```

**Settings to update** (5 total):
| Setting | Current Type | Possible v14 Type |
|---------|-------------|-------------------|
| `cohesion` | `Object` | `ObjectField` or keep `Object` |
| `squadLeader` | `String` | `StringField` or keep `String` |
| `cohesionModifier` | `Number` | `NumberField` or keep `Number` |
| `cohesionDamageThisRound` | `Boolean` | `BooleanField` or keep `Boolean` |
| `activeSquadAbilities` | `Array` | `ArrayField` or keep `Array` |

**Action**: Test on v14 — if native types still work, no change needed. If deprecated, migrate to field types.

## 3. Hook Signature Changes

### Hooks to Audit

| Hook | File | Current Usage | v14 Status |
|------|------|---------------|------------|
| `init` | `deathwatch.mjs` | Standard | Unchanged |
| `ready` | `deathwatch.mjs` | Standard | Unchanged |
| `hotbarDrop` | `deathwatch.mjs` | `(bar, data, slot)` | Verify signature |
| `renderChatMessage` | `deathwatch.mjs` | `(message, html)` | May change to `renderChatMessageHTML` |
| `updateCombat` | `deathwatch.mjs` | `(combat, changed)` | Verify signature |
| `updateSetting` | `deathwatch.mjs` | `(setting)` | Verify signature |
| `updateActor` | `deathwatch.mjs` | `(actor, changes, options, userId)` | Verify signature |
| `createActor` | `deathwatch.mjs` | `(actor, options, userId)` | Verify signature |
| `createActiveEffect` | `deathwatch.mjs` | `(effect, options, userId)` | Verify signature |
| `deleteActiveEffect` | `deathwatch.mjs` | `(effect, options, userId)` | Verify signature |
| `getSceneControlButtons` | `deathwatch.mjs` | `(controls)` | Changed — see above |

### renderChatMessage
This is the most likely to change. v14 may rename it or change the `html` parameter from jQuery to native Element:

```javascript
// v13 (current)
Hooks.on('renderChatMessage', (message, html) => {
  html.find('.apply-damage-btn').click(async (ev) => { ... });
});

// v14 (possible)
Hooks.on('renderChatMessage', (message, html) => {
  // html may be a native Element instead of jQuery
  html.querySelectorAll('.apply-damage-btn').forEach(btn => {
    btn.addEventListener('click', async (ev) => { ... });
  });
});
```

**This is a HIGH IMPACT change** — we have ~10 chat button handlers in `renderChatMessage`.

## 4. Combat/Initiative Override

### Current
```javascript
const originalRollInitiative = Combat.prototype.rollInitiative;
Combat.prototype.rollInitiative = async function(ids, options = {}) { ... };
```

### v14 Changes
Prototype override may still work, but v14 might provide a cleaner hook or override point. Verify that `Combat.prototype.rollInitiative` is still the correct override target.

## 5. Sheet Registration

### Current
```javascript
Actors.unregisterSheet("core", ActorSheet);
Actors.registerSheet("deathwatch", DeathwatchActorSheet, { makeDefault: true });
Items.unregisterSheet("core", ItemSheet);
Items.registerSheet("deathwatch", DeathwatchItemSheet, { makeDefault: true });
```

### v14 Changes
If migrating to V2 sheets, registration changes:
```javascript
Actors.unregisterSheet("core", ActorSheet);
Actors.registerSheet("deathwatch", DeathwatchActorSheetV2, { makeDefault: true });
Items.unregisterSheet("core", ItemSheet);
Items.registerSheet("deathwatch", DeathwatchItemSheetV2, { makeDefault: true });
```

The `unregisterSheet` call may need to reference the V1 class name or may not be needed if V1 was never registered.

## 6. CONFIG Changes

### Current
```javascript
CONFIG.Combat.initiative = { formula: "1d10 + @agBonus + @initiativeBonus", decimals: 2 };
CONFIG.Combat.turnMarker = { path: "systems/deathwatch/icons/aquila.png", animation: "pulse" };
CONFIG.statusEffects = DW_STATUS_EFFECTS;
```

### v14 Changes
- `CONFIG.Combat.turnMarker` may have changed structure
- `CONFIG.statusEffects` may have moved or changed format
- Verify all CONFIG assignments

## Migration Steps

1. Load system on v14, document all hook-related console errors
2. Fix `getSceneControlButtons` hook
3. Fix `renderChatMessage` hook (jQuery → native DOM if needed)
4. Verify settings registration
5. Verify CONFIG assignments
6. Test initiative override
7. Test all hooks fire correctly

## Validation
- [ ] Scene control button appears and toggles CohesionPanel
- [ ] All chat message buttons work (apply damage, shocking, toxic, etc.)
- [ ] World settings save and load correctly
- [ ] Initiative dialog appears and rolls work
- [ ] Combat tracker advances turns correctly
- [ ] On Fire detection on turn advance works
- [ ] Actor creation auto-folder assignment works
- [ ] Active effect create/delete re-renders sheet
- [ ] Hotbar drop creates macros
- [ ] Status effects display correctly
- [ ] Turn marker displays
