/**
 * Compact JSON Formatter with Smart Key Ordering
 *
 * Re-serializes JSON files so that:
 * 1. Keys are ordered logically by item type (not alphabetically)
 * 2. Objects/arrays that fit within print width are inlined
 *
 * Usage: node builds/scripts/compactJson.mjs [path]
 *   path defaults to src/packs-source
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";
import { randomBytes } from "crypto";

const PRINT_WIDTH = 80;
const INDENT = "  ";

function randomID() {
  return randomBytes(8).toString("hex");
}

// ── Key ordering definitions ──────────────────────────────────────────────

const TOP_LEVEL = ["_id", "name", "type", "img", "system", "items", "prototypeToken", "effects", "flags", "folder", "sort", "ownership"];

const SYSTEM_COMMON_HEAD = ["book", "page"];
const SYSTEM_COMMON_TAIL = ["modifiers"];

const SYSTEM_BY_TYPE = {
  weapon: [
    "class", "dmg", "dmgType", "penetration",
    "range", "rof", "clip", "reload",
    "equipped", "wt",
    "req", "renown",
    "attachedQualities", "attachedUpgrades",
    "description", "modifiers"
  ],
  armor: [
    "head", "body", "left_arm", "right_arm", "left_leg", "right_leg",
    "req", "renown",
    "attachedHistories",
    "description", "modifiers", "armorEffects"
  ],
  "armor-history": [
    "description", "modifiers"
  ],
  ammunition: [
    "capacity",
    "quantity",
    "req", "renown",
    "description", "modifiers"
  ],
  gear: [
    "equipped", "wt",
    "req", "renown",
    "shortDescription",
    "description", "modifiers"
  ],
  talent: [
    "prerequisite", "benefit",
    "description",
    "cost", "subsequentCost", "stackable",
    "compendiumId", "modifiers"
  ],
  trait: [
    "description", "modifiers"
  ],
  "weapon-quality": [
    "key", "value",
    "description"
  ],
  "weapon-upgrade": [
    "key", "singleShotOnly",
    "req", "renown", "wt",
    "description", "modifiers"
  ],
  implant: [
    "equipped",
    "summary", "description", "modifiers"
  ],
  cybernetic: [
    "equipped",
    "description", "modifiers"
  ],
  demeanour: [
    "description", "chapter"
  ],
  "psychic-power": [
    "key", "discipline", "rank",
    "focusPower", "range", "sustained", "subtypes",
    "action", "opposed", "cost", "class",
    "description"
  ],
  "special-ability": [
    "key",
    "description"
  ],
  "critical-effect": [
    "damageType", "location", "severity",
    "description", "effects"
  ],
  chapter: [
    "description",
    "skillCosts", "talentCosts", "modifiers"
  ],
  specialty: [
    "hasPsyRating",
    "description",
    "characteristicCosts", "talentCosts", "rankCosts", "modifiers"
  ]
};

// Enemy/horde system keys
const SYSTEM_ACTOR = [
  "characteristics",
  "wounds", "fatigue",
  "skills",
  "psyRating",
  "armor",
  "modifiers", "conditions",
  "description"
];

// Modifier object key order
const MODIFIER_KEYS = [
  "_id", "name", "modifier", "type",
  "effectType", "valueAffected", "weaponClass", "qualityException",
  "enabled"
];

// Quality object key order
const QUALITY_KEYS = ["id", "value"];

// Embedded item top-level keys
const EMBEDDED_ITEM = ["_id", "_sourceId", "name", "type", "img", "system"];

// Prototype token keys
const TOKEN_KEYS = ["name", "displayName", "actorLink", "disposition", "width", "height", "bar1"];

// Capacity keys
const CAPACITY_KEYS = ["value", "max"];

// ── Ordering logic ────────────────────────────────────────────────────────

function orderKeys(obj, keyOrder) {
  const ordered = {};
  for (const key of keyOrder) {
    if (key in obj) ordered[key] = obj[key];
  }
  // Append any remaining keys not in the order list
  for (const key of Object.keys(obj)) {
    if (!(key in ordered)) ordered[key] = obj[key];
  }
  return ordered;
}

function orderSystemKeys(system, type) {
  // Try type-specific ordering
  const typeOrder = SYSTEM_BY_TYPE[type];
  if (typeOrder) {
    const order = [...SYSTEM_COMMON_HEAD, ...typeOrder];
    return orderKeys(system, order);
  }

  // Actor types (enemy, horde, character, npc)
  if (type === "enemy" || type === "horde" || type === "character" || type === "npc") {
    return orderKeys(system, SYSTEM_ACTOR);
  }

  return system;
}

function orderModifier(mod) {
  if (!mod._id) mod._id = randomID();
  return orderKeys(mod, MODIFIER_KEYS);
}

function orderQuality(q) {
  if (typeof q === "string") return q;
  return orderKeys(q, QUALITY_KEYS);
}

function orderDocument(doc) {
  const type = doc.type;
  const isEmbedded = !TOP_LEVEL.some(k => k === "items" && k in doc) && doc._id && doc.type;

  // Order top-level keys
  const topOrder = (doc.items !== undefined) ? TOP_LEVEL : EMBEDDED_ITEM;
  let ordered = orderKeys(doc, topOrder.includes("items") ? TOP_LEVEL : EMBEDDED_ITEM.concat(TOP_LEVEL));

  // For top-level docs with all standard keys, use TOP_LEVEL
  if ("items" in doc || "prototypeToken" in doc) {
    ordered = orderKeys(doc, TOP_LEVEL);
  } else if ("_sourceId" in doc) {
    ordered = orderKeys(doc, EMBEDDED_ITEM);
  } else {
    ordered = orderKeys(doc, TOP_LEVEL);
  }

  // Order system keys
  if (ordered.system && typeof ordered.system === "object") {
    ordered.system = orderSystemKeys({ ...ordered.system }, type);

    // Order modifiers array
    if (Array.isArray(ordered.system.modifiers)) {
      ordered.system.modifiers = ordered.system.modifiers.map(orderModifier);
    }

    // Order attachedQualities
    if (Array.isArray(ordered.system.attachedQualities)) {
      ordered.system.attachedQualities = ordered.system.attachedQualities.map(orderQuality);
    }

    // Order capacity
    if (ordered.system.capacity && typeof ordered.system.capacity === "object") {
      ordered.system.capacity = orderKeys(ordered.system.capacity, CAPACITY_KEYS);
    }
  }

  // Order embedded items
  if (Array.isArray(ordered.items)) {
    ordered.items = ordered.items.map(orderDocument);
  }

  // Order prototypeToken
  if (ordered.prototypeToken && typeof ordered.prototypeToken === "object") {
    ordered.prototypeToken = orderKeys(ordered.prototypeToken, TOKEN_KEYS);
  }

  return ordered;
}

// ── Compact serialization ─────────────────────────────────────────────────

/**
 * Produce Prettier-compatible inline JSON.
 * Objects: { "key": value, "key2": value2 }
 * Arrays: [value, value2]
 * Returns null if value contains strings with newlines (not suitable for inline).
 */
function prettierInline(value) {
  if (value === null || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const parts = value.map((v) => {
      if (v === null) return "null";
      if (typeof v !== "object") return JSON.stringify(v);
      const inner = prettierInline(v);
      if (!inner) return null;
      return inner;
    });
    if (parts.some((p) => p === null)) return null;
    return `[${parts.join(", ")}]`;
  }

  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";

  const parts = keys.map((k) => {
    const v = value[k];
    if (typeof v === "string" && v.includes("\n")) return null;
    if (v !== null && typeof v === "object") {
      const inner = prettierInline(v);
      if (!inner) return null;
      return `${JSON.stringify(k)}: ${inner}`;
    }
    return `${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  });
  if (parts.some((p) => p === null)) return null;
  return `{ ${parts.join(", ")} }`;
}

function compactStringify(value, currentIndent = "", contextWidth = 0) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "number") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);

  const nextIndent = currentIndent + INDENT;
  const effectiveIndent = contextWidth || currentIndent.length;

  // Try inline with Prettier-compatible spacing
  const inline = prettierInline(value);
  if (inline && effectiveIndent + inline.length + 1 <= PRINT_WIDTH) {
    return inline;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => {
      return `${nextIndent}${compactStringify(item, nextIndent)}`;
    });
    return `[\n${items.join(",\n")}\n${currentIndent}]`;
  }

  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";

  const entries = keys.map((key) => {
    const keyPrefix = `${nextIndent}${JSON.stringify(key)}: `;
    const valStr = compactStringify(value[key], nextIndent, keyPrefix.length);
    return `${keyPrefix}${valStr}`;
  });
  return `{\n${entries.join(",\n")}\n${currentIndent}}`;
}

// ── File processing ───────────────────────────────────────────────────────

function processFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.log(`  ⚠ Skipping invalid JSON: ${filePath}`);
    return false;
  }

  // Handle both single documents and RollTable format
  const isRollTable = parsed.type === "RollTable" || parsed.results;
  const ordered = isRollTable ? parsed : orderDocument(parsed);

  const formatted = compactStringify(ordered) + "\n";
  if (formatted !== content) {
    writeFileSync(filePath, formatted, "utf-8");
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith("_")) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkDir(full));
    } else if (full.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

const targetDir = resolve(process.argv[2] || "src/packs-source");
const files = walkDir(targetDir);
let changed = 0;

for (const file of files) {
  if (processFile(file)) {
    changed++;
  }
}

console.log(
  `\n✅ Compacted ${changed} of ${files.length} JSON files in ${targetDir}`
);
