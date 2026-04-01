# Cohesion — Manual Testing Scenarios

## Prerequisites
- At least 2 character actors created (e.g., "Palarius" and "Theron")
- At least 1 enemy actor with a weapon that has the Blast quality
- A scene with tokens for the characters and enemy
- GM logged in for most tests; a second browser/incognito for player tests

---

## Phase 1 — Cohesion Calculation

### 1.1 Set Squad Leader
1. Open Foundry as GM
2. On the Cohesion panel, click ♛ (Set Leader)
3. Select a character from the dropdown
4. Click Confirm
5. **Expected**: Cohesion value and max update to match the leader's Fellowship Bonus + Rank + Command modifiers. Leader name appears on the panel.

### 1.2 Verify Calculation
1. Open the squad leader's character sheet
2. Note their Fellowship value, Rank, and Command skill level (untrained/trained/+10/+20)
3. Calculate expected max: `floor(FS / 10) + rank modifier (0/+1/+2) + command modifier (0/+1/+2/+3)`
4. **Expected**: Panel max matches your calculation

### 1.3 Recalculate with GM Modifier
1. Click ⟳ (Recalculate) on the panel
2. Verify the breakdown shows correct FS Bonus, Rank, and Command values
3. Enter a GM Modifier (e.g., +1 for good snacks)
4. Click Recalculate
5. **Expected**: Max increases by 1. Current value capped at new max if it was higher.

### 1.4 Negative GM Modifier
1. Click ⟳ (Recalculate)
2. Set GM Modifier to -2
3. Click Recalculate
4. **Expected**: Max decreases by 2. Current value capped at new max.

### 1.5 Change Squad Leader
1. Click ♛ (Set Leader)
2. Select a different character
3. Click Confirm
4. **Expected**: Cohesion recalculates from the new leader's stats. Current value resets to new max (fresh mission start).

### 1.6 Tooltip Breakdown
1. Hover over the Cohesion value/max numbers on the panel
2. **Expected**: Tooltip shows breakdown (FS Bonus, Rank, Command, GM Modifier if non-zero, total)

---

## Phase 2 — Panel UI

### 2.1 Panel Visibility
1. Load Foundry as GM
2. **Expected**: Cohesion panel appears as a floating window at top center

### 2.2 Panel Visible to Players
1. Log in as a player in a second browser/incognito
2. **Expected**: Cohesion panel appears showing the same value/max and leader name as the GM sees

### 2.3 GM-Only Buttons
1. As a player, look at the Cohesion panel
2. **Expected**: Only the 🎲 (Challenge) button is visible. The +1, −1, ⟳, ✎, ♛ buttons are hidden.

### 2.4 Manual Edit
1. As GM, click ✎ (Edit)
2. Set Current to 3 and Maximum to 7
3. Click Save
4. **Expected**: Panel shows 3 / 7

### 2.5 +1 / −1 Buttons
1. Click + (Recover)
2. **Expected**: Value increases by 1, chat message posted "⚔ Cohesion Recovered"
3. Click − (Lose)
4. **Expected**: Value decreases by 1, chat message posted "⚔ Cohesion Lost"

### 2.6 +1 at Maximum
1. Use Edit to set value equal to max
2. Click + (Recover)
3. **Expected**: Notification "Cohesion is already at maximum." Value unchanged.

### 2.7 −1 at Zero
1. Use Edit to set value to 0
2. Click − (Lose)
3. **Expected**: Notification "Cohesion is already at 0." Value unchanged.

### 2.8 Panel Cannot Be Closed
1. Click the ✕ close button on the panel window
2. **Expected**: Panel stays open (close is prevented)

### 2.9 Reactivity
1. As GM, click + or change leader
2. Check the player's browser
3. **Expected**: Player's panel updates in real-time to show the new values

### 2.10 Panel Draggable
1. Drag the panel by its title bar to a new position
2. **Expected**: Panel moves freely during the session

---

## Phase 3 — Cohesion Damage

### 3.1 Cohesion Damage from Blast Weapon
1. Set Cohesion to 5/7 via Edit
2. Place a character token and an enemy token on the scene
3. Target the character token
4. Attack with a weapon that has the **Blast** quality
5. Roll damage — ensure the raw damage total is **10 or more**
6. Click "Apply Damage" on the chat message
7. **Expected**: After damage is applied, a second chat message appears: "⚠ Cohesion Damage!" with Rally Test and Accept buttons

### 3.2 No Trigger Below 10 Damage
1. Set Cohesion to 5/7
2. Attack a character with a Blast weapon
3. Roll damage — ensure raw damage is **9 or less**
4. Click "Apply Damage"
5. **Expected**: No Cohesion damage prompt appears

### 3.3 No Trigger Without Qualifying Quality
1. Attack a character with a weapon that has **Tearing** but NOT Accurate/Blast/Devastating
2. Roll 10+ damage and click "Apply Damage"
3. **Expected**: No Cohesion damage prompt appears

### 3.4 Trigger from Accurate Weapon
1. Attack a character with a weapon that has the **Accurate** quality
2. Roll 10+ damage and click "Apply Damage"
3. **Expected**: Cohesion damage prompt appears

### 3.5 Rally Test — Success
1. Trigger a Cohesion damage prompt (3.1)
2. Click "🛡 Rally Test (Command/Fellowship)"
3. **Expected**: d100 is rolled vs the squad leader's Command total or Fellowship (whichever is higher). If the roll succeeds, chat shows "Rally Successful! Cohesion damage negated." Cohesion value unchanged.

### 3.6 Rally Test — Failure
1. Trigger a Cohesion damage prompt
2. Click "🛡 Rally Test"
3. If the roll fails:
4. **Expected**: Chat shows "Rally Failed!" Cohesion decreases by 1. Panel updates.

### 3.7 Accept Cohesion Damage
1. Trigger a Cohesion damage prompt
2. Click "✗ Accept Cohesion Damage"
3. **Expected**: Cohesion decreases by 1. Chat message confirms. Panel updates.

### 3.8 One Damage Per Round Cap
1. Set Cohesion to 5/7
2. Trigger Cohesion damage and Accept it (Cohesion now 4/7)
3. Attack the same or another character with another Blast weapon, 10+ damage
4. Click "Apply Damage"
5. **Expected**: No second Cohesion damage prompt appears (already damaged this round)

### 3.9 Round Reset
1. After 3.8, advance the combat round in the combat tracker
2. Attack a character with a Blast weapon, 10+ damage, click "Apply Damage"
3. **Expected**: Cohesion damage prompt appears again (round cap was reset)

### 3.10 No Trigger at Zero Cohesion
1. Use Edit to set Cohesion to 0/7
2. Attack a character with a Blast weapon, 10+ damage, click "Apply Damage"
3. **Expected**: No Cohesion damage prompt (nothing to lose)

### 3.11 Damage Against Enemy (No Trigger)
1. Attack an **enemy** actor (not a character) with a Blast weapon, 10+ damage
2. Click "Apply Damage"
3. **Expected**: No Cohesion damage prompt (only characters trigger it)

---

## Phase 5 (Preview) — Cohesion Challenge

### 5.1 Challenge Roll — Single Character
1. Log in as a player who owns exactly one character
2. Click 🎲 (Challenge) on the panel
3. **Expected**: 1d10 is rolled immediately. Chat shows "Cohesion Challenge — [name]" with the roll vs current Cohesion, and PASSED or FAILED.

### 5.2 Challenge Roll — Multiple Characters
1. Log in as a player who owns multiple characters (or as GM)
2. Click 🎲 (Challenge)
3. **Expected**: Dialog prompts to select which Battle-Brother is making the challenge
4. Select one and click Roll
5. **Expected**: 1d10 rolled, result posted to chat

### 5.3 Challenge Pass/Fail
1. Set Cohesion to 6 via Edit
2. Roll a challenge
3. **Expected**: Roll of 1-6 = PASSED (green), Roll of 7-10 = FAILED (red)

---

## Edge Cases

### E.1 No Squad Leader Assigned
1. Fresh world with no leader set
2. Click ⟳ (Recalculate)
3. **Expected**: Warning notification "No squad leader assigned."

### E.2 Panel Shows 0/0 Initially
1. Fresh world, no leader set
2. **Expected**: Panel shows "0 / 0" and "Leader: None"

### E.3 Leader Deleted
1. Set a squad leader
2. Delete that actor
3. Reload Foundry
4. **Expected**: Panel shows "Leader: None". Recalculate warns about no leader.
