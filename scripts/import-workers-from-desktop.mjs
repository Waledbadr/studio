#!/usr/bin/env node
/**
 * Import Workers Script
 * 
 * This script imports workers data from a JSON file directly into Firestore.
 * It reads from a specific file path and processes all workers.
 * 
 * Usage:
 *   node scripts/import-workers-from-desktop.mjs
 *   
 * Or with custom path:
 *   node scripts/import-workers-from-desktop.mjs "C:\path\to\workers.json"
 * 
 * Requirements:
 *   - Firebase Admin credentials configured via environment variables
 *   - GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_B64
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default path to the workers file
const DEFAULT_FILE_PATH = 'C:\\Users\\MohammedAlabdali\\Desktop\\workers.txt';

// Get file path from command line args or use default
const args = process.argv.slice(2);
const filePath = args[0] || DEFAULT_FILE_PATH;

console.log('🔷 EstateCare Workers Import Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

/**
 * Initialize Firebase Admin
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin already initialized');
    return admin.app();
  }

  try {
    // Try base64 encoded service account
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (b64) {
      const jsonStr = Buffer.from(b64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(jsonStr);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('✅ Firebase Admin initialized (from FIREBASE_SERVICE_ACCOUNT_B64)');
      return admin.app();
    }

    // Try JSON string service account
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (svcJson) {
      const serviceAccount = JSON.parse(svcJson);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('✅ Firebase Admin initialized (from FIREBASE_SERVICE_ACCOUNT)');
      return admin.app();
    }

    // Try individual environment variables
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    if (projectId && clientEmail && privateKey) {
      // Replace escaped newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      
      console.log('✅ Firebase Admin initialized (from individual env vars)');
      return admin.app();
    }

    // Try Application Default Credentials
    const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (adcPath && fs.existsSync(adcPath)) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      
      console.log('✅ Firebase Admin initialized (from GOOGLE_APPLICATION_CREDENTIALS)');
      return admin.app();
    }

    throw new Error('No valid Firebase Admin credentials found');

  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:');
    console.error(error.message);
    console.error('\n📖 Please configure Firebase Admin credentials via:');
    console.error('   - FIREBASE_SERVICE_ACCOUNT_B64');
    console.error('   - FIREBASE_SERVICE_ACCOUNT');
    console.error('   - FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY');
    console.error('   - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)');
    process.exit(1);
  }
}

/**
 * Load and parse workers file
 */
function loadWorkersFile(filePath) {
  console.log(`📂 Reading file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Support both array format and { workers: [...] } format
    const workers = Array.isArray(data) ? data : (data.workers || []);
    
    if (!Array.isArray(workers) || workers.length === 0) {
      console.error('❌ Invalid file format: Expected array of workers');
      console.error('   File should contain JSON array or object with "workers" property');
      process.exit(1);
    }

    console.log(`✅ Loaded ${workers.length} workers from file\n`);
    return workers;
    
  } catch (error) {
    console.error('❌ Failed to parse JSON file:');
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Import workers into Firestore
 */
async function importWorkers(workers) {
  const db = admin.firestore();
  
  const results = {
    total: workers.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  console.log('🔄 Starting import process...\n');

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    const index = i + 1;

    try {
      // Validate required fields
      if (!worker.name || typeof worker.name !== 'string' || worker.name.trim() === '') {
        const error = `Worker #${index}: Missing or invalid name`;
        results.errors.push(error);
        results.skipped++;
        console.log(`⚠️  ${error}`);
        continue;
      }

      // Generate ID if not provided
      const workerId = worker.id || `w_${Date.now()}_${i}`;
      
      // Normalize role
      let role = 'Worker';
      if (worker.role === 'Supervisor' || worker.role === 'Engineer') {
        role = worker.role;
      }

      // Prepare worker data
      const workerData = {
        name: worker.name.trim(),
        employeeId: worker.employeeId || '',
        idNumber: worker.idNumber || worker.nationalId || '',
        nationaliy: worker.nationaliy || worker.nationality || '',
        company: worker.company || '',
        role,
      };

      // Check if worker exists
      const docRef = db.collection('workers').doc(workerId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        // Update existing worker
        await docRef.set(workerData, { merge: true });
        results.updated++;
        console.log(`🔄 Updated: ${workerData.name} (${workerId})`);
      } else {
        // Create new worker
        await docRef.set(workerData);
        results.imported++;
        console.log(`✅ Imported: ${workerData.name} (${workerId})`);
      }

    } catch (error) {
      const errorMsg = `Worker #${index} (${worker.name || 'unnamed'}): ${error.message}`;
      results.errors.push(errorMsg);
      results.skipped++;
      console.log(`❌ Error: ${errorMsg}`);
    }

    // Progress indicator
    if (index % 10 === 0 || index === workers.length) {
      console.log(`\n📊 Progress: ${index}/${workers.length} (${Math.round(index/workers.length*100)}%)\n`);
    }
  }

  return results;
}

/**
 * Display results summary
 */
function displayResults(results) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Import Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`📋 Total workers:     ${results.total}`);
  console.log(`✅ Newly imported:    ${results.imported}`);
  console.log(`🔄 Updated:           ${results.updated}`);
  console.log(`⚠️  Skipped:          ${results.skipped}`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.forEach((error, idx) => {
      console.log(`   ${idx + 1}. ${error}`);
    });
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const successRate = ((results.imported + results.updated) / results.total * 100).toFixed(1);
  console.log(`\n✨ Success rate: ${successRate}%`);
  
  if (results.imported + results.updated === results.total) {
    console.log('🎉 All workers imported successfully!\n');
  } else if (results.imported + results.updated > 0) {
    console.log('⚠️  Import completed with some issues\n');
  } else {
    console.log('❌ Import failed\n');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Initialize Firebase
    initializeFirebaseAdmin();
    
    // Load workers file
    const workers = loadWorkersFile(filePath);
    
    // Import workers
    const results = await importWorkers(workers);
    
    // Display results
    displayResults(results);
    
    process.exit(results.errors.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Fatal error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
