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
    'split_contracts.sql'
];

async function run() {
    for (const file of files) {
        if (!fs.existsSync(file)) continue;
        console.log(`🚀 Executing content of ${file}...`);

        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);

        for (let i = 0; i < lines.length; i++) {
            const batch = lines[i];
            console.log(`   Trying line ${i}...`);

            try {
                // Use spawnSync for more control
                const child = execSync(`npx wrangler d1 execute ${DB_ID} --command="${batch.replace(/"/g, '""')}" --remote`, { stdio: 'pipe' });
                console.log('      Success');
            } catch (e) {
                console.error(`      ❌ Error: ${e.stderr?.toString() || e.message}`);
            }
        }
    }
}

run();
