/**
 * Build Macros Script
 *
 * Merges macro JavaScript source files (.js) with their metadata (.json) files.
 * This allows editing macro code in proper JS files with syntax highlighting,
 * while maintaining Foundry's required JSON pack format.
 *
 * Pattern:
 * - src/packs-source/macros/macro-name.js (editable source code)
 * - src/packs-source/macros/macro-name.json (metadata + placeholder command)
 * - Script updates macro-name.json's "command" field with contents of macro-name.js
 *
 * Run before compactJson.mjs in the build pipeline.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MACROS_DIR = path.join(__dirname, '../../src/packs-source/macros');

/**
 * Find all .js files in macros directory
 */
function findMacroSourceFiles() {
  if (!fs.existsSync(MACROS_DIR)) {
    console.warn(`[buildMacros] Macros directory not found: ${MACROS_DIR}`);
    return [];
  }

  return fs.readdirSync(MACROS_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(MACROS_DIR, file));
}

/**
 * Process a single macro: merge .js source into .json metadata
 */
function processMacro(jsFilePath) {
  const baseName = path.basename(jsFilePath, '.js');
  const jsonFilePath = path.join(MACROS_DIR, `${baseName}.json`);

  if (!fs.existsSync(jsonFilePath)) {
    console.warn(`[buildMacros] No matching JSON file for ${baseName}.js (expected ${baseName}.json)`);
    return false;
  }

  try {
    // Read JavaScript source
    const jsSource = fs.readFileSync(jsFilePath, 'utf8');

    // Read JSON metadata
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const macroData = JSON.parse(jsonContent);

    // Validate required fields
    if (!macroData._id || !macroData.name || macroData.type !== 'script') {
      console.error(`[buildMacros] Invalid macro metadata in ${baseName}.json (missing _id, name, or type !== 'script')`);
      return false;
    }

    // Update command field
    macroData.command = jsSource;

    // Write back to JSON file (pretty-printed for now, compactJson.mjs will compact later)
    fs.writeFileSync(jsonFilePath, JSON.stringify(macroData, null, 2), 'utf8');

    console.log(`[buildMacros] ✓ Built ${baseName}.json from ${baseName}.js`);
    return true;
  } catch (error) {
    console.error(`[buildMacros] Error processing ${baseName}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('[buildMacros] Starting macro build process...');

  const macroSourceFiles = findMacroSourceFiles();

  if (macroSourceFiles.length === 0) {
    console.log('[buildMacros] No macro source files found (.js files in src/packs-source/macros/)');
    return;
  }

  console.log(`[buildMacros] Found ${macroSourceFiles.length} macro source file(s)`);

  let successCount = 0;
  let failCount = 0;

  for (const jsFile of macroSourceFiles) {
    if (processMacro(jsFile)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`[buildMacros] Complete: ${successCount} successful, ${failCount} failed`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
