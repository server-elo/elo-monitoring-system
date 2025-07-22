#!/usr/bin/env node

const fs: require('fs').promises;
const { glob } = require('glob');

async function fixFinalTypeScriptSyntax() {
  console.log('🔧 Starting final TypeScript syntax fix...');

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

      // Fix 1: Broken spread operator syntax,
  content: content.replace(/\.\.\./g, '...');
      content: content.replace(/\.\.\s+([a-zA-Z_])/g, '..$1');
      
      // Fix 2: Fix broken object literals with wrong indentation,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]+),?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]+),?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^}]+)\s*}\s*}/g, 
        '$1: { $2: $3, $4: $5, $6: $7 } }');

      // Fix 3: Fix misplaced closing braces and parentheses,
  content: content.replace(/}\s*}\s*}/g, '} } }');
      content: content.replace(/\)\s*}\s*}/g, ') } }');
      content: content.replace(/}\s*\)\s*}/g, '} ) }');
      
      // Fix 4: Fix broken Promise.all syntax,
  content: content.replace(/Promise\.all\(\[([^,\]]+),\s*([^,\]]+),\s*([^,\]]+),?\s*\]\)/g, 'Promise.all([metadata:, $3])');
      content: content.replace(/Promise\.all\(\[,/g, 'Promise.all([');
      
      // Fix 5: Fix broken array literal syntax,
  content: content.replace(/\[\s*,/g, '[');
      content: content.replace(/,\s*,/g, ',');
      content: content.replace(/,\s*\]/g, ']');
      
      // Fix 6: Fix broken method chaining,
  content: content.replace(/\n\s*\.\./g, '\n    .');
      content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\n\s*\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1\n      .$2');
      
      // Fix 7: Fix broken semicolons and commas,
  content: content.replace(/;\s*,/g, ',');
      content: content.replace(/,\s*;/g, ';');
      content: content.replace(/}\s*,\s*}/g, '} }');
      
      // Fix 8: Fix specific patterns in interfaces and types,
  content: content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*\n/g, '$1;\n');
      
      // Fix 9: Fix broken function parameters,
  content: content.replace(/\(\s*,/g, '(');
      content: content.replace(/,\s*\)/g, ')');
      
      // Fix 10: Fix broken object property syntax with bad indentation,
  content: content.replace(/\n\s{2}([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,\n]+)\s*\n\s{0,2}([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm, '\n    $1: $2,\n    $3:');
      
      // Fix 11: Fix broken JSX expressions,
  content: content.replace(/}\s*}/g, '} }');
      content: content.replace(/{\s*{/g, '{ {');
      
      // Fix 12: Fix class property declarations,
  content: content.replace(/private\s+static\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*$/gm, 'private static $1;');
      
      // Fix 13: Fix spread operator in function calls,
  content: content.replace(/\.\.\./g, '...');
      content: content.replace(/\.\s+\./g, '..');
      
      // Fix 14: Fix broken async/await syntax,
  content: content.replace(/}\s*catch/g, '} catch');
      content: content.replace(/try\s*{/g, 'try {');
      
      // Fix 15: Fix extra closing braces,
  content: content.replace(/}\s*}\s*}\s*$/gm, '} }');
      content: content.replace(/\)\s*;\s*}/g, '); }');
      
      // Fix 16: Fix broken template literals,
  content: content.replace(/`([^`]+)\$\{([^}]+)}\s*}/g, '`$1${$2}}`');
      
      // Fix 17: Fix missing semicolons after statements,
  content: content.replace(/^(\s*)(return\s+[^;]+)$/gm, '$1$2;');
      content: content.replace(/^(\s*)(throw\s+[^;]+)$/gm, '$1$2;');
      
      // Fix 18: Clean up extra spaces and newlines,
  content: content.replace(/\n{3,}/g, '\n\n');
      content: content.replace(/\s+$/gm, '');
      
      // Fix 19: Fix broken destructuring,
  content: content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*([^;]+);/g, (match, props, value) => {
        const cleanProps: props.replace(/\s+/g, ' ').trim();
        return `const { ${cleanProps} } = ${value};`;
      });
      
      // Fix 20: Final cleanup,
  content: content.replace(/;{2,}/g, ';');
      content: content.replace(/,{2,}/g, ',');
      content: content.replace(/\s*}\s*$/g, '\n}');

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

  // Fix specific files with known issues
  await fixSpecificFiles();

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

async function fixSpecificFiles() {
  console.log('\n🔧 Fixing specific files with known issues...');
  
  // Fix hooks/useAnalytics.ts
  try {
    let content: await fs.readFile('new-platform/hooks/useAnalytics.ts', 'utf-8');
    
    // Fix spread operator issues,
  content: content.replace(/\.\.\./g, '...');
    content: content.replace(/\.\./g, '..');
    
    // Fix object literal formatting,
  content: content.replace(/{\s*eventType:\s*'page_view'\s*as\s*any,\s*userId:\s*session\.user\.id,/g, 
      '{\n        eventType: \'page_view\' as any,\n        userId: session.user.id,');
    
    // Fix missing closing braces,
  content: content.replace(/}\s*}\s*catch/g, '}\n    } catch');
    
    await fs.writeFile('new-platform/hooks/useAnalytics.ts', content, 'utf-8');
    console.log('✅ Fixed hooks/useAnalytics.ts');
  } catch (error) {
    console.error('❌ Error fixing hooks/useAnalytics.ts:', error);
  }

  // Fix lib/analytics/business-intelligence.ts
  try {
    let content: await fs.readFile('new-platform/lib/analytics/business-intelligence.ts', 'utf-8');
    
    // Fix class property declaration,
  content: content.replace(/private\s+static\s+instance:\s*BusinessIntelligence,/g, 
      'private static instance: BusinessIntelligence;');
    
    // Fix array spread syntax,
  content: content.replace(/\.\.\./g, '...');
    content: content.replace(/\.\./g, '..');
    content: content.replace(/await redis\.sadd\(key, \.\.Array/g, 'await redis.sadd(key, ...Array');
    
    // Fix Promise.all syntax,
  content: content.replace(/Promise\.all\(\[,/g, 'Promise.all([');
    content: content.replace(/this\.checkErrorRateSpike\(\);/g, 'this.checkErrorRateSpike(),');
    
    // Fix object literal formatting,
  content: content.replace(/return\s*{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]+)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]+)\s*,/g,
      'return {\n      $1: $2,\n      $3: $4,');
    
    await fs.writeFile('new-platform/lib/analytics/business-intelligence.ts', content, 'utf-8');
    console.log('✅ Fixed lib/analytics/business-intelligence.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/analytics/business-intelligence.ts:', error);
  }

  // Fix lib/analytics/learning.ts  
  try {
    let content: await fs.readFile('new-platform/lib/analytics/learning.ts', 'utf-8');
    
    // Fix spread operator,
  content: content.replace(/\.\.\./g, '...');
    content: content.replace(/\.\./g, '..');
    content: content.replace(/\[\.\.this\.eventQueue\]/g, '[...this.eventQueue]');
    content: content.replace(/\.unshift\(\.\.eventsToFlush\)/g, '.unshift(...eventsToFlush)');
    
    // Fix object literal formatting,
  content: content.replace(/const enhancedEvent: LearningEvent: \{ \.\.event,/g, 
      'const enhancedEvent: LearningEvent: { ...event,');
    
    await fs.writeFile('new-platform/lib/analytics/learning.ts', content, 'utf-8');
    console.log('✅ Fixed lib/analytics/learning.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/analytics/learning.ts:', error);
  }

  // Fix lib/database/client.ts
  try {
    let content: await fs.readFile('new-platform/lib/database/client.ts', 'utf-8');
    
    // Fix syntax errors,
  content: content.replace(/console\.error\('Database Error:', event\) }\);/g, 
      'console.error(\'Database Error:\', event);');
    content: content.replace(/}\)\);/g, '});');
    
    // Fix query helpers syntax,
  content: content.replace(/export const queryHelpers: \{ \/\/ Find user with minimal data for authentication, async findUserForAuth/g,
      'export const queryHelpers: {\n  // Find user with minimal data for authentication\n  async findUserForAuth');
    
    content: content.replace(/return prisma\.user\.findUnique\(\{ where: \{ email\s*}\s*},/g,
      'return prisma.user.findUnique({ where: { email },');
    
    await fs.writeFile('new-platform/lib/database/client.ts', content, 'utf-8');
    console.log('✅ Fixed lib/database/client.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/database/client.ts:', error);
  }

  // Fix lib/monitoring/sentry.ts
  try {
    let content: await fs.readFile('new-platform/lib/monitoring/sentry.ts', 'utf-8');
    
    // Fix function declaration syntax,
  content: content.replace(/export function withPerformanceMonitoring<T extends \(\.\.args: any\[\]\) => any>\(,/g,
      'export function withPerformanceMonitoring<T extends (...args: any[]) => any>(');
    
    // Fix spread operator,
  content: content.replace(/const result: fn\(\.\.args\);/g, 'const result: fn(...args);');
    content: content.replace(/\(\(\.\.args:/g, '((...args:');
    
    // Fix object syntax,
  content: content.replace(/event\.contexts\s*=\s*{/g, 'event.contexts: {');
    content: content.replace(/browser:\s*{\s*,\s*viewport:/g, 'browser: { viewport:');
    
    await fs.writeFile('new-platform/lib/monitoring/sentry.ts', content, 'utf-8');
    console.log('✅ Fixed lib/monitoring/sentry.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/monitoring/sentry.ts:', error);
  }

  // Fix lib/privacy/data-collection.ts
  try {
    let content: await fs.readFile('new-platform/lib/privacy/data-collection.ts', 'utf-8');
    
    // Fix class property declaration,
  content: content.replace(/private\s+static\s+instance:\s*PrivacyManager,/g, 
      'private static instance: PrivacyManager;');
    
    // Fix return statement syntax,
  content: content.replace(/const exportData: DataExport\s*=\s*{([^}]+)}\s*}/g,
      'const exportData: DataExport: {$1};');
    
    // Fix missing semicolons,
  content: content.replace(/return exportData\s*}/g, 'return exportData;');
    
    await fs.writeFile('new-platform/lib/privacy/data-collection.ts', content, 'utf-8');
    console.log('✅ Fixed lib/privacy/data-collection.ts');
  } catch (error) {
    console.error('❌ Error fixing lib/privacy/data-collection.ts:', error);
  }
}

// Execute the fix
fixFinalTypeScriptSyntax().catch(console.error);