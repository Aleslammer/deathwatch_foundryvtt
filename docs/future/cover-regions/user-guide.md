# User Guide: Cover Regions

## For Game Masters

### Quick Start

1. **Open your scene** in Foundry VTT
2. **Select the Region tool** from the Drawing Tools sidebar (left panel)
3. **Draw a region** around the cover area (click vertices, right-click to finish)
4. **Right-click the region** → Configure
5. **Behaviors tab** → Add Behavior → "Deathwatch: Cover"
6. **Select cover type** from dropdown
7. **Save** and you're done!

When players move tokens into the region, they automatically get cover bonuses. When they leave, bonuses are removed.

### Step-by-Step Tutorial

#### Creating Your First Cover Region

**Scenario**: You want to add a low stone wall that protects characters' legs.

1. **Navigate to your combat scene**
   - Click Scenes tab (top)
   - Select your scene
   - Ensure you're in GM mode (not player view)

2. **Open the Region tool**
   - Look at the left sidebar (Drawing Tools)
   - Click the icon that looks like a polygon/shape
   - Select "Regions" tab at top

3. **Draw the region shape**
   - Click on the canvas to place the first vertex
   - Continue clicking to outline the cover area
   - Follow the shape of the wall on your map
   - Right-click to complete the shape
   - The region will appear as a translucent overlay

4. **Name the region** (optional but recommended)
   - Double-click the region or right-click → Configure
   - Give it a descriptive name like "Low Stone Wall - East Side"
   - This helps you identify regions later

5. **Add the Cover behavior**
   - In the region configuration dialog, click "Behaviors" tab
   - Click "Add Behavior" button
   - From the dropdown, select "Deathwatch: Cover"
   - A new behavior section appears

6. **Configure the cover type**
   - In the behavior section, find "Cover Type" dropdown
   - Select "Low Wall (+2 AP)"
   - This means the region protects legs with +2 armor points

7. **Adjust visual settings** (optional)
   - Click "Appearance" tab
   - Set Fill Color (suggestion: yellow/orange for light cover)
   - Set Fill Opacity to 30-50% so terrain is still visible
   - Add a border if desired

8. **Save the region**
   - Click "Save Changes" at bottom of dialog

9. **Test it!**
   - Select a token
   - Move it into the region
   - Watch for notification: "Character is now in cover (+2 AP: legs)"
   - Open character sheet → Effects tab → see "Cover: Low Wall" effect
   - Move token out → notification: "Character has left cover"

### Cover Type Reference

| Cover Type | Armor Bonus | Protected Locations | When to Use |
|------------|-------------|---------------------|-------------|
| **Low Wall** | +2 AP | Legs only | Sandbags, barricades, low walls, underbrush, rubble piles |
| **High Wall** | +4 AP | Legs + Body | Building walls, stone barriers, vehicle sides, large crates |
| **Full Cover** | +4 AP | All but head | Tree trunks, doorframes, consoles, pillars (must lean out to shoot) |
| **Reinforced** | +8 AP | All but head | Bunkers, vehicle hulls, rockcrete fortifications, blast doors |

### Visual Design Best Practices

#### Color Coding

Use consistent colors to help players identify cover at a glance:

- **Light cover (Low Wall)**: Yellow or orange
- **Standard cover (High Wall)**: Blue or cyan
- **Full cover**: Green
- **Heavy cover (Reinforced)**: Purple or red

#### Transparency Settings

- Set region fill opacity to **30-50%**
- This keeps terrain visible while showing coverage area
- Use border/stroke for better visibility if needed

#### Labeling

- Name regions descriptively: "East Wall - Heavy Cover", "Rubble Pile A - Light"
- Add text labels on the map layer for player reference
- Consider adding cover icons (shield symbols) at key positions

#### Layering

Ensure regions are:
- **Above** background tiles (so they're visible)
- **Below** tokens (so tokens don't disappear under regions)
- Region layer order is usually correct by default

### Common Scenarios

#### Urban Warfare Map

**Barricades and Debris**:
- Use "Low Wall" for sandbag positions
- Draw regions following barricade shapes
- Color code: yellow/orange

**Building Corners**:
- Use "High Wall" for building walls
- Create regions along exterior walls
- Tokens can shoot around corners with partial protection

**Doorways**:
- Use "Full Cover" for doorframes
- Small region just inside doorway
- Character must expose themselves to shoot out

**Bunker Positions**:
- Use "Reinforced" for fortified positions
- Larger regions inside bunkers
- Heavy protection, hard to dislodge defenders

#### Forest/Jungle Map

**Dense Underbrush**:
- Use "Low Wall" for ground-level vegetation
- Large, irregular regions
- Protects legs from low shots

**Tree Trunks**:
- Use "Full Cover" for individual large trees
- Small circular regions around trunks
- Character can peek around to shoot

**Fallen Logs**:
- Use "Low Wall" for horizontal logs
- Linear regions following log shape

#### Spaceship Interior

**Consoles and Equipment**:
- Use "Full Cover" for control consoles
- Rectangular regions around equipment
- Tech-priests and crew use these during shipboard combat

**Bulkheads**:
- Use "High Wall" for structural supports
- Vertical regions at support pillars

**Cargo Containers**:
- Use "High Wall" or "Reinforced" depending on contents
- Large rectangular regions

### Advanced Techniques

#### Overlapping Regions

You can create overlapping regions for corners or complex positions:

**Example**: Building corner with walls on two sides
- Region 1: High Wall (north wall) - protects from north
- Region 2: High Wall (east wall) - protects from east
- Token in corner gets both effects (stacking armor bonuses)

**Benefits**:
- More realistic (corner position = better protection)
- Emergent tactics (players seek best positions)

**Caution**: Don't overuse - 2-3 overlapping regions max or bonuses become excessive

#### Region Templates

Create reusable region shapes for common cover types:

1. Create a well-designed cover region
2. Right-click → Copy
3. Paste in other locations
4. Adjust size/shape as needed

**Tip**: Keep a "template scene" with example regions for quick copying

#### Dynamic Cover (Manual)

Simulate destructible cover by manually disabling regions:

1. Right-click region → Configure
2. Behaviors tab → Disable the behavior
3. Change region color to gray (to show it's destroyed)

When cover is destroyed by explosives/heavy weapons, disable the region. Tokens inside lose bonuses immediately.

### Troubleshooting

#### "Cover effect isn't applying"

**Check**:
- Is the region behavior enabled? (Region config → Behaviors tab)
- Is the token's actor valid? (Unlinked tokens need synthetic actors)
- Is there a console error? (F12 → Console tab)
- Try deleting and recreating the region

#### "Effect isn't removing when token leaves"

**Check**:
- Did token actually exit region? (Check region boundaries)
- Try manually deleting the effect (character sheet → Effects tab → delete)
- If persistent, refresh the page

#### "Multiple effects from same region"

This shouldn't happen (system prevents duplicates). If it does:
- Manually delete duplicate effects
- Report as a bug

#### "Cover bonuses seem too high"

**Check**:
- Are multiple regions overlapping? (Intentional stacking)
- Is cover type correct? (Maybe High Wall instead of Low Wall)
- Consider using weaker cover types if balance is an issue

### GM Tips

#### Balancing Cover

- **Too much cover** = combat becomes static, players don't move
- **Too little cover** = players get shredded, feel unfair
- **Sweet spot**: 40-60% of map has some cover, with varying quality

#### Encouraging Movement

- Place objectives away from best cover positions
- Mix cover types (force players to choose position vs. protection)
- Have enemies flank (cover only helps from certain directions)

#### Narrative Cover

- Add region even for minor cover (crates, furniture)
- Creates immersive feeling ("the world reacts to tactics")
- Players will naturally use terrain

#### Performance

- Limit to ~20-30 regions per scene (more = slower region detection)
- Combine small adjacent regions into larger ones where possible
- Delete unused regions

### Macros for Cover

#### Show All Cover Regions

*Future enhancement - not yet implemented*

Macro to highlight all cover regions on current scene:

```javascript
// Highlight all cover regions (shows which areas provide cover)
// Planned feature - coming soon
```

#### Apply Cover Manually

If needed, apply cover without regions:

```javascript
// Select a token, then run this macro
const actor = token.actor;
if (!actor) {
  ui.notifications.warn('No token selected');
  return;
}

// Manually apply low wall cover
await actor.createEmbeddedDocuments('ActiveEffect', [{
  name: 'Manual Cover: Low Wall',
  icon: 'icons/svg/shield.svg',
  changes: [
    { key: 'system.armor.rightLeg', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2 },
    { key: 'system.armor.leftLeg', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2 }
  ]
}]);

ui.notifications.info(`Applied cover to ${actor.name}`);
```

### Integration with Other Rules

#### Called Shots

When players use Called Shot maneuver (Core p. 245):
- If they target a location protected by cover, armor bonus applies
- Example: Low wall protects legs → calling shot to head bypasses cover

#### Blast/Flame Weapons

Current behavior: Cover applies normally
- Blast weapons hit multiple locations → cover protects applicable locations
- Example: Blast hits legs + body, low wall protects legs but not body

*Future enhancement*: Special blast/cover interaction rules

#### Hordes

Current behavior: Hordes do NOT benefit from cover
- Hordes use single armor value, cover system is location-based
- Design decision: Hordes already have high armor, represent swarm that can't all hide

*Future enhancement*: Optional setting to enable horde cover (average bonus)

### Quick Reference Card

**Creating Cover**:
1. Drawing Tools → Regions
2. Draw shape
3. Add Behavior → "Deathwatch: Cover"
4. Select type → Save

**Cover Types**:
- Low Wall (+2 AP, legs)
- High Wall (+4 AP, legs + body)
- Full Cover (+4 AP, all but head)
- Reinforced (+8 AP, all but head)

**Visual Best Practices**:
- Color code by cover strength
- 30-50% opacity
- Label regions clearly

**Troubleshooting**:
- F12 → Console for errors
- Check region behavior enabled
- Manually delete stuck effects

---

## For Players

### What is Cover?

When your token enters certain areas of the map (marked by translucent regions), your character automatically gains armor bonuses to specific body parts.

### How It Works

**Entering Cover**:
1. You move your token into a cover region (GM will have marked these)
2. Notification appears: "Your character is now in cover (+X AP: locations)"
3. Your character sheet updates with a new Active Effect
4. You're protected! Damage to covered locations is reduced

**Leaving Cover**:
1. You move your token out of the region
2. Notification appears: "Your character has left cover"
3. Active Effect automatically removes
4. Armor values return to normal

### Checking Your Cover

**Character Sheet**:
- Click your character portrait
- Click "Effects" tab
- Look for effects starting with "Cover:"
- Hover over effect to see details

**Token**:
- Select your token
- Look for shield icon overlay (if GM enabled)
- Translucent region boundary shows coverage area

### Tactical Tips

**Know Your Cover**:
- **Low cover** (yellow) = protects legs, must crouch/kneel
- **High cover** (blue) = protects legs and body, good all-around
- **Full cover** (green) = protects everything but head, must expose to shoot
- **Heavy cover** (purple/red) = maximum protection, fortified positions

**Movement Tactics**:
- Move from cover to cover (don't run through open ground)
- Use cover when reloading or activating abilities
- Corner positions (overlapping cover) = best protection

**Combat Tactics**:
- Enemies in cover = harder to damage
- Consider flanking or Called Shots to unprotected areas
- Blast/grenade weapons can hit multiple locations (some covered, some not)

### Common Questions

**Q: Does cover affect my attacks?**
A: Currently no. You can shoot from cover without penalty. (Future enhancement: Optional attack penalties)

**Q: Does cover protect from behind?**
A: Currently yes. Cover works from all directions. (Future enhancement: Directional cover)

**Q: Can I stack cover from multiple sources?**
A: Yes. Multiple regions = multiple effects = higher bonuses. But don't be greedy - best positions often have tactical tradeoffs!

**Q: Do I have to stay still in cover?**
A: No. As long as your token is inside the region, you have cover. You can act normally (shoot, reload, etc.)

**Q: Does cover protect my whole squad?**
A: Each token individually. Multiple characters can share the same cover region.
