---
name: horde_breaking_implementation
description: Horde breaking mechanics - turn timing, auto-break vs test triggers, condition application
type: project
---

Horde breaking rules (Deathwatch Core p. 360) implemented in `src/module/helpers/combat/horde-breaking.mjs`.

**Timing:** Check at START of horde's turn (after turn advances, before horde acts)
- Hook: `Hooks.on('updateCombat', ...)` with `if (!("turn" in changed)) return;`
- Damage tracking: `system.magnitudeThisTurn` field (reset after breaking check)

**Two separate triggers:**
1. **Auto-break:** Magnitude <25% of starting value → breaks immediately (unless Disciplined trait)
2. **Damage test:** Lost 25%+ magnitude in single turn → Willpower test required
   - Penalty: -10 if currently <50% magnitude (unless Disciplined)

**Why separate:** Auto-break checks EVERY turn start (persistent low magnitude), damage test only when damage threshold crossed.

**Condition application:** Apply BOTH "broken" and "dead" conditions
- "broken" = narrative status (visible on sheet)
- "dead" = triggers Foundry combat tracker defeated state (persists across reloads)

**Disciplined trait effects:**
- No -10 penalty at <50% magnitude
- No auto-break at <25% magnitude (still requires WP test if took 25%+ damage)

**How to apply:** Turn-based tracking requires field on actor schema + hook at turn start + reset after check. Always apply both conditions when breaking to ensure combat tracker sync.
