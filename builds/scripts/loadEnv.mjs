/**
 * Sacred environment variable loader
 * Reads from env/.env or env/local.env based on ENV_FILE parameter
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Parse a single .env file into a key-value object
 * @param {string} filePath - Path to .env file
 * @returns {Object<string, string>} Parsed environment variables
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      vars[match[1]] = match[2].trim();
    }
  }

  return vars;
}

/**
 * Load environment variables from specified env file
 * @param {string} envFile - Which env file to use ('default' or 'local')
 * @returns {Object<string, string>} Environment variables
 */
export function loadEnv(envFile = 'default') {
  const envDir = path.join(projectRoot, 'env');
  const fileName = envFile === 'local' ? 'local.env' : '.env';
  const filePath = path.join(envDir, fileName);

  const vars = parseEnvFile(filePath);

  if (!vars) {
    console.error(`\x1b[31mEnvironment file not found: ${filePath}\x1b[0m`);
    console.error(`\x1b[31mExpected files: env/.env or env/local.env\x1b[0m`);
    process.exit(1);
  }

  return vars;
}

/**
 * Get a single environment variable value
 * @param {string} key - Environment variable name
 * @param {string} envFile - Which env file to use ('default' or 'local')
 * @returns {string|null} Value or null if not found
 */
export function getEnv(key, envFile = 'default') {
  const env = loadEnv(envFile);
  return env[key] || null;
}

/**
 * Get a required environment variable, exit with error if not found
 * @param {string} key - Environment variable name
 * @param {string} envFile - Which env file to use ('default' or 'local')
 * @param {string} errorMsg - Custom error message
 * @returns {string} Value
 */
export function requireEnv(key, envFile = 'default', errorMsg = null) {
  const value = getEnv(key, envFile);
  if (!value) {
    const fileName = envFile === 'local' ? 'env/local.env' : 'env/.env';
    const msg = errorMsg || `${key} not set in ${fileName}`;
    console.error(`\x1b[31m${msg}\x1b[0m`);
    process.exit(1);
  }
  return value;
}
