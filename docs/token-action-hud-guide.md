# Token Action HUD Integration Guide

## Overview

The Deathwatch system integrates with **Token Action HUD Core** to provide quick access to character actions directly from selected tokens. When enabled, clicking a token displays a radial menu with weapons, skills, characteristics, and combat actions.

---

## Enabling Token Action HUD

### Prerequisites

1. Install **Token Action HUD Core** module from Foundry's module browser
2. Enable Token Action HUD Core in your world

### Enable Deathwatch Integration

1. Open **Game Settings** (⚙️ icon)
2. Navigate to **System Settings** → **Deathwatch**
3. Enable **"Enable Token Action HUD Integration"**
4. Reload Foundry to activate the feature

---

## Using the Action HUD

### Accessing Actions

1. Select one or more tokens on the canvas
2. The Token Action HUD will appear with available actions organized into categories
3. Click any action to execute it immediately

### Action Categories

The HUD organizes actions into the following groups:

#### **Combat Actions**

- **Weapons** — Attack and Damage rolls for equipped weapons
  - _Attack_ — Rolls BS/WS test against the weapon's skill
  - _Damage_ — Rolls damage dice for the weapon

#### **Skills**

- **Basic Skills** — Skills usable untrained (Awareness, Climb, Dodge, etc.)
- **Advanced Skills** — Skills requiring training (Medicae, Tech-Use, etc.)
  - Only shows skills the character has trained

#### **Characteristics**

- Direct tests for all 9 characteristics:
  - **WS** (Weapon Skill), **BS** (Ballistic Skill), **S** (Strength), **T** (Toughness)
  - **Ag** (Agility), **Int** (Intelligence), **Per** (Perception), **WP** (Willpower), **Fel** (Fellowship)

---

## Combat Actions Explained

### Weapon Actions

When you click a weapon action:

- **Attack** — Opens the attack dialog (if settings require), then rolls the appropriate test (BS for ranged, WS for melee)
- **Damage** — Rolls damage dice immediately (skips dialog if settings configured that way)

**Range and Quality Modifiers:**

- The system automatically applies range modifiers, weapon qualities, and aiming bonuses
- Jammed weapons show a warning and won't fire until Un-Jammed or Reloaded

### Reload / Un-Jam

- **Reload** — Full action to reload weapon (clears jammed state and restores ammo)
- **Un-Jam** — Tech-Use test to clear jam without reloading (keeps remaining ammo)

Both actions are available in combat and respect action economy rules.

### Extinguish

If a character is **On Fire**, the _Extinguish_ action appears in Combat Actions:

- Rolls Agility test to put out flames
- Success removes the On Fire condition
- Failure keeps the character burning (continues taking damage each round)

---

## Skills and Characteristics

### Skill Tests

Click any skill to initiate a skill test:

- Opens the skill test dialog (if enabled in settings)
- Applies characteristic bonus + skill training modifiers
- Rolls d100 against target number

**Basic vs Advanced:**

- _Basic skills_ always appear (usable untrained)
- _Advanced skills_ only appear if character has them trained

### Characteristic Tests

Click a characteristic to roll a direct characteristic test:

- Uses characteristic value + 1d100
- Common for contested tests, environmental hazards, etc.

---

## Customizing the Layout

The Token Action HUD layout, positioning, and appearance are controlled by **Token Action HUD Core** settings:

1. Open **Game Settings** → **Module Settings** → **Token Action HUD Core**
2. Adjust:
   - HUD position (radial, horizontal, vertical)
   - Button size and spacing
   - Visibility rules (always show, hover, click)

Refer to Token Action HUD Core documentation for detailed customization options.

---

## Permissions and GM-Owned Tokens

### Player Permissions

- Players can use the HUD on tokens they own
- Players can use the HUD on GM-owned tokens if they have at least **Limited** permission on the underlying actor

### GM-Owned Tokens (Socket Routing)

When a player uses the HUD on a GM-owned token:

- The action is routed through Foundry's socket system to the GM
- The GM executes the action with their permissions
- Results appear in chat for all players to see

**This allows players to:**

- Roll attacks for enemy NPCs during combats
- Test enemy skills when the GM delegates control
- Use actions on tokens the GM has granted them permission to control

---

## Future Phases

The current implementation includes **Combat Actions, Skills, and Characteristics**. Future phases will add:

- **Talents** — One-click activation of active talents
- **Psychic Powers** — Focus Power tests and power activation
- **Squad Mode Abilities** — Solo Mode and Squad Mode ability toggles
- **Custom Actions** — Macros and special abilities

Stay tuned for updates!

---

## Troubleshooting

### HUD Not Appearing

- Verify Token Action HUD Core is installed and enabled
- Check that "Enable Token Action HUD Integration" is enabled in System Settings
- Reload Foundry after enabling the setting

### Actions Not Working

- Ensure you have permission to control the selected token
- Check that the actor sheet has the items/skills/characteristics expected
- GMs: Check console for socket errors if players report issues

### Duplicate Actions

If you see duplicate weapon or skill actions, report this as a bug. The system includes anti-duplication tests to prevent this.

---

_The Machine Spirit stands ready to serve. May your rolls be blessed by the Omnissiah._ ⚙️
