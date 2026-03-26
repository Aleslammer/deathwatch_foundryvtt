import { readdirSync, statSync, unlinkSync, readFileSync, existsSync } from "fs";
import { join, extname, basename, dirname, resolve } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env");
let CWEBP = null;

if (existsSync(envPath)) {
  const match = readFileSync(envPath, "utf-8").match(/^CWEBP_PATH=(.+)$/m);
  if (match) CWEBP = match[1].trim();
}

if (!CWEBP) {
  console.error("CWEBP_PATH not set. Add to .env: CWEBP_PATH=C:\\path\\to\\cwebp.exe");
  process.exit(1);
}
const dir = process.argv[2];

if (!dir) {
  console.error("Usage: node convertToWebp.mjs <directory>");
  process.exit(1);
}

function processDir(dirPath) {
  for (const entry of readdirSync(dirPath)) {
    const full = join(dirPath, entry);
    if (statSync(full).isDirectory()) {
      processDir(full);
    } else if (/\.(jpe?g|png)$/i.test(entry)) {
      const out = join(dirPath, basename(entry, extname(entry)) + ".webp");
      console.log(`Converting: ${full}`);
      execSync(`"${CWEBP}" "${full}" -o "${out}"`, { stdio: "inherit" });
      unlinkSync(full);
      console.log(`Deleted: ${full}`);
    }
  }
}

processDir(dir);
console.log("Done.");
