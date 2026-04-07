# Claude Code Configuration

This directory contains Claude Code configuration for the Deathwatch Foundry VTT system.

---

## Structure

```
.claude/
├── memory/                    # Project-specific memories (version controlled)
│   ├── MEMORY.md             # Memory index
│   ├── project_*.md          # Project state and metrics
│   ├── architecture.md       # Core architectural patterns
│   ├── testing_standards.md # Testing requirements
│   └── reference_*.md        # Reference information
├── skills/                    # Custom Claude Code skills (version controlled)
│   └── add-enemy.md          # Guide for adding enemies to compendium
└── README.md                 # This file
```

---

## Philosophy

**Repository-level memory** (`.claude/memory/`) is version controlled and shared:
- Project architecture and patterns
- Development workflow and commands
- Testing standards and requirements
- Reference information (build scripts, test structure)

**User-level memory** (`~/.claude/projects/.../memory/`) is personal:
- Individual coding style preferences
- Personal workflow habits
- Cross-project preferences

---

## Why Version Control Memory?

**Problem with user-level memory:**
- ❌ Lost if computer dies
- ❌ Not shared with team
- ❌ Not backed up with repo

**Solution: Repository-level memory:**
- ✅ Version controlled
- ✅ Shared with all developers
- ✅ Backed up with repo
- ✅ Survives computer wipes

---

## Files in `.claude/memory/`

### Foundation
- **project_overview.md** - High-level system description, current status
- **architecture.md** - TypeDataModel pattern, polymorphic combat, helpers
- **development_workflow.md** - Git conventions, build commands

### Standards
- **testing_standards.md** - Test requirements, coverage goals, commands
- **compendium_system.md** - Source workflow, ID conventions, validation

### Reference
- **reference_build_scripts.md** - Build pipeline script locations and purposes
- **reference_tests.md** - Test file organization and structure

---

## Comparison with Amazon Q

This replaces Amazon Q's `.amazonq/rules/memory-bank/` (28K lines) with focused repository-level memory (~1K lines).

**Key differences:**
- Amazon Q: Exhaustive documentation of every detail
- Claude Code: Focused memory + on-demand code exploration

**Why Claude needs less:**
- Can use `Glob` to find files
- Can use `Grep` to search code
- Can use `Read` to explore files on-demand
- Builds automatic memory through conversation

---

## Usage

Claude Code automatically reads memory files from `.claude/memory/` and skills from `.claude/skills/` when working in this repository.

**For developers:**
- Update memory files when architecture changes
- Keep memories focused and actionable
- Add new memories as project evolves
- Use skills via slash commands (e.g., `/add-enemy`)

**For Claude:**
- Memories provide project context
- CLAUDE.md (root) provides architecture overview
- Skills provide guided workflows for common tasks
- Code exploration fills in details

**Available Skills:**
- `/add-enemy` - Interactive guide for adding new enemies to compendium packs

---

## Adding New Memories

Create new `.md` files in `.claude/memory/` following this format:

```markdown
---
name: short_identifier
description: One-line description for MEMORY.md index
type: project|feedback|reference
---

Content here.

**Why:** Explanation of importance.

**How to apply:** When/where this applies.
```

Then add to `MEMORY.md`:
```markdown
- [Title](filename.md) — One-line description
```

---

## Maintenance

**Keep memories:**
- Focused (one topic per file)
- Actionable (clear "how to apply")
- Current (update when architecture changes)
- Under 200 lines each

**Memory types:**
- **project** - Current state, status, metrics
- **feedback** - Standards, conventions, requirements
- **reference** - Where things are, how to find them

---

## Skills

**Skills** (`.claude/skills/`) are guided workflows for common development tasks.

**Current Skills:**
- **add-enemy** (`/add-enemy`) - Interactive guide for adding new enemies to compendium packs
  - Collects enemy data from user
  - Creates JSON files with proper structure
  - Handles embedded items (talents, traits, weapons)
  - Updates migration script
  - Runs validation and build

**Creating New Skills:**

1. Create a markdown file in `.claude/skills/` with this frontmatter:
```markdown
---
name: skill-name
description: Brief description of what the skill does
trigger: /skill-name
---

# Skill Content

Your instructions for Claude here...
```

2. The skill file should:
   - Guide Claude through the process step-by-step
   - Be interactive (ask user for input, don't invent data)
   - Include key reference information (IDs, patterns, file locations)
   - Validate and report results

3. Update this README to list the new skill

**When to Create Skills:**
- ✅ Multi-step workflows that require consistency
- ✅ Tasks that need reference data (IDs, patterns)
- ✅ Processes that developers do frequently
- ❌ Simple one-off tasks
- ❌ Tasks already well-documented in CLAUDE.md

---

## Relationship to Other Documentation

| File/Directory | Purpose | Audience |
|----------------|---------|----------|
| **CLAUDE.md** (root) | Architecture guide for Claude | Claude Code |
| **.claude/memory/** | Project context and standards | Claude Code |
| **.claude/skills/** | Guided workflows for common tasks | Claude Code |
| **README.md** (root) | User-facing documentation | End users, developers |
| **docs/** | Detailed implementation docs | Developers |
| **.amazonq/** | Historical (Amazon Q config) | Reference only |

---

## Summary

- `.claude/memory/` contains **version-controlled project memories**
- `.claude/skills/` contains **guided workflows for common tasks**
- Focused on what Claude can't easily discover via code reading
- ~1K lines memory vs Amazon Q's 28K lines
- Backed up, shared, and survives computer wipes

**Result:** Better AI assistance with less documentation burden.
