#!/usr/bin/env node
/**
 * Smart Text File Parser for Workers Data
 * 
 * يقرأ ملفات text بتنسيقات مختلفة ويحولها تلقائياً إلى JSON
 * Automatically detects format and converts to JSON
 * 
 * Supported formats:
 * - Fixed-width columns (detected by spaces)
 * - Tab-separated values (TSV)
 * - Comma-separated values (CSV)
 * - Pipe-separated (|)
 * - Mixed delimiters
 * 
 * Usage:
 *   node scripts/parse-text-workers.mjs input.txt output.json
 *   node scripts/parse-text-workers.mjs "C:\Users\...\workers.txt"
 * 
 * Example input formats:
 * 
 * Format 1: Space/Tab separated
 *   40097  أحمد محمد السيد  2059537999  سعودي  شركة المقاولات  Worker
 *   50123  محمد علي حسن    1234567890  مصري   شركة الصيانة     Supervisor
 * 
 * Format 2: With headers
 *   employeeId  name              idNumber    nationality  company           role
 *   40097       أحمد محمد         2059537999  سعودي       شركة المقاولات   Worker
 * 
 * Format 3: CSV style
 *   40097,أحمد محمد,2059537999,سعودي,شركة المقاولات,Worker
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const inputFile = args[0] || 'C:\\Users\\MohammedAlabdali\\Desktop\\workers.txt';
const outputFile = args[1] || path.join(path.dirname(inputFile), 'workers-converted.json');

console.log('🔍 Smart Workers Text Parser');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!fs.existsSync(inputFile)) {
  console.error(`❌ File not found: ${inputFile}`);
  console.log('\n💡 Usage:');
  console.log('   node parse-text-workers.mjs input.txt [output.json]');
  console.log('   node parse-text-workers.mjs "C:\\Users\\...\\workers.txt"');
  process.exit(1);
}

console.log(`📂 Input file: ${inputFile}`);
console.log(`📝 Output file: ${outputFile}\n`);

try {
  // Read file
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    console.error('❌ Input file is empty');
    process.exit(1);
  }

  console.log(`📊 Found ${lines.length} lines\n`);

  // Detect delimiter and format
  const delimiter = detectDelimiter(lines[0]);
  console.log(`🔹 Detected delimiter: "${delimiter === '\t' ? '\\t (tab)' : delimiter === ' ' ? 'spaces' : delimiter}"`);

  // Check if first line is header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = 
    firstLine.includes('employee') || 
    firstLine.includes('name') || 
    firstLine.includes('اسم') ||
    firstLine.includes('موظف') ||
    (firstLine.match(/\d{4,}/g) === null); // No long numbers = probably header

  let dataLines = lines;
  let headers = [];

  if (hasHeader) {
    const headerLine = lines[0];
    headers = parseHeaders(headerLine, delimiter);
    dataLines = lines.slice(1);
    console.log(`✅ Detected headers: ${headers.join(', ')}`);
  } else {
    console.log('ℹ️  No headers detected, using intelligent field detection');
  }

  console.log(`📋 Processing ${dataLines.length} data rows...\n`);

  // Parse workers
  const workers = [];
  let skipped = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    
    try {
      const worker = parseLine(line, delimiter, headers);
      
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
    } catch (error) {
      console.log(`⚠️  Skipped line ${i + 1}: ${error.message}`);
      skipped++;
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

  // Write output
  fs.writeFileSync(outputFile, JSON.stringify(workers, null, 2), 'utf8');
  console.log(`\n✅ Output written to: ${outputFile}`);

  // Show statistics
  showStatistics(workers);

  console.log('\n🎉 Conversion complete!');
  console.log('\n📖 Next steps:');
  console.log(`   1. Review the output file: ${outputFile}`);
  console.log(`   2. Import using: npm run import:workers`);
  console.log(`   3. Or upload via: http://localhost:9002/admin/import-workers`);

} catch (error) {
  console.error('\n❌ Error during conversion:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}

/**
 * Detect delimiter in a line
 */
function detectDelimiter(line) {
  // Count different delimiters
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  const pipes = (line.match(/\|/g) || []).length;
  const spaces = (line.match(/ {2,}/g) || []).length; // Multiple spaces

  // Return most common delimiter
  if (tabs > 0) return '\t';
  if (commas > 2) return ',';
  if (pipes > 0) return '|';
  if (spaces > 0) return ' ';
  
  // Fallback: try to detect by content
  if (line.includes(',')) return ',';
  if (line.includes('\t')) return '\t';
  if (line.includes('|')) return '|';
  
  return ' '; // Default to space
}

/**
 * Parse headers from first line
 */
function parseHeaders(line, delimiter) {
  const rawHeaders = delimiter === ' ' 
    ? line.split(/\s{2,}/).map(h => h.trim())
    : line.split(delimiter).map(h => h.trim());

  // Map to standard field names
  return rawHeaders.map(h => {
    const lower = h.toLowerCase();
    if (lower.includes('employee') || lower.includes('موظف')) return 'employeeId';
    if (lower.includes('national') && (lower.includes('id') || lower.includes('number'))) return 'idNumber';
    if (lower.includes('هوية')) return 'idNumber';
    if (lower.includes('name') || lower.includes('اسم')) return 'name';
    if (lower.includes('nation') || lower.includes('جنسية')) return 'nationaliy';
    if (lower.includes('company') || lower.includes('شركة')) return 'company';
    if (lower.includes('role') || lower.includes('وظيفة') || lower.includes('دور')) return 'role';
    return h; // Keep original if not recognized
  });
}

/**
 * Parse a single line into worker object
 */
function parseLine(line, delimiter, headers) {
  // Split by delimiter
  const values = delimiter === ' '
    ? line.split(/\s{2,}/).map(v => v.trim())
    : line.split(delimiter).map(v => v.trim());

  const worker = {};

  if (headers.length > 0) {
    // Use headers to map values
    for (let i = 0; i < Math.min(headers.length, values.length); i++) {
      const header = headers[i];
      const value = values[i];
      if (value && value !== '') {
        worker[header] = value;
      }
    }
  } else {
    // Intelligent field detection based on patterns
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (!value || value === '') continue;

      // Detect field type by pattern
      if (/^\d{4,6}$/.test(value)) {
        // Short number = Employee ID
        worker.employeeId = value;
      } else if (/^\d{9,12}$/.test(value)) {
        // Long number = National ID
        worker.idNumber = value;
      } else if (/^(Worker|Supervisor|Engineer)$/i.test(value)) {
        // Role keyword
        worker.role = value;
      } else if (/مهندس|مشرف|عامل/i.test(value)) {
        // Arabic role
        if (value.includes('مهندس')) worker.role = 'Engineer';
        else if (value.includes('مشرف')) worker.role = 'Supervisor';
        else worker.role = 'Worker';
      } else if (value.includes('شركة') || value.includes('Company') || i === values.length - 2) {
        // Company name (usually before role)
        if (!worker.company) worker.company = value;
      } else if (!worker.name && /[\u0600-\u06FF\s]{3,}|[a-zA-Z\s]{3,}/.test(value)) {
        // First long text = Name
        worker.name = value;
      } else if (!worker.nationaliy && /^[\u0600-\u06FFa-zA-Z]{3,15}$/.test(value)) {
        // Short text = Nationality
        worker.nationaliy = value;
      }
    }
  }

  // Normalize role
  if (worker.role) {
    const roleLower = worker.role.toLowerCase();
    if (roleLower.includes('supervis') || roleLower.includes('مشرف')) {
      worker.role = 'Supervisor';
    } else if (roleLower.includes('engin') || roleLower.includes('مهندس')) {
      worker.role = 'Engineer';
    } else {
      worker.role = 'Worker';
    }
  } else {
    worker.role = 'Worker'; // Default
  }

  return worker;
}

/**
 * Show statistics about converted workers
 */
function showStatistics(workers) {
  console.log('\n📊 Statistics:');
  console.log(`   Total workers: ${workers.length}`);
  
  const withEmployeeId = workers.filter(w => w.employeeId).length;
  const withIdNumber = workers.filter(w => w.idNumber).length;
  const withCompany = workers.filter(w => w.company).length;
  
  console.log(`   With Employee ID: ${withEmployeeId} (${Math.round(withEmployeeId/workers.length*100)}%)`);
  console.log(`   With National ID: ${withIdNumber} (${Math.round(withIdNumber/workers.length*100)}%)`);
  console.log(`   With Company: ${withCompany} (${Math.round(withCompany/workers.length*100)}%)`);
  
  const roles = {};
  workers.forEach(w => {
    roles[w.role || 'Worker'] = (roles[w.role || 'Worker'] || 0) + 1;
  });
  
  console.log('   Roles breakdown:');
  Object.entries(roles).forEach(([role, count]) => {
    console.log(`      ${role}: ${count}`);
  });
}
