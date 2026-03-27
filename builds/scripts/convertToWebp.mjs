/**
 * Image utility for converting and trimming icon files.
 *
 * Usage:
 *   node builds/scripts/convertToWebp.mjs <file-or-directory>
 *     Converts PNG/JPG to WebP. Single file or recursive directory.
 *     Requires CWEBP_PATH in .env
 *
 *   node builds/scripts/convertToWebp.mjs --trim <file-or-directory> [fuzz%]
 *     Removes white background, makes it transparent, and trims padding.
 *     Single file or all .webp files in directory.
 *     Requires MAGICK_PATH in .env (ImageMagick)
 *     Fuzz is optional — only use if border has anti-aliased/gradient edges
 *
 *   node builds/scripts/convertToWebp.mjs --trim-black <file-or-directory> [fuzz%]
 *     Same as --trim but removes black background instead of white.
 *
 * Examples:
 *   node builds/scripts/convertToWebp.mjs src/icons/enemies/tyranid/gargoyle.png
 *   node builds/scripts/convertToWebp.mjs src/icons/enemies/tyranid
 *   node builds/scripts/convertToWebp.mjs --trim src/icons/enemies/tyranid/gargoyle_horde.webp
 *   node builds/scripts/convertToWebp.mjs --trim src/icons/enemies/tyranid/gargoyle_horde.webp 15%
 *   node builds/scripts/convertToWebp.mjs --trim-black src/icons/enemies/tyranid/file.webp
 *   node builds/scripts/convertToWebp.mjs --trim-black src/icons/enemies/tyranid 15%
 */
import { readdirSync, statSync, unlinkSync, readFileSync, existsSync } from "fs";
import { join, extname, basename, dirname, resolve } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env");
const env = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";

function getEnv(key) {
  const match = env.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

// ── Trim mode: remove background color ────────────────────────────────────

if (process.argv[2] === "--trim" || process.argv[2] === "--trim-black") {
  const color = process.argv[2] === "--trim-black" ? "black" : "white";
  const MAGICK = getEnv("MAGICK_PATH");
  if (!MAGICK) {
    console.error("MAGICK_PATH not set. Add to .env: MAGICK_PATH=C:\\Program Files\\ImageMagick\\magick.exe");
    process.exit(1);
  }

  const target = process.argv[3];
  const fuzz = process.argv[4] || null;

  if (!target) {
    console.error("Usage: node convertToWebp.mjs --trim|--trim-black <file-or-directory> [fuzz%]");
    process.exit(1);
  }

  function trimFile(filePath) {
    console.log(`Trimming ${color} border: ${filePath}`);
    const dims = execSync(`"${MAGICK}" identify -format "%w %h" "${filePath}"`, { encoding: "utf-8" }).trim();
    const [w, h] = dims.split(" ").map(Number);
    const maxX = w - 1;
    const maxY = h - 1;
    const fuzzArg = fuzz ? ` -fuzz ${fuzz}` : "";
    execSync(
      `"${MAGICK}" "${filePath}"` +
      ` -fill ${color} -draw "point 0,0" -draw "point ${maxX},0" -draw "point 0,${maxY}" -draw "point ${maxX},${maxY}"` +
      `${fuzzArg}` +
      ` -fill none -draw "color 0,0 floodfill"` +
      ` -fill none -draw "color ${maxX},0 floodfill"` +
      ` -fill none -draw "color 0,${maxY} floodfill"` +
      ` -fill none -draw "color ${maxX},${maxY} floodfill"` +
      ` -trim +repage "${filePath}"`,
      { stdio: "inherit" }
    );
  }

  if (statSync(target).isDirectory()) {
    let count = 0;
    for (const entry of readdirSync(target)) {
      const full = join(target, entry);
      if (/\.webp$/i.test(entry) && statSync(full).isFile()) {
        trimFile(full);
        count++;
      }
    }
    console.log(`Done. Trimmed ${count} file(s).`);
  } else {
    trimFile(target);
    console.log("Done.");
  }

  process.exit(0);
}

// ── Convert mode: PNG/JPG to WebP ─────────────────────────────────────────

const CWEBP = getEnv("CWEBP_PATH");
if (!CWEBP) {
  console.error("CWEBP_PATH not set. Add to .env: CWEBP_PATH=C:\\path\\to\\cwebp.exe");
  process.exit(1);
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: node convertToWebp.mjs <file-or-directory>");
  process.exit(1);
}

function convertFile(filePath) {
  const out = join(dirname(filePath), basename(filePath, extname(filePath)) + ".webp");
  console.log(`Converting: ${filePath}`);
  execSync(`"${CWEBP}" "${filePath}" -o "${out}"`, { stdio: "inherit" });
  unlinkSync(filePath);
  console.log(`Deleted: ${filePath}`);
}

function processDir(dirPath) {
  for (const entry of readdirSync(dirPath)) {
    const full = join(dirPath, entry);
    if (statSync(full).isDirectory()) {
      processDir(full);
    } else if (/\.(jpe?g|png)$/i.test(entry)) {
      convertFile(full);
    }
  }
}

if (statSync(target).isDirectory()) {
  processDir(target);
} else if (/\.(jpe?g|png)$/i.test(target)) {
  convertFile(target);
} else {
  console.error(`Unsupported file type: ${target} (expected .png, .jpg, or .jpeg)`);
  process.exit(1);
}

console.log("Done.");
