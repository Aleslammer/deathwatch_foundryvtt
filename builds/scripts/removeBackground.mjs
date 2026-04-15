#!/usr/bin/env node
/**
 * Background Removal Script using rembg (AI-powered)
 *
 * Usage:
 *   node builds/scripts/removeBackground.mjs <file-or-directory>
 *
 * Examples:
 *   node builds/scripts/removeBackground.mjs src/icons/enemies/chaos/zealot.png
 *   node builds/scripts/removeBackground.mjs src/icons/enemies/chaos
 *
 * This script uses the rembg Python library for AI-powered background removal.
 * Unlike ImageMagick's flood-fill, this preserves fine details and handles complex backgrounds.
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

/**
 * Execute Python rembg command via Python API
 * @param {string} inputPath - Input file path
 * @param {string} outputPath - Output file path
 * @returns {Promise<void>}
 */
function removeBackground(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Use Python API directly
    const pythonCode = `from rembg import remove; from PIL import Image; import sys; img = Image.open(sys.argv[1]); output = remove(img); output.save(sys.argv[2]); print('Success')`;
    const pythonProcess = spawn("python", ["-c", pythonCode, inputPath, outputPath]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
      // Show warnings in real-time (CUDA fallback is normal)
      if (data.toString().includes("CUDA")) {
        console.log("  (Using CPU fallback - CUDA not available)");
      }
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`rembg failed with code ${code}:\n${stderr}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Process a single file
 * @param {string} filePath - Path to file
 * @returns {Promise<void>}
 */
async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    console.log(`Skipping unsupported file: ${filePath}`);
    return;
  }

  console.log(`Processing: ${filePath}`);

  // Output to same path (rembg will overwrite if same)
  const outputPath = filePath;

  try {
    await removeBackground(filePath, outputPath);
    console.log(`✓ Background removed: ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed to process ${filePath}:`, error.message);
  }
}

/**
 * Process directory recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      await processFile(fullPath);
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: node removeBackground.mjs <file-or-directory>");
    console.error("");
    console.error("Examples:");
    console.error("  node removeBackground.mjs src/icons/enemies/chaos/zealot.png");
    console.error("  node removeBackground.mjs src/icons/enemies/chaos");
    process.exit(1);
  }

  const target = args[0];

  if (!fs.existsSync(target)) {
    console.error(`Error: Path does not exist: ${target}`);
    process.exit(1);
  }

  const stats = fs.statSync(target);

  if (stats.isDirectory()) {
    console.log(`Processing directory: ${target}`);
    await processDirectory(target);
  } else if (stats.isFile()) {
    await processFile(target);
  } else {
    console.error(`Error: Invalid path type: ${target}`);
    process.exit(1);
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
