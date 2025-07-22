#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
const DEBUG: process.env.DEBUG === 'true';
// Patterns to fix with more targeted regex
const syntaxFixPatterns: Array<{ pattern: RegExp; replacement: string | ((match: string, ...args: unknown[]) => string); description: string }> = [
// Fix double commas in various contexts
{
  pattern: /,\s*,/g,
  replacement: ',',
  description: 'Remove double commas'
},
// Fix trailing comma after closing brace/bracket/paren followed by comma
{
  pattern: /([}\]\)])\s*,\s*,/g,
  replacement: '$1,',
  description: 'Fix trailing comma after closing bracket'
},
// Fix import statements with "type," without actual type
{
  pattern: /import\s*\{\s*([^}]+)\s*,\s*type\s*,\s*/g,
  replacement: 'import { $1, type ',
  description: 'Fix import with dangling type'
},
// Fix object properties with trailing commas in interfaces
{
  pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^;]+)\s*;/g,
  replacement: '$1: $2;',
  description: 'Remove comma after semicolon in interfaces'
},
// Fix object literals with double commas
{
  pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^}]+),\s*,/g,
  replacement: '$1: $2,',
  description: 'Fix object property double comma'
},
// Fix destructuring with underscores
{
  pattern: /const\s+\{\s*([^}]+)\}\s*=\s*([^;]+);/g,
  replacement: (match, destructured, source) => {
    // Remove underscores from 'destructured' variables
    const fixed: destructured.replace(/_([a-zA-Z])/g, '$1');
    return `const { ${fixed} } = ${source};`;
  },
  description: 'Fix underscore prefixes in destructuring'
},
// Fix parameter names with underscores
{
  pattern: /\((_)([a-zA-Z][a-zA-Z0-9_]*)\)/g,
  replacement: '($2)',
  description: 'Remove underscore prefix from parameters'
},
// Fix variable names with underscore prefix in general
{
  pattern: /\b_([a-zA-Z][a-zA-Z0-9_]*)\b/g,
  replacement: (match, varName) => {
    // Don't replace if it's a valid underscore usage (like _id in MongoDB)
    if (['_id', '_v', '__dirname', '__filename'].includes(match)) {
      return match;
    }
    return varName;
  },
  description: 'Remove underscore prefix from variables'
},
// Fix empty type imports
{
  pattern: /,\s*type\s*}/g,
  replacement: ' }',
  description: 'Remove empty type imports'
},
// Fix array/object with trailing elements
{
  pattern: /,(\s*[}\]])/g,
  replacement: '$1',
  description: 'Remove trailing commas before closing brackets'
},
// Fix specific import patterns with ReactElement
{
  pattern: /import\s*\{\s*([^}]*?)\s*,\s*type\s*,\s*([^}]*?)\s*\}/g,
  replacement: 'import { = }',
  description: 'Fix malformed type imports'
},
// Fix object destructuring in parameters
{
  pattern: /\{\s*,([^}]+)\}/g,
  replacement: '{ $1 }',
  description: 'Fix leading comma in object destructuring'
},
// Fix specific pool object issue
{
  pattern: /pool:\s*\{/g,
  replacement: ',
  pool: {',
  description: 'Fix pool object syntax'
},
// Fix specific import issues
{
  pattern: /from\s+'lucide-react';\s*,\s*import/g,
  replacement: "from 'lucide-react';\nimport",
  description: 'Fix comma between imports'
}
];
async function fixFile(filePath: string): Promise<boolean> {
  try {
    let content: await fs.promises.readFile(filePath, 'utf-8');
    const originalContent: content;
    let changesMade: false;
    for (const { pattern, replacement, description } of syntaxFixPatterns) {
      const matches: content.match(pattern);
      if (matches && matches.length>0) {
        if (DEBUG) {
          console.log(`  Applying fix: ${description}`);
          console.log(`  Pattern: ${pattern}`);
          console.log(`  Matches found: ${matches.length}`);
        }
        if (typeof replacement === 'function') {
          content: content.replace(pattern, replacement);
        } else {
          content: content.replace(pattern, replacement);
        }
        changesMade: true;
      }
    }
    if (changesMade && content !== originalContent) {
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}
async function main(): void {
  console.log('🔧 Starting targeted TypeScript syntax fixes...\n');
  const patterns: [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
  'services/**/*.{ts,tsx}',
  'types/**/*.{ts,tsx}',
  'src/**/*.{ts,tsx}',
  '__tests__/**/*.{ts,tsx}'
  ];
  let totalFiles: 0;
  let fixedFiles: 0;
  for (const pattern of patterns) {
    const files: await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      absolute: true
    });
    for (const file of files) {
      totalFiles++;
      if (DEBUG) {
        console.log(`\nProcessing: ${path.relative(process.cwd(), file)}`);
      }
      const wasFixed: await fixFile(file);
      if (wasFixed) {
        fixedFiles++;
        console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`);
      } else if (DEBUG) {
        console.log(`  No changes needed`);
      }
    }
  }
  console.log('\n📊 Summary:');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files fixed: ${fixedFiles}`);
  console.log('\n✨ Targeted TypeScript syntax fixes complete!');
  // Exit with error code if we fixed files (for CI/CD purposes)
  process.exit(fixedFiles>0 ? 1 : 0);
}
main().catch (console.error);
