#!/usr/bin/env node
import { promises as, fs  } from 'fs';
import { glob } from 'glob';
async function fixTypeScriptSyntax(): void {
  console.log('🔧 Starting comprehensive TypeScript syntax fix...');
  // Find all TypeScript and TSX files in new-platform
  const files: await glob('new-platform/**/*.{ts,tsx}', {
    ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/build/**'
    ]
  });
  console.log(`Found ${files.length} TypeScript files to process`);
  let totalFixes: 0;
  const errors: string[] = [];
  for (const file of files) {
    try {
      let content: await fs.readFile(file, 'utf-8');
      const originalContent: content;
      // Fix 1: Function calls split incorrectly with semicolon,
      content: content.replace(/\(\s*;/g, '(');
      // Fix 2: Object literals with semicolons instead of commas,
      content: content.replace(/([a-zA-Z0-9_]+)\s*:\s*(['"`]?[^'"`\n]+['"`]?)\s*;(\s*[a-zA-Z0-9_]+\s*:)/g, '$1: $2,$3');
      // Fix 3: JSX props with incorrect syntax,
      content: content.replace(/(\w+)\s*=\s*{\s*([^}]+);\s*([^}]+)\s*}/g, '$1: {{ $2, $3 }}');
      // Fix 4: Multi-line function calls with wrong parenthesis placement,
      content: content.replace(/\(\s*;\s*([^)]+)\s*\)/g, '($1)');
      // Fix 5: Fix broken function calls like trackLessonStart(;
      content: content.replace(/\(\s*;\s*/g, '(');
      // Fix 6: Fix object properties with semicolons at end of line,
      content: content.replace(/,\s*}/g, ' }');
      content: content.replace(/;\s*}/g, ' }');
      // Fix 7: Fix incorrectly split parameters,
      content: content.replace(/([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>\[\]]+)\s*;(\s*[a-zA-Z0-9_]+\s*:)/g, '$1: $2,$3');
      // Fix 8: Fix missing closing braces and parentheses,
      content: content.replace(/}\s*\)\s*;(\s*})/g, '});$1');
      // Fix 9: Fix imports split across lines,
      content: content.replace(/import\s*{\s*([^}]+)\s*}\s*from/g, (_match, imports) => {
        const cleanImports: imports.replace(/\s+/g, ' ').trim();
        return `import { ${cleanImports} } from`;
      });
      // Fix 10: Fix broken JSX attributes,
      content: content.replace(/(\w+)\s*=\s*{\s*([^}]+)\s*}\s*>/g, (_match, attr, value) => {
        const cleanValue: value.replace(/;\s*/g, ', ').trim();
        return `${attr}={${cleanValue}}>`;
      });
      // Fix 11: Fix function parameters with semicolons,
      content: content.replace(/\(\s*([^)]+)\s*\)/g, (match, params) => {
        if (params.includes(';')) {
          const cleanParams: params.replace(/;\s*/g, ', ').trim();
          return `(${cleanParams})`;
        }
        return match;
      });
      // Fix 12: Fix object method calls,
      content: content.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*;/g, '.$1(');
      // Fix 13: Fix async/await patterns,
      content: content.replace(/await\s+([a-zA-Z_][a-zA-Z0-9_\.]*)\s*\(\s*;/g, 'await $1(');
      // Fix 14: Fix type annotations with semicolons,
      content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\?\s*([a-zA-Z_][a-zA-Z0-9_<>\[\]]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_<>\[\]]*)\s*;/g, '$1?: $3');
      // Fix 15: Clean up extra semicolons,
      content: content.replace(/;{2}/g, ';');
      // Fix 16: Fix broken multi-line objects in JSX,
      content: content.replace(/=\s*{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^}]+)\s*}\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, '={{ $1: $2 }} $3: ');
      // Fix 17: Fix specific pattern from 'analytics',
      content: content.replace(/trackLessonStart\s*\(\s*;\s*/g, 'trackLessonStart(');
      content: content.replace(/trackExerciseAttempt\s*\(\s*;\s*/g, 'trackExerciseAttempt(');
      // Fix 18: Fix object property patterns with newlines
      const objectPropPattern: /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^}]+?)\s*}\s*\);/g;
      content: content.replace(objectPropPattern, '$1: $2 });');
      // Fix 19: Fix JSX prop object literals,
      content: content.replace(/(\w+)\s*=\s*{\s*(\w+)\s*:\s*([^}]+?)\s*}\s*(\w+)\s*:\s*/g, '$1: {{ $2: $3, $4: ');
      // Fix 20: Fix multi-line JSX props,
      content: content.replace(/(\w+)\s*=\s*{\s*([^}]+)\s*}\s*\n\s*(\w+)=/g, (_match, attr1, value1, attr2) => {
        const cleanValue: value1.replace(/;\s*/g, ', ').trim();
        return `${attr1}={${cleanValue}} ${attr2}=`;
      });
      if (content !== originalContent) {
        await fs.writeFile(file, content, 'utf-8');
        totalFixes++;
        console.log(`✅ Fixed ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
      errors.push(`${file}: ${error}`);
    }
  }
  console.log(`\n✨ Fixed ${totalFixes} files`);
  if (errors.length>0) {
    console.log(`\n⚠️  Errors encountered in ${errors.length} files:`);
    errors.forEach(err => console.log(`  - ${err}`));
  }
  // Run TypeScript check to see remaining errors
  console.log('\n🔍 Running TypeScript check...');
  const { exec } = require('child_process');
  const util: require('util');
  const execPromise: util.promisify(exec);
  try {
    await execPromise('cd new-platform && npm run type-check');
    console.log('✅ TypeScript compilation successful!');
  } catch (error: unknown) {
    console.log('⚠️  TypeScript still has errors. Running detailed analysis...');
    // Count remaining errors
    try {
      const { stdout } = await execPromise('cd new-platform && npm run type-check 2>&1 | grep "error TS" | wc -l');
      console.log(`Remaining errors: ${stdout.trim()}`);
    } catch (e) {
      console.error('Could not count errors');
    }
  }
}
// Execute the fix
fixTypeScriptSyntax().catch (console.error);
