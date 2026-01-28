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

async function compilePackFile(packName) {
    const srcPath = path.join(PACKS_SOURCE, packName);
    const destPath = path.join(PACKS_DEST, packName);

    if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true });
    }

    const sourceFiles = fs.readdirSync(srcPath).filter(f => f.endsWith('.json'));
    const db = new ClassicLevel(destPath, { keyEncoding: 'utf8', valueEncoding: 'json' });
    
    for (const file of sourceFiles) {
        const filePath = path.join(srcPath, file);
        const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const id = doc._id || randomID();
        
        const entry = {
            _id: id,
            name: doc.name,
            type: doc.type,
            img: doc.img || '',
            system: doc.system || {},
            effects: doc.effects || [],
            folder: doc.folder || null,
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
    console.log(`Compiled ${packName} (${sourceFiles.length} entries)`);
}

async function compileAll() {
    const packs = fs.readdirSync(PACKS_SOURCE).filter(f => 
        fs.statSync(path.join(PACKS_SOURCE, f)).isDirectory()
    );
    
    for (const pack of packs) {
        await compilePackFile(pack);
    }
    
    console.log('All packs compiled successfully!');
}

compileAll().catch(console.error);
