# Developer Documentation Index

This directory contains deep-dive developer reference documentation for the Deathwatch system. These documents are loaded on-demand when working on specific subsystems.

**Relationship to other documentation:**
- **[CLAUDE.md](../../CLAUDE.md)** → Quick start index + essential commands
- **[.claude/memory/](../memory/MEMORY.md)** → Session learnings, workflow preferences, project history
- **[.claude/docs/](README.md)** → This directory: deep-dive developer reference (YOU ARE HERE)
- **[docs/](../../docs/)** → User-facing guides (for GMs/players)

---

## Quick Reference

| Topic | File | When to Read |
|-------|------|--------------|
| **Getting Started** | [build-deploy.md](build-deploy.md) | First-time setup, npm commands, local deployment |
| **Foundry API** | [foundry-api.md](foundry-api.md) | Working with TextEditor, ApplicationV2, sheets |
| **Architecture** | [architecture.md](architecture.md) | Understanding DataModels, helpers, initialization |
| **Combat** | [combat-system.md](combat-system.md) | Implementing combat features, weapon qualities |
| **Character** | [modifiers.md](modifiers.md) | Modifier system, cybernetics, rank prerequisites |
| **Squad System** | [cohesion-squad.md](cohesion-squad.md) | Cohesion mechanics, Solo/Squad Mode |
| **Mental State** | [insanity-corruption.md](insanity-corruption.md) | Insanity/Corruption tracking and mechanics |
| **Testing** | [testing.md](testing.md) | Jest setup, TDD workflow, test organization |
| **Code Quality** | [coding-standards.md](coding-standards.md) | CSS, error handling, logging, JSDoc |
| **Patterns** | [item-patterns.md](item-patterns.md) | Item identification, key field pattern |
| **Data** | [compendium.md](compendium.md) | Pack system, ID conventions, adding content |
| **Infrastructure** | [foundry-adapter.md](foundry-adapter.md) | FoundryAdapter pattern, testability |
| **Constants** | [constants.md](constants.md) | System constants, eliminating magic numbers |
| **Migrations** | [migration-system.md](migration-system.md) | Data versioning, upgrade protocols |

---

## Documentation Philosophy

**Root CLAUDE.md** provides:
- Quick start (what commands to run)
- System overview (what this system does)
- Pointers to detailed docs

**These reference docs** provide:
- Deep implementation details
- Architecture rationale
- Code examples and patterns
- "How does X work?" answers

**Memory files** provide:
- Session-specific learnings
- Workflow preferences discovered during development
- Project history context

Use the right doc for the right task. If you're implementing a feature, start with CLAUDE.md to understand the overview, then dive into the relevant reference doc.

---

_Praise the Omnissiah._ ⚙️
