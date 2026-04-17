---
name: project_webp_conversion
description: Ongoing WebP icon conversion initiative status and workflow
type: project
---

**Converting weapon icons from JPG/PNG to WebP format for reduced file sizes and faster loading.**

**Why:** WebP provides superior compression (30-50% smaller) compared to PNG/JPG while maintaining visual quality. Critical for web performance with 800+ compendium items containing icon assets.

**How to apply:**

**Conversion workflow:**
```bash
# Convert image(s) - auto-deletes originals after successful conversion
node builds/scripts/convertToWebp.mjs src/icons/weapons/whip.jpg

# Convert entire directory recursively
node builds/scripts/convertToWebp.mjs src/icons/weapons

# Remove white background + trim padding
node builds/scripts/convertToWebp.mjs --trim src/icons/weapons/chainsword.webp

# Remove black background + trim
node builds/scripts/convertToWebp.mjs --trim-black src/icons/weapons/chainsword.webp 15%
```

**Current status (April 2026):**
- ✅ 10 weapon icons converted (whip, wrist-blade, xenophase-blade, chain-fist, power-fist, rending-blade, thunder-hammer, lightning-claw, chainfist, force-sword)
- ⏳ Remaining weapon icons to convert
- ⏳ Armor icons
- ⏳ Enemy/NPC portraits
- ⏳ UI elements

**Safety notes:**
- Script auto-deletes original files after conversion (⚠️ keep backups)
- Trim operations overwrite files (no undo)
- Test on single file before batch operations
- Use `--trim` after conversion (convert first, trim second)

**Reference:** See `.claude/skills/webp-conversion/SKILL.md` for complete documentation.
