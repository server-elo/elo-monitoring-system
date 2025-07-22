#!/usr/bin/env node

const fs = require('fs');
const { glob } = require('glob');

console.log('🔧 Fixing type declarations...');

async function fixTypeDeclarations() {
  const patterns = ['**/*.{ts,tsx}'];
  
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
        
        // Fix type declarations: const varName = Type[] = 
        const regex = /^(\s*const\s+\w+)\s*=\s*(\w+\[\])\s*=\s*\[/gm;
        content = content.replace(regex, (match, varDecl, type) => {
          modified = true;
          return `${varDecl}: ${type} = [`;
        });
        
        // Fix type declarations: const varName = Type<> = 
        const genericRegex = /^(\s*const\s+\w+)\s*=\s*(\w+<[^>]+>)\s*=\s*/gm;
        content = content.replace(genericRegex, (match, varDecl, type) => {
          modified = true;
          return `${varDecl}: ${type} = `;
        });
        
        // Fix let declarations: let varName = Type = 
        const letRegex = /^(\s*let\s+\w+)\s*=\s*(\w+(?:\[\]|<[^>]+>)?)\s*=\s*/gm;
        content = content.replace(letRegex, (match, varDecl, type) => {
          // Check if it looks like a type (starts with uppercase or is array)
          if (type.match(/^[A-Z]/) || type.includes('[') || type.includes('<')) {
            modified = true;
            return `${varDecl}: ${type} = `;
          }
          return match;
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

fixTypeDeclarations().catch(console.error);