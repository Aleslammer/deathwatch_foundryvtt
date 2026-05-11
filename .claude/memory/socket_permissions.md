---
name: socket_permissions
description: Pattern for player actions on GM-owned actors via socket routing
type: feedback
---

Players cannot directly update GM-owned actors (Foundry document permissions). Use socket routing.

**Pattern:**
1. Check permissions: `game.user.isGM || actor.testUserPermission(game.user, "OWNER")`
2. If no permission: emit socket event with action data
3. GM receives socket message and executes with GM permissions

**Implementation locations:**
- Socket registration: `src/module/init/socket.mjs` (`_registerSocketListener()`)
- Usage: Check permission before `actor.update()` or `actor.system.receiveDamage()`

**Example:** 
- Damage application: `src/module/data/actor/horde.mjs` lines 84-96
- Socket handler: `src/module/init/socket.mjs` lines 54-66

**Why:** Foundry enforces document-level permissions, not field-level. No way to grant "damage only" access without full OWNER permission.

**How to apply:** When adding player-initiated actions that modify GM-owned actors, add socket routing with permission check. Route through `game.socket.emit('system.deathwatch', { type, actorId, data })` and handle in socket listener (GM-only).
