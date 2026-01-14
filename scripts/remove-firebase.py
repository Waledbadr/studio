#!/usr/bin/env python3
"""
Script to remove Firebase code blocks from residences-context.tsx
Keeps only D1 implementations
"""

import re

def remove_firebase_blocks(content):
    """Remove Firebase code blocks while keeping D1 code"""
    
    # Remove if (!db) blocks
    content = re.sub(
        r'if \(!db\) \{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*return;',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Remove if (USE_D1) wrapper, keeping the content
    content = re.sub(
        r'if \(USE_D1\) \{\s*',
        '',
        content
    )
    
    # Remove the closing brace and return after D1 blocks
    content = re.sub(
        r'\s*\}\s*return;\s*\n\s*\n\s*(?=const |await |\/\/)',
        '\n\n',
        content
    )
    
    # Remove Firebase doc/collection/setDoc/updateDoc/getDoc/deleteDoc blocks
    # This is complex, so we'll do it line by line
    
    lines = content.split('\n')
    result_lines = []
    skip_until_brace = 0
    in_firebase_block = False
    
    for i, line in enumerate(lines):
        # Detect Firebase function calls
        if any(pattern in line for pattern in [
            'const docRef = doc(',
            'const userRef = doc(',
            'await setDoc(',
            'await updateDoc(',
            'await getDoc(',
            'await deleteDoc(',
            'await getDocs(',
            'collection(db,',
            'safeOnSnapshot('
        ]):
            in_firebase_block = True
            skip_until_brace = line.count('{') - line.count('}')
            continue
        
        if in_firebase_block:
            skip_until_brace += line.count('{') - line.count('}')
            if skip_until_brace <= 0:
                in_firebase_block = False
            continue
        
        result_lines.append(line)
    
    return '\n'.join(result_lines)

# Read file
with open('src/context/residences-context.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Firebase blocks
cleaned = remove_firebase_blocks(content)

# Write back
with open('src/context/residences-context.tsx', 'w', encoding='utf-8') as f:
    f.write(cleaned)

print("Firebase code removal complete!")
print(f"Original: {len(content)} chars")
print(f"Cleaned: {len(cleaned)} chars")
print(f"Removed: {len(content) - len(cleaned)} chars")
