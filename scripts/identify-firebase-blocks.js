#!/usr/bin/env node

/**
 * Script to identify Firebase code blocks in residences-context.tsx
 * This helps us systematically remove Firebase code
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/context/residences-context.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

let inFirebaseBlock = false;
let firebaseBlocks = [];
let currentBlock = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect start of Firebase blocks
    if (line.includes('if (!db)') ||
        line.includes('if (db)') ||
        line.includes('const docRef = doc(') ||
        line.includes('await setDoc(') ||
        line.includes('await updateDoc(') ||
        line.includes('await getDoc(') ||
        line.includes('await deleteDoc(') ||
        line.includes('collection(db,')) {

        if (!inFirebaseBlock) {
            inFirebaseBlock = true;
            currentBlock = {
                start: lineNum,
                lines: [line],
                type: 'firebase'
            };
        } else {
            currentBlock.lines.push(line);
        }
    } else if (inFirebaseBlock) {
        currentBlock.lines.push(line);

        // Check if block ends (return statement or closing brace at function level)
        if (line.trim() === 'return;' ||
            (line.trim() === '};' && currentBlock.lines.length > 5)) {
            currentBlock.end = lineNum;
            firebaseBlocks.push(currentBlock);
            inFirebaseBlock = false;
            currentBlock = null;
        }
    }
}

console.log(`Found ${firebaseBlocks.length} Firebase code blocks:`);
firebaseBlocks.forEach((block, idx) => {
    console.log(`\nBlock ${idx + 1}: Lines ${block.start}-${block.end} (${block.end - block.start + 1} lines)`);
    console.log('First line:', block.lines[0].trim());
});

// Save to file for reference
fs.writeFileSync(
    path.join(__dirname, 'firebase-blocks.json'),
    JSON.stringify(firebaseBlocks, null, 2)
);

console.log('\nSaved detailed block info to scripts/firebase-blocks.json');
