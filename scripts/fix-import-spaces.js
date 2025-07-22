#!/usr/bin/env node

const fs = require('fs');
const { glob } = require('glob');

console.log('🔧 Fixing extra spaces in imports...');

async function fixImportSpaces() {
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
        
        // Fix extra spaces in import statements
        const importRegex = /import\s*{([^}]+)}\s*from/g;
        content = content.replace(importRegex, (match, imports) => {
          const cleanedImports = imports
            .split(',')
            .map(imp => imp.trim())
            .filter(Boolean)
            .join(', ');
          
          const newMatch = `import { ${cleanedImports} } from`;
          if (newMatch !== match) {
            modified = true;
          }
          return newMatch;
        });
        
        // Fix extra spaces in destructuring
        const destructRegex = /const\s*{([^}]+)}\s*=/g;
        content = content.replace(destructRegex, (match, items) => {
          const cleanedItems = items
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
            .join(', ');
          
          const newMatch = `const { ${cleanedItems} } =`;
          if (newMatch !== match) {
            modified = true;
          }
          return newMatch;
        });
        
        // Fix double spaces anywhere
        if (content.includes('  ')) {
          content = content.replace(/([^\\n])\s{2,}([^\\n])/g, '$1 $2');
          modified = true;
        }
        
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

fixImportSpaces().catch(console.error);