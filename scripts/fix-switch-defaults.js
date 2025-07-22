#!/usr/bin/env node

const fs = require('fs');
const { glob } = require('glob');

console.log('🔧 Fixing switch default statements...');

async function fixSwitchDefaults() {
  const patterns = ['**/*.{ts,tsx,js,jsx}'];
  
  let totalFixed = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', 'scripts/**']
    });
    
    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        
        // Fix default = pattern in switch statements
        const regex = /^(\s*)default\s*=\s*(.+);$/gm;
        content = content.replace(regex, (match, indent, rest) => {
          modified = true;
          // Check if it's a comparison
          if (rest.includes('comparison') && rest.includes('=')) {
            return `${indent}default:\n${indent}  comparison = 0;`;
          }
          // Check if it starts with return
          if (rest.startsWith('return')) {
            return `${indent}default: ${rest};`;
          }
          // Otherwise assume it's an assignment
          return `${indent}default:\n${indent}  ${rest};`;
        });
        
        if (modified) {
          fs.writeFileSync(file, content);
          totalFixed++;
          console.log(`  ✓ Fixed ${file}`);
        }
      } catch (err) {
        // Skip files with errors
      }
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} files`);
}

fixSwitchDefaults().catch(console.error);