import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const talentsDir = path.join(__dirname, '../../src/packs-source/talents');

// Property order for talents
const propertyOrder = [
  '_id',
  'name',
  'type',
  'img',
  'system',
  'effects',
  'flags',
  'folder',
  'sort',
  'ownership'
];

const systemPropertyOrder = [
  'book',
  'page',
  'prerequisite',
  'benefit',
  'description',
  'cost',
  'subsequentCost',
  'stackable',
  'compendiumId'
];

function sortObject(obj, order) {
  const sorted = {};
  
  // Add properties in specified order
  for (const key of order) {
    if (key in obj) {
      if (key === 'system' && typeof obj[key] === 'object') {
        sorted[key] = sortObject(obj[key], systemPropertyOrder);
      } else {
        sorted[key] = obj[key];
      }
    }
  }
  
  // Add any remaining properties not in order
  for (const key in obj) {
    if (!(key in sorted)) {
      sorted[key] = obj[key];
    }
  }
  
  return sorted;
}

function sortTalentFile(filePath) {
  try {
    // Read file with UTF-8 encoding
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Ensure compendiumId matches _id
    if (data._id && data.system) {
      data.system.compendiumId = data._id;
    }
    
    // Sort properties
    const sorted = sortObject(data, propertyOrder);
    
    // Write back with proper formatting and UTF-8 encoding
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
    
    return true;
  } catch (error) {
    console.error(`Error processing ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

// Process all JSON files in talents directory
const files = fs.readdirSync(talentsDir);
let processed = 0;
let errors = 0;

for (const file of files) {
  if (file.endsWith('.json')) {
    const filePath = path.join(talentsDir, file);
    if (sortTalentFile(filePath)) {
      processed++;
    } else {
      errors++;
    }
  }
}

console.log(`\nProcessed ${processed} talent files`);
if (errors > 0) {
  console.log(`Errors: ${errors}`);
}
