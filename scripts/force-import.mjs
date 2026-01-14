import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load env
const envContent = fs.readFileSync('.env.local', 'utf8');
const accId = envContent.match(/CLOUDFLARE_ACCOUNT_ID=(.*)/)?.[1].replace(/['"]/g, '').trim();
let token = envContent.match(/CLOUDFLARE_D1_TOKEN=(.*)/)?.[1].replace(/['"]/g, '').trim();
if (!token) {
    token = envContent.match(/CLOUDFLARE_API_TOKEN=(.*)/)?.[1].replace(/['"]/g, '').trim();
}

process.env.CLOUDFLARE_ACCOUNT_ID = accId;
process.env.CLOUDFLARE_API_TOKEN = token;

const DB_ID = 'df5d6fab-efb5-4b09-b3a0-be536d7edaaf';

const files = [
    'split_companies.sql',
    'split_contracts.sql',
    'split_invoices.sql',
    'split_notifications.sql',
    'split_occupants.sql',
    'split_residences.sql',
    'split_workers_1.sql',
    'split_workers_2.sql',
    'split_history.sql',
    'split_transfers.sql'
];

async function run() {
    for (const file of files) {
        if (!fs.existsSync(file)) continue;
        console.log(`🚀 Executing content of ${file}...`);

        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);

        for (let i = 0; i < lines.length; i++) {
            const batch = lines[i];
            if (i % 50 === 0) console.log(`   Progress: ${i}/${lines.length} lines`);

            try {
                // For Windows CMD/PowerShell, double quotes are escaped by ""
                const escapedBatch = batch.replace(/"/g, '""');
                execSync(`npx wrangler d1 execute ${DB_ID} --command="${escapedBatch}" --remote`, { stdio: 'ignore' });
            } catch (e) {
                // If double quotes fail, try another way
                try {
                    const escapedBatch2 = batch.replace(/"/g, '\\"');
                    execSync(`npx wrangler d1 execute ${DB_ID} --command="${escapedBatch2}" --remote`, { stdio: 'ignore' });
                } catch (e2) {
                    console.error(`   ❌ Failed at line ${i} in ${file}`);
                }
            }
        }
    }
    console.log('✅ Migration Finished!');
}

run();
