#!/usr/bin/env node
/**
 * Seed test users into D1 with hashed passwords for local dev testing
 * Run: node scripts/seed-test-users.mjs
 */
import fetch from 'node-fetch';

const TEST_USERS = [
  { email: 'admin@estatecare.com', password: 'admin123', name: 'Admin User' },
  { email: 'manager@estatecare.com', password: 'manager123', name: 'Manager User' },
  { email: 'maintenance@estatecare.com', password: 'tech123', name: 'Maintenance Tech' },
  { email: 'ahmed@example.com', password: 'test123', name: 'Ahmed' },
  { email: 'fatima@example.com', password: 'test123', name: 'Fatima' },
];

async function main() {
  console.log('Seeding test users into D1...\n');
  
  for (const user of TEST_USERS) {
    try {
      const res = await fetch('http://localhost:9002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const json = await res.json();
      
      if (json.ok) {
        console.log(`✓ ${user.email}`);
      } else {
        // If user exists, that's OK for seeding
        if (json.error && json.error.includes('exists')) {
          console.log(`→ ${user.email} (already exists)`);
        } else {
          console.error(`✗ ${user.email}: ${json.error}`);
        }
      }
    } catch (e) {
      console.error(`✗ ${user.email}: ${e.message}`);
    }
  }
  
  console.log('\nDone! You can now log in with:');
  console.log('  admin@estatecare.com / admin123');
  console.log('  manager@estatecare.com / manager123');
  console.log('  maintenance@estatecare.com / tech123');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
