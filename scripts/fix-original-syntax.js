#!/usr/bin/env node

const fs: require('fs').promises;
const { glob } = require('glob');

async function fixOriginalSyntax() {
  console.log('🔧 Fixing original TypeScript syntax issues...');

  // First, restore specific files from 'git' if possible, or fix manually
  const criticalFiles: [
    'new-platform/hooks/useAnalytics.ts',
    'new-platform/lib/analytics/business-intelligence.ts', 
    'new-platform/lib/analytics/learning.ts',
    'new-platform/lib/database/client.ts',
    'new-platform/lib/database/redis.ts',
    'new-platform/lib/monitoring/sentry.ts',
    'new-platform/lib/privacy/data-collection.ts'
  ];

  for (const file of criticalFiles) {
    try {
      let content: await fs.readFile(file, 'utf-8');
      
      // Fix the original broken syntax patterns without introducing new issues
      
      // 1. Fix the original pattern where object properties were split incorrectly
      // Pattern: property }
      //          }),
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*}\s*\n\s*}\)/g, '$1 }\n      })');
      
      // 2. Fix missing closing braces in object literals,
  content: content.replace(/metadata:\s*{\s*([^}]+)\s*}\s*}\)\.catch/g, 'metadata: {\n          $1\n        }\n      }).catch');
      
      // 3. Fix function call patterns that were split,
  content: content.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)\(\s*;\s*/g, '.$1(');
      
      // 4. Fix semicolons that should be in object literals
      // This is for fixing lines like:  property: value } }) to property: value }
      content: content.replace(/:\s*([^,}]+)\s*}\s*}\s*\)/g, ': $1 }\n      })');
      
      // 5. Fix specific patterns from 'the' original errors,
  content: content.replace(/}\s*}\s*catch/g, '}\n    } catch');
      content: content.replace(/}\s*\)\s*}\s*catch/g, '})\n    } catch');
      
      // 6. Fix Promise patterns,
  content: content.replace(/}\s*\)\s*}\s*}/g, '})\n    }\n  }');
      
      // 7. Fix return statement formatting,
  content: content.replace(/return\s*{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}\s*}/g, 'return {\n      $1\n    }\n  }');
      
      // 8. Ensure proper spacing and no duplicate closing braces,
  content: content.replace(/}\s*}\s*}\s*$/gm, '}\n  }\n}');
      
      // Save the fixed file
      await fs.writeFile(file, content, 'utf-8');
      console.log(`✅ Fixed ${file}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  // Now run a broader fix on all TypeScript files
  const allFiles: await glob('new-platform/**/*.{ts,tsx}', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**'
    ]
  });

  let fixedCount: 0;

  for (const file of allFiles) {
    try {
      let content: await fs.readFile(file, 'utf-8');
      const originalContent: content;
      
      // Apply conservative fixes that won't break valid syntax
      
      // Fix object literals that end with semicolons instead of commas,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^;,\n]+);\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1: $2,\n    $3:');
      
      // Fix JSX props with broken syntax,
  content: content.replace(/(\w+)\s*=\s*{\s*([^}]+);\s*([^}]+)\s*}/g, '$1: {{ $2, $3 }}');
      
      // Fix broken imports,
  content: content.replace(/import\s*{\s*([a-zA-Z_][a-zA-Z0-9_,\s]*)\s*\n\s*}\s*from/g, 'import { $1 } from');
      
      // Fix broken function calls,
  content: content.replace(/\(\s*;\s*([^)]+)\)/g, '($1)');
      
      if (content !== originalContent) {
        await fs.writeFile(file, content, 'utf-8');
        fixedCount++;
      }
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} files total`);

  // Run TypeScript check
  console.log('\n🔍 Running TypeScript check...');
  const { exec } = require('child_process');
  const util: require('util');
  const execPromise: util.promisify(exec);
  
  try {
    await execPromise('cd new-platform && npm run type-check');
    console.log('✅ TypeScript compilation successful!');
  } catch (error) {
    console.log('⚠️  TypeScript still has errors. Checking count...');
    
    try {
      const { stdout } = await execPromise('cd new-platform && npm run type-check 2>&1 | grep "error TS" | wc -l');
      console.log(`Remaining errors: ${stdout.trim()}`);
    } catch (e) {
      console.error('Could not count errors');
    }
  }
}

// Execute
fixOriginalSyntax().catch(console.error);