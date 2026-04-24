# Manual Test Plan

This directory contains manual testing protocols for the Deathwatch Foundry VTT system. These tests should be performed regularly to verify system functionality in the live Foundry environment.

## Test Categories

| Test Plan | Coverage | Frequency |
|-----------|----------|-----------|
| [Ranged Combat](ranged-combat.md) | Attack rolls, DoS, hit locations, weapon qualities, ammo | Every release |
| [Melee Combat](melee-combat.md) | Melee attacks, parry/dodge, lightning attack, special qualities | Every release |
| [Damage System](damage-system.md) | Damage application, armor, penetration, Righteous Fury, critical damage | Every release |
| [Psychic Powers](psychic-powers.md) | Focus Power Test, Phenomena/Perils, Hive Mind, opposed tests | Every release |
| [Fire Mechanics](fire-mechanics.md) | Flame weapons, On Fire status, extinguish tests | Every release |
| [Character Management](character-management.md) | XP, ranks, characteristics, modifiers, wounds, fate | Major changes |
| [Squad & Cohesion](squad-cohesion.md) | Cohesion tracking, Solo/Squad Mode, squad abilities | Major changes |
| [Mental State](mental-state.md) | Insanity Points, Corruption Points, disorders, curses | Major changes |
| [Actor Types](actor-types.md) | Character, NPC, Enemy, Horde sheets and mechanics | Major changes |
| [Item Management](item-management.md) | Creating, editing, dragging items between actors | As needed |
| [Compendiums](compendiums.md) | Loading compendium packs, dragging items, searching | After pack changes |

## Test Environment Setup

### Prerequisites
1. Foundry VTT v13 installed
2. Deathwatch system installed (local build or release)
3. Test world created with sample actors and items
4. GM and Player users configured

### Test World Setup

Create a dedicated "Deathwatch Test World" with:

**Actors:**
- **Test Marine** — L1 Space Marine (Tactical) with basic gear
- **Veteran Marine** — L8 Space Marine with advanced gear, psychic powers (if Librarian)
- **Test NPC** — Generic NPC with moderate stats
- **Test Enemy** — Single enemy (e.g., Ork Boy)
- **Test Horde** — Horde enemy (e.g., 30 Termagants)

**Items (on Test Marine):**
- Astartes Bolter (Standard Ammo)
- Astartes Chainsword
- Power Armor (all locations)
- Frag Grenades
- Psychic power (if testing psyker)

**Scenes:**
- Combat scene with grid (3m squares)
- Tokens for all test actors placed

## Running Tests

### Quick Smoke Test (10 minutes)
Run before each release to catch critical regressions:
1. Ranged attack (basic + single quality)
2. Melee attack (basic)
3. Damage application (basic)
4. Character sheet (open, view stats)
5. Compendium (open one pack, drag one item)

### Full Test Suite (1-2 hours)
Run all test plans in order before major releases.

### Regression Testing
When fixing a bug, add a manual test case to the relevant test plan to prevent regression.

## Recording Test Results

For each test session, record:
- **Date**: YYYY-MM-DD
- **Version**: System version tested
- **Tester**: Your name
- **Results**: Pass/Fail for each test case
- **Issues**: Links to GitHub issues for any failures

## Reporting Issues

When a test fails:
1. Note the specific test case that failed
2. Document exact steps to reproduce
3. Record error messages from console (F12)
4. Create GitHub issue with "manual-test" label
5. Link to the test plan section

---

**Note:** These are manual tests to complement the automated test suite (1800+ Jest tests). Automated tests verify logic; manual tests verify the UI and Foundry integration.

_Ritual verification protocols sanctified. May the Omnissiah guide your testing, Adept._ ⚙️
