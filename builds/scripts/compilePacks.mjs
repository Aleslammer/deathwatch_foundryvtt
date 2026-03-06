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

    const sourceFiles = getAllJsonFiles(srcPath);
    const db = new ClassicLevel(destPath, { keyEncoding: 'utf8', valueEncoding: 'json' });
    
    const { folders, folderMap } = getAllFolders(srcPath);
    
    const isRollTable = packName === 'tables';
    
    const tablesDb = isRollTable ? db.sublevel('tables', { keyEncoding: 'utf8', valueEncoding: 'json' }) : null;
    const resultsDb = isRollTable ? db.sublevel('tables.results', { keyEncoding: 'utf8', valueEncoding: 'json' }) : null;
    const foldersDb = db.sublevel('folders', { keyEncoding: 'utf8', valueEncoding: 'json' });
    const itemsDb = !isRollTable ? db.sublevel('items', { keyEncoding: 'utf8', valueEncoding: 'json' }) : null;
    
    for (const folder of folders) {
        await foldersDb.put(folder._id, folder);
    }
    
    for (const filePath of sourceFiles) {
        const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const id = doc._id || randomID();
        
        let folderId = null;
        const relativePath = path.relative(srcPath, path.dirname(filePath));
        if (relativePath && folderMap[relativePath]) {
            folderId = folderMap[relativePath];
        }
        
        if (isRollTable) {
            const resultIds = [];
            if (doc.results && Array.isArray(doc.results)) {
                for (const result of doc.results) {
                    const resultId = result._id || randomID();
                    resultIds.push(resultId);
                    const resultEntry = {
                        _id: resultId,
                        type: result.type || 'text',
                        name: result.name || '',
                        description: result.description || result.text || '',
                        img: result.img || 'icons/svg/d20-grey.svg',
                        weight: result.weight ?? 1,
                        range: result.range || [1, 1],
                        drawn: result.drawn ?? false,
                        flags: result.flags || {},
                        _stats: {
                            compendiumSource: null,
                            coreVersion: '13.351',
                            createdTime: null,
                            duplicateSource: null,
                            exportSource: null,
                            lastModifiedBy: null,
                            modifiedTime: null,
                            systemId: null,
                            systemVersion: null
                        }
                    };
                    await resultsDb.put(`${id}.${resultId}`, resultEntry);
                }
            }
            
            const entry = {
                _id: id,
                name: doc.name,
                description: doc.description || '',
                img: doc.img || 'icons/svg/d20-grey.svg',
                formula: doc.formula || '1d6',
                replacement: doc.replacement ?? true,
                displayRoll: doc.displayRoll ?? true,
                results: resultIds,
                folder: folderId,
                sort: doc.sort || 0,
                ownership: doc.ownership || { default: 0 },
                flags: doc.flags || {},
                _stats: {
                    systemId: 'deathwatch',
                    systemVersion: '0.0.2',
                    coreVersion: '13.351',
                    createdTime: null,
                    modifiedTime: null,
                    lastModifiedBy: null,
                    compendiumSource: null,
                    duplicateSource: null
                }
            };
            
            await tablesDb.put(id, entry);
        } else {
            const entry = {
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
                    createdTime: null,
                    modifiedTime: null,
                    lastModifiedBy: null,
                    compendiumSource: null,
                    duplicateSource: null
                }
            };
            await itemsDb.put(id, entry);
        }
    }
    
    await db.close();
    console.log(`Compiled ${packName} (${sourceFiles.length} entries, ${folders.length} folders)`);
}

async function compileAll() {
    // Delete entire packs destination directory first
    if (fs.existsSync(PACKS_DEST)) {
        fs.rmSync(PACKS_DEST, { recursive: true });
        console.log('Cleared all existing packs');
    }
    
    const packs = fs.readdirSync(PACKS_SOURCE).filter(f => 
        fs.statSync(path.join(PACKS_SOURCE, f)).isDirectory() && !f.startsWith('_')
    );
    
    for (const pack of packs) {
        await compilePackFile(pack);
    }
    
    console.log('All packs compiled successfully!');
}

compileAll().catch(console.error);
