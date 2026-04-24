# Build & Deploy

## Quick Start

**Prerequisites**: Node.js v24+ (tested on v24.13.0)

```bash
npm install                 # Install dependencies
npm test                    # Verify installation (1823 tests should pass)
npm run build:all           # Build packs and deploy locally (requires .env setup)
```

**First-time setup**: Copy `.env` and set `LOCAL_DIR` to your Foundry systems directory.

---

## Development Commands

### Testing

```bash
npm test                    # Run all tests (1823 passing tests across 110 suites)
npm run test:watch          # Watch mode
npm run test:coverage       # Generate coverage report at coverage/lcov-report/index.html

# Run specific test file
npm test -- tests/combat/combat.test.mjs

# Run tests matching a pattern
npm test -- --testPathPattern="weapon-qualities"
```

### Build & Deploy

```bash
npm run format:json         # Compact and format all compendium JSON files
npm run build:packs         # Validate + compile packs to LevelDB
npm run build:copy          # Copy src/ to local Foundry installation (see .env)
npm run build:all           # Run build:packs + build:copy
node builds/scripts/convertToWebp.mjs <file-or-dir>  # Convert PNG/JPG to WebP (⚠️ auto-deletes originals)
node builds/scripts/convertToWebp.mjs --trim <file.webp>  # Remove white background + trim
node builds/scripts/convertToWebp.mjs --trim-black <file.webp>  # Remove black background + trim
```

**Local deployment**: Set `LOCAL_DIR` in `.env` to your Foundry systems directory (e.g., `\\thebrewery\Foundry\Data\systems\deathwatch`). Running `npm run build:copy` deploys the `src/` folder contents there.

---

## Git Branch Strategy

**Main branch**: `main`  
**Development branch**: `claude`

When creating PRs, target the `main` branch.

---

## Environment Configuration

### .env File Structure

```bash
# Path to your Foundry VTT systems directory
LOCAL_DIR=\\thebrewery\Foundry\Data\systems\deathwatch
```

### Build Pipeline

1. **Source files** → `src/packs-source/*.json` (version controlled)
2. **Validation** → `npm run build:packs` checks for duplicate IDs, valid schemas
3. **Compilation** → Generates LevelDB files in `src/packs/` (not version controlled)
4. **Deployment** → `npm run build:copy` copies `src/` to `LOCAL_DIR`

---

## Data Extraction Scripts

Located in `builds/scripts/`:

- `parse-rank-tables.mjs` - Extract general rank data
- `parse-deathwatch-tables.mjs` - Extract Deathwatch-specific ranks
- `parse-specialty-tables.mjs` - Extract specialty progressions
- `parse-chapter-tables.mjs` - Extract chapter overrides
- `convert-skills-json.mjs` - Convert skills.json to nested format
- `update-talent-ranks.mjs` - Bulk update talent compendium
- `convertToWebp.mjs` - Image format conversion (PNG/JPG → WebP)

---

## Testing Strategy

See [testing.md](testing.md) for comprehensive testing documentation.

**Quick reference:**

- **Unit tests**: Pure helpers, calculators, modifiers (90%+ coverage)
- **Integration tests**: DataModels, document interactions (70%+ coverage)
- **Sheet tests**: UI interactions, action handlers (basic coverage)
- **Mock setup**: `tests/setup.mjs` (automatically loaded by Jest)

---

## Deployment Checklist

Before deploying a new version:

- [ ] Run `npm test` - All tests passing?
- [ ] Run `npm run build:packs` - Packs compile successfully?
- [ ] Test in local Foundry instance - Features work as expected?
- [ ] Update version in `src/system.json`
- [ ] Update CHANGELOG.md with user-facing changes
- [ ] If data structure changed, implement migration (see [migration-system.md](migration-system.md))
- [ ] Create git tag: `git tag v0.0.X`
- [ ] Push to GitHub: `git push origin main --tags`

---

_Blessed deployment protocols complete._ ⚙️
