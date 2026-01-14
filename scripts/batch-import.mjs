import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DB_ID = 'df5d6fab-efb5-4b09-b3a0-be536d7edaaf';
// Automatically find all split SQL files
const files = fs.readdirSync(process.cwd())
    .filter(f => f.startsWith('split_') && f.endsWith('.sql'))
    .sort((a, b) => {
        // Special sorting to ensure parts are imported in order if needed
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

console.log(`📂 Found ${files.length} SQL files to import.`);

async function run() {
    console.log('🚀 Starting Optimized Batch Import...');

    // Check if wrangler is available
    try {
        execSync('npx wrangler --version', { stdio: 'ignore' });
    } catch (e) {
        console.error('❌ Error: wrangler not found. Please run: npm install -g wrangler');
        process.exit(1);
    }

    for (const file of files) {
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Skipping missing file: ${file}`);
            continue;
        }

        console.log(`📤 Importing ${file} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)...`);

        try {
            // Standard wrangler command for file execution
            execSync(`npx wrangler d1 execute estatecare --file="${file}" --remote --yes`, {
                stdio: 'inherit'
            });
            console.log(`✅ Successfully imported ${file}`);
        } catch (e) {
            console.error(`❌ Failed to import ${file}. Error: ${e.message}`);
            console.log('🔄 Attempting with DB_ID instead of name...');
            try {
                execSync(`npx wrangler d1 execute ${DB_ID} --file="${file}" --remote --yes`, {
                    stdio: 'inherit'
                });
                console.log(`✅ Successfully imported ${file} (via ID)`);
            } catch (e2) {
                console.error(`❌ Persistent failure for ${file}.`);
            }
        }

        // Brief pause between files to prevent network saturation
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✨ DATA MIGRATION CHECK:');
    try {
        execSync(`npx wrangler d1 execute estatecare --command="SELECT (SELECT COUNT(*) FROM workers) as workers, (SELECT COUNT(*) FROM residences) as residences, (SELECT COUNT(*) FROM accommodation_history) as history" --remote`, {
            stdio: 'inherit'
        });
    } catch (e) { }

    console.log('\n🏁 FINISHED!');
}

run().catch(console.error);
