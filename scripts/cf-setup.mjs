#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const projectName = 'estatecare-cloudflare';
const d1DatabaseName = process.env.D1_DATABASE_NAME || 'estatecare';
const r2BucketName = process.env.R2_BUCKET_NAME || 'estatecare-storage';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: path.resolve(process.cwd()),
    shell: true,
  });

  if (result.error) {
    console.error(`Failed to run ${command} ${args.join(' ')}`);
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!accountId) {
  console.error('Missing Cloudflare account ID. Set CLOUDFLARE_ACCOUNT_ID or CF_ACCOUNT_ID in your environment.');
  process.exit(1);
}

console.log('🌩️  Cloudflare setup script started');
console.log(`Using account ID: ${accountId}`);

console.log(`\n🔧 Creating D1 database '${d1DatabaseName}'...`);
run('npx', ['wrangler', 'd1', 'create', d1DatabaseName, '--project-name', projectName, '--account-id', accountId]);

console.log(`\n🪣 Creating R2 bucket '${r2BucketName}'...`);
run('npx', ['wrangler', 'r2', 'bucket', 'create', r2BucketName, '--project-name', projectName, '--account-id', accountId]);

console.log('\n✅ Cloudflare resources created successfully.');
console.log('If the resources already existed, verify the bindings in wrangler.jsonc.');
