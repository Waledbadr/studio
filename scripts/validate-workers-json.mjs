#!/usr/bin/env node
/**
 * JSON Validator for Workers Data
 * 
 * يتحقق من صحة تنسيق JSON ويتأكد من وجود الحقول المطلوبة
 * Validates JSON format and checks for required fields
 * 
 * Usage:
 *   node scripts/validate-workers-json.mjs input.json
 *   npm run validate:workers input.json
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const inputFile = args[0] || 'C:\\Users\\MohammedAlabdali\\Desktop\\workers.txt';

console.log('🔍 Workers JSON Validator');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!fs.existsSync(inputFile)) {
  console.error(`❌ File not found: ${inputFile}`);
  console.log('\n💡 Usage:');
  console.log('   node validate-workers-json.mjs input.json');
  console.log('   npm run validate:workers input.json');
  process.exit(1);
}

console.log(`📂 Validating file: ${inputFile}\n`);

try {
  // Read file
  const content = fs.readFileSync(inputFile, 'utf8');
  
  // Check if empty
  if (content.trim() === '') {
    console.error('❌ File is empty');
    process.exit(1);
  }

  // Try to parse JSON
  let data;
  try {
    data = JSON.parse(content);
  } catch (parseError) {
    console.error('❌ Invalid JSON format');
    console.error('Error:', parseError.message);
    console.error('\n💡 Tips:');
    console.error('   - Check for missing commas between objects');
    console.error('   - Ensure all strings are in double quotes');
    console.error('   - Check for trailing commas');
    console.error('   - Validate at: https://jsonlint.com/');
    process.exit(1);
  }

  console.log('✅ Valid JSON format\n');

  // Check if array
  const workers = Array.isArray(data) ? data : (data.workers || []);
  
  if (!Array.isArray(workers)) {
    console.error('❌ Data must be an array of workers');
    console.error('Expected format: [...] or { "workers": [...] }');
    process.exit(1);
  }

  if (workers.length === 0) {
    console.error('❌ No workers found in file');
    process.exit(1);
  }

  console.log(`📊 Found ${workers.length} workers\n`);

  // Validate each worker
  const errors = [];
  const warnings = [];
  const stats = {
    total: workers.length,
    withEmployeeId: 0,
    withIdNumber: 0,
    withCompany: 0,
    withNationality: 0,
    withRole: 0,
    valid: 0,
    invalid: 0,
  };

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    const index = i + 1;
    let hasErrors = false;

    // Check required field: name
    if (!worker.name || typeof worker.name !== 'string' || worker.name.trim() === '') {
      errors.push(`Worker #${index}: Missing or invalid 'name' field (required)`);
      hasErrors = true;
    }

    // Check optional fields
    if (worker.employeeId) {
      if (typeof worker.employeeId !== 'string') {
        warnings.push(`Worker #${index}: 'employeeId' should be a string`);
      } else {
        stats.withEmployeeId++;
      }
    }

    if (worker.idNumber) {
      if (typeof worker.idNumber !== 'string') {
        warnings.push(`Worker #${index}: 'idNumber' should be a string`);
      } else {
        stats.withIdNumber++;
      }
    }

    if (worker.nationaliy || worker.nationality) {
      stats.withNationality++;
    }

    if (worker.company) {
      if (typeof worker.company !== 'string') {
        warnings.push(`Worker #${index}: 'company' should be a string`);
      } else {
        stats.withCompany++;
      }
    }

    if (worker.role) {
      if (!['Worker', 'Supervisor', 'Engineer'].includes(worker.role)) {
        warnings.push(`Worker #${index}: 'role' should be Worker, Supervisor, or Engineer (got: ${worker.role})`);
      } else {
        stats.withRole++;
      }
    }

    if (hasErrors) {
      stats.invalid++;
    } else {
      stats.valid++;
    }
  }

  // Display results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Validation Results');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errors.length === 0) {
    console.log('✅ All workers are valid!\n');
  } else {
    console.log(`❌ Found ${errors.length} error(s):\n`);
    errors.forEach(err => console.log(`   ${err}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} warning(s):\n`);
    warnings.forEach(warn => console.log(`   ${warn}`));
    console.log('');
  }

  console.log('📊 Statistics:');
  console.log(`   Total workers:        ${stats.total}`);
  console.log(`   Valid:                ${stats.valid}`);
  console.log(`   Invalid:              ${stats.invalid}`);
  console.log(`   With Employee ID:     ${stats.withEmployeeId} (${Math.round(stats.withEmployeeId/stats.total*100)}%)`);
  console.log(`   With National ID:     ${stats.withIdNumber} (${Math.round(stats.withIdNumber/stats.total*100)}%)`);
  console.log(`   With Company:         ${stats.withCompany} (${Math.round(stats.withCompany/stats.total*100)}%)`);
  console.log(`   With Nationality:     ${stats.withNationality} (${Math.round(stats.withNationality/stats.total*100)}%)`);
  console.log(`   With Role:            ${stats.withRole} (${Math.round(stats.withRole/stats.total*100)}%)`);

  // Show preview
  console.log('\n📋 Preview (first 3 records):');
  console.log(JSON.stringify(workers.slice(0, 3), null, 2));

  // Check for duplicate IDs
  const employeeIds = new Map();
  const idNumbers = new Map();
  const duplicateEmployeeIds = [];
  const duplicateIdNumbers = [];

  workers.forEach((w, idx) => {
    if (w.employeeId) {
      const key = `${w.employeeId}`;
      if (employeeIds.has(key)) {
        const prev = employeeIds.get(key);
        duplicateEmployeeIds.push({
          employeeId: w.employeeId,
          indices: [prev, idx + 1],
          workers: [workers[prev - 1], w]
        });
      } else {
        employeeIds.set(key, idx + 1);
      }
    }

    if (w.idNumber) {
      if (idNumbers.has(w.idNumber)) {
        const prev = idNumbers.get(w.idNumber);
        duplicateIdNumbers.push({
          idNumber: w.idNumber,
          indices: [prev, idx + 1],
          workers: [workers[prev - 1], w]
        });
      } else {
        idNumbers.set(w.idNumber, idx + 1);
      }
    }
  });

  // Report duplicates
  if (duplicateEmployeeIds.length > 0) {
    console.log('\n⚠️  Duplicate Employee IDs found:');
    duplicateEmployeeIds.forEach(dup => {
      console.log(`   Employee ID ${dup.employeeId} appears in workers #${dup.indices.join(', ')}`);
      console.log(`      - ${dup.workers[0].name} (${dup.workers[0].company || 'no company'})`);
      console.log(`      - ${dup.workers[1].name} (${dup.workers[1].company || 'no company'})`);
      if (dup.workers[0].idNumber !== dup.workers[1].idNumber) {
        console.log('      ✅ Different people (different National IDs) - This is OK!');
      } else {
        console.log('      ℹ️  Same person, different companies - This is OK!');
      }
    });
  }

  if (duplicateIdNumbers.length > 0) {
    console.log('\n⚠️  Duplicate National IDs found:');
    duplicateIdNumbers.forEach(dup => {
      console.log(`   National ID ${dup.idNumber} appears in workers #${dup.indices.join(', ')}`);
      console.log(`      - ${dup.workers[0].name} (${dup.workers[0].company || 'no company'})`);
      console.log(`      - ${dup.workers[1].name} (${dup.workers[1].company || 'no company'})`);
      console.log('      ℹ️  Same person working in multiple companies - This is OK!');
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (errors.length === 0) {
    console.log('\n✅ File is ready for import!');
    console.log('\n📖 Next steps:');
    console.log(`   npm run import:workers`);
    console.log(`   or visit: http://localhost:9002/admin/import-workers`);
    process.exit(0);
  } else {
    console.log('\n❌ Please fix the errors before importing');
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Unexpected error:');
  console.error(error.message);
  process.exit(1);
}
