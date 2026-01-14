import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function test() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

    console.log('Testing with:');
    console.log('ACCOUNT_ID starts with:', accountId ? accountId.substring(0, 4) : 'MISSING');
    console.log('TOKEN starts with:', token ? token.substring(0, 4) : 'MISSING');

    const env = {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: accountId,
        CLOUDFLARE_API_TOKEN: token
    };

    try {
        console.log('🚀 Listing D1 databases...');
        const out = execSync(`npx wrangler d1 list`, { env, encoding: 'utf8' });
        console.log(out);
    } catch (err) {
        console.error('❌ D1 List failed:', err.message);
    }
}

test().catch(console.error);
