# Insanity & Corruption System

**Location**: `src/module/helpers/character/insanity-helper.mjs`, `corruption-helper.mjs`

Space Marines can accumulate **Insanity Points (IP)** and **Corruption Points (CP)** through psychic exposure, warp taint, and traumatic experiences.

---

## Insanity Points

### Threshold-Based Penalties

- **10+ IP**: -5 WP
- **20+ IP**: -10 WP
- **30+ IP**: -15 WP

### Battle Traumas

Trigger at high thresholds (40+, 60+, 80+) with permanent effects:

**Examples**:
- **Paranoia** (40+ IP): -10 to Fellowship tests with strangers
- **Flashbacks** (60+ IP): WP test at start of combat or lose first turn
- **Catatonia** (80+ IP): Character becomes unresponsive (campaign-ending)

### XP Recovery

Spend 100 XP to roll 1d5 IP reduction (purchasable via character sheet).

**UI**: Integrated mental state panel on character sheet with IP tracking, trauma list, and XP purchase button.

---

## Corruption Points

### Tracking Warp Taint

- Accumulate through warp exposure, chaos artifacts, dark rituals
- Max 100 CP
- **No recovery mechanism** (permanent taint)

### Primarch's Curse

Activates at 100 CP with chapter-specific mutations:

**Blood Angels**: Red Thirst & Black Rage
- Automatic Frenzy in combat
- Must pass WP test to avoid attacking nearest target (ally or enemy)
- +10 STR, +10 AG, -20 INT while frenzied

**Space Wolves**: Wulfen Transformation
- Physical mutation (fangs, claws)
- +20 STR, +10 TG, -20 Fellowship
- Unarmed attacks deal 1d10+SB Rending damage

**Dark Angels**: Fallen Obsession
- Paranoid distrust of all non-Dark Angels
- Must hunt Fallen at all costs
- -20 Fellowship with non-chapter members

**Curse effects are permanent and irreversible.**

---

## Key Files

- `src/module/data/actor/character.mjs` — IP/CP data fields
- `src/module/helpers/constants/insanity-constants.mjs` — Thresholds, trauma definitions
- `src/module/helpers/constants/corruption-constants.mjs` — CP thresholds, curse definitions

---

## UI Integration

**Character Sheet Mental State Panel**:
- IP/CP current values and thresholds
- Active battle traumas list
- XP purchase button for IP reduction
- Warning indicators when approaching curse thresholds

**Chat Integration**:
- Insanity test results post to chat
- Trauma acquisition announcements
- Primarch's Curse activation warnings

---

_The scars of the warp are recorded. May the Emperor protect._ ⚙️
