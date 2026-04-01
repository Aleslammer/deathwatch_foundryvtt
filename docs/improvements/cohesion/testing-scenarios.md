# Cohesion — Manual Testing Scenarios

## Prerequisites
- At least 2 character actors created (e.g., "Palarius" and "Theron")
- At least 1 enemy actor with a weapon that has the Blast quality
- A scene with tokens for the characters and enemy
- GM logged in for most tests; a second browser/incognito for player tests
- Ensure `cohesionDamageThisRound` is reset before damage tests (advance a combat round or reload)

---

## Phase 1 — Cohesion Calculation

### 1.1 Set Squad Leader
1. On the Cohesion panel, click ♛ (Set Leader)
2. Select a character from the dropdown, click Confirm
3. **Expected**: Cohesion value and max update. Leader name appears on the panel.

### 1.2 Verify Calculation
1. Open the squad leader's character sheet
2. Note their Fellowship value, Rank, and Command skill level
3. Calculate: `floor(FS / 10) + rank mod (0/+1/+2) + command mod (0/+1/+2/+3)`
4. **Expected**: Panel max matches your calculation

### 1.3 Recalculate with GM Modifier
1. Click ⟳ (Recalculate), verify the breakdown is correct
2. Enter a GM Modifier (e.g., +1), click Recalculate
3. **Expected**: Max increases by 1. Current capped at new max.

### 1.4 Negative GM Modifier
1. Click ⟳, set GM Modifier to -2, click Recalculate
2. **Expected**: Max decreases by 2. Current capped at new max.

### 1.5 Change Squad Leader
1. Click ♛, select a different character, click Confirm
2. **Expected**: Cohesion recalculates from new leader. Current resets to new max.

### 1.6 Tooltip Breakdown
1. Hover over the Cohesion value/max numbers
2. **Expected**: Tooltip shows FS Bonus, Rank, Command, GM Modifier (if non-zero), total

---

## Phase 2 — Panel UI

### 2.1 Panel Visibility
1. Load Foundry as GM
2. **Expected**: Cohesion panel appears as a floating window at top center

### 2.2 Panel Visible to Players
1. Log in as a player in a second browser
2. **Expected**: Panel shows same value/max and leader name as GM sees

### 2.3 GM-Only Buttons
1. As a player, look at the panel
2. **Expected**: Only 🎲 (Challenge) button visible. +1, −1, ⟳, ✎, ♛ are hidden.

### 2.4 Manual Edit
1. As GM, click ✎ (Edit), set Current to 3 and Maximum to 7, click Save
2. **Expected**: Panel shows 3 / 7

### 2.5 +1 / −1 Buttons
1. Click + → **Expected**: Value +1, chat message "⚔ Cohesion Recovered"
2. Click − → **Expected**: Value −1, chat message "⚔ Cohesion Lost"

### 2.6 +1 at Maximum
1. Set value equal to max, click +
2. **Expected**: Notification "Cohesion is already at maximum."

### 2.7 −1 at Zero
1. Set value to 0, click −
2. **Expected**: Notification "Cohesion is already at 0."

### 2.8 Panel Cannot Be Closed
1. Click the ✕ close button
2. **Expected**: Panel stays open

### 2.9 Reactivity
1. As GM, click + or change leader. Check player's browser.
2. **Expected**: Player's panel updates in real-time

### 2.10 Panel Draggable
1. Drag the panel by its title bar
2. **Expected**: Panel moves freely during the session

---

## Phase 3 — Cohesion Damage

### 3.1 Cohesion Damage from Blast Weapon
1. Set Cohesion to 5/7 via Edit. Ensure combat is active (for round tracking).
2. Attack a character with a **Blast** weapon, roll **10+ raw damage**
3. Click "Apply Damage"
4. **Expected**: Damage applied, then "⚠ Cohesion Damage!" prompt with Rally and Accept buttons

### 3.2 No Trigger Below 10 Damage
1. Attack a character with a Blast weapon, raw damage **9 or less**, click "Apply Damage"
2. **Expected**: No Cohesion damage prompt

### 3.3 No Trigger Without Qualifying Quality
1. Attack a character with a **Tearing** weapon (no Accurate/Blast/Devastating), 10+ damage
2. **Expected**: No Cohesion damage prompt

### 3.4 Trigger from Accurate Weapon
1. Attack a character with an **Accurate** weapon, 10+ damage, click "Apply Damage"
2. **Expected**: Cohesion damage prompt appears
3. **Troubleshooting**: If no prompt, check console for errors. Ensure `cohesionDamageThisRound` is false (advance combat round) and cohesion > 0.

### 3.5 Rally Test — Success
1. Trigger a Cohesion damage prompt, click "🛡 Rally Test"
2. **Expected**: d100 rolled vs max(Command total, Fellowship). On success: "Rally Successful!" Cohesion unchanged.

### 3.6 Rally Test — Failure
1. Trigger a Cohesion damage prompt, click "🛡 Rally Test"
2. **Expected**: On failure: "Rally Failed!" Cohesion −1. Panel updates.

### 3.7 Accept Cohesion Damage
1. Trigger a Cohesion damage prompt, click "✗ Accept Cohesion Damage"
2. **Expected**: Cohesion −1. Chat confirms. Panel updates.

### 3.8 One Damage Per Round Cap
1. Accept Cohesion damage (3.7). Then trigger another qualifying attack.
2. **Expected**: No second prompt (already damaged this round)

### 3.9 Round Reset
1. After 3.8, advance the combat round. Trigger another qualifying attack.
2. **Expected**: Cohesion damage prompt appears again (cap reset)

### 3.10 No Trigger at Zero Cohesion
1. Set Cohesion to 0/7. Trigger a qualifying attack.
2. **Expected**: No prompt (nothing to lose)

### 3.11 Damage Against Enemy (No Trigger)
1. Attack an **enemy** actor with a Blast weapon, 10+ damage
2. **Expected**: No Cohesion damage prompt (only characters trigger it)

---

## Phase 4 — Cohesion Recovery

### 4.1 +1 Button Recovery (Mission Objective / GM Award / Fate Point)
1. Set Cohesion to 3/7 via Edit
2. Click + on the panel
3. **Expected**: Cohesion becomes 4/7. Chat message "⚔ Cohesion Recovered — now 4 / 7"

### 4.2 Recovery Capped at Max
1. Set Cohesion to 6/7 via Edit
2. Click + twice
3. **Expected**: First click → 7/7 with chat message. Second click → notification "Cohesion is already at maximum."

### 4.3 Recovery After Damage
1. Set Cohesion to 5/7. Accept Cohesion damage (now 4/7).
2. Click + on the panel
3. **Expected**: Cohesion becomes 5/7. Chat message confirms.

### 4.4 Player Sees Recovery
1. As GM, click +
2. Check the player's browser
3. **Expected**: Player's panel updates to show new value. Chat message visible to all.

Note: Fate Point spending does not automatically trigger Cohesion recovery. The GM clicks +1 when a player announces they spent a Fate Point, completed an objective, or earned a GM award.

---

## Phase 5 — Cohesion Challenge

### 5.1 Challenge Roll — Single Character (Player)
1. Log in as a player who owns exactly one character
2. Click 🎲 (Challenge) on the panel
3. **Expected**: 1d10 rolled immediately. Chat shows "Cohesion Challenge — [name]" with roll vs current Cohesion, PASSED (green) or FAILED (red).

### 5.2 Challenge Roll — Multiple Characters (GM)
1. As GM, click 🎲 (Challenge)
2. **Expected**: Dialog prompts to select which Battle-Brother
3. Select one, click Roll
4. **Expected**: 1d10 rolled, result posted to chat

### 5.3 Challenge Pass
1. Set Cohesion to 8 via Edit (high chance of passing)
2. Roll a challenge
3. **Expected**: Roll of 1-8 = "✓ PASSED" in green

### 5.4 Challenge Fail
1. Set Cohesion to 1 via Edit (high chance of failing)
2. Roll a challenge
3. **Expected**: Roll of 2-10 = "✗ FAILED" in red

### 5.5 Challenge at Zero Cohesion
1. Set Cohesion to 0 via Edit
2. Roll a challenge
3. **Expected**: Roll always fails (1d10 minimum is 1, which is > 0)

### 5.6 Challenge at Max Cohesion (10)
1. Set Cohesion to 10 via Edit
2. Roll a challenge
3. **Expected**: Roll always passes (1d10 maximum is 10, which is ≤ 10)

### 5.7 Challenge Visible to All
1. As a player, roll a challenge
2. Check GM's chat
3. **Expected**: Challenge result visible to all players and GM

### 5.8 No Owned Characters
1. Log in as a player with no owned character actors
2. Click 🎲 (Challenge)
3. **Expected**: Warning notification "No owned character actors found."

---

## Edge Cases

### E.1 No Squad Leader Assigned
1. Fresh world with no leader set
2. Click ⟳ (Recalculate)
3. **Expected**: Warning "No squad leader assigned."

### E.2 Panel Shows 0/0 Initially
1. Fresh world, no leader set
2. **Expected**: Panel shows "0 / 0" and "Leader: None"

### E.3 Leader Deleted
1. Set a squad leader, then delete that actor, reload Foundry
2. **Expected**: Panel shows "Leader: None". Recalculate warns about no leader.

### E.4 Cohesion Damage Round Cap Persists Across Reloads
1. Accept Cohesion damage in a round
2. Reload Foundry (without advancing the round)
3. Trigger another qualifying attack
4. **Expected**: No prompt (the `cohesionDamageThisRound` setting persists)
