# Manual Test Plan

This directory contains manual testing documentation for the Deathwatch Foundry VTT system.

## Overview

The test plan provides three levels of validation:

1. **Scenario Tests** — Step-by-step gameplay validation (20-30 min each)
2. **Feature Checklists** — Targeted system verification (10-15 min each)
3. **Quick Smoke Test** — Rapid regression check (30 min)

All tests assume the **Test World** has been set up according to `TEST-WORLD-SETUP.md`.

---

## Quick Reference

| System | Scenario Test | Feature Checklist |
|--------|---------------|-------------------|
| **Ranged Combat** | [ranged-combat-scenario.md](scenarios/ranged-combat-scenario.md) | [weapon-qualities-checklist.md](checklists/weapon-qualities-checklist.md) |
| **Melee Combat** | [melee-combat-scenario.md](scenarios/melee-combat-scenario.md) | — |
| **Psychic Powers** | [psychic-combat-scenario.md](scenarios/psychic-combat-scenario.md) | [psychic-powers-checklist.md](checklists/psychic-powers-checklist.md) |
| **Horde & Squad** | [squad-vs-horde-scenario.md](scenarios/squad-vs-horde-scenario.md) | [cohesion-squad-mode-checklist.md](checklists/cohesion-squad-mode-checklist.md) |
| **Fire Mechanics** | — | [fire-mechanics-checklist.md](checklists/fire-mechanics-checklist.md) |
| **Critical Damage** | — | [critical-damage-checklist.md](checklists/critical-damage-checklist.md) |
| **Character Modifiers** | — | [character-modifiers-checklist.md](checklists/character-modifiers-checklist.md) |

---

## Testing Workflows

### Full Test Run (~3 hours)
Comprehensive validation for major releases:
1. Run [quick-smoke-test.md](quick-smoke-test.md) first (30 min)
2. Run all 4 scenario tests (2 hours)
3. Spot-check 2-3 feature checklists (30-45 min)

### Spot Check (~15 min)
Targeted validation for specific features:
1. Identify system to test (e.g., psychic powers)
2. Run corresponding checklist (e.g., `psychic-powers-checklist.md`)
3. Verify expected results against checklist

### Regression Check (~30 min)
Quick validation after system updates:
1. Run [quick-smoke-test.md](quick-smoke-test.md)
2. If any critical failures, investigate and run relevant scenario/checklist

---

## Test World Setup

Before running any tests, set up the repeatable test environment:

**See:** [TEST-WORLD-SETUP.md](TEST-WORLD-SETUP.md)

The test world includes:
- 4 pre-built Marine characters (Tactical, Heavy, Assault, Librarian)
- 4 enemy actors (Ork Boy, Tau Fire Warrior, Tyranid Warrior, Ork Mob horde)
- Combat scene with range zones
- Initial cohesion configuration

**Reset instructions** are included to restore the test world to its initial state for repeated testing.

---

## Test Duration Guide

| Test Type | Duration | When to Use |
|-----------|----------|-------------|
| Quick Smoke Test | 30 min | After updates, before release |
| Scenario Test | 20-30 min each | Major feature validation |
| Feature Checklist | 10-15 min each | Targeted spot-checks |
| Full Test Run | ~3 hours | Major releases, significant changes |

---

## GM vs Player Testing

**GM-Only Tests:**
- Damage application
- Enemy setup and management
- Cohesion adjustments
- GM-facing UI features

**Player Tests (can delegate):**
- Attack rolls and combat actions
- Character sheet interactions
- Psychic power activation
- Equipment management

**Both:**
- Scenario tests (GM sets up, player executes actions)
- Full gameplay flow validation

---

## Core Documentation

- **[TEST-WORLD-SETUP.md](TEST-WORLD-SETUP.md)** — Test environment configuration and reset instructions
- **[quick-smoke-test.md](quick-smoke-test.md)** — 30-minute rapid validation checklist

---

_The Machine Spirit guides our testing rituals. Praise the Omnissiah._ ⚙️
