import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sortObjectKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((sorted, key) => {
      sorted[key] = sortObjectKeys(obj[key]);
      return sorted;
    }, {});
  }
  return obj;
}

function processJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    const sorted = sortObjectKeys(json);
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
    console.log(`✓ ${path.relative(process.cwd(), filePath)}`);
  } catch (error) {
    console.error(`✗ ${path.relative(process.cwd(), filePath)}: ${error.message}`);
  }
}

function findJsonFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findJsonFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

const rootDir = path.resolve(__dirname, '../../src/packs-source');
const jsonFiles = findJsonFiles(rootDir);

console.log(`Found ${jsonFiles.length} JSON files. Sorting...\n`);
jsonFiles.forEach(processJsonFile);
console.log(`\nDone! Sorted ${jsonFiles.length} files.`);
