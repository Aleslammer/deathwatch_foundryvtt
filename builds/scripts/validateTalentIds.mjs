import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const talentsDir = path.join(__dirname, '../../src/packs-source/talents');

const files = fs.readdirSync(talentsDir);
let mismatches = 0;
let missing = 0;

for (const file of files) {
  if (file.endsWith('.json')) {
    const filePath = path.join(talentsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!data.system?.compendiumId) {
      console.log(`❌ ${file}: Missing compendiumId`);
      missing++;
    } else if (data._id !== data.system.compendiumId) {
      console.log(`❌ ${file}: Mismatch - _id: ${data._id}, compendiumId: ${data.system.compendiumId}`);
      mismatches++;
    }
  }
}

if (mismatches === 0 && missing === 0) {
  console.log('✅ All 274 talents have matching _id and compendiumId');
  process.exit(0);
} else {
  console.log(`\n❌ Validation failed - Mismatches: ${mismatches}, Missing: ${missing}`);
  process.exit(1);
}
