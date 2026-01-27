const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to execute: ${command}`);
    process.exit(1);
  }
}

// 1. Export from production
console.log('Exporting from production...');
// Ensure drizzle directory exists
const drizzleDir = path.join(__dirname, '../drizzle');
if (!fs.existsSync(drizzleDir)) fs.mkdirSync(drizzleDir);

runCommand(`npx wrangler d1 export estatecare --remote --output=./drizzle/prod-dump.sql`);

// 2. Split the dump
console.log('Splitting dump file...');
runCommand(`node scripts/split-dump.js`);

// 3. Import to local
console.log('Importing to local database...');
runCommand(`node scripts/import-local.js`);

console.log('Database synchronization complete!');
