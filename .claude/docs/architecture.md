# Architecture

## Foundry v13 TypeDataModel Pattern

The system uses Foundry v13's programmatic schema approach:

- **DataModel classes** (`src/module/data/`) define schemas and derived data computation for all actor/item types
- **Document classes** (`src/module/documents/`) are thin shells that delegate to DataModels
- Actor document: `src/module/documents/actor.mjs` (delegates to `DeathwatchActorBase` → `DeathwatchCharacter/Enemy/Horde/NPC`)
- Item document: `src/module/documents/item.mjs` (delegates to `DeathwatchItemBase` → 17 item DataModels)

---

## Rank Prerequisite System

Skills and talents have rank requirements before they can be purchased. The XP calculator returns `-1` for advances not available at the current rank.

### Skill Structure (`src/module/data/skills.json`)

```json
{
  "awareness": {
    "isBasic": true,
    "characteristic": "per",
    "descriptor": "",
    "training": {
      "trained": { "cost": 200, "rank": 1 },
      "mastered": { "cost": 300, "rank": 2 },
      "expert": { "cost": 800, "rank": 3 }
    }
  },
  "chem_use": {
    "isBasic": false,
    "characteristic": "int",
    "descriptor": "Crafting, Investigation",
    "training": {
      "trained": { "cost": 800, "rank": 7 },
      "mastered": null,
      "expert": null
    }
  }
}
```

### Talent Field (`rankRequired`)

- Talent items have a `rankRequired` field (1-8) in their schema
- `talent.system.effectiveCost` returns `-1` if character rank < required rank
- `talent.system.effectiveRankRequired` stores the effective rank after overrides

### Override System

- **Chapters** can override rank requirements (flat override) via `chapter.system.skillCosts` and `chapter.system.talentCosts`
- **Specialties** can override per rank (accumulated as character ranks up) via `specialty.system.rankCosts[rank].skills` and `specialty.system.rankCosts[rank].talents`
- Priority: Specialty (highest) → Chapter (medium) → Base (lowest)

**Example specialty override** (Apothecary gets Chem-Use at Rank 1):

```json
{
  "rankCosts": {
    "1": {
      "skills": {
        "chem_use": {
          "training": {
            "trained": { "cost": 400, "rank": 1 }
          }
        }
      }
    }
  }
}
```

---

## Polymorphic Combat System

Combat methods are defined in `DeathwatchActorBase` (`src/module/data/actor/base-actor.mjs`) and overridden as needed:

- `getArmorValue(location)` — Character looks up armor item by location; Horde uses single `system.armor` value
- `getDefenses()` — Returns armor map, natural armor, toughness bonus
- `receiveDamage(damageData)` — Main entry point for damage application (overridden by Horde for magnitude-based health)
- `receiveBatchDamage(damageArray)` — For hordes (multi-hit from Full Auto/Blast/Flame)

### Horde-Specific Combat (`src/module/data/actor/horde.mjs`)

- Health = magnitude × 10 (e.g., magnitude 30 → 300 wounds)
- Single armor value (no hit locations)
- Blast/flame hits multiply by 1.5×, explosive weapons add +1d10 per hit
- Melee DoS-based hits (1 DoS = 1 hit, 3 DoS = 1d5 hits, 5 DoS = 1d10 hits)

---

## Helper Organization

Helpers contain pure business logic (testable without Foundry globals):

### Combat Helpers (`src/module/helpers/combat/`)

- `combat.mjs` — Main combat logic (hit location, armor, damage application)
- `ranged-combat.mjs` — BS tests, range modifiers, rate of fire, jamming
- `melee-combat.mjs` — WS tests, charge, All Out Attack, Called Shot
- `horde-combat.mjs` — Magnitude damage, blast/flame/explosive hit multipliers
- `psychic-combat.mjs` — Focus Power tests, Psy Rating, Phenomena/Perils
- `weapon-quality-helper.mjs` — 24+ weapon qualities (Tearing, Accurate, Melta, Force, etc.)
- `weapon-upgrade-helper.mjs` — Weapon attachment modifiers
- `fire-helper.mjs` — Flame weapon targeting, catch fire tests, On Fire processing
- `critical-effects.mjs` — Critical damage tables (Energy/Explosive/Impact/Rending)
- `righteous-fury-helper.mjs` — Righteous Fury auto-confirm for xenos

### Character Helpers (`src/module/helpers/character/`)

- `modifier-collector.mjs` — Collects all modifiers from items/talents/chapters/traits
- `modifiers.mjs` — Applies modifiers to characteristics/skills/armor/wounds/etc.
- `xp-calculator.mjs` — XP computation, rank determination
- `rank-helper.mjs` — Rank definitions (Initiate → Battle-Brother → Veteran → etc.)
- `wound-helper.mjs` — Max wounds calculation (SB + 2×TB + advances)
- `skill-loader.mjs` — Loads skill definitions from JSON

### UI Helpers (`src/module/helpers/ui/`)

- `templates.mjs` — Preloads Handlebars templates
- `handlebars.js` — Custom Handlebars helpers

### Other Helpers

- `cohesion.mjs` — Cohesion pool calculation, damage, rally tests (migrated to FoundryAdapter ✅)
- `mode-helper.mjs` — Solo/Squad Mode activation, Squad Ability tracking
- `initiative.mjs` — Initiative dialog with modifier input
- `foundry-adapter.mjs` — Wraps Foundry API calls for testability (see [foundry-adapter.md](foundry-adapter.md))
- `constants/` — System-wide constants organized by domain (see [constants.md](constants.md))

---

## Modular Initialization Architecture

The system uses a clean modular initialization pattern (refactored 2026-04-05):

### Main Entry Point (`src/module/deathwatch.mjs`): 100 lines

- Imports all modules and delegates initialization
- Hooks.once('init'): Register settings, configure CONFIG, register hooks, register sheets
- Hooks.once('ready'): Initialize socket, register chat handlers, create system macros

### Initialization Modules (`src/module/init/`)

- `settings.mjs` — `SettingsRegistrar.register()` — All world/client settings
- `config.mjs` — `ConfigRegistrar.configure()` — CONFIG.Combat, CONFIG.Actor/Item dataModels
- `hooks.mjs` — `InitHooks.register()` — Initiative override, actor/effect/combat/scene hooks
- `socket.mjs` — `SocketHandler.initialize()` — Socket listener, cohesion panel updates
- `ready-hook.mjs` — `ReadyHook.initialize()` — Hotbar drop, combat tracker defaults, system macros

### Chat Handlers (`src/module/chat/`)

- `button-handlers.mjs` — `ChatButtonHandlers.register()` — 10 chat button handlers (apply damage, shocking test, etc.)

**Pattern**: Each module exports a single class with a static `register()` or `initialize()` method. The main entry point calls these in order. This keeps the main file under 100 lines and makes initialization logic easy to test and maintain.

---

## Token Action HUD Integration

The system integrates with **Token Action HUD Core** to provide quick access to actions from selected tokens.

### Architecture

**Location**: `src/module/token-action-hud/` (4 files)

- `action-handler.mjs` — Main integration point, implements `ActionHandler` interface required by TAH Core
- `action-builder.mjs` — Constructs action data structures (Combat, Skills, Characteristics)
- `roll-executor.mjs` — Executes actions (dispatches to macros, dialogs, combat methods)
- `socket-router.mjs` — Routes unpermissioned actions through GM via sockets

### Integration Points

**Activation**: Setting `enableTokenActionHud` must be enabled (default: `false`)

**Registration**: `src/module/init/token-action-hud.mjs` registers the action handler with TAH Core during `ready` hook

**Action Flow**:
1. TAH Core calls `actionHandler.buildSystemActions(tokens)`
2. `ActionBuilder` collects actions from actor items/skills/characteristics
3. User clicks action → TAH Core calls `actionHandler.handleAction(token, actionId)`
4. `RollExecutor` decodes actionId and dispatches to appropriate system method
5. If user lacks permission, `SocketRouter` routes through GM

### Action Encoding

Actions use pipe-delimited format: `category|type|id|extra`

**Examples**:
- `combat|weapon|<itemId>|attack` — Attack roll for weapon
- `combat|weapon|<itemId>|damage` — Damage roll for weapon
- `combat|action|reload` — Reload action
- `skill|basic|awareness` — Awareness skill test
- `characteristic|ws` — WS characteristic test

### Action Groups

```javascript
{
  combat: {
    weapons: [
      { id: 'combat|weapon|abc123|attack', name: 'Bolter (Attack)' },
      { id: 'combat|weapon|abc123|damage', name: 'Bolter (Damage)' }
    ],
    actions: [
      { id: 'combat|action|reload', name: 'Reload' },
      { id: 'combat|action|unjam', name: 'Un-Jam' },
      { id: 'combat|action|extinguish', name: 'Extinguish' }
    ]
  },
  skills: {
    basic: [...],
    advanced: [...]
  },
  characteristics: [...]
}
```

### Testing

**Roll parity enforcement**: `tests/token-action-hud/roll-parity.test.mjs` ensures TAH actions produce identical rolls to:
- Macro system (`/ra`, `/rd`, `/rs`, `/rt`)
- Actor sheet UI (click attack/damage/skill buttons)
- Combat tracker (initiative, special actions)

**Anti-duplication**: Tests verify no duplicate actions appear in HUD (regression prevention)

### Socket Routing

When user lacks permission on actor:
1. `RollExecutor.canExecute(actor)` returns `false`
2. `SocketRouter.routeAction(actor, actionData)` emits socket event
3. GM receives socket event and executes action with their permissions
4. Result appears in chat (visible to all players)

**Security**: Socket handler verifies GM status before execution

### Future Phases

Planned additions:
- **Talents** — One-click talent activation (Phase 2)
- **Psychic Powers** — Focus Power tests and power activation (Phase 2)
- **Squad Mode** — Solo/Squad Mode ability toggles (Phase 3)
- **Custom Actions** — User-defined macro shortcuts (Phase 3)

---

## System Notes

- **Foundry version**: System is locked to Foundry v13 (compatibility minimum/verified/maximum all set to "13")
- **Grid**: 3 meters per square (metric)
- **Token bars**: Primary = Wounds, Secondary = Fatigue
- **Initiative formula**: `1d10 + @agBonus + @initiativeBonus`
- **Status effects**: Custom status effect list in `src/module/helpers/status-effects.mjs` (includes On Fire, Stunned, Prone, etc.)
- **Enemy auto-folder**: Newly created Enemy/Horde actors are automatically moved to an "Enemies" folder
- **Skip Defeated**: Combat tracker defaults to skipping defeated combatants

---

_The sacred architecture is documented. Praise the Omnissiah._ ⚙️
