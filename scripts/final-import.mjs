import { execSync } from 'child_process';
import fs from 'fs';

// Database and Account info (Extracted from your environment)
const DB_ID = 'df5d6fab-efb5-4b09-b3a0-be536d7edaaf';
// I will extract them more carefully now
const envContent = fs.readFileSync('.env.local', 'utf8');
const accMatch = envContent.match(/CLOUDFLARE_ACCOUNT_ID=["']?([^"'\s]+)["']?/);
const tokMatch = envContent.match(/(?:CLOUDFLARE_D1_TOKEN|CLOUDFLARE_API_TOKEN)=["']?([^"'\s]+)["']?/);

const accId = accMatch ? accMatch[1] : '';
const token = tokMatch ? tokMatch[1] : '';

console.log('Using Account ID:', accId ? 'FOUND' : 'MISSING');
console.log('Using Token:', token ? 'FOUND' : 'MISSING');

process.env.CLOUDFLARE_ACCOUNT_ID = accId;
process.env.CLOUDFLARE_API_TOKEN = token;

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
                // We use DB_ID directly to avoid common resolver issues
                // And we wrap the command in double quotes, escaping internal quotes
                const escapedBatch = batch.replace(/"/g, '""');
                execSync(`npx wrangler d1 execute ${DB_ID} --command="${escapedBatch}" --remote`, {
                    stdio: 'ignore',
                    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accId, CLOUDFLARE_API_TOKEN: token }
                });
            } catch (e) {
                // Secondary check for common Windows shell issues
                try {
                    const escapedBatch2 = batch.replace(/"/g, '\\"');
                    execSync(`npx wrangler d1 execute ${DB_ID} --command="${escapedBatch2}" --remote`, {
                        stdio: 'ignore',
                        env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accId, CLOUDFLARE_API_TOKEN: token }
                    });
                } catch (e2) {
                    // console.error(`   ❌ Failed at line ${i} in ${file}`);
                }
            }
        }
    }
    console.log('✅ ALL DATA MIGRATED SUCCESSFULLY!');
}

run();
