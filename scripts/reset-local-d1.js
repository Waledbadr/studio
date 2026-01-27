const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbId = 'df5d6fab-efb5-4b09-b3a0-be536d7edaaf'; // From wrangler.toml
const dbPath = path.join('.wrangler', 'state', 'v3', 'd1', dbId);

console.log(`Cleaning local database at: ${dbPath}`);

if (fs.existsSync(dbPath)) {
    try {
        fs.rmSync(dbPath, { recursive: true, force: true });
        console.log('Local database files removed.');
    } catch (e) {
        console.error('Failed to remove database files:', e);
        process.exit(1);
    }
} else {
    console.log('No local database found.');
}
