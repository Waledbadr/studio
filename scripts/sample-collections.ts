import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Explicitly load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { getAdminDb } from '../src/lib/firebase-admin';

async function sampleCollections() {
    let svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (svc === '{' || (svc && svc.trim() === '{')) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        let found = false;
        let jsonLines = [];
        for (const line of lines) {
            if (line.trim().startsWith('FIREBASE_SERVICE_ACCOUNT=')) {
                found = true;
                jsonLines.push(line.substring(line.indexOf('=') + 1).trim());
                if (jsonLines[0].includes('}')) break;
                continue;
            }
            if (found) {
                jsonLines.push(line.trim());
                if (line.includes('}')) break;
            }
        }
        svc = jsonLines.join('\n').trim();
        if (svc.startsWith("'") && svc.endsWith("'")) svc = svc.substring(1, svc.length - 1);
    }
    process.env.FIREBASE_SERVICE_ACCOUNT = svc;

    const db = getAdminDb();
    const missing = [
        'assignments', 'auditLogs', 'counters', 'feedback', 'inventory',
        'inventory-categories', 'inventoryTransactions', 'mivs',
        'mrvRequests', 'mrvs', 'orders', 'reconciliationRequests',
        'serviceOrders', 'stockReconciliations', 'unique_users_emails', 'users'
    ];

    const samples: Record<string, any> = {};

    for (const coll of missing) {
        console.log(`Sampling ${coll}...`);
        const snapshot = await db.collection(coll).limit(1).get();
        if (!snapshot.empty) {
            samples[coll] = snapshot.docs[0].data();
        } else {
            samples[coll] = "EMPTY";
        }
    }

    fs.writeFileSync('collection_samples.json', JSON.stringify(samples, null, 2));
    console.log('✅ Samples saved to collection_samples.json');
}

sampleCollections().catch(console.error);
