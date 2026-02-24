import fs from 'fs';
import path from 'path';
import { ClassicLevel } from 'classic-level';

const PACKS_SOURCE = './src/packs-source';
const PACKS_DEST = './src/packs';

function randomID() {
    return Array.from({ length: 16 }, () => 
        Math.floor(Math.random() * 16).toString(16)
    ).join('');
}

function getAllJsonFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(getAllJsonFiles(filePath));
        } else if (file.endsWith('.json')) {
            results.push(filePath);
        }
    });
    return results;
}

function getAllFolders(dir, basePath = dir, parentId = null) {
    const folders = [];
    const folderMap = {};
    const list = fs.readdirSync(dir);
    
    for (const item of list) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('_')) {
            const folderId = randomID();
            const folderName = item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const relativePath = path.relative(basePath, fullPath);
            folderMap[relativePath] = folderId;
            folders.push({
                _id: folderId,
                name: folderName,
                sorting: 'a',
                folder: parentId,
                type: 'Item',
                _stats: {
                    systemId: 'deathwatch',
                    systemVersion: '0.0.2',
                    coreVersion: '13.351'
                }
            });
            const subResult = getAllFolders(fullPath, basePath, folderId);
            folders.push(...subResult.folders);
            Object.assign(folderMap, subResult.folderMap);
        }
    }
    return { folders, folderMap };
}

async function compilePackFile(packName) {
    const srcPath = path.join(PACKS_SOURCE, packName);
    const destPath = path.join(PACKS_DEST, packName);

    if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true });
    }

    const sourceFiles = getAllJsonFiles(srcPath);
    const db = new ClassicLevel(destPath, { keyEncoding: 'utf8', valueEncoding: 'json' });
    
    const { folders, folderMap } = getAllFolders(srcPath);
    
    for (const folder of folders) {
        await db.put(`!folders!${folder._id}`, folder);
    }
    
    for (const filePath of sourceFiles) {
        const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const id = doc._id || randomID();
        
        let folderId = null;
        const relativePath = path.relative(srcPath, path.dirname(filePath));
        if (relativePath && folderMap[relativePath]) {
            folderId = folderMap[relativePath];
        }
        
        // Check if this is a RollTable
        const isRollTable = packName === 'tables' || doc.formula !== undefined;
        
        let entry;
        if (isRollTable) {
            entry = {
                _id: id,
                name: doc.name,
                formula: doc.formula || '1d6',
                replacement: doc.replacement ?? true,
                displayRoll: doc.displayRoll ?? true,
                folder: folderId,
                sort: doc.sort || 0,
                ownership: doc.ownership || { default: 0 },
                flags: doc.flags || {},
                _stats: {
                    systemId: 'deathwatch',
                    systemVersion: '0.0.2',
                    coreVersion: '13.351',
                    lastModifiedBy: null,
                    compendiumSource: null,
                    duplicateSource: null,
                    exportSource: null
                }
            };
            
            // Store table entry
            await db.put(`!tables!${id}`, entry);
            
            // Store each result as a separate embedded document
            if (doc.results && Array.isArray(doc.results)) {
                for (const result of doc.results) {
                    const resultEntry = {
                        _id: result._id || randomID(),
                        type: result.type ?? 0,
                        text: result.text || '',
                        img: result.img || 'icons/svg/d20-grey.svg',
                        weight: result.weight ?? 1,
                        range: result.range || [1, 1],
                        drawn: result.drawn ?? false,
                        flags: result.flags || {},
                        _stats: {
                            compendiumSource: null,
                            duplicateSource: null
                        }
                    };
                    await db.put(`!tables.results!${id}.${resultEntry._id}`, resultEntry);
                }
            }
            continue;
        } else {
            entry = {
                _id: id,
                name: doc.name,
                type: doc.type,
                img: doc.img || '',
                system: doc.system || {},
                effects: doc.effects || [],
                folder: folderId,
                sort: doc.sort || 0,
                ownership: doc.ownership || { default: 0 },
                flags: doc.flags || {},
                _stats: {
                    systemId: 'deathwatch',
                    systemVersion: '0.0.2',
                    coreVersion: '13.351',
                    lastModifiedBy: null,
                    compendiumSource: null,
                    duplicateSource: null,
                    exportSource: null
                }
            };
        }
        
        const key = isRollTable ? `!tables!${id}` : `!items!${id}`;
        if (!isRollTable) {
            await db.put(key, entry);
        }
    }
    
    await db.close();
    console.log(`Compiled ${packName} (${sourceFiles.length} entries, ${folders.length} folders)`);
}

async function compileAll() {
    const packs = fs.readdirSync(PACKS_SOURCE).filter(f => 
        fs.statSync(path.join(PACKS_SOURCE, f)).isDirectory() && !f.startsWith('_')
    );
    
    for (const pack of packs) {
        await compilePackFile(pack);
    }
    
    console.log('All packs compiled successfully!');
}

compileAll().catch(console.error);
