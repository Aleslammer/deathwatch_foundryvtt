---
name: development_workflow
description: Git conventions and development workflow for this project
type: feedback
---

**Git Commit Conventions:**

Always create NEW commits (don't amend unless explicitly requested). Never skip hooks (--no-verify) unless user explicitly requests it.

**Why:** If a pre-commit hook fails, the commit did NOT happen. Using `--amend` would modify the PREVIOUS commit, potentially destroying work.

**How to apply:** After hook failure, fix the issue, re-stage files, and create a NEW commit.

**Branch Strategy:**
- Main branch: `main`
- Development branch: `claude` (current branch)
- When creating PRs, target `main` branch

**Development Commands:**

```bash
# Testing
npm test                    # Run all 2129 tests across 121 suites
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report at coverage/lcov-report/index.html

# Building
npm run format:json         # Compact and format compendium JSON
npm run build:packs         # Validate + compile to LevelDB
npm run build:copy          # Deploy to local Foundry (via .env LOCAL_DIR)
npm run build:all           # build:packs + build:copy
```

**Local Deployment:**
Set `LOCAL_DIR` in `.env` to your Foundry systems directory. Running `npm run build:copy` deploys `src/` folder there.

Example `.env`:
```
LOCAL_DIR=\\thebrewery\Foundry\Data\systems\deathwatch
```
