const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const splitDir = path.join(__dirname, '../drizzle/split');
const dropFile = path.join(__dirname, '../drizzle/drop-all.sql');

function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to execute: ${command}`);
    process.exit(1); 
  }
}

// 1. Drop all tables
console.log('Dropping existing tables...');
runCommand(`npx wrangler d1 execute estatecare --local --file="${dropFile}"`);

// 2. Import Schema
const schemaFiles = fs.readdirSync(splitDir).filter(f => f.startsWith('schema-') && f.endsWith('.sql'));
for (const file of schemaFiles) {
    console.log(`Importing ${file}...`);
    const filePath = path.join(splitDir, file);
    runCommand(`npx wrangler d1 execute estatecare --local --file="${filePath}"`);
}

// 3. Import Data
const dataFiles = fs.readdirSync(splitDir).filter(f => f.startsWith('data-') && f.endsWith('.sql'));
for (const file of dataFiles) {
  console.log(`Importing ${file}...`);
  const filePath = path.join(splitDir, file);
  runCommand(`npx wrangler d1 execute estatecare --local --file="${filePath}"`);
}

console.log('Import complete!');
