import { readdirSync, statSync, unlinkSync } from "fs";
import { join, extname, basename } from "path";
import { execSync } from "child_process";

const CWEBP = "C:\\Source\\libs\\libwebp-1.6.0\\bin\\cwebp.exe";
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
