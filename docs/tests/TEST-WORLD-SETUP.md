# Test World Setup Guide

This guide provides instructions for creating a repeatable test environment for the Deathwatch system.

**Purpose:** Consistent baseline for all manual tests, enabling reset and re-run of test scenarios.

---

## Prerequisites

- Foundry VTT v13 or v14
- Deathwatch system installed and activated
- New world created with Deathwatch system

---

## Setup Overview

1. Create 4 Marine characters (Tactical, Heavy, Assault, Librarian)
2. Create 4 enemy actors (Ork Boy, Tau Fire Warrior, Tyranid Warrior, Ork Mob)
3. Set up combat scene
4. Configure cohesion settings

**Total setup time:** ~45-60 minutes

---

## Step 1: Create Marine Characters

### Marine A - "Tactical" (Ranged Specialist)

**Actor Type:** Character

**Characteristics:**
- BS: 45 (Bonus: 4)
- AG: 40 (Bonus: 4)
- TG: 40 (Bonus: 4)
- WP: 35 (Bonus: 3)

**Equipment (drag from compendiums):**
- Astartes Bolter (Tearing quality)
  - Loaded ammo: Standard Bolt rounds
  - Extra ammo: 4 reload clips in inventory
- 3× Frag Grenades (Blast 4)
- Auspex
- Deathwatch Power Armor (standard)

**Skills:**
- Awareness: +10
- Ballistic Skill Training: +10

**Wounds:** 22
**Fate Points:** 3

---

### Marine B - "Heavy" (Support Weapons)

**Actor Type:** Character

**Characteristics:**
- BS: 43 (Bonus: 4)
- STR: 45 (Bonus: 4)
- TG: 45 (Bonus: 4)

**Equipment:**
- Astartes Heavy Bolter (Storm, Tearing qualities)
  - Loaded ammo: Standard Bolt rounds
  - Extra ammo: 3 reload belts
- Astartes Flamer (Flame quality)
  - Loaded ammo: Promethium
- Deathwatch Power Armor

**Skills:**
- Ballistic Skill Training: +10
- Heavy Weapons Training: +10

**Wounds:** 23

---

### Marine C - "Assault" (Melee Specialist)

**Actor Type:** Character

**Characteristics:**
- WS: 45 (Bonus: 4)
- STR: 45 (Bonus: 4)
- AG: 42 (Bonus: 4)

**Equipment:**
- Astartes Bolt Pistol
  - Loaded ammo: Standard Bolt rounds
  - Extra ammo: 2 reload clips
- Astartes Chainsword (Tearing quality)
- Jump Pack (for charge movement tests)
- Deathwatch Power Armor

**Skills:**
- Weapon Skill Training: +10
- Acrobatics: +10

**Talents:**
- Lightning Attack (make multiple melee attacks)

**Wounds:** 21

---

### Marine D - "Librarian" (Psychic)

**Actor Type:** Character

**Characteristics:**
- WP: 50 (Bonus: 5)
- INT: 42 (Bonus: 4)
- WS: 38 (Bonus: 3)

**Equipment:**
- Force Weapon (1d10+12 R, Balanced, Force quality)
- Psychic Hood (grants "No Perils" modifier)
- Deathwatch Power Armor

**Psychic Powers (drag from compendium):**
1. **Smite** (attack power, PR-based damage)
2. **Iron Arm** (utility power, STR buff)
3. **Compel** (opposed power, targets WP)

**Psy Rating:** 4

**Skills:**
- Psyniscience: +20
- Forbidden Lore (Warp): +10

**Wounds:** 20

---

## Step 2: Create Enemy Actors

### Enemy 1: Ork Boy

**Actor Type:** Enemy

**Characteristics:**
- WS: 35, BS: 25, STR: 40, TG: 40, AG: 25

**Equipment:**
- Choppa (1d10+4 R, Primitive quality)
- Slugga (1d10+3 I, Inaccurate quality)

**Armor:** Leather (2 AP all locations)

**Wounds:** 12

---

### Enemy 2: Tau Fire Warrior

**Actor Type:** Enemy

**Characteristics:**
- BS: 40, AG: 35, TG: 30

**Equipment:**
- Pulse Rifle (1d10+5 E, range 100m)

**Armor:** Battlesuit (4 AP all locations)

**Wounds:** 10

---

### Enemy 3: Tyranid Warrior

**Actor Type:** Enemy

**Characteristics:**
- WS: 45, BS: 40, STR: 50, TG: 50, AG: 40

**Equipment:**
- Bonesword (1d10+10 R)
- Devourer (1d10+5 R, Storm quality)

**Traits:**
- Tyranid (for Hive Mind backlash tests)

**Armor:** Carapace (6 AP all locations)

**Wounds:** 25

---

### Enemy 4: Ork Mob (Horde)

**Actor Type:** Horde

**Magnitude:** 30

**Characteristics:**
- WS: 30, BS: 20, STR: 40, TG: 30

**Equipment:**
- Choppas (1d10+4 R per hit)

**Armor:** Leather scraps (2 AP)

**Wounds per magnitude:** 2

---

## Step 3: Set Up Combat Scene

**Scene Name:** "Test Combat Arena"

**Grid:** 30×30 squares (3 meters per square = 90m × 90m area)

**Zones:**
1. **Ranged Zone (North):** 20-25m separation between starting positions
   - Place 4 markers: "Marine Start N1", "Marine Start N2", "Enemy Start N1", "Enemy Start N2"
   
2. **Melee Zone (South):** Adjacent positioning (3m separation)
   - Place 4 markers: "Marine Start S1", "Marine Start S2", "Enemy Start S1", "Enemy Start S2"

3. **Cover Markers (Optional):** Place 2-3 obstacles (walls, crates) labeled "Cover" for manual modifier testing

**Lighting:** Bright light (no vision penalties)

**Token Starting Positions:**
- Marine A: Marine Start N1
- Marine B: Marine Start N2
- Marine C: Marine Start S1
- Marine D: Marine Start S2
- Enemies: Placed as needed per scenario

---

## Step 4: Configure Cohesion Settings

**Open Game Settings > Deathwatch:**

1. **Squad Leader:** Select Marine A (Tactical)
2. **Cohesion Value:** 7
3. **Cohesion Max:** 10
4. **Cohesion Modifier:** 0 (GM adjustment)

**Configure Squad Mode Ability (on Marine A's character sheet):**
- Name: "Tactical Spacing"
- Cost: 2 cohesion
- Description: "Grant all squad members +10 to Dodge tests"
- Active: No (will activate during testing)

**Set All Marines to Squad Mode:**
- Open each Marine character sheet
- Navigate to Combat tab
- Set Mode: Squad Mode (green indicator)

---

## Reset Instructions

After completing a test run, reset the test world to its initial state:

### 1. Restore Actor Health
- Open each Marine character sheet
- Set Wounds to max (Marine A: 22, Marine B: 23, Marine C: 21, Marine D: 20)
- Set Fatigue to 0
- Open each Enemy actor sheet
- Set Wounds to max (Ork Boy: 12, Tau: 10, Tyranid: 25)
- Set Ork Mob magnitude to 30

### 2. Reset Cohesion
- Open Cohesion Panel (shield icon in Token Controls)
- Adjust cohesion value to 7
- Deactivate any active Squad Mode abilities

### 3. Clear Status Effects
- Select all tokens on scene
- Right-click → Clear All Conditions
- Verify no "On Fire", "Stunned", or other statuses remain

### 4. Reload Ammunition
- Open each Marine character sheet
- Navigate to Equipment tab
- For each weapon, set ammo count to full:
  - Bolter: Full magazine + 4 reloads
  - Heavy Bolter: Full magazine + 3 reloads
  - Flamer: Full tank
  - Bolt Pistol: Full magazine + 2 reloads

### 5. Reset Token Positions
- Delete all tokens from combat scene
- Drag actors from sidebar to starting positions:
  - Marine A → Marine Start N1
  - Marine B → Marine Start N2
  - Marine C → Marine Start S1
  - Marine D → Marine Start S2
- Do not place enemy tokens (scenarios will specify placement)

### 6. Clear Combat Tracker
- Open Combat Tracker
- Click "End Combat" if active
- Remove all combatants

---

## Verification Checklist

After setup (or after reset), verify:

- ☐ All 4 Marines exist in Actors sidebar
- ☐ All 4 Enemies exist in Actors sidebar
- ☐ Combat scene has 30×30 grid with zone markers
- ☐ Cohesion settings: 7/10, Squad Leader = Marine A
- ☐ All Marines in Squad Mode (green indicator)
- ☐ Marine tokens on scene at starting positions
- ☐ No enemy tokens on scene (placed per scenario)
- ☐ Combat tracker is empty

---

## Quick Setup Script (Optional)

For faster setup, you can use a Foundry macro to automate some steps. This is optional and not required for manual testing.

```javascript
// Quick Test World Reset Macro
// Run this after each test to reset to initial state

(async () => {
  ui.notifications.info("Resetting test world...");
  
  // Reset Marine health
  const marines = game.actors.filter(a => a.type === "character");
  const maxWounds = { "Tactical": 22, "Heavy": 23, "Assault": 21, "Librarian": 20 };
  
  for (let marine of marines) {
    await marine.update({
      "system.wounds.value": maxWounds[marine.name] || 20,
      "system.fatigue.value": 0
    });
  }
  
  // Reset cohesion
  await game.settings.set("deathwatch", "cohesion", { value: 7, max: 10 });
  
  // Clear combat tracker
  if (game.combat) {
    await game.combat.delete();
  }
  
  ui.notifications.info("Test world reset complete!");
})();
```

---

_The test world stands ready, Tech-Priest. May the Omnissiah guide our validation rituals._ ⚙️
