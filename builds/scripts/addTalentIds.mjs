import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const talentsDir = path.join(__dirname, '../../src/packs-source/talents');
const files = fs.readdirSync(talentsDir).filter(f => f.endsWith('.json'));

let idCounter = 10; // Start after the ones we already assigned

files.forEach(file => {
  const filePath = path.join(talentsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  // Skip if already has an ID
  if (data._id) {
    console.log(`Skipping ${file} - already has ID: ${data._id}`);
    return;
  }
  
  // Assign new ID
  const newId = `tal${String(idCounter).padStart(11, '0')}`;
  data._id = newId;
  idCounter++;
  
  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added ID ${newId} to ${file}`);
});

console.log(`\nProcessed ${files.length} files. Next ID: tal${String(idCounter).padStart(11, '0')}`);
