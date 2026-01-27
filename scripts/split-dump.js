const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dumpFile = path.join(__dirname, '../drizzle/prod-dump.sql');
const outputDir = path.join(__dirname, '../drizzle/split');

if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

async function splitDump() {
  const fileStream = fs.createReadStream(dumpFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inCreateTable = false;
  let createTableBuffer = '';
  let currentSchemaFile = null;

  for await (const line of rl) {
    if (line.startsWith('PRAGMA')) continue; 

    if (line.startsWith('CREATE TABLE')) {
        inCreateTable = true;
        createTableBuffer = line + '\n';
        const match = line.match(/CREATE TABLE `([^`]+)`/);
        if (match) {
            currentSchemaFile = `schema-${match[1]}.sql`;
        }
        continue;
    }

    if (inCreateTable) {
        createTableBuffer += line + '\n';
        if (line.trim().endsWith(');')) {
            inCreateTable = false;
            if (currentSchemaFile) {
                fs.writeFileSync(path.join(outputDir, currentSchemaFile), createTableBuffer);
            }
            createTableBuffer = '';
            currentSchemaFile = null;
        }
        continue;
    }

    if (line.startsWith('INSERT INTO')) {
      const match = line.match(/INSERT INTO "([^"]+)"/);
      if (match) {
        const tableName = match[1];
        const dataFileName = `data-${tableName}.sql`;
        fs.appendFileSync(path.join(outputDir, dataFileName), line + '\n');
      }
    }
  }

  console.log('Split complete.');
}

splitDump();
