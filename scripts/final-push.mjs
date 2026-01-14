import { execSync } from 'child_process';

const acc = '65348b9b37e5081ce64a431fcd086bf0';
const tok = 'Awc61ZZGg-C4xsM5RZzeK4VNCVouxKSiqK8vbqXA';
const dbId = 'df5d6fab-efb5-4b09-b3a0-be536d7edaaf';

const env = {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: acc,
    CLOUDFLARE_API_TOKEN: tok
};

try {
    console.log('\n--- DEPLOYING SCHEMA ---');
    execSync(`npx wrangler d1 execute ${dbId} --file=drizzle/migrations/0000_wooden_luckman.sql --remote --yes`, { env, stdio: 'inherit' });

    console.log('\n--- UPLOADING DATA ---');
    execSync(`npx wrangler d1 execute ${dbId} --file=migration_data.sql --remote --yes`, { env, stdio: 'inherit' });

    console.log('\n--- VERIFYING ---');
    execSync(`npx wrangler d1 execute ${dbId} --command="SELECT name FROM sqlite_master WHERE type='table'" --remote`, { env, stdio: 'inherit' });

} catch (e) {
    console.error('ERROR:', e.message);
}
