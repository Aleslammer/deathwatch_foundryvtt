# Cohesion & Kill-Team System

## Overview

Cohesion is a **world-level resource** stored in settings:

```javascript
game.settings.get("deathwatch", "cohesion"); // { value: 7, max: 10 }
game.settings.get("deathwatch", "squadLeader"); // Actor ID
game.settings.get("deathwatch", "cohesionModifier"); // GM modifier
game.settings.get("deathwatch", "activeSquadAbilities"); // Array of active Squad Mode abilities
```

---

## Key Files

- `src/module/helpers/cohesion.mjs` — Cohesion calculation, damage, rally
- `src/module/ui/cohesion-panel.mjs` — Floating UI panel (toggle with shield icon in Token Controls)
- `src/module/helpers/mode-helper.mjs` — Solo/Squad Mode logic

---

## Cohesion Calculation

**Formula**: Squad Leader's FS Bonus + Rank + Command skill DoS + GM modifier

**Example**:
- Squad Leader: FS 45 (Bonus 4), Rank 3, Command skill test → 2 DoS
- GM modifier: +1
- **Cohesion Max**: 4 + 3 + 2 + 1 = 10

---

## Mode Tracking

Each character has `system.mode` (`solo` or `squad`). Cohesion panel shows all characters with colored indicators:

- **Green**: Squad Mode active
- **Red**: Solo Mode active
- **Gray**: Not in combat or inactive

---

## Socket Communication

Non-GM players send `activateSquadAbility` / `deactivateSquadAbility` socket messages; GM processes them and updates world settings.

**Why socket-based?** Cohesion is a shared resource. Only GM can modify world settings, so players send requests via socket and GM processes them.

---

## Solo Mode vs Squad Mode

### Solo Mode
- Character acts independently
- No access to Squad Mode abilities
- No cohesion cost for special actions

### Squad Mode
- Character is part of the kill-team
- Can activate Squad Mode abilities (costs cohesion)
- Shares in cohesion pool benefits
- Takes damage when cohesion drops below thresholds

---

## Squad Abilities

Stored in `system.squadAbilities` on each character:

```json
{
  "squadAbilities": [
    {
      "name": "Tactical Spacing",
      "cost": 2,
      "description": "Grant all squad members +10 to Dodge tests",
      "active": false
    }
  ]
}
```

**Activation**: Player clicks "Activate" button → socket message → GM updates `activeSquadAbilities` setting → UI updates for all players

**Deactivation**: Same process in reverse, cohesion refunded

---

## Cohesion Damage

Cohesion can be damaged by:
- Mission failures
- Character deaths
- Critical events (GM discretion)

**Threshold effects** (Core Rulebook p. 268):
- **Below 4**: Squad begins to falter
- **Below 2**: Squad in disarray
- **0**: Squad breaks, all characters forced to Solo Mode

---

## Rally Tests

**Command test** (Challenging, +0) by Squad Leader to restore cohesion:
- Success: Restore 1d5 cohesion
- Each DoS: +1 additional cohesion
- Failure: No effect, can retry next round

---

_The Kill-Team protocols are sanctified. For the Emperor!_ ⚙️
