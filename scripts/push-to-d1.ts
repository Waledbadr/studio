import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

// Explicitly load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function push() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !token) {
        console.error('❌ Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_D1_TOKEN in .env.local');
        process.exit(1);
    }

    // Set environment variables for the child process
    const env = {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: accountId,
        CLOUDFLARE_API_TOKEN: token
    };

    const dbId = 'df5d6fab-efb5-4b09-b3a0-be536d7edaaf';

    try {
        console.log(`🚀 Deploying schema to D1 (${dbId})...`);
        execSync(`npx wrangler d1 execute ${dbId} --file=drizzle/migrations/0000_wooden_luckman.sql --remote --yes`, { env, stdio: 'inherit' });

        console.log('🚀 Uploading data to D1...');
        execSync(`npx wrangler d1 execute ${dbId} --file=migration_data.sql --remote --yes`, { env, stdio: 'inherit' });

        console.log('✅ Migration to Cloudflare D1 completed successfully!');
    } catch (err) {
        console.error('❌ Failed to push to D1:', err.message);
        process.exit(1);
    }
}

push().catch(console.error);
