# Phase 3 — Opposed Tests ✅ Complete

## Goal
Support psychic powers that require an Opposed Willpower Test between the psyker and the target.

## Which Powers Are Opposed?

Powers with `opposed: "Yes"` in their schema:

| Power | Class | Description |
|-------|-------|-------------|
| Compel | Telepathy | Force targets to follow a command |
| Dominate | Telepathy | Take over target's mind |
| Mind Probe | Telepathy | Read target's thoughts |
| Mind Scan | Telepathy | Detect nearby minds |
| Hypnotic Gaze | Tyranid | Immobilize target |
| Leech Essence | Tyranid | Drain life from target |
| Paroxysm | Tyranid | Reduce target WS/BS |
| The Horror | Tyranid | Fear-based flee |

## Implementation

### Flow
1. Psyker succeeds Focus Power Test on an opposed power
2. Chat message includes "⚔ Opposed Willpower Test: [Target] (WP [value])" button
3. GM clicks button → dialog opens with:
   - **Target WP** — pre-filled from targeted token, editable
   - **Misc Modifier** — for situational bonuses/penalties
   - **Manual Roll** — leave blank to auto-roll 1d100, or type a value
4. "Resolve" button calculates and posts result to chat

### Pure Functions
- `resolveOpposedTest(psykerDoS, targetWP, targetRoll, miscMod)` — returns `{ targetSuccess, targetDoS, psykerWins, netDoS, targetNumber }`
- `buildOpposedResultMessage(targetName, targetWP, targetRoll, result, powerName, psykerDoS)` — HTML with POWER MANIFESTS / POWER RESISTED

### Rules
- Psyker DoS > Target DoS → Power manifests
- Target DoS ≥ Psyker DoS → Power resisted (tie goes to defender)
- Net DoS shown for power strength calculations

### Chat Output
```
⚔ Opposed Willpower Test — Compel
Psyker: 3 Degrees of Success
Ork Warboss WP 35: rolled 42 — FAILED (0 DoS)
POWER MANIFESTS (3 net DoS)
```

### Files Modified
- `combat/psychic-combat.mjs` — added `resolveOpposedTest()`, `buildOpposedResultMessage()`, oppose button in dialog callback
- `deathwatch.mjs` — added `.psychic-oppose-btn` chat handler with oppose dialog

### Tests: 14 new (8 resolveOpposedTest + 6 buildOpposedResultMessage)
