/**
 * Extract Macros Script
 *
 * One-time migration script to extract command fields from macro JSON files
 * into separate .js files for the two-file macro pattern.
 *
 * Usage: node builds/scripts/extractMacros.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MACROS_DIR = path.join(__dirname, '../../src/packs-source/macros');

/**
 * Extract command from JSON and create .js file
 */
function extractMacro(jsonFilePath) {
  const baseName = path.basename(jsonFilePath, '.json');
  const jsFilePath = path.join(MACROS_DIR, `${baseName}.js`);

  // Skip if .js already exists
  if (fs.existsSync(jsFilePath)) {
    console.log(`[extractMacros] ⊘ Skipping ${baseName} (${baseName}.js already exists)`);
    return { skipped: true };
  }

  try {
    // Read JSON
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const macroData = JSON.parse(jsonContent);

    // Extract command
    const command = macroData.command || '';

    if (!command || command.trim() === '') {
      console.warn(`[extractMacros] ⚠ Skipping ${baseName} (command field is empty)`);
      return { skipped: true };
    }

    // Write JS file
    fs.writeFileSync(jsFilePath, command, 'utf8');

    // Clear command field in JSON
    macroData.command = '';
    fs.writeFileSync(jsonFilePath, JSON.stringify(macroData, null, 2), 'utf8');

    console.log(`[extractMacros] ✓ Extracted ${baseName}.js (${command.length} chars)`);
    return { success: true, size: command.length };
  } catch (error) {
    console.error(`[extractMacros] ✗ Error extracting ${baseName}:`, error.message);
    return { failed: true };
  }
}

/**
 * Main execution
 */
function main() {
  console.log('[extractMacros] Starting macro extraction...');

  if (!fs.existsSync(MACROS_DIR)) {
    console.error(`[extractMacros] Macros directory not found: ${MACROS_DIR}`);
    process.exit(1);
  }

  const jsonFiles = fs.readdirSync(MACROS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(MACROS_DIR, file));

  console.log(`[extractMacros] Found ${jsonFiles.length} macro JSON file(s)`);

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (const jsonFile of jsonFiles) {
    const result = extractMacro(jsonFile);
    if (result.success) successCount++;
    else if (result.skipped) skippedCount++;
    else if (result.failed) failCount++;
  }

  console.log(`[extractMacros] Complete: ${successCount} extracted, ${skippedCount} skipped, ${failCount} failed`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
