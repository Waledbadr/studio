import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Explicitly load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { getAdminDb } from '../src/lib/firebase-admin';

async function listCollections() {
    let svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (svc === '{' || (svc && svc.trim() === '{')) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        let found = false;
        let jsonLines = [];
        for (const line of lines) {
            if (line.trim().startsWith('FIREBASE_SERVICE_ACCOUNT=')) {
                found = true;
                const val = line.substring(line.indexOf('=') + 1).trim();
                if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
                    svc = val.substring(1, val.length - 1);
                    break;
                }
                jsonLines.push(val);
                if (val.includes('}')) break;
                continue;
            }
            if (found) {
                jsonLines.push(line.trim());
                if (line.includes('}')) break;
            }
        }
        if (jsonLines.length > 0) {
            svc = jsonLines.join('\n').trim();
            if (svc.startsWith("'") && svc.endsWith("'")) svc = svc.substring(1, svc.length - 1);
            if (svc.startsWith('"') && svc.endsWith('"')) svc = svc.substring(1, svc.length - 1);
        }
    }
    process.env.FIREBASE_SERVICE_ACCOUNT = svc;

    const db = getAdminDb();
    if (!db) {
        console.error('❌ Failed to initialize Firebase Admin Database.');
        process.exit(1);
    }

    const collections = await db.listCollections();
    console.log('📦 Firestore Collections:');
    collections.forEach(c => console.log(` - ${c.id}`));
}

listCollections().catch(console.error);
