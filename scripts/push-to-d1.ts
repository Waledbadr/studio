import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Explicitly load .env.local if present (do not require it)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

function looksLikeUuid(value?: string) {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

function readD1FromWranglerToml(): { databaseName?: string; binding?: string; databaseId?: string } {
    try {
        const p = path.resolve(process.cwd(), 'wrangler.toml');
        if (!fs.existsSync(p)) return {};
        const txt = fs.readFileSync(p, 'utf8');
        const blockMatch = txt.match(/\[\[d1_databases\]\][\s\S]*?(?=\n\[\[|\n\[vars\]|\n\[\[r2_buckets\]\]|$)/);
        const block = blockMatch?.[0] || txt;
        const databaseName = block.match(/database_name\s*=\s*"([^"]+)"/)?.[1]?.trim();
        const binding = block.match(/binding\s*=\s*"([^"]+)"/)?.[1]?.trim();
        const databaseId = block.match(/database_id\s*=\s*"([^"]+)"/)?.[1]?.trim();
        return { databaseName, binding, databaseId };
    } catch {
        return {};
    }
}

async function push() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_D1_TOKEN;

    if (looksLikeUuid(token)) {
        console.error('❌ CLOUDFLARE_API_TOKEN/CLOUDFLARE_D1_TOKEN يبدو مثل UUID (Database ID) وليس API token.');
        process.exit(1);
    }

    // Wrangler `d1 execute` expects a database *name* or *binding*, not the UUID.
    const cfg = readD1FromWranglerToml();
    const db = (process.env.D1_DATABASE_NAME || process.env.D1_DATABASE_BINDING || cfg.databaseName || cfg.binding)?.trim();
    if (!db) {
        console.error('❌ Missing D1 database name/binding. Set D1_DATABASE_NAME (or configure database_name/binding in wrangler.toml).');
        process.exit(1);
    }

    // Let Wrangler auth work either via login session OR via token env vars.
    const childEnv: NodeJS.ProcessEnv = { ...process.env };
    if (accountId) childEnv.CLOUDFLARE_ACCOUNT_ID = accountId;
    if (token) childEnv.CLOUDFLARE_API_TOKEN = token;

    try {
        console.log(`🚀 Deploying schema to D1 (${db})...`);
        execSync(`npx wrangler d1 execute ${db} --file=drizzle/migrations/0000_wooden_luckman.sql --remote --yes`, { env: childEnv, stdio: 'inherit' });

        console.log('🚀 Uploading data to D1...');
        execSync(`npx wrangler d1 execute ${db} --file=migration_data.sql --remote --yes`, { env: childEnv, stdio: 'inherit' });

        console.log('✅ Migration to Cloudflare D1 completed successfully!');
    } catch (err: any) {
        console.error('❌ Failed to push to D1:', err?.message || err);
        process.exit(1);
    }
}

push().catch((e) => {
    console.error(e);
    process.exit(1);
});
