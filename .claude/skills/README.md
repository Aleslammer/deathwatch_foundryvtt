# Claude Code Skills

This directory contains custom skills for Claude Code - guided workflows for common development tasks in the Deathwatch system.

---

## Available Skills

### `/add-enemy` - Add Enemy to Compendium

Interactive guide for adding new enemies to the Deathwatch compendium packs.

**What it does:**
1. Collects enemy data from the developer (stats, skills, traits, weapons)
2. Creates properly structured JSON file in `src/packs-source/enemies/{faction}/`
3. Handles embedded items (talents, traits, weapons, psychic powers)
4. Creates horde variant if requested
5. Updates the migration script (`builds/scripts/migrateEnemyIds.mjs`)
6. Runs validation and build commands
7. Reports results and next steps

**When to use:**
- Adding new enemy actors from sourcebooks
- Creating custom enemies for campaigns
- Need guidance on proper enemy structure and IDs

**How to invoke:**
```
/add-enemy
```

Then follow Claude's prompts to provide enemy data.

---

## How Skills Work

Skills are markdown files with frontmatter that guide Claude through multi-step processes:

```markdown
---
name: skill-name
description: Brief description
trigger: /skill-name
---

# Skill instructions...
```

When you type `/skill-name`, Claude loads the skill file and follows its instructions to guide you through the process.

---

## Creating New Skills

**Good candidates for skills:**
- ✅ Multi-step workflows that require consistency
- ✅ Tasks needing reference data (IDs, file paths, patterns)
- ✅ Frequently performed tasks by developers
- ✅ Complex processes prone to errors

**Bad candidates:**
- ❌ Simple one-off tasks
- ❌ Tasks already well-documented in CLAUDE.md
- ❌ Highly variable processes with no standard pattern

**Skill structure:**
1. **Frontmatter** - name, description, trigger
2. **Overview** - What the skill does and why
3. **Step-by-step instructions** - Clear, actionable steps for Claude
4. **Reference data** - IDs, patterns, file locations Claude will need
5. **Validation** - How to verify success
6. **Error handling** - Common issues and how to resolve them

**Tips:**
- Make skills interactive (ask user for input)
- Don't invent data - always ask when unclear
- Include inline reference data (IDs, patterns)
- Validate and report results
- Guide, don't automate everything

---

## Skill vs Memory vs CLAUDE.md

**CLAUDE.md (root):**
- Architecture overview and patterns
- System-wide conventions
- Always loaded for every conversation
- ~200 lines, high-level

**Memory (`.claude/memory/`):**
- Project context and standards
- What's hard to discover from code
- Loaded on-demand or always (MEMORY.md index)
- ~1K lines total, focused

**Skills (`.claude/skills/`):**
- Step-by-step guided workflows
- Loaded only when invoked via `/skill-name`
- Can be 300+ lines with detailed instructions
- Task-specific, not always relevant

---

## Examples

**Add an enemy:**
```
User: /add-enemy
Claude: I'll guide you through adding a new enemy. Please provide the enemy data...
```

**Create a new skill:**
1. Create `new-skill.md` in this directory
2. Add frontmatter with name/description/trigger
3. Write step-by-step instructions for Claude
4. Update this README
5. Update `.claude/README.md`

---

## See Also

- [.claude/README.md](../README.md) - Claude Code configuration overview
- [CLAUDE.md](../../CLAUDE.md) - Architecture guide
- [.amazonq/rules/prompts/](../../.amazonq/rules/prompts/) - Original prompt files (historical)
