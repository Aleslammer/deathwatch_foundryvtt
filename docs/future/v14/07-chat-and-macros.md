# Phase 6: Chat Message Handlers and Hotbar Macros

## Goal
Update all chat message button handlers and hotbar macro system for v14 compatibility.

## 1. Chat Message Button Handlers

### Current Pattern (v13)
All chat button handlers are registered in `renderChatMessage` hook in `deathwatch.mjs`:
```javascript
Hooks.on('renderChatMessage', (message, html) => {
  html.find('.apply-damage-btn').click(async (ev) => {
    const button = $(ev.currentTarget);
    const damage = parseInt(button.data('damage'));
    // ...
  });
});
```

### v14 Changes
If `html` becomes a native Element (not jQuery), all handlers need updating:

```javascript
Hooks.on('renderChatMessage', (message, html) => {
  // Native DOM approach
  for (const btn of html.querySelectorAll('.apply-damage-btn')) {
    btn.addEventListener('click', async (ev) => {
      const damage = parseInt(ev.currentTarget.dataset.damage);
      // ...
    });
  }
});
```

### Button Handlers to Migrate (10 total)

| Button Class | Purpose | Data Attributes |
|-------------|---------|-----------------|
| `.apply-damage-btn` | Apply damage to target | damage, penetration, location, damageType, ~15 more |
| `.shocking-test-btn` | Shocking toughness test | armorValue, stunRounds, actorId, sceneId, tokenId |
| `.toxic-test-btn` | Toxic toughness test | penalty, actorId, sceneId, tokenId |
| `.char-damage-btn` | Characteristic damage | formula, characteristic, actorId, sceneId, tokenId |
| `.force-channel-btn` | Force weapon channeling | attackerId, psyRating, targetId, sceneId, tokenId |
| `.roll-critical-btn` | Apply critical effect | location, damageType, actorId |
| `.cohesion-rally-btn` | Rally test | leaderId |
| `.cohesion-damage-accept-btn` | Accept cohesion damage | — |
| `.extinguish-btn` | Extinguish fire | actorId, sceneId, tokenId |
| `.psychic-oppose-btn` | Opposed WP test | powerName, psykerDos, targetName, targetWp, targetId, sceneId, tokenId |

### Migration Pattern
Replace jQuery `$(ev.currentTarget)` with native DOM:

```javascript
// V1 (jQuery)
const button = $(ev.currentTarget);
const damage = parseInt(button.data('damage'));
const isPrimitive = button.data('isPrimitive') === 'true';

// V2 (Native DOM)
const button = ev.currentTarget;
const damage = parseInt(button.dataset.damage);
const isPrimitive = button.dataset.isPrimitive === 'true';
```

**Note**: jQuery `.data()` auto-converts camelCase (`data-damage-type` → `damageType`). Native `dataset` also does this. The behavior should be identical.

### resolveActor() Helper
The `resolveActor()` function currently uses jQuery:
```javascript
function resolveActor(button, actorIdAttr = 'targetId') {
  const sceneId = button.data('sceneId');
  const tokenId = button.data('tokenId');
  // ...
}
```

Update to accept either jQuery or native Element:
```javascript
function resolveActor(button, actorIdAttr = 'targetId') {
  const getData = (key) => button.dataset ? button.dataset[key] : button.data(key);
  const sceneId = getData('sceneId');
  const tokenId = getData('tokenId');
  // ...
}
```

Or just convert to native DOM since all callers will be updated.

## 2. Hotbar Macros

### Current Pattern
```javascript
Hooks.on("hotbarDrop", (bar, data, slot) => {
  if (data.type === "Item") {
    createItemMacro(data, slot);
    return false;
  }
});
```

### v14 Changes
- Verify `hotbarDrop` hook signature unchanged
- Verify `Macro.create()` API unchanged
- Verify `game.user.assignHotbarMacro()` API unchanged
- Verify `Item.fromDropData()` API unchanged

### rollItemMacro()
Uses `Item.fromDropData()` and `Dialog` (migrate Dialog in Phase 1):
```javascript
function rollItemMacro(itemUuid, options = {}) {
  Item.fromDropData({ type: 'Item', uuid: itemUuid }).then(item => {
    // Dialog for weapon Attack/Damage choice
    // Direct call for psychic powers
    // item.roll() for others
  });
}
```

The weapon Attack/Damage choice dialog needs DialogV2 migration (Phase 1).

## 3. Chat Message HTML Generation

Several helpers generate HTML with button classes and data attributes:
- `CombatDialogHelper.buildDamageMessage()` — generates apply-damage buttons
- `ChatMessageBuilder` — generates item cards
- `FireHelper.buildOnFireMessage()` — generates extinguish buttons
- `ModeHelper.buildSquadActivationMessage()` — generates mode change messages
- `CohesionHelper` — generates rally buttons

These HTML generators don't need changes — they output HTML strings that are inserted into chat. The button classes and data attributes remain the same. Only the event listener registration changes (in the `renderChatMessage` hook).

## Migration Steps

1. Update `renderChatMessage` hook to use native DOM (if html parameter changes)
2. Update `resolveActor()` to use native DOM
3. Update all 10 button handlers to use `dataset` instead of jQuery `.data()`
4. Update `rollItemMacro()` dialog to DialogV2 (if not done in Phase 1)
5. Verify hotbar drop hook works
6. Test all chat buttons end-to-end

## Validation
- [ ] Apply Damage button works (all data attributes read correctly)
- [ ] Shocking test button works
- [ ] Toxic test button works
- [ ] Characteristic damage button works
- [ ] Force channel button works
- [ ] Critical effect button works
- [ ] Cohesion rally button works
- [ ] Cohesion damage accept button works
- [ ] Extinguish button works
- [ ] Opposed WP test button works
- [ ] Hotbar weapon macro → Attack/Damage dialog works
- [ ] Hotbar psychic power macro → Focus Power dialog works
- [ ] Hotbar generic item macro → chat card works
- [ ] Flame Attack GM macro works
- [ ] On Fire Round GM macro works
