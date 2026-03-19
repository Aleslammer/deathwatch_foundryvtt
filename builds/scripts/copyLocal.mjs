import fs from 'fs';
import path from 'path';

const LOCAL_DIR = '\\\\thebrewery\\Foundry\\Data\\systems\\deathwatch';
const SOURCE_DIR = path.resolve('./src');

const EXCLUDE_PATTERNS = ['packs-source'];
const EXCLUDE_FILES = ['.test.mjs', 'jest.config.mjs', 'package.json', 'package-lock.json', '.gitignore', '.editorconfig'];

function shouldExclude(filePath) {
  const relative = path.relative(SOURCE_DIR, filePath);
  if (EXCLUDE_PATTERNS.some(p => relative.includes(p))) return true;
  return EXCLUDE_FILES.some(p => path.basename(filePath).endsWith(p));
}

function copyRecursive(src, dest) {
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (shouldExclude(srcPath)) continue;
      fs.mkdirSync(destPath, { recursive: true });
      count += copyRecursive(srcPath, destPath);
    } else {
      if (shouldExclude(srcPath)) continue;
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

if (!fs.existsSync(LOCAL_DIR)) {
  console.error(`\x1b[31mDestination not found: ${LOCAL_DIR}\x1b[0m`);
  process.exit(1);
}

console.log('Cleaning destination directory...');
for (const entry of fs.readdirSync(LOCAL_DIR)) {
  fs.rmSync(path.join(LOCAL_DIR, entry), { recursive: true, force: true });
}

console.log(`Copying files to '${LOCAL_DIR}'`);
const copied = copyRecursive(SOURCE_DIR, LOCAL_DIR);
console.log(`\x1b[32mComplete! Copied ${copied} files\x1b[0m`);
