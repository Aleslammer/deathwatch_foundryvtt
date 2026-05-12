# Automated Animations Setup Guide

**For:** Deathwatch Foundry VTT System  
**Version:** 2026-05-12  
**Integration Type:** Minimal (Data Exposure Pattern)

---

## Overview

This guide walks through configuring the **Automated Animations (A-A)** module to display dynamic weapon animations in Deathwatch. The Deathwatch system embeds animation metadata in chat messages, and the A-A module reads this data to trigger animations.

**What you get:**
- Automatic weapon animations when attacking (bolters, las weapons, plasma, melta, flamers)
- Dynamic multi-round animations (full-auto bursts show multiple projectiles)
- Per-weapon animation overrides via `animationKey` field

---

## Prerequisites

### Required Modules

Install these modules from the Foundry VTT setup screen:

1. **Sequencer** - Animation playback engine
   - Module ID: `sequencer`
   - Required for all animations

2. **JB2A Free** (or JB2A Patreon) - Animation assets
   - Module ID: `JB2A_DnD5e` (free) or `jb2a_patreon` (paid)
   - Provides bolt/las/plasma/melta/flame animations

3. **Automated Animations** - Animation automation system
   - Module ID: `autoanimations`
   - Calls the Deathwatch macro to trigger animations

### Verify Installation

1. Launch Foundry VTT
2. Open a Deathwatch world
3. Go to **Settings → Manage Modules**
4. Verify all three modules are checked (active)
5. Click **Save Module Settings**
6. Reload the world

---

## Configuration Methods

There are two ways to configure animations:

| Method | Use Case | Pros | Cons |
|--------|----------|------|------|
| **Global Recognition** | All ranged weapons | Fast setup, works automatically | Less granular control |
| **Per-Weapon Config** | Specific weapons need custom animations | Fine control, per-weapon overrides | Must configure each weapon |

**Recommendation:** Start with Global Recognition for all weapons, then add per-weapon overrides only where needed.

---

## Method 1: Global Automatic Recognition (Recommended)

This configures all ranged weapons to use the Deathwatch animation macro automatically.

### Step-by-Step Configuration

1. **Open A-A Settings**
   - Click **Settings** (gear icon in the sidebar)
   - Click **Module Settings** tab
   - Find **Automated Animations** in the list
   - Click **"Global Automatic Recognition"** button

2. **Select Category**
   - The A-A menu opens with category tabs at the top
   - Click the **"Range"** tab (for ranged weapons)

3. **Add New Entry**
   - Click **"Add Section"** button (top of the menu)
   - A new configuration panel appears

4. **Configure Animation Entry**
   - **Name:** Enter `*` (asterisk matches all weapons)
     - _This tells A-A to apply this config to any ranged weapon_
   - **Animation Type:** Leave as "Range" (default)
   - Scroll down to the **"Add Macro"** section

5. **Configure Macro**
   - Click the **"Add Macro"** button in the section header
   - A macro configuration panel appears
   - **Macro Name:** Enter exactly: `Deathwatch Ranged Weapon Animation`
     - _This must match the macro name in the compendium_
   - **When to Play:** Select **"Macro with No Animation"**
     - _This skips A-A's built-in animation and uses only our macro_
   - Leave **Send Args** blank (not needed)

6. **Save Settings**
   - Click **"Save"** at the bottom of the A-A menu
   - Close the menu

### What This Does

- Any ranged weapon attack will trigger the Deathwatch macro
- The macro reads data from chat messages (rounds fired, weapon type, etc.)
- Animations play automatically based on weapon classification

---

## Method 2: Per-Weapon Configuration

Configure animations for specific weapons (useful for special cases or testing).

### Step-by-Step Configuration

1. **Open Weapon Item Sheet**
   - Go to your character's inventory
   - Open a ranged weapon item (e.g., Godwyn Bolter)

2. **Open A-A Configuration**
   - Look for the **"A-A"** button in the item sheet's title bar
     - _Usually near the close/minimize buttons_
   - Click the **"A-A"** button
   - The Automated Animations item menu opens

3. **Enable Customization**
   - Toggle **"Animation Enabled/Disabled"** to ON (green)
   - Toggle **"Customize Item"** to ON
     - _This allows per-weapon settings to override global config_

4. **Select Animation Type**
   - **Animation Type:** Select **"Range"** from dropdown
     - _For ranged weapons like bolters, lasguns, plasma guns_

5. **Configure Macro**
   - Scroll down to the **"Add Macro"** section
   - Click the **"Add Macro"** button
   - **Macro Name:** Enter `Deathwatch Ranged Weapon Animation`
   - **When to Play:** Select **"Macro with No Animation"**

6. **Save Item**
   - Close the A-A menu
   - The item sheet will save automatically

### Weapon-Specific Overrides

If you want a weapon to use a specific animation regardless of its name/type:

1. Open the weapon item sheet
2. Go to the **"Details"** tab (or use JSON editor)
3. Add/edit field: `system.animationKey`
4. Set value to one of:
   - `"bolt"` - Bolt/explosive projectiles (orange)
   - `"las"` - Las/energy beams (blue beam)
   - `"plasma"` - Plasma bursts (blue burst)
   - `"melta"` - Melta rays (blue ray)
   - `"flame"` - Flamer effects (fire line)
   - `""` (empty) - Auto-detect from weapon name/damage type

**Example:** A custom energy weapon named "Xenos Disintegrator" can have `animationKey: "las"` to force las-beam animation.

---

## Testing the Integration

### Basic Test

1. **Create Test Setup**
   - Place a character token on the scene
   - Place an enemy token on the scene
   - Ensure character has a ranged weapon (e.g., Bolter)

2. **Perform Attack**
   - Select your character token
   - Target the enemy token (right-click → Target)
   - Open the weapon item and click **"Attack"**
   - Choose fire mode (Single, Semi-Auto, or Full-Auto)
   - Roll the attack

3. **Verify Animation**
   - ✅ Orange projectile(s) should animate from your token to the target
   - ✅ Multiple projectiles for multi-shot attacks (semi/full-auto)
   - ✅ Check browser console (F12) for: `[Deathwatch A-A] Played bolt animation (X rounds)`

### Test Different Weapon Types

| Weapon Type | Expected Animation | JB2A File |
|-------------|-------------------|-----------|
| Bolter | Orange projectile | `jb2a.bullet.orange` |
| Lasgun | Blue beam | `jb2a.lasershot.blue` |
| Plasma Gun | Blue burst | `jb2a.bullet.blue` |
| Meltagun | Blue ray | `jb2a.ray_of_frost.blue` |
| Flamer | Orange fire line | `jb2a.breath_weapons.fire.line.orange` |

### Test Multi-Shot Attacks

1. Use a weapon with semi-auto or full-auto capability
2. Select **Semi-Auto** (typically 3 rounds)
   - ✅ Should see 3 projectiles fire in sequence (150ms delay between)
3. Select **Full-Auto** (5-10 rounds based on degrees of success)
   - ✅ Should see multiple projectiles matching the rounds fired

### Test Animation Override

1. Edit a lasgun weapon
2. Set `system.animationKey` to `"plasma"`
3. Fire the weapon
4. ✅ Should see plasma animation (blue burst) instead of las beam

---

## Troubleshooting

### Animation Doesn't Play

**Check Console Logs (F12):**
- Look for `[Deathwatch A-A]` messages
- Common messages and fixes:

| Console Message | Meaning | Fix |
|----------------|---------|-----|
| `Sequencer module not active` | Sequencer not installed/enabled | Enable Sequencer in Module Settings |
| `Missing required data (sourceToken or item)` | A-A isn't detecting the attack | Check Global Recognition config, verify macro name |
| `No targets, skipping animation` | No target selected | Target an enemy token before attacking |
| `No weapon data found in recent chat messages` | Chat message missing data attributes | Verify Deathwatch system is up-to-date |
| No A-A logs at all | A-A not calling the macro | Check macro name spelling, verify Global Recognition entry |

**Verify Macro Exists:**
1. Go to **Compendium Packs** sidebar
2. Expand **Deathwatch Macros** pack
3. Look for **"Deathwatch Ranged Weapon Animation"** entry
4. If missing: rebuild packs with `npm run build:packs`

**Verify A-A Configuration:**
1. Settings → Automated Animations → Global Automatic Recognition
2. Range tab → verify `*` entry exists
3. Check macro name matches exactly (case-sensitive)
4. Ensure "Macro with No Animation" is selected

### Wrong Animation Plays

**Weapon classification priority:**
1. **animationKey** field (highest priority)
2. Weapon name pattern matching
3. Damage type (lowest priority)

**Fix:**
- Check weapon's `system.animationKey` field
- Verify weapon name includes expected keyword ("bolter", "las", etc.)
- Check damage type (`system.dmgType`)

### Animations Play Twice

**Cause:** Both Global Recognition AND per-weapon config are active.

**Fix:**
- Either: Remove Global Recognition entry for this weapon
- Or: Disable "Customize Item" on the weapon's A-A menu

### Animations Are Slow/Laggy

**Possible causes:**
- Too many simultaneous animations
- Large Sequencer cache
- JB2A Patreon module uses high-res assets

**Fixes:**
- Use JB2A Free instead of Patreon (lower resolution)
- Clear Sequencer cache: Settings → Sequencer → Clear Cache
- Reduce simultaneous effects (full-auto on multiple enemies)

### Only First Shot Animates

**Cause:** `data-rounds-fired` attribute not being read correctly.

**Fix:**
1. Open browser console (F12)
2. Fire a multi-shot attack
3. Look for: `[Deathwatch A-A] Played bolt animation (X rounds)`
4. If it shows `(1 rounds)` but you fired more:
   - Check chat message HTML (inspect element)
   - Verify `data-rounds-fired` attribute is present with correct value

---

## Advanced Configuration

### Custom Animation Timing

Edit the macro in Compendium → Deathwatch Macros → Deathwatch Ranged Weapon Animation:

**Find this section in `getAnimationConfig()`:**
```javascript
const configs = {
  bolt: { file: "jb2a.bullet.orange", delay: 150 },
  las: { file: "jb2a.lasershot.blue", delay: 100 },
  // ...
};
```

**Modify delay values (in milliseconds):**
- Lower delay = faster burst fire
- Higher delay = slower, more deliberate shots

**Example:** Make bolters fire faster:
```javascript
bolt: { file: "jb2a.bullet.orange", delay: 100 }, // Changed from 150
```

### Using Different JB2A Assets

Edit animation file paths in `getAnimationConfig()`:

**Example:** Use red bolter projectiles:
```javascript
bolt: { file: "jb2a.bullet.red", delay: 150 },
```

**Find available JB2A assets:**
1. Enable Developer Mode: Settings → Configure Settings → Developer Mode
2. Open browser console (F12)
3. Run: `Sequencer.Database.entries`
4. Expand `jb2a` to browse available animations

### Add New Weapon Types

Edit the macro's `classifyWeapon()` function:

**Example:** Add autocannon support:
```javascript
if (name.includes('autocannon')) {
  return 'autocannon';
}
```

Then add config in `getAnimationConfig()`:
```javascript
autocannon: { file: "jb2a.bullet.01.orange", delay: 120 },
```

---

## Disabling Animations

### Disable for All Weapons

1. Settings → Module Settings → Automated Animations
2. Click "Global Automatic Recognition"
3. Range tab → Delete the `*` entry
4. Save

### Disable for Specific Weapon

1. Open weapon item sheet
2. Click "A-A" button
3. Toggle "Animation Enabled/Disabled" to OFF
4. Close menu

### Disable Entire Module

1. Settings → Manage Modules
2. Uncheck "Automated Animations"
3. Save and reload

**Note:** Deathwatch combat will still work normally - animations are optional.

---

## Performance Tips

1. **Use JB2A Free** instead of Patreon for lower file sizes
2. **Disable animations for NPCs** (only enable for player characters)
3. **Limit full-auto shots** in high-enemy-count combats
4. **Clear Sequencer cache** periodically (Settings → Sequencer → Clear Cache)
5. **Use hardware acceleration** in your browser (Settings → Performance)

---

## FAQ

**Q: Do animations work for thrown weapons (grenades)?**  
A: Basic yes, but scatter animations are not yet implemented. Grenades that hit show animations; grenades that miss and scatter do not animate the arc/landing point.

**Q: Can players without A-A installed see animations?**  
A: No, animations are client-side. Each player needs Sequencer + JB2A + A-A installed.

**Q: Do animations work in Theater of Mind (no tokens)?**  
A: No, animations require tokens on a scene canvas. Theater of Mind mode won't show animations.

**Q: Can I use custom animation files?**  
A: Yes! Upload your files to Foundry, then edit the macro's `getAnimationConfig()` to point to your file paths.

**Q: Why doesn't my weapon animate?**  
A: Check the troubleshooting section above. Most common: macro name typo, no target selected, modules not enabled.

**Q: Can I have different animations per ammo type?**  
A: Not currently. The system would need to be extended to read ammo item data attributes. This is a future enhancement.

---

## Support & Feedback

**Deathwatch System Issues:**
- GitHub: https://github.com/[your-repo]/deathwatch_foundryvtt/issues

**Automated Animations Issues:**
- A-A Wiki: https://wiki.theripper93.com/free/autoanimations
- A-A Discord: Join TheRipper93's Discord server

**JB2A Asset Issues:**
- JB2A Patreon: https://www.patreon.com/JB2A
- JB2A Free: Available in Foundry module browser

---

## Changelog

**2026-05-12** - Initial setup guide created
- Covers Global Recognition and per-weapon configuration
- Includes troubleshooting section
- Documents all 6 weapon types

---

_Praise the Omnissiah for the sacred animation communion protocols._ ⚙️
