#!/usr/bin/env node
/**
 * Data Converter Script
 * 
 * Converts various data formats to the required JSON format for workers import.
 * Supports: CSV, TSV, Text files with various delimiters
 * 
 * Usage:
 *   node scripts/convert-workers-data.mjs input.csv output.json
 *   node scripts/convert-workers-data.mjs input.txt output.json --delimiter="|"
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const inputFile = args[0];
const outputFile = args[1] || 'workers-converted.json';
const delimiterArg = args.find(a => a.startsWith('--delimiter='));
const delimiter = delimiterArg ? delimiterArg.split('=')[1] : ',';

console.log('🔄 Workers Data Converter');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!inputFile) {
  console.error('❌ Usage: node convert-workers-data.mjs <input-file> [output-file] [--delimiter=,]');
  console.error('   Examples:');
  console.error('     node convert-workers-data.mjs workers.csv workers.json');
  console.error('     node convert-workers-data.mjs workers.txt workers.json --delimiter="|"');
  console.error('     node convert-workers-data.mjs workers.tsv workers.json --delimiter="\\t"');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ File not found: ${inputFile}`);
  process.exit(1);
}

console.log(`📂 Input file: ${inputFile}`);
console.log(`📝 Output file: ${outputFile}`);
console.log(`🔹 Delimiter: "${delimiter === '\t' ? '\\t (tab)' : delimiter}"\n`);

try {
  // Read input file
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    console.error('❌ Input file is empty');
    process.exit(1);
  }

  console.log(`📊 Found ${lines.length} lines\n`);

  // Try to detect if first line is header
  const firstLine = lines[0];
  const hasHeader = firstLine.toLowerCase().includes('name') || 
                   firstLine.toLowerCase().includes('id') ||
                   firstLine.toLowerCase().includes('اسم');

  let headers = [];
  let dataLines = lines;

  if (hasHeader) {
    headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    dataLines = lines.slice(1);
    console.log(`✅ Detected headers: ${headers.join(', ')}`);
  } else {
    console.log('ℹ️  No headers detected, using default mapping');
    // Default: assume columns are: employeeId, name, idNumber, nationality, company, role
    headers = ['employeeId', 'name', 'idNumber', 'nationaliy', 'company', 'role'];
  }

  console.log(`📋 Processing ${dataLines.length} data rows...\n`);

  // Convert to workers array
  const workers = [];
  let skipped = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const values = line.split(delimiter).map(v => v.trim());

    // Skip if not enough values
    if (values.length < 2) {
      console.log(`⚠️  Skipped line ${i + 1}: Not enough columns`);
      skipped++;
      continue;
    }

    const worker = {};

    // Map values to worker object based on headers
    for (let j = 0; j < Math.min(headers.length, values.length); j++) {
      const header = headers[j].toLowerCase();
      const value = values[j];

      if (!value) continue;

      // Map header names to worker fields
      if (header.includes('employee') && (header.includes('id') || header.includes('number') || header.includes('رقم'))) {
        // Employee ID / رقم الموظف
        worker.employeeId = value;
      } else if ((header.includes('national') || header.includes('وطن')) && (header.includes('id') || header.includes('number') || header.includes('هوية'))) {
        // National ID / رقم الهوية
        worker.idNumber = value;
      } else if (header.includes('company') || header.includes('شركة')) {
        worker.company = value;
      } else if (header.includes('id') || header.includes('رقم')) {
        worker.id = value;
      } else if (header.includes('name') || header.includes('اسم')) {
        worker.name = value;
      } else if (header.includes('nation') || header.includes('جنسية')) {
        worker.nationaliy = value;
      } else if (header.includes('role') || header.includes('وظيفة') || header.includes('دور')) {
        // Normalize role
        const roleLower = value.toLowerCase();
        if (roleLower.includes('supervis') || roleLower.includes('مشرف')) {
          worker.role = 'Supervisor';
        } else if (roleLower.includes('engin') || roleLower.includes('مهندس')) {
          worker.role = 'Engineer';
        } else {
          worker.role = 'Worker';
        }
      } else if (j === 0 && !worker.id) {
        // First column might be ID
        worker.id = value;
      } else if (j === 1 && !worker.name) {
        // Second column is usually name
        worker.name = value;
      } else if (j === 2 && !worker.nationaliy) {
        // Third column might be nationality
        worker.nationaliy = value;
      } else if (j === 3 && !worker.role) {
        // Fourth column might be role
        worker.role = value;
      }
    }

    // Validate: must have at least a name
    if (!worker.name || worker.name.trim() === '') {
      console.log(`⚠️  Skipped line ${i + 1}: No name found`);
      skipped++;
      continue;
    }

    workers.push(worker);
    
    // Show progress
    if ((i + 1) % 10 === 0 || i === dataLines.length - 1) {
      console.log(`✅ Processed: ${i + 1}/${dataLines.length} (${Math.round((i + 1) / dataLines.length * 100)}%)`);
    }
  }

  console.log(`\n✅ Converted ${workers.length} workers`);
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} rows`);
  }

  // Show preview
  if (workers.length > 0) {
    console.log('\n📋 Preview (first 3 records):');
    console.log(JSON.stringify(workers.slice(0, 3), null, 2));
  }

  // Write output file
  fs.writeFileSync(outputFile, JSON.stringify(workers, null, 2), 'utf8');
  console.log(`\n✅ Output written to: ${outputFile}`);

  console.log('\n🎉 Conversion complete!');
  console.log('\n📖 Next steps:');
  console.log(`   1. Review the output file: ${outputFile}`);
  console.log(`   2. Import using: npm run import:workers`);
  console.log(`   3. Or upload via: http://localhost:9002/admin/import-workers`);

} catch (error) {
  console.error('\n❌ Error during conversion:');
  console.error(error.message);
  process.exit(1);
}
