#!/usr/bin/env node

const fs = require('fs');
const { glob } = require('glob');

console.log('🔧 Fixing interface syntax errors...');

async function fixInterfaces() {
  const patterns = [
    '**/*.{ts,tsx}',
  ];
  
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
        
        // Fix interface property syntax (= to :)
        const interfaceRegex = /interface\s+\w+\s*{[^}]+}/gs;
        content = content.replace(interfaceRegex, (match) => {
          const fixed = match.replace(/^(\s*)(\w+)\s*=\s*(.+);$/gm, '$1$2: $3;');
          if (fixed !== match) {
            modified = true;
          }
          return fixed;
        });
        
        // Fix type alias syntax (= to :)
        const typeRegex = /type\s+\w+\s*=\s*{[^}]+}/gs;
        content = content.replace(typeRegex, (match) => {
          const fixed = match.replace(/^(\s*)(\w+)\s*=\s*(.+);$/gm, '$1$2: $3;');
          if (fixed !== match) {
            modified = true;
          }
          return fixed;
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

fixInterfaces().catch(console.error);