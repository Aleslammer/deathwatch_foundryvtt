import fs from 'fs';
import path from 'path';

const PACKS_SOURCE = './src/packs-source';

function getAllJsonFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      results = results.concat(getAllJsonFiles(filePath));
    } else if (file.endsWith('.json')) {
      results.push(filePath);
    }
  }
  return results;
}

function validateTalentIds() {
  const talentDir = path.join(PACKS_SOURCE, 'talents');
  if (!fs.existsSync(talentDir)) {
    console.error('\x1b[31mTalents directory not found\x1b[0m');
    return false;
  }

  const files = getAllJsonFiles(talentDir);
  const errors = [];

  for (const filePath of files) {
    const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (doc.type !== 'talent') continue;
    const relative = path.relative(PACKS_SOURCE, filePath);
    if (!doc.system?.compendiumId) {
      errors.push(`${relative}: missing compendiumId`);
    } else if (doc._id !== doc.system.compendiumId) {
      errors.push(`${relative}: _id "${doc._id}" !== compendiumId "${doc.system.compendiumId}"`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n\x1b[31m========================================`);
    console.error(`  VALIDATION FAILED: ${errors.length} talent ID mismatch(es)`);
    console.error(`========================================\x1b[0m`);
    for (const err of errors) {
      console.error(`  ${err}`);
    }
    console.error('');
    return false;
  }

  console.log(`\u2705 All ${files.length} talents have matching _id and compendiumId`);
  return true;
}

function validateUniqueIds() {
  const idMap = new Map();
  const duplicates = [];
  const packs = fs.readdirSync(PACKS_SOURCE).filter(f =>
    fs.statSync(path.join(PACKS_SOURCE, f)).isDirectory() && !f.startsWith('_')
  );

  for (const pack of packs) {
    const files = getAllJsonFiles(path.join(PACKS_SOURCE, pack));
    for (const filePath of files) {
      const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!doc._id) continue;
      const relative = path.relative(PACKS_SOURCE, filePath);
      if (idMap.has(doc._id)) {
        duplicates.push({ id: doc._id, file1: idMap.get(doc._id), file2: relative });
      } else {
        idMap.set(doc._id, relative);
      }
    }
  }

  if (duplicates.length > 0) {
    console.error(`\n\x1b[31m========================================`);
    console.error(`  VALIDATION FAILED: ${duplicates.length} duplicate _id(s) found`);
    console.error(`========================================\x1b[0m`);
    for (const dup of duplicates) {
      console.error(`\n\x1b[31mDuplicate _id "${dup.id}":\x1b[0m`);
      console.error(`  1) ${dup.file1}`);
      console.error(`  2) ${dup.file2}`);
    }
    console.error('');
    return false;
  }

  console.log(`\u2705 Validated ${idMap.size} unique _id values across all packs`);
  return true;
}

function validateWeaponQualityIds() {
  const qualityDir = path.join(PACKS_SOURCE, 'weapon-qualities');
  if (!fs.existsSync(qualityDir)) {
    console.error('\x1b[31mWeapon qualities directory not found\x1b[0m');
    return false;
  }

  const files = getAllJsonFiles(qualityDir);
  const errors = [];

  for (const filePath of files) {
    const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (doc.type !== 'weapon-quality') continue;
    const relative = path.relative(PACKS_SOURCE, filePath);
    if (!doc.system?.key) {
      errors.push(`${relative}: missing system.key`);
    } else if (doc._id !== doc.system.key) {
      errors.push(`${relative}: _id "${doc._id}" !== key "${doc.system.key}"`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n\x1b[31m========================================`);
    console.error(`  VALIDATION FAILED: ${errors.length} weapon quality ID/key mismatch(es)`);
    console.error(`========================================\x1b[0m`);
    for (const err of errors) {
      console.error(`  ${err}`);
    }
    console.error('');
    return false;
  }

  console.log(`\u2705 All ${files.length} weapon qualities have matching _id and key`);
  return true;
}

function syncEmbeddedItems() {
  const SYNC_DIRS = ['traits', 'talents'];
  const ACTOR_DIRS = ['enemies'];

  // Build lookup of compendium source items by _id
  const lookup = {};
  for (const dir of SYNC_DIRS) {
    const dirPath = path.join(PACKS_SOURCE, dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const filePath of getAllJsonFiles(dirPath)) {
      const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (doc._id) lookup[doc._id] = doc;
    }
  }

  let totalUpdates = 0;

  for (const dir of ACTOR_DIRS) {
    const dirPath = path.join(PACKS_SOURCE, dir);
    if (!fs.existsSync(dirPath)) continue;

    for (const filePath of getAllJsonFiles(dirPath)) {
      const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!Array.isArray(doc.items)) continue;

      let changed = false;
      const relative = path.relative(PACKS_SOURCE, filePath);

      for (const item of doc.items) {
        if (!item._sourceId) continue;
        const source = lookup[item._sourceId];
        if (!source) {
          console.warn(`  \x1b[33mWARNING: _sourceId "${item._sourceId}" not found for "${item.name}" in ${relative}\x1b[0m`);
          continue;
        }

        const fields = [];
        const srcMods = source.system?.modifiers || [];
        const itemMods = item.system?.modifiers || [];
        const mergedMods = srcMods.map(srcMod => {
          const isPlaceholder = String(srcMod.modifier) === '0';
          if (isPlaceholder) {
            const localMod = itemMods.find(m => m._id === srcMod._id);
            if (localMod) return { ...srcMod, modifier: localMod.modifier };
          }
          return srcMod;
        });
        const mergedStr = JSON.stringify(mergedMods);
        const itemStr = JSON.stringify(itemMods);
        if (mergedStr !== itemStr) { item.system.modifiers = JSON.parse(mergedStr); fields.push('modifiers'); }
        if (source.system?.description && item.system?.description !== source.system.description) { item.system.description = source.system.description; fields.push('description'); }
        if (source.system?.book && item.system?.book !== source.system.book) { item.system.book = source.system.book; fields.push('book'); }
        if (source.system?.page && item.system?.page !== source.system.page) { item.system.page = source.system.page; fields.push('page'); }
        if (source.img && item.img !== source.img) { item.img = source.img; fields.push('img'); }

        if (fields.length > 0) {
          console.log(`  \u2705 ${relative} → ${item.name}: synced ${fields.join(', ')}`);
          changed = true;
          totalUpdates++;
        }
      }

      if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
      }
    }
  }

  if (totalUpdates > 0) {
    console.log(`\u2705 Synced ${totalUpdates} embedded item(s) from compendium sources`);
  } else {
    console.log(`\u2705 All embedded items are up to date`);
  }
  return true;
}

const talentsOk = validateTalentIds();
const qualitiesOk = validateWeaponQualityIds();
const idsOk = validateUniqueIds();
const syncOk = syncEmbeddedItems();

if (!talentsOk || !qualitiesOk || !idsOk || !syncOk) {
  process.exit(1);
}
