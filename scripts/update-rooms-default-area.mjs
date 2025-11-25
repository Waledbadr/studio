#!/usr/bin/env node

/**
 * Update All Rooms Default Area Script
 * 
 * This script updates all rooms in the system that don't have an area value
 * Sets default area to 24m² and capacity to 6 workers (24 ÷ 4 = 6)
 * 
 * Usage:
 *   node scripts/update-rooms-default-area.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Constants
const DEFAULT_AREA = 24;
const DEFAULT_CAPACITY = 6; // 24 ÷ 4 = 6

console.log('🚀 Starting room area update script...\n');

// Check if Firebase config is available
if (!firebaseConfig.projectId) {
  console.error('❌ Error: Firebase configuration not found in environment variables.');
  console.error('Please make sure .env.local file exists with Firebase configuration.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Check if room needs update (no area or area is 0/null/undefined)
 */
function roomNeedsUpdate(room) {
  return !room.area || room.area === 0 || room.area === null || room.area === undefined;
}

/**
 * Update a single residence document
 */
async function updateResidence(residenceId, residenceData) {
  let totalRoomsChecked = 0;
  let totalRoomsUpdated = 0;
  const updates = [];
  
  // Clone the residence data to modify
  const updatedResidence = JSON.parse(JSON.stringify(residenceData));
  let hasChanges = false;
  
  // Iterate through buildings
  if (updatedResidence.buildings && Array.isArray(updatedResidence.buildings)) {
    for (const building of updatedResidence.buildings) {
      if (!building.floors || !Array.isArray(building.floors)) continue;
      
      // Iterate through floors
      for (const floor of building.floors) {
        if (!floor.rooms || !Array.isArray(floor.rooms)) continue;
        
        // Iterate through rooms
        for (const room of floor.rooms) {
          totalRoomsChecked++;
          
          // Check if room needs update
          if (roomNeedsUpdate(room)) {
            room.area = DEFAULT_AREA;
            room.capacity = DEFAULT_CAPACITY;
            totalRoomsUpdated++;
            hasChanges = true;
            
            updates.push({
              residence: residenceData.name || residenceId,
              building: building.name || building.id,
              floor: floor.name || floor.id,
              room: room.name || room.id,
              oldArea: room.area,
              newArea: DEFAULT_AREA,
              newCapacity: DEFAULT_CAPACITY
            });
          }
        }
      }
    }
  }
  
  // Save changes if any
  if (hasChanges) {
    const residenceRef = doc(db, 'residences', residenceId);
    await updateDoc(residenceRef, updatedResidence);
  }
  
  return { totalRoomsChecked, totalRoomsUpdated, updates };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('📊 Reading residences from Firestore...\n');
    
    // Get all residences
    const residencesRef = collection(db, 'residences');
    const snapshot = await getDocs(residencesRef);
    
    if (snapshot.empty) {
      console.log('⚠️  No residences found in the database.');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} residence(s)\n`);
    console.log('─'.repeat(80));
    
    let globalTotalRoomsChecked = 0;
    let globalTotalRoomsUpdated = 0;
    const allUpdates = [];
    
    // Process each residence
    for (const docSnap of snapshot.docs) {
      const residenceId = docSnap.id;
      const residenceData = docSnap.data();
      
      console.log(`\n🏢 Processing: ${residenceData.name || residenceId}`);
      console.log(`   City: ${residenceData.city || 'N/A'}`);
      
      const result = await updateResidence(residenceId, residenceData);
      
      globalTotalRoomsChecked += result.totalRoomsChecked;
      globalTotalRoomsUpdated += result.totalRoomsUpdated;
      allUpdates.push(...result.updates);
      
      console.log(`   📦 Rooms checked: ${result.totalRoomsChecked}`);
      console.log(`   ✨ Rooms updated: ${result.totalRoomsUpdated}`);
      
      if (result.updates.length > 0) {
        console.log('\n   Updated rooms:');
        result.updates.forEach((update, index) => {
          console.log(`   ${index + 1}. ${update.room}`);
          console.log(`      Building: ${update.building}, Floor: ${update.floor}`);
          console.log(`      Old area: ${update.oldArea || 'None'} → New area: ${update.newArea}m²`);
          console.log(`      New capacity: ${update.newCapacity} workers`);
        });
      }
    }
    
    // Print summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`✅ Total residences processed: ${snapshot.size}`);
    console.log(`📦 Total rooms checked: ${globalTotalRoomsChecked}`);
    console.log(`✨ Total rooms updated: ${globalTotalRoomsUpdated}`);
    console.log(`🎯 Default values applied:`);
    console.log(`   - Area: ${DEFAULT_AREA}m²`);
    console.log(`   - Capacity: ${DEFAULT_CAPACITY} workers`);
    console.log(`   - Formula: Area ÷ 4 = Capacity`);
    
    if (globalTotalRoomsUpdated === 0) {
      console.log('\n✅ All rooms already have area values. No updates needed.');
    } else {
      console.log(`\n🎉 Successfully updated ${globalTotalRoomsUpdated} room(s)!`);
    }
    
    console.log('─'.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
