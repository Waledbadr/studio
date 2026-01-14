import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle/migrations',
    dialect: 'sqlite',
    driver: 'd1-http', // For Cloudflare D1
    dbCredentials: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: 'df5d6fab-efb5-4b09-b3a0-be536d7edaaf',
        token: process.env.CLOUDFLARE_D1_TOKEN!,
    },
});
