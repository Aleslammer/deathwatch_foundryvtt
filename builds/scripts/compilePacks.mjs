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

async function compilePackFile(packName) {
    const srcPath = path.join(PACKS_SOURCE, packName);
    const destPath = path.join(PACKS_DEST, packName);

    if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true });
    }

    const sourceFiles = getAllJsonFiles(srcPath);
    const db = new ClassicLevel(destPath, { keyEncoding: 'utf8', valueEncoding: 'json' });
    
    // Create folder map based on directory structure
    const folderMap = {};
    const folders = [];
    
    // Scan for subdirectories and create folder entries
    const subdirs = fs.readdirSync(srcPath).filter(f => {
        const fullPath = path.join(srcPath, f);
        return fs.statSync(fullPath).isDirectory() && !f.startsWith('_');
    });
    
    for (const subdir of subdirs) {
        const folderId = randomID();
        const folderName = subdir.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        folderMap[subdir] = folderId;
        folders.push({
            _id: folderId,
            name: folderName,
            sorting: 'a',
            folder: null,
            type: 'Item',
            _stats: {
                systemId: 'deathwatch',
                systemVersion: '0.0.2',
                coreVersion: '13.351'
            }
        });
    }
    
    // Write folders to database
    for (const folder of folders) {
        await db.put(`!folders!${folder._id}`, folder);
    }
    
    for (const filePath of sourceFiles) {
        const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const id = doc._id || randomID();
        
        // Determine folder based on file path
        let folderId = null;
        const relativePath = path.relative(srcPath, filePath);
        const firstDir = relativePath.split(path.sep)[0];
        if (folderMap[firstDir]) {
            folderId = folderMap[firstDir];
        }
        
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
                lastModifiedBy: null,
                compendiumSource: null,
                duplicateSource: null,
                exportSource: null
            }
        };
        
        await db.put(`!items!${id}`, entry);
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
