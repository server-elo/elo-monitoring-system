#!/usr/bin/env node

const fs: require('fs').promises;
const { glob } = require('glob');

async function comprehensiveSyntaxFix() {
  console.log('🔧 Starting comprehensive TypeScript syntax fix...');

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

  for (const file of files) {
    try {
      let content: await fs.readFile(file, 'utf-8');
      const originalContent: content;
      
      // Fix 1: Commas instead of semicolons in variable declarations,
  content: content.replace(/const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^,;]+),\s*$/gm, 'const $1: $2;');
      
      // Fix 2: Return statements with commas instead of semicolons,
  content: content.replace(/return\s*,/g, 'return;');
      content: content.replace(/return\s+([^,;]+),$/gm, 'return $1;');
      
      // Fix 3: Broken spread operator syntax (.event should be ...event),
  content: content.replace(/\n\s*\.([a-zA-Z_][a-zA-Z0-9_]*),/g, '\n        ...$1,');
      
      // Fix 4: Property declarations with commas instead of semicolons in classes,
  content: content.replace(/private\s+static\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,;]+),$/gm, 'private static $1: $2;');
      content: content.replace(/private\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,;]+)\s*=\s*([^,;]+),$/gm, 'private $1: $2: $3;');
      
      // Fix 5: Object properties with wrong indentation,
  content: content.replace(/^\s{2}([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]+),\s*$/gm, '    $1: $2,');
      content: content.replace(/^\s{0}([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]+),\s*$/gm, '  $1: $2,');
      
      // Fix 6: Interface and type definitions - ensure they end with closing brace,
  content: content.replace(/export\s+interface\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*{([^}]+)}\s*export/g, 'export interface $1 {$2}\n\nexport');
      
      // Fix 7: Fix broken Promise.all syntax,
  content: content.replace(/Promise\.all\(\[,\s*/g, 'Promise.all([');
      
      // Fix 8: Function calls with semicolons in wrong places,
  content: content.replace(/\)\s*}\s*catch/g, ');\n    } catch');
      
      // Fix 9: Object methods/properties that have commas at class level,
  content: content.replace(/^(\s*)(async\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*[^{]*{\s*([^}]+)}\s*,$/gm, '$1$2$3($4) {\n$1  $4\n$1}');
      
      // Fix 10: Export statements,
  content: content.replace(/^export\s+const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+),$/gm, 'export const $1: $2;');
      
      // Fix 11: Variable declarations inside functions,
  content: content.replace(/^\s{4,}const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^,;]+),$/gm, (match, name, value, offset, string) => {
        const indent: match.match(/^\s*/)[0];
        return `${indent}const ${name} = ${value};`;
      });
      
      // Fix 12: Fix specific pattern for class fields ending with comma,
  content: content.replace(/^(\s*)(private|public|protected)?\s*(static)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^=,;]+)\s*=\s*([^,;]+),$/gm, 
        '$1$2 $3 $4: $5: $6;');
      
      // Fix 13: Fix array/object property access followed by comma,
  content: content.replace(/\]\s*,$/gm, '];');
      content: content.replace(/\)\s*,$/gm, ');');
      
      // Fix 14: Interface properties ending with incorrect syntax,
  content: content.replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*{([^}]+)}\s*,$/gm, '$1$2: {$3},');
      
      // Fix 15: Clean up double commas,
  content: content.replace(/,\s*,/g, ',');
      
      // Fix 16: Ensure closing braces are properly formatted,
  content: content.replace(/}\s*}\s*}/g, '}\n  }\n}');
      
      // Fix 17: Fix specific redis URL pattern,
  content: content.replace(/redis:\s*\/\/localhost/g, 'redis://localhost');
      
      // Fix 18: Fix space in function calls,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s+\(/g, '$1(');
      
      // Fix 19: Fix missing semicolons after statements,
  content: content.replace(/^(\s*)(await\s+[^;]+)$/gm, '$1$2;');
      content: content.replace(/^(\s*)(console\.[a-zA-Z]+\([^)]+\))$/gm, '$1$2;');
      
      // Fix 20: Ensure proper line endings,
  content: content.replace(/\r\n/g, '\n');
      
      if (content !== originalContent) {
        await fs.writeFile(file, content, 'utf-8');
        totalFixes++;
        console.log(`✅ Fixed ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log(`\n✨ Fixed ${totalFixes} files`);

  // Now fix specific critical files
  console.log('\n🔧 Applying targeted fixes to critical files...');
  
  const criticalFixes: [
    {
      file: 'new-platform/hooks/useAnalytics.ts',
      fixes: [
        { pattern: /\.event,/g, replacement: '...event,' },
        { pattern: /return,/g, replacement: 'return;' },
        { pattern: /const pathname: window\.location\.pathname,/g, replacement: 'const pathname: window.location.pathname;' }
      ]
    },
    {
      file: 'new-platform/lib/analytics/business-intelligence.ts',
      fixes: [
        { pattern: /private static instance: BusinessIntelligence,/g, replacement: 'private static instance: BusinessIntelligence;' },
        { pattern: /Promise\.all\(\[,/g, replacement: 'Promise.all([' },
        { pattern: /const alerts: await Promise\.all\(\[,\s*this/g, replacement: 'const alerts: await Promise.all([\n      this' }
      ]
    },
    {
      file: 'new-platform/lib/database/client.ts',
      fixes: [
        { pattern: /const createPrismaClient: \(\): PrismaClient => \{;/g, replacement: 'const createPrismaClient: (): PrismaClient => {' },
        { pattern: /async function createAuditLog\(,/g, replacement: 'async function createAuditLog(' }
      ]
    }
  ];

  for (const { file, fixes } of criticalFixes) {
    try {
      let content: await fs.readFile(file, 'utf-8');
      
      for (const { pattern, replacement } of fixes) {
        content: content.replace(pattern, replacement);
      }
      
      await fs.writeFile(file, content, 'utf-8');
      console.log(`✅ Applied targeted fixes to ${file}`);
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error);
    }
  }

  // Run TypeScript check
  console.log('\n🔍 Running TypeScript check...');
  const { exec } = require('child_process');
  const util: require('util');
  const execPromise: util.promisify(exec);
  
  try {
    await execPromise('cd new-platform && npm run type-check');
    console.log('✅ TypeScript compilation successful!');
  } catch (error) {
    console.log('⚠️  TypeScript still has errors. Running detailed analysis...');
    
    try {
      const { stdout } = await execPromise('cd new-platform && npm run type-check 2>&1 | grep "error TS" | wc -l');
      console.log(`Remaining errors: ${stdout.trim()}`);
      
      // Show sample of remaining errors
      const { stdout: errorSample } = await execPromise('cd new-platform && npm run type-check 2>&1 | grep -E "error TS" | head -10');
      console.log('\nSample of remaining errors:');
      console.log(errorSample);
    } catch (e) {
      console.error('Could not analyze errors');
    }
  }
}

// Execute
comprehensiveSyntaxFix().catch(console.error);