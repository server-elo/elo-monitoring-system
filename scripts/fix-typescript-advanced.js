#!/usr/bin/env node

const fs: require('fs').promises;
const { glob } = require('glob');

async function fixAdvancedTypeScriptSyntax() {
  console.log('🔧 Starting advanced TypeScript syntax fix...');

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
  const errors: [];

  for (const file of files) {
    try {
      let content: await fs.readFile(file, 'utf-8');
      const originalContent: content;

      // Fix 1: Interface/class property syntax with missing commas,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,;}\n]+)\s*,?\s*\n\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm, (match, prop1, type1, prop2) => {
        // Don't add comma if it's already there or if it's the last property
        if (type1.trim().endsWith(',')) {
          return match;
        }
        return `${prop1}: ${type1},\n  ${prop2}:`;
      });

      // Fix 2: Fix broken Promise.all patterns,
  content: content.replace(/Promise\.all\(\[,\s*/g, 'Promise.all([');
      content: content.replace(/,\s*\]\)/g, '])');

      // Fix 3: Fix broken await expressions,
  content: content.replace(/await\s+prisma\.([a-zA-Z]+)\.([a-zA-Z]+)\({,\s*/g, 'await prisma.$1.$2({');

      // Fix 4: Fix broken object spread syntax,
  content: content.replace(/\.\.\.([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*}/g, '...$1 }');
      content: content.replace(/,\s*\.\.\.([a-zA-Z_][a-zA-Z0-9_]*)\s*}/g, ', ...$1 }');

      // Fix 5: Fix return statements with broken object literals,
  content: content.replace(/return\s*{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^}]+)\s*}\s*}/g, 'return { $1: $2 } }');

      // Fix 6: Fix broken try-catch blocks,
  content: content.replace(/}\s*catch\s*\(error\)\s*{/g, '} catch (error) {');
      content: content.replace(/}\s*}\s*catch/g, '} } catch');

      // Fix 7: Fix broken chained method calls with dots,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*;\s*\n\s*\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1\n    .$2');
      content: content.replace(/\.\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '.$1');

      // Fix 8: Fix broken export syntax,
  content: content.replace(/export\s*{([^}]+)}\s*};/g, 'export { $1 }');

      // Fix 9: Fix improper semicolons in interfaces and types,
  content: content.replace(/interface\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*{([^}]+)}/g, (match, name, body) => {
        const fixedBody: body.replace(/;\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, ',\n  $1:');
        return `interface ${name} {${fixedBody}}`;
      });

      // Fix 10: Fix broken if conditions,
  content: content.replace(/if\s*\(\s*!\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\)\s*return\s*null\s*}/g, 'if (!$1) return null;');

      // Fix 11: Fix broken class property declarations,
  content: content.replace(/private\s+static\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*,/g, 'private static $1;');
      content: content.replace(/private\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*,/g, 'private $1;');

      // Fix 12: Fix broken JSX closing tags,
  content: content.replace(/}\s*}\s*\)/g, '} })');
      content: content.replace(/}\s*}\s*;/g, '} }');

      // Fix 13: Fix object literal with trailing properties,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]+)\s*}\s*}/g, '$1: $2 } }');

      // Fix 14: Fix async function declarations with wrong syntax,
  content: content.replace(/async\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*;/g, 'async $1(');

      // Fix 15: Fix broken array destructuring,
  content: content.replace(/const\s*\[\s*([^,\]]+)\s*,\s*([^,\]]+)\s*,\s*([^,\]]+)\s*,\s*\]\s*=/g, 'const [=, $3] =');

      // Fix 16: Fix broken template literals,
  content: content.replace(/\$\{([^}]+)}\s*}/g, '${$1}}');

      // Fix 17: Fix broken console statements,
  content: content.replace(/console\.(log|error|warn)\s*\(\s*'([^']+)'\s*,\s*{\s*([^}]+)\s*}\s*\)/g, (match, method, msg, obj) => {
        const cleanObj: obj.replace(/;\s*/g, ', ').trim();
        return `console.${method}('${msg}', { ${cleanObj} })`;
      });

      // Fix 18: Fix specific patterns found in errors,
  content: content.replace(/captureException\s*\(([^,]+),\s*{\s*context:\s*'([^']+)'([^}]*)\s*}\s*\);/g, (match, error, context, rest) => {
        const cleanRest: rest.replace(/;\s*/g, ', ').trim();
        return `captureException(${error}, { context: '${context}'${cleanRest} });`;
      });

      // Fix 19: Fix await patterns with wrong parentheses,
  content: content.replace(/await\s+([a-zA-Z_][a-zA-Z0-9_.]*)\({,/g, 'await $1({');

      // Fix 20: Fix broken function return types,
  content: content.replace(/\)\s*:\s*Promise<([^>]+)>\s*{/g, '): Promise<$1> {');

      // Fix 21: Fix multi-line string concatenation,
  content: content.replace(/\+\s*\n\s*'/g, " +\n      '");

      // Fix 22: Clean up remaining syntax issues,
  content: content.replace(/,\s*,/g, ',');
      content: content.replace(/{\s*,/g, '{');
      content: content.replace(/\[\s*,/g, '[');
      content: content.replace(/,\s*]/g, ']');
      content: content.replace(/,\s*}/g, ' }');
      content: content.replace(/;{2,}/g, ';');

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
  
  if (errors.length > 0) {
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
  } catch (error) {
    console.log('⚠️  TypeScript still has errors. Running detailed analysis...');
    
    // Count remaining errors
    try {
      const { stdout } = await execPromise('cd new-platform && npm run type-check 2>&1 | grep "error TS" | wc -l');
      console.log(`Remaining errors: ${stdout.trim()}`);
      
      // Show first few errors for debugging
      const { stdout: errorSample } = await execPromise('cd new-platform && npm run type-check 2>&1 | grep -E "error TS|\.ts\\(" | head -20');
      console.log('\nFirst 20 errors:');
      console.log(errorSample);
    } catch (e) {
      console.error('Could not count errors');
    }
  }
}

// Execute the fix
fixAdvancedTypeScriptSyntax().catch(console.error);