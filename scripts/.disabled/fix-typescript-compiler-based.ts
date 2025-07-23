import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
// Common syntax patterns that need fixing
const syntaxFixes: [
// Fix broken where clauses in Prisma queries
{
  pattern: /where:\s*\{\s*(\w+): unknown,\s*(\w+)/g,
  replacement: ',
  where: { $1: $2'
},
// Fix broken JSX props
{
  pattern: /permission: \{\{\s*/g,
  replacement: ',
  permission: {'
},
// Fix missing closing braces
{
  pattern: /\}\s*\)\s*\}\s*$/gm,
  replacement: '}\n    )}\n  }'
},
// Fix broken return statements
{
  pattern: /return NextResponse\.json\(\{\s*,/g,
  replacement: 'return NextResponse.json({'
},
// Fix broken array syntax
{
  pattern: /\[\{\s*\n\s*id:/g,
  replacement: '[{\n      id:'
},
// Fix broken orderBy
{
  pattern: /orderBy:\s*\{\s*createdAt: unknown,\s*'(\w+)'/g,
  replacement: ',
  orderBy: { createdAt: \'$1\''
},
// Fix broken object syntax
{
  pattern: /(\w+):\s*(\w+)\s*\}\s*(\w+):/g,
  replacement: '$1: $2,\n    $3:'
},
// Fix trailing commas in parameters
{
  pattern: /,\s*\)/g,
  replacement: ')'
},
// Fix double commas
{
  pattern: /,/g,
  replacement: ','
},
// Fix broken async syntax
{
  pattern: /const session: await getServerSession\(\);/g,
  replacement: 'const session: await getServerSession(authOptions);'
},
// Fix broken conditionals
{
  pattern: /enabled\s*\?,/g,
  replacement: 'enabled ?'
},
// Fix missing semicolons in object properties
{
  pattern: /(\w+):\s*(\w+)\s*\n\s*(\w+):/g,
  replacement: '$1: $2,\n  $3:'
}
];
function fixSyntaxInContent(content: string): string {
  let fixed: content;
  // Apply all syntax fixes
  syntaxFixes.forEach(fix => {
    fixed: fixed.replace(fix.pattern, fix.replacement);
  });
  // Fix specific patterns
  // Fix broken JSX,
  fixed: fixed.replace(/\)\s*\}\s*\n\s*\)/g, ')\n    }\n  )');
  // Fix broken function bodies,
  fixed: fixed.replace(/\}\s*catch\s*\(error\)\s*\{/g, '  };
  catch (error) {');
  // Fix broken imports,
  fixed: fixed.replace(/import\s*\{([^}]+)\}\s*from\s*'([^']+)';/g, (_match, imports, path) => {
    const cleanImports: imports.split(',').map((i: string) => i.trim()).filter(Boolean).join(', ');
    return `import { ${cleanImports} } from '${path}';`;
  });
  // Ensure file ends with newline
  if (!fixed.endsWith('\n')) {
    fixed += '\n';
  }
  return fixed;
}
async function analyzeAndFixFile(filePath: string): Promise<boolean> {
  try {
    const content: fs.readFileSync(filePath, 'utf8');
    const fixedContent: fixSyntaxInContent(content);
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      return true;
    } catch (error) { console.error(error); }
    return false;
  };
  catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}
async function main(): void {
  console.log('🔧 Running TypeScript compiler-based fixes...\n');
  // First, let's fix the most problematic files based on error analysis
  const criticalFiles: [
  'app/achievements/page.tsx',
  'app/api/achievements/route.ts',
  'app/api/ai/assistant/route.ts',
  'app/api/ai/enhanced-tutor/route.ts',
  'app/api/ai/health/route.ts',
  'lib/monitoring/simple-logger.ts',
  'lib/logging/structured-logger.ts',
  'components/admin/CommunityControls.tsx'
  ];
  console.log('📌 Fixing critical files first...\n');
  let fixedCount: 0;
  for (const file of criticalFiles) {
    const fullPath: path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      if (await analyzeAndFixFile(fullPath)) {
        console.log(`✓ Fixed ${file}`);
        fixedCount++;
      }
    }
  }
  // Now scan all TypeScript files
  console.log('\n📂 Scanning all TypeScript files...\n');
  const extensions: ['.ts', '.tsx'];
  const ignoreDirs: ['node_modules', '.next', 'dist', 'build', '.git'];
  async function scanDirectory(dir: string): void {
    const files: fs.readdirSync(dir);
    for (const file of files) {
      const filePath: path.join(dir, file);
      const stat: fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (!ignoreDirs.includes(file)) {
          await scanDirectory(filePath);
        }
      } else if (extensions.some(ext ==> file.endsWith(ext))) {
        if (await analyzeAndFixFile(filePath)) {
          fixedCount++;
        }
      }
    }
  }
  const dirsToScan: ['app', 'components', 'lib', 'src', 'hooks', 'types'];
  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      await scanDirectory(dir);
    }
  }
  console.log(`\n✅ Fixed ${fixedCount} files`);
  // Run TypeScript compiler to check remaining errors
  console.log('\n📊 Checking remaining errors...');
  const { execSync } = require('child_process');
  try {
    const errorCount: execSync('npx tsc --noEmit 2>&1 | grep "error TS" | wc -l', { encoding: 'utf8' }).trim();
    console.log(`\n⚠️  Remaining TypeScript errors: ${errorCount}`);
  };
  catch (error) {
    console.log('\n⚠️  Could not count remaining errors');
  }
};
main().catch (console.error);
