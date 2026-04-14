---
name: webp-conversion
description: Use when converting PNG, JPG, or other image formats to WebP format for web optimization, especially when working with icon assets, UI graphics, or web images requiring smaller file sizes
---

# WebP Image Conversion

## Overview

Convert images to WebP format using the local cwebp.exe tool. **Check for local project binaries before suggesting installations.**

**Core principle:** Use project-specific tools when available; prefer official WebP encoder over generic image converters.

## Local Tool Location

**This system has cwebp.exe pre-installed at:**
```
C:\Source\libs\libwebp-1.6.0\bin\cwebp.exe
```

**CRITICAL: ALWAYS use the full path above in ALL commands.** Never use bare `cwebp` or suggest installing tools.

## Quick Reference

**All commands use the full path: `C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe`**

| Task | Command Pattern |
|------|----------------|
| Basic conversion | `C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe input.png -o output.webp` |
| With quality (lossy) | `C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe -q 85 input.png -o output.webp` |
| Lossless | `C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe -lossless input.png -o output.webp` |
| Set compression | `C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe -q 80 -m 6 input.png -o output.webp` |

**Note:** Full path works in both PowerShell and Git Bash (use forward slashes `/` as shown).

## Red Flags - STOP and Use Local Tool

**NEVER suggest these (tool already exists locally):**
- ❌ "Install cwebp via npm" or "npm install -g cwebp-bin"
- ❌ "choco install webp" or "Download from Google"
- ❌ "Use ImageMagick" or "magick convert"
- ❌ "npx @squoosh/cli" or other npm packages
- ❌ Bare `cwebp` command without full path

**ALWAYS do this instead:**
- ✅ Use full path: `C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe`
- ✅ Works in PowerShell, Git Bash, and CMD
- ✅ No installation needed

## Quality Guidelines

| Image Type | Recommended Settings | Rationale |
|------------|---------------------|-----------|
| UI icons (64x64 - 256x256) | `-q 90` or `-lossless` | Quality critical, files already small |
| Game assets (512x512+) | `-q 85 -m 6` | Balance quality/size, good compression |
| Backgrounds (1920x1080+) | `-q 75 -m 6` | Size matters more, artifacts less visible |
| Pixel art | `-lossless` | Preserve exact pixels, no artifacts |

**Parameters:**
- `-q N` — Quality (0-100, default 75). Higher = better quality, larger file.
- `-m N` — Compression method (0-6, default 4). Higher = slower but better compression.
- `-lossless` — No quality loss (like PNG), larger files but identical output.

## Implementation

### Single File Conversion

```bash
# Basic conversion (quality 75, default)
C:\Source\libs\libwebp-1.6.0\bin\cwebp.exe "./src/icons/weapons/bolter.png" -o "./src/icons/weapons/bolter.webp"

# High quality for UI icons
C:\Source\libs\libwebp-1.6.0\bin\cwebp.exe -q 90 "./src/icons/ui/character-sheet.png" -o "./src/icons/ui/character-sheet.webp"

# Lossless for pixel art
C:\Source\libs\libwebp-1.6.0\bin\cwebp.exe -lossless "./src/icons/tokens/marine.png" -o "./src/icons/tokens/marine.webp"
```

### Batch Conversion

**PowerShell (Windows):**
```powershell
# Convert all PNGs in a directory
Get-ChildItem "./src/icons/weapons/*.png" | ForEach-Object {
    C:\Source\libs\libwebp-1.6.0\bin\cwebp.exe -q 85 $_.FullName -o ($_.DirectoryName + "\" + $_.BaseName + ".webp")
}
```

**Bash (Git Bash on Windows):**
```bash
# Convert all PNGs with quality 85
for file in ./src/icons/weapons/*.png; do
    C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe -q 85 "$file" -o "${file%.png}.webp"
done
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Suggesting `choco install webp` | Use local tool at `C:\Source\libs\libwebp-1.6.0\bin\cwebp.exe` |
| Recommending ImageMagick | Prefer official cwebp for WebP conversion |
| Using same quality for all images | Adjust based on image type (see Quality Guidelines) |
| Forgetting `-o` flag | cwebp requires explicit output path with `-o` |
| Using forward slashes in PowerShell paths | Use backslashes `\` in PowerShell, forward `/` in Bash |

## Error Handling

**File not found:**
```bash
# Verify input file exists first
if (Test-Path "./src/icons/weapon.png") {
    cwebp "./src/icons/weapon.png" -o "./src/icons/weapon.webp"
} else {
    Write-Error "Input file not found"
}
```

**Check tool availability:**
```bash
if (Test-Path "C:\Source\libs\libwebp-1.6.0\bin\cwebp.exe") {
    # Use local tool
} else {
    Write-Warning "Local cwebp.exe not found. Install webp tools or use ImageMagick as fallback."
}
```
