import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load LOCAL_DIR from .env file in project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
let LOCAL_DIR;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^LOCAL_DIR=(.+)$/m);
  if (match) LOCAL_DIR = match[1].trim();
}

if (!LOCAL_DIR) {
  console.error('\x1b[31mLOCAL_DIR not set. Create a .env file in the project root with:\x1b[0m');
  console.error('\x1b[31mLOCAL_DIR=\\\\server\\Foundry\\Data\\systems\\deathwatch\x1b[0m');
  process.exit(1);
}
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
console.log(`\x1b[32mComplete! Copied ${copied} files at ${new Date().toLocaleTimeString()}\x1b[0m`);
