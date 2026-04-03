# Hotbar Macros

## Basic Usage

Drag any item from a character sheet to the hotbar to create a macro:

- **Weapons** → Click to choose Attack or Damage, then fill in the combat dialog
- **Psychic Powers** → Click to open the Focus Power Test dialog directly
- **Other Items** → Click to post the item description to chat

## Weapon Macro Presets

You can customize weapon macros to pre-load combat options, saving time for frequently used attack configurations. Right-click a weapon macro on the hotbar and select **Edit** to modify the macro command.

### Default Macro (no presets)
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy");
```
This shows the Attack/Damage choice dialog, then the full attack dialog with all options at defaults.

### Adding Presets

Add a second argument with your desired options:

```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  // Your options here
});
```

When options are provided, the Attack/Damage choice dialog is skipped and goes straight to the attack.

### Available Options

#### Ranged Weapons

| Option | Type | Default | Values |
|--------|------|---------|--------|
| `aim` | number | `0` | `0` = None, `1` = Half (+10), `2` = Full (+20) |
| `rof` | number | `0` | `0` = Single, `1` = Semi-Auto (+10), `2` = Full-Auto (+20) |
| `calledShot` | boolean | `false` | `true` = Called Shot (-20) |
| `calledShotLocation` | string | — | `"Head"`, `"Right Arm"`, `"Left Arm"`, `"Body"`, `"Right Leg"`, `"Left Leg"` |
| `runningTarget` | boolean | `false` | `true` = Running Target (-20) |
| `miscModifier` | number | `0` | Any integer (positive or negative) |
| `skipDialog` | boolean | `false` | `true` = roll immediately, `false` = show dialog with values pre-filled |

#### Melee Weapons

| Option | Type | Default | Values |
|--------|------|---------|--------|
| `aim` | number | `0` | `0` = None, `1` = Half (+10), `2` = Full (+20) |
| `allOut` | boolean | `false` | `true` = All Out Attack (+20) |
| `charge` | boolean | `false` | `true` = Charge (+10) |
| `calledShot` | boolean | `false` | `true` = Called Shot (-20) |
| `calledShotLocation` | string | — | `"Head"`, `"Right Arm"`, `"Left Arm"`, `"Body"`, `"Right Leg"`, `"Left Leg"` |
| `runningTarget` | boolean | `false` | `true` = Running Target (-20) |
| `miscModifier` | number | `0` | Any integer (positive or negative) |
| `skipDialog` | boolean | `false` | `true` = roll immediately, `false` = show dialog with values pre-filled |

#### Special Options

| Option | Type | Description |
|--------|------|-------------|
| `action` | string | `"damage"` to skip straight to the damage roll (uses last attack data) |

### skipDialog Behavior

- **`skipDialog: false`** (default) — The attack dialog opens with your preset values already filled in. You can review and adjust before clicking Attack.
- **`skipDialog: true`** — The attack rolls immediately with your preset values. No dialog appears. Range is still auto-calculated from token positions.

### Examples

#### Semi-Auto Burst (one-click)
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  rof: 1,
  skipDialog: true
});
```

#### Full-Auto with +10 Bonus (one-click)
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  rof: 2,
  miscModifier: 10,
  skipDialog: true
});
```

#### Called Shot to the Head (one-click)
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  calledShot: true,
  calledShotLocation: "Head",
  skipDialog: true
});
```

#### Aimed Semi-Auto (pre-fill dialog)
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  aim: 2,
  rof: 1
});
```
Opens the dialog with Full Aim and Semi-Auto already selected. You can adjust before rolling.

#### Melee Charge (one-click)
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  charge: true,
  skipDialog: true
});
```

#### Damage Only
```javascript
game.deathwatch.rollItemMacro("Actor.xxx.Item.yyy", {
  action: "damage"
});
```

### Validation

The system validates your presets before rolling:

- **Rate of Fire**: If you set `rof: 2` (Full-Auto) but the weapon only supports `S/3/-`, the macro will warn you and abort rather than silently falling back to a different fire mode.
- **Ammunition**: If the weapon doesn't have enough rounds loaded for the selected rate of fire, the macro will warn and abort.
- **Weapon State**: Jammed weapons and weapons with no loaded ammo are rejected (same as the normal attack dialog).

### Tips

- You can create multiple macros for the same weapon with different presets (e.g., one for single shot, one for full-auto)
- Only include the options you want to change — everything else uses defaults
- Target a token before clicking the macro so range modifiers are calculated automatically
- The `calledShotLocation` option is only used when `calledShot` is `true`
