---
name: webp-conversion
description: Use when converting PNG, JPG, or other image formats to WebP format for web optimization, especially when working with icon assets, UI graphics, or web images requiring smaller file sizes
---

# WebP Image Conversion

## Overview

Convert images to WebP format using the project's Node.js conversion script. **The script automatically deletes original files after successful conversion.**

**Primary tools:**
- `builds/scripts/convertToWebp.mjs` — PNG/JPG → WebP conversion
- `builds/scripts/removeBackground.mjs` — AI-powered background removal (rembg)
- `cwebp.exe` — Manual fallback for custom quality settings

## Prerequisites

**Required .env configuration:**
```env
CWEBP_PATH=C:\Source\libs\libwebp-1.6.0\bin\cwebp.exe
MAGICK_PATH=C:\Program Files\ImageMagick\magick.exe
```

**Required Python installation:**
- Python 3.x with `rembg` package installed (`pip install rembg[gpu]`)
- Used for AI-powered background removal (default for trim operations)

## Quick Reference

| Task | Command |
|------|---------|
| Convert single file | `node builds/scripts/convertToWebp.mjs src/icons/weapons/bolter.png` |
| Convert directory (recursive) | `node builds/scripts/convertToWebp.mjs src/icons/weapons` |
| **Remove background (AI)** | `node builds/scripts/removeBackground.mjs src/icons/file.webp` |
| **Remove background (batch)** | `node builds/scripts/removeBackground.mjs src/icons/dir` |
| Trim white (fast, ImageMagick) | `node builds/scripts/convertToWebp.mjs --trim src/icons/file.webp` |
| Trim white with fuzz | `node builds/scripts/convertToWebp.mjs --trim src/icons/file.webp 15%` |
| Trim black background | `node builds/scripts/convertToWebp.mjs --trim-black src/icons/file.webp` |

## Script Usage

### Convert Mode (PNG/JPG → WebP)

**⚠️ WARNING: Original files are automatically deleted after conversion.**

```bash
# Single file (PNG or JPG)
node builds/scripts/convertToWebp.mjs src/icons/weapons/whip.jpg
# Output: src/icons/weapons/whip.webp
# Original: src/icons/weapons/whip.jpg (DELETED)

# Entire directory (recursive)
node builds/scripts/convertToWebp.mjs src/icons/weapons
# Converts all .png, .jpg, .jpeg files
# Deletes originals after conversion
```

**What it does:**
1. Converts PNG/JPG to WebP using default cwebp settings (quality ~75)
2. Saves output with same filename but `.webp` extension
3. **Automatically deletes the original file**
4. Processes directories recursively

### Background Removal Mode (AI-Powered) ⭐ DEFAULT

**Uses AI neural networks to detect and remove backgrounds with precision.**

```bash
# Remove background (single file) - RECOMMENDED
node builds/scripts/removeBackground.mjs src/icons/enemies/tyranid/gargoyle.webp

# Remove background (entire directory, recursive)
node builds/scripts/removeBackground.mjs src/icons/enemies/tyranid

# Works with PNG, JPG, JPEG, WebP
node builds/scripts/removeBackground.mjs src/icons/chaos-zealot.png
```

**What it does:**
1. Uses U2-Net AI model to detect subject vs background
2. Removes background with high precision (preserves fine details)
3. Overwrites the original file (no backup created)
4. Processes ~3-5 seconds per image (CPU mode)

**Advantages:**
- ✅ Works on complex/gradient backgrounds
- ✅ Preserves fine details (hair, feathers, flames, anti-aliasing)
- ✅ No manual fuzz tuning needed
- ✅ No scrapcode artifacts from flood-fill

**When to use:** Default for all background removal (quality over speed)

---

### Trim Mode (Fast ImageMagick Fallback)

**Uses flood-fill algorithm for simple uniform backgrounds. Use `--fast` flag or when AI is too slow.**

```bash
# Remove white background (fast)
node builds/scripts/convertToWebp.mjs --trim src/icons/enemies/tyranid/gargoyle.webp

# Remove white with fuzz (for anti-aliased edges)
node builds/scripts/convertToWebp.mjs --trim src/icons/enemies/tyranid/gargoyle.webp 15%

# Remove black background
node builds/scripts/convertToWebp.mjs --trim-black src/icons/weapons/chainsword.webp

# Trim all WebP files in directory
node builds/scripts/convertToWebp.mjs --trim src/icons/enemies/tyranid
```

**What it does:**
1. Fills corner pixels with the target color (white/black)
2. Flood-fills from corners to make matching background transparent
3. Trims transparent padding (`-trim +repage`)
4. Overwrites the original file (no backup created)

**Fuzz parameter:**
- Optional percentage (e.g., `15%`)
- Allows color matching with tolerance
- Use for anti-aliased or gradient edges
- Higher fuzz = more aggressive background removal

**When to use:** Only when speed matters OR backgrounds are uniform solid colors

## Manual cwebp Commands (Fallback)

**Use when you need fine-grained control over quality settings.**

```bash
# Basic conversion (no auto-delete)
C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe "src/icons/weapons/bolter.png" -o "src/icons/weapons/bolter.webp"

# High quality for UI icons
C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe -q 90 "src/icons/ui/character-sheet.png" -o "src/icons/ui/character-sheet.webp"

# Lossless for pixel art
C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe -lossless "src/icons/tokens/marine.png" -o "src/icons/tokens/marine.webp"
```

**Quality guidelines:**
- UI icons (64x64 - 256x256): `-q 90` or `-lossless`
- Game assets (512x512+): `-q 85 -m 6`
- Backgrounds (1920x1080+): `-q 75 -m 6`
- Pixel art: `-lossless`

**Parameters:**
- `-q N` — Quality (0-100, default 75). Higher = better quality, larger file.
- `-m N` — Compression method (0-6, default 4). Higher = slower but better compression.
- `-lossless` — No quality loss (like PNG), larger files but identical output.

## Workflow Examples

### Converting weapon icons

```bash
# Convert single weapon icon
node builds/scripts/convertToWebp.mjs src/icons/weapons/whip.jpg

# Convert all weapons in directory
node builds/scripts/convertToWebp.mjs src/icons/weapons

# If icons have white borders, trim them
node builds/scripts/convertToWebp.mjs --trim src/icons/weapons
```

### Converting enemy portraits with backgrounds (RECOMMENDED WORKFLOW)

```bash
# Step 1: Convert PNG to WebP
node builds/scripts/convertToWebp.mjs src/icons/enemies/tyranid/gargoyle.png

# Step 2: Remove background using AI (DEFAULT - BEST QUALITY)
node builds/scripts/removeBackground.mjs src/icons/enemies/tyranid/gargoyle.webp

# Alternative: Fast ImageMagick trim (if speed matters)
node builds/scripts/convertToWebp.mjs --trim src/icons/enemies/tyranid/gargoyle.webp

# Alternative: ImageMagick with fuzz for anti-aliased edges
node builds/scripts/convertToWebp.mjs --trim src/icons/enemies/tyranid/gargoyle.webp 10%
```

**Default approach:** Use `removeBackground.mjs` for best quality (no scrapcode artifacts)  
**Fast approach:** Use `convertToWebp.mjs --trim` only when speed is critical

### Batch conversion with manual quality control

```bash
# Use manual cwebp for specific quality (no auto-delete)
for file in src/icons/ui/*.png; do
    C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe -q 95 "$file" -o "${file%.png}.webp"
done

# Then manually delete originals after verification
rm src/icons/ui/*.png
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting files are auto-deleted | Keep backups or use manual cwebp for non-destructive conversion |
| Running script without .env setup | Add CWEBP_PATH to `.env` before running |
| Using --trim on wrong file type | Trim only works on WebP files (convert first, trim second) |
| Expecting quality flags in script | Script uses cwebp defaults (~75 quality); use manual cwebp for custom quality |
| Using bare `cwebp` command | Always use full path: `C:/Source/libs/libwebp-1.6.0/bin/cwebp.exe` |

## Error Messages

**"CWEBP_PATH not set"**
```bash
# Add to .env in project root
echo "CWEBP_PATH=C:\\Source\\libs\\libwebp-1.6.0\\bin\\cwebp.exe" >> .env
```

**"MAGICK_PATH not set"** (for --trim operations)
```bash
# Add ImageMagick path to .env
echo "MAGICK_PATH=C:\\Program Files\\ImageMagick\\magick.exe" >> .env
```

**"Unsupported file type"**
- Script only processes .png, .jpg, .jpeg files in convert mode
- Trim mode only processes .webp files

## Safety Tips

1. **Test on single file first** before batch converting directories
2. **Keep backups** of important assets before conversion (originals are deleted)
3. **Verify output quality** before deleting source files manually
4. **Use manual cwebp** when you need non-destructive conversion
5. **Check file sizes** after trim operations (over-aggressive fuzz can degrade quality)

## Decision Logic for Background Removal

**When user requests background/border removal:**

```
IF user mentions "remove background" OR "remove border" OR "transparent edge":
    DEFAULT → Use removeBackground.mjs (AI-powered)
    
    UNLESS user explicitly says:
        - "fast" → Use convertToWebp.mjs --trim
        - "quick" → Use convertToWebp.mjs --trim
        - "ImageMagick" → Use convertToWebp.mjs --trim

IF user provides feedback about edge quality:
    "artifacts" OR "scrapcode" OR "bad edges" → Switch to removeBackground.mjs
    "too slow" → Offer convertToWebp.mjs --trim as alternative
```

**Two-step workflow (default):**
1. Convert to WebP: `node builds/scripts/convertToWebp.mjs <file.png>`
2. Remove background: `node builds/scripts/removeBackground.mjs <file.webp>`

**Fast one-step workflow (when speed matters):**
1. Convert + trim: `node builds/scripts/convertToWebp.mjs <file.png> && node builds/scripts/convertToWebp.mjs --trim <file.webp>`

## Red Flags - STOP

**NEVER suggest these:**
- ❌ "Install cwebp via npm" or "npm install -g cwebp-bin"
- ❌ "choco install webp" or "Download from Google"
- ❌ "npx @squoosh/cli" or other npm packages
- ❌ Bare `cwebp` command without full path
- ❌ Using ImageMagick trim when user complains about edge quality

**ALWAYS do this:**
- ✅ Default to AI background removal (`removeBackground.mjs`)
- ✅ Use `convertToWebp.mjs` for format conversion only
- ✅ Offer ImageMagick trim only when speed is explicitly needed
- ✅ Warn about auto-deletion of original files
- ✅ Use full paths for manual cwebp commands
