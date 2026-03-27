/**
 * Manual developer utility — assigns faction-based IDs to all enemy/horde actors
 * and their embedded items. Run directly when adding or reordering enemies:
 *
 *   node builds/scripts/migrateEnemyIds.mjs
 *
 * This is NOT called by any npm script or build pipeline. It is safe to re-run
 * at any time (idempotent). After running, use `npm run build:packs` to format,
 * validate, and compile.
 *
 * To add a new enemy:
 *   1. Create the JSON file in the faction subfolder
 *   2. Add an entry to the FACTIONS array below with the next sequential number
 *   3. Run this script
 *   4. Run `npm run build:packs`
 *
 * To add a new faction:
 *   1. Create subfolder: src/packs-source/enemies/{faction}/
 *   2. Add a new object to the FACTIONS array with dir, faction key, and files
 *   3. Run this script
 *
 * ID format (all 16 characters):
 *   Enemy actors:  enmy{faction}{pad}{num}    e.g. enmytyranid00001
 *   Horde actors:  hord{faction}{pad}{num}    e.g. hordtyranid00001
 *   Enemy items:   ei{faction}{num}{pad}0{seq} e.g. eityranid0100001
 *   Horde items:   hi{faction}{num}{pad}0{seq} e.g. hityranid0100001
 */
import fs from "fs";
import path from "path";

// Define factions and their files
const FACTIONS = [
  {
    dir: "src/packs-source/enemies/tyranid",
    faction: "tyranid",
    files: {
      "hormagaunt.json":              { num: "01", type: "enmy" },
      "termagant.json":               { num: "02", type: "enmy" },
      "tyranid-warrior.json":         { num: "03", type: "enmy" },
      "tyranid-shrike.json":          { num: "04", type: "enmy" },
      "carnifex.json":                { num: "05", type: "enmy" },
      "carnifex-thornback.json":      { num: "06", type: "enmy" },
      "carnifex-venomspitter.json":   { num: "07", type: "enmy" },
      "carnifex-bile-beast.json":     { num: "08", type: "enmy" },
      "purestrain-genestealer.json":  { num: "09", type: "enmy" },
      "broodlord.json":                { num: "10", type: "enmy" },
      "hive-tyrant.json":               { num: "11", type: "enmy" },
      "gargoyle.json":                  { num: "12", type: "enmy" },
      "lictor.json":                    { num: "13", type: "enmy" },
      "hormagaunt-horde.json":        { num: "01", type: "hord" },
      "termagant-horde.json":         { num: "02", type: "hord" },
      "gargoyle-horde.json":          { num: "03", type: "hord" },
    }
  },
  {
    dir: "src/packs-source/enemies/ork",
    faction: "ork",
    files: {
      "ork-boy.json":       { num: "01", type: "enmy" },
      "ork-boy-horde.json": { num: "01", type: "hord" },
    }
  }
];

for (const { dir, faction, files } of FACTIONS) {
  console.log(`\n--- ${faction} ---`);
  for (const [filename, config] of Object.entries(files)) {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${filename} not found`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const { num, type } = config;

  // Pad faction to fit 16-char IDs
  // Actor: enmy{faction}{pad}{num} or hord{faction}{pad}{num}
  // Item:  ei{faction}{pad}{num}0{seq} or hi{faction}{pad}{num}0{seq}
  const actorPrefix = type === "hord" ? "hord" : "enmy";
  const itemPrefixStr = type === "hord" ? "hi" : "ei";
  const actorPad = "0".repeat(16 - actorPrefix.length - faction.length - num.length);
  data._id = `${actorPrefix}${faction}${actorPad}${num}`;

  // Renumber embedded items
  if (Array.isArray(data.items)) {
    let itemSeq = 1;
    for (const item of data.items) {
      const seqStr = String(itemSeq).padStart(2, "0");
      const itemBase = `${itemPrefixStr}${faction}${num}`;
      const itemPad = "0".repeat(16 - itemBase.length - 1 - seqStr.length);
      item._id = `${itemBase}${itemPad}0${seqStr}`;
      itemSeq++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`OK: ${filename} -> ${data._id} (${data.items?.length || 0} items)`);
  }
}

console.log("\nDone! Run 'npm run build:packs' to validate and compile.");
